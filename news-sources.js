// News sources for the Worldwide National Movement tab. Shared by the page (news.js) and the
// local server (server.js), which only ever fetches the feeds listed here.
//
// kind: "news" for news outlets; "magazine" for opinion magazines (their stories
// default to the Opinion type when nothing more specific matches).

const NEWS_COUNTRIES = [
  { id: "us", name: "United States" },
  { id: "uk", name: "United Kingdom" },
  { id: "fr", name: "France" },
  { id: "de", name: "Germany" },
  { id: "pl", name: "Poland" },
];

const NEWS_SOURCES = [
  // United States
  { id: "foxnews", name: "Fox News", country: "us", lang: "en", kind: "news", feed: "https://moxie.foxnews.com/google-publisher/latest.xml" },
  { id: "nypost", name: "New York Post", country: "us", lang: "en", kind: "news", feed: "https://nypost.com/feed/" },
  { id: "washexaminer", name: "Washington Examiner", country: "us", lang: "en", kind: "news", feed: "https://www.washingtonexaminer.com/feed" },
  { id: "washtimes", name: "Washington Times", country: "us", lang: "en", kind: "news", feed: "https://www.washingtontimes.com/rss/headlines/news/" },
  { id: "dailywire", name: "Daily Wire", country: "us", lang: "en", kind: "news", feed: "https://www.dailywire.com/feeds/rss.xml" },
  { id: "breitbart", name: "Breitbart", country: "us", lang: "en", kind: "news", feed: "https://feeds.feedburner.com/breitbart" },
  { id: "nationalreview", name: "National Review", country: "us", lang: "en", kind: "magazine", feed: "https://www.nationalreview.com/feed/" },
  { id: "federalist", name: "The Federalist", country: "us", lang: "en", kind: "magazine", feed: "https://thefederalist.com/feed/" },

  // United Kingdom
  { id: "dailymail", name: "Daily Mail", country: "uk", lang: "en", kind: "news", feed: "https://www.dailymail.co.uk/articles.rss" },
  { id: "gbnews", name: "GB News", country: "uk", lang: "en", kind: "news", feed: "https://www.gbnews.com/feeds/news.rss" },
  { id: "express", name: "Daily Express", country: "uk", lang: "en", kind: "news", feed: "https://www.express.co.uk/posts/rss/1/news" },
  { id: "thesun", name: "The Sun", country: "uk", lang: "en", kind: "news", feed: "https://www.thesun.co.uk/feed/" },
  { id: "thecritic", name: "The Critic", country: "uk", lang: "en", kind: "magazine", feed: "https://thecritic.co.uk/feed/" },
  { id: "conhome", name: "ConservativeHome", country: "uk", lang: "en", kind: "magazine", feed: "https://conservativehome.com/feed/" },
  { id: "spiked", name: "Spiked", country: "uk", lang: "en", kind: "magazine", feed: "https://www.spiked-online.com/feed/" },

  // France
  { id: "lefigaro", name: "Le Figaro", country: "fr", lang: "fr", kind: "news", feed: "https://www.lefigaro.fr/rss/figaro_actualites.xml" },
  { id: "cnews", name: "CNews", country: "fr", lang: "fr", kind: "news", feed: "https://www.cnews.fr/rss.xml" },
  { id: "jdd", name: "Le Journal du Dimanche", country: "fr", lang: "fr", kind: "news", feed: "https://www.lejdd.fr/rss.xml" },
  { id: "valeurs", name: "Valeurs actuelles", country: "fr", lang: "fr", kind: "magazine", feed: "https://www.valeursactuelles.com/feed" },
  { id: "causeur", name: "Causeur", country: "fr", lang: "fr", kind: "magazine", feed: "https://www.causeur.fr/feed" },

  // Germany
  { id: "welt", name: "Die Welt", country: "de", lang: "de", kind: "news", feed: "https://www.welt.de/feeds/latest.rss" },
  { id: "bild", name: "Bild", country: "de", lang: "de", kind: "news", feed: "https://www.bild.de/feed/alles.xml" },
  { id: "jungefreiheit", name: "Junge Freiheit", country: "de", lang: "de", kind: "news", feed: "https://jungefreiheit.de/feed/" },
  { id: "tichy", name: "Tichys Einblick", country: "de", lang: "de", kind: "magazine", feed: "https://www.tichyseinblick.de/feed/" },
  { id: "cicero", name: "Cicero", country: "de", lang: "de", kind: "magazine", feed: "https://www.cicero.de/rss.xml" },
  { id: "achgut", name: "Achse des Guten", country: "de", lang: "de", kind: "magazine", feed: "https://www.achgut.com/rss" },

  // Poland
  { id: "niezalezna", name: "Niezależna", country: "pl", lang: "pl", kind: "news", feed: "https://niezalezna.pl/feed" },
  { id: "rzeczpospolita", name: "Rzeczpospolita", country: "pl", lang: "pl", kind: "news", feed: "https://www.rp.pl/rss_main" },
  { id: "naszdziennik", name: "Nasz Dziennik", country: "pl", lang: "pl", kind: "news", feed: "https://naszdziennik.pl/rss.xml" },
  { id: "nczas", name: "Najwyższy Czas", country: "pl", lang: "pl", kind: "magazine", feed: "https://nczas.info/feed/" },
];

// The 25 largest S&P 500 companies by market value (a fixed list; edit to update).
// Symbols use Yahoo Finance's format (BRK-B, not BRK.B).
const NEWS_STOCKS = [
  "NVDA", "MSFT", "AAPL", "AMZN", "GOOGL", "META", "AVGO", "TSLA", "BRK-B", "LLY",
  "JPM", "WMT", "ORCL", "V", "MA", "XOM", "NFLX", "COST", "JNJ", "PLTR",
  "HD", "ABBV", "BAC", "PG", "AMD",
];

if (typeof module !== "undefined") module.exports = { NEWS_COUNTRIES, NEWS_SOURCES, NEWS_STOCKS };
