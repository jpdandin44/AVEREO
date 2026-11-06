// Sauvegarde des dossiers dans un fichier JSON enregistré sur le poste, et import de ce fichier.
// L'import ajoute les dossiers sous de nouveaux identifiants : il ne remplace ni ne modifie ceux déjà présents.
// Les paramètres du fichier ne sont pas appliqués : ceux du navigateur restent en place.
import { TYPES } from './modele.js';
import { aujourdHui } from './nombres.js';

export const FORMAT_SAUVEGARDE = 'avereo-uni-sauvegarde';
export const VERSION_SAUVEGARDE = 1;

export function nomFichierSauvegarde(d = new Date()) {
  return `avereo-uni-sauvegarde-${aujourdHui(d)}.json`;
}

export function exporterDonnees(donnees, maintenant = new Date()) {
  return JSON.stringify({
    format: FORMAT_SAUVEGARDE,
    version: VERSION_SAUVEGARDE,
    application: 'AVEREO UNI',
    exporteLe: maintenant.toISOString(),
    dossiers: donnees.ordre.map((id) => donnees.dossiers[id]).filter(Boolean),
    parametres: donnees.parametres,
  }, null, 2);
}

const estObjet = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const TYPES_CONNUS = new Set(TYPES.map((t) => t.id));

function planValide(p) {
  return estObjet(p) && estObjet(p.valeurs) && Array.isArray(p.postes) && Array.isArray(p.derogations)
    && p.postes.every((l) => estObjet(l) && estObjet(l.valeurs));
}

function dossierValide(d) {
  return estObjet(d) && typeof d.id === 'string' && TYPES_CONNUS.has(d.type) && estObjet(d.valeurs)
    && Array.isArray(d.occupants) && Array.isArray(d.journal) && estObjet(d.plans)
    && planValide(d.plans.devis) && (d.plans.factures === null || d.plans.factures === undefined || planValide(d.plans.factures));
}

// Lit le texte d'un fichier de sauvegarde. Renvoie { dossiers } ou { erreur } avec un message pour l'utilisateur.
export function lireSauvegarde(texte) {
  let d;
  try {
    d = JSON.parse(texte);
  } catch {
    return { erreur: 'Le fichier n’est pas une sauvegarde lisible (JSON invalide).' };
  }
  if (!estObjet(d) || d.format !== FORMAT_SAUVEGARDE) return { erreur: 'Ce fichier n’est pas une sauvegarde d’AVEREO UNI.' };
  if (d.version !== VERSION_SAUVEGARDE) return { erreur: `Version de sauvegarde non prise en charge (${d.version}).` };
  if (!Array.isArray(d.dossiers)) return { erreur: 'La sauvegarde ne contient pas de liste de dossiers.' };
  const invalides = d.dossiers.filter((x) => !dossierValide(x)).length;
  if (invalides) return { erreur: `La sauvegarde contient ${invalides} dossier${invalides > 1 ? 's' : ''} illisible${invalides > 1 ? 's' : ''} : rien n’a été importé.` };
  return { dossiers: d.dossiers };
}

// Ajoute les dossiers lus aux données (modifiées sur place), sous de nouveaux identifiants, en tête de liste.
export function importerDossiers(donnees, dossiers) {
  const ids = [];
  for (const d of dossiers) {
    const id = `d${donnees.prochainId}`;
    donnees.prochainId += 1;
    const copie = JSON.parse(JSON.stringify(d));
    copie.id = id;
    copie.plans.factures = copie.plans.factures || null;
    donnees.dossiers[id] = copie;
    ids.push(id);
  }
  donnees.ordre = [...ids, ...donnees.ordre];
  return ids;
}
