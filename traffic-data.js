// Traffic tab data shared by the page (traffic.js) and the local server (server.js):
// city presets, the US check, and the OpenStreetMap (Overpass) queries for roads and stores.

// Quick picks. `metro` is the metro-area population, which sets how busy the roads get.
const TR_CITIES = [
  { name: "Salt Lake City", state: "UT", lat: 40.7608, lon: -111.8910, metro: 1260000, tz: "America/Denver" },
  { name: "New York", state: "NY", lat: 40.7128, lon: -74.0060, metro: 19500000, tz: "America/New_York" },
  { name: "Los Angeles", state: "CA", lat: 34.0522, lon: -118.2437, metro: 12800000, tz: "America/Los_Angeles" },
  { name: "Chicago", state: "IL", lat: 41.8781, lon: -87.6298, metro: 9300000, tz: "America/Chicago" },
  { name: "Houston", state: "TX", lat: 29.7604, lon: -95.3698, metro: 7500000, tz: "America/Chicago" },
  { name: "Dallas", state: "TX", lat: 32.7767, lon: -96.7970, metro: 8100000, tz: "America/Chicago" },
  { name: "Atlanta", state: "GA", lat: 33.7490, lon: -84.3880, metro: 6300000, tz: "America/New_York" },
  { name: "Washington", state: "DC", lat: 38.9072, lon: -77.0369, metro: 6300000, tz: "America/New_York" },
  { name: "Miami", state: "FL", lat: 25.7617, lon: -80.1918, metro: 6200000, tz: "America/New_York" },
  { name: "Phoenix", state: "AZ", lat: 33.4484, lon: -112.0740, metro: 5100000, tz: "America/Phoenix" },
  { name: "Boston", state: "MA", lat: 42.3601, lon: -71.0589, metro: 4900000, tz: "America/New_York" },
  { name: "San Francisco", state: "CA", lat: 37.7749, lon: -122.4194, metro: 4600000, tz: "America/Los_Angeles" },
  { name: "Seattle", state: "WA", lat: 47.6062, lon: -122.3321, metro: 4100000, tz: "America/Los_Angeles" },
  { name: "Denver", state: "CO", lat: 39.7392, lon: -104.9903, metro: 3000000, tz: "America/Denver" },
];

// More metro areas for the whole-US view: [name, state, lat, lon, metro population].
// Traffic builds up near each one and fades out between cities.
const TR_METROS = [
  ["Philadelphia", "PA", 39.9526, -75.1652, 6200000], ["Riverside", "CA", 33.9806, -117.3755, 4700000],
  ["Detroit", "MI", 42.3314, -83.0458, 4300000], ["Minneapolis", "MN", 44.9778, -93.2650, 3700000],
  ["Tampa", "FL", 27.9506, -82.4572, 3300000], ["San Diego", "CA", 32.7157, -117.1611, 3300000],
  ["Baltimore", "MD", 39.2904, -76.6122, 2800000], ["St. Louis", "MO", 38.6270, -90.1994, 2800000],
  ["Orlando", "FL", 28.5383, -81.3792, 2800000], ["Charlotte", "NC", 35.2271, -80.8431, 2800000],
  ["San Antonio", "TX", 29.4241, -98.4936, 2700000], ["Portland", "OR", 45.5152, -122.6784, 2500000],
  ["Austin", "TX", 30.2672, -97.7431, 2500000], ["Sacramento", "CA", 38.5816, -121.4944, 2400000],
  ["Pittsburgh", "PA", 40.4406, -79.9959, 2400000], ["Las Vegas", "NV", 36.1699, -115.1398, 2300000],
  ["Cincinnati", "OH", 39.1031, -84.5120, 2300000], ["Kansas City", "MO", 39.0997, -94.5786, 2200000],
  ["Columbus", "OH", 39.9612, -82.9988, 2200000], ["Cleveland", "OH", 41.4993, -81.6944, 2100000],
  ["Indianapolis", "IN", 39.7684, -86.1581, 2100000], ["Nashville", "TN", 36.1627, -86.7816, 2100000],
  ["San Jose", "CA", 37.3382, -121.8863, 2000000], ["Virginia Beach", "VA", 36.8529, -75.9780, 1800000],
  ["Jacksonville", "FL", 30.3322, -81.6557, 1700000], ["Providence", "RI", 41.8240, -71.4128, 1700000],
  ["Milwaukee", "WI", 43.0389, -87.9065, 1600000], ["Raleigh", "NC", 35.7796, -78.6382, 1500000],
  ["Oklahoma City", "OK", 35.4676, -97.5164, 1500000], ["Louisville", "KY", 38.2527, -85.7585, 1400000],
  ["Memphis", "TN", 35.1495, -90.0490, 1300000], ["Richmond", "VA", 37.5407, -77.4360, 1300000],
  ["Buffalo", "NY", 42.8864, -78.8784, 1200000], ["Hartford", "CT", 41.7658, -72.6734, 1200000],
  ["Birmingham", "AL", 33.5186, -86.8104, 1100000], ["Grand Rapids", "MI", 42.9634, -85.6681, 1100000],
  ["Rochester", "NY", 43.1566, -77.6088, 1060000], ["Tucson", "AZ", 32.2226, -110.9747, 1050000],
  ["New Orleans", "LA", 29.9511, -90.0715, 1000000], ["Honolulu", "HI", 21.3069, -157.8583, 1000000],
  ["Tulsa", "OK", 36.1540, -95.9928, 1000000], ["Fresno", "CA", 36.7378, -119.7871, 1000000],
  ["Omaha", "NE", 41.2565, -95.9345, 970000], ["Greenville", "SC", 34.8526, -82.3940, 950000],
  ["Albuquerque", "NM", 35.0844, -106.6504, 920000], ["Bakersfield", "CA", 35.3733, -119.0187, 900000],
  ["Knoxville", "TN", 35.9606, -83.9207, 900000], ["Albany", "NY", 42.6526, -73.7562, 900000],
  ["El Paso", "TX", 31.7619, -106.4850, 870000], ["Baton Rouge", "LA", 30.4515, -91.1871, 870000],
  ["Columbia", "SC", 34.0007, -81.0348, 850000], ["Charleston", "SC", 32.7765, -79.9311, 800000],
  ["Boise", "ID", 43.6150, -116.2023, 800000], ["Colorado Springs", "CO", 38.8339, -104.8214, 760000],
  ["Little Rock", "AR", 34.7465, -92.2896, 750000], ["Des Moines", "IA", 41.5868, -93.6250, 720000],
  ["Madison", "WI", 43.0731, -89.4012, 680000], ["Wichita", "KS", 37.6872, -97.3301, 650000],
  ["Jackson", "MS", 32.2988, -90.1848, 600000], ["Spokane", "WA", 47.6588, -117.4260, 600000],
  ["Portland", "ME", 43.6591, -70.2568, 550000], ["Reno", "NV", 39.5296, -119.8138, 500000],
  ["Anchorage", "AK", 61.2181, -149.9003, 400000], ["Sioux Falls", "SD", 43.5446, -96.7311, 300000],
  ["Fargo", "ND", 46.8772, -96.7898, 260000], ["Burlington", "VT", 44.4759, -73.2121, 230000],
  ["Billings", "MT", 45.7833, -108.5007, 190000], ["Cheyenne", "WY", 41.1400, -104.8202, 100000],
];

// Rough US outline as boxes: the lower 48, Alaska, Hawaii and Puerto Rico.
const TR_US_BOXES = [
  [24.4, 49.4, -125.0, -66.9],
  [51.0, 71.5, -180.0, -129.0],
  [18.8, 22.4, -160.5, -154.7],
  [17.8, 18.6, -67.4, -65.2],
];
function trInUS(lat, lon) {
  return TR_US_BOXES.some(([s, n, w, e]) => lat >= s && lat <= n && lon >= w && lon <= e);
}

const TR_ROAD_CLASSES = ["motorway", "trunk", "primary", "secondary"];
const TR_ROAD_HALF = 0.18; // degrees of latitude either side of the city center (~20 km)

function trRoadsQuery(lat, lon) {
  const dLon = TR_ROAD_HALF / Math.cos(lat * Math.PI / 180);
  const box = [lat - TR_ROAD_HALF, lon - dLon, lat + TR_ROAD_HALF, lon + dLon].map(v => v.toFixed(4)).join(",");
  return `[out:json][timeout:120][maxsize:200000000];way["highway"~"^(${TR_ROAD_CLASSES.join("|")})(_link)?$"](${box});out tags geom qt;`;
}

// Overpass answer → [[class index, name, [lat, lon, lat, lon, ...], seed], ...], with points
// closer than ~15 m to the previous one dropped to keep the download small. `seed` gives
// each road its own steady variation in the traffic estimate.
function trCompactRoads(json) {
  const out = [];
  for (const el of json.elements || []) {
    if (!el.geometry || el.geometry.length < 2) continue;
    const cls = TR_ROAD_CLASSES.indexOf(el.tags.highway.replace(/_link$/, ""));
    if (cls < 0) continue;
    const pts = [];
    let pLat = 1e9, pLon = 1e9;
    el.geometry.forEach((g, i) => {
      const last = i === el.geometry.length - 1;
      if (!last && Math.abs(g.lat - pLat) < 0.00014 && Math.abs(g.lon - pLon) < 0.00018) return;
      pts.push(+g.lat.toFixed(5), +g.lon.toFixed(5));
      pLat = g.lat; pLon = g.lon;
    });
    out.push([cls, el.tags.ref || el.tags.name || "", pts, el.id % 997]);
  }
  return out;
}

// Stores that aren't part of a chain (no brand tags) within `radius` meters.
const TR_SKIP_SHOPS = "vacant|car_repair|tyres|storage_rental|funeral_directors|money_lender|pawnbroker|payday_loan|lottery|e-cigarette|tobacco|cannabis|weapons|erotic|adult|gas|fuel";
function trShopsQuery(lat, lon, radius = 2000) {
  return `[out:json][timeout:60];nwr["shop"]["name"][!"brand"][!"brand:wikidata"]["shop"!~"^(${TR_SKIP_SHOPS})$"](around:${radius},${lat.toFixed(5)},${lon.toFixed(5)});out center tags 600;`;
}

function trCompactShops(json) {
  return (json.elements || []).map(el => {
    const t = el.tags || {};
    const lat = el.lat ?? el.center?.lat, lon = el.lon ?? el.center?.lon;
    if (lat == null) return null;
    const street = [t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" ");
    return {
      id: `${el.type[0]}${el.id}`, name: t.name, shop: t.shop, lat, lon,
      address: [street, t["addr:city"]].filter(Boolean).join(", "),
      website: t.website || t["contact:website"] || "",
      hours: t.opening_hours || "",
      phone: t.phone || t["contact:phone"] || "",
      about: t.description || "",
      extras: ["organic", "second_hand", "craft", "wheelchair"].filter(k => t[k] && t[k] !== "no"),
    };
  }).filter(Boolean);
}

if (typeof module !== "undefined") {
  module.exports = { TR_CITIES, TR_METROS, trInUS, trRoadsQuery, trCompactRoads, trShopsQuery, trCompactShops };
}
