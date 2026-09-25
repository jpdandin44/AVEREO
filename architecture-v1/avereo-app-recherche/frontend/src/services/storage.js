// Stockage local dans le navigateur (IndexedDB) : rien ne quitte le poste en V1.
import { get, set } from 'idb-keyval';

const KEY = 'avereo-recherche-state-v1';

export async function loadState() {
  try {
    return (await get(KEY)) || null;
  } catch (e) {
    console.warn('Lecture du stockage local impossible', e);
    return null;
  }
}

let timer = null;
export function saveState(state) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    set(KEY, state).catch(e => console.warn('Enregistrement local impossible', e));
  }, 300);
}
