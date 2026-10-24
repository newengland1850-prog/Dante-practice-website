# Dante-practice-website

**All Points Towards Progress** is a practice website. Its front page has a picture banner, a box for each section, and a **Mobile version** button: on a computer it shows the site in a phone-sized preview, and on a phone it offers to install the site as an app. The sections are:

- **Stacks**, an encyclopedia search styled after a scholarly library front page. Search any topic and read the full Wikipedia article on the same page.
- **Weather**, with forecasts, city photos and a 36-hour weather map.
- **Traffic** (US only), with a map of typical traffic across the whole country at any time of day (zoom in anywhere for street-level roads), trip-time estimates drawn as a peppermint-striped route, and the best local (non-chain) stores nearby. There is no free live-traffic feed, so the colors are an estimate from US commute patterns, road type and city size, not live traffic.
- **US News Bias Check**, with 50 US outlets on a 7-step scale from Far Left to Far Right (Far Left, Left, Center Left, Center, Center Right, Right, Far Right). Every story gets a bias check: the outlet's overall leaning (approximate, in line with charts such as AllSides and Ad Fontes Media) and a scan of its wording for buzzwords each side tends to use, plus loaded words. Each story gets a slant score from −100 (left) to +100 (right). "Check full article" reads the whole story when the site allows it. Stories that may need a subscription (paywalls) are marked on the card. A coverage band at the top shows how the day's stories split.
- **Worldwide National Movement**, with right-leaning outlets from the United States, United Kingdom, France, Germany and Poland. It includes filters, translation into English, the top 25 S&P 500 stock prices (click one for a chart of its last day, week or month), a bar showing how stories split between Center Right, Right and Far Right outlets, and a games window (trivia, a word puzzle, a timeline game and "Which came first?") opened from the sidebar.
- **Breaking news** (both news tabs): stories the outlet itself labels breaking or live ("Breaking:", "JUST IN:", "Eilmeldung", "EN DIRECT", "Pilne" and so on) get a badge, and the newest from the last 12 hours are listed above the feed.

## Running it

**Everything:** double-click `start.bat`, which needs [Node.js](https://nodejs.org). It starts a small local server and opens the site at http://localhost:8080. Close the window to stop it. Or, in the project folder, run:

```
node server.js
```

**Without the server:** you can also just open `index.html`. The encyclopedia, weather and traffic work that way, but the two news pages need the server. Traffic loads much faster with the server, which keeps the road and store data on disk after the first visit to a city. Browsers can't fetch other news sites directly, so `server.js` fetches the feeds, stock prices, translations and article pictures for the page.

None of the services used need an account or API key: Wikipedia, Open-Meteo, Wikimedia Commons, Esri map tiles, OpenStreetMap (Overpass), the OSRM route server, Photon place search, Yahoo Finance chart data and Google Translate's public web endpoint.

## Files

- `index.html`: page layout for all the views
- `front.js` / `front.css`: the front page (banner pictures, section boxes, mobile version). **Change the banner pictures** in `FRONT_BANNER` at the top of `front.js`.
- `style.css`: the main styles, including the phone menu
- `app.js`: Wikipedia API calls, hash routing (`#/` front page, `#/stacks`, `#/search/...`, `#/article/...`, `#/explore`, `#/subject/...`, `#/weather`, `#/traffic`, `#/usnews`, `#/news`, `#/random`), the phone menu, and service worker registration
- `subjects.js`: the subjects and the tag groups shown on each subject page (edit this to add or change tags)
- `weather.js` / `weather.css`: the Weather tab (Open-Meteo forecasts, city photos from Wikimedia Commons, the city scroller, the details panel)
- `weather-map.js`: the weather map with a 36-hour forecast slider (Leaflet, an Esri base map and Open-Meteo)
- `traffic.js` / `traffic.css`: the Traffic tab (the traffic model, trip times with OSRM, local stores). `traffic-data.js` holds the quick-pick cities, about 70 more metro areas and the OpenStreetMap queries, shared with the server. `traffic-us-roads.json` is the nationwide highway map (from public-domain Natural Earth data).
- `news-sources.js`: **the news outlets and the stock list** for both news tabs, including each US outlet's leaning. Edit this to add, remove or change news sites. The server only fetches feeds listed here.
- `news.js` / `news.css`: the Worldwide National Movement tab; `news-games.js` holds its trivia questions and puzzle words
- `usnews.js` / `usnews.css`: the US News Bias Check tab. **The buzzword lists** are `USN_BUZZ` at the top of `usnews.js`. `usnews-logo.svg` is its logo.
- `news-logo.svg`: the news logo, which is also the app icon (`icons/` holds the PNG versions)
- `server.js`: the local server and its API (`/api/feed`, `/api/stocks`, `/api/history`, `/api/translate`, `/api/image`, `/api/article`, `/api/access`, `/api/roads`, `/api/shops`)
- `config.js`: where the app finds the server (see below)
- `manifest.webmanifest`, `sw.js`: what lets the site install as an app and open offline

## Mobile app

The site is built to work on phones, and the groundwork for an app is in place.

### 1. Install it as a web app (works now)

When the site is opened from a web address rather than as a file, phones and desktop browsers offer to install it:

- **Android:** use Chrome's "Install app".
- **iPhone:** use Safari's Share → "Add to Home Screen".
- **Desktop:** use the install icon in the address bar.

It then opens full-screen with its own icon. The pages you've visited also open without a connection.

To try this on your phone over home Wi-Fi:

1. Start the server with `set HOST=0.0.0.0 && node server.js`.
2. On the phone, open `http://<your computer's IP address>:8080`.

Phones only allow installing from `https` addresses or from `localhost`, so a full install on a phone needs the site hosted somewhere with https (step 2).

### 2. Put the site and server online

A phone can't run `server.js`, so an app needs the server hosted somewhere:

1. Deploy `server.js` (with `news-sources.js` and `traffic-data.js`) to any Node host, such as Render, Railway, Fly.io or a small VPS. It serves both the site and the API.
2. To host the website separately from the server, set `apiBase` in `config.js` to the server's address, for example `"https://stacks-api.example.com"`. The server already allows calls from other addresses.

### 3. Wrap it as an App Store / Google Play app

Use [Capacitor](https://capacitorjs.com), which packages a website as a native iOS and Android app:

```
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init Stacks com.example.stacks --web-dir .
npx cap add android
npx cap add ios
npx cap open android
```

The last command opens the project in Android Studio. For iOS, use `npx cap open ios`, which needs a Mac with Xcode.

Before building, set `apiBase` in `config.js` to your hosted server from step 2. The app icon is `icons/icon-512.png`, and the maskable version is `icons/maskable-512.png`.
