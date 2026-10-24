// US News tab (#/usnews): major US outlets from left to right, with a bias check on every
// story. Feeds and article text come through the local server (server.js). Uses NEWS_TYPES,
// newsClassify(), newsApi(), newsCheckServer() and newsTimeAgo() from news.js, and
// escapeHtml() from app.js.
//
// The bias check has two parts:
//  1. The outlet's overall rating (US_LEANS / US_NEWS_SOURCES in news-sources.js).
//  2. The story's own wording: buzzwords and phrases each side tends to use, plus loaded
//     (emotional) words. Headlines and summaries are checked right away; "Check full
//     article" reads the whole story when the site allows it.

// Phrases more often used by one side. Matching is case-insensitive, on whole words.
// Curly and straight apostrophes both match ("['’]").
const USN_BUZZ = {
  left: [
    // Immigration
    "undocumented (?:immigrants?|migrants?|people|workers?|residents?|individuals)", "asylum[- ]seekers?", "immigrants?['’]? rights",
    "anti-immigrant", "xenophob\\w*", "Dreamers", "mixed-status families", "family separations?", "ICE raids?", "masked (?:ICE )?agents",
    "detention camps?", "concentration camps?", "deportation machine", "newcomers", "migrant children",
    // Climate and environment
    "climate crisis", "climate emergency", "climate justice", "climate deniers?", "climate denial", "climate action",
    "climate refugees?", "big oil", "fossil fuel (?:industry|companies)", "polluters", "carbon pollution", "environmental justice",
    "clean energy (?:jobs|economy|transition)",
    // Guns
    "gun violence", "gun safety", "common[- ]sense gun", "assault weapons?", "assault-style", "weapons of war", "gun lobby",
    "ghost guns?", "gun reform",
    // Abortion and health
    "reproductive (?:rights|freedom|health ?care|justice)", "abortion rights", "abortion access", "access to abortion", "pro-choice",
    "bodily autonomy", "abortion bans?", "forced birth", "anti-abortion", "pregnant people", "birthing people",
    "health care is a (?:human )?right", "Medicare for All", "universal health care", "public option",
    "cuts to (?:Medicaid|Medicare|Social Security)", "Medicaid cuts",
    // Race, gender, identity
    "systemic racism", "structural racism", "white supremac\\w*", "white nationalis\\w+", "Christian nationalis\\w+",
    "white privilege", "racial (?:justice|equity|reckoning)", "health equity", "people of color", "BIPOC", "Latinx",
    "Black and brown", "marginali[sz]ed", "social justice", "underserved communities", "diversity, equity",
    "intersectional\\w*", "lived experience", "racial profiling", "police brutality", "police violence", "mass incarceration",
    "criminal justice reform", "over-policing", "hate crimes?", "bigot\\w*", "transphob\\w*", "homophob\\w*", "Islamophob\\w*",
    "misogyn\\w*", "toxic masculinity", "gender-affirming", "affirming care", "LGBTQ\\+?", "LGBTQIA\\+?",
    "trans (?:youth|kids|people|rights|Americans|community)", "anti-trans", "anti-LGBTQ", "sex assigned at birth",
    "book bans?", "book banning", "Don['’]t Say Gay", "anti-drag",
    // Democracy and Trump
    "far-right", "far right", "right-wing extremis\\w+", "MAGA (?:extremists?|Republicans?|movement)", "ultra-MAGA", "extreme MAGA",
    "election deniers?", "election denial", "insurrection(?:ists?)?", "coup attempt", "fake electors", "election subversion",
    "the Big Lie", "false claims? of (?:election )?fraud", "baseless claims?", "falsely claim\\w*", "without evidence",
    "anti-democratic", "threat to democracy", "attack on democracy", "democracy is on the ballot", "authoritarian\\w*",
    "autocra\\w+", "strongman", "would-be dictator", "fascis\\w+", "Trumpism", "Trump loyalists?", "convicted felon",
    "Project 2025", "Christian right", "religious right", "anti-government extremists?",
    "voter suppression", "voting rights", "disenfranchise\\w*", "voter purges?", "misinformation", "disinformation",
    "conspiracy theor\\w+", "debunked",
    // Economy
    "corporate greed", "greedflation", "billionaires?", "billionaire class", "ultra-wealthy", "the 1%",
    "tax cuts for the (?:rich|wealthy)", "tax breaks for (?:billionaires|the wealthy|the rich|corporations)", "tax the rich",
    "(?:pay|paying) their fair share", "trickle-down", "income inequality", "wealth gap", "living wage", "union-busting",
    "worker power", "working families", "collective bargaining", "social safety net", "student debt (?:relief|cancellation)",
    "unhoused", "food insecurity", "price gouging", "price-gouging", "dark money", "Citizens United", "corporate profits",
  ],
  right: [
    // Immigration
    "illegal aliens?", "illegal immigrants?", "illegal migrants?", "illegals", "illegal crossers", "criminal aliens?",
    "border jumpers", "open borders?", "open-border", "border crisis", "border invasion", "migrant invasion", "invasion at the (?:southern )?border",
    "military-age men", "anchor bab(?:y|ies)", "amnesty", "sanctuary (?:cities|city|states?|jurisdictions?)", "chain migration",
    "catch and release", "migrant crime", "Remain in Mexico", "build the wall", "non-?citizen voting", "noncitizens voting",
    // Abortion and family
    "pro-life", "pro-abortion", "unborn (?:child|children|babies|baby|lives?)", "abortionists?", "abortion industry", "abortion lobby",
    "late-term abortions?", "abortion on demand", "infanticide", "sanctity of life", "culture of life", "heartbeat (?:law|bill)",
    "family values", "traditional values", "faith and family", "Judeo-Christian", "God-given rights", "religious liberty", "religious freedom",
    // Culture
    "radical left", "far-left", "far left", "hard left", "leftists?", "leftist mob", "woke\\w*", "wokeness", "woke mob", "DEI",
    "cancel culture", "political correctness", "PC culture", "snowflakes?", "virtue signal\\w*", "social justice warriors?",
    "identity politics", "anti-white", "reverse racism", "racial preferences", "critical race theory", "CRT",
    "gender ideology", "transgender ideology", "trans agenda", "gender confusion", "transgender craze",
    "biological (?:males?|men|women|females?|sex)", "men in women['’]s sports", "boys in girls['’] (?:sports|locker rooms|bathrooms)",
    "trans-identifying", "transgender-identif(?:ying|ied)", "chemical castration", "mutilat\\w+", "groomers?", "indoctrinat\\w+",
    "drag queen story hour", "parental rights", "parents['’] rights", "school choice", "government schools", "teachers['’]? unions?",
    "union bosses",
    // Guns and crime
    "Second Amendment", "2A", "gun rights", "Second Amendment rights", "constitutional carry", "law-abiding (?:citizens|gun owners|Americans)",
    "gun grab\\w*", "gun-grabbers?", "anti-gun", "soft on crime", "soft-on-crime", "defund the police", "pro-criminal",
    "rogue prosecutors?", "Soros-(?:backed|funded)", "career criminals", "law and order", "back the blue", "thin blue line",
    "war on (?:coal|cops|police|Christmas|gas)", "radical Islam\\w*",
    // Elections, media, government
    "election integrity", "voter fraud", "election fraud", "rigged election", "stolen election", "ballot harvesting", "illegal voting",
    "mainstream media", "legacy media", "fake news", "corporate media", "regime media", "liberal media", "left-wing media",
    "Democrat media", "propaganda media", "media establishment", "Big Tech censorship", "censorship industrial complex",
    "Russia hoax", "Russiagate", "Biden crime family", "laptop from hell", "deep state", "weaponi[sz]ation", "weaponized (?:DOJ|FBI|justice)",
    "lawfare", "witch hunt", "two-tier(?:ed)? justice", "J6 hostages", "the swamp", "drain the swamp", "uniparty", "RINOs?",
    "Democrat Party", "Democrat-run", "Democrat-led", "Democrat (?:lawmakers|leaders|senators?|governors?|officials|mayors?|cities|states|policies|voters)",
    "Biden regime", "Bidenomics", "Bidenflation", "Trump Derangement", "TDS", "Never-?Trumpers?", "Trump-hating", "America First",
    "patriotic Americans", "hardworking Americans", "forgotten Americans", "Communist China", "CCP",
    // Economy and government size
    "big government", "tax-and-spend", "government overreach", "federal overreach", "regulatory overreach", "unelected bureaucrats",
    "administrative state", "red tape", "job-killing", "tax hikes?", "socialis[mt]\\w*", "communis[mt]\\w*", "Marxis[mt]\\w*",
    "globalis[mt]\\w*", "coastal elites?", "liberal elites?", "job creators", "death tax", "nanny state", "handouts", "welfare state",
    "free market", "free enterprise", "economic freedom", "taxpayer dollars", "taxpayer-funded", "wasteful spending",
    "reckless spending", "out-of-control spending",
    // Energy
    "climate alarmis\\w+", "climate hysteria", "climate cult", "Green New Scam", "green agenda", "EV mandates?",
    "electric vehicle mandates?", "energy independence", "energy dominance", "drill,? baby,? drill",
  ],
  loaded: [
    "slams?", "slammed", "blasts?", "blasted", "rips", "ripped into", "destroys?", "torch(?:es|ed)", "eviscerat\\w+", "obliterat\\w+",
    "lashes out", "fires back", "tears into", "unloads on", "claps back", "skewer\\w*", "trashes", "mocks", "hammer(?:s|ed)",
    "shocking", "outrage\\w*", "furious", "meltdown", "bombshell", "explosive", "scathing", "disastrous", "chaos", "chaotic",
    "unhinged", "brutal", "humiliat\\w+", "stunning", "fury", "firestorm", "erupts?", "savage\\w*", "devastating", "horrific",
    "terrifying", "insane", "absurd", "disgrace\\w*", "liars?", "radical", "extreme", "extremists?", "dangerous", "slaughter\\w*",
    "nightmare", "bloodbath", "carnage", "catastroph\\w+", "scandal\\w*", "smear\\w*", "propaganda", "vile", "evil", "deranged",
    "lunatics?", "crazed", "jaw-dropping", "embarrass\\w+", "hypocri\\w+", "panic\\w*",
  ],
};
const usnWords = list => `(?<![\\w-])(?:${list.join("|")})(?![\\w-])`;
const USN_RE = Object.fromEntries(Object.entries(USN_BUZZ).map(([k, list]) => [k, new RegExp(usnWords(list), "gi")]));
const USN_ANY = new RegExp([USN_BUZZ.left, USN_BUZZ.right, USN_BUZZ.loaded].map(usnWords).join("|"), "gi");
const USN_IS = { l: new RegExp(`^${usnWords(USN_BUZZ.left)}$`, "i"), r: new RegExp(`^${usnWords(USN_BUZZ.right)}$`, "i") };

const usn = {
  items: [], shown: 30, loading: false, loadedAt: 0, refreshTimer: 0, ready: false,
  prefs: null, all: null, full: {}, // link → result of checking the full article
};

const usnSource = id => US_NEWS_SOURCES.find(s => s.id === id);
const usnLean = lean => US_LEANS.find(l => l.id === lean);

// ---- Bias check ----

function usnFind(text, kind) {
  const counts = {};
  for (const m of (text || "").matchAll(USN_RE[kind])) {
    const w = m[0].toLowerCase();
    counts[w] = (counts[w] || 0) + 1;
  }
  return Object.entries(counts).map(([word, n]) => ({ word, n })).sort((a, b) => b.n - a.n);
}

// Wording score from -1 (left) to 1 (right); each word counts up to 3 times so one
// repeated phrase can't decide a long article on its own.
function usnAnalyze(text) {
  const left = usnFind(text, "left"), right = usnFind(text, "right");
  // Loaded words inside a side's phrase ("radical" in "radical left") count once, for that side.
  const loaded = usnFind((text || "").replace(USN_RE.left, " ").replace(USN_RE.right, " "), "loaded");
  const sum = list => list.reduce((t, w) => t + Math.min(w.n, 3), 0);
  const L = sum(left), R = sum(right);
  const score = L + R ? (R - L) / (L + R + 1) : 0;
  let verdict = "neutral";
  if (L + R) verdict = score <= -0.3 ? "left" : score >= 0.3 ? "right" : "mixed";
  return { left, right, loaded, score, verdict, total: L + R };
}

const USN_VERDICTS = {
  neutral: "Neutral wording",
  mixed: "Mixed wording",
  left: "Wording leans left",
  right: "Wording leans right",
};

// Wrap buzzwords in <mark> (left blue, right red, loaded amber). Escapes everything else.
function usnHighlight(text) {
  let out = "", last = 0;
  for (const m of text.matchAll(USN_ANY)) {
    const kind = USN_IS.l.test(m[0]) ? "l" : USN_IS.r.test(m[0]) ? "r" : "x";
    out += escapeHtml(text.slice(last, m.index)) + `<mark class="bz-${kind}">${escapeHtml(m[0])}</mark>`;
    last = m.index + m[0].length;
  }
  return out + escapeHtml(text.slice(last));
}

// ---- Preferences ----

function usnLoadPrefs() {
  usn.all = {
    leans: US_LEANS.map(l => l.id), wording: ["left", "neutral", "mixed", "right"],
    types: NEWS_TYPES.map(t => t.id).concat("general"), sources: US_NEWS_SOURCES.map(s => s.id),
  };
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem("usnews-prefs") || "{}"); } catch { /* defaults */ }
  // Outlets and leanings added since the preferences were saved start switched on.
  const known = saved.known || { leans: [-2, -1, 0, 1, 2], sources: [] };
  const added = (group, list) => usn.all[group].filter(v => !known[group].includes(v) && !list.includes(v));
  if (saved.leans) saved.leans.push(...added("leans", saved.leans));
  if (saved.sources) saved.sources.push(...added("sources", saved.sources));
  usn.prefs = {
    leans: new Set(saved.leans || usn.all.leans),
    wording: new Set(saved.wording || usn.all.wording),
    types: new Set(saved.types || usn.all.types),
    sources: new Set(saved.sources || usn.all.sources),
    balance: saved.balance !== false,
  };
}

function usnSavePrefs() {
  const p = usn.prefs;
  try {
    localStorage.setItem("usnews-prefs", JSON.stringify({
      leans: [...p.leans], wording: [...p.wording], types: [...p.types], sources: [...p.sources], balance: p.balance,
      known: { leans: usn.all.leans, sources: usn.all.sources },
    }));
  } catch { /* fine without it */ }
}

// ---- Loading ----

async function usnLoad(force) {
  if (usn.loading) return;
  if (!force && usn.items.length && Date.now() - usn.loadedAt < 5 * 60_000) { usnRender(); return; }
  usn.loading = true;
  const status = document.getElementById("usn-status");
  const queue = [...US_NEWS_SOURCES];
  const all = [];
  let done = 0;
  status.textContent = `Loading news… 0 of ${US_NEWS_SOURCES.length} outlets`;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const source = queue.shift();
      try {
        const data = await newsApi(`/api/feed?id=${encodeURIComponent(source.id)}`);
        for (const it of data.items) {
          all.push({ ...it, source: source.id, type: newsClassify(it, { kind: "news" }), flash: newsBreaking(it), check: usnAnalyze(`${it.title}. ${it.summary}`) });
        }
      } catch { /* one outlet failing shouldn't stop the rest */ }
      done++;
      status.textContent = `Loading news… ${done} of ${US_NEWS_SOURCES.length} outlets`;
    }
  }));
  const seen = new Set();
  usn.items = all
    .filter(it => !seen.has(it.link) && seen.add(it.link))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  usn.loadedAt = Date.now();
  usn.loading = false;
  usn.shown = 30;
  status.textContent = `Updated ${new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
  usnRender();
}

// ---- Rendering ----

const usnVerdictOf = it => (usn.full[it.link] && !usn.full[it.link].error ? usn.full[it.link] : it.check).verdict;

function usnFiltered() {
  const p = usn.prefs;
  const list = usn.items.filter(it => {
    const s = usnSource(it.source);
    return p.sources.has(s.id) && p.leans.has(s.lean) && p.types.has(it.type) && p.wording.has(usnVerdictOf(it));
  });
  if (!p.balance) return list;
  // Balanced: take turns from far left to far right, newest first in each group.
  const groups = US_LEANS.map(l => list.filter(it => usnSource(it.source).lean === l.id));
  const out = [];
  for (let i = 0; out.length < list.length; i++) for (const g of groups) if (g[i]) out.push(g[i]);
  return out;
}

function usnBadge(lean) {
  const l = usnLean(lean);
  return `<span class="usn-lean lean-${l.key}">${l.name}</span>`;
}

// Slant from -100 (left) to +100 (right). The outlet's rating counts for most of it; the
// story's wording counts more the more buzzwords it has (up to 60% at four or more).
function usnSlant(it) {
  const s = usnSource(it.source);
  const full = usn.full[it.link];
  const c = full && !full.error ? full : it.check;
  const outlet = Math.round(s.lean * 100 / 3);
  const wording = Math.round(c.score * 100);
  const weight = Math.min(0.6, c.total * 0.15);
  return { outlet, wording, overall: Math.round(outlet * (1 - weight) + wording * weight) };
}

// "Left 42", "Center 6" or "Right 63".
function usnSlantLabel(v) {
  const side = Math.abs(v) < 15 ? "Center" : v < 0 ? "Left" : "Right";
  return { side, text: `${side} ${Math.abs(v)}` };
}

const usnSigned = v => (v > 0 ? `+${v}` : v < 0 ? `−${-v}` : "0");

function usnSlantBar(v) {
  const { side, text } = usnSlantLabel(v);
  return `
    <div class="usn-slant" title="Slant ${usnSigned(v)} on a scale from −100 (left) to +100 (right)">
      <span class="usn-check-label">Slant</span>
      <div class="usn-slant-track">
        <span class="usn-slant-mark" style="left:${(v + 100) / 2}%"></span>
        <span class="usn-slant-scale"><i>Left</i><i>Center</i><i>Right</i></span>
      </div>
      <b class="usn-slant-num s-${side.toLowerCase()}">${text}</b>
    </div>`;
}

function usnCheckHtml(it) {
  const s = usnSource(it.source);
  const full = usn.full[it.link];
  const c = full && !full.error ? full : it.check;
  const sl = usnSlant(it);
  const words = (list, cls) => list.slice(0, 6).map(w => `<span class="bz-${cls}">${escapeHtml(w.word)}${w.n > 1 ? ` ×${w.n}` : ""}</span>`).join("");
  const scope = full && !full.error ? `the whole article (${full.words.toLocaleString()} words)` : "headline and summary";
  const canCheck = s.format !== "google";
  return `
    <div class="usn-check">
      ${usnSlantBar(sl.overall)}
      <div class="usn-check-row">
        <span class="usn-pair"><span class="usn-check-label">Outlet</span>${usnBadge(s.lean)}<span class="usn-score">${usnSigned(sl.outlet)}</span></span>
        <span class="usn-pair"><span class="usn-check-label">Wording</span><span class="usn-verdict v-${c.verdict}">${USN_VERDICTS[c.verdict]}</span><span class="usn-score">${usnSigned(sl.wording)}${c.total ? ` · ${c.total} buzzword${c.total > 1 ? "s" : ""}` : ""}</span></span>
      </div>
      ${c.left.length || c.right.length || c.loaded.length ? `<div class="usn-words">
        ${c.left.length ? `<span class="usn-wl">Left-coded:</span>${words(c.left, "l")}` : ""}
        ${c.right.length ? `<span class="usn-wl">Right-coded:</span>${words(c.right, "r")}` : ""}
        ${c.loaded.length ? `<span class="usn-wl">Loaded:</span>${words(c.loaded, "x")}` : ""}
      </div>` : ""}
      <div class="usn-check-foot">
        <span>Checked ${scope}</span>
        ${full && full.error ? `<span class="usn-note">${escapeHtml(full.error)}</span>` : ""}
        ${canCheck && !full ? `<button type="button" class="usn-full" data-link="${escapeHtml(it.link)}">Check full article</button>` : ""}
        ${!canCheck ? `<span class="usn-note">Full-article check isn't available for ${escapeHtml(s.name)}</span>` : ""}
      </div>
    </div>`;
}

function usnRender() {
  const list = usnFiltered();
  const feed = document.getElementById("usn-feed");
  document.getElementById("usn-count").textContent = usn.items.length
    ? `${list.length} stories from ${new Set(list.map(i => i.source)).size} outlets`
    : "";
  usnRenderBalance();
  if (!list.length) {
    feed.innerHTML = usn.items.length ? `<p class="news-empty">No stories match your filters. Try turning on more outlets, leanings or news types.</p>` : "";
    document.getElementById("usn-more").hidden = true;
    return;
  }
  feed.innerHTML = list.slice(0, usn.shown).map((it, i) => {
    const s = usnSource(it.source);
    const type = NEWS_TYPES.find(t => t.id === it.type)?.name || "General";
    // Google News links can't be read for a picture.
    const noImg = !it.image && s.format === "google";
    return `
      <article class="news-card usn-card${i === 0 ? " lead" : ""}${noImg ? " no-img" : ""}" data-link="${escapeHtml(it.link)}">
        <a class="news-img" href="${escapeHtml(it.link)}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">
          ${it.image ? `<img src="${escapeHtml(it.image)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : noImg ? "" : `<span class="news-img-wait"></span>`}
        </a>
        <div class="news-body">
          <div class="news-meta">
            ${newsFlashBadge(it.flash)}
            <span class="usn-dot lean-${usnLean(s.lean).key}" aria-hidden="true"></span>
            <span class="news-source">${escapeHtml(s.name)}</span>
            <span>·</span><span>${newsTimeAgo(it.date)}</span>
            <span class="news-type">${type}</span>
          </div>
          <h3><a href="${escapeHtml(it.link)}" target="_blank" rel="noopener">${usnHighlight(it.title)}</a></h3>
          ${it.summary ? `<p class="news-summary">${usnHighlight(it.summary)}</p>` : ""}
          ${usnCheckHtml(it)}
          <div class="usn-paywall-slot">${usnPaywallHtml(it)}</div>
          <div class="news-links"><a href="${escapeHtml(it.link)}" target="_blank" rel="noopener">Read at ${escapeHtml(s.name)}</a></div>
        </div>
      </article>`;
  }).join("");
  document.getElementById("usn-more").hidden = list.length <= usn.shown;
  usnWatchImages();
  usnWatchPaywalls();
  newsRenderBreaking(document.getElementById("usn-breaking"), list, it => usnSource(it.source).name);
}

// ---- Subscription disclaimer ----

const USN_LOCK = `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-.5V4.5A3.5 3.5 0 0 0 8 1Zm-2 6V4.5a2 2 0 1 1 4 0V7H6Z"/></svg>`;

// Which kind of paywall applies: the article's own marker when known, else the outlet's.
function usnPaywallKind(it) {
  const s = usnSource(it.source);
  const a = it.access;
  if (a && a.free === true) return null;
  if (a && a.free === false) return s.paywall === "metered" || a.tier === "metered" ? "metered" : "hard";
  return s.paywall || null;
}

function usnPaywallHtml(it) {
  const kind = usnPaywallKind(it);
  if (!kind) return "";
  const name = escapeHtml(usnSource(it.source).name);
  const text = {
    hard: `<b>Subscription required.</b> You'll need a subscription to ${name} to read this article.`,
    metered: `<b>May need a subscription.</b> ${name} lets you read a limited number of articles for free, then asks you to subscribe.`,
    some: `<b>May need a subscription.</b> Some ${name} articles are for subscribers only.`,
  }[kind];
  return `<p class="usn-paywall pw-${kind}">${USN_LOCK}<span>${text}</span></p>`;
}

// Check each article's own paywall marker when its card comes into view.
let usnPaywallObserver = null;
function usnWatchPaywalls() {
  usnPaywallObserver?.disconnect();
  usnPaywallObserver = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      usnPaywallObserver.unobserve(e.target);
      const card = e.target;
      const it = usn.items.find(x => x.link === card.dataset.link);
      if (!it || it.access) continue;
      newsApi(`/api/access?url=${encodeURIComponent(it.link)}`).then(a => {
        it.access = a;
        card.querySelector(".usn-paywall-slot").innerHTML = usnPaywallHtml(it);
      }).catch(() => { it.access = { free: null }; });
    }
  }, { rootMargin: "200px" });
  document.querySelectorAll("#usn-feed .news-card").forEach(card => {
    const it = usn.items.find(x => x.link === card.dataset.link);
    const s = it && usnSource(it.source);
    // Google News links and subscriber-only outlets don't need a per-article check.
    if (it && !it.access && s.format !== "google" && s.paywall !== "hard") usnPaywallObserver.observe(card);
  });
}

// The band across the top: how all loaded stories split by outlet rating, by wording and by
// slant score, with story counts, plus the average slant of the stories in your feed.
function usnRenderBalance() {
  const el = document.getElementById("usn-balance");
  const pool = usn.items;
  if (!pool.length) { el.innerHTML = ""; return; }
  const bar = (parts, label) => {
    const total = parts.reduce((t, p) => t + p.n, 0) || 1;
    return `<div class="usn-bal-row"><span class="usn-bal-label">${label}</span><div class="usn-bal-bar">${parts.filter(p => p.n).map(p => {
      const pct = Math.round(p.n / total * 100);
      const text = pct >= 16 ? `${p.name} ${pct}% · ${p.n}` : pct >= 7 ? `${pct}%` : "";
      return `<span class="${p.cls}${pct < 18 ? " sm" : ""}" style="flex:${p.n}" title="${p.name}: ${p.n} stories (${pct}%)">${text}</span>`;
    }).join("")}</div></div>`;
  };
  const byLean = US_LEANS.map(l => ({ name: l.name, cls: `lean-${l.key}`, n: pool.filter(it => usnSource(it.source).lean === l.id).length }));
  const byWording = [
    { name: "Leans left", cls: "w-left", v: "left" }, { name: "Mixed", cls: "w-mixed", v: "mixed" },
    { name: "Neutral", cls: "w-neutral", v: "neutral" }, { name: "Leans right", cls: "w-right", v: "right" },
  ].map(w => ({ ...w, n: pool.filter(it => usnVerdictOf(it) === w.v).length }));
  const sides = pool.map(it => usnSlantLabel(usnSlant(it).overall).side);
  const bySlant = [
    { name: "Left", cls: "w-left", n: sides.filter(x => x === "Left").length },
    { name: "Center", cls: "w-neutral", n: sides.filter(x => x === "Center").length },
    { name: "Right", cls: "w-right", n: sides.filter(x => x === "Right").length },
  ];
  // Average slant of the stories your filters let through.
  const feed = usnFiltered();
  const avg = feed.length ? Math.round(feed.reduce((t, it) => t + usnSlant(it).overall, 0) / feed.length) : 0;
  const avgLabel = usnSlantLabel(avg);
  el.innerHTML = `
    <div class="wrap usn-bal-inner">
      <div class="usn-bal-title">
        <b>Today's coverage</b>
        <span>${pool.length} stories · ${US_NEWS_SOURCES.length} outlets</span>
        <span class="usn-bal-avg" title="Average slant of the ${feed.length} stories in your feed, from −100 (left) to +100 (right)">
          Your feed: <b class="usn-slant-num s-${avgLabel.side.toLowerCase()}">${avgLabel.text}</b>
        </span>
      </div>
      <div class="usn-bal-bars">${bar(byLean, "By outlet")}${bar(byWording, "By wording")}${bar(bySlant, "By slant")}</div>
    </div>`;
}

let usnImgObserver = null;
function usnWatchImages() {
  usnImgObserver?.disconnect();
  usnImgObserver = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      usnImgObserver.unobserve(e.target);
      const card = e.target.closest(".news-card");
      const item = usn.items.find(it => it.link === card.dataset.link);
      newsApi(`/api/image?url=${encodeURIComponent(card.dataset.link)}`).then(d => {
        if (d.image) {
          if (item) item.image = d.image;
          e.target.outerHTML = `<img src="${escapeHtml(d.image)}" alt="" loading="lazy" referrerpolicy="no-referrer">`;
        } else card.classList.add("no-img");
      }).catch(() => card.classList.add("no-img"));
    }
  }, { rootMargin: "300px" });
  document.querySelectorAll("#usn-feed .news-img-wait").forEach(el => usnImgObserver.observe(el));
  document.querySelectorAll("#usn-feed .news-img img").forEach(img => {
    img.addEventListener("error", () => img.closest(".news-card")?.classList.add("no-img"), { once: true });
  });
}

async function usnCheckFull(link, btn) {
  btn.disabled = true;
  btn.textContent = "Reading the article…";
  try {
    const { text, words } = await newsApi(`/api/article?url=${encodeURIComponent(link)}`);
    usn.full[link] = words > 80 ? { ...usnAnalyze(text), words } : { error: "Couldn't read enough of the article (it may be behind a paywall)." };
  } catch {
    usn.full[link] = { error: "This site doesn't allow the article to be read here (paywall or blocked)." };
  }
  // Re-draw just this card's check box, and the balance band.
  const card = [...document.querySelectorAll("#usn-feed .news-card")].find(c => c.dataset.link === link);
  const it = usn.items.find(x => x.link === link);
  if (card && it) card.querySelector(".usn-check").outerHTML = usnCheckHtml(it);
  usnRenderBalance();
}

// ---- Sidebar ----

function usnRenderSidebar() {
  const p = usn.prefs;
  const chip = (group, id, label, on, extra = "") =>
    `<label class="news-check"><input type="checkbox" data-group="${group}" value="${id}"${on ? " checked" : ""}> ${extra}<span>${escapeHtml(label)}</span></label>`;
  document.getElementById("usn-leans").innerHTML = US_LEANS.map(l =>
    chip("leans", l.id, l.name, p.leans.has(l.id), `<span class="usn-dot lean-${l.key}"></span>`)).join("");
  document.getElementById("usn-wording").innerHTML = ["left", "mixed", "neutral", "right"].map(v =>
    chip("wording", v, USN_VERDICTS[v], p.wording.has(v))).join("");
  document.getElementById("usn-types").innerHTML = [...NEWS_TYPES, { id: "general", name: "General news" }]
    .map(t => chip("types", t.id, t.name, p.types.has(t.id))).join("");
  document.getElementById("usn-sources").innerHTML = US_LEANS.map(l => `
    <div class="news-source-group">
      <div class="news-source-country"><span class="usn-dot lean-${l.key}"></span> ${l.name}</div>
      ${US_NEWS_SOURCES.filter(s => s.lean === l.id).map(s => chip("sources", s.id, s.name, p.sources.has(s.id))).join("")}
    </div>`).join("");
  document.getElementById("usn-balance-toggle").checked = p.balance;
}

function usnBindEvents() {
  const side = document.getElementById("usn-side");
  side.addEventListener("change", e => {
    const box = e.target;
    if (box.id === "usn-balance-toggle") usn.prefs.balance = box.checked;
    else if (box.dataset.group) {
      const set = usn.prefs[box.dataset.group];
      const v = box.dataset.group === "leans" ? Number(box.value) : box.value;
      box.checked ? set.add(v) : set.delete(v);
    } else return;
    usnSavePrefs();
    usn.shown = 30;
    usnRender();
  });
  side.addEventListener("click", e => {
    const btn = e.target.closest("[data-all]");
    if (!btn) return;
    const [group, mode] = btn.dataset.all.split(":");
    usn.prefs[group] = new Set(mode === "all" ? usn.all[group] : []);
    usnSavePrefs();
    usnRenderSidebar();
    usnRender();
  });
  document.getElementById("usn-feed").addEventListener("click", e => {
    const btn = e.target.closest(".usn-full");
    if (btn) usnCheckFull(btn.dataset.link, btn);
  });
  document.getElementById("usn-more").addEventListener("click", () => { usn.shown += 30; usnRender(); });
  document.getElementById("usn-refresh").addEventListener("click", () => usnLoad(true));

  // Phones: filters slide in from the side.
  const toggle = document.getElementById("usn-filter-btn");
  const close = () => { document.body.classList.remove("news-filters-open"); toggle.setAttribute("aria-expanded", "false"); };
  toggle.addEventListener("click", () => {
    const open = document.body.classList.toggle("news-filters-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  document.getElementById("usn-side-close").addEventListener("click", close);
  document.getElementById("usn-scrim").addEventListener("click", close);
}

// ---- Page ----

async function showUsNews() {
  document.title = "US News Bias Check — All Points Towards Progress";
  if (!usn.ready) {
    usn.ready = true;
    usnLoadPrefs();
    usnRenderSidebar();
    usnBindEvents();
    newsLiveBind("usn");
    newsRenderMethod("usn-method", US_NEWS_SOURCES, US_LEANS,
      "Each outlet gets one rating for the outlet as a whole, which is the color on its stories and most of each story's slant score. The rest of the score comes from the story's own wording (see “How the bias check works” in Filters). Here is what we look at when rating an outlet:");
  }
  const ok = await newsCheckServer();
  document.getElementById("usn-offline").hidden = ok;
  if (!ok) { document.getElementById("usn-status").textContent = ""; return; }
  usnLoad(false);
  newsLiveLoad("usn", "us");
  clearInterval(usn.refreshTimer);
  usn.refreshTimer = setInterval(() => { if (!document.getElementById("usnews-view").hidden) usnLoad(true); }, 10 * 60_000);
}
