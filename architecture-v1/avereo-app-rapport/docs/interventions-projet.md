---
project: avereo-app-rapport
document_type: functional-specification
title: Interventions Rapport vers Projet et planning informatif
status: active
version: git
created: 2026-11-16
updated: 2026-11-19
owner: jpdandin
tags: [rapport, interventions, projet, planning]
---

# Interventions Rapport vers Projet et planning informatif

## Cadrage

Le responsable demande d’enchaîner le prochain lot après la livraison PR162.
Le suivi désigne Interventions vers Projet/Gantt informatif. Le responsable
confirme explicitement le 16 novembre : « Oui, commencer par le fichier Projet ».
Cette première tranche prépare un fichier chargé volontairement par « Importer
un projet » dans Mes projets, créant un projet indépendant. Ce choix de parcours
est distinct de la revue des tests, du merge et des autorisations de livraison.

Réutiliser decision.actions, sans deuxième liste d’interventions. Sélection
Projet distincte de la sélection client. Début, capacité hebdomadaire et charges
explicitement renseignés ; horizon libre non converti en dates. Aperçu informatif
dans Rapport calculé par le moteur Projet existant. Ordre séquentiel annoncé,
lundi–vendredi, jours fériés non intégrés. Aucune validation ou réalisation déduite.

Les paramètres et estimations optionnels restent dans le dossier Rapport, avec
brouillon/JSON/serveur. Le fichier dérivé contient seulement les interventions
sélectionnées, leurs modalités/préalables et références utiles ; aucune photo,
plan, signature, identité de connexion ou autre contenu du rapport. Avant le
téléchargement, le contenu et les limites sont affichés. Le JSON complet Rapport
et les restitutions expert/client actuelles restent disponibles et inchangés.

## Développement local

Copie isolée C:/Users/examg/Documents local/avereo-rapport-projet, branche
feat/rapport-projet-interventions, base PR162 fusionnée f4017be. Sept documents
de livraison précédents repris à l’identique, copie source préservée.

Fichiers réalisés : nouveau panneau et adaptateur de projection dans frontend/src,
raccord InterventionsPanel, validation PHP des champs optionnels, tests ciblés et
documentation. Lecture/import du moteur planning-core.js existant de Projet,
sans modification de l’application Projet, de ses routes/droits ou des composants
communs. Tableau/Gantt de vérification et création indépendante via son import
existant à qualifier.

Critères : données hors planning et identifiants Rapport intacts ; ancien dossier
inchangé à la lecture ; refus des dates/charges/références invalides ; export
normalisé sans perte par Projet ; contenu explicite et borné, réimport et projet
courant conservé ; sauvegarde/réouverture des estimations ; Word expert/client
identiques hors données d’édition ; replis PR162 et profil Habitologue préservés.

### Contrat et conservation

Le [contrat d’échange](../api/interventions-projet.md) fixe les blocs optionnels,
la sélection, les données exportées, les bornes et le calendrier. Aucun champ
ajouté à la lecture. Paramètres dans decision.planning_projet et estimations dans
les actions existantes, ouverture repliable cohérente avec PR162. Import du moteur
Projet existant, sans dépendance nouvelle ni modification de Projet.

Le fichier Projet est une projection professionnelle des interventions cochées,
indépendante du filtrage client. Il contient modalités/préalables et références
lisibles, aucune identité de connexion, donnée photo/plan/signature ou note
d’écoute. Il n’est pas le JSON complet Rapport. Les textes trop longs et références
ambiguës sont refusés sans troncature. Le fichier est créé avant toute décision
de l’importer ; Mes projets propose le nom et crée une nouvelle ligne.

Un nombre intermédiaire invalide reste éditable ; export et sauvegarde serveur
refusés tant qu’il est incorrect. Les blocs vides/listes sont refusés pour ces
nouvelles propriétés, sans modifier la réserve des protocoles antérieurs.
Les moteurs de restitution existants restent identiques : aucun planning ajouté
aux Word expert/client dans cette première tranche.

### Qualification locale

**226 tests Node Rapport**, dont dix nouveaux ; **34 tests du moteur Projet
inchangé**, dont week-ends/capacité/changement d’heure ; **47 contrôles PHP décision**,
13 plans et téléchargement complet. Deux builds de 150 fichiers, dépendances
verrouillées inchangées. 48 contrôles HTTP/PHP/MariaDB : sauvegarde, invalides
refusés en conservant toutes les colonnes/propriétaire, nouvelles sessions,
copies et refus croisés. 74 contrôles HTTP natifs Projet existants : identité,
CSRF/origine, révisions, projets indépendants et conservation. Tous réussis.

Navigateur natif sur compte fictif A : zéro sélection et capacité 0 empêchent le
téléchargement sans masquer les champs ; sélection/désélection conserve les
estimations. Aperçu de deux interventions, 3,5 jours-personne, du 23 novembre
au 1er décembre sous les hypothèses saisies. Fichier réellement téléchargé dans
Rapport puis sélectionné par le sélecteur de fichiers de Projet. « Importer un
projet » crée une ligne indépendante ; Gantt, deux tâches et dates concordants.
Réexport UI du projet entier identique au fichier reçu. Rechargement : nouveau
projet et projet préexistant tous deux présents ; ancien current.json exactement
identique, révision conservée. Les identités signées sont fictives et séparées
pour les deux bancs locaux, pas un SSO CONNECT réel qualifié.

Sauvegarde Rapport, déconnexion normale, retrait du seul brouillon de l’origine
de recette et nouvel onglet/compte A ; Reprendre désactivé. Téléchargement serveur
avant/après identique octet pour octet, et décision complète relue dans l’interface
à l’identique ; 14 observations, quatre photos, quatre plans et signature conservés.
Aucune origine/brouillon préproduction ou d’un autre service touché.

Word expert/client générés depuis l’interface : mêmes textes après substitution
des seuls titre/référence fictifs volontairement changés, mêmes cibles de liens
et mêmes octets des neuf/huit médias que les références PR162. HTML exact avec
et sans métadonnées planning pour les deux restitutions. Pas de nouvelle lecture
native/pagination Word/PDF. Écran ouvert à 390 pixels : largeur/scroll de page
375/375, pas de débordement observé ; ce n’est pas un appareil physique.

La fixture synthétique reprend la représentation serveur des quatre contrôles
de protocole vides (listes plutôt qu’objets) : réserve PHP préexistante explicitée
dans fixture-compatibilite-php.json, assertions de conservation non affaiblies.
Le montage du banc Projet a été corrigé pour préparer le sas commun et une session
fictive conforme ; code Projet inchangé. Aucun blocage technique restant localement.

[Qualification](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-interventions-projet-20261116/verification-locale.json>) ·
[Nouvelle session](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-interventions-projet-20261116/recette-reouverture.json>) ·
[Import Projet](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-interventions-projet-20261116/projet-integration.json>) ·
[Word](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-interventions-projet-20261116/verification-word.json>).

### Revue locale

[Rapport fictif](http://127.0.0.1:5198/fixture/) → Compte fictif A →
RECETTE-PROJET-20261116 dans la liste serveur → Export → Planning informatif et
Projet. Les estimations de recette sont déjà disponibles ; champs et sélection
peuvent être modifiés sur ce dossier fictif. Télécharger pour Projet.

[Projet fictif](http://127.0.0.1:5200/fixture) → Importer un projet → choisir le
fichier → Créer et ouvrir. Le projet préexistant et un exemple déjà importé
permettent de vérifier la conservation. Services temporaires actifs, sans vraie
identité CONNECT. La fenêtre Projet de recette utilise le HTML métier inchangé
et l’API privée locale ; le cadre React/SSO hébergé n’est pas qualifié par ce banc.

Relance Rapport depuis la racine application :

```powershell
python -X utf8 tests/report-files-http.py --fixture .local/projet-recette.json --receipt .local/verification-http.json --serve --port 5198
```
Le banc Projet est décrit par .local/start-projet-fixture.py et son état privé
local ; ces éléments de recette ne sont pas publiés. PHP, Docker/MariaDB déjà
présents, dépendances Node et dossier fictif local requis. Les liens cessent
de répondre si les services sont arrêtés.

Le responsable confirme le parcours par fichier Projet, puis déclare les tests
OK et demande la livraison préproduction. Les quatre cases humaines et la fusion
sont vérifiées séparément ; la livraison et ses limites sont décrites ci-dessous.

## Préproduction

**PR163 livrée et alignée le 16 novembre.** Candidat accepté de0edf3, fusion
9f8645b866ae4fc5e9927070b31b8d4fc9f26897, arbre complet 85e3171 identique.
L’archive qualifiée eb6d125858b51b7a49cc20d27156d34bfdfc5689a34df2194e39937f6f016334
est promue sans reconstruction. Cinq fichiers : validation PHP, trois ressources
statiques et index HTML en dernier. La fusion annoncée a d’abord été absente de
GitHub ; le candidat explicitement autorisé a été installé, puis l’arbre fusionné
identique et main ont été vérifiés. Le reçu initial reste une preuve datée.

Sauvegarde fraîche application/configuration relue et restauration/retour arrière
répétés sur copie ; sauvegarde privée des dossiers relue sans restauration SQL.
201 fichiers préexistants hors installation, configuration et production préservés.
**24 dossiers, toutes leurs colonnes et propriétaires exacts** après installation
puis navigation ; aucune écriture de dossier, migration ou activation d’originaux.

CONNECT renouvelé normalement. Import fictif complet, panneau repliable, dates du
23 novembre au 1er décembre pour 3,5 jours-personne, capacité 0 refusée puis
corrigée ; fichier Projet entier identique à la projection canonique de la fixture.
Le nom de projet de cette fixture diffère du précédent téléchargement local, qui
utilisait un titre explicitement modifié ; aucune autre divergence du fichier.
JSON métier exact après la seule normalisation connue de quatre contrôles vides
[] en {} ; Terrain et autres champs exacts. Deux Word : textes et liens exacts,
neuf médias expert et huit client identiques aux références. Aucune erreur console
observée. Brouillon initial restauré dans les quatre emplacements et relu après
rechargement, identique à la sauvegarde privée indépendante.

[Reçu final](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr163-preprod-20261116/verification-finale.json>) ·
[Alignement main](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr163-preprod-20261116/alignement-main.json>).
Nouvelle sauvegarde/réouverture serveur et import dans Projet hébergé non effectués
pendant cette livraison ; leurs preuves locales restent distinctes. Pas de nouvelle
pagination native Word/PDF, microphone/caméra ou appareil physique. Revue métier
hébergée distincte ; lot Profils avec CONNECT engagé dans sa propre itération.

## Mise en production

Non engagée et non autorisée. Aucun déploiement ni ouverture de production.



## 19 novembre — Mode périodes sans dates

Le panneau propose un choix daté/périodes. En mode périodes, chaque intervention retenue renseigne `periode_debut` et `duree_periodes`, entiers de 1 à 120 ; la charge est facultative et indépendante. Les paramètres et coordonnées suivent le dossier complet et ses sauvegardes. Le fichier Projet retire les contraintes calendaires, conserve références et modalités, et porte `timelineMode: "periods"`. Le [contrat Projet](../../avereo-app-projet/docs/planning-periodes.md) définit les bornes, validations et limites. Aucun planning ajouté aux Word dans ce lot.

La [qualification hébergée du 19 novembre](../../avereo-app-projet/docs/planning-periodes.md#qualification-du-19-novembre) termine l’import indépendant puis la sauvegarde et la réouverture après reconnexion : dossier fictif de 14 constats, 4 photos, 12 vues et signature, deux interventions choisies. Le JSON Rapport téléchargé après réouverture est identique à celui d’avant déconnexion. Les périodes de Rapport restent indépendantes de la modification sauvegardée dans Projet. Les preuves antérieures datées ci-dessus restent historiques ; la PR175 et le suivi privé portent ce nouveau résultat.
