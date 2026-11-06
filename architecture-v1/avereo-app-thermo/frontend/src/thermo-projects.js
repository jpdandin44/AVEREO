import { get, update } from 'idb-keyval';

const KEY = 'avereo.thermo.projects.v1';
export function createThermoProjects(store = { get, update }, newId = () => crypto.randomUUID(), now = () => new Date().toISOString()) {
  function validate(value) {
    if (value === undefined) return [];
    if (!Array.isArray(value) || !value.every(item => item && typeof item.id === 'string' && item.id && typeof item.updatedAt === 'string' && item.data && typeof item.data === 'object')) {
      throw new Error('La liste des projets Thermo est illisible. Elle est conservée sans remplacement.');
    }
    return value;
  }
  return {
    async list() { return structuredClone(validate(await store.get(KEY))); },
    async save(data) {
      if (!data || typeof data !== 'object' || !data.categorie) throw new Error('Rapport Thermo absent.');
      const id = typeof data.avereoProjectId === 'string' && data.avereoProjectId ? data.avereoProjectId : newId();
      const snapshot = structuredClone({ ...data, avereoProjectId: id });
      await store.update(KEY, previous => {
        const projects = validate(previous);
        const item = { id, updatedAt: now(), data: snapshot };
        return projects.some(project => project.id === id) ? projects.map(project => project.id === id ? item : project) : [...projects, item];
      });
      return snapshot;
    },
  };
}
export const thermoProjects = createThermoProjects();
