---
project: avereo-app-rapport
document_type: functional-specification
title: Profils de mission et défaut professionnel CONNECT
status: active
version: git
created: 2026-11-16
updated: 2026-11-18
owner: jpdandin
tags: [rapport, connect, profils, architecte, maitre-oeuvre]
---

# Profils de mission et défaut professionnel CONNECT

## Cadrage

### Libellé de prestation — 17 novembre

Après la fusion de PR167, le responsable demande de poursuivre le lot préparé
RAP-LIBELLES-ANALYSE-GLOBALE-20261117. Le [cadrage source et ses six critères LIB](<C:/Users/examg/Documents local/Habitologue/Opportunité_Connect/docs/rapport-v1-2/cadrage-retours-philippe.md#lot-libelles-analyse-globale>)
restent l’autorité du besoin. Le [suivi canonique](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>)
porte le candidat et les preuves, bloc libellesAnalyseGlobale20261117.

Le parcours enregistré avec profil_metier=habitologue affiche **Analyse globale**
dans l’option et le résumé de Dossier. Les titres de couverture déjà présents
deviennent « Analyse globale — Rapport expert détaillé » et
« Analyse globale — Votre habitat, l’essentiel ». Aucun nouveau chapitre n’est
créé ; le titre saisi dans le dossier reste affiché tel quel.

Le défaut personnel CONNECT et son message continuent de nommer le métier
Habitologue. Architecte, Maître d’œuvre, profils absents/inconnus, habilitations,
catégories historiques et contenus libres sont conservés. Avant validation de
PR168, le responsable demande aussi de corriger le libellé des conseils et
autorise une proposition alternative à Conseils Expert Global. Le choix annoncé
est **Conseils de l’expert** : même intitulé dans les observations et les deux
restitutions, ainsi que Conseils de l’expert pour le contexte extérieur dans sa
saisie. Le champ actions des observations et le champ conseils du contexte
gardent leurs valeurs. L’ordre Constat → Explications → Conseils est conservé,
ainsi que les règles d’affichage/filtrage des différents profils. Ce complément
remplace la réserve initiale sur cet intitulé, sans renommer le métier personnel
CONNECT. Aucun remplacement global ni migration.

**Développement local** sur une copie distincte, base fusion PR167 12095d5.
245 tests Node réussis après le complément des conseils ; 48 contrôles
HTTP/PHP/MariaDB du socle serveur inchangé conservés. Comparaison de douze
restitutions : seuls les intitulés de prestation et de conseils attendus varient ;
autres textes/règles, champs et quatre messages de métier CONNECT exacts. Sauvegarde/réouverture en
nouvelle session sans brouillon : champs métier, clé habitologue, neuf plans,
quinze repères et propriétaire conservés. Deux Word réels : titres, contenus,
médias et filtrage client contrôlés ; régénération des deux Word après le
complément avec seuls les intitulés des conseils modifiés, autres paragraphes et
images strictement identiques. Fichier Projet exact et décodable par son
moteur natif. Portée du rendu Word natif dans le suivi du candidat, distincte des
contrôles de contenu. Aucune connexion Drupal hébergée déduite du banc local.
**Préproduction** et **Mise en production** non engagées ; report des profils
conservé. Les paragraphes datés du 16 novembre ci-dessous sont historiques
pour les libellés de mission, et restent valides pour les règles et professions.

Après les tests, la fusion et la livraison de PR163, le responsable demande de
passer au lot suivant. Il confirme explicitement « Intégrer aussi le profil de
connexion CONNECT dès ce lot » ; la proposition initiale de traiter CONNECT
séparément n’est donc pas retenue. Copie dédiée
`C:/Users/examg/Documents local/avereo-rapport-profils`, branche
`feat/rapport-profils-professionnels`, base fusion PR163 9f8645b.

Un profil professionnel **déclaré** est un défaut personnel du compte CONNECT.
Il n’atteste aucune qualification et n’accorde aucun rôle, accès ou droit
supplémentaire. Il n’est pas déduit d’un rôle d’organisation. Chaque dossier
conserve ensuite son propre profil de mission ; aucun changement du compte ne
réécrit les missions déjà créées, importées, reprises ou ouvertes depuis le serveur.

| Profil de la mission | Étape 4 | Étape 5 | Étape 6 |
| --- | --- | --- | --- |
| Parcours actuel, profil absent ou non reconnu | Projection 1 : organiser les actions | Projection 2 : préparer deux options comparables | Comparer les conséquences et préparer l’arbitrage |
| Analyse globale (clé habitologue) | Projections masquées ; interventions existantes conservées | Projections masquées | Projections masquées |
| Architecte | Organiser les actions du projet | Préparer deux variantes du projet | Comparer les variantes et préparer l’arbitrage |
| Maître d’œuvre | Organiser les interventions et leur phasage | Préparer deux options de réalisation | Comparer les conditions de réalisation et préparer l’arbitrage |

Les champs et critères existants restent disponibles. Le phasage est décrit par
l’ordre des actions, leurs horizons et préalables existants ; aucun nouveau
ordonnanceur, délai, budget ou accord client n’est déduit. Les modalités de
réalisation déjà enregistrées sont accessibles dans l’étape 4 et l’expert.
Terrain, contexte extérieur, photos/plans et conseils client sont conservés dans
les trois parcours professionnels reconnus de Visite Globale. « Conseils
habitologue » garde le libellé demandé. Les profils absents ou encore inconnus
conservent le parcours historique ; les codes Architecte/Maître d’œuvre sont
désormais reconnus explicitement. Aucune donnée n’est effacée lors d’une bascule.

## Développement local

### CONNECT et données

Dans **Mon compte → Mon profil**, choisir Habitologue, Architecte, Maître d’œuvre
ou « À choisir dans chaque dossier ». Enregistrer confirme le stockage sur le
compte ; Annuler rétablit la dernière valeur lue. Une indisponibilité laisse
l’édition désactivée et propose de rouvrir le profil, sans faux succès.

Le [contrat de préférences CONNECT](../../avereo-app-connect/backend/api/openapi.yaml)
réutilise `GET/PUT /api/v1/me/preferences`. Le GET privé retourne
`professionalProfile`, `accountId` généré côté serveur et le contexte existant.
Le PUT modifie exactement une préférence à la fois, avec session active,
CSRF et contexte du même compte ; aucun identifiant cible, rôle ou champ inconnu
n’est accepté. Lecture interorigine limitée à l’origine exacte d’une application
configurée et actuellement autorisée ; PUT interorigine toujours refusé.

Le médaillon reste dans `account-preferences/<id>.json`, au format antérieur.
Le profil est dans `<id>.professional-profile.json`, privé, borné et écrit par
renommage atomique sous le même verrou du compte. Les fichiers restent 0600 et le
répertoire 0700. Aucun GET ne crée de fichier. Les anciens clients et l’ancienne
version du lecteur de médaillon restent compatibles : la préférence compagnon
peut rester en place lors d’un retour arrière. Aucune migration SQL, configuration
privée ou modification de compte/organisation/habilitation.

### Préremplissage dans Rapport

Rapport utilise le portail public validé par le composant commun Mon compte,
sans copie de sa validation d’URL ni nouveau composant partagé. Lecture fraîche
à l’ouverture et au retour de focus, sans cache d’identité persistant. Le compte
retourné doit correspondre exactement à la session Rapport `avereo_connect`.
Seuls les codes reconnus sont repris ; indisponibilité, ancien backend, compte
différent ou délai supérieur à 2,5 secondes laissent un choix manuel avec un
message. La lecture ne modifie jamais le dossier courant. « Nouveau rapport »
attend la fin de cette lecture ; import, reprise et ouverture serveur restent
accessibles. Le défaut est copié seulement à la création, puis le choix Dossier
reste modifiable. Ni l’identifiant du compte ni son contexte ne sont ajoutés au
JSON métier.

Le champ existant `profil_metier` conserve les codes `habitologue`, `architecte`
et `maitre_oeuvre`. Les mêmes actions/options/critères/arbitrages et leurs IDs sont
utilisés dans les écrans et les deux restitutions. La copie fictive conserve les
profils reconnus, sans copier une valeur libre inconnue. La bascule entre profils
conserve notes, liens, modalités, estimations, médias et propriétaire.
Le planning/fichier Projet de PR163 reste proposé dans Habitologue ; son extension
aux autres métiers n’est pas réalisée par ce lot. Revenir à Habitologue retrouve
ses estimations et le même planning. Les moteurs Word gardent leurs fonctions ;
pas de nouveau moteur PDF ou de synchronisation Projet.

### Qualification et revue

234 tests Node Rapport, 44 contrôles natifs CONNECT, 47 contrôles PHP décision,
13 plans et téléchargement complet réussis. La recette HTTP/MariaDB Rapport
réalise 48 contrôles sur comptes fictifs et conserve les lignes/propriétaires ;
la recette HTTP CONNECT de gestion des comptes reste réussie. Les contrôles HTTP
des préférences vérifient persistance, conservation mutuelle médaillon/profil,
refus du contexte périmé, d’une origine étrangère et d’un compte cible imposé.

Navigateur sur bancs fictifs : défaut Architecte enregistré dans CONNECT,
nouvelle mission préremplie, puis défaut Maître d’œuvre enregistré. Le dossier
Architecte sauvegardé conserve son profil après déconnexion normale, nouvel
onglet/session signée, retrait du seul brouillon de cette origine fictive et
réouverture depuis la liste serveur. JSON entier identique, trois dossiers/toutes
colonnes/propriétaires exacts. La nouvelle mission suivante reprend Maître
d’œuvre. Bascule Architecte → Maître d’œuvre → Habitologue → Architecte : données métier
retrouvées ; contexte, conseils et modalités restent présents. La reprise après
rechargement actualise normalement le seul horodatage du brouillon. Annulation
et rechargement CONNECT vérifiés. Aucune erreur console observée.

Quatre Word expert/client réellement générés dans l’interface : seules les quatre
rubriques attendues diffèrent entre métiers ; autres textes et liens exacts,
neuf médias expert et huit client identiques, contexte et modalités conservés. La pagination native Word/PDF,
un appareil physique et le vrai SSO Drupal interapplications ne sont pas qualifiés
par ces bancs. Les identités signées et le pont de préférences sont synthétiques ;
le stockage/contrôles PHP et les fichiers des deux applications sont réels.

- [CONNECT fictif — Mon profil](http://127.0.0.1:5201/#account-profile).
- [Rapport fictif](http://127.0.0.1:5199/fixture/) → Compte professionnel fictif →
  ouvrir le premier RECETTE-PROFILS-20261116 depuis la liste serveur → Dossier/Export.
- Compte A/B : non-correspondance avec le compte CONNECT de la fixture ; le défaut
  n’est pas repris. Les sauvegardes et leurs propriétaires restent distincts.
- [Preuves](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-profils-connect-20261116/>).

Services temporaires du poste à maintenir actifs. Le portail fictif est lancé
par `backend/tests/account-ui-router.php` sous les deux drapeaux locaux existants.
Rapport utilise `tests/report-files-http.py --serve --port 5199 --fixture
.local/profils-recette.json --connect-profile-db CHEMIN_SQLITE_FICTIF`. Cette option
exige un répertoire temporaire `profils-connect-*` ; aucune route de test n’est
ajoutée aux sources publiques produit. L’état privé et les points de relance
sont dans `.local/profils-fixture-state.json`, hors Git. Dépendances verrouillées
inchangées, réutilisées depuis la copie qualifiée ; aucun package supplémentaire.
Deux compilations réussies, 150 fichiers vérifiés. Le nettoyage Windows de
`dist/rga` a rencontré un verrou transitoire ; compilation en ligne répétée sans
nettoyage préalable avec le même moteur Vite, puis le script RGA inchangé et
contrôle exact des fichiers. Aucun script produit de compilation modifié.

## Préproduction

Non engagée pour ce nouveau lot. PR163 reste livrée et alignée avec son même
artefact. La future livraison doit coordonner CONNECT puis Rapport, avec sauvegarde
fraîche de leurs fichiers/configurations et des préférences privées avant écriture,
retour arrière testé et recette du vrai accès CONNECT. Le backend antérieur reste
lisible grâce au fichier compagnon ; le nouveau Rapport garde un choix manuel si
le backend CONNECT n’a pas encore été livré. Les preuves locales ne valent pas
recette hébergée. Merge et déploiement de ce candidat restent à autoriser.

## Mise en production

Non engagée et non autorisée. Les autres lots (identité des organisations,
originaux privés/dossiers lourds, PDF direct, continuité/propriété) gardent leur
périmètre distinct. Suivi canonique :
`rapportV12CadrageProfils20261112.profilsProfessionnels20261116` dans
[le cockpit](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>).

## 18 novembre — Extension du libellé à CONNECT

Le responsable confirme **Analyse globale** aussi dans les choix de CONNECT. Ce complément à PR170 remplace les libellés fixes du défaut personnel et du parcours de référence, sans changer la clé habitologue ni les noms libres des types, les droits ou les dossiers. [Périmètre CONNECT et qualification](../../avereo-app-connect/docs/profils-et-droits.md#libellé-analyse-globale--18-novembre). Le périmètre historique du 17 novembre reste daté ; cette extension est locale, non livrée.
