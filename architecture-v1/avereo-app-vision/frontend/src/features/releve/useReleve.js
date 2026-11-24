// État du relevé en cours : bâtiment, historique annuler/rétablir, sélection, aperçu pendant un glissement.
// Le plan, la saisie et le panneau de métrés lisent et écrivent le même modèle (R27 : tout se met à jour en direct).
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import {
  annuler,
  creerHistorique,
  peutAnnuler,
  peutRetablir,
  retablir,
  valider,
} from "../../domain/historique.js";
import {
  ajouterNiveau,
  ajouterPiece,
  creerBatiment,
  creerNiveau,
  creerPiece,
  creerPieceRectangulaire,
  remplacerNiveau,
  remplacerPiece,
  supprimerPiece,
  translaterPiece,
} from "../../domain/modele.js";
import { calculerMetres, calculerMetresNiveau } from "../../domain/metres.js";
import { ID_NIVEAU } from "../../sync/moteur.js";

const ECART_ENTRE_PIECES_MM = 1500;

function etatInitial() {
  const niveau = creerNiveau({ id: "niveau-1", nom: "Rez-de-chaussée" });
  return {
    historique: creerHistorique(creerBatiment({ id: "batiment-1", nom: "Logement", niveaux: [niveau] })),
    apercu: null, // pièce en cours de glissement (non enregistrée dans l'historique)
    niveauId: niveau.id,
    pieceId: null,
    numeroPiece: 1,
    charge: false, // le relevé enregistré sur l'appareil a-t-il été lu ?
  };
}

/** Un relevé a toujours au moins un niveau (celui par défaut, de même identifiant sur tous les appareils). */
function securiser(batiment) {
  return batiment.niveaux.length > 0 ? batiment : { ...batiment, niveaux: [creerNiveau({ id: ID_NIVEAU, nom: "Rez-de-chaussée" })] };
}

function niveauCourant(batiment, niveauId) {
  return batiment.niveaux.find((n) => n.id === niveauId) ?? batiment.niveaux[0];
}

function reducteur(etat, action) {
  const batiment = etat.historique.present;
  switch (action.type) {
    case "charger":
    case "importer": {
      // Relevé lu sur l'appareil, ou reçu d'un autre appareil : il remplace l'état affiché (l'historique repart de là).
      const nouveau = action.batiment;
      const niveau = nouveau.niveaux.find((n) => n.id === etat.niveauId) ?? nouveau.niveaux[0];
      const piece = niveau.pieces.find((p) => p.id === etat.pieceId) ?? null;
      const total = nouveau.niveaux.reduce((somme, n) => somme + n.pieces.length, 0);
      return { ...etat, historique: creerHistorique(nouveau), apercu: null, niveauId: niveau.id, pieceId: piece?.id ?? null, numeroPiece: Math.max(etat.numeroPiece, total + 1), charge: true };
    }
    case "valider-batiment":
      return { ...etat, historique: valider(etat.historique, action.batiment), apercu: null };
    case "apercu":
      return { ...etat, apercu: action.piece };
    case "abandonner-apercu":
      return { ...etat, apercu: null };
    case "annuler":
      return { ...etat, historique: annuler(etat.historique), apercu: null };
    case "retablir":
      return { ...etat, historique: retablir(etat.historique), apercu: null };
    case "choisir-piece":
      return { ...etat, pieceId: action.pieceId, apercu: null };
    case "choisir-niveau": {
      const niveau = niveauCourant(batiment, action.niveauId);
      return { ...etat, niveauId: niveau.id, pieceId: niveau.pieces[0]?.id ?? null, apercu: null };
    }
    case "piece-creee":
      return {
        ...etat,
        historique: valider(etat.historique, action.batiment),
        pieceId: action.pieceId,
        numeroPiece: etat.numeroPiece + 1,
        apercu: null,
      };
    case "niveau-cree":
      return {
        ...etat,
        historique: valider(etat.historique, action.batiment),
        niveauId: action.niveauId,
        pieceId: null,
        apercu: null,
      };
    default:
      return etat;
  }
}

/** Place la nouvelle pièce à droite des pièces existantes du niveau, pour qu'elles ne se superposent pas. */
function placerSansChevauchement(niveau, piece) {
  const xMax = niveau.pieces.flatMap((p) => p.sommets.map((s) => s.x));
  if (xMax.length === 0) return piece;
  const xMin = Math.min(...piece.sommets.map((s) => s.x));
  const dx = Math.max(...xMax) + ECART_ENTRE_PIECES_MM - xMin;
  return translaterPiece(piece, dx, 0);
}

/**
 * @param {string} projetId
 * @param {ReturnType<import("../../sync/moteur.js").creerMoteur>} moteur
 */
export function useReleve(projetId, moteur) {
  const [etat, envoyer] = useReducer(reducteur, undefined, etatInitial);
  const batiment = etat.historique.present;
  const persiste = useRef(null); // état de référence du dernier enregistrement (null : rien d'enregistré pour ce projet)
  const affiche = useRef(null); // dernier état déjà traité par l'enregistrement automatique

  // Lecture du relevé enregistré sur l'appareil (et première réception si l'appareil n'a rien).
  useEffect(() => {
    let annule = false;
    moteur.ouvrirProjet(projetId).then(({ batiment: lu, persistant }) => {
      if (annule) return;
      const sur = securiser(lu);
      persiste.current = persistant ? sur : null;
      affiche.current = sur;
      envoyer({ type: "charger", batiment: sur });
    });
    return () => {
      annule = true;
    };
  }, [moteur, projetId]);

  // Enregistrement automatique (R03) : chaque état validé est écrit sur l'appareil immédiatement, sans bouton.
  useEffect(() => {
    if (!etat.charge || batiment === affiche.current) return;
    const avant = persiste.current;
    persiste.current = batiment;
    affiche.current = batiment;
    moteur.enregistrer(projetId, avant, batiment);
  }, [batiment, etat.charge, moteur, projetId]);

  // Relevé modifié sur un autre appareil (R05) : on relit l'état local, qui contient aussi nos modifications en attente.
  useEffect(
    () =>
      moteur.abonner((evenement) => {
        if (evenement.type !== "projet" || evenement.projetId !== projetId) return;
        const importer = async (essai) => {
          const avantLecture = affiche.current;
          const { batiment: lu, persistant } = await moteur.lireBatiment(projetId);
          if (affiche.current !== avantLecture) {
            // L'utilisateur a modifié le relevé pendant la lecture : on relit, pour ne jamais écraser sa saisie.
            if (essai < 3) await importer(essai + 1);
            return;
          }
          if (!persistant) return;
          const sur = securiser(lu);
          persiste.current = sur;
          affiche.current = sur;
          envoyer({ type: "importer", batiment: sur });
        };
        importer(0);
      }),
    [moteur, projetId],
  );

  const niveau = niveauCourant(batiment, etat.niveauId);
  const pieceEnregistree = niveau.pieces.find((p) => p.id === etat.pieceId) ?? null;
  const piece = etat.apercu && etat.apercu.id === etat.pieceId ? etat.apercu : pieceEnregistree;
  const niveauAffiche = useMemo(
    () => (piece ? remplacerPiece(niveau, piece) : niveau),
    [niveau, piece],
  );

  const metresPiece = useMemo(() => (piece ? calculerMetres(piece) : null), [piece]);
  const metresNiveau = useMemo(() => calculerMetresNiveau(niveauAffiche), [niveauAffiche]);

  const validerPiece = useCallback(
    (nouvellePiece) => {
      envoyer({ type: "valider-batiment", batiment: remplacerNiveau(batiment, remplacerPiece(niveau, nouvellePiece)) });
    },
    [batiment, niveau],
  );

  const previsualiserPiece = useCallback((nouvellePiece) => envoyer({ type: "apercu", piece: nouvellePiece }), []);

  const creerPieceRect = useCallback(
    ({ nom, longueurMm, largeurMm, hauteurMm }) => {
      const brute = creerPieceRectangulaire({
        nom: nom?.trim() || `Pièce ${etat.numeroPiece}`,
        longueurMm,
        largeurMm,
        hauteurMm,
      });
      const nouvelle = placerSansChevauchement(niveau, brute);
      envoyer({
        type: "piece-creee",
        batiment: remplacerNiveau(batiment, ajouterPiece(niveau, nouvelle)),
        pieceId: nouvelle.id,
      });
      return nouvelle;
    },
    [batiment, niveau, etat.numeroPiece],
  );

  const creerPieceDepuisSommets = useCallback(
    (sommets, hauteurMm) => {
      const nouvelle = creerPiece({ nom: `Pièce ${etat.numeroPiece}`, sommets, hauteurMm });
      envoyer({
        type: "piece-creee",
        batiment: remplacerNiveau(batiment, ajouterPiece(niveau, nouvelle)),
        pieceId: nouvelle.id,
      });
      return nouvelle;
    },
    [batiment, niveau, etat.numeroPiece],
  );

  const supprimerPieceCourante = useCallback(() => {
    if (!pieceEnregistree) return;
    const reste = supprimerPiece(niveau, pieceEnregistree.id);
    envoyer({ type: "valider-batiment", batiment: remplacerNiveau(batiment, reste) });
    envoyer({ type: "choisir-piece", pieceId: reste.pieces[0]?.id ?? null });
  }, [batiment, niveau, pieceEnregistree]);

  const creerNouveauNiveau = useCallback(() => {
    const numero = batiment.niveaux.length + 1;
    const nouveau = creerNiveau({ nom: `Niveau ${numero}` });
    envoyer({ type: "niveau-cree", batiment: ajouterNiveau(batiment, nouveau), niveauId: nouveau.id });
  }, [batiment]);

  return {
    charge: etat.charge,
    batiment,
    niveau: niveauAffiche,
    piece,
    metresPiece,
    metresNiveau,
    peutAnnuler: peutAnnuler(etat.historique),
    peutRetablir: peutRetablir(etat.historique),
    annuler: () => envoyer({ type: "annuler" }),
    retablir: () => envoyer({ type: "retablir" }),
    choisirPiece: (pieceId) => envoyer({ type: "choisir-piece", pieceId }),
    choisirNiveau: (niveauId) => envoyer({ type: "choisir-niveau", niveauId }),
    creerNouveauNiveau,
    creerPieceRect,
    creerPieceDepuisSommets,
    supprimerPieceCourante,
    validerPiece,
    previsualiserPiece,
    abandonnerApercu: () => envoyer({ type: "abandonner-apercu" }),
  };
}
