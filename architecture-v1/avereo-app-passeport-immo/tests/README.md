---
project: avereo-app-passeport-immo
document_type: test-guide
title: Vérification de la reprise
status: active
version: git
created: 2026-10-03
updated: 2026-10-16
owner: jpdandin
tags: [passeport-immo, local]
---

# Vérification de la reprise

## Recette réelle après activation privée

La [vérification du 16 octobre](../api/production-verification-observation.json)
consigne 57 assertions HTTPS réussies, deux sessions signées indépendantes et les
neuf téléchargements exacts par session. Les lignes métier restent inchangées.
Le premier vrai cron vérifie quatre tables/neuf fichiers puis sa tâche temporaire
est retirée. La connexion OAuth navigateur reste bloquée par un 503 du fournisseur.
Une proposition de correction passe 27 contrôles en mémoire sur les vraies classes
Drupal/Symfony ; elle n’est pas installée et ne prouve pas le parcours OAuth complet.

## Qualification hébergée de production du 16 octobre

Le [reçu courant](../api/production-execution-observation.json) distingue les tests
locaux des opérations réellement exécutées : import SCI et rejeu exact, récupération
de quatre tables et neuf fichiers, archives et candidat installé fermé, répétition
du delta CONNECT et de l’activation avec retour arrière isolé. Les méthodes réelles
de stockage refusent les neuf documents SCI au compte famille. Le dépôt réel CONNECT
autorise seulement le compte sélectionné parmi les comptes actuels lors de la
répétition temporaire. Aucune de ces preuves ne remplace la recette OAuth/navigateur
ou un vrai déclenchement cron de production. Voir la
[procédure d’activation](../workflows/activation-production.md).

## Reprise ciblée d'un bien

`python tests/check-transfer-property.py` exécute 35 assertions sur deux bases
MariaDB 11.4 isolées, avec des identités et documents fictifs. Il couvre export
limité au bien/client/actifs/archives, intégrité, propriétaires/base erronés,
simulation sans écriture, conflits, retour transactionnel sans fichiers résiduels,
conservation des tarifs/autres biens et rejeu sans doublon ni écrasement.
Le CLI reste hors du candidat public. Ce contrôle est aussi appelé à la fin de
`tests/check-storage-http.py`, dans la CI existante ; il ne démontre pas une reprise
sur la cible réelle. Voir [la procédure](../workflows/reprise-bien.md) et
[le reçu local](../api/property-transfer-observation.json).

## Sauvegardes automatiques

`tests/scheduled-backup.php` couvre 22 cas sur la base MariaDB fictive,
appelés par `tests/check-storage-http.py` : conservation, rotation, répétition,
verrouillage, échec, reprise, garde-fous de chemins et coexistence des environnements
préproduction/production avec conservation des autres tâches. Les sources actives sont
contrôlées après les tests ; aucun document réel n’est utilisé dans la CI.

## Persistance serveur

`python tests/check-storage-http.py` utilise deux conteneurs temporaires sur un
réseau dédié, Apache/PHP et MariaDB 11.4. Le test inclut la sauvegarde et le retour
des lignes dans des tables temporaires. Les 29 tests frontend couvrent aussi
la file d’écriture, le refus de conflit et l’import après sauvegarde du bien.
La CI exécute ces contrôles ; les identités et documents y sont fictifs.

## Qualification du raccordement CONNECT

La qualification de production après PR nº81 réutilise une copie isolée de la base
`7216fb1b1439d71a68bb948f16db0f57793c1fd8`, dont deux fichiers correspondent exactement
à l'hébergement. Le delta de trois lignes passe les 36 tests de ce backend et les
15 assertions du sas. Les preuves sont dans
[le reçu de qualification](../api/qualification-production-observation.json).

Le correctif du 15 octobre est couvert par `python tests/check-connect-http.py`
après le build. L'image `docker/connect-test.Dockerfile` doit être disponible sous
`avereo-passeport-connect-test:local` ; Docker et PHP CLI sont nécessaires.
Les 67 assertions incluent les assets sans session (refus), leurs octets/MIME et
HEAD avec session, cookie altéré, chemins/fichiers interdits et méthodes, puis
la fermeture initiale et la fermeture sans module de réécriture. Aucun compte,
secret ou dossier réel n'est utilisé. Un conteneur isolé est créé puis arrêté.
La configuration de test hérite d'une page d'erreur 403 qui repasse par la SPA,
comme sur la cible o2switch ; la politique applicative doit imposer le refus 403
standard même dans ce contexte.

`python -m unittest discover -s tests -p 'test_*.py'` exécute actuellement 19 tests.
Les quatre cas du delta compatible vérifient l'ajout limité au lancement et le
refus d'une observation périmée, d'un contexte différent ou d'un runtime déjà intégré.
Le 15 octobre, le runtime historique des deux fichiers observés a aussi été repris
dans une copie isolée depuis Git, complété par le ZIP compatible, puis contrôlé :
syntaxe PHP, 32 tests backend et 15 assertions du sas réussis. Cette qualification
locale ne prouve pas la recette sur l'hébergement. Les sections datées ci-dessous
conservent les résultats des lots précédents.

## Commandes
Depuis `frontend/`, `npm.cmd test` exécute 26 tests :
- T01 : deux biens × trois gammes, calcul manuel commenté ; totaux PDF.
- T02/T03 : m², unité, forfait, unités non prises en charge, tarif absent, pièce vide.
- T04 : import CSV fictif via l'écran Admin et PapaParse, puis sauvegarde locale.
- T05 : quatre exports depuis l'écran : arrondi blanc, pixel final de contenu, deux
  et trois pages ; dimensions canvas et jsPDF simulés, téléchargement appelé.
- T06 : dix tests de stockage : association client, isolation, doublons/concurrence, limites, lots invalides, persistance et archives.
- T07 : deux parcours documentaires : client préalable, import, filtre/recherche, consultation et libération des URL temporaires.

Depuis le sous-projet, `node tests/check-parity.mjs` isole les écarts d et e autorisés puis inverse les transformations a/b/c
et compare la copie à la source historique, corps des calculs et classes compris.
Le test nécessite le monorepo ; les tests Vitest lisent les fixtures intégrées à la copie.
`npm.cmd run build` construit les assets. La configuration Docker est vérifiable avec
`docker compose -f compose.local.yaml config --quiet` ; image non construite à cette date.

## Preuves et limites
Résultats du 2026-10-03 et recette humaine R01…R13 dans
[le livrable](../docs/01-reprise-identique.md). Les captures locales sont hors Git.
Les cases de résultat humain restent à remplir par le responsable ; un test réussi
ne constitue ni validation de phase ni autorisation de publication.

T05 a reproduit le défaut avant correction (un échec, trois réussites), puis les
quatre cas ont réussi. Le PDF court réel a aussi été téléchargé et rendu :
une page A4 complète. Les scénarios longs sont vérifiés automatiquement avec
canvas/jsPDF simulés ; leur recette humaine reste ouverte.

## Préparation de la préproduction

Depuis le sous-projet, `python -m unittest discover -s tests -p test_preproduction.py`
vérifie huit cas fictifs : archive reproductible et candidat conservé, source différente,
asset modifié, chemin hors du lot, fichier non déclaré, lien symbolique, sas complet
initialement fermé et refus d'un sas partiel ou d'une configuration privée. Le cas nominal
répète une restauration locale ; aucune cible ni sauvegarde distante n'est authentifiée.

## Raccordement du cockpit

Depuis le sous-projet, `node tests/check-cockpit.mjs` applique le normaliseur du
moteur Projet au suivi réel. Il vérifie la carte de la PR nº72 en phase 0, son état
observé, la disponibilité initiale de la fiche d'itération et la distinction entre
étape réelle et phase formelle. Ce contrôle est exécuté dans la CI Passeport Immo.

Le contrat vérifie aussi les quatre phases, la conservation des décisions originales
dans `legacyTracking` et les empreintes des documents approuvés.

## Documents approuvés et packaging

`python -m unittest discover -s tests -p 'test_*.py'` exécute dix-neuf tests : huit
cas de préparation, quatre protections des vues approuvées, trois contrôles du
packaging et quatre contrôles du delta compatible. Le packaging couvre notamment
l’ordre reproductible des assets avec noms mêlant majuscules/minuscules. Ce cas
couvre la différence Windows/Linux qui peut changer les octets du ZIP sans changer
le contenu des assets. Les noms relatifs sont triés comme chaînes identiques sur
les deux systèmes.

`node workflows/generer-progression-examin.mjs --check` vérifie la projection
Markdown du JSON de progression. `python docs/actualiser-tableau-de-bord.py --check`
contrôle les vues courantes et conserve les preuves historiques approuvées.
