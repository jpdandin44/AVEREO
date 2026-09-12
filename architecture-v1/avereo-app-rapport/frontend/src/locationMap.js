export function validLocation(lon, lat) {
  const numeric = (value) => (typeof value === 'number' || typeof value === 'string') && String(value).trim() !== '' && Number.isFinite(Number(value));
  return numeric(lon) && numeric(lat) && Math.abs(Number(lon)) <= 180 && Math.abs(Number(lat)) <= 90;
}

export function buildIgnMapUrl(lon, lat) {
  if (!validLocation(lon, lat)) return null;
  const url = new URL('https://cartes.gouv.fr/explorer-les-cartes/embed');
  url.searchParams.set('c', `${Number(lon)},${Number(lat)}`);
  url.searchParams.set('z', '18');
  url.searchParams.set('l', 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2$GEOPORTAIL:OGC:WMTS(1;1;0)');
  url.searchParams.set('p', `${Number(lon)},${Number(lat)}`);
  url.searchParams.set('permalink', 'yes');
  return url.toString();
}

export const emptyLocation = () => ({ adresse_trouvee: '', confirmation: null });

export function locationConfirmed(report) {
  const confirmation = report.localisation?.confirmation;
  return Boolean(confirmation?.date && validLocation(report.cadastre?.lon, report.cadastre?.lat)
    && confirmation.adresse === report.adresse_logement
    && Number(confirmation.lon) === Number(report.cadastre.lon)
    && Number(confirmation.lat) === Number(report.cadastre.lat));
}
