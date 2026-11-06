export function readMissions(storage = localStorage) {
  const raw = storage.getItem('avereo_missions');
  const missions = raw === null ? [] : JSON.parse(raw);
  if (!Array.isArray(missions) || !missions.every(item => item && typeof item.id === 'string')) {
    throw new Error('La liste des missions est illisible. Elle est conservée sans remplacement.');
  }
  return missions;
}

export function writeMissions(missions, storage = localStorage) {
  readMissions(storage); // Never replace an unreadable collection with an empty list.
  storage.setItem('avereo_missions', JSON.stringify(missions));
}
