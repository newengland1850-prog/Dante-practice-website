// Service worker: lets the site install as an app and open without a connection.
// Strategy: the app's own files are fetched fresh when online and served from the
// cache when offline. API calls (news, stocks, translation) are never cached here.
// Bump VERSION when you add or rename app files.

const VERSION = "stacks-v21";
const APP_FILES = [
  "./", "./index.html", "./style.css", "./weather.css", "./news.css", "./usnews.css", "./front.css", "./traffic.css",
  "./config.js", "./subjects.js", "./news-sources.js", "./news.js", "./news-games.js", "./usnews.js", "./front.js", "./weather.js", "./weather-map.js", "./traffic-data.js", "./traffic-restaurants.js", "./traffic.js", "./traffic-us-roads.json", "./app.js",
  "./background.svg", "./news-logo.svg", "./usnews-logo.svg", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png",
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  // Only the app's own files; everything else (APIs, other sites) goes straight to the network.
  if (event.request.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  event.respondWith(
    fetch(event.request)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then(cache => cache.put(event.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(event.request).then(hit => hit || caches.match("./index.html")))
  );
});
