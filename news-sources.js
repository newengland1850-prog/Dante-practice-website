// News sources for the Worldwide National Movement and US News tabs. Shared by the page (news.js) and the
// local server (server.js), which only ever fetches the feeds listed here.
//
// kind: "news" for news outlets; "magazine" for opinion magazines (their stories
// default to the Opinion type when nothing more specific matches).
// lean: 1 Center Right, 2 Right, 3 Far Right (same scale as US_LEANS below). These are
// approximate ratings of each outlet's overall editorial line.

const NEWS_COUNTRIES = [
  { id: "us", name: "United States" },
  { id: "uk", name: "United Kingdom" },
  { id: "fr", name: "France" },
  { id: "de", name: "Germany" },
  { id: "pl", name: "Poland" },
];

const NEWS_SOURCES = [
  // United States
  { id: "foxnews", name: "Fox News", lean: 2, country: "us", lang: "en", kind: "news", feed: "https://moxie.foxnews.com/google-publisher/latest.xml" },
  { id: "nypost", name: "New York Post", lean: 1, country: "us", lang: "en", kind: "news", feed: "https://nypost.com/feed/" },
  { id: "washexaminer", name: "Washington Examiner", lean: 1, country: "us", lang: "en", kind: "news", feed: "https://www.washingtonexaminer.com/feed" },
  { id: "washtimes", name: "Washington Times", lean: 1, country: "us", lang: "en", kind: "news", feed: "https://www.washingtontimes.com/rss/headlines/news/" },
  { id: "dailywire", name: "Daily Wire", lean: 2, country: "us", lang: "en", kind: "news", feed: "https://www.dailywire.com/feeds/rss.xml" },
  { id: "breitbart", name: "Breitbart", lean: 2, country: "us", lang: "en", kind: "news", feed: "https://feeds.feedburner.com/breitbart" },
  { id: "nationalreview", name: "National Review", lean: 2, country: "us", lang: "en", kind: "magazine", feed: "https://www.nationalreview.com/feed/" },
  { id: "federalist", name: "The Federalist", lean: 2, country: "us", lang: "en", kind: "magazine", feed: "https://thefederalist.com/feed/" },
  { id: "dailycaller", name: "The Daily Caller", lean: 2, country: "us", lang: "en", kind: "news", feed: "https://dailycaller.com/feed/" },
  { id: "townhall", name: "Townhall", lean: 2, country: "us", lang: "en", kind: "news", feed: "https://townhall.com/feed/" },

  // United Kingdom
  { id: "dailymail", name: "Daily Mail", lean: 2, country: "uk", lang: "en", kind: "news", feed: "https://www.dailymail.co.uk/articles.rss" },
  { id: "gbnews", name: "GB News", lean: 2, country: "uk", lang: "en", kind: "news", feed: "https://www.gbnews.com/feeds/news.rss" },
  { id: "express", name: "Daily Express", lean: 2, country: "uk", lang: "en", kind: "news", feed: "https://www.express.co.uk/posts/rss/1/news" },
  { id: "thesun", name: "The Sun", lean: 2, country: "uk", lang: "en", kind: "news", feed: "https://www.thesun.co.uk/feed/" },
  { id: "thecritic", name: "The Critic", lean: 2, country: "uk", lang: "en", kind: "magazine", feed: "https://thecritic.co.uk/feed/" },
  { id: "conhome", name: "ConservativeHome", lean: 1, country: "uk", lang: "en", kind: "magazine", feed: "https://conservativehome.com/feed/" },
  { id: "spiked", name: "Spiked", lean: 2, country: "uk", lang: "en", kind: "magazine", feed: "https://www.spiked-online.com/feed/" },
  { id: "telegraph", name: "The Telegraph", lean: 1, country: "uk", lang: "en", kind: "news", feed: "https://www.telegraph.co.uk/rss.xml" },
  { id: "guido", name: "Guido Fawkes", lean: 2, country: "uk", lang: "en", kind: "news", feed: "https://order-order.com/feed/" },

  // France
  { id: "lefigaro", name: "Le Figaro", lean: 1, country: "fr", lang: "fr", kind: "news", feed: "https://www.lefigaro.fr/rss/figaro_actualites.xml" },
  { id: "cnews", name: "CNews", lean: 2, country: "fr", lang: "fr", kind: "news", feed: "https://www.cnews.fr/rss.xml" },
  { id: "jdd", name: "Le Journal du Dimanche", lean: 2, country: "fr", lang: "fr", kind: "news", feed: "https://www.lejdd.fr/rss.xml" },
  { id: "valeurs", name: "Valeurs actuelles", lean: 3, country: "fr", lang: "fr", kind: "magazine", feed: "https://www.valeursactuelles.com/feed" },
  { id: "causeur", name: "Causeur", lean: 2, country: "fr", lang: "fr", kind: "magazine", feed: "https://www.causeur.fr/feed" },
  { id: "europe1", name: "Europe 1", lean: 2, country: "fr", lang: "fr", kind: "news", feed: "https://www.europe1.fr/rss.xml" },
  { id: "bvoltaire", name: "Boulevard Voltaire", lean: 3, country: "fr", lang: "fr", kind: "news", feed: "https://www.bvoltaire.fr/feed/" },

  // Germany
  { id: "welt", name: "Die Welt", lean: 1, country: "de", lang: "de", kind: "news", feed: "https://www.welt.de/feeds/latest.rss" },
  { id: "bild", name: "Bild", lean: 2, country: "de", lang: "de", kind: "news", feed: "https://www.bild.de/feed/alles.xml" },
  { id: "jungefreiheit", name: "Junge Freiheit", lean: 3, country: "de", lang: "de", kind: "news", feed: "https://jungefreiheit.de/feed/" },
  { id: "tichy", name: "Tichys Einblick", lean: 2, country: "de", lang: "de", kind: "magazine", feed: "https://www.tichyseinblick.de/feed/" },
  { id: "cicero", name: "Cicero", lean: 1, country: "de", lang: "de", kind: "magazine", feed: "https://www.cicero.de/rss.xml" },
  { id: "achgut", name: "Achse des Guten", lean: 2, country: "de", lang: "de", kind: "magazine", feed: "https://www.achgut.com/rss" },
  { id: "nius", name: "NIUS", lean: 2, country: "de", lang: "de", kind: "news", feed: "https://www.nius.de/rss" },
  { id: "apollo", name: "Apollo News", lean: 2, country: "de", lang: "de", kind: "news", feed: "https://apollo-news.net/feed/" },

  // Poland
  { id: "niezalezna", name: "Niezależna", lean: 2, country: "pl", lang: "pl", kind: "news", feed: "https://niezalezna.pl/feed" },
  { id: "rzeczpospolita", name: "Rzeczpospolita", lean: 1, country: "pl", lang: "pl", kind: "news", feed: "https://www.rp.pl/rss_main" },
  { id: "naszdziennik", name: "Nasz Dziennik", lean: 2, country: "pl", lang: "pl", kind: "news", feed: "https://naszdziennik.pl/rss.xml" },
  { id: "nczas", name: "Najwyższy Czas", lean: 3, country: "pl", lang: "pl", kind: "magazine", feed: "https://nczas.info/feed/" },
  { id: "radiomaryja", name: "Radio Maryja", lean: 2, country: "pl", lang: "pl", kind: "news", feed: "https://www.radiomaryja.pl/feed/" },
  // wPolityce blocks feed readers, so its stories come through a Google News search (no pictures).
  { id: "wpolityce", name: "wPolityce", lean: 2, country: "pl", lang: "pl", kind: "news", site: "wpolityce.pl", format: "google", feed: "https://news.google.com/rss/search?q=site:wpolityce.pl+when:2d&hl=pl&gl=PL&ceid=PL:pl" },
];

// The 25 largest S&P 500 companies by market value (a fixed list; edit to update).
// Symbols use Yahoo Finance's format (BRK-B, not BRK.B).
const NEWS_STOCKS = [
  "NVDA", "MSFT", "AAPL", "AMZN", "GOOGL", "META", "AVGO", "TSLA", "BRK-B", "LLY",
  "JPM", "WMT", "ORCL", "V", "MA", "XOM", "NFLX", "COST", "JNJ", "PLTR",
  "HD", "ABBV", "BAC", "PG", "AMD",
];

// ---- US News tab (#/usnews): major US outlets across the spectrum ----
// lean: the outlet's overall rating, -3 (far left) to 3 (far right). These are approximate, in line
// with public media-bias charts such as AllSides and Ad Fontes Media; check those for current ratings.
// format: "rss" (default), "sitemap" (a Google News sitemap) or "google" (Google News search,
// for outlets with no public feed). site: the outlet's web address, for pictures and article checks.
// paywall: "hard" (subscribers only), "metered" (a few free articles, then a subscription) or
// "some" (some articles are for subscribers). Each article's own paywall marker is checked too.
const US_LEANS = [
  { id: -3, key: "far-left", name: "Far Left" },
  { id: -2, key: "left", name: "Left" },
  { id: -1, key: "center-left", name: "Center Left" },
  { id: 0, key: "center", name: "Center" },
  { id: 1, key: "center-right", name: "Center Right" },
  { id: 2, key: "right", name: "Right" },
  { id: 3, key: "far-right", name: "Far Right" },
];

// What we look at when placing an outlet (listed at the bottom of both news tabs).
const LEAN_CRITERIA = [
  ["Independent ratings", "We start from public media-bias charts (AllSides, Ad Fontes Media and Media Bias/Fact Check) and go with where they agree. Where they differ, we pick the middle of their ratings."],
  ["Opinion pages", "Which side the editorials and regular columnists take, and which candidates and policies the outlet endorses."],
  ["Story choice", "Which stories the outlet covers, leads with or leaves out, and whose scandals get the most attention."],
  ["Wording", "Whether the outlet uses one side's terms, such as “undocumented immigrants” vs. “illegal aliens”. US News also checks every single story for this."],
  ["How it describes itself", "The outlet's own mission statement and audience. For example, Jacobin calls itself socialist and The Federalist calls itself conservative."],
];

// A line about each outlet, shown under its name in the leaning cards (by id, shared by both news tabs).
const OUTLET_ABOUT = {
  // US
  jacobin: "Socialist magazine that calls itself a leading voice of the American left.",
  commondreams: "Nonprofit progressive news site focused on activism and advocacy.",
  democracynow: "Daily independent news program hosted by Amy Goodman, with a progressive, activist focus.",
  truthout: "Nonprofit progressive news site focused on social justice.",
  wsws: "Online publication of the Trotskyist Socialist Equality Party.",
  msnow: "Cable news channel formerly called MSNBC. Its progressive opinion shows make up most of what it airs.",
  huffpost: "Online news and opinion site with progressive commentary, owned by BuzzFeed.",
  vox: "Explainer news site from Vox Media, with mostly progressive framing.",
  cnn: "Cable news network founded in 1980. The rating sites place its coverage left of center.",
  nyt: "National daily newspaper: mostly straight news, with a liberal editorial page.",
  wapo: "National daily newspaper owned by Jeff Bezos: mostly straight news, with a mostly liberal opinion section.",
  nbc: "The NBC network's news division. The rating sites place it slightly left of center.",
  cbs: "The CBS network's news division. The rating sites place it slightly left of center.",
  abc: "The ABC network's news division. The rating sites place it slightly left of center.",
  npr: "Nonprofit public radio news. The rating sites place it slightly left of center.",
  ap: "Wire service whose stories run in newspapers nationwide. The rating sites split between Center and Lean Left; we use Center Left.",
  usatoday: "National daily newspaper from Gannett: mostly straight news, with a center-left opinion section.",
  politico: "Political news site covering Washington and campaigns.",
  axios: "Short-format news site covering politics, business and tech.",
  latimes: "Los Angeles daily newspaper: mostly straight news, with a liberal editorial page.",
  pbs: "The nightly news program from public broadcasting.",
  thehill: "Covers both parties in Congress, and AllSides rates it Center.",
  wsj: "Business daily owned by News Corp. Its news pages are rated Center; its editorial page is conservative.",
  cnbc: "Business and market news channel owned by NBCUniversal.",
  csm: "Nonprofit newspaper founded by the Christian Science church, known for even-handed reporting.",
  reason: "Libertarian magazine: right on taxes and regulation, often left on social issues.",
  dispatch: "Founded by conservative writers who are often critical of Trump. It does mostly straight reporting.",
  newsmax: "Conservative cable news channel and website founded by Christopher Ruddy.",
  blaze: "Conservative media company founded by Glenn Beck.",
  freebeacon: "Conservative investigative news site based in Washington.",
  amcon: "Magazine of traditionalist, anti-interventionist conservatism, co-founded by Pat Buchanan.",
  dailysignal: "News site founded by the conservative Heritage Foundation.",
  justthenews: "News site founded by journalist John Solomon, focused on government and investigations.",
  westernjournal: "Conservative news and opinion site.",
  epochtimes: "Newspaper founded by followers of the Falun Gong movement. AllSides rates it Lean Right.",
  gatewaypundit: "Pro-Trump news site. Fact-checking sites often rate it low for accuracy.",
  oann: "Pro-Trump cable news channel. Fact-checking sites often rate it low for accuracy.",
  natpulse: "Populist nationalist news site founded by Raheem Kassam.",
  wnd: "Long-running conservative news site, formerly called WorldNetDaily.",
  revolver: "Populist nationalist news and commentary site founded by Darren Beattie.",
  // US (also on the Worldwide tab)
  foxnews: "Cable news network owned by Fox Corporation. Its straight news is closer to Center Right, but its prime-time opinion shows are clearly conservative.",
  nypost: "New York tabloid owned by News Corp, with a conservative editorial page.",
  washexaminer: "Washington political news site and magazine: conservative opinion, mostly straight political reporting.",
  washtimes: "Washington daily newspaper with a conservative editorial page, founded in 1982 by the Unification Church movement.",
  dailywire: "Conservative news and media company co-founded by Ben Shapiro.",
  breitbart: "Populist conservative news site founded by Andrew Breitbart, with strongly pro-Trump coverage.",
  nationalreview: "Conservative magazine founded by William F. Buckley Jr. in 1955.",
  federalist: "Online conservative magazine covering politics, culture and religion.",
  dailycaller: "Conservative news site co-founded by Tucker Carlson and Neil Patel.",
  townhall: "Conservative news and commentary site run by Salem Media.",
  // UK
  dailymail: "British tabloid with a long record of backing the Conservative Party.",
  gbnews: "British TV news channel launched in 2021, with mostly conservative and populist presenters.",
  express: "British tabloid with a strongly pro-Brexit, right-leaning line.",
  thesun: "Britain's best-selling tabloid, owned by News Corp. It has usually backed the Conservatives.",
  thecritic: "British magazine of conservative-leaning politics and culture commentary.",
  conhome: "Website for Conservative Party members and supporters.",
  spiked: "British online magazine: libertarian, anti-establishment and pro-Brexit.",
  telegraph: "British daily and a long-time supporter of the Conservative Party, with mostly straight news reporting.",
  guido: "British political gossip blog with a libertarian, right-leaning slant.",
  // France
  lefigaro: "France's main center-right daily newspaper.",
  cnews: "French 24-hour news channel owned by the Bolloré group, known for its conservative talk shows.",
  jdd: "French Sunday newspaper that moved to the right after the Bolloré group took control in 2023.",
  valeurs: "National-conservative weekly that France's mainstream press often calls far right.",
  causeur: "French monthly of conservative, anti-woke commentary, founded by Élisabeth Lévy.",
  europe1: "French radio station whose line moved to the right after the Bolloré group took control.",
  bvoltaire: "Nationalist news site founded by Robert Ménard.",
  // Germany
  welt: "Germany's main conservative-liberal daily newspaper, from the Axel Springer group.",
  bild: "Germany's best-selling tabloid, from the Axel Springer group: populist and right-leaning.",
  jungefreiheit: "National-conservative weekly that Germany's mainstream press often calls far right.",
  tichy: "German online magazine founded by journalist Roland Tichy: free-market and conservative.",
  cicero: "German monthly of politics and culture with a liberal-conservative line.",
  achgut: "German group blog of libertarian and conservative writers, co-founded by Henryk M. Broder.",
  nius: "German news site launched in 2023 by former Bild editor Julian Reichelt.",
  apollo: "German online newspaper for young conservative and libertarian readers.",
  // Poland
  niezalezna: "Website of the weekly Gazeta Polska: national-conservative and close to the Law and Justice (PiS) party.",
  rzeczpospolita: "Conservative-liberal daily newspaper. It is more measured than Poland's national-conservative press.",
  naszdziennik: "Catholic national-conservative daily newspaper, part of the Radio Maryja media group.",
  nczas: "Libertarian-nationalist magazine close to the Konfederacja party.",
  radiomaryja: "Catholic national-conservative radio station run by Father Tadeusz Rydzyk.",
  wpolityce: "Political news site run by the Karnowski brothers, close to the Law and Justice (PiS) party.",
};

const US_NEWS_SOURCES = [
  { id: "jacobin", name: "Jacobin", lean: -3, site: "jacobin.com", feed: "https://jacobin.com/feed/" },
  { id: "commondreams", name: "Common Dreams", lean: -3, site: "commondreams.org", feed: "https://www.commondreams.org/feeds/feed.rss" },
  { id: "democracynow", name: "Democracy Now!", lean: -3, site: "democracynow.org", feed: "https://www.democracynow.org/democracynow.rss" },
  { id: "truthout", name: "Truthout", lean: -3, site: "truthout.org", feed: "https://truthout.org/feed/" },
  { id: "wsws", name: "World Socialist Web Site", lean: -3, site: "wsws.org", feed: "https://www.wsws.org/en/rss.xml" },

  { id: "msnow", name: "MS NOW (MSNBC)", lean: -2, site: "ms.now", paywall: "some", format: "sitemap", feed: "https://www.ms.now/news-sitemap.xml" },
  { id: "huffpost", name: "HuffPost", lean: -2, site: "huffpost.com", feed: "https://chaski.huffpost.com/us/auto/vertical/us-news" },
  { id: "vox", name: "Vox", lean: -2, site: "vox.com", feed: "https://www.vox.com/rss/index.xml" },

  { id: "cnn", name: "CNN", lean: -1, site: "cnn.com", paywall: "metered", format: "sitemap", feed: "https://www.cnn.com/sitemap/news.xml" },
  { id: "nyt", name: "The New York Times", lean: -1, site: "nytimes.com", paywall: "metered", feed: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml" },
  { id: "wapo", name: "The Washington Post", lean: -1, site: "washingtonpost.com", paywall: "metered", feed: "https://www.washingtonpost.com/arcio/rss/category/politics/" },
  { id: "nbc", name: "NBC News", lean: -1, site: "nbcnews.com", feed: "https://feeds.nbcnews.com/nbcnews/public/news" },
  { id: "cbs", name: "CBS News", lean: -1, site: "cbsnews.com", feed: "https://www.cbsnews.com/latest/rss/main" },
  { id: "abc", name: "ABC News", lean: -1, site: "abcnews.go.com", feed: "https://abcnews.go.com/abcnews/topstories" },
  { id: "npr", name: "NPR", lean: -1, site: "npr.org", feed: "https://feeds.npr.org/1001/rss.xml" },
  { id: "ap", name: "Associated Press", lean: -1, site: "apnews.com", format: "google", feed: "https://news.google.com/rss/search?q=site:apnews.com+when:2d&hl=en-US&gl=US&ceid=US:en" },
  { id: "usatoday", name: "USA Today", lean: -1, site: "usatoday.com", format: "sitemap", feed: "https://www.usatoday.com/news-sitemap.xml" },
  { id: "politico", name: "Politico", lean: -1, site: "politico.com", feed: "https://rss.politico.com/politics-news.xml" },
  { id: "axios", name: "Axios", lean: -1, site: "axios.com", feed: "https://api.axios.com/feed/" },
  { id: "latimes", name: "Los Angeles Times", lean: -1, site: "latimes.com", paywall: "metered", feed: "https://www.latimes.com/world-nation/rss2.0.xml" },
  { id: "pbs", name: "PBS News", lean: -1, site: "pbs.org", feed: "https://www.pbs.org/newshour/feeds/rss/headlines" },

  { id: "thehill", name: "The Hill", lean: 0, site: "thehill.com", feed: "https://thehill.com/news/feed/" },
  { id: "wsj", name: "The Wall Street Journal", lean: 0, site: "wsj.com", paywall: "hard", feed: "https://feeds.content.dowjones.io/public/rss/RSSUSnews" },
  { id: "cnbc", name: "CNBC", lean: 0, site: "cnbc.com", feed: "https://www.cnbc.com/id/100003114/device/rss/rss.html" },
  { id: "csm", name: "Christian Science Monitor", lean: 0, site: "csmonitor.com", paywall: "metered", feed: "https://rss.csmonitor.com/feeds/all" },

  { id: "nypost", name: "New York Post", lean: 1, site: "nypost.com", feed: "https://nypost.com/feed/" },
  { id: "washexaminer", name: "Washington Examiner", lean: 1, site: "washingtonexaminer.com", feed: "https://www.washingtonexaminer.com/feed" },
  { id: "washtimes", name: "Washington Times", lean: 1, site: "washingtontimes.com", feed: "https://www.washingtontimes.com/rss/headlines/news/" },
  { id: "reason", name: "Reason", lean: 1, site: "reason.com", feed: "https://reason.com/feed/" },
  { id: "dispatch", name: "The Dispatch", lean: 1, site: "thedispatch.com", paywall: "some", feed: "https://thedispatch.com/feed/" },

  { id: "foxnews", name: "Fox News", lean: 2, site: "foxnews.com", feed: "https://moxie.foxnews.com/google-publisher/latest.xml" },
  { id: "newsmax", name: "Newsmax", lean: 2, site: "newsmax.com", feed: "https://www.newsmax.com/rss/Newsfront/16/" },
  { id: "dailywire", name: "Daily Wire", lean: 2, site: "dailywire.com", feed: "https://www.dailywire.com/feeds/rss.xml" },
  { id: "breitbart", name: "Breitbart", lean: 2, site: "breitbart.com", feed: "https://feeds.feedburner.com/breitbart" },
  { id: "federalist", name: "The Federalist", lean: 2, site: "thefederalist.com", feed: "https://thefederalist.com/feed/" },
  { id: "dailycaller", name: "The Daily Caller", lean: 2, site: "dailycaller.com", feed: "https://dailycaller.com/feed/" },
  { id: "blaze", name: "TheBlaze", lean: 2, site: "theblaze.com", feed: "https://www.theblaze.com/feeds/feed.rss" },
  { id: "townhall", name: "Townhall", lean: 2, site: "townhall.com", feed: "https://townhall.com/feed/" },
  { id: "freebeacon", name: "Washington Free Beacon", lean: 2, site: "freebeacon.com", feed: "https://freebeacon.com/feed/" },
  { id: "nationalreview", name: "National Review", lean: 2, site: "nationalreview.com", paywall: "some", feed: "https://www.nationalreview.com/feed/" },
  { id: "amcon", name: "The American Conservative", lean: 2, site: "theamericanconservative.com", feed: "https://www.theamericanconservative.com/feed/" },
  { id: "dailysignal", name: "The Daily Signal", lean: 2, site: "dailysignal.com", feed: "https://www.dailysignal.com/feed/" },
  { id: "justthenews", name: "Just the News", lean: 2, site: "justthenews.com", feed: "https://justthenews.com/rss.xml" },
  { id: "westernjournal", name: "The Western Journal", lean: 2, site: "westernjournal.com", feed: "https://www.westernjournal.com/feed/" },
  { id: "epochtimes", name: "The Epoch Times", lean: 1, site: "theepochtimes.com", paywall: "metered", feed: "https://feed.theepochtimes.com/us/feed" },

  { id: "gatewaypundit", name: "The Gateway Pundit", lean: 3, site: "thegatewaypundit.com", feed: "https://www.thegatewaypundit.com/feed/" },
  { id: "oann", name: "One America News", lean: 3, site: "oann.com", feed: "https://www.oann.com/feed/" },
  { id: "natpulse", name: "The National Pulse", lean: 3, site: "thenationalpulse.com", feed: "https://thenationalpulse.com/feed/" },
  { id: "wnd", name: "WND", lean: 3, site: "wnd.com", feed: "https://www.wnd.com/feed/" },
  { id: "revolver", name: "Revolver News", lean: 3, site: "revolver.news", feed: "https://revolver.news/feed/" },
];

// ---- Live news on YouTube (the "Watch live" section of both news tabs) ----
// handle: the channel's YouTube @handle. The server looks up whatever the channel is
// streaming live right now; channels that aren't live are left out. The first live
// channel in each list plays automatically (muted).
const NEWS_LIVE = [
  { handle: "GBNewsOnline", name: "GB News", country: "uk", lean: 2 },
  { handle: "TalkTV", name: "TalkTV", country: "uk", lean: 2 },
  { handle: "WELTVideoTV", name: "WELT", country: "de", lean: 1 },
  { handle: "LiveNOWFOX", name: "LiveNOW from FOX", country: "us", lean: 2 },
  { handle: "NewsmaxTV", name: "Newsmax", country: "us", lean: 2 },
  { handle: "RealAmericasVoice", name: "Real America's Voice", country: "us", lean: 3 },
  { handle: "OANN", name: "One America News", country: "us", lean: 3 },
];
const US_NEWS_LIVE = [
  // Fox's live channel comes first, so it is the one that plays by itself.
  { handle: "LiveNOWFOX", name: "LiveNOW from FOX", country: "us", lean: 2 },
  { handle: "CBSNews", name: "CBS News 24/7", country: "us", lean: -1 },
  { handle: "ABCNews", name: "ABC News Live", country: "us", lean: -1 },
  { handle: "NBCNews", name: "NBC News NOW", country: "us", lean: -1 },
  { handle: "markets", name: "Bloomberg", country: "us", lean: 0 },
  { handle: "CSPAN", name: "C-SPAN", country: "us", lean: 0 },
  { handle: "NewsmaxTV", name: "Newsmax", country: "us", lean: 2 },
  { handle: "RealAmericasVoice", name: "Real America's Voice", country: "us", lean: 3 },
  { handle: "OANN", name: "One America News", country: "us", lean: 3 },
];

if (typeof module !== "undefined") module.exports = { NEWS_COUNTRIES, NEWS_SOURCES, NEWS_STOCKS, US_LEANS, US_NEWS_SOURCES, NEWS_LIVE, US_NEWS_LIVE };
