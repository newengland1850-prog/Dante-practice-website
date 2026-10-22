# Dante-practice-website

**All Points Towards Progress** is a practice website. Its front page has a picture banner, a box for each section, and a **Mobile version** button: on a computer it shows the site in a phone-sized preview, and on a phone it offers to install the site as an app. The sections are:

- **Stacks**, an encyclopedia search styled after a scholarly library front page. Search any topic and read the full Wikipedia article on the same page.
- **Weather**, with forecasts, city photos and a 36-hour weather map.
- **Worldwide National Movement**, with right-leaning outlets from the United States, United Kingdom, France, Germany and Poland. It includes filters, translation into English and the top 25 S&P 500 stock prices.

## Running it

**Everything:** double-click `start.bat`, which needs [Node.js](https://nodejs.org). It starts a small local server and opens the site at http://localhost:8080. Close the window to stop it. Or, in the project folder, run:

```
node server.js
```

**Without the server:** you can also just open `index.html`. The encyclopedia and weather work that way, but the news page needs the server. Browsers can't fetch other news sites directly, so `server.js` fetches the feeds, stock prices, translations and article pictures for the page.

None of the services used need an account or API key: Wikipedia, Open-Meteo, Wikimedia Commons, Esri map tiles, Yahoo Finance chart data and Google Translate's public web endpoint.

## Files

- `index.html`: page layout for all the views
- `front.js` / `front.css`: the front page (banner pictures, section boxes, mobile version). **Change the banner pictures** in `FRONT_BANNER` at the top of `front.js`.
- `style.css`: the main styles, including the phone menu
- `app.js`: Wikipedia API calls, hash routing (`#/` front page, `#/stacks`, `#/search/...`, `#/article/...`, `#/explore`, `#/subject/...`, `#/weather`, `#/news`, `#/random`), the phone menu, and service worker registration
- `subjects.js`: the subjects and the tag groups shown on each subject page (edit this to add or change tags)
- `weather.js` / `weather.css`: the Weather tab (Open-Meteo forecasts, city photos from Wikimedia Commons, the city scroller, the details panel)
- `weather-map.js`: the weather map with a 36-hour forecast slider (Leaflet, an Esri base map and Open-Meteo)
- `news-sources.js`: **the news outlets and the stock list.** Edit this to add, remove or change news sites. The server only fetches feeds listed here.
- `news.js` / `news.css`: the Worldwide National Movement tab
- `news-logo.svg`: the news logo, which is also the app icon (`icons/` holds the PNG versions)
- `server.js`: the local server and its API (`/api/feed`, `/api/stocks`, `/api/translate`, `/api/image`)
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

1. Deploy `server.js` (with `news-sources.js`) to any Node host, such as Render, Railway, Fly.io or a small VPS. It serves both the site and the API.
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
