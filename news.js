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
const NEWS_LANG_NAMES = { en: "English", fr: "French", de: "German", pl: "Polish" };
// When sorting a story, more specific types are checked first ("World Cup" is Sports, not World).
const NEWS_TYPE_PRIORITY = ["sports", "opinion", "crime", "business", "tech", "culture", "world", "politics"]
  .map(id => NEWS_TYPES.find(t => t.id === id));

const news = {
  items: [],
  shown: 40,
  loading: false,
  loadedAt: 0,
  prefs: { types: null, countries: null, sources: null, translate: true },
  translations: {}, // "lang|text" → English
  serverOk: null,
  refreshTimer: 0,
  stockTimer: 0,
};

// ---- Preferences (saved in this browser) ----

function newsLoadPrefs() {
  const all = { types: NEWS_TYPES.map(t => t.id).concat("general"), countries: NEWS_COUNTRIES.map(c => c.id), sources: NEWS_SOURCES.map(s => s.id) };
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem("news-prefs") || "{}"); } catch { /* defaults */ }
  news.prefs = {
    types: new Set(saved.types || all.types),
    countries: new Set(saved.countries || all.countries),
    sources: new Set(saved.sources || all.sources),
    translate: saved.translate !== false,
  };
  try { news.translations = JSON.parse(localStorage.getItem("news-translations") || "{}"); } catch { news.translations = {}; }
}

function newsSavePrefs() {
  try {
    localStorage.setItem("news-prefs", JSON.stringify({
      types: [...news.prefs.types], countries: [...news.prefs.countries],
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
        for (const it of data.items) all.push({ ...it, type: newsClassify(it, source) });
      } catch { /* one source failing shouldn't stop the rest */ }
      done++;
      status.textContent = `Loading news… ${done} of ${sources.length} sources`;
    }
  }));
  // Newest first, without duplicates.
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
  return news.items.filter(it => {
    const s = NEWS_SOURCES.find(x => x.id === it.source);
    return s && p.sources.has(s.id) && p.countries.has(s.country) && p.types.has(it.type);
  });
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

function newsRender() {
  const list = newsFiltered();
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
            <span class="news-flag">${s.country.toUpperCase()}</span>
            <span class="news-source">${escapeHtml(s.name)}</span>
            <span>·</span><span>${newsTimeAgo(it.date)}</span>
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
        <li title="${escapeHtml(q.name)}">
          <span class="stk-rank">${i + 1}</span>
          <b>${escapeHtml(q.symbol)}</b>
          <span class="stk-price">$${q.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span class="stk-chg ${up ? "up" : "down"}">${up ? "▲" : "▼"} ${Math.abs(q.changePct).toFixed(2)}%</span>
        </li>`;
    }).join("");
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
  track.innerHTML = `<ul>${itemsHtml}</ul><ul aria-hidden="true">${itemsHtml}</ul>`;
  const width = track.firstElementChild.getBoundingClientRect().width;
  const seconds = Math.max(20, width / 55); // ~55 pixels per second
  // New prices every minute shouldn't restart the scroll: only change the speed if the list
  // width changed a lot (changing the duration makes the animation jump).
  const current = parseFloat(track.style.getPropertyValue("--ticker-time")) || 0;
  if (!current || Math.abs(current - seconds) / current > 0.15) track.style.setProperty("--ticker-time", `${seconds}s`);
  track.classList.add("moving");
}

// ---- Sidebar ----

function newsRenderSidebar() {
  const p = news.prefs;
  const chip = (group, id, label, on) =>
    `<label class="news-check"><input type="checkbox" data-group="${group}" value="${id}"${on ? " checked" : ""}> <span>${escapeHtml(label)}</span></label>`;
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
      box.checked ? set.add(box.value) : set.delete(box.value);
    } else return;
    newsSavePrefs();
    news.shown = 40;
    newsRender();
  });
  side.addEventListener("click", e => {
    const btn = e.target.closest("[data-all]");
    if (!btn) return;
    const [group, mode] = btn.dataset.all.split(":");
    const ids = group === "types" ? [...NEWS_TYPES.map(t => t.id), "general"]
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
  // Keep things fresh while the page is open.
  clearInterval(news.refreshTimer);
  clearInterval(news.stockTimer);
  news.refreshTimer = setInterval(() => { if (!document.getElementById("news-view").hidden) newsLoad(true); }, 10 * 60_000);
  news.stockTimer = setInterval(() => { if (!document.getElementById("news-view").hidden) newsLoadStocks(); }, 60_000);
}
