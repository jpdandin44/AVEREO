import Icone from "./Icone.jsx";

/**
 * Libellé et pictogramme de l'état d'enregistrement (R03, R12 : jamais la couleur seule).
 * @param {{reseau: "ok"|"hors-ligne"|"reconnexion"|"autre-compte"|"erreur", enAttente: number, durable?: boolean}} etat
 * @returns {{icone: "valide"|"attente"|"horsligne"|"alerte", libelle: string, aide: string, alerte: boolean}}
 */
export function decrireEnregistrement({ reseau, enAttente, durable = true }) {
  const pluriel = enAttente > 1 ? "s" : "";
  if (!durable) {
    return { icone: "alerte", libelle: "Stockage non durable", aide: "Cet appareil refuse le stockage local : fermer la page efface le relevé non envoyé.", alerte: true };
  }
  if (reseau === "reconnexion") {
    return {
      icone: "alerte",
      libelle: "Reconnexion nécessaire",
      aide: `Relancez AVEREO Vision depuis AVEREO CONNECT. ${enAttente > 0 ? `${enAttente} modification${pluriel} en attente restent sur cet appareil.` : "Rien n'est perdu."}`,
      alerte: true,
    };
  }
  if (reseau === "autre-compte") {
    return {
      icone: "alerte",
      libelle: "Autre compte connecté : rechargez la page",
      aide: `Un autre compte est connecté dans ce navigateur. ${enAttente > 0 ? `${enAttente} modification${pluriel} en attente restent sur cet appareil pour ce compte.` : "Rien n'est perdu."}`,
      alerte: true,
    };
  }
  if (reseau === "hors-ligne") {
    return {
      icone: "horsligne",
      libelle: enAttente > 0 ? `Hors ligne : ${enAttente} modification${pluriel} en attente d'envoi` : "Hors ligne : enregistré sur cet appareil",
      aide: "La saisie continue ; tout partira au retour du réseau.",
      alerte: false,
    };
  }
  if (reseau === "erreur") {
    return {
      icone: "alerte",
      libelle: enAttente > 0 ? `Envoi impossible : ${enAttente} modification${pluriel} en attente` : "Envoi impossible pour le moment",
      aide: "Nouvelle tentative automatique. Vos modifications sont enregistrées sur cet appareil.",
      alerte: true,
    };
  }
  if (enAttente > 0) {
    return { icone: "attente", libelle: `En attente d'envoi (${enAttente})`, aide: "Enregistré sur cet appareil, envoi en cours.", alerte: false };
  }
  return { icone: "valide", libelle: "Enregistré", aide: "Enregistré sur cet appareil et sur le serveur.", alerte: false };
}

/** Pastille de l'en-tête : état d'enregistrement visible en permanence. @param {{synchro: any, durable?: boolean}} props */
export default function IndicateurEnregistrement({ synchro, durable = true }) {
  const etat = decrireEnregistrement({ reseau: synchro.reseau, enAttente: synchro.enAttente, durable });
  return (
    <span className={etat.alerte ? "indicateur indicateur--alerte" : "indicateur"} role="status" title={etat.aide}>
      <Icone nom={etat.icone} className="indicateur__icone" />
      <span>{etat.libelle}</span>
    </span>
  );
}
