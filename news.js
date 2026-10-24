// Worldwide National Movement tab (#/news): right-leaning outlets from the US, UK, France,
// Germany and Poland, with filters, translation to English, and the top 25 S&P 500 stocks.
// Feeds, stocks and translation come through the local server (server.js), since
// browsers can't fetch other sites directly. Uses escapeHtml() from app.js.

// Where the API lives. Same address as the page by default; a mobile app build can
// point this at a hosted copy of server.js (see config.js).
const NEWS_API = (window.STACKS_CONFIG && window.STACKS_CONFIG.apiBase) || "";

const NEWS_TYPES = [
  { id: "politics", name: "Politics", words: /politic|politik|polityk|polityc|élection|election|wahl|wybor|congress|kongres|parliament|parlament|senat|bundestag|sejm|white.house|trump|biden|vance|starmer|macron|merz|tusk|nawrocki|government|regierung|rząd|gouvernement|minister|campaign|partei|partia|parti|democrat|republican|tory|tories|labour|afd|\bpis\b|\bcdu\b|\brn\b|immigration|migra/i },
  { id: "world", name: "World", words: /\bworld\b|international|ausland|świat|swiat|monde|foreign|ukrain|russia|russland|rosj|china|chin|israel|gaza|iran|nato|\bun\b|\bue\b|\beu\b|europe|europa|global/i },
  { id: "business", name: "Business & Economy", words: /business|econom|économ|wirtschaft|gospodar|finan|market|börse|giełd|money|geld|stock|inflation|inflacj|tax|steuer|podat|impôt|budget|haushalt|budżet|jobs|bank|trade|tariff|zoll|cło|biznes|entreprise|unternehm|energy|energie|energi/i },
  { id: "opinion", name: "Opinion", words: /opinion|meinung|opini|kommentar|komentarz|editorial|column|tribune|tribüne|chronique|felieton|essay|commentary|analysis|analyse|analiz|\bop-ed\b/i },
  { id: "culture", name: "Culture & Society", words: /culture|kultur|society|gesellschaft|społecz|société|religion|church|kirche|kości|église|faith|education|bildung|edukacj|école|school|universit|media|film|movie|music|musik|book|royal|family|famil|lifestyle|history|geschichte|histori/i },
  { id: "crime", name: "Crime & Justice", words: /crime|police|polizei|polic|court|gericht|sąd|tribunal|justice|justiz|murder|mord|morder|meurtre|attack|anschlag|atak|attentat|arrest|festnahme|zatrzym|interpell|prison|gefängnis|więzie|terror|ice\b|border|grenze|granic|frontière/i },
  { id: "tech", name: "Science & Tech", words: /\btech|technolog|science|wissenschaft|nauk|digital|\bai\b|\bki\b|artificial|künstlich|sztuczn|space|weltraum|kosmos|espace|health|gesundheit|zdrow|santé|medic|climate|klima|climat/i },
  { id: "sports", name: "Sports", words: /sport|football|fußball|fussball|piłk|soccer|\bnfl\b|\bnba\b|\bmlb\b|\bnhl\b|olymp|tennis|rugby|formula|bundesliga|ekstraklasa|ligue 1|premier league|world cup|mundial/i },
];
// The top of the feed leads with these news types, with one story from any other section
// in every NEWS_TOP_EVERY spots, for the first NEWS_TOP_COUNT stories. After that it is
// newest first.
const NEWS_TOP_TYPES = new Set(["politics", "business", "world"]);
const NEWS_TOP_EVERY = 4;
const NEWS_TOP_COUNT = 40;
const NEWS_LANG_NAMES ={ en: "English", fr: "French", de: "German", pl: "Polish" };
// When sorting a story, more specific types are checked first ("World Cup" is Sports, not World).
const NEWS_TYPE_PRIORITY = ["sports", "opinion", "crime", "business", "tech", "culture", "world", "politics"]
  .map(id => NEWS_TYPES.find(t => t.id === id));

// Stories the outlet itself labels as breaking news or live coverage (in any of the four
// languages). Only explicit labels count: a headline that merely contains "urgent" or "live"
// isn't flagged. Shared with the US News tab.
const NEWS_BREAKING_TITLE = /^\s*(?:\+\+\+\s*)?(?:breaking(?: news)?|just in|developing(?: story)?|eilmeldung|pilne|z ostatniej chwili|alerte(?: info)?|derni[eè]re minute|urgent)\s*(?:\+\+\+|[:\-–—|!])/i;
const NEWS_LIVE_TITLE = /^\s*(?:live(?: updates?| blog| coverage| now)?|watch live|en direct|live-?ticker|na żywo|relacja na żywo)\s*(?:\+\+\+|[:\-–—|!])/i;
const NEWS_BREAKING_CAT = /^(?:breaking(?: news)?|eilmeldung|pilne|alerte info|urgent)$/i;
const NEWS_LIVE_CAT = /^(?:live|liveticker|en direct|live updates)$/i;
const NEWS_LIVE_URL = /\/(?:live-updates|live-news|liveticker|live-blog|en-direct)\/|\/live-now-/i;

function newsBreaking(item) {
  if (NEWS_BREAKING_TITLE.test(item.title) || item.categories.some(c => NEWS_BREAKING_CAT.test(c))) return "breaking";
  let path = "";
  try { path = new URL(item.link).pathname; } catch { /* ignore */ }
  if (NEWS_LIVE_TITLE.test(item.title) || item.categories.some(c => NEWS_LIVE_CAT.test(c)) || NEWS_LIVE_URL.test(path)) return "live";
  return null;
}

function newsFlashBadge(kind) {
  if (!kind) return "";
  return kind === "breaking"
    ? `<span class="news-flash breaking">Breaking</span>`
    : `<span class="news-flash live"><i aria-hidden="true"></i>Live</span>`;
}

// The strip above the feed: the newest breaking and live stories from the last 12 hours.
// The animated 🚨 siren at the start of the red breaking-news bar.
const NEWS_SIREN = `<span class="news-siren" aria-hidden="true">🚨</span>`;

function newsRenderBreaking(el, list, sourceName) {
  const recent = list
    .filter(it => it.flash && (!it.date || Date.now() - new Date(it.date) < 12 * 3600_000))
    .sort((a, b) => (b.flash === "breaking") - (a.flash === "breaking") || (b.date || "").localeCompare(a.date || ""))
    .slice(0, 6);
  el.hidden = !recent.length;
  if (!recent.length) { el.innerHTML = ""; return; }
  el.innerHTML = `
    <div class="news-breaking-head">${NEWS_SIREN}<span class="news-breaking-label">Breaking news</span><span>Stories the outlets themselves label breaking or live</span></div>
    <ul>${recent.map(it => `
      <li>${newsFlashBadge(it.flash)}
        <a href="${escapeHtml(it.link)}" target="_blank" rel="noopener">${escapeHtml(it.titleEn || it.title)}</a>
        <span class="news-breaking-meta">${escapeHtml(sourceName(it))} · ${newsTimeAgo(it.date)}</span>
      </li>`).join("")}</ul>`;
}

const news = {
  items: [],
  shown: 40,
  loading: false,
  loadedAt: 0,
  prefs: { types: null, countries: null, sources: null, leans: null, translate: true },
  translations: {}, // "lang|text" → English
  serverOk: null,
  refreshTimer: 0,
  stockTimer: 0,
};

// ---- Preferences (saved in this browser) ----

function newsLoadPrefs() {
  const all = { types: NEWS_TYPES.map(t => t.id).concat("general"), countries: NEWS_COUNTRIES.map(c => c.id), sources: NEWS_SOURCES.map(s => s.id), leans: NEWS_LEANS.map(l => l.id) };
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem("news-prefs") || "{}"); } catch { /* defaults */ }
  news.prefs = {
    types: new Set(saved.types || all.types),
    leans: new Set(saved.leans || all.leans),
    countries: new Set(saved.countries || all.countries),
    sources: new Set(saved.sources || all.sources),
    translate: saved.translate !== false,
  };
  try { news.translations = JSON.parse(localStorage.getItem("news-translations") || "{}"); } catch { news.translations = {}; }
}

function newsSavePrefs() {
  try {
    localStorage.setItem("news-prefs", JSON.stringify({
      types: [...news.prefs.types], countries: [...news.prefs.countries], leans: [...news.prefs.leans],
      sources: [...news.prefs.sources], translate: news.prefs.translate,
    }));
  } catch { /* fine without it */ }
}

function newsSaveTranslations() {
  // Keep the saved translations to a sensible size.
  const keys = Object.keys(news.translations);
  if (keys.length > 1500) keys.slice(0, keys.length - 1500).forEach(k => delete news.translations[k]);
  try { localStorage.setItem("news-translations", JSON.stringify(news.translations)); } catch { /* fine */ }
}

// ---- Classifying stories into news types ----

function newsClassify(item, source) {
  let section = "";
  try {
    // The address usually names the section (/politics/, /wirtschaft/, /swiat/…). Leave out
    // the last part, which is the story's own title, so its words don't decide the section.
    const parts = decodeURIComponent(new URL(item.link).pathname).split("/").filter(Boolean);
    section = parts.slice(0, -1).join("/");
  } catch { /* ignore */ }
  const text = `${item.categories.join(" ")} ${item.title}`;
  for (const t of NEWS_TYPE_PRIORITY) if (t.words.test(section)) return t.id;
  for (const t of NEWS_TYPE_PRIORITY) if (t.words.test(text)) return t.id;
  return source.kind === "magazine" ? "opinion" : "general";
}

// ---- Server ----

async function newsApi(path, options) {
  const res = await fetch(NEWS_API + path, options);
  if (!res.ok) throw new Error(`server returned ${res.status}`);
  return res.json();
}

async function newsCheckServer() {
  if (location.protocol === "file:" && !NEWS_API) return false;
  try { return !!(await newsApi("/api/health")).ok; } catch { return false; }
}

// ---- Loading the feeds ----

async function newsLoad(force) {
  if (news.loading) return;
  if (!force && news.items.length && Date.now() - news.loadedAt < 5 * 60_000) { newsRender(); return; }
  news.loading = true;
  const status = document.getElementById("news-status");
  const sources = NEWS_SOURCES;
  let done = 0;
  const all = [];
  status.textContent = `Loading news… 0 of ${sources.length} sources`;
  const queue = [...sources];
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const source = queue.shift();
      try {
        const data = await newsApi(`/api/feed?id=${encodeURIComponent(source.id)}`);
        for (const it of data.items) all.push({ ...it, type: newsClassify(it, source), flash: newsBreaking(it) });
      } catch { /* one source failing shouldn't stop the rest */ }
      done++;
      status.textContent = `Loading news… ${done} of ${sources.length} sources`;
    }
  }));
  // Newest first, without duplicates (newsFiltered() then puts the main news types up top).
  const seen = new Set();
  news.items = all
    .filter(it => !seen.has(it.link) && seen.add(it.link))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  news.loadedAt = Date.now();
  news.loading = false;
  news.shown = 40;
  status.textContent = `Updated ${new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
  newsRender();
}

// ---- Rendering ----

function newsFiltered() {
  const p = news.prefs;
  const list = news.items.filter(it => {
    const s = NEWS_SOURCES.find(x => x.id === it.source);
    return s && p.sources.has(s.id) && p.countries.has(s.country) && p.types.has(it.type) && p.leans.has(s.lean);
  });
  // Lead with politics, economy and world news, mixing in one story from another section
  // every few spots so the rest of the news still shows near the top.
  const main = list.filter(it => NEWS_TOP_TYPES.has(it.type)), other = list.filter(it => !NEWS_TOP_TYPES.has(it.type));
  const top = [];
  while (top.length < NEWS_TOP_COUNT && (main.length || other.length)) {
    const otherTurn = top.length % NEWS_TOP_EVERY === NEWS_TOP_EVERY - 1;
    top.push((otherTurn && other.length) || !main.length ? other.shift() : main.shift());
  }
  const rest = [...main, ...other].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return [...top, ...rest];
}

function newsTimeAgo(iso) {
  if (!iso) return "";
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function newsT(lang, text) {
  return lang === "en" || !news.prefs.translate ? null : news.translations[`${lang}|${text}`] || null;
}

// Center Right / Right / Far Right, from the shared scale in news-sources.js.
const NEWS_LEANS = US_LEANS.filter(l => l.id > 0);
const newsLean = lean => US_LEANS.find(l => l.id === lean);

// The bar under the stock ticker: how the stories split by outlet leaning, with counts.
function newsRenderLeanBar(list) {
  const el = document.getElementById("news-leanbar");
  if (!news.items.length) { el.innerHTML = ""; return; }
  const row = (label, pool) => {
    const total = pool.length || 1;
    return `<div class="usn-bal-row"><span class="usn-bal-label">${label}</span><div class="usn-bal-bar">${NEWS_LEANS.map(l => {
      const n = pool.filter(it => NEWS_SOURCES.find(s => s.id === it.source)?.lean === l.id).length;
      if (!n) return "";
      const pct = Math.round(n / total * 100);
      return `<span class="lean-${l.key}${pct < 25 ? " sm" : ""}" style="flex:${n}" title="${l.name}: ${n} stories (${pct}%)">${pct >= 12 ? `${l.name} ${pct}% · ${n}` : `${pct}%`}</span>`;
    }).join("")}</div></div>`;
  };
  const outlets = NEWS_LEANS.map(l => `${l.name} ${NEWS_SOURCES.filter(s => s.lean === l.id).length}`).join(" · ");
  el.innerHTML = `
    <div class="wrap usn-bal-inner">
      <div class="usn-bal-title"><b>Right &amp; far right</b><span>${news.items.length} stories · outlets: ${outlets}</span></div>
      <div class="usn-bal-bars">${row("All stories", news.items)}${row("Your feed", list)}</div>
    </div>`;
}

// The bottom of both news tabs: how outlets are placed in their leaning groups.
function newsRenderMethod(id, sources, leans, intro) {
  const el = document.getElementById(id);
  if (!el || el.childElementCount) return;
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const groups = leans.map(l => {
    const outlets = sources.filter(s => s.lean === l.id);
    if (!outlets.length) return "";
    return `<details class="news-method-group lean-${l.key}">
      <summary><i></i>${esc(l.name)} <span>${outlets.length} outlet${outlets.length === 1 ? "" : "s"}</span></summary>
      <ul>${outlets.map(s => `<li><b>${esc(s.name)}</b>${OUTLET_ABOUT[s.id] ? `<span>${esc(OUTLET_ABOUT[s.id])}</span>` : ""}</li>`).join("")}</ul>
    </details>`;
  }).join("");
  // Starts closed; the heading opens it.
  el.innerHTML = `<details class="news-method-box">
    <summary><h2>How we sort outlets by political leaning</h2></summary>
    <p class="news-method-intro">${intro}</p>
    <ol class="news-method-criteria">${LEAN_CRITERIA.map(([t, d]) => `<li><b>${esc(t)}</b> ${esc(d)}</li>`).join("")}</ol>
    <div class="news-method-groups">${groups}</div>
    <p class="news-method-note">These ratings are our own reading of the sources above and can change as outlets change. A rating describes an outlet's overall slant, not whether any one story is true or fair. Check
      <a href="https://www.allsides.com/media-bias/ratings" target="_blank" rel="noopener">AllSides</a>,
      <a href="https://adfontesmedia.com/interactive-media-bias-chart/" target="_blank" rel="noopener">Ad Fontes Media</a> and
      <a href="https://mediabiasfactcheck.com/" target="_blank" rel="noopener">Media Bias/Fact Check</a> for their current ratings.</p>
  </details>`;
}

function newsRender() {
  const list = newsFiltered();
  newsRenderLeanBar(list);
  const feed = document.getElementById("news-feed");
  document.getElementById("news-count").textContent = news.items.length
    ? `${list.length} stories from ${new Set(list.map(i => i.source)).size} sources`
    : "";
  if (!list.length) {
    feed.innerHTML = news.items.length
      ? `<p class="news-empty">No stories match your filters. Try turning on more news types, countries or sources.</p>`
      : "";
    document.getElementById("news-more").hidden = true;
    return;
  }
  const visible = list.slice(0, news.shown);
  feed.innerHTML = visible.map((it, i) => {
    const s = NEWS_SOURCES.find(x => x.id === it.source);
    const type = NEWS_TYPES.find(t => t.id === it.type)?.name || "General";
    const title = newsT(s.lang, it.title);
    const summary = newsT(s.lang, it.summary);
    const translated = s.lang !== "en";
    const readEnglish = `https://translate.google.com/translate?sl=${s.lang}&tl=en&u=${encodeURIComponent(it.link)}`;
    return `
      <article class="news-card${i === 0 ? " lead" : ""}" data-link="${escapeHtml(it.link)}" data-lang="${s.lang}">
        <a class="news-img" href="${escapeHtml(it.link)}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">
          ${it.image ? `<img src="${escapeHtml(it.image)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<span class="news-img-wait"></span>`}
        </a>
        <div class="news-body">
          <div class="news-meta">
            ${newsFlashBadge(it.flash)}
            <span class="news-flag">${s.country.toUpperCase()}</span>
            <span class="news-source">${escapeHtml(s.name)}</span>
            <span>·</span><span>${newsTimeAgo(it.date)}</span>
            <span class="news-lean-tag lean-${newsLean(s.lean).key}">${newsLean(s.lean).name}</span>
            <span class="news-type">${type}</span>
          </div>
          <h3><a href="${escapeHtml(it.link)}" target="_blank" rel="noopener">${escapeHtml(title || it.title)}</a></h3>
          ${title ? `<p class="news-original" lang="${s.lang}">${escapeHtml(it.title)}</p>` : ""}
          ${it.summary ? `<p class="news-summary">${escapeHtml(summary || it.summary)}</p>` : ""}
          <div class="news-links">
            <a href="${escapeHtml(it.link)}" target="_blank" rel="noopener">Read at ${escapeHtml(s.name)}</a>
            ${translated ? `<a href="${readEnglish}" target="_blank" rel="noopener">Read in English</a><span class="news-lang">Translated from ${NEWS_LANG_NAMES[s.lang]}</span>` : ""}
          </div>
        </div>
      </article>`;
  }).join("");
  document.getElementById("news-more").hidden = list.length <= news.shown;
  newsRenderBreaking(document.getElementById("news-breaking"), list.map(it => {
    const s = NEWS_SOURCES.find(x => x.id === it.source);
    return { ...it, titleEn: newsT(s.lang, it.title) };
  }), it => NEWS_SOURCES.find(x => x.id === it.source).name);
  newsWatchImages();
  if (news.prefs.translate) newsTranslateVisible(visible);
}

// Stories without a picture in their feed: ask the server for the article's preview image
// when the card scrolls into view.
let newsImgObserver = null;
function newsWatchImages() {
  newsImgObserver?.disconnect();
  newsImgObserver = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      newsImgObserver.unobserve(e.target);
      const card = e.target.closest(".news-card");
      const item = news.items.find(it => it.link === card.dataset.link);
      newsApi(`/api/image?url=${encodeURIComponent(card.dataset.link)}`).then(d => {
        if (d.image) {
          if (item) item.image = d.image;
          e.target.outerHTML = `<img src="${escapeHtml(d.image)}" alt="" loading="lazy" referrerpolicy="no-referrer">`;
        } else {
          card.classList.add("no-img");
        }
      }).catch(() => card.classList.add("no-img"));
    }
  }, { rootMargin: "300px" });
  document.querySelectorAll(".news-img-wait").forEach(el => newsImgObserver.observe(el));
  // Pictures that fail to load: drop the picture space instead of showing a broken image.
  document.querySelectorAll(".news-img img").forEach(img => {
    img.addEventListener("error", () => img.closest(".news-card")?.classList.add("no-img"), { once: true });
  });
}

// ---- Translation into English ----

// Uses the browser's built-in translator when it has one (private, on-device);
// otherwise the local server translates.
const newsBuiltIn = {};
async function newsBuiltInTranslator(from) {
  if (!("Translator" in self)) return null;
  if (newsBuiltIn[from] !== undefined) return newsBuiltIn[from];
  try {
    const avail = await Translator.availability({ sourceLanguage: from, targetLanguage: "en" });
    newsBuiltIn[from] = avail === "available" ? await Translator.create({ sourceLanguage: from, targetLanguage: "en" }) : null;
  } catch { newsBuiltIn[from] = null; }
  return newsBuiltIn[from];
}

async function newsTranslate(texts, from) {
  const local = from !== "auto" && await newsBuiltInTranslator(from);
  if (local) {
    const out = [];
    for (const t of texts) { try { out.push(await local.translate(t)); } catch { out.push(null); } }
    return { translations: out, detected: texts.map(() => from) };
  }
  return newsApi("/api/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ texts, from }) });
}

let newsTranslating = false;
async function newsTranslateVisible(visible) {
  if (newsTranslating) return;
  newsTranslating = true;
  try {
    const byLang = {};
    for (const it of visible) {
      const lang = NEWS_SOURCES.find(s => s.id === it.source).lang;
      if (lang === "en") continue;
      for (const text of [it.title, it.summary]) {
        if (text && !news.translations[`${lang}|${text}`]) (byLang[lang] ||= new Set()).add(text);
      }
    }
    let changed = false;
    for (const [lang, set] of Object.entries(byLang)) {
      const texts = [...set];
      for (let i = 0; i < texts.length; i += 30) {
        const chunk = texts.slice(i, i + 30);
        const r = await newsTranslate(chunk, lang);
        chunk.forEach((t, k) => { if (r.translations[k]) { news.translations[`${lang}|${t}`] = r.translations[k]; changed = true; } });
      }
    }
    if (changed) {
      newsSaveTranslations();
      newsRender();
    }
  } catch { /* translation unavailable: originals stay */ }
  newsTranslating = false;
}

// ---- Stocks: top 25 S&P 500 companies ----

async function newsLoadStocks() {
  const box = document.getElementById("news-stocks-list");
  try {
    const { quotes } = await newsApi("/api/stocks");
    const t = quotes.find(q => q.time)?.time;
    document.getElementById("news-stocks-time").textContent = t
      ? `As of ${new Date(t).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}`
      : "";
    const items = quotes.map((q, i) => {
      if (q.price == null) return `<li><span class="stk-rank">${i + 1}</span><b>${escapeHtml(q.symbol)}</b><span class="stk-price">–</span></li>`;
      const up = q.change >= 0;
      return `
        <li><button type="button" class="stk-btn" data-symbol="${escapeHtml(q.symbol)}" title="${escapeHtml(q.name)}: see the past month">
          <span class="stk-rank">${i + 1}</span>
          <b>${escapeHtml(q.symbol)}</b>
          <span class="stk-price">$${q.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span class="stk-chg ${up ? "up" : "down"}">${up ? "▲" : "▼"} ${Math.abs(q.changePct).toFixed(2)}%</span>
        </button></li>`;
    }).join("");
    news.quotes = quotes;
    newsTicker(items);
  } catch {
    newsTicker(null, "Stock prices need the local server.");
  }
}

// The ticker holds two copies of the list side by side and slides left by exactly one
// copy, so the loop is seamless. Speed stays the same however wide the list is.
function newsTicker(itemsHtml, note) {
  const track = document.getElementById("news-stocks-list");
  if (!itemsHtml) {
    track.classList.remove("moving");
    track.innerHTML = `<span class="stk-note">${escapeHtml(note)}</span>`;
    return;
  }
  // The second copy is only there for the loop: keep its buttons out of the tab order.
  track.innerHTML = `<ul>${itemsHtml}</ul><ul aria-hidden="true">${itemsHtml.replace(/<button /g, '<button tabindex="-1" ')}</ul>`;
  const width = track.firstElementChild.getBoundingClientRect().width;
  const seconds = Math.max(20, width / 55); // ~55 pixels per second
  // New prices every minute shouldn't restart the scroll: only change the speed if the list
  // width changed a lot (changing the duration makes the animation jump).
  const current = parseFloat(track.style.getPropertyValue("--ticker-time")) || 0;
  if (!current || Math.abs(current - seconds) / current > 0.15) track.style.setProperty("--ticker-time", `${seconds}s`);
  track.classList.add("moving");
}

// ---- One stock's chart: day, week or month (opens from the ticker) ----

const newsMoney = v => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
// Times are shown in New York time, where the stocks trade.
const NEWS_MARKET_TZ = "America/New_York";
const newsShortDate = iso => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: NEWS_MARKET_TZ });
const newsTime = iso => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZone: NEWS_MARKET_TZ });
const newsWeekday = iso => new Date(iso).toLocaleDateString(undefined, { weekday: "short", timeZone: NEWS_MARKET_TZ });
// Green ▲ for up, red ▼ for down.
const newsArrow = up => `<span class="stock-arrow ${up ? "up" : "down"}" aria-label="${up ? "up" : "down"}">${up ? "▲" : "▼"}</span>`;

const STOCK_RANGES = [
  { id: "1d", label: "Day", title: "Last trading day", every: "every 5 minutes",
    tick: newsTime, tip: iso => `${newsWeekday(iso)} ${newsTime(iso)}` },
  { id: "5d", label: "Week", title: "Past week", every: "every 30 minutes",
    tick: newsWeekday, tip: iso => `${newsWeekday(iso)} ${newsShortDate(iso)}, ${newsTime(iso)}` },
  { id: "1mo", label: "Month", title: "Past month", every: "daily closes",
    tick: newsShortDate, tip: iso => new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: NEWS_MARKET_TZ }) },
];

function newsOpenStock(symbol) {
  const dialog = document.getElementById("stock-dialog");
  const q = (news.quotes || []).find(x => x.symbol === symbol);
  document.getElementById("stock-title").textContent = q ? `${q.name} (${symbol})` : symbol;
  news.stockView = { symbol, range: news.stockView?.range || "1mo", data: {} };
  document.getElementById("stock-body").innerHTML = `
    <div class="stock-summary" id="stock-summary"></div>
    <div class="stock-box">
      <div class="stock-box-head">
        <span class="stock-box-title" id="stock-box-title"></span>
        <div class="stock-range" role="tablist" aria-label="Time range">
          ${STOCK_RANGES.map(r => `<button type="button" role="tab" data-range="${r.id}">${r.label}</button>`).join("")}
        </div>
      </div>
      <div class="stock-chart" id="stock-chart"></div>
    </div>
    <details class="stock-table" id="stock-table"></details>
    <p class="stock-note">Prices from Yahoo Finance, in New York time.</p>`;
  if (!dialog.open) dialog.showModal();
  newsStockRange(news.stockView.range);
}

async function newsStockRange(range) {
  const view = news.stockView;
  view.range = range;
  const r = STOCK_RANGES.find(x => x.id === range);
  document.querySelectorAll("#stock-body [data-range]").forEach(b => b.setAttribute("aria-selected", String(b.dataset.range === range)));
  document.getElementById("stock-box-title").textContent = `${r.title} · ${r.every}`;
  if (!view.data[range]) {
    document.getElementById("stock-chart").innerHTML = `<p class="stock-wait">Loading…</p>`;
    try {
      const h = await newsApi(`/api/history?symbol=${encodeURIComponent(view.symbol)}&range=${range}`);
      if (h.points.length < 2) throw new Error("no data");
      view.data[range] = h;
    } catch {
      if (news.stockView === view && view.range === range) {
        document.getElementById("stock-chart").innerHTML = `<p class="stock-wait">Couldn't load the price history. Try again in a minute.</p>`;
      }
      return;
    }
    if (news.stockView !== view || view.range !== range) return; // switched while loading
  }
  newsRenderStock();
}

function newsRenderStock() {
  const view = news.stockView;
  const h = view.data[view.range];
  const r = STOCK_RANGES.find(x => x.id === view.range);
  const pts = h.points;
  const first = pts[0].close, last = pts[pts.length - 1].close;
  const hi = pts.reduce((a, p) => (p.close > a.close ? p : a)), lo = pts.reduce((a, p) => (p.close < a.close ? p : a));
  // The day's move: from the live quote when there is one, else from the day chart or the last two closes.
  const q = (news.quotes || []).find(x => x.symbol === h.symbol);
  const live = q && q.price != null;
  const dayBase = view.range === "1d" && h.previousClose ? h.previousClose : pts[pts.length - 2].close;
  const dayChange = live ? q.change : last - dayBase;
  const dayPct = live ? q.changePct : dayChange / dayBase * 100;
  const change = last - first, pct = change / first * 100;
  const when = p => (view.range === "1mo" ? newsShortDate(p.date) : `${newsWeekday(p.date)} ${newsTime(p.date)}`);
  document.getElementById("stock-summary").innerHTML = `
    <div><span class="stock-label">${live ? "Price" : "Last close"}</span><b class="stock-big">${newsMoney(live ? q.price : last)}</b></div>
    <div><span class="stock-label">Today</span><b class="stock-chg">${newsArrow(dayChange >= 0)} ${newsMoney(Math.abs(dayChange))} (${Math.abs(dayPct).toFixed(2)}%)</b></div>
    ${view.range === "1d" ? "" : `<div><span class="stock-label">${r.title}</span><b class="stock-chg">${newsArrow(change >= 0)} ${newsMoney(Math.abs(change))} (${Math.abs(pct).toFixed(1)}%)</b></div>`}
    <div><span class="stock-label">High</span><b>${newsMoney(hi.close)}</b><span class="stock-sub">${when(hi)}</span></div>
    <div><span class="stock-label">Low</span><b>${newsMoney(lo.close)}</b><span class="stock-sub">${when(lo)}</span></div>`;
  document.getElementById("stock-table").innerHTML = `
    <summary>${r.title}: prices ${r.every}</summary>
    <table>
      <thead><tr><th scope="col">${view.range === "1mo" ? "Date" : "Time"}</th><th scope="col">Price</th><th scope="col">Change</th></tr></thead>
      <tbody>${pts.map((p, i) => {
        const d = i ? p.close - pts[i - 1].close : 0;
        return `<tr><td>${r.tip(p.date)}</td><td>${newsMoney(p.close)}</td><td>${i ? `${newsArrow(d >= 0)} ${Math.abs(d).toFixed(2)}` : "–"}</td></tr>`;
      }).reverse().join("")}</tbody>
    </table>`;
  newsDrawStockChart();
}

// Line chart sized to its box, with a crosshair and tooltip on hover. Each piece of the
// line is green where the price rose and red where it fell. The day and week charts are
// laid out by trading time and mark when each day's trading opens and closes; the day
// chart also shows the previous close as a dashed line.
function newsDrawStockChart() {
  const box = document.getElementById("stock-chart");
  const view = news.stockView;
  const h = view && view.data[view.range];
  if (!box || !h) return;
  const r = STOCK_RANGES.find(x => x.id === view.range);
  const pts = h.points;
  const base = view.range === "1d" ? h.previousClose : null;
  const W = Math.max(280, box.clientWidth), H = Math.round(Math.min(310, Math.max(210, W * 0.46)));
  const m = { l: 58, r: 18, t: 24, b: 28 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const vals = pts.map(p => p.close);
  // Round y-axis steps: 1, 2 or 5 × a power of ten, about four of them.
  const lo0 = Math.min(...vals, base ?? Infinity), hi0 = Math.max(...vals, base ?? -Infinity);
  const raw = (hi0 - lo0 || hi0 * 0.02) / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map(k => k * pow).find(s => s >= raw);
  const yMin = Math.floor(lo0 / step) * step, yMax = Math.ceil(hi0 / step) * step;
  const lastI = pts.length - 1;
  const y = v => m.t + (1 - (v - yMin) / (yMax - yMin)) * ih;

  // Trading sessions (open → close) that the points fall in. Day and week charts place
  // points by time within those sessions, side by side with a small gap between days.
  const ms = iso => new Date(iso).getTime();
  const sessions = view.range === "1mo" ? [] : (h.sessions || [])
    .map(s => ({ open: ms(s.open), close: ms(s.close) }))
    .filter(s => pts.some(p => ms(p.date) >= s.open && ms(p.date) <= s.close));
  const timed = sessions.length > 0;
  const gap = sessions.length > 1 ? 10 : 0;
  const total = sessions.reduce((t, s) => t + (s.close - s.open), 0);
  const span = iw - gap * (sessions.length - 1);
  const sessionX = sessions.map((s, k) => {
    const before = sessions.slice(0, k).reduce((t, p) => t + (p.close - p.open), 0);
    const x0 = m.l + before / total * span + k * gap;
    return { ...s, x0, x1: x0 + (s.close - s.open) / total * span };
  });
  const sessionOf = t => sessionX.findIndex(s => t >= s.open && t <= s.close);
  const xAt = (p, i) => {
    if (!timed) return m.l + i / lastI * iw;
    const t = ms(p.date), k = Math.max(0, sessionOf(t));
    const s = sessionX[k];
    return s.x0 + (Math.min(Math.max(t, s.open), s.close) - s.open) / (s.close - s.open) * (s.x1 - s.x0);
  };
  const xs = pts.map(xAt);
  const x = i => xs[i];

  const rose = i => i === 0 ? (base == null || pts[0].close >= base) : pts[i].close >= pts[i - 1].close;
  // Pieces that jump overnight (from one day's close to the next day's open) are dotted.
  const overnight = k => timed && sessionOf(ms(pts[k].date)) !== sessionOf(ms(pts[k + 1].date));
  const segments = pts.slice(1).map((p, k) =>
    `<line class="stock-seg ${p.close >= pts[k].close ? "up" : "down"}${overnight(k) ? " overnight" : ""}" x1="${x(k).toFixed(1)}" y1="${y(pts[k].close).toFixed(1)}" x2="${x(k + 1).toFixed(1)}" y2="${y(p.close).toFixed(1)}"/>`).join("");
  const yTicks = [];
  for (let v = yMin; v <= yMax + step / 2; v += step) yTicks.push(v);
  const decimals = step < 1 ? 2 : 0;

  // Open and close marks: a dashed line at each, labeled with the time at the top.
  const now = Date.now();
  let marks = "";
  if (timed) {
    const label = (xPos, text, anchor) => `<text class="stock-mark-label" x="${xPos.toFixed(1)}" y="${m.t - 8}" text-anchor="${anchor}">${text}</text>`;
    const roomy = sessionX.length === 1 || (sessionX[0].x1 - sessionX[0].x0) >= 110;
    marks = sessionX.map((s, k) => {
      const lines = `<line class="stock-mark" x1="${s.x0}" x2="${s.x0}" y1="${m.t}" y2="${m.t + ih}"/><line class="stock-mark" x1="${s.x1}" x2="${s.x1}" y1="${m.t}" y2="${m.t + ih}"/>`;
      const openT = newsTime(new Date(s.open).toISOString()), closeT = newsTime(new Date(s.close).toISOString());
      if (sessionX.length === 1) {
        return lines + label(s.x0 + 4, `Open ${openT}`, "start") + label(s.x1 - 4, `${now < s.close ? "Closes" : "Close"} ${closeT}`, "end");
      }
      // Week: name the times on each day when there's room, else only on the first and last.
      const first = k === 0, last = k === sessionX.length - 1;
      return lines
        + (roomy || first ? label(s.x0 + 3, first ? `Open ${openT}` : openT, "start") : "")
        + (roomy || last ? label(s.x1 - 3, last ? `Close ${closeT}` : closeT, "end") : "");
    }).join("");
  }

  // X labels: hours on the day chart, the weekday under each day on the week chart, dates on the month chart.
  let xLabels;
  if (view.range === "1d" && timed) {
    const s = sessionX[0];
    const hours = [];
    const stepH = W < 520 ? 2 : 1;
    for (let t = Math.ceil(s.open / 3600_000) * 3600_000; t < s.close; t += 3600_000 * stepH) hours.push(t);
    xLabels = hours.filter(t => t - s.open >= 20 * 60_000 && s.close - t >= 20 * 60_000).map(t =>
      `<text class="stock-axis" x="${(s.x0 + (t - s.open) / (s.close - s.open) * (s.x1 - s.x0)).toFixed(1)}" y="${H - 8}" text-anchor="middle">${new Date(t).toLocaleTimeString(undefined, { hour: "numeric", timeZone: NEWS_MARKET_TZ })}</text>`).join("");
  } else if (timed) {
    xLabels = sessionX.map(s => `<text class="stock-axis" x="${((s.x0 + s.x1) / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle">${newsWeekday(new Date(s.open).toISOString())}</text>`).join("");
  } else {
    const every = Math.max(1, Math.round(lastI / 4));
    xLabels = pts.map((p, i) => i).filter(i => i % every === 0 || i === lastI)
      .filter((i, k, a) => k === a.length - 1 || a[a.length - 1] - i >= every / 2)
      .map(i => `<text class="stock-axis" x="${x(i)}" y="${H - 8}" text-anchor="${i === 0 ? "start" : i === lastI ? "end" : "middle"}">${r.tick(pts[i].date)}</text>`).join("");
  }

  box.innerHTML = `
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeHtml(h.symbol)}, ${r.title.toLowerCase()}: from ${newsMoney(vals[0])} to ${newsMoney(vals[lastI])}">
      ${yTicks.map(v => `<line class="stock-grid" x1="${m.l}" x2="${m.l + iw}" y1="${y(v)}" y2="${y(v)}"/><text class="stock-axis" x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end">$${v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</text>`).join("")}
      ${marks}
      ${xLabels}
      ${base == null ? "" : `<line class="stock-base" x1="${m.l}" x2="${m.l + iw}" y1="${y(base)}" y2="${y(base)}"/><text class="stock-axis stock-base-label" x="${m.l + iw - 4}" y="${y(base) - 5}" text-anchor="end">Previous close ${newsMoney(base)}</text>`}
      ${segments}
      <circle class="stock-end ${rose(lastI) ? "up" : "down"}" cx="${x(lastI)}" cy="${y(vals[lastI])}" r="4.5"/>
      <g class="stock-hover" hidden>
        <line class="stock-cross" y1="${m.t}" y2="${m.t + ih}"/>
        <circle class="stock-dot" r="5"/>
      </g>
      <rect class="stock-hit" x="${m.l}" y="${m.t}" width="${iw}" height="${ih}" fill="transparent"/>
    </svg>
    <div class="stock-tip" hidden></div>`;
  const svg = box.querySelector("svg"), hover = svg.querySelector(".stock-hover"), tip = box.querySelector(".stock-tip");
  // What the tooltip compares against: the previous close (day), the start of the week, or the day before (month).
  const compare = i => {
    if (view.range === "1d") return base == null ? null : { from: base, text: "on the day" };
    if (view.range === "5d") return i ? { from: pts[0].close, text: `since ${newsWeekday(pts[0].date)}` } : null;
    return i ? { from: pts[i - 1].close, text: "from the day before" } : null;
  };
  const show = e => {
    const px = e.clientX - svg.getBoundingClientRect().left;
    let i = 0;
    for (let k = 1; k <= lastI; k++) if (Math.abs(xs[k] - px) < Math.abs(xs[i] - px)) i = k;
    const p = pts[i], c = compare(i);
    hover.hidden = false;
    hover.querySelector(".stock-cross").setAttribute("x1", x(i));
    hover.querySelector(".stock-cross").setAttribute("x2", x(i));
    const dot = hover.querySelector(".stock-dot");
    dot.setAttribute("cx", x(i));
    dot.setAttribute("cy", y(p.close));
    dot.setAttribute("class", `stock-dot ${rose(i) ? "up" : "down"}`);
    tip.hidden = false;
    tip.innerHTML = `<span>${r.tip(p.date)}</span><b>${newsMoney(p.close)}</b>${c ? `<span>${newsArrow(p.close >= c.from)} ${newsMoney(Math.abs(p.close - c.from))} ${c.text}</span>` : ""}`;
    tip.style.left = `${Math.min(Math.max(x(i) - tip.offsetWidth / 2, 0), W - tip.offsetWidth)}px`;
    tip.style.top = `${Math.max(0, y(p.close) - tip.offsetHeight - 14)}px`;
  };
  const hide = () => { hover.hidden = true; tip.hidden = true; };
  const hit = svg.querySelector(".stock-hit");
  hit.addEventListener("pointermove", show);
  hit.addEventListener("pointerdown", show);
  hit.addEventListener("pointerleave", hide);
}

// ---- Watch live (both news tabs): news channels streaming on YouTube right now ----
// The first live channel plays by itself, muted (browsers only allow muted autoplay).
// Picking another channel plays it with sound. Leaving the tab stops the video.

const newsLive = {}; // "news" | "usn" → { channels, current }

function newsLiveHidden(prefix) {
  try { return localStorage.getItem(`${prefix}-live-hidden`) === "1"; } catch { return false; }
}

async function newsLiveLoad(prefix, list) {
  const el = document.getElementById(`${prefix}-live`);
  try {
    const { live } = await newsApi(`/api/live?list=${list}`);
    const state = newsLive[prefix] ||= { current: null, sound: false };
    state.channels = live;
    if (!live.some(c => c.handle === state.current)) { state.current = live[0]?.handle || null; state.sound = false; }
    newsLiveRender(prefix);
  } catch {
    el.hidden = true;
  }
}

function newsLiveRender(prefix) {
  const el = document.getElementById(`${prefix}-live`);
  const state = newsLive[prefix];
  el.hidden = !state || !state.channels.length;
  if (el.hidden) return;
  const hidden = newsLiveHidden(prefix);
  const cur = state.channels.find(c => c.handle === state.current) || state.channels[0];
  const params = `autoplay=1&mute=${state.sound ? 0 : 1}&playsinline=1&rel=0&modestbranding=1`;
  const dot = c => `<span class="usn-dot lean-${US_LEANS.find(l => l.id === c.lean).key}" aria-hidden="true"></span>`;
  el.innerHTML = `
    <div class="news-live-head">
      <span class="news-live-label"><i aria-hidden="true"></i>Watch live</span>
      <span class="news-live-note">${state.channels.length} news channel${state.channels.length > 1 ? "s" : ""} streaming on YouTube now</span>
      <button type="button" class="news-live-toggle" data-live-toggle>${hidden ? "Show" : "Hide"}</button>
    </div>
    ${hidden ? "" : `
    <div class="news-live-body">
      <div class="news-live-player">
        <iframe src="https://www.youtube-nocookie.com/embed/${cur.videoId}?${params}" title="${escapeHtml(cur.name)} live" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>
      </div>
      <div class="news-live-side">
        <p class="news-live-now">${dot(cur)}<b>${escapeHtml(cur.name)}</b><span>${escapeHtml(cur.title)}</span></p>
        <div class="news-live-list">
          ${state.channels.map(c => `
            <button type="button" class="news-live-ch${c.handle === cur.handle ? " on" : ""}" data-live="${escapeHtml(c.handle)}" title="${escapeHtml(c.title)}">
              <span class="news-live-thumb"><img src="https://i.ytimg.com/vi/${c.videoId}/mqdefault_live.jpg" alt="" loading="lazy"><em>LIVE</em></span>
              <span class="news-live-name">${dot(c)}${escapeHtml(c.name)}${c.country !== "us" || prefix === "news" ? ` <small>${c.country.toUpperCase()}</small>` : ""}</span>
            </button>`).join("")}
        </div>
      </div>
    </div>`}`;
}

function newsLiveStop(prefix) {
  const frame = document.querySelector(`#${prefix}-live iframe`);
  if (frame) frame.closest(".news-live-player").innerHTML = "";
}

function newsLiveBind(prefix) {
  document.getElementById(`${prefix}-live`).addEventListener("click", e => {
    const state = newsLive[prefix];
    if (e.target.closest("[data-live-toggle]")) {
      try { localStorage.setItem(`${prefix}-live-hidden`, newsLiveHidden(prefix) ? "0" : "1"); } catch { /* fine */ }
      newsLiveRender(prefix);
      return;
    }
    const ch = e.target.closest("[data-live]");
    if (ch && state) {
      state.current = ch.dataset.live;
      state.sound = true; // a tap lets it play with sound
      newsLiveRender(prefix);
    }
  });
}

// ---- Sidebar ----

function newsRenderSidebar() {
  const p = news.prefs;
  const chip = (group, id, label, on) =>
    `<label class="news-check"><input type="checkbox" data-group="${group}" value="${id}"${on ? " checked" : ""}> <span>${escapeHtml(label)}</span></label>`;
  document.getElementById("news-leans").innerHTML = NEWS_LEANS.map(l =>
    `<label class="news-check"><input type="checkbox" data-group="leans" value="${l.id}"${p.leans.has(l.id) ? " checked" : ""}> <span class="usn-dot lean-${l.key}"></span><span>${l.name}</span></label>`).join("");
  document.getElementById("news-types").innerHTML =
    [...NEWS_TYPES, { id: "general", name: "General news" }].map(t => chip("types", t.id, t.name, p.types.has(t.id))).join("");
  document.getElementById("news-countries").innerHTML =
    NEWS_COUNTRIES.map(c => chip("countries", c.id, c.name, p.countries.has(c.id))).join("");
  document.getElementById("news-sources").innerHTML = NEWS_COUNTRIES.map(c => `
    <div class="news-source-group">
      <div class="news-source-country">${c.name}</div>
      ${NEWS_SOURCES.filter(s => s.country === c.id).map(s => chip("sources", s.id, s.name + (s.lang !== "en" ? ` (${s.lang.toUpperCase()})` : ""), p.sources.has(s.id))).join("")}
    </div>`).join("");
  document.getElementById("news-translate").checked = p.translate;
}

function newsBindEvents() {
  const side = document.getElementById("news-side");
  side.addEventListener("change", e => {
    const box = e.target;
    if (box.id === "news-translate") {
      news.prefs.translate = box.checked;
    } else if (box.dataset.group) {
      const set = news.prefs[box.dataset.group];
      const v = box.dataset.group === "leans" ? Number(box.value) : box.value;
      box.checked ? set.add(v) : set.delete(v);
    } else return;
    newsSavePrefs();
    news.shown = 40;
    newsRender();
  });
  side.addEventListener("click", e => {
    const btn = e.target.closest("[data-all]");
    if (!btn) return;
    const [group, mode] = btn.dataset.all.split(":");
    const ids = group === "leans" ? NEWS_LEANS.map(l => l.id)
      : group === "types" ? [...NEWS_TYPES.map(t => t.id), "general"]
      : group === "countries" ? NEWS_COUNTRIES.map(c => c.id) : NEWS_SOURCES.map(s => s.id);
    news.prefs[group] = new Set(mode === "all" ? ids : []);
    newsSavePrefs();
    newsRenderSidebar();
    newsRender();
  });
  document.getElementById("news-more").addEventListener("click", () => {
    news.shown += 40;
    newsRender();
  });
  document.getElementById("news-refresh").addEventListener("click", () => { newsLoad(true); newsLoadStocks(); });

  // Click a stock in the ticker for its past month.
  document.getElementById("news-stocks-list").addEventListener("click", e => {
    const btn = e.target.closest(".stk-btn");
    if (btn) newsOpenStock(btn.dataset.symbol);
  });
  const stockDialog = document.getElementById("stock-dialog");
  document.getElementById("stock-close").addEventListener("click", () => stockDialog.close());
  stockDialog.addEventListener("click", e => { if (e.target === stockDialog) stockDialog.close(); });
  window.addEventListener("resize", () => { if (stockDialog.open) newsDrawStockChart(); });
  // Day / Week / Month
  document.getElementById("stock-body").addEventListener("click", e => {
    const b = e.target.closest("[data-range]");
    if (b && b.dataset.range !== news.stockView.range) newsStockRange(b.dataset.range);
  });

  // Phones: the filters slide in from the side.
  const toggle = document.getElementById("news-filter-btn");
  const close = () => { document.body.classList.remove("news-filters-open"); toggle.setAttribute("aria-expanded", "false"); };
  toggle.addEventListener("click", () => {
    const open = document.body.classList.toggle("news-filters-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  document.getElementById("news-side-close").addEventListener("click", close);
  document.getElementById("news-scrim").addEventListener("click", close);

  // Translate any text into English.
  document.getElementById("news-tr-form").addEventListener("submit", async e => {
    e.preventDefault();
    const text = document.getElementById("news-tr-in").value.trim();
    const out = document.getElementById("news-tr-out");
    if (!text) return;
    out.textContent = "Translating…";
    try {
      // Sentence by sentence, so text mixing several languages is all translated.
      const parts = text.split(/(?<=[.!?。！？])\s+|\n+/).filter(p => p.trim()).slice(0, 60);
      const r = await newsTranslate(parts, "auto");
      const names = new Intl.DisplayNames(["en"], { type: "language" });
      const langs = [...new Set((r.detected || []).filter(l => l && l !== "auto" && l !== "en"))]
        .map(l => { try { return names.of(l); } catch { return l; } });
      const english = r.translations.map((t, i) => t || parts[i]).join(" ");
      out.innerHTML = r.translations.some(Boolean)
        ? `<b>English${langs.length ? ` (from ${escapeHtml(langs.join(", "))})` : ""}:</b> ${escapeHtml(english)}`
        : "Couldn't translate that.";
    } catch {
      out.textContent = "Translation needs the local server (see the note above the feed).";
    }
  });
}

// ---- Page setup ----

let newsReady = false;

async function showNews() {
  document.title = "Worldwide National Movement — All Points Towards Progress";
  if (!newsReady) {
    newsReady = true;
    newsLoadPrefs();
    newsRenderSidebar();
    newsBindEvents();
    gamesInit();
    newsLiveBind("news");
    newsRenderMethod("news-method", NEWS_SOURCES, NEWS_LEANS,
      "This tab only carries right-of-center outlets, so they fall into three groups: Center Right, Right and Far Right. Each outlet gets one rating for the outlet as a whole, judged against its own country's politics. Here is what we look at:");
  }
  news.serverOk = await newsCheckServer();
  document.getElementById("news-offline").hidden = news.serverOk;
  if (!news.serverOk) {
    document.getElementById("news-status").textContent = "";
    newsTicker(null, "Start the local server to see stock prices.");
    return;
  }
  newsLoad(false);
  newsLoadStocks();
  newsLiveLoad("news", "world");
  // Keep things fresh while the page is open.
  clearInterval(news.refreshTimer);
  clearInterval(news.stockTimer);
  news.refreshTimer = setInterval(() => { if (!document.getElementById("news-view").hidden) newsLoad(true); }, 10 * 60_000);
  news.stockTimer = setInterval(() => { if (!document.getElementById("news-view").hidden) newsLoadStocks(); }, 60_000);
}
