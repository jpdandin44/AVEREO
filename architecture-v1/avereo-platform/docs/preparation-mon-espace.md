---
project: avereo-platform
document_type: deployment-preparation
title: Préparation de Mon espace en préproduction
status: active
version: git
created: 2026-11-06
updated: 2026-11-06
owner: jpdandin
tags: [avereo, preproduction, livraison, fonctions-communes]
---

# Préparation de Mon espace

## Candidat actuel — PR #121 étendue

La PR inclut désormais Mes projets et Préférences propres aux applications. Le lot
de 37 fichiers ci-dessous reste une preuve historique de #119 ; il ne contient pas
cette extension. Un nouveau paquet et une nouvelle comparaison sont requis.
La [qualification actualisée](qualification-mon-espace.md) distingue les contrôles
locaux des essais hébergés à refaire. Aucune installation autorisée par cette PR.

## Historique de la préparation #119

Le [suivi canonique](../data/suivi-fonctions-communes.json) porte l'état et les
accords. La PR #119 est fusionnée depuis le 6 novembre à 16 h 23, heure de Paris.
Les quatre cases humaines et les cinq contrôles GitHub sont vérifiés sur son
dernier candidat. Son arbre Git est identique à celui de la fusion
`e08cbde814bb552dd3bdfa0ebec101fc0dcc5d52`, qui inclut la correction CONNECT #118.

Les quatre phases sont **Cadrage → Développement local → Préproduction → Mise en production**.
État de ce candidat historique : **Développement local, livraison de préproduction préparée**.
Aucun fichier applicatif actif n'a été remplacé. La demande de préparation et
la fusion de #119 ne constituent pas un accord d'installation.

## Ancien lot proposé — remplacé par le nouveau candidat

| Application | Cible déclarée et vérifiée | Fichiers à écrire |
| --- | --- | ---: |
| CONNECT | connect-preprod.avereo.fr | 2 |
| Projet | projet-preprod.avereo.fr | 6 |
| Rapport et RGA | rapport-preprod.avereo.fr, RGA sous `/rga` | 8 |
| Coupe | coupe-preprod.avereo.fr | 5 |
| Thermo | thermo-preprod.avereo.fr | 5 |
| Drone | drone-preprod.avereo.fr | 5 |
| Passeport Immo | passeport-immo-preprod.avereo.fr | 6 |

Les racines exactes, les 37 chemins, les empreintes avant/après, les permissions
et les actions inverses sont dans le [manifeste retenu](../data/preparation-mon-espace/selection.json).
Le paquet réduit `payload.zip` a pour SHA-256
`93d4103dd2a1d8284acdd94ca54880f9c95a5bbfda18de415fd38dc70146d716`.
Il contient 19 remplacements et 18 nouveaux fichiers, sans suppression existante.
Il est conservé dans le dossier privé serveur
`/home/daje3540/private/mon-espace-preprod-e08cbde-20261106/selection-menu`.

Les archives complètes de compilation servent uniquement de références : **ne pas
les extraire dans les applications actives**. Les fichiers `.htaccess`, `.user.ini`,
les configurations privées, les comptes, les données, les anciens assets et les
fichiers non sélectionnés restent en place. Le backend CONNECT, notamment
`Application.php` installé par #118, reste hors du lot.

## Écarts hébergés conservés

La comparaison a détecté des écarts antérieurs au menu. Les deux API Coupe
`api/bootstrap.php` et `api/projects.php`, le sas Passeport `connect/gate.php`
et le classement Projet `planning-core.js` sont exclus de la livraison.
Ils restent identiques à leurs versions hébergées ; ce constat ne qualifie pas
leur alignement fonctionnel et doit être repris dans leurs lots respectifs.

Coupe utilise encore la variante d'authentification historique observée dans son
HTML. Le paquet applique seulement les quatre modifications pertinentes de #119
au fichier installé : chargement du composant, déplacement du bouton de compte,
insertion du menu et libellé de déconnexion. L'inversion de ces quatre modifications
retrouve le fichier initial à l'octet, y compris le BOM et les fins de ligne.
Les traitements OAuth, le retour de connexion et les appels API sont conservés.
Ce fichier adapté a une empreinte distincte du build complet ; il est identifié
comme tel dans le manifeste, jamais présenté comme le build brut de #119.

## Vérifications et retour arrière

Les [preuves versionnées](../data/preparation-mon-espace/) distinguent :

- la fusion, l'acceptation humaine de #119 et ses cinq contrôles GitHub ;
- neuf compilations depuis la fusion, dont Rapport avec synchronisation en ligne
  activée, et la présence du composant dans les neuf livrables ;
- 14 tests du composant, cinq tests d'emballage et le contrôle général du dépôt ;
- neuf tests de préparation sur Windows puis sur Linux hébergé ;
- sauvegarde puis remplacement/restauration sur copies privées des sept cibles,
  rejoués sur le paquet final de 37 fichiers à 17 h 23, heure de Paris ;
- sept configurations privées sauvegardées et restaurées sur copies ; treize
  fichiers de planning Projet copiés et vérifiés identiques, sans export de données ;
- syntaxe JavaScript du HTML Coupe adapté, affichage du menu et fermeture avec
  Échap dans un aperçu local sans API ni connexion hébergée.

Les commandes de préparation sont
`outillage/acces-preproduction/prepare_shared_menu.py` puis
`outillage/acces-preproduction/select_shared_menu.py` (`build` local et `verify`
sur copies privées). Elles n'offrent aucune action de déploiement. Le test ciblé
est `python -m unittest discover -s outillage/acces-preproduction -p test_shared_menu_preparation.py`.
Les logs complets et les archives sont conservés localement dans
`C:/Users/examg/Documents local/livraisons-avereo/mon-espace/preparation-e08cbde`.

Avant tout remplacement autorisé, revalider les racines déclarées, les protections,
les configurations et toutes les empreintes « avant ». Un changement concurrent
impose une nouvelle comparaison et une sauvegarde actualisée. Installer uniquement
les chemins du manifeste, assets avant pages d'entrée, par remplacement atomique
avec les permissions prévues. En cas d'échec, remettre les seuls fichiers remplacés
depuis les sauvegardes privées et retirer uniquement les fichiers ajoutés dont
l'empreinte correspond encore au lot. Refuser un retour arrière en conflit ;
ne jamais restaurer un ancien planning ou une base par-dessus le travail récent.

Après installation : contrôler les refus anonymes, la connexion et la déconnexion
par cible, l'ouverture du menu, les liens CONNECT du même environnement, le clavier,
les petits écrans et les actions métier sur comptes/projets fictifs. Recontrôler
les protections et la conservation des fichiers privés. Cette recette reste à faire.

## Recherche et Saisie unique

**Recherche** : le candidat est compilé pour CONNECT préproduction, mais le domaine
`recherche-preprod.avereo.fr` n'est pas déclaré dans cPanel. Avant sa première
installation, il faut créer et protéger sa cible, qualifier sa configuration privée
et son raccordement au catalogue CONNECT. La préparation n'a créé ni domaine,
secret ni habilitation. Aucun paquet n'est installé dans un répertoire supposé.

**Saisie unique** : le menu est intégré au fichier HTML autonome compilé. Les
dossiers et préférences restent locaux. Le fichier préparé est
`candidats/saisie-unique.html` dans le dossier de livraison, empreinte dans les
preuves locales. Il n'existe pas de cible serveur qualifiée pour cette application ;
un hébergement et un compte en ligne demanderaient un périmètre distinct.

## Limites et prochaine action

Les contrôles sur copies prouvent la récupération des fichiers, pas le parcours
utilisateur hébergé après installation. Le paquet Coupe adapté et le lot réduit
doivent être inclus dans l'accord exact de livraison. Le contrôle de passage
conserve les accords manquants sans les créer. Les recettes de production et
l'ouverture publique restent hors de cette préparation.

La version initiale de la [PR de préparation #121](https://github.com/jpdandin44/AVEREO/pull/121)
porte les outils et ces preuves. Ses contrôles techniques réussissent sur le
commit d’outillage `3da75f785be3e2dd414009f832861be9e8d92022`. Le contrôle
PR Policy attend uniquement les quatre cases humaines, laissées décochées.
Le [reçu GitHub](../data/preparation-mon-espace/github-preparation.json) distingue
ce résultat de la CI de #119 et de l’accord de déploiement toujours absent.
