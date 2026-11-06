// État de l'application : dossiers persistés dans le navigateur (localStorage), état d'affichage en mémoire.
// Aucune donnée n'est envoyée sur le réseau.
import { CHAMP, copie, lignes, nouveauDossier, planEditable, TYPES } from './modele.js';
import { enregistrer } from './journal.js';
import { aujourdHui } from './nombres.js';
import { dossierExemple, ID_POSTE_SCENARIO, INITIAL, VARIANTE } from './exemple.js';

export const CLE_STOCKAGE = 'avereo-uni-dossiers';
export const VERSION_DONNEES = 1;

function donneesInitiales(parametres = {}) {
  return { version: VERSION_DONNEES, dossiers: {}, ordre: [], prochainId: 1, parametres: { baseEquilibre: 'ht', ...parametres } };
}

function lireStockage(storage, parametresParDefaut) {
  if (!storage) return { donnees: null, erreur: null };
  let brut = null;
  try {
    brut = storage.getItem(CLE_STOCKAGE);
  } catch {
    return { donnees: null, erreur: 'Le navigateur refuse le stockage local : les dossiers ne seront pas conservés.' };
  }
  if (!brut) return { donnees: null, erreur: null };
  try {
    const d = JSON.parse(brut);
    if (!d || d.version !== VERSION_DONNEES || typeof d.dossiers !== 'object') throw new Error('format');
    d.parametres = { ...parametresParDefaut, ...d.parametres };
    return { donnees: d, erreur: null };
  } catch {
    try { storage.setItem(`${CLE_STOCKAGE}.illisible`, brut); } catch { /* sauvegarde de secours impossible */ }
    return { donnees: null, erreur: 'Les données enregistrées étaient illisibles : elles ont été mises de côté et l’outil repart d’un état vide.' };
  }
}

function cleChamp(champ, { planId, niveau, ligneId } = {}) {
  const c = CHAMP[champ];
  if (niveau && niveau !== 'dossier') return `${niveau}:${planId || ''}:${ligneId}:${champ}`;
  if (c && c.plan) return `plan:${planId}:${champ}`;
  return `dossier:${champ}`;
}

export function createStore({ storage = null, parametresParDefaut = {}, horloge = () => Date.now() } = {}) {
  const lu = lireStockage(storage, { baseEquilibre: 'ht', ...parametresParDefaut });
  let premierLancement = !lu.donnees && !lu.erreur;
  let state = {
    donnees: lu.donnees || donneesInitiales(parametresParDefaut),
    ui: {
      vue: 'liste', dossierId: null, onglet: 'administratif', planVue: 'devis', docActif: 'PF', planDoc: {}, filtreStatut: '',
      derniere: {}, modifies: {}, erreurStockage: lu.erreur, suggestionDepot: null, confirmation: null,
    },
  };
  const abonnes = new Set();

  function sauver() {
    if (!storage) return;
    try {
      storage.setItem(CLE_STOCKAGE, JSON.stringify(state.donnees));
      if (state.ui.erreurStockage && state.ui.erreurStockage.startsWith('Enregistrement impossible')) state = { ...state, ui: { ...state.ui, erreurStockage: null } };
    } catch {
      state = { ...state, ui: { ...state.ui, erreurStockage: 'Enregistrement impossible : l’espace de stockage du navigateur est plein ou bloqué. Les dernières modifications ne seront pas conservées.' } };
    }
  }

  function emettre() {
    abonnes.forEach((f) => f());
  }

  function setUi(patch) {
    state = { ...state, ui: { ...state.ui, ...patch } };
    emettre();
  }

  function majDonnees(fn) {
    const donnees = copie(state.donnees);
    const r = fn(donnees);
    state = { ...state, donnees };
    sauver();
    emettre();
    return r;
  }

  // Modifie un dossier et inscrit l'entrée de journal correspondante.
  function majDossier(id, fn, journaliser) {
    let entree = null;
    majDonnees((donnees) => {
      const d = donnees.dossiers[id];
      if (!d) return;
      const items = fn(d, donnees);
      if (journaliser && items && items.length) {
        const r = enregistrer(d.journal, items, journaliser.source, journaliser.titre, horloge());
        d.journal = r.journal;
        entree = r.entree;
      }
      d.modifie = new Date(horloge()).toISOString();
    });
    if (entree) {
      state = { ...state, ui: { ...state.ui, derniere: { ...state.ui.derniere, [id]: entree }, modifies: { ...state.ui.modifies, [id]: entree.items.map((i) => i.cle) } } };
      emettre();
    }
    return entree;
  }

  function nouvelId(donnees) {
    const id = `d${donnees.prochainId}`;
    donnees.prochainId += 1;
    return id;
  }

  const actions = {
    // Premier lancement : le dossier d'exemple est créé pour montrer la saisie unique.
    initialiser() {
      if (premierLancement) {
        premierLancement = false;
        actions.creerExemple({ ouvrir: false });
      }
    },
    creerDossier({ type = 'energie', nom = '' } = {}) {
      const id = majDonnees((donnees) => {
        const nid = nouvelId(donnees);
        donnees.dossiers[nid] = nouveauDossier({ id: nid, type, nom, maintenant: new Date(horloge()).toISOString() });
        donnees.ordre.unshift(nid);
        return nid;
      });
      actions.ouvrir(id);
      return id;
    },
    creerExemple({ ouvrir = true } = {}) {
      const id = majDonnees((donnees) => {
        const nid = nouvelId(donnees);
        donnees.dossiers[nid] = dossierExemple(nid, new Date(horloge()).toISOString());
        donnees.ordre.unshift(nid);
        return nid;
      });
      if (ouvrir) actions.ouvrir(id);
      return id;
    },
    ouvrir(id) {
      const d = state.donnees.dossiers[id];
      if (!d) return;
      setUi({ vue: 'dossier', dossierId: id, planVue: planEditable(d), suggestionDepot: null, confirmation: null });
    },
    afficher(vue) {
      setUi({ vue, confirmation: null });
    },
    supprimer(id) {
      majDonnees((donnees) => {
        delete donnees.dossiers[id];
        donnees.ordre = donnees.ordre.filter((x) => x !== id);
      });
      if (state.ui.dossierId === id) setUi({ vue: 'liste', dossierId: null });
      setUi({ confirmation: null });
    },
    changerType(id, type) {
      const avant = state.donnees.dossiers[id]?.type;
      if (!avant || avant === type) return;
      const lib = (t) => TYPES.find((x) => x.id === t)?.libelle || t;
      majDossier(id, (d) => {
        d.type = type;
        return [{ cle: 'dossier:type', champ: 'type_dossier', libelle: 'Type de dossier', de: lib(avant), vers: lib(type) }];
      }, { source: 'manuel', titre: 'Type de dossier modifié' });
    },
    // Saisie d'un champ. cible : { planId } pour un champ de plan, { niveau, planId, ligneId } pour une ligne.
    saisir(id, champ, val, cible = {}) {
      const c = CHAMP[champ];
      const d0 = state.donnees.dossiers[id];
      if (!c || !d0) return;
      const planId = cible.planId || 'devis';
      if ((c.plan || (cible.niveau && cible.niveau !== 'occupant')) && d0.fige && planId === 'devis') return; // plan Devis figé
      majDossier(id, (d) => {
        let porteur;
        let libelle = c.libelle;
        if (cible.niveau && cible.niveau !== 'dossier') {
          const ls = lignes(d, cible.niveau, planId);
          const i = ls.findIndex((l) => l.id === cible.ligneId);
          if (i < 0) return [];
          porteur = ls[i].valeurs;
          libelle = `${cible.niveau === 'poste' ? 'Poste' : cible.niveau === 'occupant' ? 'Occupant' : 'Dérogation'} ${i + 1} · ${c.libelle}`;
        } else if (c.plan) {
          porteur = d.plans[planId].valeurs;
        } else {
          porteur = d.valeurs;
        }
        const de = porteur[champ];
        if (JSON.stringify(de ?? '') === JSON.stringify(val ?? '')) return [];
        porteur[champ] = val;
        const suffixe = c.plan || cible.niveau === 'poste' || cible.niveau === 'derogation' ? ` (${planId === 'devis' ? 'Devis' : 'Factures'})` : '';
        return [{ cle: cleChamp(champ, { ...cible, planId }), champ, libelle: libelle + suffixe, de, vers: val, saisie: c.saisie }];
      }, { source: 'manuel' });
    },
    ajouterLigne(id, niveau, planId = 'devis') {
      const d0 = state.donnees.dossiers[id];
      if (!d0 || (niveau !== 'occupant' && d0.fige && planId === 'devis')) return null;
      let nouvelle = null;
      majDossier(id, (d) => {
        const ls = lignes(d, niveau, planId);
        nouvelle = { id: d.prochainId, valeurs: {} };
        d.prochainId += 1;
        ls.push(nouvelle);
        const nom = niveau === 'poste' ? 'Poste' : niveau === 'occupant' ? 'Occupant' : 'Dérogation';
        return [{ cle: `${niveau}_struct:${planId}`, champ: niveau === 'poste' ? 'poste_struct' : `${niveau}_struct`, libelle: `${nom} ${ls.length}`, de: '', vers: 'ajouté' }];
      }, { source: 'manuel', titre: niveau === 'poste' ? 'Poste de travaux ajouté' : 'Ligne ajoutée' });
      return nouvelle && nouvelle.id;
    },
    supprimerLigne(id, niveau, planId, ligneId) {
      const d0 = state.donnees.dossiers[id];
      if (!d0 || (niveau !== 'occupant' && d0.fige && planId === 'devis')) return;
      majDossier(id, (d) => {
        const ls = lignes(d, niveau, planId);
        const i = ls.findIndex((l) => l.id === ligneId);
        if (i < 0) return [];
        const [parti] = ls.splice(i, 1);
        const nom = niveau === 'poste' ? 'Poste' : niveau === 'occupant' ? 'Occupant' : 'Dérogation';
        const precision = parti.valeurs.pst_intitule ? ` (${parti.valeurs.pst_intitule})` : '';
        return [{ cle: `${niveau}_struct:${planId}`, champ: niveau === 'poste' ? 'poste_struct' : `${niveau}_struct`, libelle: `${nom} ${i + 1}${precision}`, de: 'présent', vers: 'supprimé' }];
      }, { source: 'manuel', titre: niveau === 'poste' ? 'Poste de travaux supprimé' : 'Ligne supprimée' });
    },
    // « Figer au dépôt » (E04, cadrage §3.2) : fige le plan Devis et crée le plan Factures par duplication.
    // Propose ensuite, sans l'imposer, de renseigner la date de dépôt et de passer le statut à « Déposer » (Q10).
    figerDevis(id) {
      const d0 = state.donnees.dossiers[id];
      if (!d0 || d0.fige) return;
      const date = aujourdHui(new Date(horloge()));
      majDossier(id, (d) => {
        d.fige = { date };
        d.plans.factures = copie(d.plans.devis);
        return [{ cle: 'dossier:fin_devis_fige', champ: 'plan_fige', libelle: 'Plan Devis', de: 'modifiable', vers: `figé le ${date.split('-').reverse().join('/')}` }];
      }, { source: 'action', titre: 'Plan Devis figé au dépôt ; plan Factures créé par duplication' });
      setUi({ planVue: 'factures', suggestionDepot: { dossierId: id, date }, confirmation: null });
    },
    appliquerSuggestionDepot(id, { date, statut }) {
      if (date) actions.saisir(id, 'dos_date_depot', date);
      if (statut) actions.saisir(id, 'dos_statut', 'Déposer');
      setUi({ suggestionDepot: null });
    },
    // Scénario de la maquette (T03 à T05), sur le plan éditable du dossier d'exemple.
    changementAvis(id) {
      const d0 = state.donnees.dossiers[id];
      if (!d0) return;
      const planId = planEditable(d0);
      const cible = d0.variante ? INITIAL : VARIANTE;
      majDossier(id, (d) => {
        const postes = d.plans[planId].postes;
        let p = postes.find((x) => x.id === ID_POSTE_SCENARIO);
        if (!p) {
          p = { id: ID_POSTE_SCENARIO, valeurs: {} };
          postes.splice(Math.min(1, postes.length), 0, p);
        }
        const rang = postes.indexOf(p) + 1;
        const items = [];
        for (const [champ, vers] of Object.entries(cible)) {
          if (p.valeurs[champ] !== vers) {
            items.push({ cle: cleChamp(champ, { niveau: 'poste', planId, ligneId: p.id }), champ, libelle: `Poste ${rang} · ${CHAMP[champ].libelle} (${planId === 'devis' ? 'Devis' : 'Factures'})`, de: p.valeurs[champ], vers, saisie: CHAMP[champ].saisie });
            p.valeurs[champ] = vers;
          }
        }
        d.variante = !d.variante;
        return items;
      }, { source: 'scenario', titre: d0.variante ? 'Retour au choix initial' : 'Changement d’avis du propriétaire' });
    },
    retablirExemple(id) {
      majDonnees((donnees) => {
        if (!donnees.dossiers[id]) return;
        donnees.dossiers[id] = dossierExemple(id, new Date(horloge()).toISOString());
      });
      setUi({ derniere: { ...state.ui.derniere, [id]: null }, modifies: { ...state.ui.modifies, [id]: [] }, planVue: 'devis', suggestionDepot: null });
    },
    setParametre(cle, val) {
      majDonnees((donnees) => { donnees.parametres[cle] = val; });
    },
    setOnglet(onglet) { setUi({ onglet }); },
    setPlanVue(planVue) { setUi({ planVue }); },
    setDoc(docActif) { setUi({ docActif }); },
    setPlanDoc(docId, planId) { setUi({ planDoc: { ...state.ui.planDoc, [docId]: planId } }); },
    setFiltreStatut(filtreStatut) { setUi({ filtreStatut }); },
    demanderConfirmation(confirmation) { setUi({ confirmation }); },
    fermerSuggestion() { setUi({ suggestionDepot: null }); },
    signalerErreur(message) { setUi({ erreurStockage: message }); },
  };

  return {
    getState: () => state,
    subscribe(f) { abonnes.add(f); return () => abonnes.delete(f); },
    actions,
  };
}
