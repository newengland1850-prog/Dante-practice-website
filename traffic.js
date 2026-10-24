// Traffic tab (#/traffic): a US traffic map through the day, trip times with a
// peppermint route line, and local stores nearby. Zoomed out, the map shows highways
// across the whole country (traffic-us-roads.json, from Natural Earth); zoomed in, it
// loads every main road in the area from OpenStreetMap.
//
// There is no free live-traffic feed, so the map shows *typical* traffic: a US commute
// pattern by hour (peaks around 7–8 AM and 5 PM on weekdays), scaled by road type,
// city size and closeness to downtown. Roads and stores come from OpenStreetMap, routes
// from the OSRM demo server. City and place search: Open-Meteo and Photon.

const TR_API = (window.STACKS_CONFIG && window.STACKS_CONFIG.apiBase) || "";
const TR_OVERPASS = "https://overpass-api.de/api/interpreter";

// How busy roads are at each hour (0 = empty, 1 = the worst of the day), local time.
const TR_PROFILE = {
  weekday: [0.05, 0.03, 0.03, 0.03, 0.07, 0.2, 0.5, 0.85, 0.8, 0.55, 0.45, 0.5,
    0.55, 0.5, 0.55, 0.7, 0.9, 1.0, 0.8, 0.5, 0.35, 0.25, 0.15, 0.08],
  weekend: [0.1, 0.07, 0.05, 0.03, 0.03, 0.05, 0.1, 0.18, 0.28, 0.4, 0.5, 0.57,
    0.6, 0.6, 0.58, 0.55, 0.52, 0.5, 0.45, 0.38, 0.3, 0.25, 0.18, 0.12],
};
const TR_SENS = [1.45, 1.3, 1.15, 0.95];       // motorway, trunk, primary, secondary
const TR_WEIGHT = [4.5, 3.8, 2.8, 2];
const TR_LEVELS = [
  { name: "Free flowing", color: "#3f9b4f", max: 0.4 },
  { name: "Moderate", color: "#e2b93b", max: 0.65 },
  { name: "Heavy", color: "#e07a2e", max: 0.9 },
  { name: "Severe", color: "#a81e24", max: Infinity },
];

// Store groups for the filter chips.
const TR_STORE_CATS = [
  { id: "all", label: "All" },
  { id: "food", label: "Food & drink", re: /^(bakery|butcher|cheese|chocolate|coffee|confectionery|deli|farm|greengrocer|health_food|pastry|seafood|spices|tea|wine|alcohol|beverages|convenience|supermarket|frozen_food|ice_cream|nuts|water|dairy|bagel|food)$/ },
  { id: "gifts", label: "Books & gifts", re: /^(books|gift|art|antiques|music|musical_instrument|stationery|toys|games|collector|craft|frame|photo|video_games|anime|religion|party|perfumery|cosmetics|tattoo)$/ },
  { id: "clothes", label: "Clothing", re: /^(clothes|shoes|boutique|fashion_accessories|jewelry|bag|leather|tailor|fabric|watches|second_hand|bridal|hat)$/ },
  { id: "home", label: "Home & garden", re: /^(furniture|garden_centre|florist|hardware|houseware|interior_decoration|kitchen|lighting|doityourself|paint|bed|carpet|curtain|appliance|electronics|computer|mobile_phone|trade)$/ },
  { id: "hobby", label: "Outdoors & hobbies", re: /^(bicycle|outdoor|sports|fishing|ski|surf|golf|scuba_diving|model|pet|pet_grooming|hunting|camera|radiotechnics)$/ },
];
const TR_SPECIALTY = /^(books|bakery|deli|butcher|cheese|coffee|tea|gift|art|antiques|music|florist|chocolate|confectionery|wine|farm|greengrocer|outdoor|bicycle|toys|craft|second_hand|pastry|spices)$/;

const tr = {
  ready: false, map: null, roadLayer: null, nationLayer: null, nationLines: [], areas: [], loadingArea: null,
  city: null, usView: false, extraMetros: [], cityFactor: 0.5, minute: 17 * 60, day: "weekday", playTimer: 0,
  routeLayer: null, trip: null, storeLayer: null, shops: [], storesReq: 0, cat: "all",
};

// ---- Traffic model ----

const trCityFactor = metro => Math.min(0.95, Math.max(0.3, 0.35 + 0.17 * (Math.log10(Math.max(metro, 1e4)) - 5)));

function trProfileAt(minute, day = tr.day) {
  const p = TR_PROFILE[day];
  const h = Math.floor(minute / 60) % 24, f = (minute % 60) / 60;
  return p[h] + (p[(h + 1) % 24] - p[h]) * f;
}

const trLevel = c => TR_LEVELS.findIndex(l => c < l.max);
// How much longer driving takes at congestion `c` (0.4 → +18%, 1 → +60%).
const trSlowdown = c => 0.6 * Math.pow(Math.max(c, 0), 1.3);

function trKm(aLat, aLon, bLat, bLon) {
  const r = Math.PI / 180;
  const x = (bLon - aLon) * r * Math.cos((aLat + bLat) / 2 * r), y = (bLat - aLat) * r;
  return Math.hypot(x, y) * 6371;
}

// Every metro area the model knows: the quick picks, the longer list, and searched cities.
function trAllMetros() {
  return [
    ...TR_CITIES,
    ...TR_METROS.map(([name, state, lat, lon, metro]) => ({ name, state, lat, lon, metro })),
    ...tr.extraMetros,
  ];
}

// How busy roads get at a spot, from nearby metro areas: busiest downtown in a big city
// (base up to ~0.8), fading to quiet country highways (base 0.22) between cities.
function trInfluence(lat, lon) {
  let base = 0.22, near = 0;
  for (const m of trAllMetros()) {
    if (Math.abs(m.lat - lat) > 2.5 || Math.abs(m.lon - lon) > 3.5) continue;
    const d = trKm(lat, lon, m.lat, m.lon);
    const reach = 15 + 10 * (Math.log10(m.metro) - 5); // km
    base = Math.max(base, 0.22 + (trCityFactor(m.metro) - 0.22) * Math.exp(-d / reach));
    near = Math.max(near, Math.exp(-d / 10));
  }
  return { base, center: 1 + 0.35 * near };
}

// Congestion multiplier for one road piece.
function trRoadK(cls, lat, lon, seed) {
  const { base, center } = trInfluence(lat, lon);
  return TR_SENS[cls] * base * center * (0.8 + 0.4 * ((seed * 37) % 100) / 100);
}

function trTimeLabel(minute) {
  const h = Math.floor(minute / 60) % 24, m = minute % 60;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

// Current local time and weekday/weekend in a time zone.
function trLocalNow(tz) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour: "numeric", minute: "numeric", weekday: "short", hourCycle: "h23",
  }).formatToParts(new Date()).map(p => [p.type, p.value]));
  return { minute: Number(parts.hour) * 60 + Number(parts.minute), day: /Sat|Sun/.test(parts.weekday) ? "weekend" : "weekday" };
}

// ---- Data ----

async function trJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// From the local server (cached on disk); straight from Overpass if the server isn't running.
async function trOverpassData(kind, lat, lon) {
  if (location.protocol.startsWith("http") || TR_API) {
    try {
      const data = await trJson(`${TR_API}/api/${kind}?lat=${lat}&lon=${lon}`);
      return data[kind];
    } catch (err) {
      if (!/Failed to fetch|HTTP 404/.test(err.message)) throw err;
    }
  }
  const query = kind === "roads" ? trRoadsQuery(lat, lon) : trShopsQuery(lat, lon);
  const json = await trJson(TR_OVERPASS, { method: "POST", body: new URLSearchParams({ data: query }) });
  return kind === "roads" ? trCompactRoads(json) : trCompactShops(json);
}

function trStatus(text, busy = false) {
  const el = document.getElementById("tr-status");
  el.textContent = text;
  el.classList.toggle("busy", busy);
}

// ---- Map ----

function trLoadLeaflet() {
  return typeof wxmLoadLeaflet === "function" ? wxmLoadLeaflet() : Promise.reject(new Error("no Leaflet loader"));
}

async function trSetupMap() {
  await trLoadLeaflet();
  const esri = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/";
  tr.map = L.map("tr-map", { preferCanvas: true, minZoom: 4, maxZoom: 16, zoomControl: true });
  L.tileLayer(`${esri}World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`, {
    maxZoom: 16,
    attribution: "Tiles © Esri · Roads & stores © <a href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\" rel=\"noopener\">OpenStreetMap</a> contributors · Routes: <a href=\"https://project-osrm.org\" target=\"_blank\" rel=\"noopener\">OSRM</a>",
  }).addTo(tr.map);
  tr.map.createPane("labels").style.zIndex = 380;
  tr.map.getPane("labels").style.pointerEvents = "none";
  L.tileLayer(`${esri}World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}`, { maxZoom: 16, pane: "labels" }).addTo(tr.map);
  // Show the map credits under the map instead of in its corner (Leaflet keeps them up to date there).
  document.getElementById("tr-map-credits").appendChild(tr.map.attributionControl.getContainer());
  tr.map.createPane("route").style.zIndex = 450;
  tr.map.createPane("stores").style.zIndex = 620;
  tr.map.createPane("ends").style.zIndex = 640;

  tr.roadLayer = L.featureGroup();
  tr.roadLayer.on("click", e => trRoadPopup(e.layer, e.latlng));
  tr.nationLayer = L.layerGroup();
  tr.storeLayer = L.layerGroup().addTo(tr.map);
  tr.routeLayer = L.layerGroup().addTo(tr.map);
  tr.eatsLayer = L.layerGroup().addTo(tr.map);

  tr.map.on("moveend", trCheckArea);
  tr.map.on("zoomend viewreset", () => {
    // Zoomed out, store pins shrink to dots so they don't pile up.
    document.getElementById("tr-map").classList.toggle("tr-far", tr.map.getZoom() < 14);
    trShowLayers();
  });
}

const TR_DETAIL_ZOOM = 10; // from here in, every main road; farther out, highways only

function trShowLayers() {
  if (tr.map.getZoom() >= TR_DETAIL_ZOOM) {
    tr.map.removeLayer(tr.nationLayer);
    tr.roadLayer.addTo(tr.map);
  } else {
    tr.map.removeLayer(tr.roadLayer);
    tr.nationLayer.addTo(tr.map);
    trNationWeights();
  }
  trColorRoads();
}

// Highways across the whole country (loaded once).
async function trLoadNation() {
  try {
    const { roads } = await trJson("traffic-us-roads.json");
    const renderer = L.canvas({ padding: 0.2 });
    roads.sort((a, b) => b[0] - a[0]).forEach(([cls, name, pts, seed]) => {
      const latlngs = [];
      for (let i = 0; i < pts.length; i += 2) latlngs.push([pts[i], pts[i + 1]]);
      const mid = latlngs[latlngs.length >> 1];
      const line = L.polyline(latlngs, { renderer, weight: 2, opacity: 0.9, lineCap: "round", interactive: false });
      line.tr = { k: trRoadK(cls, mid[0], mid[1], seed), cls, name, level: -1 };
      tr.nationLines.push(line);
      tr.nationLayer.addLayer(line);
    });
    tr.nationWeight = null;
    trShowLayers();
  } catch {
    trStatus("Couldn't load the nationwide highways. Open the site from the local server (start.bat).");
  }
}

// Thinner lines when zoomed far out.
function trNationWeights() {
  const z = tr.map.getZoom();
  const set = z <= 5 ? [1.8, 1.3, 0.9, 0.7] : z <= 7 ? [2.6, 2, 1.3, 1] : [3.6, 2.8, 2, 1.5];
  if (tr.nationWeight === set[0]) return;
  tr.nationWeight = set[0];
  for (const line of tr.nationLines) line.setStyle({ weight: set[line.tr.cls] });
}

async function trLoadRoads(lat, lon) {
  if (tr.loadingArea) return;
  tr.loadingArea = { lat, lon };
  const started = Date.now();
  const tick = setInterval(() => {
    const s = Math.round((Date.now() - started) / 1000);
    if (s >= 4) trStatus(`Loading street-level roads for this area… ${s} s. The first visit to an area can take up to a minute; after that it's instant.`, true);
  }, 1000);
  trStatus("Loading street-level roads for this area…", true);
  try {
    const roads = await trOverpassData("roads", lat, lon);
    const renderer = L.canvas({ padding: 0.3 });
    const area = { lat, lon, group: L.layerGroup(), lines: [] };
    // Draw small roads first so freeways sit on top.
    roads.sort((a, b) => b[0] - a[0]).forEach(([cls, name, pts, seed]) => {
      const latlngs = [];
      for (let i = 0; i < pts.length; i += 2) latlngs.push([pts[i], pts[i + 1]]);
      const mid = latlngs[latlngs.length >> 1];
      const line = L.polyline(latlngs, { renderer, weight: TR_WEIGHT[cls], opacity: 0.92, lineCap: "round", interactive: true });
      line.tr = { k: trRoadK(cls, mid[0], mid[1], seed), cls, name, level: -1 };
      area.lines.push(line);
      area.group.addLayer(line);
    });
    tr.areas.push(area);
    tr.roadLayer.addLayer(area.group);
    // Keep the six most recent areas.
    while (tr.areas.length > 6) tr.roadLayer.removeLayer(tr.areas.shift().group);
    trColorRoads();
    trStatus("");
  } catch (err) {
    trStatus(`Couldn't load street-level roads (${err.message}). Highways still show when zoomed out; try again in a minute.`);
    tr.failedAt = { lat, lon, at: Date.now() };
  } finally {
    clearInterval(tick);
    tr.loadingArea = null;
    trCheckArea(); // the map may have moved on while loading
  }
}

function trColorRoads() {
  if (!tr.map) return;
  const p = trProfileAt(tr.minute);
  const lines = tr.map.getZoom() >= TR_DETAIL_ZOOM ? tr.areas.flatMap(a => a.lines) : tr.nationLines;
  for (const line of lines) {
    const level = trLevel(line.tr.k * p);
    if (level !== line.tr.level) {
      line.tr.level = level;
      line.setStyle({ color: TR_LEVELS[level].color });
    }
  }
}

function trRoadPopup(line, latlng) {
  const c = line.tr.k * trProfileAt(tr.minute);
  const lvl = TR_LEVELS[trLevel(c)];
  const slower = Math.round(trSlowdown(c) * 100);
  L.popup({ className: "tr-popup" }).setLatLng(latlng).setContent(`
    <strong>${escapeHtml(line.tr.name || ["Freeway", "Highway", "Main road", "Road"][line.tr.cls])}</strong>
    <span class="tr-pop-level" style="--c:${lvl.color}">${lvl.name}</span>
    <span>${slower < 3 ? "No delay expected" : `About ${slower}% slower than an empty road`} at ${trTimeLabel(tr.minute)} (${tr.day}).</span>`).openOn(tr.map);
}

// Zoomed in somewhere new in the US: load that area's roads by itself.
let trAreaTimer = 0;
function trCheckArea() {
  const note = document.getElementById("tr-reload");
  const c = tr.map.getCenter();
  const inUS = trInUS(c.lat, c.lng);
  note.hidden = inUS;
  clearTimeout(trAreaTimer);
  if (!inUS || tr.map.getZoom() < TR_DETAIL_ZOOM || tr.loadingArea) return;
  if (tr.areas.some(a => trKm(c.lat, c.lng, a.lat, a.lon) < 16)) return;
  if (tr.failedAt && Date.now() - tr.failedAt.at < 60_000 && trKm(c.lat, c.lng, tr.failedAt.lat, tr.failedAt.lon) < 16) return;
  trAreaTimer = setTimeout(() => trLoadRoads(c.lat, c.lng), 700);
}

// ---- Time of day ----

function trSetTime(minute, day = tr.day) {
  tr.minute = ((Math.round(minute / 15) * 15) % 1440 + 1440) % 1440;
  tr.day = day;
  document.getElementById("tr-hour").value = tr.minute / 15;
  document.getElementById("tr-clock").textContent = trTimeLabel(tr.minute);
  document.querySelectorAll("#tr-day button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.day === tr.day)));
  trColorRoads();
  trRenderChart();
  if (tr.trip) trRenderTrip();
}

function trRenderChart() {
  const cf = tr.cityFactor * 1.375; // freeway traffic, as in trip estimates
  const hour = Math.floor(tr.minute / 60);
  document.getElementById("tr-chart").innerHTML = TR_PROFILE[tr.day].map((p, h) => {
    const c = p * cf;
    return `<button type="button" class="tr-bar${h === hour ? " now" : ""}" data-h="${h}" style="--v:${Math.max(0.06, Math.min(1, c / 1.05)).toFixed(3)};--c:${TR_LEVELS[trLevel(c)].color}" aria-label="${trTimeLabel(h * 60)}: ${TR_LEVELS[trLevel(c)].name}"><span></span></button>`;
  }).join("") + `<div class="tr-chart-axis"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>12 AM</span></div>`;
  const peak = TR_PROFILE[tr.day].indexOf(Math.max(...TR_PROFILE[tr.day]));
  const name = tr.usView ? "Across the US" : tr.city ? tr.city.name : "This area";
  document.getElementById("tr-peak").textContent = tr.day === "weekday"
    ? `${name} on weekdays: busiest around ${trTimeLabel(peak * 60)}, with a morning rush around 7–8 AM.`
    : `${name} on weekends: busiest around ${trTimeLabel(peak * 60)}.`;
}

function trTogglePlay(force) {
  const btn = document.getElementById("tr-play");
  const play = force ?? !tr.playTimer;
  clearInterval(tr.playTimer);
  tr.playTimer = 0;
  if (play) tr.playTimer = setInterval(() => trSetTime(tr.minute + 15), 450);
  btn.textContent = play ? "❚❚" : "▶";
  btn.setAttribute("aria-label", play ? "Pause" : "Play the day");
}

// ---- Cities ----

function trRenderChips() {
  document.getElementById("tr-chips").innerHTML =
    `<button type="button" data-us aria-pressed="${tr.usView}">Whole US</button>` +
    TR_CITIES.map((c, i) =>
      `<button type="button" data-i="${i}" aria-pressed="${!tr.usView && !!tr.city && tr.city.name === c.name && tr.city.state === c.state}">${escapeHtml(c.name)}</button>`).join("");
}

function trSelectUS() {
  tr.usView = true;
  tr.city = null;
  tr.cityFactor = trCityFactor(2000000); // a typical large US metro, for the chart
  try { localStorage.setItem("tr-city", JSON.stringify({ us: true })); } catch {}
  document.getElementById("tr-city-name").textContent = "Whole country";
  trRenderChips();
  const now = trLocalNow(Intl.DateTimeFormat().resolvedOptions().timeZone);
  trSetTime(now.minute, now.day);
  tr.map.fitBounds([[24.5, -124.8], [49.4, -66.9]]);
  tr.storesReq++;
  tr.storeLayer.clearLayers();
  document.getElementById("tr-stores-where").textContent = "Pick a city or zoom in, then find stores at the map center.";
  document.getElementById("tr-stores-list").innerHTML = "";
  document.getElementById("tr-cats").innerHTML = "";
  trRenderEats();
}

async function trSelectCity(city) {
  tr.usView = false;
  tr.city = city;
  if (!trAllMetros().some(m => trKm(m.lat, m.lon, city.lat, city.lon) < 20)) tr.extraMetros.push(city);
  tr.cityFactor = trCityFactor(city.metro);
  try { localStorage.setItem("tr-city", JSON.stringify(city)); } catch {}
  document.getElementById("tr-city-name").textContent = `${city.name}${city.state ? ", " + city.state : ""}`;
  trRenderChips();
  const now = trLocalNow(city.tz);
  trSetTime(now.minute, now.day);
  tr.map.setView([city.lat, city.lon], 11);
  document.getElementById("tr-map").classList.toggle("tr-far", true);
  trLoadStores(city.lat, city.lon, `Near downtown ${city.name}`);
  trRenderEats();
}

// ---- Famous local restaurants (data in traffic-restaurants.js) ----

// The quick-pick city whose restaurants to show: the selected one, or the nearest within 80 km.
function trEatsCity() {
  if (!tr.city) return null;
  const near = TR_CITIES.map(c => ({ c, d: trKm(c.lat, c.lon, tr.city.lat, tr.city.lon) })).sort((a, b) => a.d - b.d)[0];
  return near && near.d < 80 && TR_RESTAURANTS[near.c.name]?.length ? near.c : null;
}

function trRenderEats() {
  const where = document.getElementById("tr-eats-where");
  const grid = document.getElementById("tr-eats-grid");
  tr.eatsLayer.clearLayers();
  const city = trEatsCity();
  if (!city) {
    where.textContent = tr.usView
      ? "Pick a city above to see its famous local restaurants."
      : "Famous restaurants are listed for the quick-pick cities above.";
    grid.innerHTML = "";
    return;
  }
  const list = TR_RESTAURANTS[city.name];
  where.textContent = `${list.length} well-known places in and around ${city.name}`;
  const yelp = r => `https://www.yelp.com/search?find_desc=${encodeURIComponent(r.name)}&find_loc=${encodeURIComponent(`${city.name}, ${city.state}`)}`;
  grid.innerHTML = list.map((r, i) => `
    <article class="tr-eat">
      <a class="tr-eat-photo" href="${escapeHtml(r.website)}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">
        <img src="${escapeHtml(r.photo)}" alt="" loading="lazy">
      </a>
      <a class="tr-eat-credit" href="${escapeHtml(r.photoPage)}" target="_blank" rel="noopener" title="Photo: ${escapeHtml(r.credit)}">Photo: ${escapeHtml(r.credit || "Wikimedia Commons")}</a>
      <div class="tr-eat-body">
        <h3>${escapeHtml(r.name)}</h3>
        ${r.about ? `<p class="tr-eat-about">${escapeHtml(r.about)}</p>` : ""}
        ${r.address ? `<p class="tr-eat-addr">${escapeHtml(r.address)}</p>` : ""}
        <div class="tr-eat-links">
          <a href="${escapeHtml(r.website)}" target="_blank" rel="noopener">Website</a>
          <a href="${yelp(r)}" target="_blank" rel="noopener">Photos &amp; reviews on Yelp</a>
          ${r.wiki ? `<a href="${escapeHtml(r.wiki)}" target="_blank" rel="noopener">Wikipedia</a>` : ""}
          <button type="button" class="tr-eat-map" data-eat="${i}">Show on map</button>
        </div>
      </div>
    </article>`).join("");
  list.forEach((r, i) => {
    const m = L.marker([r.lat, r.lon], {
      pane: "stores", title: r.name,
      icon: L.divIcon({ className: "tr-eat-pin-icon", html: `<span class="tr-eat-pin" aria-hidden="true">${TR_FORK}</span>`, iconSize: [26, 26], iconAnchor: [13, 13] }),
    }).bindPopup(`<strong>${escapeHtml(r.name)}</strong><span>${escapeHtml(r.about || "")}</span><a href="${escapeHtml(r.website)}" target="_blank" rel="noopener">Website</a>`, { className: "tr-popup" });
    m.eatIndex = i;
    tr.eatsLayer.addLayer(m);
  });
}

const TR_FORK = `<svg viewBox="0 0 16 16" width="13" height="13"><path fill="currentColor" d="M3 1h1v5h1V1h1v5h1V1h1v6a2 2 0 0 1-2 2v6H5V9a2 2 0 0 1-2-2zm8 0c1.7 0 3 1.8 3 4.5 0 1.9-.7 3-2 3.4V15h-2V1z"/></svg>`;

async function trSearchCity(q) {
  trStatus(`Looking up “${q}”…`, true);
  try {
    const data = await trJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&countryCode=US`);
    const hit = (data.results || []).find(r => r.country_code === "US");
    if (!hit) return trStatus(`No US city called “${q}”. Traffic is available for the United States only.`);
    trSelectCity({
      name: hit.name, state: trStateAbbr(hit.admin1), lat: hit.latitude, lon: hit.longitude,
      metro: Math.max(50000, (hit.population || 50000) * 2), tz: hit.timezone || "America/New_York",
    });
  } catch (err) {
    trStatus(`Couldn't search (${err.message}).`);
  }
}

const TR_STATES = { Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA", Colorado: "CO", Connecticut: "CT", Delaware: "DE", "District of Columbia": "DC", Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Puerto Rico": "PR", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY" };
const trStateAbbr = s => TR_STATES[s] || s || "";

// ---- Trip time ----

async function trGeocode(q) {
  const c = tr.city || (tr.map && { lat: tr.map.getCenter().lat, lon: tr.map.getCenter().lng });
  const bias = c ? `&lat=${c.lat.toFixed(3)}&lon=${c.lon.toFixed(3)}` : "";
  const data = await trJson(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=en${bias}`);
  const f = (data.features || []).find(f => f.properties.countrycode === "US");
  if (!f) return null;
  const p = f.properties;
  const [lon, lat] = f.geometry.coordinates;
  const street = [p.housenumber, p.street].filter(Boolean).join(" ");
  const label = [p.name && p.name !== street ? p.name : "", street, p.city || p.county, trStateAbbr(p.state)].filter(Boolean).join(", ");
  return { lat, lon, label: label || q };
}

async function trPlanTrip(e) {
  e.preventDefault();
  const out = document.getElementById("tr-trip-out");
  const fromQ = document.getElementById("tr-from").value.trim(), toQ = document.getElementById("tr-to").value.trim();
  if (!fromQ || !toQ) return;
  out.innerHTML = `<p class="tr-note busy">Finding the best route…</p>`;
  try {
    const [a, b] = await Promise.all([trGeocode(fromQ), trGeocode(toQ)]);
    if (!a || !b) {
      out.innerHTML = `<p class="tr-note">Couldn't find ${!a ? `“${escapeHtml(fromQ)}”` : `“${escapeHtml(toQ)}”`} in the US. Try adding the city, e.g. “Temple Square, Salt Lake City”.</p>`;
      return;
    }
    const data = await trJson(`https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=full&geometries=geojson`);
    const route = data.routes && data.routes[0];
    if (!route) throw new Error("no driving route between those places");
    const coords = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
    // How busy the trip's roads get: the average of its start, middle and end.
    const mid = coords[coords.length >> 1];
    const cf = [[a.lat, a.lon], mid, [b.lat, b.lon]].reduce((t, [la, lo]) => t + trInfluence(la, lo).base, 0) / 3;
    tr.trip = { a, b, coords, seconds: route.duration, meters: route.distance, cf };
    trDrawRoute();
    trRenderTrip();
    trLoadStores(b.lat, b.lon, `Near ${b.label.split(",")[0]}`);
  } catch (err) {
    out.innerHTML = `<p class="tr-note">Couldn't plan that trip (${escapeHtml(err.message)}).</p>`;
  }
}

// Trip minutes when leaving at `minute`. Long trips spend most of the drive outside the city rush.
function trTripMinutes(minute, day = tr.day) {
  const t = tr.trip;
  const share = Math.min(1, 50 / Math.max(1, t.meters / 1000));
  const c = trProfileAt(minute, day) * t.cf * 1.375;
  return t.seconds / 60 * (1 + trSlowdown(c) * share);
}

const trDuration = m => m < 60 ? `${Math.round(m)} min` : `${Math.floor(m / 60)} h ${Math.round(m % 60)} min`;

function trRenderTrip() {
  const t = tr.trip;
  const mins = trTripMinutes(tr.minute);
  const free = t.seconds / 60;
  const extra = Math.round(mins - free);
  const miles = t.meters / 1609.344;
  // Best and worst time to leave, 5 AM – 10 PM, every half hour.
  const options = [];
  for (let m = 5 * 60; m <= 22 * 60; m += 30) options.push({ m, v: trTripMinutes(m) });
  const best = options.reduce((x, y) => (y.v < x.v ? y : x));
  const worst = options.reduce((x, y) => (y.v > x.v ? y : x));
  const max = worst.v;
  const level = trLevel(trProfileAt(tr.minute) * t.cf * 1.375);
  document.getElementById("tr-trip-out").innerHTML = `
    <div class="tr-trip-result">
      <div class="tr-trip-time" style="--c:${TR_LEVELS[level].color}">
        <strong>${trDuration(mins)}</strong>
        <span>leaving at ${trTimeLabel(tr.minute)} on a ${tr.day}</span>
      </div>
      <p class="tr-trip-facts">${miles.toFixed(miles < 10 ? 1 : 0)} mi · ${trDuration(free)} with no traffic${extra >= 1 ? ` · <b>+${extra} min</b> for traffic` : ""}</p>
      <p class="tr-trip-route"><span class="tr-dot a">A</span>${escapeHtml(t.a.label)}<br><span class="tr-dot b">B</span>${escapeHtml(t.b.label)}</p>
      <div class="tr-leave" role="group" aria-label="Trip time by departure hour">
        ${options.filter(o => o.m % 60 === 0).map(o => `<button type="button" data-m="${o.m}" class="${Math.floor(o.m / 60) === Math.floor(tr.minute / 60) ? "now" : ""}" style="--v:${(o.v / max).toFixed(3)};--c:${TR_LEVELS[trLevel(trProfileAt(o.m) * t.cf * 1.375)].color}" title="Leave ${trTimeLabel(o.m)}: ${trDuration(o.v)}"><span></span><i>${(o.m / 60) % 12 || 12}${o.m < 720 ? "a" : "p"}</i></button>`).join("")}
      </div>
      <p class="tr-note">Best time to leave: <b>${trTimeLabel(best.m)}</b> (${trDuration(best.v)}). Worst: ${trTimeLabel(worst.m)} (${trDuration(worst.v)}). Tap a bar to try that time.</p>
    </div>`;
}

// The route as a peppermint stripe: a dark edge, white candy, red stripes rolling along.
function trDrawRoute() {
  const t = tr.trip;
  tr.routeLayer.clearLayers();
  const svg = L.svg({ pane: "route", padding: 0.5 });
  const opts = { renderer: svg, pane: "route", lineCap: "round", lineJoin: "round", interactive: false };
  L.polyline(t.coords, { ...opts, color: "#3a3c3f", weight: 13, opacity: 0.85 }).addTo(tr.routeLayer);
  L.polyline(t.coords, { ...opts, color: "#ffffff", weight: 9 }).addTo(tr.routeLayer);
  L.polyline(t.coords, { ...opts, color: "#d7262e", weight: 9, dashArray: "12 12", lineCap: "butt", className: "tr-pep" }).addTo(tr.routeLayer);
  L.polyline(t.coords, { ...opts, color: "#ffffff", weight: 2, opacity: 0.45, className: "tr-pep-shine" }).addTo(tr.routeLayer);
  const pin = (p, cls, text) => L.marker([p.lat, p.lon], {
    pane: "ends", icon: L.divIcon({ className: `tr-end ${cls}`, html: text, iconSize: [26, 26], iconAnchor: [13, 13] }),
    title: p.label,
  }).addTo(tr.routeLayer);
  pin(t.a, "a", "A");
  pin(t.b, "b", "B");
  tr.map.fitBounds(L.latLngBounds(t.coords), { padding: [30, 30] });
}

function trClearTrip() {
  tr.trip = null;
  tr.routeLayer.clearLayers();
  document.getElementById("tr-trip-out").innerHTML = "";
}

// ---- Local stores ----

const trHuman = s => (s || "store").replace(/_/g, " ").replace(/^./, c => c.toUpperCase());

function trStoreScore(s, lat, lon) {
  return (s.website ? 2 : 0) + (s.hours ? 2 : 0) + (s.phone ? 1 : 0) + (s.address ? 1 : 0) + (s.about ? 1 : 0)
    + s.extras.length * 0.5 + (TR_SPECIALTY.test(s.shop) ? 1.5 : 0) - trKm(lat, lon, s.lat, s.lon) * 1.2;
}

async function trLoadStores(lat, lon, where) {
  const req = ++tr.storesReq;
  document.getElementById("tr-stores-where").textContent = where;
  document.getElementById("tr-stores-list").innerHTML = `<li class="tr-note busy">Looking up local stores…</li>`;
  tr.storeLayer.clearLayers();
  try {
    const shops = await trOverpassData("shops", lat, lon);
    if (req !== tr.storesReq) return;
    shops.forEach(s => { s.score = trStoreScore(s, lat, lon); s.km = trKm(lat, lon, s.lat, s.lon); });
    tr.shops = shops.sort((x, y) => y.score - x.score);
    trRenderStores();
  } catch (err) {
    if (req === tr.storesReq) document.getElementById("tr-stores-list").innerHTML = `<li class="tr-note">Couldn't load stores (${escapeHtml(err.message)}).</li>`;
  }
}

function trRenderStores() {
  const cat = TR_STORE_CATS.find(c => c.id === tr.cat);
  document.getElementById("tr-cats").innerHTML = TR_STORE_CATS.map(c =>
    `<button type="button" data-cat="${c.id}" aria-pressed="${c.id === tr.cat}">${c.label}</button>`).join("");
  const list = tr.shops.filter(s => !cat.re || cat.re.test(s.shop)).slice(0, 12);
  tr.storeLayer.clearLayers();
  const ol = document.getElementById("tr-stores-list");
  if (!list.length) {
    ol.innerHTML = `<li class="tr-note">No local stores of this kind found nearby.</li>`;
    return;
  }
  ol.innerHTML = list.map((s, i) => `
    <li class="tr-store" data-id="${s.id}">
      <span class="tr-store-n">${i + 1}</span>
      <div>
        <button type="button" class="tr-store-name">${escapeHtml(s.name)}</button>
        <span class="tr-store-kind">${escapeHtml(trHuman(s.shop))} · ${(s.km / 1.609344).toFixed(1)} mi</span>
        ${s.address ? `<span class="tr-store-line">${escapeHtml(s.address)}</span>` : ""}
        ${s.hours ? `<span class="tr-store-line">Hours: ${escapeHtml(s.hours.length > 60 ? s.hours.slice(0, 57) + "…" : s.hours)}</span>` : ""}
        <span class="tr-store-links">${s.website ? `<a href="${escapeHtml(/^https?:/i.test(s.website) ? s.website : "https://" + s.website)}" target="_blank" rel="noopener">Website</a>` : ""}${s.phone ? `<a href="tel:${escapeHtml(s.phone.replace(/[^\d+]/g, ""))}">${escapeHtml(s.phone)}</a>` : ""}</span>
      </div>
    </li>`).join("");
  list.forEach((s, i) => {
    const m = L.marker([s.lat, s.lon], {
      pane: "stores", title: s.name,
      icon: L.divIcon({ className: "tr-pin-icon", html: `<span class="tr-pin">${i + 1}</span>`, iconSize: [22, 22], iconAnchor: [11, 11] }),
    }).bindPopup(`<strong>${escapeHtml(s.name)}</strong><span>${escapeHtml(trHuman(s.shop))}</span>${s.address ? `<span>${escapeHtml(s.address)}</span>` : ""}`, { className: "tr-popup" });
    m.storeId = s.id;
    tr.storeLayer.addLayer(m);
  });
}

// ---- Page ----

function trBuild() {
  document.getElementById("tr-hour").addEventListener("input", e => { trTogglePlay(false); trSetTime(Number(e.target.value) * 15); });
  document.getElementById("tr-play").addEventListener("click", () => trTogglePlay());
  document.getElementById("tr-now").addEventListener("click", () => {
    trTogglePlay(false);
    const now = trLocalNow(tr.city ? tr.city.tz : Intl.DateTimeFormat().resolvedOptions().timeZone);
    trSetTime(now.minute, now.day);
  });
  document.getElementById("tr-day").addEventListener("click", e => {
    const b = e.target.closest("[data-day]");
    if (b) trSetTime(tr.minute, b.dataset.day);
  });
  document.getElementById("tr-chart").addEventListener("click", e => {
    const b = e.target.closest("[data-h]");
    if (b) { trTogglePlay(false); trSetTime(Number(b.dataset.h) * 60); }
  });
  document.getElementById("tr-chips").addEventListener("click", e => {
    const b = e.target.closest("[data-i], [data-us]");
    if (!b) return;
    if (b.hasAttribute("data-us")) trSelectUS();
    else trSelectCity(TR_CITIES[Number(b.dataset.i)]);
  });
  document.getElementById("tr-city-form").addEventListener("submit", e => {
    e.preventDefault();
    const q = document.getElementById("tr-city-in").value.trim();
    if (q) trSearchCity(q);
  });
  document.getElementById("tr-trip-form").addEventListener("submit", trPlanTrip);
  document.getElementById("tr-swap").addEventListener("click", () => {
    const f = document.getElementById("tr-from"), t = document.getElementById("tr-to");
    [f.value, t.value] = [t.value, f.value];
  });
  document.getElementById("tr-clear").addEventListener("click", trClearTrip);
  document.getElementById("tr-trip-out").addEventListener("click", e => {
    const b = e.target.closest("[data-m]");
    if (b) { trTogglePlay(false); trSetTime(Number(b.dataset.m)); }
  });
  document.getElementById("tr-cats").addEventListener("click", e => {
    const b = e.target.closest("[data-cat]");
    if (b) { tr.cat = b.dataset.cat; trRenderStores(); }
  });
  document.getElementById("tr-stores-list").addEventListener("click", e => {
    const b = e.target.closest(".tr-store-name");
    if (!b) return;
    const id = b.closest("[data-id]").dataset.id;
    tr.storeLayer.eachLayer(m => {
      if (m.storeId === id) { tr.map.setView(m.getLatLng(), Math.max(tr.map.getZoom(), 15)); m.openPopup(); }
    });
    document.getElementById("tr-map").scrollIntoView({ behavior: "smooth", block: "center" });
  });
  document.getElementById("tr-eats-grid").addEventListener("click", e => {
    const b = e.target.closest("[data-eat]");
    if (!b) return;
    tr.eatsLayer.eachLayer(m => {
      if (m.eatIndex === Number(b.dataset.eat)) { tr.map.setView(m.getLatLng(), Math.max(tr.map.getZoom(), 15)); m.openPopup(); }
    });
    document.getElementById("tr-map").scrollIntoView({ behavior: "smooth", block: "center" });
  });
  document.getElementById("tr-stores-here").addEventListener("click", () => {
    const c = tr.map.getCenter();
    if (!trInUS(c.lat, c.lng)) return trStatus("Stores are available in the US only.");
    trLoadStores(c.lat, c.lng, "Near the center of the map");
  });
}

async function showTraffic() {
  document.title = "Traffic — All Points Towards Progress";
  if (tr.ready) {
    if (tr.map) setTimeout(() => tr.map.invalidateSize(), 0);
    return;
  }
  tr.ready = true;
  trBuild();
  trRenderChips();
  try {
    await trSetupMap();
  } catch {
    trStatus("Couldn't load the map. Check your internet connection and reload.");
    return;
  }
  trLoadNation();
  // First visit: the whole country. After that, whatever was picked last.
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem("tr-city")); } catch {}
  if (saved && !saved.us && saved.lat) trSelectCity(saved);
  else trSelectUS();
}

function stopTraffic() {
  if (tr.playTimer) trTogglePlay(false);
}
