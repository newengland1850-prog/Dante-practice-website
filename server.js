// Local server for the site. No packages needed — run with:  node server.js
//
// It serves the website at http://localhost:8080 and adds a small API the
// Worldwide National Movement tab needs (browsers can't fetch these sites directly):
//   GET  /api/health            → { ok: true }
//   GET  /api/feed?id=<source>  → parsed articles from one source in news-sources.js
//   GET  /api/stocks            → prices for the 25 stocks in news-sources.js
//   POST /api/translate         → { texts: [...], from: "fr" | "auto" } → { translations: [...] }
//   GET  /api/image?url=<page>  → the article's preview picture (og:image), for listed sites only
//
// Settings (environment variables): PORT (default 8080), HOST (default 127.0.0.1;
// use 0.0.0.0 to open the site from a phone on the same Wi-Fi).

const http = require("http");
const fs = require("fs");
const path = require("path");
const { NEWS_SOURCES, NEWS_STOCKS } = require("./news-sources.js");

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || "127.0.0.1";
const ROOT = __dirname;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0 Safari/537.36";
// Some sites only hand their RSS feed to software that says it is a feed reader.
const FEED_UA = "Mozilla/5.0 (compatible; StacksNewsReader/1.0)";

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".md": "text/plain; charset=utf-8",
};

// ---- Small helpers ----

const cache = new Map(); // key → { at, ttl, value }
async function cached(key, ttlMs, make) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < hit.ttl) return hit.value;
  const value = await make();
  cache.set(key, { at: Date.now(), ttl: ttlMs, value });
  return value;
}

async function fetchText(url, maxBytes = 3_000_000, userAgent = UA) {
  const res = await fetch(url, {
    headers: { "User-Agent": userAgent, "Accept-Language": "en,fr;q=0.8,de;q=0.7,pl;q=0.6" },
    redirect: "follow",
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer()).subarray(0, maxBytes);
  // Respect the declared character set (most feeds are UTF-8).
  const declared = (res.headers.get("content-type") || "").match(/charset=([\w-]+)/i)?.[1]
    || buf.subarray(0, 200).toString("latin1").match(/encoding=["']([\w-]+)/i)?.[1] || "utf-8";
  try { return new TextDecoder(declared).decode(buf); } catch { return buf.toString("utf8"); }
}

function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&(quot|apos|lt|gt|nbsp|amp);/g, (_, e) => ({ quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", amp: "&" })[e]);
}

const stripCdata = s => s.replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1");
const stripTags = s => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? stripCdata(m[1]) : "";
}
function attr(xml, name, attribute) {
  const m = xml.match(new RegExp(`<${name}\\s[^>]*${attribute}=["']([^"']+)["']`, "i"));
  return m ? decodeEntities(m[1]) : "";
}

// Feed dates sometimes use zone names JavaScript can't read ("CEST"); swap in offsets.
const ZONES = { CEST: "+0200", CET: "+0100", BST: "+0100", EEST: "+0300", EET: "+0200", EDT: "-0400", EST: "-0500", CDT: "-0500", CST: "-0600", PDT: "-0700", PST: "-0800" };
function isoDate(s) {
  const d = new Date((s || "").trim().replace(/\b(CEST|CET|BST|EEST|EET|EDT|EST|CDT|CST|PDT|PST)\b/, z => ZONES[z]));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// Minimal feed parser (RSS items or Atom entries): title, link, date, summary, categories and picture.
function parseRss(xml, source) {
  const items = [];
  for (const m of xml.matchAll(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi)) {
    const it = m[0];
    const title = stripTags(decodeEntities(tag(it, "title")));
    let link = decodeEntities(stripTags(tag(it, "link"))) || attr(it, "link", "href") || stripTags(tag(it, "guid"));
    if (!title || !/^https?:\/\//.test(link)) continue;
    const description = decodeEntities(tag(it, "description") || tag(it, "summary"));
    const content = decodeEntities(tag(it, "content:encoded") || tag(it, "content"));
    const image =
      attr(it, "media:content", "url") ||
      attr(it, "media:thumbnail", "url") ||
      (/image/i.test(attr(it, "enclosure", "type") || "image") ? attr(it, "enclosure", "url") : "") ||
      (content.match(/<img[^>]+src=["']([^"']+)["']/i) || description.match(/<img[^>]+src=["']([^"']+)["']/i) || [])[1] || "";
    const categories = [...it.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)].map(c => stripTags(decodeEntities(stripCdata(c[1])))).filter(Boolean);
    const date = tag(it, "pubDate") || tag(it, "dc:date") || tag(it, "published") || tag(it, "updated");
    items.push({
      source: source.id,
      title,
      link,
      summary: stripTags(description || content).slice(0, 320),
      image: image ? decodeEntities(image) : "",
      categories: categories.slice(0, 6),
      date: isoDate(date),
    });
  }
  return items.slice(0, 40);
}

function send(res, status, body, type = "application/json; charset=utf-8", extra = {}) {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store", ...extra });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function readJson(req, limit = 200_000) {
  let data = "";
  for await (const chunk of req) {
    data += chunk;
    if (data.length > limit) throw new Error("too large");
  }
  return JSON.parse(data || "{}");
}

// Run tasks with at most `n` going at once.
async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}

// ---- API ----

async function apiFeed(id) {
  const source = NEWS_SOURCES.find(s => s.id === id);
  if (!source) return [404, { error: "unknown source" }];
  const items = await cached(`feed:${id}`, 5 * 60_000, async () => parseRss(await fetchText(source.feed, 3_000_000, FEED_UA), source));
  return [200, { source: id, items }];
}

async function apiStocks() {
  const quotes = await cached("stocks", 60_000, () => pool(NEWS_STOCKS, 5, async symbol => {
    try {
      const data = JSON.parse(await fetchText(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`));
      const m = data.chart.result[0].meta;
      const prev = m.chartPreviousClose ?? m.previousClose;
      return {
        symbol: symbol.replace("-", "."),
        name: m.shortName || m.longName || symbol,
        price: m.regularMarketPrice,
        change: m.regularMarketPrice - prev,
        changePct: ((m.regularMarketPrice - prev) / prev) * 100,
        currency: m.currency,
        time: m.regularMarketTime ? new Date(m.regularMarketTime * 1000).toISOString() : null,
      };
    } catch {
      return { symbol: symbol.replace("-", "."), name: symbol, price: null };
    }
  }));
  return [200, { quotes }];
}

// Translation to English through Google Translate's public web endpoint (the one its
// website widget uses). Results are cached so each headline is translated once.
async function translateOne(text, from) {
  const key = `tr:${from}:${text}`;
  return cached(key, 24 * 3600_000, async () => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&tl=en&sl=${encodeURIComponent(from || "auto")}&q=${encodeURIComponent(text)}`;
    const data = JSON.parse(await fetchText(url));
    return { text: (data[0] || []).map(seg => seg[0]).join(""), detected: data[2] || from };
  });
}

async function apiTranslate(body) {
  const texts = (Array.isArray(body.texts) ? body.texts : []).slice(0, 60).map(t => String(t).slice(0, 2000));
  const from = /^[a-z]{2,3}$|^auto$/.test(body.from || "") ? body.from : "auto";
  // Two at a time, with one retry: Google turns away bursts of requests.
  const results = await pool(texts, 2, async t => {
    if (!t.trim()) return { text: t, detected: from };
    for (let attempt = 0; attempt < 2; attempt++) {
      try { return await translateOne(t, from); } catch { await new Promise(r => setTimeout(r, 700)); }
    }
    return { text: null, detected: from };
  });
  return [200, { translations: results.map(r => r.text), detected: results.map(r => r.detected) }];
}

// Some feeds don't include a picture; fetch the article page and read its preview image.
const allowedHosts = new Set(NEWS_SOURCES.map(s => new URL(s.feed).hostname.replace(/^www\.|^feeds\.|^moxie\./, "")));
async function apiImage(pageUrl) {
  let u;
  try { u = new URL(pageUrl); } catch { return [400, { error: "bad url" }]; }
  const host = u.hostname.replace(/^www\./, "");
  const allowed = [...allowedHosts].some(h => host === h || host.endsWith("." + h)) || /breitbart\.com$|foxnews\.com$/.test(host);
  if (!allowed || !/^https?:$/.test(u.protocol)) return [403, { error: "not a listed news site" }];
  const image = await cached(`img:${pageUrl}`, 6 * 3600_000, async () => {
    try {
      const html = await fetchText(pageUrl, 400_000);
      const m = html.match(/<meta[^>]+property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
        || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
      return m ? new URL(decodeEntities(m[1]), pageUrl).href : "";
    } catch { return ""; }
  });
  return [200, { image }];
}

// ---- Static files ----

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = path.normalize(path.join(ROOT, urlPath === "/" ? "index.html" : urlPath));
  if (!file.startsWith(ROOT) || path.basename(file).startsWith(".") || file.includes(`${path.sep}.git`)) return send(res, 403, "Forbidden", "text/plain");
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, "Not found", "text/plain");
    res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-cache" });
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  // Let a mobile app (or another local origin) call the API.
  const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type" };
  if (!url.pathname.startsWith("/api/")) return serveStatic(req, res);
  if (req.method === "OPTIONS") return send(res, 204, "", "text/plain", { ...cors, "Access-Control-Allow-Methods": "GET, POST" });
  try {
    let result;
    if (url.pathname === "/api/health") result = [200, { ok: true }];
    else if (url.pathname === "/api/feed") result = await apiFeed(url.searchParams.get("id"));
    else if (url.pathname === "/api/stocks") result = await apiStocks();
    else if (url.pathname === "/api/translate" && req.method === "POST") result = await apiTranslate(await readJson(req));
    else if (url.pathname === "/api/image") result = await apiImage(url.searchParams.get("url") || "");
    else result = [404, { error: "not found" }];
    send(res, result[0], result[1], undefined, cors);
  } catch (err) {
    send(res, 502, { error: err.message }, undefined, cors);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Stacks is running at http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}/`);
  console.log("Worldwide National Movement: " + `http://localhost:${PORT}/#/news`);
  console.log("Press Ctrl+C to stop.");
});
