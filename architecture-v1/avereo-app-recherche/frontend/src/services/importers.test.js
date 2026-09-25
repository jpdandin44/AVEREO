import { describe, expect, it } from 'vitest';
import { makeBackup, parseCollectorMarkdown, parseJson } from './importers.js';
import { normalizeResource } from './resource.js';

// Format de fiche leçon défini au § 29 de 03_Prompt_AVEREO_Collector_Optimise.md
const FICHE = `# Ponts thermiques de liaison

## Identification

Formation : Thermographie du bâtiment – Niveau 1
Module : M2 Physique des transferts
Leçon : L3 Ponts thermiques
Organisme : Organisme de formation
URL source : https://formation.exemple/thermo/m2/l3
Date de collecte : 12/09/2026

## Résumé

Les ponts thermiques de liaison apparaissent aux jonctions entre parois.

## Concepts clés

- pont thermique linéique
- coefficient psi
`;

describe('fiche Markdown Collector', () => {
  const r = parseCollectorMarkdown(FICHE, 'L3.md');
  it('lit l\'identification', () => {
    expect(r.title).toBe('Ponts thermiques de liaison');
    expect(r.src).toMatchObject({ formation: 'Thermographie du bâtiment – Niveau 1', module: 'M2 Physique des transferts', lesson: 'L3 Ponts thermiques', url: 'https://formation.exemple/thermo/m2/l3' });
    expect(r.date).toBe('2026-09-12');
  });
  it('prend le résumé comme extrait et les concepts comme mots-clés', () => {
    expect(r.text).toBe('Les ponts thermiques de liaison apparaissent aux jonctions entre parois.');
    expect(r.tags).toEqual(['pont thermique linéique', 'coefficient psi']);
  });
  it('classe par défaut en interne, droits inconnus', () => {
    expect(r.type).toBe('Fiche consolidée');
    expect(r.domain).toBe('Thermographie');
    expect(r.client).toBe('INTERNAL_ONLY');
    expect(r.rights).toBe('RIGHTS_UNKNOWN');
  });
});

describe('registre des sources', () => {
  it('applique les règles de Légifrance', () => {
    const r = normalizeResource({ title: 'Arrêté', src: { org: 'Légifrance' } });
    expect(r).toMatchObject({ origin: 'Institutionnel', authority: 'Officielle', rights: 'PUBLIC_DOMAIN' });
  });
  it('reconnaît « AQC (exemple fictif) » comme AQC', () => {
    expect(normalizeResource({ title: 'x', src: { org: 'AQC (exemple fictif)' } }).authority).toBe('Institutionnelle');
  });
});

describe('sauvegarde', () => {
  it('fait un aller-retour sans perte', () => {
    const resources = [parseCollectorMarkdown(FICHE, 'L3.md')];
    const back = parseJson(makeBackup({ resources, log: { zeroResults: [], notUseful: [], copies: {}, suggestions: [] } }));
    expect(back.resources[0]).toEqual(resources[0]);
  });
  it('refuse un JSON étranger', () => {
    expect(() => parseJson('{"foo":1}')).toThrow(/sauvegarde/);
  });
});
