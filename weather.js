// Weather app (#/weather). Data from Open-Meteo (https://open-meteo.com): free, no key needed.
// Uses escapeHtml() from app.js at call time, so this file loads before app.js.

const WX_API = "https://api.open-meteo.com/v1/forecast";
const WX_GEO = "https://geocoding-api.open-meteo.com/v1/search";

const WX_PRESETS = [
  { name: "Boston", country: "US", lat: 42.36, lon: -71.06 },
  { name: "New York", country: "US", lat: 40.71, lon: -74.01 },
  { name: "Chicago", country: "US", lat: 41.88, lon: -87.63 },
  { name: "Miami", country: "US", lat: 25.76, lon: -80.19 },
  { name: "Seattle", country: "US", lat: 47.61, lon: -122.33 },
  { name: "Los Angeles", country: "US", lat: 34.05, lon: -118.24 },
  { name: "London", country: "GB", lat: 51.51, lon: -0.13 },
  { name: "Paris", country: "FR", lat: 48.86, lon: 2.35 },
  { name: "Florence", country: "IT", lat: 43.78, lon: 11.25 },
  { name: "Reykjavík", country: "IS", lat: 64.15, lon: -21.94 },
  { name: "Cairo", country: "EG", lat: 30.04, lon: 31.24 },
  { name: "Mumbai", country: "IN", lat: 19.08, lon: 72.88 },
  { name: "Tokyo", country: "JP", lat: 35.68, lon: 139.69 },
  { name: "Sydney", country: "AU", lat: -33.87, lon: 151.21 },
  { name: "Rio de Janeiro", country: "BR", lat: -22.91, lon: -43.17 },
  { name: "Cape Town", country: "ZA", lat: -33.92, lon: 18.42 },
];

// ---- Weather codes (WMO) ----

const WX_LABELS = {
  0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Cloudy", 45: "Fog", 48: "Freezing fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle", 56: "Freezing drizzle", 57: "Freezing drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain", 66: "Freezing rain", 67: "Freezing rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
  80: "Rain showers", 81: "Rain showers", 82: "Heavy showers", 85: "Snow showers", 86: "Heavy snow showers",
  95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with hail",
};

function wxCategory(code) {
  if (code <= 1) return "clear";
  if (code === 2) return "partly";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 55) return "drizzle";
  if ([56, 57, 66, 67].includes(code)) return "ice";
  if ([65, 82].includes(code)) return "heavy-rain";
  if ((code >= 61 && code <= 63) || code === 80 || code === 81) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "storm";
  return "cloudy";
}

function wxLabel(code, isDay = true) {
  if (code <= 1 && isDay) return code === 0 ? "Sunny" : "Mostly sunny";
  return WX_LABELS[code] || "Cloudy";
}

const WX_WET = new Set(["drizzle", "rain", "heavy-rain", "ice", "snow", "storm"]);

// Average extra driving time in each condition. Rough figures based on U.S. Federal
// Highway Administration road-weather research on how weather slows traffic.
function wxTravelDelay(code) {
  const cat = wxCategory(code);
  if (cat === "snow") return [75, 86].includes(code) ? 0.35 : 0.15;
  return { fog: 0.12, drizzle: 0.08, rain: 0.13, "heavy-rain": 0.2, storm: 0.25, ice: 0.4 }[cat] || 0;
}

// ---- Icons ----

const WX_SVG = {
  sun: `<circle cx="32" cy="32" r="11" fill="#ffc83d"/><g stroke="#ffc83d" stroke-width="3.5" stroke-linecap="round">${
    [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<line x1="32" y1="9" x2="32" y2="15" transform="rotate(${a} 32 32)"/>`).join("")}</g>`,
  moon: `<path d="M40 12a20 20 0 1 0 12 30A16 16 0 0 1 40 12z" fill="#f4e6a6"/>`,
  cloud: (fill = "#eef2f6", y = 0) => `<path transform="translate(0 ${y})" d="M18 50a10 10 0 0 1 0-20a14 14 0 0 1 26-6a11 11 0 0 1 11 13a7 7 0 0 1-1 13z" fill="${fill}"/>`,
};

function wxIcon(code, isDay = true) {
  const cat = wxCategory(code);
  const sky = isDay ? WX_SVG.sun : WX_SVG.moon;
  const drops = (color, n = 3) => Array.from({ length: n }, (_, i) =>
    `<line x1="${22 + i * 10}" y1="54" x2="${19 + i * 10}" y2="61" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`).join("");
  const flakes = Array.from({ length: 3 }, (_, i) => `<circle cx="${22 + i * 10}" cy="${57 + (i % 2) * 3}" r="2.6" fill="#fff"/>`).join("");
  let body;
  switch (cat) {
    case "clear": body = sky; break;
    case "partly": body = `<g transform="translate(8 -6) scale(.8)">${sky}</g>${WX_SVG.cloud("#eef2f6", 4)}`; break;
    case "cloudy": body = `<g transform="translate(10 -8) scale(.85)">${WX_SVG.cloud("#c6ced8")}</g>${WX_SVG.cloud("#e8edf2", 4)}`; break;
    case "fog": body = `${WX_SVG.cloud("#d6dce2", -6)}<g stroke="#e8ecef" stroke-width="3.5" stroke-linecap="round"><line x1="12" y1="52" x2="52" y2="52"/><line x1="16" y1="59" x2="48" y2="59"/></g>`; break;
    case "drizzle": body = WX_SVG.cloud("#d3dae2", -4) + drops("#7cc4ff", 2); break;
    case "rain": body = WX_SVG.cloud("#b9c3ce", -4) + drops("#5ab0ff"); break;
    case "heavy-rain": body = WX_SVG.cloud("#8e99a6", -4) + drops("#3d9bff", 4); break;
    case "ice": body = WX_SVG.cloud("#b9c3ce", -4) + drops("#a9e4ff") ; break;
    case "snow": body = WX_SVG.cloud("#d9e1e8", -4) + flakes; break;
    case "storm": body = WX_SVG.cloud("#7d8895", -6) + `<path d="M34 46l-7 10h6l-4 9l11-13h-6l4-6z" fill="#ffd23d"/>`; break;
  }
  return `<svg class="wx-icon" viewBox="0 0 64 64" aria-hidden="true">${body}</svg>`;
}

// ---- UV index sun: grows, changes color and spins faster as UV rises ----

function wxUvInfo(uv) {
  if (uv < 3) return { level: "Low", color: "#3a9d23", tip: "Little protection needed." };
  if (uv < 6) return { level: "Moderate", color: "#e0b400", tip: "Wear sunglasses and sunscreen around midday." };
  if (uv < 8) return { level: "High", color: "#f28c28", tip: "Sunscreen, a hat, and shade from 10am to 4pm." };
  if (uv < 11) return { level: "Very high", color: "#d8262b", tip: "Limit time in the midday sun." };
  return { level: "Extreme", color: "#7b3fa0", tip: "Avoid the sun around midday if you can." };
}

function wxUvSun(uv) {
  const u = Math.max(0, Math.min(uv, 12));
  const info = wxUvInfo(u);
  const r = 13 + u * 1.2;
  const rays = 8 + Math.round(u / 2) * 2;
  const rayLen = 5 + u * 1.5;
  const t = u / 12; // 0 = pale yellow, 1 = deep orange
  const core = `rgb(255, ${Math.round(230 - 110 * t)}, ${Math.round(120 - 110 * t)})`;
  const spin = Math.max(5, 24 - u * 1.6);
  return `
    <svg class="wx-uv-sun" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="${r + rayLen + 6}" fill="${info.color}" opacity="${0.12 + t * 0.25}" class="wx-uv-glow"/>
      <g class="wx-uv-rays" style="animation-duration:${spin}s">
        ${Array.from({ length: rays }, (_, i) => `<line x1="60" y1="${60 - r - 4}" x2="60" y2="${60 - r - 4 - rayLen}" transform="rotate(${(360 / rays) * i} 60 60)" stroke="${info.color}" stroke-width="${2.5 + t * 2}" stroke-linecap="round"/>`).join("")}
      </g>
      <circle cx="60" cy="60" r="${r}" fill="${core}"/>
      <text x="60" y="${60 + 6}" text-anchor="middle" font-size="${12 + t * 6}" font-weight="700" fill="#5a2a00">${Math.round(uv)}</text>
    </svg>`;
}

// ---- Precipitation flask: fills to the amount expected ----

function wxFlask(amount, units) {
  const inches = units === "F";
  const full = inches ? (amount > 1 ? 2 : 1) : (amount > 25 ? 50 : 25);
  const level = Math.min(1, amount / full);
  const label = inches ? `${amount.toFixed(2)} in` : `${amount.toFixed(1)} mm`;
  const light = inches ? 0.1 : 2.5, moderate = inches ? 0.4 : 10;
  const amountWord = amount === 0 ? "None expected" : amount < light ? "Light" : amount < moderate ? "Moderate" : "Heavy";
  const top = 22, bottom = 104, h = (bottom - top) * level;
  return {
    label, amountWord,
    svg: `
      <svg class="wx-flask" viewBox="0 0 80 112" aria-hidden="true">
        <defs><clipPath id="flask-clip"><path d="M28 14h24v26l16 52a10 10 0 0 1-10 12H22a10 10 0 0 1-10-12l16-52z"/></clipPath></defs>
        ${amount > 0 ? `<circle class="wx-flask-drop" cx="40" cy="0" r="3" fill="#5ab0ff"/>` : ""}
        <g clip-path="url(#flask-clip)">
          <rect x="0" y="0" width="80" height="112" fill="rgba(255,255,255,.12)"/>
          <g class="wx-flask-fill" style="--level:${h}px">
            <rect x="0" y="${bottom - h}" width="80" height="${h + 8}" fill="#3d9bff" opacity=".85"/>
            <path class="wx-flask-wave" d="M-40 ${bottom - h} q10 -4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 v8 h-140z" fill="#7cc4ff"/>
          </g>
        </g>
        <path d="M28 14h24v26l16 52a10 10 0 0 1-10 12H22a10 10 0 0 1-10-12l16-52z" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>
        <line x1="24" y1="14" x2="56" y2="14" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
        ${[0.25, 0.5, 0.75].map(f => `<line x1="54" y1="${bottom - (bottom - top) * f}" x2="60" y2="${bottom - (bottom - top) * f}" stroke="#fff" stroke-width="1.5" opacity=".7"/>`).join("")}
      </svg>`,
  };
}

// ---- Background: real photos (Wikimedia Commons) with realistic motion ----

const WX_THUMB = "https://thumb.wikimedia.org/wikipedia/commons/thumb/";
const WX_PHOTOS = {
  clear: { path: "6/6b/Sky_Forest_Clouds.jpg", by: "Unknown author", license: "CC0" },
  night: { path: "d/d3/July_night_sky_%2835972569256%29.jpg", by: "Uroš Novina", license: "CC BY 2.0" },
  partly: { path: "5/57/Cumulus_Clouds_over_Yellow_Prairie2.jpg", by: "Wing-Chi Poon", license: "CC BY-SA 2.5" },
  cloudy: { path: "e/ee/Russia%2C_Krasnojarsk%2C_Kayerkan_-_%D0%9E%D0%B7%D0%B5%D1%80%D0%BE_WMID5787931.jpg", by: "Provko", license: "CC BY-SA 3.0" },
  fog: { path: "5/5a/Wandelen_over_de_Planken_Wambuis_vanuit_Mossel_071.jpg", by: "Agnes Monkelbaan", license: "CC BY-SA 4.0" },
  drizzle: { path: "b/b7/Misty_Green_Mountains.jpg", by: "Talha J Siam", license: "CC BY 4.0" },
  rain: { path: "d/db/Summer_Rain_%28221269359%29.jpeg", by: "Niels Woldberg", license: "CC0" },
  "heavy-rain": { path: "9/96/Heavy_Rain_%28231105637%29.jpeg", by: "Robin Férand", license: "CC BY 3.0" },
  storm: { path: "c/c2/Port_and_lighthouse_overnight_storm_with_lightning_in_Port-la-Nouvelle.jpg", by: "Maxime Raynal", license: "CC BY 2.0" },
  snow: { path: "6/61/Blizzard3_-_NOAA.jpg", by: "NOAA Photo Library", license: "CC BY 2.0" },
  ice: { path: "6/68/Ice-covered_branches_in_Quebec_City.jpg", by: "Wilfredor", license: "CC BY-SA 4.0" },
};

// Clear nights use the night-sky photo; other weather at night dims the day photo.
function wxPhotoKey(code, isDay) {
  const cat = wxCategory(code);
  return !isDay && (cat === "clear" || cat === "partly") ? "night" : cat;
}

function wxPhotoUrl(key, width) {
  const path = WX_PHOTOS[key].path;
  return `${WX_THUMB}${path}/${width}px-${path.split("/").pop()}`;
}

function wxRand(min, max) { return min + Math.random() * (max - min); }

const WX_MOTION = !matchMedia("(prefers-reduced-motion: reduce)").matches;
let wxFx = null; // the running canvas effect

// ---- City photos: a real photo of the city itself in the current weather ----
//
// Searches Wikimedia Commons, most specific first:
//   1. taken near the city, title has the city name and the weather ("Seattle ... rain")
//   2. title has the city name and the weather (anywhere)
//   3. any photo of the city (it gets color-graded and weather effects on top)
// Every photo must be taken in 2010 or later, and a detector in the browser rejects any with people.
// If nothing turns up, the general weather photo is used. Results are cached for two weeks.

const WX_COMMONS = "https://commons.wikimedia.org/w/api.php";
const WX_CITY_WORDS = {
  clear: ["skyline", "panorama"], partly: ["clouds", "skyline"], cloudy: ["overcast", "cloudy"],
  fog: ["fog", "mist"], drizzle: ["rain", "drizzle"], rain: ["rain", "rainy"], "heavy-rain": ["rain", "downpour"],
  storm: ["storm", "lightning"], snow: ["snow", "winter"], ice: ["ice", "snow"], night: ["night", "skyline"],
};
const WX_SKIP = /\b(map|chart|diagram|graph|logo|poster|book|latte|coffee|closeup|close-up|drops?|counts|distribution|plan|seal|flag|sign|ticket|stamp|coin|interior|screenshot|painting|leopard|bird|magpie|portrait)\b|\(\d{4}\) \(\d{8,}\)/i;
const WX_NIGHT_WORDS = /\b(night|dusk|evening|sunset|twilight)\b/i;
const WX_CACHE_DAYS = 14;

// One request at a time with a short gap, so Commons doesn't rate-limit us.
// The selected city's photo jumps the queue.
const wxQueue = [];
let wxQueueBusy = false;
function wxQueued(task, urgent) {
  return new Promise(resolve => {
    wxQueue[urgent ? "unshift" : "push"]({ task, resolve });
    wxRunQueue();
  });
}
async function wxRunQueue() {
  if (wxQueueBusy) return;
  wxQueueBusy = true;
  while (wxQueue.length) {
    const { task, resolve } = wxQueue.shift();
    try { resolve(await task()); } catch { resolve(undefined); }
    await new Promise(r => setTimeout(r, 400));
  }
  wxQueueBusy = false;
}

// Photos must be modern (taken 2010 or later) and show no people.
const WX_MIN_YEAR = 2010;
const WX_OLD = /\b(archives?|vintage|historic(al)?|old photo|postcard|19\d\d|200\d)\b/i;
const WX_PEOPLE_WORDS = /\b(people|person|man|men|woman|women|girl|boy|child(ren)?|kids?|crowd|tourists?|portrait|selfie|couple|family|festival|parade|protest|march|marathon|runners?|cyclists?|pedestrians?|wedding|concert|fans|market|beach)\b/i;

function wxYearTaken(meta) {
  // Only trust the "date taken"; an upload date says nothing about when the photo was made.
  const m = String(meta.DateTimeOriginal?.value || "").replace(/<[^>]+>/g, "").match(/\b(19|20)\d\d\b/);
  return m ? Number(m[0]) : 0;
}

// Returns a list of candidate photos (best first), or throws if Commons is busy.
async function wxCommonsSearch(query, key) {
  const url = new URL(WX_COMMONS);
  Object.entries({
    action: "query", generator: "search", gsrnamespace: "6", gsrlimit: "20",
    // Skip files tagged as depicting a human (P180 = Q5) up front.
    gsrsearch: `${query} -haswbstatement:P180=Q5 filemime:image/jpeg`, prop: "imageinfo", iiprop: "url|size|extmetadata",
    iiextmetadatafilter: "LicenseShortName|Artist|DateTimeOriginal", iiurlwidth: "1920", format: "json", formatversion: "2", origin: "*",
  }).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url);
  if (!res.ok) throw new Error("busy");
  const data = await res.json();
  return (data.query?.pages || [])
    .sort((a, b) => a.index - b.index)
    .filter(p => {
      const i = p.imageinfo?.[0];
      if (!i || i.width < 1400 || i.width / i.height < 1.25 || i.width / i.height > 2.6) return false;
      if (WX_SKIP.test(p.title) || WX_OLD.test(p.title) || WX_PEOPLE_WORDS.test(p.title)) return false;
      if (wxYearTaken(i.extmetadata || {}) < WX_MIN_YEAR) return false;
      // Day weather shouldn't show a night photo, and a clear night should.
      return key === "night" ? true : !WX_NIGHT_WORDS.test(p.title);
    })
    .map(p => {
      const i = p.imageinfo[0];
      const meta = i.extmetadata || {};
      return {
        big: i.thumburl || i.url,
        small: (i.thumburl || i.url).replace("/1920px-", "/500px-"),
        file: p.title.slice(5),
        by: (meta.Artist?.value || "Unknown").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 60),
        license: meta.LicenseShortName?.value || "",
        year: wxYearTaken(meta),
      };
    });
}

// ---- People check: an object-detection model (COCO-SSD) runs in the browser ----

let wxDetectorPromise = null;

function wxLoadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// Loaded only when a new photo needs checking. Resolves to null if it can't load.
function wxDetector() {
  wxDetectorPromise ||= (async () => {
    try {
      if (!window.tf) await wxLoadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js");
      if (!window.cocoSsd) await wxLoadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js");
      return await cocoSsd.load({ base: "lite_mobilenet_v2" }); // ~20 MB, cached by the browser
    } catch {
      return null;
    }
  })();
  return wxDetectorPromise;
}

// true = a person is in the photo, false = none found, null = couldn't check.
async function wxHasPeople(url) {
  const model = await wxDetector();
  if (!model) return null;
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    await img.decode();
    // The model shrinks images to ~300px, so distant people vanish. Check the whole
    // photo plus six overlapping sections, each enlarged, to catch small figures.
    const W = img.naturalWidth, H = img.naturalHeight;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const regions = [[0, 0, W, H]];
    const tw = W / 2.4, th = H / 1.6;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) regions.push([c * (W - tw) / 2, r * (H - th), tw, th]);
    }
    for (const [x, y, w, h] of regions) {
      canvas.width = 400;
      canvas.height = Math.round((400 * h) / w);
      ctx.drawImage(img, x, y, w, h, 0, 0, canvas.width, canvas.height);
      const found = await model.detect(canvas, 20, 0.35);
      if (found.some(d => d.class === "person")) return true;
    }
    return false;
  } catch {
    return null;
  }
}

// First candidate the detector confirms has nobody in it.
async function wxFirstWithoutPeople(candidates) {
  for (const c of candidates.slice(0, 6)) {
    const people = await wxHasPeople(c.big.replace("/1920px-", "/960px-"));
    if (people === false) return c;
    if (people === null) return undefined; // detector unavailable: don't cache, try again later
  }
  return null;
}

function wxPhotoCacheKey(city, key) {
  return `wxp2:${city.lat.toFixed(2)},${city.lon.toFixed(2)}:${key}`;
}

function wxCachedPhoto(city, key) {
  try {
    const hit = JSON.parse(localStorage.getItem(wxPhotoCacheKey(city, key)) || "null");
    if (hit && Date.now() - hit.t < WX_CACHE_DAYS * 864e5) return hit;
  } catch { /* no cache */ }
  return undefined;
}

// Returns { big, small, by, license, file, match } or null (use the general photo).
// match: true when the photo itself shows this weather; false for a plain city photo.
async function wxFindCityPhoto(city, key, urgent) {
  const cached = wxCachedPhoto(city, key);
  if (cached !== undefined) return cached.photo;

  const words = WX_CITY_WORDS[key] || ["skyline"];
  const near = `nearcoord:40km,${city.lat},${city.lon}`;
  const named = city.name && city.name !== "My location" ? `intitle:"${city.name.replace(/"/g, "")}"` : "";
  const tries = [];
  for (const w of words) tries.push([`${near} ${named} intitle:${w}`, true]);
  if (named) tries.push([`${named} intitle:${words[0]}`, true]);
  tries.push([`${near} ${named || "intitle:skyline"}`, false]);

  let photo = null, failed = false;
  for (const [query, match] of tries) {
    const found = await wxQueued(() => wxCommonsSearch(query, key), urgent);
    if (found === undefined) { failed = true; break; } // rate-limited or offline: try again later
    const pick = await wxFirstWithoutPeople(found);
    if (pick === undefined) { failed = true; break; }
    if (pick) { photo = { ...pick, match }; break; }
  }
  if (!failed) {
    try { localStorage.setItem(wxPhotoCacheKey(city, key), JSON.stringify({ t: Date.now(), photo })); } catch { /* fine */ }
  }
  return photo;
}

function wxCredit(photo) {
  const file = encodeURIComponent(photo.file.replace(/ /g, "_"));
  return `Photo: <a href="https://commons.wikimedia.org/wiki/File:${file}" target="_blank" rel="noopener">${escapeHtml(photo.by)}</a>${photo.license ? `, ${escapeHtml(photo.license)}` : ""}, via Wikimedia Commons`;
}

let wxSceneId = 0;

function renderWxScene(code, isDay, city) {
  const scene = document.getElementById("wx-scene");
  const cat = wxCategory(code);
  const key = wxPhotoKey(code, isDay);
  const general = WX_PHOTOS[key];
  const dim = !isDay && key !== "night";
  const id = ++wxSceneId;

  // Photos live in their own layer so a new city can fade in over the old one.
  if (!scene.querySelector(".wx-photos")) {
    scene.innerHTML = `<div class="wx-photos"></div><div class="wx-extras"></div>`;
  }
  const photos = scene.querySelector(".wx-photos");
  const extras = scene.querySelector(".wx-extras");

  // Soft, blurred vapor that drifts on the breeze (clouds, mist and fog).
  const vapor = { partly: 3, cloudy: 5, fog: 7, drizzle: 5, rain: 4, "heavy-rain": 4, storm: 4, snow: 3, ice: 3 }[cat] || 0;
  const wisps = Array.from({ length: vapor }, () => {
    const dur = wxRand(80, 160);
    const low = cat === "fog" ? wxRand(35, 75) : wxRand(-5, 30);
    return `<div class="wx-vapor${cat === "fog" ? " fog" : ""}" style="top:${low}%;width:${wxRand(40, 70)}vw;height:${wxRand(18, 34)}vh;animation-duration:${dur}s;animation-delay:${-wxRand(0, dur)}s"></div>`;
  }).join("");
  extras.innerHTML = `
    ${wisps}
    <canvas class="wx-fx" id="wx-fx"></canvas>
    <div class="wx-flash" id="wx-flash"></div>
    <div class="wx-shade"></div>`;
  // Fade the mist/rain/snow in along with the new photo.
  extras.classList.remove("fade-in");
  void extras.offsetWidth;
  extras.classList.add("fade-in");
  startWxFx(cat);

  const credit = document.getElementById("wx-photo-credit");
  const grade = p => (p && !p.match ? ` grade-${cat}` : "");

  // Load the image first, then fade it in over whatever is showing and drop the old layers.
  const show = (url, extraClass, creditHtml) => {
    const img = new Image();
    const reveal = () => {
      if (id !== wxSceneId) return; // a newer city was picked meanwhile
      const el = document.createElement("div");
      el.className = `wx-photo fade-in${dim ? " dim" : ""}${extraClass}`;
      el.style.backgroundImage = `url('${url}')`;
      photos.appendChild(el);
      credit.innerHTML = creditHtml;
      el.addEventListener("animationend", e => {
        if (e.animationName !== "wx-fade") return;
        while (photos.firstElementChild !== el) photos.firstElementChild.remove();
      });
    };
    img.src = url;
    // Already loaded (preloaded before switching): start right away, in step with the details.
    if (img.complete && img.naturalWidth) reveal();
    else img.onload = img.onerror = reveal;
  };

  const generalCredit = wxCredit({ file: decodeURIComponent(general.path.split("/").pop()), by: general.by, license: general.license });
  const cached = city ? wxCachedPhoto(city, key) : undefined;
  if (cached?.photo) {
    show(cached.photo.big, grade(cached.photo), wxCredit(cached.photo));
  } else {
    show(wxPhotoUrl(key, 1920), "", generalCredit);
  }

  // Not cached yet: look for the city's own photo, then fade it in once found.
  if (city && cached === undefined) {
    wxFindCityPhoto(city, key, true).then(photo => {
      if (photo && id === wxSceneId) show(photo.big, grade(photo), wxCredit(photo));
    });
  }
}

// Canvas particles: rain streaks at three depths, soft out-of-focus snow,
// and random double flashes of lightning in storms.
function startWxFx(cat) {
  if (wxFx) cancelAnimationFrame(wxFx.raf);
  wxFx = null;
  const canvas = document.getElementById("wx-fx");
  if (!canvas || !WX_MOTION) return;
  const ctx = canvas.getContext("2d");
  const rainCount = { drizzle: 140, rain: 320, "heavy-rain": 650, storm: 520, ice: 260 }[cat] || 0;
  const snowCount = cat === "snow" ? 260 : 0;
  if (!rainCount && !snowCount && cat !== "storm") return;

  let w, h;
  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size();

  const wind = cat === "storm" || cat === "heavy-rain" ? 0.22 : 0.1;
  const drops = Array.from({ length: rainCount }, () => {
    const z = Math.random(); // 0 = far, 1 = near
    return { x: wxRand(-0.2, 1.1), y: Math.random(), z, len: 10 + z * (cat === "drizzle" ? 8 : 26), speed: 0.6 + z * 0.9 };
  });
  const flakes = Array.from({ length: snowCount }, () => {
    const z = Math.random();
    return { x: Math.random(), y: Math.random(), z, r: 0.8 + z * 3.2, speed: 0.04 + z * 0.08, phase: wxRand(0, 6.3) };
  });
  const flash = document.getElementById("wx-flash");
  let nextBolt = performance.now() + wxRand(3000, 8000);
  let last = performance.now();

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (canvas.clientWidth !== w || canvas.clientHeight !== h) size();
    ctx.clearRect(0, 0, w, h);

    if (drops.length) {
      ctx.lineCap = "round";
      for (const d of drops) {
        d.y += d.speed * dt * 1.6;
        d.x += wind * d.speed * dt;
        if (d.y > 1.05) { d.y = -0.05; d.x = wxRand(-0.2, 1.1); }
        const x = d.x * w, y = d.y * h;
        ctx.strokeStyle = `rgba(${cat === "ice" ? "225,240,255" : "210,220,230"},${0.08 + d.z * 0.32})`;
        ctx.lineWidth = 0.6 + d.z * 0.9;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - wind * d.len, y - d.len);
        ctx.stroke();
      }
    }
    for (const f of flakes) {
      f.y += f.speed * dt;
      f.phase += dt * (0.6 + f.z);
      if (f.y > 1.03) { f.y = -0.03; f.x = Math.random(); }
      const x = (f.x + Math.sin(f.phase) * 0.01 * (1 + f.z)) * w, y = f.y * h;
      // Near flakes are bigger and blurrier, like a camera's depth of field.
      const g = ctx.createRadialGradient(x, y, 0, x, y, f.r * (1.4 + f.z));
      g.addColorStop(0, `rgba(255,255,255,${0.5 + f.z * 0.4})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, f.r * (1.4 + f.z), 0, Math.PI * 2);
      ctx.fill();
    }
    if (cat === "storm" && now > nextBolt) {
      flash.classList.remove("on");
      void flash.offsetWidth; // restart the flash animation
      flash.classList.add("on");
      nextBolt = now + wxRand(5000, 14000);
    }
    wxFx.raf = requestAnimationFrame(frame);
  }
  wxFx = { raf: requestAnimationFrame(frame) };
}

function stopWxFx() {
  if (wxFx) cancelAnimationFrame(wxFx.raf);
  wxFx = null;
}

// ---- State ----

const wx = {
  units: "F",
  cities: [],
  selected: 0,
  cache: {},
  forecast: null,
  request: 0,
};

const wxClean = c => ({ name: c.name, admin: c.admin, country: c.country, lat: c.lat, lon: c.lon });

function wxLoadPrefs() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem("wx-list") || "null");
    if (!saved) {
      // Carry over cities added before the list became fully editable.
      const old = JSON.parse(localStorage.getItem("wx-cities") || "[]");
      if (old.length) saved = [...old, ...WX_PRESETS];
    }
    // Drop photo picks saved before the "modern, no people" rules.
    Object.keys(localStorage).filter(k => k.startsWith("wxp:")).forEach(k => localStorage.removeItem(k));
    wx.units = localStorage.getItem("wx-units") || "F";
    wx.selected = Number(localStorage.getItem("wx-selected")) || 0;
  } catch { /* storage unavailable — use defaults */ }
  wx.cities = (Array.isArray(saved) && saved.length ? saved : WX_PRESETS).map(wxClean);
  if (wx.selected >= wx.cities.length) wx.selected = 0;
}

function wxSavePrefs() {
  try {
    localStorage.setItem("wx-list", JSON.stringify(wx.cities.map(wxClean)));
    localStorage.setItem("wx-units", wx.units);
    localStorage.setItem("wx-selected", String(wx.selected));
  } catch { /* fine without it */ }
}

function wxUnitParams() {
  return wx.units === "F"
    ? { temperature_unit: "fahrenheit", wind_speed_unit: "mph", precipitation_unit: "inch" }
    : { temperature_unit: "celsius", wind_speed_unit: "kmh", precipitation_unit: "mm" };
}

async function wxFetch(base, params) {
  const url = new URL(base);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather service returned ${res.status}`);
  return res.json();
}

// ---- City strip (horizontal scroller, each city shows its current weather) ----

const wxStrip = () => document.getElementById("wx-strip");

function renderWxStrip() {
  const canRemove = wx.cities.length > 1;
  wxStrip().innerHTML = wx.cities.map((c, i) => {
    const cur = c.current;
    const key = cur ? wxPhotoKey(cur.code, cur.isDay) : null;
    const own = key ? wxCachedPhoto(c, key)?.photo : null; // this city's own photo, if found before
    const bg = key ? ` style="background-image:url('${own ? own.small : wxPhotoUrl(key, 500)}')"` : "";
    return `
      <div class="wx-city${cur && !cur.isDay && key !== "night" ? " dim" : ""}${own && !own.match ? ` grade-${wxCategory(cur.code)}` : ""}"${bg}>
        <button type="button" class="wx-city-pick" data-i="${i}" aria-pressed="${i === wx.selected}">
          ${cur ? wxIcon(cur.code, cur.isDay) : `<span class="wx-icon wx-icon-loading"></span>`}
          <span class="wx-city-temp">${cur ? Math.round(cur.temp) + "°" : "–"}</span>
          <span class="wx-city-name">${escapeHtml(c.name)}</span>
        </button>
        ${canRemove ? `<button type="button" class="wx-city-remove" data-remove="${i}" title="Remove ${escapeHtml(c.name)}" aria-label="Remove ${escapeHtml(c.name)}">×</button>` : ""}
      </div>`;
  }).join("") + `
    <button type="button" class="wx-city wx-city-add" id="wx-add-tile">
      <span class="wx-add-plus" aria-hidden="true">+</span>
      <span class="wx-city-name">Add city</span>
    </button>`;
  const sel = wxStrip().querySelector('[aria-pressed="true"]');
  if (sel) sel.parentElement.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
}

// Swap each tile's general weather photo for a photo of that city, one at a time in the background.
function wxLoadTilePhotos() {
  for (const c of wx.cities) {
    if (!c.current) continue;
    const key = wxPhotoKey(c.current.code, c.current.isDay);
    wxFindCityPhoto(c, key, false).then(photo => {
      const i = wx.cities.indexOf(c);
      if (!photo || i < 0) return;
      const tile = wxStrip().querySelector(`.wx-city-pick[data-i="${i}"]`)?.parentElement;
      if (!tile) return;
      tile.style.backgroundImage = `url('${photo.small}')`;
      if (!photo.match) tile.classList.add(`grade-${wxCategory(c.current.code)}`);
    });
  }
}

// One request gets current conditions for every city in the strip.
async function loadWxStripWeather() {
  try {
    const data = await wxFetch(WX_API, {
      latitude: wx.cities.map(c => c.lat).join(","),
      longitude: wx.cities.map(c => c.lon).join(","),
      current: "temperature_2m,weather_code,is_day",
      timezone: "auto",
      ...wxUnitParams(),
    });
    const list = Array.isArray(data) ? data : [data];
    list.forEach((d, i) => {
      if (wx.cities[i]) wx.cities[i].current = { temp: d.current.temperature_2m, code: d.current.weather_code, isDay: !!d.current.is_day };
    });
    renderWxStrip();
    wxLoadTilePhotos();
  } catch { /* strip still works without the mini forecasts */ }
}

// ---- Main forecast ----

// Load an image into the browser cache; resolves when it's ready (or after a timeout).
function wxPreload(url, timeout = 4000) {
  return new Promise(resolve => {
    const img = new Image();
    const done = () => { clearTimeout(timer); resolve(); };
    const timer = setTimeout(resolve, timeout);
    img.onload = img.onerror = done;
    img.src = url;
  });
}

// The photo a city's scene will open with: its own photo if already found, else the general one.
function wxScenePhotoUrl(code, isDay, city) {
  const key = wxPhotoKey(code, isDay);
  const own = city ? wxCachedPhoto(city, key)?.photo : null;
  return own ? own.big : wxPhotoUrl(key, 1920);
}

async function loadWxForecast() {
  const city = wx.cities[wx.selected];
  const key = `${city.lat},${city.lon},${wx.units}`;
  const req = ++wx.request;
  const cached = wx.cache[key];
  // The old city stays fully visible until the new city's weather AND photo are ready;
  // then the background and the details crossfade together (see renderWxMain).
  // A shimmer on the picked tile shows the new city is on its way.
  wxStrip().querySelector('[aria-pressed="true"]')?.parentElement.classList.add("loading");
  const doneLoading = () => wxStrip().querySelectorAll(".wx-city.loading").forEach(t => t.classList.remove("loading"));
  if (!wx.forecast) {
    document.getElementById("wx-now").innerHTML = `<p class="wx-status">Loading weather for ${escapeHtml(city.name)}…</p>`;
  }
  try {
    let data = cached && Date.now() - cached.at < 10 * 60 * 1000 ? cached.data : null;
    if (!data) {
      data = await wxFetch(WX_API, {
        latitude: city.lat,
        longitude: city.lon,
        current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation,is_day,uv_index",
        hourly: "temperature_2m,weather_code,precipitation_probability,is_day",
        daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max,sunrise,sunset,wind_speed_10m_max",
        timezone: "auto",
        forecast_days: "5",
        ...wxUnitParams(),
      });
      wx.cache[key] = { at: Date.now(), data };
    }
    if (req !== wx.request) return;
    await wxPreload(wxScenePhotoUrl(data.current.weather_code, !!data.current.is_day, city));
    if (req !== wx.request) return;
    wx.forecast = data;
    doneLoading();
    renderWxMain();
  } catch (err) {
    if (req !== wx.request) return;
    doneLoading();
    document.getElementById("wx-now").innerHTML = `<p class="wx-status">Couldn't load the weather: ${escapeHtml(err.message)}</p>`;
  }
}

// Crossfade the details: the old text and icons fade out on top while the new ones
// fade in underneath, in the same cards, at the same pace as the background photo.
function wxCrossfadeInfo(render) {
  const wrap = document.querySelector(".wx-wrap");
  const now = document.getElementById("wx-now");
  const days = document.getElementById("wx-days");
  const animate = !!now.querySelector(".wx-now-place") && WX_MOTION;
  const ghosts = animate ? [now, days].map(el => {
    const ghost = el.cloneNode(true);
    ghost.removeAttribute("id");
    ghost.setAttribute("aria-hidden", "true");
    ghost.classList.remove("wx-xf-in");
    ghost.classList.add("wx-ghost");
    Object.assign(ghost.style, {
      top: `${el.offsetTop}px`, left: `${el.offsetLeft}px`,
      width: `${el.offsetWidth}px`, height: `${el.offsetHeight}px`,
    });
    return ghost;
  }) : [];
  render();
  if (!animate) return;
  ghosts.forEach(g => {
    wrap.appendChild(g);
    g.addEventListener("animationend", () => g.remove());
  });
  for (const el of [now, days]) {
    el.classList.remove("wx-xf-in");
    void el.offsetWidth; // restart the fade-in
    el.classList.add("wx-xf-in");
  }
}

// Chance of the day's weather: for wet days, the chance of precipitation;
// for dry days, the share of daytime hours forecast to have that weather.
function wxDayChance(f, i) {
  const code = f.daily.weather_code[i];
  const cat = wxCategory(code);
  if (WX_WET.has(cat)) return f.daily.precipitation_probability_max[i] ?? 0;
  const date = f.daily.time[i];
  let total = 0, match = 0;
  f.hourly.time.forEach((t, h) => {
    if (!t.startsWith(date)) return;
    const hour = Number(t.slice(11, 13));
    if (hour < 8 || hour > 19) return;
    total++;
    if (wxCategory(f.hourly.weather_code[h]) === cat) match++;
  });
  return total ? Math.round((100 * match) / total) : 0;
}

function wxDayName(date, i) {
  if (i === 0) return "Today";
  return new Date(date + "T12:00").toLocaleDateString(undefined, { weekday: "long" });
}

function wxTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function renderWxMain() {
  const f = wx.forecast;
  const city = wx.cities[wx.selected];
  const c = f.current;
  const isDay = !!c.is_day;
  // Background and details start their crossfades in the same frame, at the same pace.
  renderWxScene(c.weather_code, isDay, city);
  wxCrossfadeInfo(() => renderWxInfo(f, city, c, isDay));
}

function renderWxInfo(f, city, c, isDay) {
  const delay = wxTravelDelay(c.weather_code);
  document.getElementById("wx-now").innerHTML = `
    <div class="wx-now-place">${escapeHtml(city.name)}${city.admin ? `, ${escapeHtml(city.admin)}` : ""}</div>
    <div class="wx-now-main">
      ${wxIcon(c.weather_code, isDay)}
      <div class="wx-now-temp">${Math.round(c.temperature_2m)}°</div>
    </div>
    <div class="wx-now-label">${wxLabel(c.weather_code, isDay)}</div>
    <div class="wx-now-range">H ${Math.round(f.daily.temperature_2m_max[0])}° · L ${Math.round(f.daily.temperature_2m_min[0])}°</div>
    ${delay ? `<div class="wx-chip">Travel: trips take about ${Math.round(delay * 100)}% longer right now</div>` : ""}
    <div class="wx-hint">Tap for details</div>`;

  document.getElementById("wx-days").innerHTML = f.daily.time.map((date, i) => {
    const code = f.daily.weather_code[i];
    return `
      <button type="button" class="wx-day glass" data-day="${i}">
        <span class="wx-day-name">${wxDayName(date, i).slice(0, i === 0 ? 5 : 3)}</span>
        ${wxIcon(code)}
        <span class="wx-day-label">${wxLabel(code)}</span>
        <span class="wx-day-chance" title="Chance of this weather">${wxDayChance(f, i)}%</span>
        <span class="wx-day-temps"><b>${Math.round(f.daily.temperature_2m_max[i])}°</b> ${Math.round(f.daily.temperature_2m_min[i])}°</span>
      </button>`;
  }).join("");
}

// ---- Detail panel (opens when you tap "now" or a day) ----

function openWxDetail(i) {
  const f = wx.forecast;
  const units = wx.units;
  const d = f.daily;
  const code = d.weather_code[i];
  const chance = wxDayChance(f, i);
  const precip = d.precipitation_sum[i] ?? 0;
  const flask = wxFlask(precip, units);
  const uv = d.uv_index_max[i] ?? 0;
  const uvInfo = wxUvInfo(uv);
  const delay = wxTravelDelay(code);
  const speed = units === "F" ? "mph" : "km/h";
  const date = d.time[i];
  const c = f.current;

  const hours = f.hourly.time
    .map((t, h) => ({ t, h }))
    .filter(({ t }) => t.startsWith(date) && Number(t.slice(11, 13)) % 3 === 0);

  const dialog = document.getElementById("wx-detail");
  dialog.innerHTML = `
    <div class="wx-detail-inner">
      <button type="button" class="wx-close" aria-label="Close">×</button>
      <header class="wx-detail-head">
        ${wxIcon(code)}
        <div>
          <h2>${wxDayName(date, i)} <small>${new Date(date + "T12:00").toLocaleDateString(undefined, { month: "long", day: "numeric" })}</small></h2>
          <p><strong>${wxLabel(code)}</strong> · ${chance}% chance · H ${Math.round(d.temperature_2m_max[i])}° / L ${Math.round(d.temperature_2m_min[i])}°</p>
          ${i === 0 ? `<p class="wx-detail-now">Now ${Math.round(c.temperature_2m)}°, feels like ${Math.round(c.apparent_temperature)}° · Humidity ${c.relative_humidity_2m}%</p>` : ""}
        </div>
      </header>

      <div class="wx-detail-grid">
        <section class="wx-card">
          <h3>Precipitation</h3>
          <div class="wx-card-body">
            ${flask.svg}
            <div>
              <div class="wx-big">${flask.label}</div>
              <div>${flask.amountWord}</div>
              <div class="wx-muted">${d.precipitation_probability_max[i] ?? 0}% chance of rain or snow</div>
            </div>
          </div>
        </section>

        <section class="wx-card">
          <h3>UV index</h3>
          <div class="wx-card-body">
            ${wxUvSun(uv)}
            <div>
              <div class="wx-big" style="color:${uvInfo.color}">${uvInfo.level}</div>
              <div>Peak UV ${uv.toFixed(1)}</div>
              <div class="wx-muted">${uvInfo.tip}</div>
            </div>
          </div>
        </section>

        <section class="wx-card">
          <h3>Wind &amp; sun</h3>
          <ul class="wx-facts">
            <li><span>Max wind</span><b>${Math.round(d.wind_speed_10m_max[i])} ${speed}</b></li>
            <li><span>Sunrise</span><b>${wxTime(d.sunrise[i])}</b></li>
            <li><span>Sunset</span><b>${wxTime(d.sunset[i])}</b></li>
          </ul>
        </section>

        ${delay ? `
        <section class="wx-card wx-travel">
          <h3>Travel time</h3>
          <p>${wxLabel(code)} slows traffic. On average, trips take about <b>${Math.round(delay * 100)}% longer</b>.</p>
          <label class="wx-trip">My usual trip:
            <input type="number" min="1" max="600" value="30" id="wx-trip-min"> min
          </label>
          <p class="wx-trip-out" id="wx-trip-out"></p>
          <p class="wx-muted">Estimates based on U.S. Federal Highway Administration road-weather research.</p>
        </section>` : ""}
      </div>

      <section class="wx-card">
        <h3>Through the day</h3>
        <div class="wx-hours">
          ${hours.map(({ t, h }) => `
            <div class="wx-hour">
              <span>${new Date(t).toLocaleTimeString(undefined, { hour: "numeric" })}</span>
              ${wxIcon(f.hourly.weather_code[h], !!f.hourly.is_day[h])}
              <b>${Math.round(f.hourly.temperature_2m[h])}°</b>
              <span class="wx-muted">${f.hourly.precipitation_probability[h] ?? 0}%</span>
            </div>`).join("")}
        </div>
      </section>
    </div>`;

  const tripInput = dialog.querySelector("#wx-trip-min");
  if (tripInput) {
    const update = () => {
      const mins = Math.max(0, Number(tripInput.value) || 0);
      const extra = Math.round(mins * delay);
      dialog.querySelector("#wx-trip-out").textContent =
        `About ${mins + extra} minutes instead of ${mins} (${extra} extra).`;
    };
    tripInput.addEventListener("input", update);
    update();
  }
  dialog.querySelector(".wx-close").addEventListener("click", () => dialog.close());
  dialog.showModal();
}

// ---- City search ----

let wxSearchTimer = 0;

async function wxSearch(q) {
  const box = document.getElementById("wx-results");
  if (q.trim().length < 2) { box.hidden = true; return; }
  try {
    const data = await wxFetch(WX_GEO, { name: q.trim(), count: "6", language: "en", format: "json" });
    const results = data.results || [];
    box.innerHTML = results.length
      ? results.map((r, i) => `<button type="button" data-r="${i}">${escapeHtml(r.name)}<small>${escapeHtml([r.admin1, r.country].filter(Boolean).join(", "))}</small></button>`).join("")
      : `<p>No places found.</p>`;
    box.hidden = false;
    box.onclick = e => {
      const btn = e.target.closest("[data-r]");
      if (!btn) return;
      const r = results[btn.dataset.r];
      wxAddCity({ name: r.name, admin: r.admin1 || r.country, country: r.country_code, lat: r.latitude, lon: r.longitude });
      box.hidden = true;
      document.getElementById("wx-search").value = "";
    };
  } catch {
    box.innerHTML = `<p>Search isn't available right now.</p>`;
    box.hidden = false;
  }
}

function wxAddCity(city) {
  let i = wx.cities.findIndex(c => Math.abs(c.lat - city.lat) < 0.05 && Math.abs(c.lon - city.lon) < 0.05);
  if (i < 0) {
    // New cities go at the end of the strip, next to the "Add city" tile.
    wx.cities.push(wxClean(city));
    i = wx.cities.length - 1;
  }
  wxSelect(i);
  loadWxStripWeather();
}

function wxRemoveCity(i) {
  if (wx.cities.length <= 1) return;
  wx.cities.splice(i, 1);
  // Keep the same city selected; if it was the one removed, select its neighbor.
  if (wx.selected > i || wx.selected >= wx.cities.length) wx.selected--;
  wxSelect(Math.max(0, wx.selected));
}

function wxResetCities() {
  if (!confirm("Reset the city list to the original 16 cities?")) return;
  wx.cities = WX_PRESETS.map(wxClean);
  wxSelect(0);
  loadWxStripWeather();
}

function wxSelect(i) {
  wx.selected = i;
  wxSavePrefs();
  renderWxStrip();
  loadWxForecast();
  wxmCityChanged();
}

// ---- Page setup ----

let wxReady = false;

function showWeather() {
  document.title = "Weather — Stacks";
  if (!wxReady) {
    wxReady = true;
    wxLoadPrefs();
    wxBindEvents();
    loadWxStripWeather();
  }
  document.getElementById("wx-units").textContent = wx.units === "F" ? "°F" : "°C";
  renderWxStrip();
  loadWxForecast();
}

function wxBindEvents() {
  wxmBindEvents();
  wxStrip().addEventListener("click", e => {
    const remove = e.target.closest("[data-remove]");
    if (remove) {
      wxRemoveCity(Number(remove.dataset.remove));
      return;
    }
    if (e.target.closest("#wx-add-tile")) {
      const search = document.getElementById("wx-search");
      search.focus();
      search.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    const pick = e.target.closest(".wx-city-pick");
    if (pick) wxSelect(Number(pick.dataset.i));
  });
  document.getElementById("wx-reset").addEventListener("click", wxResetCities);
  // Mouse wheel scrolls the city strip sideways.
  wxStrip().addEventListener("wheel", e => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      wxStrip().scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, { passive: false });

  document.getElementById("wx-now").addEventListener("click", () => wx.forecast && openWxDetail(0));
  document.getElementById("wx-now").addEventListener("keydown", e => {
    if ((e.key === "Enter" || e.key === " ") && wx.forecast) { e.preventDefault(); openWxDetail(0); }
  });
  document.getElementById("wx-days").addEventListener("click", e => {
    const day = e.target.closest("[data-day]");
    if (day) openWxDetail(Number(day.dataset.day));
  });
  const dialog = document.getElementById("wx-detail");
  dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });

  document.getElementById("wx-units").addEventListener("click", () => {
    wx.units = wx.units === "F" ? "C" : "F";
    wxSavePrefs();
    document.getElementById("wx-units").textContent = wx.units === "F" ? "°F" : "°C";
    loadWxStripWeather();
    loadWxForecast();
    wxmUnitsChanged();
  });

  const search = document.getElementById("wx-search");
  search.addEventListener("input", () => {
    clearTimeout(wxSearchTimer);
    wxSearchTimer = setTimeout(() => wxSearch(search.value), 300);
  });
  search.addEventListener("keydown", e => {
    if (e.key === "Escape") document.getElementById("wx-results").hidden = true;
  });

  document.getElementById("wx-locate").addEventListener("click", () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => wxAddCity({ name: "My location", lat: +pos.coords.latitude.toFixed(2), lon: +pos.coords.longitude.toFixed(2) }),
      () => alert("Couldn't get your location. You can search for your city instead.")
    );
  });
}
