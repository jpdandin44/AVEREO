#!/usr/bin/env python3
"""
build_rga_map.py — prépare les données de la carte interactive RGA à partir du shapefile national
(Géorisques « Retrait-gonflement des argiles – carte d'exposition », AleaRG_*_Fxx_L93.shp).

Dépendance unique : numpy.  Usage :
    python3 build_rga_map.py <AleaRG_...Fxx_L93.shp> <departements.geojson> <dossier_sortie>

Sorties (dans <dossier_sortie>/data/) :
    meta.js        départements (nom, emprise), contours, statistiques de surface par niveau
    coarse.js      géométrie simplifiée (≈250 m) France entière, chargée au démarrage
    fine_XX.js     géométrie détaillée (≈20 m) d'un département, chargée à la demande au zoom
"""
import sys, os, json, struct, math, time, collections
import numpy as np

TOL_COARSE, TOL_FINE, UNIT = 250.0, 20.0, 10   # mètres ; UNIT = pas de la grille (m)

# ---------- lecture DBF / SHP ----------
def read_dbf(path):
    with open(path, 'rb') as f:
        h = f.read(32)
        n = struct.unpack('<I', h[4:8])[0]; hl = struct.unpack('<H', h[8:10])[0]; rl = struct.unpack('<H', h[10:12])[0]
        fields = []
        while True:
            d = f.read(32)
            if d[0] == 0x0D: break
            fields.append((d[:11].split(b'\0')[0].decode(), d[16]))
        f.seek(hl); raw = f.read(n * rl)
    arr = np.frombuffer(raw, dtype='u1').reshape(n, rl)
    out = {}; p = 1
    for nm, l in fields:
        col = np.ascontiguousarray(arr[:, p:p + l]); p += l
        out[nm.lower()] = np.char.strip(col.view(f'S{l}').ravel().astype(str))
    return out

def iter_polygons(shp, shx):
    buf = np.memmap(shp, dtype='u1', mode='r')
    idx = np.fromfile(shx, dtype='>i4', offset=100).reshape(-1, 2)
    for i, (off, ln) in enumerate(idx):
        o = int(off) * 2 + 8
        if struct.unpack('<i', bytes(buf[o:o + 4]))[0] == 0:
            yield i, []; continue
        npart, npts = struct.unpack('<ii', bytes(buf[o + 36:o + 44]))
        parts = np.frombuffer(bytes(buf[o + 44:o + 44 + 4 * npart]), dtype='<i4')
        pts = np.frombuffer(bytes(buf[o + 44 + 4 * npart:o + 44 + 4 * npart + 16 * npts]), dtype='<f8').reshape(npts, 2)
        b = list(parts) + [npts]
        yield i, [pts[b[k]:b[k + 1]] for k in range(npart)]

# ---------- simplification ----------
def simplify_open(p, tol):
    """p : (n,2) anneau ouvert. Retire itérativement les sommets à moins de `tol` de la corde voisine."""
    par = 0; still = 0
    while len(p) > 3 and still < 2:
        a = np.roll(p, 1, 0); c = np.roll(p, -1, 0)
        ac = c - a; L = np.hypot(ac[:, 0], ac[:, 1])
        cross = np.abs(ac[:, 0] * (p[:, 1] - a[:, 1]) - ac[:, 1] * (p[:, 0] - a[:, 0]))
        d = np.where(L > 0, cross / np.where(L > 0, L, 1), np.hypot(*(p - a).T))
        m = d < tol
        m &= (np.arange(len(p)) % 2) == par
        if len(p) - m.sum() < 3:
            m[:] = False
        if m.any():
            p = p[~m]; still = 0
        else:
            still += 1
        par ^= 1
    return p

def ring_to_units(r, tol):
    q = np.round(r[:-1] / UNIT).astype(np.int64)            # grille + retrait du point de fermeture
    keep = np.ones(len(q), bool); keep[1:] = np.any(q[1:] != q[:-1], axis=1)
    q = q[keep]
    if len(q) > 1 and np.all(q[0] == q[-1]): q = q[:-1]
    if len(q) < 3: return None
    q = simplify_open(q.astype(np.float64) * UNIT, tol)
    q = np.round(q / UNIT).astype(np.int64)
    if len(q) < 3: return None
    a = 0.5 * abs(np.sum(q[:, 0] * np.roll(q[:, 1], -1) - np.roll(q[:, 0], -1) * q[:, 1])) * UNIT * UNIT
    return q if a > UNIT * UNIT * 2 else None

def delta_flat(q):
    d = np.empty_like(q); d[0] = q[0]; d[1:] = q[1:] - q[:-1]
    return d.ravel().tolist()

# ---------- Lambert-93 (GRS80) ----------
def lambert93(lon, lat):
    a = 6378137.0; e = math.sqrt(0.00669438002290); l0 = math.radians(3.0); p0 = math.radians(46.5)
    p1, p2 = math.radians(44.0), math.radians(49.0)
    m = lambda p: math.cos(p) / math.sqrt(1 - e * e * math.sin(p) ** 2)
    t = lambda p: math.tan(math.pi / 4 - p / 2) / ((1 - e * math.sin(p)) / (1 + e * math.sin(p))) ** (e / 2)
    n = (math.log(m(p1)) - math.log(m(p2))) / (math.log(t(p1)) - math.log(t(p2)))
    F = m(p1) / (n * t(p1) ** n); r0 = a * F * t(p0) ** n
    lam = math.radians(lon); ph = math.radians(lat)
    r = a * F * t(ph) ** n; th = n * (lam - l0)
    return 700000 + r * math.sin(th), 6600000 + r0 - r * math.cos(th)

def main(shp, geojson, out):
    t0 = time.time()
    base = os.path.splitext(shp)[0]
    os.makedirs(os.path.join(out, 'data'), exist_ok=True)
    dbf = read_dbf(base + '.dbf')
    dep = dbf['insee_dep']; niv = np.array([int(float(x)) for x in dbf['niveau']]); surf = np.array([float(x) for x in dbf['surf_m2']])
    names = {}
    gj = json.load(open(geojson, encoding='utf-8'))
    outlines = {}
    for f in gj['features']:
        c = f['properties']['code']; names[c] = f['properties']['nom']
        g = f['geometry']; polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
        rings = []
        for poly in polys:
            for ring in poly[:1]:
                pr = np.array([lambert93(x, y) for x, y in ring])
                q = np.round(pr / UNIT).astype(np.int64)
                rings.append(delta_flat(q))
        outlines[c] = rings
    # codes SHP absents du GeoJSON (ex. 20 pour la Corse) : signalés
    unknown = sorted(set(dep) - set(names))
    if unknown: print('ATTENTION codes département inconnus du GeoJSON :', unknown)

    coarse = collections.defaultdict(list); fine = collections.defaultdict(list)
    bbox = {}
    nv_c = nv_f = 0
    for i, rings in iter_polygons(base + '.shp', base + '.shx'):
        d = dep[i]
        if not rings: continue
        rc = []; rf = []
        for r in rings:
            q = ring_to_units(r, TOL_COARSE)
            if q is not None: rc.append(q)
            q = ring_to_units(r, TOL_FINE)
            if q is not None: rf.append(q)
        if rc:
            coarse[d].append([int(niv[i]), int(round(surf[i])), [delta_flat(q) for q in rc]]); nv_c += sum(len(q) for q in rc)
            allp = np.vstack(rc) * UNIT
            b = bbox.setdefault(d, [1e18, 1e18, -1e18, -1e18])
            b[0] = min(b[0], allp[:, 0].min()); b[1] = min(b[1], allp[:, 1].min()); b[2] = max(b[2], allp[:, 0].max()); b[3] = max(b[3], allp[:, 1].max())
        if rf:
            fine[d].append([int(niv[i]), int(round(surf[i])), [delta_flat(q) for q in rf]]); nv_f += sum(len(q) for q in rf)
        if i % 20000 == 0: print(i, round(time.time() - t0), 's', flush=True)

    # statistiques exactes issues de la table attributaire (surf_m2)
    stats = {}
    for d in sorted(set(dep)):
        m = dep == d
        stats[d] = {str(n): [int((m & (niv == n)).sum()), round(float(surf[m & (niv == n)].sum()) / 1e6, 3)] for n in (1, 2, 3)}
    meta = {'unit': UNIT, 'names': names, 'stats': stats, 'bbox': {d: [round(v) for v in b] for d, b in bbox.items()},
            'outlines': outlines, 'source': os.path.basename(shp), 'n_polygons': int(len(dep))}
    dump = lambda o: json.dumps(o, separators=(',', ':'))
    open(os.path.join(out, 'data', 'meta.js'), 'w').write('window.RGA=window.RGA||{fine:{}};RGA.meta=' + dump(meta) + ';')
    open(os.path.join(out, 'data', 'coarse.js'), 'w').write('window.RGA=window.RGA||{fine:{}};RGA.coarse=' + dump(coarse) + ';')
    for d, v in fine.items():
        open(os.path.join(out, 'data', f'fine_{d}.js'), 'w').write(f'RGA.fine["{d}"]=' + dump(v) + ';')
    print('sommets coarse', nv_c, 'fine', nv_f, 'durée', round(time.time() - t0), 's')

if __name__ == '__main__':
    if len(sys.argv) != 4: sys.exit(__doc__)
    main(*sys.argv[1:])
