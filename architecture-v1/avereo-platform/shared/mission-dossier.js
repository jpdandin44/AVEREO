const extraKeys = ['referenceLettre','offre','objet','perimetre','livrable','adresseClient','telephone','dateLettre'];
export function missionDetails(values, includeEmail = false) {
  const keys = includeEmail ? [...extraKeys,'email'] : extraKeys;
  return Object.fromEntries(keys.filter(key => values[key]).map(key => [key,values[key]]));
}

export function useMissionDossier(useEffect, context) {
  useEffect(() => {
    const provide = event => event.detail?.provide?.(context);
    document.addEventListener('avereo-mission-context',provide);
    return () => document.removeEventListener('avereo-mission-context',provide);
  }, [context]);
}

// Native report fields always win over optional mission information.
export function reportMissionDossier(report, update, emailInReport) {
  return {
    label: 'Dossier ouvert · '+(report.reference_dossier || report.titre || 'Rapport'),
    fields: {...report.missionBrief,client:report.proprietaire, adresseBien:report.adresse_logement,
      referenceDossier:report.reference_dossier,date:report.date_visite,
      email:emailInReport ? (report.email ?? report.missionBrief?.email) : (report.missionBrief?.email ?? report.email)},
    apply(values) {
      update(previous => ({...previous, proprietaire:values.client, adresse_logement:values.adresseBien,
        reference_dossier:values.referenceDossier, date_visite:values.date,
        ...(emailInReport || Object.hasOwn(previous,'email') ? {email:values.email} : {}),
        missionBrief:missionDetails(values,!emailInReport)}));
    },
  };
}

export function missionContactLines(brief) {
  if (!brief || typeof brief !== 'object') return [];
  return [['Adresse du client',brief.adresseClient],['Téléphone',brief.telephone],['E-mail',brief.email]]
    .filter(([,value])=>typeof value==='string' && value.trim());
}
