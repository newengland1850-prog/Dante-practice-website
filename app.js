// Wikipedia's API is free and needs no key. `origin=*` enables CORS for browser requests.
const API = "https://en.wikipedia.org/w/api.php";

const frontView = document.getElementById("front-view");
const homeView = document.getElementById("home-view"); // Stacks, the encyclopedia front page
const exploreView = document.getElementById("explore-view");
const subjectView = document.getElementById("subject-view");
const weatherView = document.getElementById("weather-view");
const newsView = document.getElementById("news-view");
const contentView = document.getElementById("content-view");
const content = document.getElementById("content");
const barInput = document.getElementById("bar-input");

async function api(params) {
  const url = new URL(API);
  Object.entries({ ...params, format: "json", formatversion: "2", origin: "*" })
    .forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Wikipedia returned ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.info);
  return data;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function articleHash(title) {
  return "#/article/" + encodeURIComponent(title.replace(/ /g, "_"));
}

function showStatus(msg) {
  content.innerHTML = `<p class="status">${escapeHtml(msg)}</p>`;
}

async function showSearch(query) {
  barInput.value = query;
  document.title = `${query} — Stacks`;
  showStatus("Searching…");
  try {
    const data = await api({
      action: "query",
      list: "search",
      srsearch: query,
      srlimit: "20",
    });
    content.innerHTML = resultsHtml(data, query);
  } catch (err) {
    showStatus(`Something went wrong: ${err.message}`);
  }
}

function resultsHtml(data, label) {
  const hits = data.query.search;
  if (!hits.length) return `<p class="status">No articles found for “${escapeHtml(label)}”.</p>`;
  const total = data.query.searchinfo.totalhits.toLocaleString();
  // Wikipedia's snippets contain only <span class="searchmatch"> markup.
  return `
    <p class="results-head">Showing ${hits.length} of ${total} results for <strong>${escapeHtml(label)}</strong></p>
    ${hits.map(h => `
      <div class="result">
        <a class="title" href="${articleHash(h.title)}">${escapeHtml(h.title)}</a>
        <p class="snippet">${h.snippet}…</p>
        <div class="meta">${h.wordcount.toLocaleString()} words · Updated ${new Date(h.timestamp).toLocaleDateString()}</div>
      </div>`).join("")}`;
}

// Make Wikipedia's HTML work inside this page: absolute image URLs,
// in-app links for other articles, and external links in a new tab.
function cleanArticle(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, style, link").forEach(el => el.remove());

  doc.querySelectorAll("img").forEach(img => {
    if (img.getAttribute("src")?.startsWith("//")) img.src = "https:" + img.getAttribute("src");
    const srcset = img.getAttribute("srcset");
    if (srcset) img.setAttribute("srcset", srcset.replace(/(^|\s)\/\//g, "$1https://"));
  });

  doc.querySelectorAll("a[href]").forEach(a => {
    const href = a.getAttribute("href");
    if (href.startsWith("/wiki/")) {
      const title = decodeURIComponent(href.slice(6).split("#")[0]);
      if (title.includes(":")) {
        a.href = "https://en.wikipedia.org" + href; // File:, Help:, etc.
        a.target = "_blank";
      } else {
        a.setAttribute("href", articleHash(title));
      }
    } else if (href.startsWith("#")) {
      a.removeAttribute("href"); // footnote anchors would clash with the router
    } else {
      if (href.startsWith("//")) a.href = "https:" + href;
      else if (href.startsWith("/")) a.href = "https://en.wikipedia.org" + href;
      a.target = "_blank";
      a.rel = "noopener";
    }
  });

  return doc.body.innerHTML;
}

async function showArticle(title) {
  const display = title.replace(/_/g, " ");
  barInput.value = display;
  document.title = `${display} — Stacks`;
  showStatus("Loading article…");
  try {
    const data = await api({
      action: "parse",
      page: title,
      prop: "text",
      redirects: "1",
      disableeditsection: "1",
    });
    const real = data.parse.title;
    content.innerHTML = `
      <div class="article-head">
        <h1>${escapeHtml(real)}</h1>
        <div class="meta">From Wikipedia, the free encyclopedia ·
          <a href="https://en.wikipedia.org/wiki/${encodeURIComponent(real.replace(/ /g, "_"))}" target="_blank" rel="noopener">View on Wikipedia</a>
        </div>
      </div>
      <article class="article-body">${cleanArticle(data.parse.text)}</article>`;
    document.title = `${real} — Stacks`;
  } catch (err) {
    // Page doesn't exist — fall back to a search for it.
    if (/missing|doesn't exist/i.test(err.message)) {
      location.replace("#/search/" + encodeURIComponent(display));
    } else {
      showStatus(`Something went wrong: ${err.message}`);
    }
  }
}

async function showRandom() {
  showStatus("Finding a random article…");
  try {
    const data = await api({ action: "query", list: "random", rnnamespace: "0", rnlimit: "1" });
    location.replace(articleHash(data.query.random[0].title));
  } catch (err) {
    showStatus(`Something went wrong: ${err.message}`);
  }
}

// ---- Hero banner photos (free-licensed, from Wikimedia Commons) ----

const COMMONS = "https://upload.wikimedia.org/wikipedia/commons/thumb/";
const HERO_PHOTOS = [
  { file: "Long_Room_Interior,_Trinity_College_Dublin,_Ireland_-_Diliff.jpg", path: "4/4b", caption: "The Long Room, Trinity College Dublin" },
  { file: "Tunnel_View,_Yosemite_Valley,_Yosemite_NP_-_Diliff.jpg", path: "1/13", caption: "Yosemite Valley" },
  { file: "LOC_Main_Reading_Room_Highsmith.jpg", path: "a/a8", caption: "Library of Congress Reading Room" },
  { file: "Moraine_Lake_17092005.jpg", path: "c/c5", caption: "Moraine Lake, Banff National Park" },
  { file: "ESO-VLT-Laser-phot-33a-07.jpg", path: "4/43", caption: "Very Large Telescope under the Milky Way" },
  { file: "Aurora_borealis_over_Eielson_Air_Force_Base,_Alaska.jpg", path: "d/d3", caption: "Aurora borealis, Alaska" },
];

function startHeroSlideshow() {
  const container = document.getElementById("hero-slides");
  const credit = document.getElementById("hero-credit");
  const slides = HERO_PHOTOS.map(p => {
    const name = encodeURIComponent(p.file);
    const el = document.createElement("div");
    el.className = "hero-slide";
    el.style.backgroundImage = `url("${COMMONS}${p.path}/${name}/1920px-${name}")`;
    container.appendChild(el);
    return el;
  });

  let i = 0;
  function show(n) {
    slides[i].classList.remove("active");
    i = n % slides.length;
    slides[i].classList.add("active");
    const p = HERO_PHOTOS[i];
    credit.textContent = `Photo: ${p.caption} · Wikimedia Commons`;
    credit.href = "https://commons.wikimedia.org/wiki/File:" + encodeURIComponent(p.file);
  }
  show(0);
  setInterval(() => { if (!homeView.hidden) show(i + 1); }, 7000);
}

// ---- Explore page: subjects and tags ----

function subjectHref(s) {
  return "#/subject/" + encodeURIComponent(s.title.replace(/ /g, "_"));
}

// The front page shows the first 12 subjects as tiles; the Explore page shows them all.
document.getElementById("home-subjects").innerHTML = SUBJECTS.slice(0, 12)
  .map(s => `<a href="${subjectHref(s)}">${escapeHtml(s.label || s.title)}</a>`)
  .join("");

const ALL_TAGS =[...new Set(SUBJECTS.flatMap(s => s.tags))].sort();
const selectedTags = new Set();
let thumbsLoaded = false;

const tagList = document.getElementById("tag-list");
const tagFilter = document.getElementById("tag-filter");
const tagSearchBtn = document.getElementById("tag-search");
const tagClearBtn = document.getElementById("tag-clear");
const subjectGrid = document.getElementById("subject-grid");
const exploreCount = document.getElementById("explore-count");

function renderTags() {
  const q = tagFilter.value.trim().toLowerCase();
  const shown = ALL_TAGS.filter(t => selectedTags.has(t) || t.toLowerCase().includes(q));
  tagList.innerHTML = shown.length
    ? shown.map(t => {
        const n = SUBJECTS.filter(s => s.tags.includes(t)).length;
        return `<button type="button" class="tag" data-tag="${t}" aria-pressed="${selectedTags.has(t)}">${t}<span class="n">${n}</span></button>`;
      }).join("")
    : `<p class="tag-empty">No tags match “${escapeHtml(tagFilter.value)}”.</p>`;
  tagSearchBtn.disabled = selectedTags.size === 0;
  tagClearBtn.hidden = selectedTags.size === 0;
}

function renderSubjects() {
  const matches = SUBJECTS.filter(s => [...selectedTags].every(t => s.tags.includes(t)));
  exploreCount.textContent = selectedTags.size
    ? `${matches.length} subject${matches.length === 1 ? "" : "s"} tagged ${[...selectedTags].join(" + ")}`
    : `${SUBJECTS.length} subjects`;
  subjectGrid.innerHTML = matches.map(s => `
    <a class="subject-card" href="${subjectHref(s)}">
      <div class="thumb-img"${s.thumb ? ` style="background-image:url('${s.thumb}')"` : ""}></div>
      <div class="body">
        <h3>${escapeHtml(s.label || s.title)}</h3>
        <div class="card-tags">${s.tags.map(t => `<span>${t}</span>`).join("")}</div>
      </div>
    </a>`).join("");
}

// One API call fetches a lead image for every subject card.
async function loadSubjectThumbs() {
  if (thumbsLoaded) return;
  thumbsLoaded = true;
  try {
    const data = await api({
      action: "query",
      prop: "pageimages",
      piprop: "thumbnail",
      pithumbsize: "500",
      redirects: "1",
      titles: SUBJECTS.map(s => s.title).join("|"),
    });
    const byTitle = {};
    (data.query.redirects || []).forEach(r => { byTitle[r.from] = r.to; });
    const thumbs = {};
    data.query.pages.forEach(p => { if (p.thumbnail) thumbs[p.title] = p.thumbnail.source; });
    SUBJECTS.forEach(s => { s.thumb = thumbs[byTitle[s.title] || s.title]; });
    renderSubjects();
  } catch {
    thumbsLoaded = false; // cards still work without images; retry next visit
  }
}

function showExplore() {
  document.title = "Explore by subject — Stacks";
  renderTags();
  renderSubjects();
  loadSubjectThumbs();
}

tagList.addEventListener("click", e => {
  const btn = e.target.closest(".tag");
  if (!btn) return;
  const t = btn.dataset.tag;
  selectedTags.has(t) ? selectedTags.delete(t) : selectedTags.add(t);
  renderTags();
  renderSubjects();
});
tagFilter.addEventListener("input", renderTags);
tagClearBtn.addEventListener("click", () => {
  selectedTags.clear();
  tagFilter.value = "";
  renderTags();
  renderSubjects();
});
tagSearchBtn.addEventListener("click", () => {
  location.hash = "#/search/" + encodeURIComponent([...selectedTags].join(" "));
});

// ---- Subject pages: each subject's own tag groups (data in subjects.js) ----

// Picks are kept per subject, one tag per group: picking a new century replaces the old one.
const subjectPicks = {};
// Groups the user has expanded, per subject; kept so re-rendering doesn't collapse them.
const subjectOpen = {};
let currentSubject = null;
let subjectRequest = 0;

const subjFilter = document.getElementById("subj-filter");
const subjGroups = document.getElementById("subj-groups");
const subjChosen = document.getElementById("subj-chosen");
const subjResults = document.getElementById("subj-results");

function findSubject(title) {
  return SUBJECTS.find(s => s.title.toLowerCase() === title.replace(/_/g, " ").toLowerCase());
}

function renderSubjectSidebar() {
  const s = currentSubject;
  const picks = subjectPicks[s.title];
  const q = subjFilter.value.trim().toLowerCase();
  subjGroups.innerHTML = s.groups.map(g => {
    const tags = g.tags.filter(t => t === picks[g.key] || t.toLowerCase().includes(q));
    if (q && !tags.length) return "";
    const open = q || subjectOpen[s.title].has(g.key);
    return `
      <details class="tag-group" data-group="${g.key}"${open ? " open" : ""}>
        <summary>${escapeHtml(g.name)}${picks[g.key] ? `<span class="picked">${escapeHtml(picks[g.key])}</span>` : ""}</summary>
        <div class="tag-list">
          ${tags.map(t => `<button type="button" class="tag" data-tag="${escapeHtml(t)}" aria-pressed="${picks[g.key] === t}">${escapeHtml(t)}</button>`).join("")}
        </div>
      </details>`;
  }).join("") || `<p class="tag-empty">No tags match “${escapeHtml(subjFilter.value)}”.</p>`;
}

function renderSubjectChosen() {
  const picks = subjectPicks[currentSubject.title];
  const chosen = currentSubject.groups.filter(g => picks[g.key]);
  subjChosen.innerHTML = chosen.length
    ? `<span class="label">Tags:</span>` +
      chosen.map(g => `<button type="button" class="chip-remove" data-group="${g.key}" aria-label="Remove ${escapeHtml(picks[g.key])}"><small>${escapeHtml(g.name)}:</small>${escapeHtml(picks[g.key])} ×</button>`).join("") +
      `<button type="button" class="btn-link" data-clear>Clear all</button>`
    : "";
}

async function runSubjectSearch() {
  const s = currentSubject;
  const picks = subjectPicks[s.title];
  const chosen = s.groups.filter(g => picks[g.key]);
  const name = s.label || s.title;
  if (!chosen.length) {
    const g1 = s.groups[0], g2 = s.groups[1];
    subjResults.innerHTML = `<p class="status">Pick one or more tags on the left to find ${escapeHtml(name)} articles. For example, try <strong>${escapeHtml(g1.tags[0])}</strong> + <strong>${escapeHtml(g2.tags[1] || g2.tags[0])}</strong>.</p>`;
    return;
  }
  // Every search includes the subject's own keyword so results stay on topic.
  const query = s.query + " " + chosen.map(g => g.quote ? `"${picks[g.key]}"` : picks[g.key]).join(" ");
  const label = name + " · " + chosen.map(g => picks[g.key]).join(" · ");
  const req = ++subjectRequest;
  subjResults.innerHTML = `<p class="status">Searching…</p>`;
  try {
    const data = await api({ action: "query", list: "search", srsearch: query, srlimit: "20" });
    if (req === subjectRequest) subjResults.innerHTML = resultsHtml(data, label);
  } catch (err) {
    if (req === subjectRequest) subjResults.innerHTML = `<p class="status">Something went wrong: ${escapeHtml(err.message)}</p>`;
  }
}

function updateSubject() {
  renderSubjectSidebar();
  renderSubjectChosen();
  runSubjectSearch();
}

function showSubject(title) {
  const s = findSubject(title);
  if (!s) {
    location.replace(articleHash(title)); // not a subject page — just open the article
    return;
  }
  if (currentSubject !== s) subjFilter.value = "";
  currentSubject = s;
  subjectPicks[s.title] ||= {};
  // The first two groups start open; longer lists (like Country) start closed.
  subjectOpen[s.title] ||= new Set(s.groups.slice(0, 2).map(g => g.key));
  const name = s.label || s.title;
  subjectView.style.setProperty("--subject-color", s.color);
  document.title = `${name} — Stacks`;
  document.getElementById("subj-title").textContent = name;
  document.getElementById("subj-intro").textContent = s.intro;
  const overview = document.getElementById("subj-overview");
  overview.href = articleHash(s.title);
  overview.textContent = `Read the ${name} overview →`;
  updateSubject();
}

subjGroups.addEventListener("click", e => {
  const btn = e.target.closest(".tag");
  if (!btn) return;
  const picks = subjectPicks[currentSubject.title];
  const key = btn.closest(".tag-group").dataset.group;
  const t = btn.dataset.tag;
  picks[key] = picks[key] === t ? undefined : t;
  updateSubject();
});
subjChosen.addEventListener("click", e => {
  const chip = e.target.closest(".chip-remove");
  if (chip) subjectPicks[currentSubject.title][chip.dataset.group] = undefined;
  else if (e.target.closest("[data-clear]")) subjectPicks[currentSubject.title] = {};
  else return;
  updateSubject();
});
subjFilter.addEventListener("input", renderSubjectSidebar);
// `toggle` doesn't bubble, so listen in the capture phase.
subjGroups.addEventListener("toggle", e => {
  if (subjFilter.value.trim()) return; // filtering opens groups temporarily
  const open = subjectOpen[currentSubject.title];
  const key = e.target.dataset.group;
  e.target.open ? open.add(key) : open.delete(key);
}, true);

// ---- Router ----

function route() {
  const hash = location.hash.slice(1) || "/";
  const [, view, ...rest] = hash.split("/");
  const arg = decodeURIComponent(rest.join("/"));

  const isContent = view === "search" || view === "article" || view === "random";
  const isExplore = view === "explore";
  const isSubject = view === "subject" || view === "history";
  const isWeather = view === "weather";
  const isNews = view === "news";
  const isStacks = view === "stacks";
  const isFront = !(isContent || isExplore || isSubject || isWeather || isNews || isStacks);
  frontView.hidden = !isFront;
  homeView.hidden = !isStacks;
  newsView.hidden = !isNews;
  weatherView.hidden = !isWeather;
  if (!isWeather) stopWxFx(); // pause the weather animation off-page
  exploreView.hidden = !isExplore;
  subjectView.hidden = !isSubject;
  contentView.hidden = !isContent;
  window.scrollTo(0, 0);

  if (isExplore) {
    showExplore();
  } else if (isNews) {
    showNews();
  } else if (isWeather) {
    showWeather();
  } else if (isSubject) {
    showSubject(view === "history" ? "History" : arg);
  } else if (isFront) {
    showFront();
  } else if (isStacks) {
    document.title = "Stacks — Search the Encyclopedia";
  } else if (view === "search") {
    showSearch(arg);
  } else if (view === "article") {
    showArticle(arg);
  } else {
    showRandom();
  }
}

function onSubmit(input) {
  return e => {
    e.preventDefault();
    const q = input.value.trim();
    if (q) location.hash = "#/search/" + encodeURIComponent(q);
  };
}

document.getElementById("hero-form").addEventListener("submit", onSubmit(document.getElementById("hero-input")));
document.getElementById("bar-form").addEventListener("submit", onSubmit(barInput));
// Phone menu: open/close, and close after picking a tab.
const menuBtn = document.getElementById("menu-btn");
menuBtn.addEventListener("click", () => {
  const open = document.body.classList.toggle("menu-open");
  menuBtn.setAttribute("aria-expanded", String(open));
});
document.getElementById("topnav").addEventListener("click", e => {
  if (e.target.closest("a")) {
    document.body.classList.remove("menu-open");
    menuBtn.setAttribute("aria-expanded", "false");
  }
});

window.addEventListener("hashchange", route);
startHeroSlideshow();
route();

// Installable app: the service worker only runs from a web address (http://localhost:8080
// or a real site), not when index.html is opened as a file.
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => { /* the site works without it */ });
}
