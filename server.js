// Local server for the site. No packages needed — run with:  node server.js
//
// It serves the website at http://localhost:8080 and adds a small API the
// Worldwide National Movement tab needs (browsers can't fetch these sites directly):
//   GET  /api/health            → { ok: true }
//   GET  /api/feed?id=<source>  → parsed articles from one source in news-sources.js (either news tab)
//   GET  /api/article?url=<page> → an article's text, from listed sites only, for the US News bias check
//   GET  /api/access?url=<page>  → whether an article needs a subscription (from the page's paywall markers)
//   GET  /api/stocks            → prices for the 25 stocks in news-sources.js
//   GET  /api/history?symbol=&range=1d|5d|1mo → price history for one of those stocks
//   GET  /api/live?list=us|world → which of a news tab's YouTube channels are live now
//   POST /api/translate         → { texts: [...], from: "fr" | "auto" } → { translations: [...] }
//   GET  /api/image?url=<page>  → the article's preview picture (og:image), for listed sites only
//   GET  /api/roads?lat=&lon=   → main roads around a US city, for the Traffic tab
//   GET  /api/shops?lat=&lon=   → local (non-chain) stores near a US spot, for the Traffic tab
//
// Settings (environment variables): PORT (default 8080), HOST (default 127.0.0.1;
// use 0.0.0.0 to open the site from a phone on the same Wi-Fi).

const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { NEWS_SOURCES, NEWS_STOCKS, US_NEWS_SOURCES, NEWS_LIVE, US_NEWS_LIVE } = require("./news-sources.js");
const ALL_SOURCES = [...NEWS_SOURCES, ...US_NEWS_SOURCES];
const { TR_CITIES, trInUS, trRoadsQuery, trCompactRoads, trShopsQuery, trCompactShops } = require("./traffic-data.js");

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

// Some feeds encode twice ("&amp;quot;"), so decode a second time when entities remain.
function decodeEntities(s) {
  const once = decodeEntitiesOnce(s);
  return /&(?:#\d+|#x[0-9a-f]+|quot|apos|lt|gt|nbsp|amp);/i.test(once) ? decodeEntitiesOnce(once) : once;
}
function decodeEntitiesOnce(s) {
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

// Google News sitemaps (<url> with <news:title>): link, title, date, picture and keywords.
function parseSitemap(xml, source) {
  const items = [];
  for (const m of xml.matchAll(/<url>[\s\S]*?<\/url>/gi)) {
    const u = m[0];
    const title = stripTags(decodeEntities(tag(u, "news:title")));
    const link = decodeEntities(tag(u, "loc").trim());
    if (!title || !/^https?:\/\//.test(link) || /\/(video|videos|watch|live-news)\//.test(link)) continue;
    items.push({
      source: source.id,
      title,
      link,
      summary: "",
      image: decodeEntities(tag(u, "image:loc").trim()),
      categories: stripTags(decodeEntities(tag(u, "news:keywords"))).split(/\s*,\s*/).filter(Boolean).slice(0, 6),
      date: isoDate(tag(u, "news:publication_date")),
    });
  }
  return items.sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 50);
}

// Google News search results: drop the " - Outlet" ending and the summary (it only repeats the link).
function parseGoogleNews(xml, source) {
  return parseRss(xml, source).map(it => ({ ...it, title: it.title.replace(/\s+-\s+[^-]+$/, ""), summary: "" })).slice(0, 40);
}

function parseFeed(xml, source) {
  if (source.format === "sitemap") return parseSitemap(xml, source);
  if (source.format === "google") return parseGoogleNews(xml, source);
  return parseRss(xml, source).slice(0, 60);
}

// ---- API ----

async function apiFeed(id) {
  const source = ALL_SOURCES.find(s => s.id === id);
  if (!source) return [404, { error: "unknown source" }];
  const items = await cached(`feed:${id}`, 5 * 60_000, async () => parseFeed(await fetchText(source.feed, 6_000_000, FEED_UA), source));
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

// Price history for one of the ticker's stocks: the last trading day (every 5 minutes),
// the past week (every 30 minutes) or the past month (daily closes).
const HISTORY_RANGES = { "1d": { interval: "5m", ttl: 2 * 60_000 }, "5d": { interval: "30m", ttl: 5 * 60_000 }, "1mo": { interval: "1d", ttl: 15 * 60_000 } };
async function apiHistory(symbol, range = "1mo") {
  const yahoo = String(symbol || "").replace(".", "-");
  if (!NEWS_STOCKS.includes(yahoo)) return [404, { error: "not one of the listed stocks" }];
  const r0 = HISTORY_RANGES[range];
  if (!r0) return [400, { error: "range must be 1d, 5d or 1mo" }];
  const history = await cached(`hist:${yahoo}:${range}`, r0.ttl, async () => {
    const data = JSON.parse(await fetchText(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahoo)}?range=${range}&interval=${r0.interval}`));
    const r = data.chart.result[0];
    const closes = r.indicators.quote[0].close;
    return {
      symbol: yahoo.replace("-", "."),
      name: r.meta.longName || r.meta.shortName || yahoo,
      currency: r.meta.currency,
      range,
      previousClose: r.meta.chartPreviousClose ?? r.meta.previousClose ?? null,
      // Regular trading hours of each day shown (open and close), for the day and week charts.
      sessions: Array.isArray(r.meta.tradingPeriods)
        ? r.meta.tradingPeriods.flat().map(p => ({ open: new Date(p.start * 1000).toISOString(), close: new Date(p.end * 1000).toISOString() }))
        : [],
      points: r.timestamp
        .map((t, i) => ({ date: new Date(t * 1000).toISOString(), close: closes[i] }))
        .filter(p => p.close != null),
    };
  });
  return [200, history];
}

// Which of a news tab's YouTube channels are live right now, and the video to embed.
// YouTube's /@channel/live page points at the channel's current live stream.
async function liveVideo(handle) {
  return cached(`live:${handle}`, 5 * 60_000, async () => {
    try {
      const res = await fetch(`https://www.youtube.com/@${encodeURIComponent(handle)}/live`, {
        headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9", Cookie: "CONSENT=YES+1; SOCS=CAI" },
        signal: AbortSignal.timeout(12000),
      });
      const html = await res.text();
      const id = (html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})"/) || [])[1];
      const live = /"isLiveNow":true/.test(html);
      const embeddable = !/"playableInEmbed":false/.test(html);
      const title = decodeEntities((html.match(/<meta name="title" content="([^"]*)"/) || [])[1] || "");
      return id && live && embeddable ? { videoId: id, title } : null;
    } catch {
      return null;
    }
  });
}

async function apiLive(list) {
  const channels = list === "us" ? US_NEWS_LIVE : list === "world" ? NEWS_LIVE : null;
  if (!channels) return [400, { error: "list must be us or world" }];
  const found = await pool(channels, 4, async c => {
    const v = await liveVideo(c.handle);
    return v && { ...c, ...v };
  });
  return [200, { live: found.filter(Boolean) }];
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
const allowedHosts = new Set([
  ...NEWS_SOURCES.map(s => s.site || new URL(s.feed).hostname.replace(/^www\.|^feeds\.|^moxie\./, "")),
  ...US_NEWS_SOURCES.map(s => s.site),
]);
function isListedSite(u) {
  const host = u.hostname.replace(/^www\./, "");
  const allowed = [...allowedHosts].some(h => host === h || host.endsWith("." + h)) || /breitbart\.com$|foxnews\.com$/.test(host);
  return allowed && /^https?:$/.test(u.protocol);
}
async function apiImage(pageUrl) {
  let u;
  try { u = new URL(pageUrl); } catch { return [400, { error: "bad url" }]; }
  if (!isListedSite(u)) return [403, { error: "not a listed news site" }];
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

// The readable text of an article (its paragraphs), for the US News bias check.
async function apiArticle(pageUrl) {
  let u;
  try { u = new URL(pageUrl); } catch { return [400, { error: "bad url" }]; }
  if (!isListedSite(u)) return [403, { error: "not a listed news site" }];
  const text = await cached(`art:${pageUrl}`, 6 * 3600_000, async () => {
    const html = await fetchText(pageUrl, 3_000_000);
    const body = (html.match(/<article[\s\S]*<\/article>/i) || [html])[0]
      .replace(/<(script|style|noscript|figure|figcaption|aside|nav|footer|form)[\s\S]*?<\/\1>/gi, " ");
    return [...body.matchAll(/<p[\s>][\s\S]*?<\/p>/gi)]
      .map(p => stripTags(decodeEntities(p[0])))
      .filter(p => p.length > 60 && !/^(advertisement|sign up|subscribe|copyright|©)/i.test(p))
      .join("\n")
      .slice(0, 40000);
  });
  return [200, { text, words: text ? text.split(/\s+/).length : 0 }];
}

// Whether an article needs a subscription, from the markers publishers add for search
// engines: "isAccessibleForFree" (schema.org) and the "article:content_tier" meta tag.
// free: true / false, or null when the page has no marker or can't be read.
async function apiAccess(pageUrl) {
  let u;
  try { u = new URL(pageUrl); } catch { return [400, { error: "bad url" }]; }
  if (!isListedSite(u)) return [403, { error: "not a listed news site" }];
  const access = await cached(`access:${pageUrl}`, 6 * 3600_000, async () => {
    try {
      const html = await fetchText(pageUrl, 1_500_000);
      const flag = (html.match(/"isAccessibleForFree"\s*:\s*"?(true|false)"?/i) || [])[1];
      const tier = (html.match(/(?:name|property)=["']article:content_tier["'][^>]*content=["']([^"']+)/i)
        || html.match(/content=["']([^"']+)["'][^>]*(?:name|property)=["']article:content_tier["']/i) || [])[1];
      const free = tier === "locked" ? false : flag ? flag.toLowerCase() === "true" : tier === "free" ? true : null;
      return { free, tier: tier || "" };
    } catch {
      return { free: null, tier: "" };
    }
  });
  return [200, access];
}

// ---- Traffic: OpenStreetMap roads and stores ----
// Overpass can take half a minute, so answers are also kept on disk between runs.

const OVERPASS = "https://overpass-api.de/api/interpreter";
const DISK_CACHE = path.join(os.tmpdir(), "all-points-towards-progress");
const inflight = new Map();

async function overpass(query) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(OVERPASS, {
      method: "POST",
      headers: { "User-Agent": "AllPointsTowardsProgress/1.0 (local practice site)", "Content-Type": "application/x-www-form-urlencoded" },
      body: "data=" + encodeURIComponent(query),
      signal: AbortSignal.timeout(150000),
    });
    if (res.ok) return res.json();
    if (attempt >= 2 || ![429, 502, 503, 504].includes(res.status)) throw new Error(`Overpass HTTP ${res.status}`);
    await new Promise(r => setTimeout(r, 4000 * (attempt + 1)));
  }
}

// Memory, then disk, then the network; one request at a time per key.
function diskCached(key, ttlMs, make) {
  const file = path.join(DISK_CACHE, key.replace(/[^\w.-]/g, "_") + ".json");
  return cached(key, ttlMs, () => {
    if (inflight.has(key)) return inflight.get(key);
    const job = (async () => {
      try {
        const st = fs.statSync(file);
        if (Date.now() - st.mtimeMs < ttlMs) return JSON.parse(fs.readFileSync(file, "utf8"));
      } catch {}
      const value = await make();
      fs.mkdirSync(DISK_CACHE, { recursive: true });
      fs.writeFileSync(file, JSON.stringify(value));
      return value;
    })().finally(() => inflight.delete(key));
    inflight.set(key, job);
    return job;
  });
}

function latLon(url) {
  const lat = Number(url.searchParams.get("lat")), lon = Number(url.searchParams.get("lon"));
  return Number.isFinite(lat) && Number.isFinite(lon) && trInUS(lat, lon) ? [lat, lon] : null;
}

async function apiRoads(url) {
  const p = latLon(url);
  if (!p) return [400, { error: "traffic is available for US places only" }];
  const [lat, lon] = p.map(v => Math.round(v * 50) / 50); // snap to ~2 km so nearby requests share
  const roads = await diskCached(`roads-${lat}_${lon}`, 30 * 86400_000, async () => trCompactRoads(await overpass(trRoadsQuery(lat, lon))));
  return [200, { lat, lon, roads }];
}

async function apiShops(url) {
  const p = latLon(url);
  if (!p) return [400, { error: "stores are available for US places only" }];
  const [lat, lon] = p.map(v => Math.round(v * 500) / 500); // ~200 m
  const shops = await diskCached(`shops-${lat}_${lon}`, 3 * 86400_000, async () => trCompactShops(await overpass(trShopsQuery(lat, lon))));
  return [200, { lat, lon, shops }];
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
    else if (url.pathname === "/api/live") result = await apiLive(url.searchParams.get("list"));
    else if (url.pathname === "/api/history") result = await apiHistory(url.searchParams.get("symbol"), url.searchParams.get("range") || "1mo");
    else if (url.pathname === "/api/translate" && req.method === "POST") result = await apiTranslate(await readJson(req));
    else if (url.pathname === "/api/image") result = await apiImage(url.searchParams.get("url") || "");
    else if (url.pathname === "/api/article") result = await apiArticle(url.searchParams.get("url") || "");
    else if (url.pathname === "/api/access") result = await apiAccess(url.searchParams.get("url") || "");
    else if (url.pathname === "/api/roads") result = await apiRoads(url);
    else if (url.pathname === "/api/shops") result = await apiShops(url);
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
  // Fetch the first Traffic city ahead of time (only once; it is then kept on disk).
  const first = TR_CITIES[0];
  apiRoads(new URL(`http://x/?lat=${first.lat}&lon=${first.lon}`)).catch(() => {});
});
