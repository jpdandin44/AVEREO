const GEORISQUES_REPORT_ENDPOINT = 'https://www.georisques.gouv.fr/api/v1/rapport_pdf';

export function buildGeorisquesReportUrl(longitude, latitude) {
  if (longitude === '' || longitude === null || longitude === undefined) return null;
  if (latitude === '' || latitude === null || latitude === undefined) return null;

  const lon = Number(longitude);
  const lat = Number(latitude);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  if (lon < -180 || lon > 180 || lat < -90 || lat > 90) return null;

  const url = new URL(GEORISQUES_REPORT_ENDPOINT);
  url.searchParams.set('latlon', `${lon},${lat}`);
  return url.toString();
}
