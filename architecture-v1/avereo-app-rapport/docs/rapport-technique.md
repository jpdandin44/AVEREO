---
project: avereo-app-rapport
document_type: cadrage
title: Rapport Technique — proposition de parcours minimaliste
status: active
version: git
created: 2026-11-24
updated: 2026-11-24
owner: jpdandin
tags: [rapport, technique, interface, expertise, cadrage]
---

# Rapport Technique — proposition de parcours minimaliste

## Portée et décision acquise

Préparation de Rapport V2 demandée le 24 novembre 2026 : rétablir un volet destiné aux experts du bâtiment, fondé sur les constats/observations, avec une interface simple. Analyse globale conserve ses fonctions approfondies. Ce document conserve le cadrage initial et décrit désormais une première tranche développée localement, sans livraison hébergée.

**Décision d’accès confirmée par le responsable le 24 novembre : AVEREO et experts explicitement habilités dans CONNECT**, avec choix du parcours à la création du dossier. Cela ne donne pas un droit supplémentaire aux comptes actuels. Le mécanisme de la première tranche est décrit ci-dessous ; un métier déclaré ou un défaut personnel ne constitue pas une autorisation.

Le cadrage initial se limitait à un aperçu fictif. La demande suivante autorise le développement local décrit ci-dessous ; aucun compte réel ni environnement hébergé modifié. La [qualification volumineuse V1.2](volume-sans-perte.md#préproduction) garde ses réserves ; cette préparation ne la clôt pas.

## Contrat de la première tranche locale

Le 24 novembre, le responsable valide la proposition et demande sa mise en place. **Développement local** engagé sur `feat/rapport-technique-minimal`, dans la même copie isolée. Les propositions initiales ci-dessous sont conservées comme historique ; cette section décrit le candidat applicatif.

- Création : « Nouveau rapport » ouvre le choix explicite Analyse globale / Rapport Technique. Les deux sont visibles ; Technique est désactivé avec explication si le compte n’est pas habilité. Annuler conserve le brouillon. Le parcours du dossier est rappelé au-dessus des étapes. Un nouveau dossier technique ne reprend pas le défaut professionnel global de CONNECT. Les anciens types continuent de se normaliser comme auparavant.
- Mission : référence, date, propriétaire, email, adresse et intervenant réutilisent les champs existants ; `mission_technique.objet`, `.perimetre`, `.limites` sont des textes facultatifs. Les compléments Site/Protocoles ne sont montés qu’à leur ouverture. La spécialité est choisie dans « Type de rapport technique » (Fissures, Humidité, Toiture, Constat général, Mesures, Cartographie, Pathologies, Évaluation énergétique) et le titre reste modifiable. Choix facultatif, valeur initiale « À préciser », sans effacement des contrôles ou constats lors d’un changement de spécialité. Aucun questionnaire d’écoute obligatoire.
- Constats : un constat affiché à la fois, ajout ouvert immédiatement, sélection conservée entre écrans, ordre par numéro/boutons clavier ou glissement de la liste. Constat et conseil visibles ; explications, élément/gravité et quatre textes facultatifs dans Détails techniques. Photos originales/préparées, dictée et repères utilisent les composants existants. Une dictée ou retouche en cours empêche de changer de constat.
- Restitution : les nouveaux champs de mission sont communs aux deux Word ; mesures/références/vérifications/limites de constat restent dans l’expert. Le client conserve la sélection explicite de trois constats maximum et n’exporte pas les constats exclus. Les anciens dossiers sans mission technique explicite conservent leurs restitutions historiques. Les données repliées restent intégralement dans le JSON.
- Contrôles bloquants avant Word inchangés : référence, propriétaire, adresse, intervenant, signataire, signature, au moins un constat renseigné et validité des plans/contexte. Les nouveaux champs ne créent pas d’obligation supplémentaire ; analyse/recommandations vides restent des alertes.
- Habilitation : administrateurs Rapport existants et liste privée `technical_report_connect_user_ids` (identifiants CONNECT explicites). Les droits d’action/propriété sont vérifiés séparément. Les comptes non habilités peuvent consulter et actualiser leurs anciens dossiers techniques selon les règles antérieures ; toute nouvelle copie ou conversion globale → technique exige la capacité. L’omission/falsification du profil ou de la catégorie ne crée pas d’autorisation. Une copie technique importée sans habilitation reste consultable mais n’est pas modifiable ni enregistrable comme nouveau dossier en ligne.
- Administration : cette tranche n’ajoute pas de commande dans la gestion CONNECT des comptes. Les habilitations supplémentaires sont configurées côté Rapport ; l’administration de ce droit depuis CONNECT reste un raccordement distinct à prévoir. Aucun compte réel ni configuration hébergée n’est modifié par le développement local.
- Persistance : tous les nouveaux textes sont facultatifs et bornés à 50 000 octets par le serveur, dans le JSON natif. Aucune table, migration SQL ou augmentation de quota. Lors d’une actualisation sans habilitation, seules les valeurs de classification de la ligne existante sont lues pour vérifier la compatibilité ; pas de seconde copie complète des médias en mémoire PHP.

## Correction après retour utilisateur — choix des types et Terrain

Le responsable signale le 24 novembre un choix de parcours insuffisamment visible, l’absence de spécialités techniques et un bloc Terrain manquant dans une Analyse globale. La clarification confirme qu’il faut permettre les deux choix : famille du rapport et type de mission technique.

Cause Terrain reproduite par un test en échec : `visitProtocolStages` dépendait du profil professionnel ou de données Terrain déjà présentes, au lieu de reconnaître systématiquement le type global. La recette initiale ne couvrait que le nombre d’étapes du global et n’avait pas détecté ce cas. Ce défaut est corrigé : toute Analyse globale, y compris les anciens dossiers et ceux sans profil, propose Terrain puis Eau/Air/Terre/Feu. Fil horizontal, T1/T2 indépendants du bâti, contrôles et données conservés ; aucun profil n’est imposé ou modifié pour faire réapparaître Terrain.

Le choix de famille apparaît à chaque création ; les dossiers existants gardent leur parcours et ne sont pas convertis. Une spécialité technique reste une classification de la mission, indépendante du profil et des droits CONNECT. Elle est conservée dans le JSON, en réouverture serveur et dans la couverture des deux Word ; son changement ne remplace pas les choix de protocole saisis.

Qualification renforcée : **262 tests Node**, recette navigateur de 13 contrôles avec choix des deux familles, refus expliqué pour B, spécialité modifiée et persistée, Word expert/client, annulation sans perte, Terrain et T1 dans un global sans profil, puis sauvegarde et réouverture exacte des deux parcours. [Reçu de correction](<C:/Users/examg/.codex/visualizations/2026/11/12/01a1d107-7531-7e80-96c7-acdb55274ecb/technical-correction/technical-browser-receipt.json>). Les comptes/droits hébergés restent inchangés.

## Qualification locale

[Entrée de revue](http://127.0.0.1:5240/fixture/) : comptes fictifs A (expert habilité) et B (création technique absente), base temporaire dédiée. Ce service doit rester démarré pour la revue ; sa fermeture efface la base fictive. Le parcours n’utilise aucun compte client ni session CONNECT hébergée.

Preuves de la session conservées dans le [dossier de recette](<C:/Users/examg/.codex/visualizations/2026/11/12/01a1d107-7531-7e80-96c7-acdb55274ecb/technical-application/technical-browser-receipt.json>) et le [reçu API/SQL](<C:/Users/examg/.codex/visualizations/2026/11/12/01a1d107-7531-7e80-96c7-acdb55274ecb/technical-http-receipt.json>). Word expert/client réellement téléchargés et leur contenu/médias DOCX contrôlés ; cela ne constitue pas une relecture native de pagination dans Microsoft Word. L’aperçu local et ses contrôles sont distincts de la recette hébergée future.

La qualification initiale comportait **260 tests Node** réussis ; le complément ci-dessus étend le contrôle aux cas signalés. La recette PHP/MariaDB réussit ses 60 contrôles ; 30 contrôles HTTP d’accès, d’essai et de révocation passent également. La fixture SQLite de ces contrôles conserve désormais le garde-fou mémoire natif et ferme ses connexions avant nettoyage Windows. Les fixtures de tests génériques désignent explicitement Analyse globale plutôt qu’une catégorie absente. La recette contrôle les refus, les habilitations explicites, les créations/copies/conversions, la réouverture en nouvelle session et les propriétaires. Le parcours navigateur contrôle également Analyse globale et les largeurs 320, 390 et 736 px.

**Limites restantes :** revue humaine du vocabulaire et du cas de mission, relecture de pagination Word, qualification en préproduction et raccordement éventuel de l’habilitation à l’administration CONNECT. Réserves V1.2 non effacées. Préproduction et Mise en production V2 non autorisées ; aucune ouverture publique.

## Existant vérifié

Référence inspectée : `9ef4cbe4a191475b958e67c839368d57cfe6a215`, branche principale observée le 24 novembre. L’arbre Rapport est identique à celui de la copie de suivi précédente.

- `frontend/src/reportClassification.js` conserve la catégorie historique `Expertise & Visite technique`, masquée à la création par `selectable: false`. Les anciens types techniques restent reconnus. Réafficher ce choix seul ne produirait pas une interface minimaliste.
- `frontend/src/App.jsx` utilise actuellement cinq étapes : Dossier, Site, Protocoles, Observations, Export. Le profil de mission et la catégorie du dossier sont deux champs distincts.
- `frontend/src/reportProfiles.js` propose Analyse globale, Architecte et Maître d’œuvre ; les défauts CONNECT peuvent préremplir une mission. Certaines conditions de contexte reposent aussi sur le profil : isoler le parcours technique sans lui appliquer par erreur l’écoute et les projections de l’analyse globale.
- `frontend/src/observationOrder.js` conserve l’ordre des observations techniques ; le classement Terrain puis Eau/Air/Terre/Feu et la numérotation T1 sont propres au parcours global.
- Photos, retouche, plans/repères, dictée en texte, sauvegarde complète, restitutions et publication Passeport sont des fonctions existantes à réutiliser, avec leurs droits et réserves actuels. La photothèque d’originaux privés ne doit pas être présentée comme activée par V2.

## Orientation proposée

**Une application, deux parcours de mission, un socle de données et de restitution commun.** Le mode du dossier pilote la présentation. Le profil professionnel adapte le contenu lorsque pertinent ; le rôle d’accès autorise les actions. Ces trois notions ne doivent pas être confondues.

À la création, un compte habilité choisit Rapport Technique ou Analyse globale. Un dossier existant retrouve son propre type, même si le défaut CONNECT a changé. Pas de conversion implicite entre parcours, ni de réécriture des catégories historiques pour un simple changement de libellé. Une éventuelle conversion volontaire fera l’objet d’un cadrage séparé.

## Trois écrans — proposition initiale conservée

### Mission

Afficher client, bien/adresse, référence, date, objet et périmètre de visite. Réutiliser les coordonnées professionnelles disponibles avec possibilité de vérification. Les informations complémentaires du site et la préparation/protocole restent dans une section repliable. Aucun questionnaire d’écoute client complet imposé à ce parcours.

### Constats

Présenter une liste compacte : numéro, titre/localisation, aperçu photo et signalement d’un champ indispensable manquant. Un seul constat est ouvert à la fois ; l’ajout ouvre immédiatement le nouvel élément. Sur écran étroit, le choix puis le détail se suivent sans colonne latérale obligatoire.

Saisie courante : localisation, constat factuel, photos/légendes, Conseils de l’expert. Conserver la séparation entre fait, explication et conseil ; les champs d’analyse restent accessibles sans alourdir chaque fiche.

**Détails techniques**, repliés par défaut : explications/hypothèses, mesures et unités, vérifications nécessaires, références/liens, limites de l’observation. **Plans et repères**, facultatifs : bibliothèque existante et rattachements sans obligation de plan. Réutiliser les outils photo et dictée existants.

Numérotation selon l’ordre choisi par l’expert, déplacement explicite et commandes clavier équivalentes ; pas de phases Eau/Air/Terre/Feu imposées. Préserver les identifiants des constats et tous leurs liens après déplacement. Le numéro affiché ne devient pas un identifiant.

### Rapport

Présenter synthèse/conclusion, limites/périmètre, signature, sélection des contenus destinés au client, puis aperçu et génération Word. L’aperçu doit toujours se fermer au bouton et au clavier. La synthèse n’est pas générée comme un diagnostic certain à partir d’un champ vide.

Restitution proposée : mission et périmètre → constats illustrés/localisés → explications et conseils lorsqu’ils sont renseignés → synthèse et vérifications complémentaires → limites, signature et annexes. Le Word expert conserve les détails internes ; le Word client respecte la sélection et la confidentialité existantes.

Réutiliser sauvegarde en ligne, copie complète de récupération et publication finalisée dans Passeport selon les droits et préconditions actuels. Le PDF reste issu du parcours existant Word → PDF ; le PDF direct garde son lot distinct.

## Répartition de l’interface

| Fonction | Rapport Technique proposé | Analyse globale existante à préserver |
| --- | --- | --- |
| Mission/client/bien | Formulaire court | Contexte et écoute détaillés |
| Constat, explication, conseil | Un constat ouvert, détails à la demande | Organisation actuelle et détails accessibles |
| Photos, retouche, plans et repères | Facultatifs, mêmes outils | Conservés |
| Classement | Ordre choisi par l’expert | Terrain puis Eau/Air/Terre/Feu |
| Attentes et matrice | Absentes du parcours courant | Conservées |
| Interventions, modalités, projections | Non imposées ; extensions séparées | Conservées selon le profil |
| Projet / planning par périodes | Hors première tranche technique | Parcours existant conservé |
| Sauvegarde, confidentialité, restitution | Socle commun | Socle commun |

La simplicité porte sur l’interface et les éléments demandés à la saisie, sans suppression des données techniques déjà enregistrées. Le repli d’un champ ne modifie jamais la sélection client ni son export.

## Première tranche — proposition initiale conservée

1. Choix du parcours uniquement pour les comptes habilités, maintien des anciens dossiers et définition explicite du droit côté serveur si nécessaire.
2. Navigation Mission → Constats → Rapport et un seul constat ouvert, détails facultatifs, ordre explicite.
3. Réutilisation contrôlée des médias/plans, sauvegardes et restitutions expert/client ; recette de continuité avant extension.

Les sous-types initiaux, les champs strictement bloquants et l’ordre exact du rapport Word sont **TBD — à valider sur un exemple de mission technique**. Proposition : ne pas imposer de sous-type à la création ; conserver la valeur des dossiers anciens. Aucun nouveau moteur de calcul, diagnostic automatique, enregistrement audio, import PDF multipage ou synchronisation Projet ajouté à cette tranche.

## Critères de recette proposés

| ID | Résultat observable |
| --- | --- |
| RT-01 | Un compte habilité peut choisir Technique ; un compte non habilité ne peut pas obtenir ce droit en changeant son profil ou en falsifiant une demande. Consultation des anciens dossiers selon les règles conservées. |
| RT-02 | Créer une mission fictive et trois constats sans saisir d’attentes, de phase Eau/Air/Terre/Feu ou de projections. Un seul détail ouvert par défaut, nouvel élément ouvert. |
| RT-03 | Ajouter photos et légendes, utiliser une version préparée et un plan facultatif ; retrouver originaux, annotations, repères et sélection après réouverture. |
| RT-04 | Réordonner les trois constats avec souris et clavier ; numéros cohérents dans l’écran, les repères et les deux Word, identifiants/liens conservés. |
| RT-05 | Sauvegarder, fermer la session, se reconnecter et rouvrir depuis le serveur sans brouillon local ; comparer textes, médias et propriétaire. |
| RT-06 | Générer les Word expert/client, vérifier contenu, pagination et confidentialité ; aperçu refermable et récupération complète disponible en cas d’échec. |
| RT-07 | Réouvrir un ancien dossier technique et un dossier Analyse globale complet ; valeurs, champs masqués, attentes, interventions, plans, signature et propriétaire conservés. Changer le défaut CONNECT sans modifier ces dossiers. |
| RT-08 | Utiliser la saisie principale à 320 px et au clavier ; actions essentielles visibles, libellés lisibles et aucune section technique inaccessible. |

La présence d’une proposition de critère ne constitue pas sa réussite. Les contrôles hébergés, droits et rendu Word restent à exécuter sur le candidat applicatif futur.

## Quatre phases — état du cadrage initial

| Phase | État au 24 novembre | Prochaine condition |
| --- | --- | --- |
| Cadrage | Proposition et aperçu préparés ; audience confirmée | Valider parcours, champs minimaux et exemple métier |
| Développement local | Non engagé pour le code V2 | Implémenter une tranche sur branche dédiée après accord de passage |
| Préproduction | Non engagée pour V2 | Candidat qualifié, cible et livraison autorisées ; recette fictive et nouvelle session |
| Mise en production | Non engagée | Validation du candidat et accord de livraison distinct |

## Sources et suivi

Référence humaine du présent cadrage : ce document. Suivi d’exécution canonique : bloc `rapportV2Technique20261124` dans [suivi-chantier.json](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>). Les choix de maquette ne sont pas une seconde source de droits ou de règles métier.

Sources complémentaires : [lot initial observations et masquage technique](lot-0-observations.md), [profils professionnels](profils-professionnels.md), [organisation des écrans](organisation-ecrans.md), [plans et repères](reperage-observations.md), [publication Passeport](publication-passeport-immo.md).

## Vérification du cadrage initial

Le 24 novembre, l’aperçu fictif est contrôlé localement : sélection, édition, ajout et déplacement de constats, changement d’écran avec conservation en mémoire, détails repliables, aperçu et fermeture par bouton/Échap. Largeurs 320, 390, 736 et 1024 px sans débordement horizontal ; rendus clair et sombre relus. Les emplacements de photos sont illustratifs, aucun fichier Word n’est généré ni dossier enregistré par cet aperçu.

[Reçu des interactions](<C:/Users/examg/.codex/visualizations/2026/11/12/01a1d107-7531-7e80-96c7-acdb55274ecb/rapport-technique-verification.json>). Le socle documentaire racine et application est présent. README, exigences, roadmap, décisions et changelog ne déclarent V2 que comme préparation. Aucune architecture, migration, configuration, API ou source applicative modifiée. Les droits, recettes serveur et restitutions du futur candidat V2 restent à qualifier.
