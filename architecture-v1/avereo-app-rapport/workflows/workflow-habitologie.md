---
project: avereo-app-rapport
document_type: workflow-proposal
title: Proposition de workflow operationnel pour Visite Globale
status: proposed
version: git
created: 2026-09-11
updated: 2026-09-13
owner: jpdandin
tags:
  - rapport
  - habitologie
  - workflow
  - proposition-en-etude
---

# Proposition de workflow operationnel pour Visite Globale

## Propositions en etude

Ce document est la source Markdown de reference du workflow Habitologie. Il
formalise une cible encore largement a arbitrer. Les tranches `Ecoute`,
protocole `Eau -> Air -> Terre -> Feu`, classement des observations et
synthese Georisques sont implementees ; la machine d'etats, l'explication et
l'accompagnement ne sont pas livres. Le document Word initial reste une
source de cadrage archivee, pas une seconde source maintenue.

## Perimetre fonctionnel

Le parcours reutilise l'application Rapport, son acces CONNECT, son stockage,
ses photos, sa dictee, ses observations et ses exports. Un dossier
`Visite Globale` qualifie le type d'habitation : `Maison`, `Appartement`,
`Immeuble collectif` ou `Autre habitation`.

Chaque dossier suit ensuite le meme fil conducteur d'analyse, dans un ordre
fixe :

`Eau -> Air -> Terre -> Feu`

Ces quatre dimensions sont complementaires et successives. Elles ne
constituent pas des sous-categories entre lesquelles choisir.

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

### Etat implemente de la phase Ecoute

L'etape `Dossier` affiche pour `Visite Globale` un entretien en trois temps :
histoire du logement et travaux deja realises ; vecu quotidien, usages et
preoccupations ; puis attentes, besoin reformule, criteres de reussite et
contraintes du projet. Les questions ouvertes sont des relances, pas une liste
a reciter ni des champs tous obligatoires. Les accords photo/dictee restent
explicites.
Ces donnees sont sauvegardees et exportees avec le payload Rapport existant.
Les commandes photo et dictee sont desactivees sans leur accord respectif.
L'absence de motif ou d'attentes produit une alerte non bloquante pendant la
phase de prototype. Le type d'habitation est demande dans le meme dossier.
Le fil conducteur `Eau -> Air -> Terre -> Feu` est affiche uniquement en
en-tete de l'etape 3 `Protocoles`, pas dans l'encadre d'ecoute.

La reformulation du besoin peut etre confirmee avec le client. Toute
modification de ce texte annule sa confirmation. Le besoin reel n'est jamais
deduit automatiquement : distinguer le symptome, la solution demandee et
l'amelioration attendue. Exemple : « remplacer les fenetres » peut viser le
confort, le calme ou les economies ; la visite doit clarifier cette finalite.

### Etat implemente du protocole et des observations

L'etape `Protocoles` suit obligatoirement les quatre phases suivantes :

1. `Eau` : infiltrations, apports et evacuations, toiture et eaux pluviales,
   humidite, condensation et moisissures ;
2. `Air` : presence d'une ventilation, type et fonctionnement, qualite de
   l'installation et entretien, entrees, transferts et sorties d'air ;
3. `Terre` : interfaces de l'enveloppe, etancheite a l'air, vapeur d'eau,
   continuite de l'isolation et ponts thermiques visibles ;
4. `Feu` : production de chauffage, emetteurs, regulation, etat apparent,
   entretien et confort ressenti.

Les nouveaux dossiers ne selectionnent aucun point par defaut. Six sujets
peuvent etre coches explicitement pendant l'ecoute pour suggerer des controles
correspondants ; les notes libres ne declenchent aucune selection. La relation
sujet-controles est definie dans `frontend/src/habitologieProtocol.js`, source
executable unique. La provenance des suggestions est affichee dans le protocole.
Un choix manuel explicite (oui ou non) reste prioritaire, meme si l'ecoute
evolue. Les selections deja sauvegardees des anciens brouillons sont conservees.
Les protocoles des rapports techniques restent inchanges.

Le professionnel fait le point avec le client avant la visite ; les quatre
phases restent visibles et il peut ajouter des controles au-dela des sujets
exprimes. Un point non retenu n'est ni verifie ni declare sans risque. Il n'y
a pas de verrou de passage a l'etape suivante dans ce prototype.
Dans `Observations`, l'utilisateur ajoute un
constat directement dans une phase et peut le rattacher a l'un de ces points.
Les photos, la dictee et les autres champs existants restent disponibles selon
les accords recueillis. Un constat historique sans phase est conserve dans
`A classer`.

### Etat implemente de la synthese des risques

Apres geocodage, `Site` appelle l'endpoint public Georisques V1 avec les seules
coordonnees. L'interface presente les risques naturels et technologiques
marques presents, avec les statuts a l'adresse et sur la commune. Le payload
conserve la source, la date de consultation et le lien vers le rapport
officiel. L'indisponibilite de Georisques ou du cadastre est signalee sans
inventer de resultat et sans effacer les autres donnees saisies.

### Localisation avec le client — prototype implemente

`Site` affiche les parcelles IGN sur un plan ou des photographies aeriennes,
centrees sur le point geocode. Les boutons `Cadastre`, `Vue aerienne` et
`Recentrer` facilitent la lecture avec le client. Aucun compte ni cle requis.
L'adresse saisie et l'adresse trouvee restent distinctes.

`Confirmer ce bien` conserve une confirmation manuelle avec l'adresse, les
coordonnees et la date. `Corriger l'adresse` annule la confirmation et replace
le curseur dans le champ du dossier. Une annulation sans correction reste
possible. Un changement d'adresse ou une nouvelle recherche invalide la
confirmation. Deplacer la carte ne change pas le point enregistre.

Le geocodage affiche le lieu avant les enrichissements cadastre/PLU/risques ;
les requetes ont un delai maximal et les retours d'une ancienne recherche ne
peuvent plus modifier le dossier apres sortie de l'etape.

L'iframe presentant un fond noir le 12 septembre a ete remplacee le 13 par
des tuiles raster directes. Le plan, les parcelles et la vue aerienne sont
verifies localement. La qualification en preproduction reste requise ; les
erreurs de tuiles sont signalees et un lien IGN externe reste disponible.
Voir [`../api/cartographie.md`](../api/cartographie.md).

Ce reperage ne vaut ni identification juridique de parcelle ni preuve de
propriete. Aucun nom, email ni contenu de l'entretien n'est transmis a IGN.

## Etats operationnels proposes

| Etat propose | Entree attendue | Sortie ou action principale |
| --- | --- | --- |
| `BROUILLON` | Dossier cree | Completer le client, le bien, le type d'habitation et la mission. |
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
- `ANALYSER` relie les constats successivement a Eau, Air, Terre et Feu sans
  fabriquer de fait.
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
les controles de donnees. Aucun de ces boutons n'est livre par la tranche
`Ecoute` actuelle.

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

1. Un dossier `Visite Globale` peut etre cree avec un type d'habitation,
   presente les dimensions `Eau`, `Air`, `Terre`, `Feu` dans cet ordre et
   permet d'ajouter une observation dans chaque phase.
2. Une visite incomplete ne peut pas etre cloturee sans afficher les donnees
   manquantes.
3. Une source externe indisponible permet une saisie manuelle identifiee.
4. Un audit en echec place le dossier en `A_COMPLETER` et interdit la
   publication.
5. Un rapport non valide ne permet pas de produire une synthese publiable.
6. Un utilisateur non autorise ne peut ni valider ni publier le dossier.
7. Un ancien brouillon Habitologie reste chargeable sans attribution
   arbitraire d'un type d'habitation.

## Points restant a arbitrer

- `TBD` — enrichissement metier de l'entretien a partir des supports Solive
  et de formation Habitologue que le proprietaire envisage de fournir ;
- `TBD` — qualifier la carte en preproduction, les coupures reseau et les cas
  d'adresse ambigue ; ne pas confondre le repere d'adresse avec la parcelle ;
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

Valider les tranches `Ecoute`, protocole, observations et synthese des risques
sur un exemple de visite, puis definir les donnees metier complementaires de
chaque phase sans figer prematurement l'orchestration complete. La traduction
systematique de ces scenarios en tests automatises sera etudiee pendant
l'industrialisation.
