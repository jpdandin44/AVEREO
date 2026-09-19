import { validLocation } from './locationMap.js';
import { emptyGeorisquesRiskSummary } from './georisquesRiskSummary.js';

// Moving the visit point never changes the written address or field notes.
export function moveVisitPoint(report, lon, lat, date) {
  if (!validLocation(lon, lat) || !date || !Number.isFinite(Date.parse(date))) return report;
  if (validLocation(report.cadastre?.lon, report.cadastre?.lat)
    && Number(report.cadastre.lon) === Number(lon) && Number(report.cadastre.lat) === Number(lat)) return report;
  return { ...report,
    cadastre: { section: '', numero: '', contenance: '', commune: '', nom_commune: '', lon: Number(lon), lat: Number(lat) },
    localisation: { ...report.localisation, confirmation: null, point_manuel: { lon: Number(lon), lat: Number(lat), date } },
    urbanisme: { ...report.urbanisme, zone: '', description: '', pdfUrl: '', context: null },
    risques: emptyGeorisquesRiskSummary(),
    terrain: { ...report.terrain, analysis: null },
  };
}
