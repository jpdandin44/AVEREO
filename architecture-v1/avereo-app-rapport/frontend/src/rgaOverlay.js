// EPSG:2154 (GRS80) -> WGS84 -> normalized Web Mercator, for display only.
const rad = Math.PI / 180, e = Math.sqrt(0.00669438002290);
const m = p => Math.cos(p) / Math.sqrt(1 - e * e * Math.sin(p) ** 2);
const t = p => Math.tan(Math.PI / 4 - p / 2) / ((1 - e * Math.sin(p)) / (1 + e * Math.sin(p))) ** (e / 2);
const n = Math.log(m(44 * rad) / m(49 * rad)) / Math.log(t(44 * rad) / t(49 * rad));
const c = 6378137 * m(44 * rad) / (n * t(44 * rad) ** n);
const ys = 6600000 + c * t(46.5 * rad) ** n;
export const RGA_COLORS = { 1: '#f3cf55', 2: '#ee8a22', 3: '#b3202a' };

export function fromLambert93(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const radius = Math.hypot(x - 700000, ys - y);
  const ratio = (radius / c) ** (1 / n);
  let phi = Math.PI / 2 - 2 * Math.atan(ratio);
  for (let i = 0; i < 8; i++) {
    phi = Math.PI / 2 - 2 * Math.atan(ratio * ((1 - e * Math.sin(phi)) / (1 + e * Math.sin(phi))) ** (e / 2));
  }
  return [3 + Math.atan2(x - 700000, ys - y) / n / rad, phi / rad];
}

export function mercatorPoint(lon, lat) {
  const sin = Math.sin(Math.max(-85.05112878, Math.min(85.05112878, lat)) * rad);
  return [(lon + 180) / 360, .5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)];
}
export function intersects(a, b) { return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1]; }

export function decodeRgaPolygons(polys, unit) {
  return polys.map(poly => {
    const bbox = [Infinity, Infinity, -Infinity, -Infinity];
    const rings = poly[2].map(encoded => {
      let x = 0, y = 0;
      const ring = new Float64Array(encoded.length);
      for (let j = 0; j < encoded.length; j += 2) {
        x += encoded[j]; y += encoded[j + 1];
        const p = mercatorPoint(...fromLambert93(x * unit, y * unit));
        ring[j] = p[0]; ring[j + 1] = p[1];
        bbox[0] = Math.min(bbox[0], p[0]); bbox[1] = Math.min(bbox[1], p[1]);
        bbox[2] = Math.max(bbox[2], p[0]); bbox[3] = Math.max(bbox[3], p[1]);
      }
      return ring;
    });
    return { level: poly[0], bbox, rings };
  });
}

const scripts = new Map(), geometry = new Map();
function loadScript(name) {
  const url = `/rga/data/${name}.js`;
  if (!scripts.has(url)) scripts.set(url, new Promise((resolve, reject) => {
    const script = document.createElement('script'); script.src = url; script.async = true;
    const timer = setTimeout(() => { script.remove(); reject(new Error('Données RGA indisponibles')); }, 15000);
    script.onload = () => { clearTimeout(timer); resolve(); };
    script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error('Données RGA indisponibles')); };
    document.head.appendChild(script);
  }).catch(error => { scripts.delete(url); throw error; }));
  return scripts.get(url);
}
async function dataFor(department, detailed) {
  const kind = detailed ? 'fine' : 'coarse', key = `${kind}-${department}`;
  if (!geometry.has(key)) geometry.set(key, (async () => {
    if (!window.RGA?.[kind]?.[department]) await loadScript(detailed ? `fine_${department}` : 'coarse');
    const raw = window.RGA?.[kind]?.[department];
    if (!raw) throw new Error('Contours RGA absents');
    return decodeRgaPolygons(raw, window.RGA.meta.unit);
  })().catch(error => { geometry.delete(key); throw error; }));
  return geometry.get(key);
}
let departmentBounds;
async function departmentsFor(bounds) {
  if (!window.RGA?.meta) await loadScript('meta');
  if (!departmentBounds) departmentBounds = Object.entries(window.RGA.meta.bbox).map(([code, box]) => {
    // Sample the perimeter: the projected edges are not straight in Web Mercator.
    const points = [];
    for (let i = 0; i <= 16; i++) {
      const x = box[0] + (box[2] - box[0]) * i / 16, y = box[1] + (box[3] - box[1]) * i / 16;
      for (const p of [[x, box[1]], [x, box[3]], [box[0], y], [box[2], y]]) points.push(mercatorPoint(...fromLambert93(...p)));
    }
    const pad = .0001; // Conservative envelope (~4 km), never a parcel boundary.
    return [code, [Math.min(...points.map(p => p[0])) - pad, Math.min(...points.map(p => p[1])) - pad,
      Math.max(...points.map(p => p[0])) + pad, Math.max(...points.map(p => p[1])) + pad]];
  });
  return departmentBounds.filter(([, box]) => intersects(box, bounds)).map(([code]) => code);
}

// A canvas tile layer shares Leaflet's projection, zoom and pan with the cadastre.
// It uses the supplied contours, independently of the live Géorisques API.
export function createRgaLayer(L, options = {}) {
  const Layer = L.GridLayer.extend({
    createTile(coords, done) {
      const tile = document.createElement('canvas'), size = this.getTileSize().x;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      tile.width = tile.height = size * dpr;
      const world = size * 2 ** coords.z, left = coords.x * size, top = coords.y * size;
      const bounds = [left / world, top / world, (left + size) / world, (top + size) / world];
      departmentsFor(bounds).then(async codes => {
        const ctx = tile.getContext('2d'); ctx.scale(dpr, dpr);
        const levels = this.options.levels || [1, 2, 3];
        for (const code of codes) {
          if (this.options.departments && !this.options.departments.includes(code)) continue;
          for (const polygon of await dataFor(code, coords.z >= 11)) {
            if (!levels.includes(polygon.level) || !intersects(polygon.bbox, bounds)) continue;
            ctx.beginPath();
            for (const ring of polygon.rings) {
              for (let i = 0; i < ring.length; i += 2) {
                const x = ring[i] * world - left, y = ring[i + 1] * world - top;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
              }
              ctx.closePath();
            }
            ctx.fillStyle = RGA_COLORS[polygon.level]; ctx.fill('evenodd');
          }
        }
        done(null, tile);
      }).catch(error => done(error, tile));
      return tile;
    },
  });
  return new Layer({ opacity: .4, pane: 'rgaPane', tileSize: 256, minZoom: 3, maxZoom: 20,
    keepBuffer: 1, noWrap: true, attribution: 'RGA : Géorisques / BRGM, carte AVEREO 2026', ...options });
}

export function createRgaPanes(map) {
  for (const [name, z] of [['rgaPane', 250], ['cadastrePane', 300]]) {
    const pane = map.getPane(name) || map.createPane(name);
    pane.style.zIndex = String(z); pane.style.pointerEvents = 'none';
  }
}
