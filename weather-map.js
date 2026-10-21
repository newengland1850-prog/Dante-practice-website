// Weather map with a 36-hour forecast slider (part of the Weather tab).
// Base map: Leaflet + CARTO tiles. Forecast: Open-Meteo, sampled on a grid around the city
// and drawn as smooth color layers (rain, temperature, clouds, wind).

const WXM_HOURS = 36;
const WXM_GRID = 16; // 16 × 16 forecast points across the area

const WXM_LAYERS = {
  rain: {
    label: "Rain",
    // mm per hour → color (like a radar map)
    stops: [[0, [0, 0, 0, 0]], [0.1, [120, 200, 255, 120]], [0.5, [60, 150, 255, 190]], [2, [40, 190, 110, 210]],
      [5, [245, 210, 0, 220]], [10, [255, 140, 0, 230]], [20, [225, 36, 43, 240]]],
    value: (d, i) => d.precipitation[i],
    legend: u => u === "F" ? ["0.01", "0.08", "0.2", "0.4", "0.8 in/h"] : ["0.1", "2", "5", "10", "20 mm/h"],
    show: (v, u) => u === "F" ? `${(v / 25.4).toFixed(2)} in/h` : `${v.toFixed(1)} mm/h`,
  },
  temp: {
    label: "Temperature",
    // °C → color
    stops: [[-25, [120, 60, 170, 200]], [-10, [60, 90, 220, 200]], [0, [70, 190, 230, 200]], [10, [80, 200, 120, 200]],
      [20, [245, 215, 60, 200]], [30, [250, 130, 40, 210]], [40, [210, 30, 40, 220]]],
    value: (d, i) => d.temperature_2m[i],
    legend: u => u === "F" ? ["-13°", "14°", "32°", "50°", "68°", "86°", "104°F"] : ["-25°", "-10°", "0°", "10°", "20°", "30°", "40°C"],
    show: (v, u) => u === "F" ? `${Math.round(v * 9 / 5 + 32)}°F` : `${Math.round(v)}°C`,
  },
  clouds: {
    label: "Clouds",
    stops: [[0, [255, 255, 255, 0]], [30, [235, 240, 245, 70]], [70, [225, 230, 236, 150]], [100, [210, 216, 224, 210]]],
    value: (d, i) => d.cloud_cover[i],
    legend: () => ["0%", "30%", "70%", "100%"],
    show: v => `${Math.round(v)}% cloud cover`,
  },
  wind: {
    label: "Wind",
    // km/h → color, plus arrows showing direction
    stops: [[0, [80, 160, 220, 0]], [10, [80, 160, 220, 90]], [25, [70, 200, 140, 160]], [45, [245, 210, 0, 190]],
      [70, [250, 130, 40, 210]], [100, [210, 30, 40, 230]]],
    value: (d, i) => d.wind_speed_10m[i],
    legend: u => u === "F" ? ["0", "6", "16", "28", "43", "62 mph"] : ["0", "10", "25", "45", "70", "100 km/h"],
    show: (v, u) => u === "F" ? `${Math.round(v / 1.609)} mph` : `${Math.round(v)} km/h`,
  },
};

const wxm = {
  map: null,
  overlay: null,
  marker: null,
  layer: "rain",
  hour: 0,
  grid: null, // { bounds, rows, cols, points: [hourly data per point], times }
  playing: 0,
  loadedFor: null,
  request: 0,
};

function wxmLoadLeaflet() {
  if (window.L) return Promise.resolve();
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
  document.head.appendChild(css);
  return wxLoadScript("https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js");
}

function wxmColor(stops, v) {
  if (v == null || Number.isNaN(v)) return [0, 0, 0, 0];
  if (v <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [v1, c1] = stops[i];
    if (v <= v1) {
      const [v0, c0] = stops[i - 1];
      const t = (v - v0) / (v1 - v0);
      return c0.map((x, k) => x + (c1[k] - x) * t);
    }
  }
  return stops[stops.length - 1][1];
}

// Smoothly blend the four nearest grid points.
function wxmSample(grid, layer, hour, fx, fy) {
  const { rows, cols, points } = grid;
  const x = Math.min(cols - 1.0001, Math.max(0, fx * (cols - 1)));
  const y = Math.min(rows - 1.0001, Math.max(0, fy * (rows - 1)));
  const c0 = Math.floor(x), r0 = Math.floor(y), tx = x - c0, ty = y - r0;
  const v = (r, c) => WXM_LAYERS[layer].value(points[r * cols + c], hour);
  const top = v(r0, c0) * (1 - tx) + v(r0, c0 + 1) * tx;
  const bottom = v(r0 + 1, c0) * (1 - tx) + v(r0 + 1, c0 + 1) * tx;
  return top * (1 - ty) + bottom * ty;
}

function wxmDraw() {
  const g = wxm.grid;
  if (!g) return;
  const W = 420, H = 420;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(W, H);
  const stops = WXM_LAYERS[wxm.layer].stops;
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      // Row 0 of the grid is the north edge.
      const [r, gg, b, a] = wxmColor(stops, wxmSample(g, wxm.layer, wxm.hour, px / (W - 1), py / (H - 1)));
      const o = (py * W + px) * 4;
      img.data[o] = r; img.data[o + 1] = gg; img.data[o + 2] = b; img.data[o + 3] = a;
    }
  }
  ctx.putImageData(img, 0, 0);
  // Soften the grid into smooth, radar-like shapes.
  const soft = document.createElement("canvas");
  soft.width = W;
  soft.height = H;
  const sctx = soft.getContext("2d");
  sctx.filter = "blur(9px)";
  sctx.drawImage(canvas, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(soft, 0, 0);

  if (wxm.layer === "wind") {
    // Arrows point the way the wind is blowing.
    ctx.strokeStyle = "rgba(255,255,255,.9)";
    ctx.fillStyle = "rgba(255,255,255,.9)";
    ctx.lineWidth = 1.6;
    for (let r = 0; r < g.rows; r += 2) {
      for (let c = 0; c < g.cols; c += 2) {
        const d = g.points[r * g.cols + c];
        const from = d.wind_direction_10m[wxm.hour];
        const speed = d.wind_speed_10m[wxm.hour];
        const len = 10 + Math.min(16, speed / 4);
        const cx = (c / (g.cols - 1)) * W, cy = (r / (g.rows - 1)) * H;
        const ang = ((from + 180) * Math.PI) / 180; // "from" north → blowing toward
        const dx = Math.sin(ang) * len, dy = -Math.cos(ang) * len;
        const tipX = cx + dx / 2, tipY = cy + dy / 2;
        ctx.beginPath();
        ctx.moveTo(cx - dx / 2, cy - dy / 2);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();
        // Arrowhead
        const ux = dx / len, uy = dy / len, head = 5;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - ux * head - uy * head * 0.6, tipY - uy * head + ux * head * 0.6);
        ctx.lineTo(tipX - ux * head + uy * head * 0.6, tipY - uy * head - ux * head * 0.6);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  const url = canvas.toDataURL();
  if (wxm.overlay) wxm.overlay.setUrl(url).setBounds(g.bounds);
  else wxm.overlay = L.imageOverlay(url, g.bounds, { opacity: 0.75, interactive: false }).addTo(wxm.map);
  wxmLabel();
}

function wxmLabel() {
  const g = wxm.grid;
  const label = document.getElementById("wx-map-label");
  if (!g) { label.textContent = ""; return; }
  const t = new Date(g.times[wxm.hour]);
  const when = t.toLocaleString(undefined, { weekday: "short", hour: "numeric" });
  label.textContent = wxm.hour === 0 ? `Now · ${when}` : `+${wxm.hour}h · ${when}`;
  document.getElementById("wx-map-hour").value = wxm.hour;
}

function wxmLegend() {
  const L_ = WXM_LAYERS[wxm.layer];
  const stops = L_.stops.filter(s => s[1][3] > 0 || s === L_.stops[0]);
  const css = stops.map(([, c], i) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(c[3], 40) / 255}) ${(i / (stops.length - 1)) * 100}%`).join(",");
  document.getElementById("wx-map-legend").innerHTML = `
    <div class="wx-legend-bar" style="background:linear-gradient(90deg,${css})"></div>
    <div class="wx-legend-labels">${L_.legend(wx.units).map(s => `<span>${s}</span>`).join("")}</div>`;
}

// Fetch the forecast grid covering the given bounds.
async function wxmLoadGrid(bounds) {
  const req = ++wxm.request;
  const status = document.getElementById("wx-map-status");
  status.textContent = "Loading forecast…";
  const n = bounds.getNorth(), s = bounds.getSouth(), w = bounds.getWest(), e = bounds.getEast();
  const lats = [], lons = [];
  for (let r = 0; r < WXM_GRID; r++) {
    for (let c = 0; c < WXM_GRID; c++) {
      lats.push((n - ((n - s) * r) / (WXM_GRID - 1)).toFixed(3));
      lons.push((w + ((e - w) * c) / (WXM_GRID - 1)).toFixed(3));
    }
  }
  try {
    const data = await wxFetch(WX_API, {
      latitude: lats.join(","),
      longitude: lons.join(","),
      hourly: "temperature_2m,precipitation,cloud_cover,wind_speed_10m,wind_direction_10m",
      forecast_hours: String(WXM_HOURS + 1),
      timezone: "auto",
      // Always metric for drawing; values are converted for display.
      temperature_unit: "celsius", wind_speed_unit: "kmh", precipitation_unit: "mm",
    });
    if (req !== wxm.request) return;
    const list = Array.isArray(data) ? data : [data];
    wxm.grid = {
      bounds: L.latLngBounds([s, w], [n, e]),
      rows: WXM_GRID,
      cols: WXM_GRID,
      points: list.map(d => d.hourly),
      times: list[0].hourly.time,
    };
    wxm.loadedFor = bounds;
    status.textContent = "";
    document.getElementById("wx-map-reload").hidden = true;
    wxmDraw();
  } catch (err) {
    if (req === wxm.request) status.textContent = `Couldn't load the map forecast: ${err.message}`;
  }
}

// The forecast covers a box around the city a bit larger than the view.
function wxmBoundsAround(lat, lon) {
  const latSpan = 3.2, lonSpan = 3.2 / Math.max(0.35, Math.cos((lat * Math.PI) / 180)) * 1.4;
  return L.latLngBounds([lat - latSpan, lon - lonSpan], [lat + latSpan, lon + lonSpan]);
}

async function wxmShowCity() {
  const city = wx.cities[wx.selected];
  if (!city || !wxm.map) return;
  const key = `${city.lat},${city.lon}`;
  if (wxm.cityKey === key) return;
  wxm.cityKey = key;
  wxm.map.setView([city.lat, city.lon], 7);
  if (wxm.marker) wxm.marker.setLatLng([city.lat, city.lon]).setTooltipContent(escapeHtml(city.name));
  else wxm.marker = L.circleMarker([city.lat, city.lon], { radius: 6, color: "#fff", weight: 2, fillColor: "#e0242b", fillOpacity: 1 })
    .bindTooltip(escapeHtml(city.name), { permanent: true, direction: "right", className: "wx-map-city" }).addTo(wxm.map);
  await wxmLoadGrid(wxmBoundsAround(city.lat, city.lon));
}

async function openWxMap() {
  const panel = document.getElementById("wx-map-panel");
  panel.hidden = false;
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
  try {
    await wxmLoadLeaflet();
  } catch {
    document.getElementById("wx-map-status").textContent = "The map couldn't load. Check your internet connection.";
    return;
  }
  if (!wxm.map) wxmInit();
  wxm.map.invalidateSize();
  wxmLegend();
  wxmShowCity();
}

function wxmInit() {
  wxm.map = L.map("wx-map", { zoomControl: true, worldCopyJump: true, minZoom: 3, maxZoom: 11 });
  // Esri's dark-gray base map (no key needed), with place names drawn above the weather.
  const esri = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/";
  L.tileLayer(`${esri}World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`, {
    maxZoom: 16,
    attribution: 'Map &copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, &copy; OpenStreetMap contributors · Forecast: <a href="https://open-meteo.com/">Open-Meteo</a>',
  }).addTo(wxm.map);
  wxm.map.createPane("labels");
  wxm.map.getPane("labels").style.zIndex = 450;
  wxm.map.getPane("labels").style.pointerEvents = "none";
  L.tileLayer(`${esri}World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`, { maxZoom: 16, pane: "labels" }).addTo(wxm.map);

  // Hover (or tap) to read the forecast value at that spot.
  const readout = document.getElementById("wx-map-readout");
  wxm.map.on("mousemove click", e => {
    const g = wxm.grid;
    if (!g || !g.bounds.contains(e.latlng)) { readout.textContent = ""; return; }
    const fx = (e.latlng.lng - g.bounds.getWest()) / (g.bounds.getEast() - g.bounds.getWest());
    const fy = (g.bounds.getNorth() - e.latlng.lat) / (g.bounds.getNorth() - g.bounds.getSouth());
    const v = wxmSample(g, wxm.layer, wxm.hour, fx, fy);
    readout.textContent = WXM_LAYERS[wxm.layer].show(v, wx.units);
  });
  wxm.map.on("mouseout", () => { readout.textContent = ""; });

  // Panned away from the forecast area: offer to load the new area.
  wxm.map.on("moveend", () => {
    const g = wxm.grid;
    if (!g) return;
    const view = wxm.map.getBounds();
    document.getElementById("wx-map-reload").hidden = g.bounds.contains(view.getCenter()) && g.bounds.intersects(view) && wxm.map.getZoom() >= 6;
  });
}

function wxmSetHour(h) {
  wxm.hour = Math.max(0, Math.min(WXM_HOURS, h));
  wxmDraw();
}

function wxmTogglePlay() {
  const btn = document.getElementById("wx-map-play");
  if (wxm.playing) {
    clearInterval(wxm.playing);
    wxm.playing = 0;
    btn.textContent = "▶ Play";
    return;
  }
  btn.textContent = "❚❚ Pause";
  wxm.playing = setInterval(() => wxmSetHour(wxm.hour >= WXM_HOURS ? 0 : wxm.hour + 1), 600);
}

function wxmBindEvents() {
  document.getElementById("wx-map-btn").addEventListener("click", () => {
    const panel = document.getElementById("wx-map-panel");
    if (panel.hidden) openWxMap();
    else panel.hidden = true;
  });
  document.getElementById("wx-map-close").addEventListener("click", () => {
    document.getElementById("wx-map-panel").hidden = true;
    if (wxm.playing) wxmTogglePlay();
  });
  document.getElementById("wx-map-layers").addEventListener("click", e => {
    const btn = e.target.closest("[data-layer]");
    if (!btn) return;
    wxm.layer = btn.dataset.layer;
    document.querySelectorAll("#wx-map-layers [data-layer]").forEach(b => b.setAttribute("aria-pressed", b === btn));
    wxmLegend();
    wxmDraw();
  });
  document.getElementById("wx-map-hour").addEventListener("input", e => wxmSetHour(Number(e.target.value)));
  document.getElementById("wx-map-play").addEventListener("click", wxmTogglePlay);
  document.getElementById("wx-map-reload").addEventListener("click", () => {
    const b = wxm.map.getBounds().pad(0.15);
    wxmLoadGrid(b);
  });
}

// Called by weather.js when the selected city or units change.
function wxmCityChanged() {
  if (wxm.map && !document.getElementById("wx-map-panel").hidden) wxmShowCity();
}
function wxmUnitsChanged() {
  if (wxm.map) wxmLegend();
}
