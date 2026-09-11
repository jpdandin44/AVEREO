---
project: avereo-app-rapport
document_type: workflow-proposal
title: Proposition de workflow operationnel pour Visite Globale
status: proposed
version: git
created: 2026-09-11
updated: 2026-09-11
owner: jpdandin
tags:
  - rapport
  - habitologie
  - workflow
  - proposition-en-etude
---

# Proposition de workflow operationnel pour Visite Globale

## Propositions en etude

Ce document est la source Markdown de reference de la proposition de workflow
Habitologie. Il formalise une cible a arbitrer et ne decrit pas un moteur deja
implemente. Le document Word initial reste une source de cadrage archivee, pas
une seconde source maintenue.

## Perimetre fonctionnel

Le parcours reutilise l'application Rapport, son acces CONNECT, son stockage,
ses photos, sa dictee, ses observations et ses exports. Un dossier
`Visite Globale` est rattache a l'un des quatre elements : `Eau`, `Air`,
`Terre` ou `Feu`.

Le parcours visible cible comprend quatre phases :

1. `Ecoute` : recueillir le besoin, le contexte, les usages, les attentes et
   les consentements necessaires ;
2. `Observation/Analyse` : structurer les constats, photos, mesures,
   commentaires, risques et donnees sourcees ;
3. `Explication` : transformer l'analyse en explications comprehensibles,
   hierarchisees et reliees aux observations ;
4. `Pistes d'accompagnement` : proposer des priorites, actions, aides et
   ressources, sans presenter une hypothese comme un diagnostic ou une
   eligibilite garantie.

## Etats operationnels proposes

| Etat propose | Entree attendue | Sortie ou action principale |
| --- | --- | --- |
| `BROUILLON` | Dossier cree | Completer le client, le bien, l'element et la mission. |
| `PRET_POUR_VISITE` | Donnees minimales valides | Autoriser le demarrage de la collecte terrain. |
| `VISITE_EN_COURS` | Visite demarree | Saisir l'ecoute, les observations, photos, mesures et notes. |
| `COLLECTE_TERMINEE` | Collecte cloturee par l'utilisateur | Verrouiller le perimetre transmis a l'analyse ou rouvrir explicitement la visite. |
| `EN_ANALYSE` | Donnees minimales disponibles | Ingerer, enrichir et analyser les informations sourcees. |
| `A_COMPLETER` | Donnee obligatoire absente ou incoherente | Demander une correction ciblee sans publier de resultat incomplet. |
| `RAPPORT_A_VALIDER` | Rapport genere et audit interne passe | Presenter le rapport a la validation humaine. |
| `RAPPORT_VALIDE` | Validation humaine enregistree | Autoriser la synthese client. |
| `SYNTHESE_PRETE` | Synthese generee | Controler le rendu et les references avant publication. |
| `PUBLIE` | Publication confirmee | Rendre le livrable disponible selon les droits du dossier. |

Les noms, transitions et regles de retour arriere restent a valider avant leur
implementation.

## Chaine de traitement proposee

Le document de cadrage fourni conduit a la chaine suivante :

`INGERER -> ENRICHIR -> ANALYSER -> GENERER RAPPORT -> AUDIT -> VALIDATION HUMAINE -> GENERER SYNTHESE CLIENT`

- `INGERER` controle le schema, les pieces et les metadonnees du dossier.
- `ENRICHIR` appelle uniquement les sources autorisees et conserve leur date.
- `ANALYSER` relie les constats aux quatre phases sans fabriquer de fait.
- `GENERER RAPPORT` produit un contenu detaille et tracable.
- `AUDIT` recherche les champs manquants, contradictions, sources absentes et
  formulations excessives.
- `VALIDATION HUMAINE` est un point de controle bloquant avant toute synthese
  partageable.
- `GENERER SYNTHESE CLIENT` produit une restitution courte apres validation.

L'architecture d'execution de cette chaine n'est pas encore choisie.

## Actions d'interface envisagees

Pour conserver un usage simple, quatre actions pourraient etre ajoutees dans
l'etape `Export` au fur et a mesure des lots :

- `Cloturer la collecte` ;
- `Generer le rapport` ;
- `Valider le rapport` ;
- `Generer la synthese client`.

Chaque bouton doit etre conditionne par l'etat courant, les droits CONNECT et
les controles de donnees. Aucun de ces boutons n'est livre par le present lot.

## Invariants de securite et de qualite

- CONNECT reste le point d'acces unique en environnement heberge.
- Un utilisateur ne peut lire ou modifier que les dossiers autorises.
- Une donnee externe conserve sa source et sa date de consultation.
- Une indisponibilite externe n'efface pas une saisie manuelle valide.
- Les photos, notes et donnees vocales suivent des regles explicites de
  consentement, conservation et suppression.
- Aucun rapport client n'est publie sans validation humaine tracee.
- Les sorties distinguent faits, observations, hypotheses et recommandations.

## Scenarios de validation du prototype

1. Un dossier `Visite Globale` peut etre cree pour chacun des quatre elements.
2. Une visite incomplete ne peut pas etre cloturee sans afficher les donnees
   manquantes.
3. Une source externe indisponible permet une saisie manuelle identifiee.
4. Un audit en echec place le dossier en `A_COMPLETER` et interdit la
   publication.
5. Un rapport non valide ne permet pas de produire une synthese publiable.
6. Un utilisateur non autorise ne peut ni valider ni publier le dossier.
7. Un ancien brouillon Habitologie reste chargeable sans attribution
   arbitraire d'un element.

## Points restant a arbitrer

- `TBD` — architecture d'execution : API Rapport, automatisation externe ou
  combinaison des deux ;
- `TBD` — fournisseur et modele IA eventuels, ainsi que leurs regles de
  confidentialite et de journalisation ;
- `TBD` — donnees minimales et controles precis pour chaque transition ;
- `TBD` — role CONNECT habilite a valider et a publier ;
- `TBD` — conservation ou non de l'audio brut, duree de retention et modalites
  de suppression ;
- `TBD` — format final de la synthese et politique d'utilisation des
  illustrations AQC, ADEME, Ubakus et Guidance Wheel.

## Prochaine decision attendue

Valider d'abord les quatre phases visibles et les donnees minimales de la phase
`Ecoute`. L'implementation pourra ensuite commencer par une tranche
fonctionnelle courte et demonstrable, sans figer prematurement l'orchestration
complete. La traduction systematique de ces scenarios en tests automatises
sera etudiee pendant l'industrialisation.
