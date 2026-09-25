import { describe, expect, it } from 'vitest';
import { clientExport, citeShort, exportBasket, referenceOnlyItems } from './citations.js';
import { normalizeResource } from './resource.js';

const approved = normalizeResource({
  id: 'AV-1', type: 'Production AVEREO', title: 'Fiche méthode', text: 'Vérifier la météo des 24 dernières heures.',
  src: { org: 'AVEREO', loc: 'v1.2' }, date: '2026-09-22', client: 'APPROVED_FOR_CLIENT_USE', origin: 'AVEREO', authority: 'Interne',
});
const internal = normalizeResource({
  id: 'AQC-1', type: 'PDF', title: 'Fiche pathologie', text: 'Extrait protégé à ne pas reproduire.',
  src: { org: 'AQC (exemple fictif)', url: 'https://aqc.exemple/f.pdf', loc: 'p. 2' }, date: '2026-09-23', client: 'INTERNAL_ONLY',
});

describe('styles client', () => {
  for (const style of ['simple', 'classe', 'pedagogique']) {
    it(`${style} : reprend l'extrait validé et jamais l'extrait non validé`, () => {
      const out = clientExport([approved, internal], style);
      expect(out).toContain('Vérifier la météo des 24 dernières heures');
      expect(out).not.toContain('Extrait protégé');
      expect(out).toContain('À reformuler avec vos mots');
      // la référence du contenu non validé est toujours citée
      expect(out).toContain('https://aqc.exemple/f.pdf');
    });
  }

  it('classe : numérote les notes', () => {
    const out = clientExport([approved, internal], 'classe');
    expect(out).toContain('Notes et références');
    expect(out).toContain('¹ Fiche méthode');
    expect(out).toContain('² Fiche pathologie');
  });

  it('simple : retire la mention « exemple » dans le corps mais la garde en référence', () => {
    const out = clientExport([internal], 'simple');
    expect(out).toContain('(AQC).');
    expect(out).toContain('- Fiche pathologie, AQC (exemple fictif)');
  });

  it('pédagogique : explique la source', () => {
    expect(clientExport([internal], 'pedagogique')).toContain("D'où vient cette information ?");
  });

  it('signale les éléments exportés en référence seule', () => {
    expect(referenceOnlyItems([approved, internal], 'client-simple').map(r => r.id)).toEqual(['AQC-1']);
    expect(referenceOnlyItems([approved, internal], 'short')).toEqual([]);
  });
});

describe('formats internes', () => {
  it('référence courte avec date française', () => {
    expect(citeShort(internal)).toBe('Fiche pathologie, p. 2. AQC (exemple fictif). Consulté le 23/09/2026. https://aqc.exemple/f.pdf');
  });
  it('les formats internes peuvent citer un extrait non validé', () => {
    expect(exportBasket([internal], 'md')).toContain('> Extrait protégé');
  });
});
