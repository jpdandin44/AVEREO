---
project: avereo-app-rapport
document_type: changelog
title: Evolutions significatives de Rapport AVEREO
status: active
version: git
created: 2026-09-10
updated: 2026-09-14
owner: jpdandin
tags:
  - rapport
  - changelog
---

# Evolutions significatives de Rapport AVEREO

## 2026-09-14

- Accords de Visite Globale places sous le titre de Dossier, avant l'ecoute.
- Vues Cadastre, Rapport des risques, Carte PLU / regles, Relief / orientation ;
  synthese interne et relance independante des risques.
- Attributs GPU sources, notes de verification, rose des vents et orientation
  manuelle, reperage altimetrique IGN de neuf points avec limites explicites.
- Payload, reprise JSON defensive et export alignes.
- Verrouillage de la dictee de Visite Globale egalement applique a Export.
- 39 tests et compilation finale reussis ; vues locales, reprise et apercu
  verifies selon le bilan de [contexte du bien](api/contexte-du-bien.md).
- Mise a jour de la PR #61 demandee ; checklist officielle conservee,
  sans cochage, migration, merge ni deploiement.

## 2026-09-13

- Remplacement de l'iframe cartographique par une carte cadastrale IGN directe
  (Leaflet 1.9.4), avec plan, photographies aeriennes et limites des parcelles.
- Bloc visuel simplifie : repere, adresse, statut, recentrage, confirmation
  du bien et retour au champ adresse ; annulation de confirmation disponible.
- Aucun compte Google, cle API, changement MySQL ou workflow de deploiement.
- Controle local du rendu et des transitions ; 31 tests et build reussis.
  La qualification en environnement heberge reste a effectuer.
- Retour utilisateur favorable sur l'apercu local : cette version de prototype
  est retenue pour revue dans la [PR #61](https://github.com/jpdandin44/AVEREO/pull/61).
  Ce jalon ne constitue ni une release de production ni une autorisation de merge.

## 2026-09-12

- Deplacement du fil conducteur de `Dossier` vers l'en-tete de `Protocoles`.
- Entretien enrichi : histoire du bien, travaux passes, vecu, besoin reformule,
  criteres de reussite, contraintes et confirmation de la reformulation.
- Controles Habitologie non selectionnes par defaut, suggestions basees sur
  les sujets coches a l'ecoute, priorite aux choix manuels et preservation des
  anciens dossiers ; libelles d'entretien et d'export mutualises.
- Integration experimentale du plan IGN dans `Site` avec confirmation du lieu
  liee a l'adresse ; rendu du fond non encore valide dans le navigateur integre.
- Affichage du lieu des le geocodage, delais de requetes et protection contre
  les reponses tardives apres sortie de l'etape Site.
- Transformation du fil `Eau -> Air -> Terre -> Feu` en protocole operationnel
  propre a `Visite Globale`, avec controles terrain activables par phase.
- Regroupement des observations d'habitologie dans le meme ordre, ajout d'un
  rattachement au point de protocole et conservation des anciennes
  observations dans une zone `A classer`.
- Affichage dans `Site` de la synthese JSON Georisques : risques naturels et
  technologiques presents, statuts a l'adresse et sur la commune, source,
  horodatage et acces au rapport officiel.
- Decouplage de la recherche cadastrale et de la synthese des risques : une
  parcelle non identifiee n'empeche plus la restitution Georisques.
- Ajout de controles unitaires pour l'ordre et la fusion du protocole ainsi
  que pour l'URL, la normalisation et les statuts Georisques.

## 2026-09-11

- Correction de la semantique de `Visite Globale` : le choix complementaire
  devient le type d'habitation (`Maison`, `Appartement`, `Immeuble collectif`
  ou `Autre habitation`).
- Positionnement de `Eau -> Air -> Terre -> Feu` comme ordre obligatoire des
  dimensions de l'analyse, commun a toutes les visites globales.
- Migration defensive des anciennes valeurs d'element vers `A preciser`, sans
  leur attribuer artificiellement un type de logement.
- Ajout conditionnel de la section `Ecoute client` pour `Visite Globale` :
  motif, attentes, preoccupations, usages et contexte d'occupation.
- Ajout des accords photo et dictee au payload existant ; commandes photo et
  micro desactivees tant que l'accord correspondant n'est pas enregistre.
- Reprise des donnees d'ecoute dans le brouillon, la sauvegarde JSON, l'apercu
  et l'export Word, sans schema MySQL supplementaire.
- Priorisation du prototype fonctionnel ; etude du TDD reportee a la phase
  d'industrialisation en vue de la commercialisation.
- Limitation des nouvelles creations aux categories
  `Expertise & Visite technique` et `Visite Globale`.
- Ajout des sous-categories techniques `Evaluation Energétique`, `Mesures`,
  `cartographie` et `pathologies`.
- Masquage reversible des modules `Assistance avant-projet`,
  `Diagnostic specifique` et `Reception de travaux`, sans suppression de leur
  definition ni de la compatibilite des anciens brouillons.
- Migration defensive des anciennes classifications techniques et Habitologie.
- Formalisation du workflow Habitologie dans une proposition en etude separee
  de l'etat implemente.

## 2026-09-10

- Retablissement dans l'etape `Site` du bouton `Rapport des risques`, omis lors
  de la migration statique de juillet 2026.
- Construction et validation testees du lien vers le rapport PDF officiel
  Georisques a partir des seules coordonnees longitude/latitude.
- Remplacement du type de dossier `Reception de travaux` par
  `Rapport Habitologue` pour les nouvelles creations.
- Reutilisation du meme assistant, du brouillon, des photos, de la dictee, de
  la sauvegarde et de l'export.
- Conservation des anciens dossiers Reception et conversion des prototypes de
  brouillon Habitologie vers le nouveau type.
- Extension de la suite a douze tests unitaires executables avec `npm test`.
