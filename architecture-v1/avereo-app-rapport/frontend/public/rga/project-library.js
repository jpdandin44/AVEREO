export const RGA_PROJECTS_KEY = 'avereo.rga.projects.v1';

export function createRgaProjects(storage, newId = () => crypto.randomUUID(), now = () => new Date().toISOString()) {
  const validPoint = point => point && Number.isFinite(point.lon) && Math.abs(point.lon) <= 180
    && Number.isFinite(point.lat) && Math.abs(point.lat) <= 90 && typeof point.label === 'string';
  function list() {
    const raw = storage.getItem(RGA_PROJECTS_KEY);
    const items = raw === null ? [] : JSON.parse(raw);
    if (!Array.isArray(items) || !items.every(item => item && typeof item.id === 'string'
      && typeof item.name === 'string' && validPoint(item.point))) {
      throw new Error('La liste RGA est illisible. Elle est conservée sans remplacement.');
    }
    return items;
  }
  return {
    list,
    save(point, name) {
      if (!validPoint(point) || !name?.trim()) throw new Error('Choisissez un point et un nom pour ce projet.');
      const items = list();
      if (items.length >= 1000) throw new Error('La liste contient déjà 1 000 projets.');
      const item = { id: newId(), name: name.trim().slice(0, 150), point: { lon: point.lon, lat: point.lat, label: point.label.slice(0, 500) }, updatedAt: now() };
      storage.setItem(RGA_PROJECTS_KEY, JSON.stringify([...items, item]));
      return item;
    },
  };
}
