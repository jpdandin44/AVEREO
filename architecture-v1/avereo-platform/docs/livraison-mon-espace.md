---
project: avereo-platform
document_type: delivery-report
title: Livraison de Mon espace en préproduction
status: active
version: git
created: 2026-11-06
updated: 2026-11-06
owner: jpdandin
tags: [avereo, preproduction, livraison, fonctions-communes]
---

# Livraison et recette du 6 novembre 2026

Le [suivi canonique](../data/suivi-fonctions-communes.json) reste la source de l’état du lot.
Phases : **Cadrage → Développement local → Préproduction → Mise en production**.
Phase actuelle : **Préproduction**, livrée avec deux réserves décrites ci-dessous.

## Version installée

La [PR #121](https://github.com/jpdandin44/AVEREO/pull/121), ses quatre validations humaines
et ses cinq contrôles GitHub ont été relus avant l’installation. La fusion
`b12e9bcb6bc529d48565466776f0a5be95791398` conserve exactement l’arbre accepté
`381996a6e061acb7a53571aab2520eb7f1c9a287`.
L’[accord explicite du responsable](../data/livraison-mon-espace-pr121/autorisation.json)
porte le paquet préparé depuis `317863a9e5603fbbed578a5aa9cfc323cb17b977`.

Le [reçu de livraison](../data/livraison-mon-espace-pr121/delivery.json) atteste
**40 fichiers installés sur sept cibles, à 21 h 56 heure de Paris**. RGA est inclus
dans la cible Rapport et garde ses rubriques et réglages distincts. Aucun déploiement
de production ni ouverture publique. Recherche et Saisie unique restent hors de ces
sept cibles, conformément à la [préparation](preparation-mon-espace.md).

## Résultats dans le navigateur authentifié

Cette table restitue la [recette structurée](../data/livraison-mon-espace-pr121/recette-navigateur.json).
Les liens communs vont vers le compte et le catalogue CONNECT de préproduction.
L’ouverture effective de « Mon compte » depuis Thermo affiche « Mon profil ».
Les sept lancements depuis le catalogue fonctionnent.

| Cible | Mes projets | Préférences |
| --- | --- | --- |
| CONNECT | Absence voulue : portail | Ordre du catalogue et visibilité des applications ; rechargement vérifié |
| Projet | Liste native en ligne : deux projets consultés sans modification | Formulaire natif du compte consulté ; aucun enregistrement sur le compte réel |
| Rapport + RGA | Rapport : brouillon existant et liste de neuf rapports préservés. RGA : ouverture directe correcte, lien depuis la page contenant la carte en réserve | Format du nouveau rapport ; tri des départements et intensité RGA. Rechargement et indépendance Rapport/RGA vérifiés |
| Coupe | Liste native en ligne bloquée par sa configuration OAuth existante | Grille et aimantation : enregistrement et rechargement vérifiés |
| Thermo | Rapport fictif enregistré puis retrouvé après rechargement | Tri et noms d’étapes : enregistrement et rechargement vérifiés |
| Drone | Mission fictive enregistrée puis retrouvée après rechargement | Tri et visibilité des archives : enregistrement et rechargement vérifiés |
| Passeport Immo | Liste native « Mes Biens » : deux biens consultés sans modification | Tri et composition des biens : enregistrement et rechargement vérifiés |

Les sept jeux de préférences testés en écriture sont revenus à leurs valeurs initiales.
Les préférences Projet, liées au compte réel, ont été consultées seulement : leur
persistance n’est pas attestée par cette recette. Les deux données fictives créées
portent `RECETTE-PR121-DEPLOIEMENT`, uniquement dans le navigateur Thermo et Drone.
Thermo, Drone et RGA conservent leur stockage local ; ce lot ne prouve pas de
synchronisation entre navigateurs. Aucune déconnexion de la session du responsable
n’a été soumise.

## Réserves et correction préparée

**RGA.** Le lien `carte.php#projects` fonctionne lors d’un chargement direct, mais
pas après le chargement de la carte intégrée : seul le fragment initial était traité.
Le correctif ajoute l’écoute de `hashchange`, garde les autres paramètres de carte
et permet de rouvrir la liste après fermeture. Un test reproduit l’échec avant
correction ; les 22 tests du menu réussissent ensuite, compilation Rapport réussie
et ouverture/réouverture confirmées dans le navigateur local sur
[l’aperçu RGA](http://127.0.0.1:53121/rga/).
La [PR corrective #122](https://github.com/jpdandin44/AVEREO/pull/122) et son
[candidat exact](../data/livraison-mon-espace-pr121/correction-rga.json)
ne concernent qu’un fichier `rga/workspace.js` ; **il n’est pas installé en préproduction**.
Sa revue et son accord de livraison restent distincts de l’accord obtenu pour PR #121.

**Coupe.** « Mes projets » appelle l’ancien service en ligne, qui répond « OAuth
Drupal n’est pas encore configuré côté serveur » puis « Connexion AVEREO requise ».
Ce comportement et le code qui le produit existaient dans la copie précédant la
livraison. `api/bootstrap.php` et `api/projects.php` sont conservés hors du paquet
du menu. L’alignement de l’identité de cette API reste à cadrer séparément ; aucune
configuration, authentification ni donnée réelle n’a été changée pour contourner ce point.

## Conservation et récupération

Le [précontrôle frais](../data/livraison-mon-espace-pr121/preflight.json), le
[passage de phase](../data/livraison-mon-espace-pr121/gate-preproduction.json) et le
[contrôle final de 22 h 10](../data/livraison-mon-espace-pr121/verification-finale.json)
confirment l’installation exacte, les fichiers non sélectionnés, les protections,
les sept configurations privées, le backend CONNECT PR #118 et les treize fichiers
de planning Projet conservés à l’octet près. Aucune connexion aux bases de données
n’a été utilisée par l’outil de livraison.

Les [contrôles HTTPS anonymes](../data/livraison-mon-espace-pr121/https-anonyme.json)
retrouvent la connexion CONNECT, les redirections des six autres cibles, le refus
RGA (403) et celui de l’API planning Projet (401, sans cache).

L’outil `outillage/acces-preproduction/deploy_shared_menu.py` fixe le paquet et les
sept racines autorisées, refuse toute divergence avant écriture, publie les ressources
avant les points d’entrée et restaure ses propres écritures en cas d’échec. Un fichier
modifié simultanément n’est jamais écrasé pendant le retour arrière. Six essais de
déploiement et dix de préparation réussissent sur Windows puis sur le serveur Linux,
exclusivement sur des fixtures pour les injections d’échec.

Récupération privée :
`/home/daje3540/private/mon-espace-preprod-317863a-20261106/deployment/recovery`.
Les sauvegardes, répétitions de restauration et le plan privé restent hors des sites.
Un retour arrière réel exige une comparaison des empreintes courantes et la conservation
des éventuelles écritures ultérieures ; ne pas restaurer aveuglément un répertoire complet.

Copies locales des reçus, captures et correctif :
`C:/Users/examg/Documents local/livraisons-avereo/mon-espace/preparation-pr121-317863a`.
La présence d’un reçu de livraison ne vaut pas levée des deux réserves ni validation
métier humaine de tous les parcours.
