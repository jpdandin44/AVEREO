export const CATEGORY_ICONS = ['folder', 'file', 'home', 'ruler', 'hammer', 'shield', 'key', 'leaf'];
export const DEFAULT_DOCUMENT_SETTINGS = {
  diagnostics: { icon: 'shield', color: '#31756A' },
  plans: { icon: 'ruler', color: '#3B6F9A' },
  urbanisme: { icon: 'home', color: '#8162A3' },
  travaux: { icon: 'hammer', color: '#A86A30' },
  juridique: { icon: 'key', color: '#965D77' },
  autres: { icon: 'folder', color: '#647780' },
};

export function documentSettings(value = {}) {
  value ||= {};
  return {
    revision: value.revision ?? 0,
    categories: Object.fromEntries(Object.entries(DEFAULT_DOCUMENT_SETTINGS).map(([key, defaults]) => [key, { ...defaults, ...value.categories?.[key] }])),
    order: value.order || {},
  };
}

export function validateDocumentSettings(value, documents) {
  if (!Number.isInteger(value?.revision) || value.revision < 0 || !value.categories || !value.order
    || Array.isArray(value.categories) || Array.isArray(value.order)
    || Object.keys(value).some(key => !['revision', 'categories', 'order'].includes(key))) throw new Error('Organisation des documents invalide.');
  for (const [category, appearance] of Object.entries(value.categories)) {
    if (!Object.hasOwn(DEFAULT_DOCUMENT_SETTINGS, category) || !appearance || Object.keys(appearance).some(key => !['icon', 'color'].includes(key))
      || !CATEGORY_ICONS.includes(appearance.icon) || !/^#[0-9a-f]{6}$/i.test(appearance.color)) throw new Error('Icône ou couleur de catégorie invalide.');
  }
  for (const [category, ids] of Object.entries(value.order)) {
    if (!Object.hasOwn(DEFAULT_DOCUMENT_SETTINGS, category) || !Array.isArray(ids) || ids.length > 10000 || new Set(ids).size !== ids.length
      || ids.some(id => !documents.some(doc => doc.id === id && doc.category === category))) throw new Error('Ordre des documents invalide pour ce bien.');
  }
  return documentSettings(value);
}

export function orderedDocuments(documents, settings, category) {
  const order = new Map((settings.order?.[category] || []).map((id, index) => [id, index]));
  return documents.filter(doc => doc.category === category).sort((a, b) =>
    (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity) || b.addedAt.localeCompare(a.addedAt) || a.id.localeCompare(b.id));
}

export function movedDocumentSettings(documents, settings, visible, id, direction) {
  const index = visible.findIndex(doc => doc.id === id), adjacent = visible[index + direction];
  if (index < 0 || !adjacent) return settings;
  const category = visible[index].category;
  const ids = orderedDocuments(documents, settings, category).map(doc => doc.id);
  const from = ids.indexOf(id), to = ids.indexOf(adjacent.id);
  [ids[from], ids[to]] = [ids[to], ids[from]];
  return { ...settings, order: { ...settings.order, [category]: ids } };
}
