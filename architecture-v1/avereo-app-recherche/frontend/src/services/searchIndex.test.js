import { describe, expect, it } from 'vitest';
import { DEMO_RESOURCES } from '../data/demo.js';
import { highlightSegments } from '../utils/text.js';
import { normalizeResource } from './resource.js';
import { buildIndex, search, sortResults } from './searchIndex.js';

const resources = DEMO_RESOURCES.map(normalizeResource);
const index = buildIndex(resources);
const ids = q => sortResults(search(index, resources, q), 'rel').map(x => x.resource.id);

describe('recherche', () => {
  it('ignore les accents', () => {
    expect(ids('emissivite')).toContain('DEMO-DOC-0233');
    expect(ids('Émissivité')).toContain('DEMO-DOC-0233');
  });
  it('trouve par préfixe', () => {
    expect(ids('condens')).toContain('DEMO-INS-0003');
  });
  it('fait passer le texte officiel devant pour une question réglementaire', () => {
    expect(ids('DPE réglementation')[0]).toBe('DEMO-REG-0002');
  });
  it('rend tout le corpus quand la recherche est vide', () => {
    expect(ids('')).toHaveLength(resources.length);
  });
  it('ne rend rien pour un terme absent', () => {
    expect(ids('radon')).toEqual([]);
  });
});

describe('surlignage', () => {
  it('surligne en conservant les accents du texte', () => {
    const segs = highlightSegments("L'émissivité élevée", ['emissivite']);
    expect(segs.filter(s => s.m).map(s => s.t)).toEqual(['émissivité']);
  });
  it('ne surligne pas au milieu d\'un mot', () => {
    expect(highlightSegments('superpont', ['pont']).some(s => s.m)).toBe(false);
  });
});
