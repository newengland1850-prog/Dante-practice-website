# Dante-practice-website

A simple search site, styled after a scholarly library front page. You search for any topic and read the full Wikipedia article on the same page.

Open `index.html` in a browser. There's no build step, and Wikipedia's API and the Open-Meteo weather API don't need keys.

- `index.html`: page layout (home page, results and article views)
- `style.css`: styling
- `subjects.js`: the subjects and the tag groups shown on each subject page (edit this to add or change tags)
- `weather.js` / `weather.css`: the Weather tab (forecast from Open-Meteo, city photos from Wikimedia Commons, city scroller, details panel)
- `weather-map.js`: the weather map with a 36-hour forecast slider (Leaflet + Esri base map + Open-Meteo)
- `app.js`: Wikipedia API calls and hash routing (`#/search/...`, `#/article/...`, `#/explore`, `#/subject/...`, `#/weather`, `#/random`)
