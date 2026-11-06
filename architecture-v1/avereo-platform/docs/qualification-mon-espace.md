---
project: avereo-platform
document_type: validation
title: Qualification du menu commun Mon espace
status: active
version: git
created: 2026-11-06
updated: 2026-11-06
owner: jpdandin
tags: [avereo, interface, fonctions-communes]
---

# Qualification de Mon espace

Lot `mon-espace-commun-20261106`, issu de `main` après la fusion vérifiée de la
[PR #114](https://github.com/jpdandin44/AVEREO/pull/114), commit
`45c184970c9b99f41f345b10f56c545568bab3f2`.
La branche a ensuite intégré `main` à `8ea117d71e51d8b32ea05d47372e9c536a126864`
(PR #113) et inclut le menu de Saisie unique.
Phase : **Développement local**. Aucune installation hébergée réalisée par ce lot.

## Contrôles reproductibles

Depuis la racine du monorepo, après installation des dépendances des frontends :

```powershell
node .github/scripts/prepare-account-menu.mjs all
node --test architecture-v1/avereo-platform/tests/account-menu.test.mjs
node .github/scripts/check-account-menu.mjs
python -X utf8 architecture-v1/avereo-platform/tests/preview-account-menu.py
```

La revue commence sur `http://127.0.0.1:52960/` (Projet), puis les ports 52961 à
52967 présentent Rapport, Coupe, Thermo, Drone, Recherche, Passeport Immo et le
portail CONNECT. La carte RGA est `http://127.0.0.1:52961/rga/carte.php`.
Les huit frontends web doivent être construits auparavant. Saisie unique se revoit
dans son fichier autonome `frontend/dist/index.html`, après sa compilation. Les détails des preuves
et les résultats réellement exécutés sont dans le suivi canonique.

L’aperçu CONNECT utilise une identité fictive et des réponses de lecture seulement.
Le serveur d’aperçu n’exécute pas PHP et n’offre aucune API de mutation ; il ne
prouve pas une authentification. Les contrôles HTTP/PHP isolés testent séparément
les mécanismes réels. Aucune donnée de compte ni de projet hébergée n’est copiée.

## Portée des changements

Le menu est partagé ; l’identité, les habilitations et les données restent gérées
par chaque application et CONNECT. Les index PHP ajoutent seulement l’URL publique
du portail à la page déjà autorisée. RGA reçoit une route de sortie qui expire son
cookie propre avant le retour au portail. Les confirmations et les gestionnaires
de déconnexion existants restent raccordés, notamment la sauvegarde de Rapport.

Les compilations et tests ne prouvent pas l’état préproduction. La prochaine étape
est la revue du candidat et l’identification des fichiers réellement installés sur
chaque cible, avant accord de remplacement. Les paquets historiques de lots
antérieurs restent attachés à leurs propres versions ; les nouveaux candidats doivent inclure `account-menu.js` et les points d’entrée
mis à jour, puis être comparés aux versions hébergées avant remplacement. Le préparateur
existant `outillage/acces-preproduction/prepare_application_candidates.py` emballe les
huit applications web ; le fichier autonome de Saisie unique reste distinct.

## Revue humaine à réaliser

Ouvrir Mon espace, vérifier les rubriques utiles, essayer les préférences de Projet
sur une copie fictive et vérifier le retour au travail. En préproduction, contrôler
le compte de la bonne cible, la déconnexion et la conservation des données avant
et après installation. Les cases humaines de la PR restent au responsable.


## Copie du sas Recherche

La compilation régénère la copie Recherche depuis le sas partagé déjà versionné
après la PR #106. Cet alignement dérivé ajoute à cette copie la lecture de la période
et de la révocation déjà appliquée par la source commune ; ce lot ne définit aucune
nouvelle règle de droit. Il doit être inclus dans la comparaison du candidat à la cible.

## Résultats du 6 novembre

| Contrôle local | Résultat |
| --- | --- |
| Menu commun, clavier, URL, actions natives | 14 tests réussis |
| Compilation et présence du composant | 9 frontends réussis ; copie PHP CONNECT identique |
| Projet | 196 tests ; 74 contrôles HTTP |
| Rapport et RGA | 98 tests Rapport ; 20 contrôles HTTP RGA |
| Recherche | 23 tests ; 25 contrôles de période/révocation du sas |
| Passeport Immo | 29 tests réussis après adaptation des seuls libellés de navigation |
| Saisie unique | 36 tests métier/configuration réussis |
| CONNECT PHP | 38 tests réussis sur ce lot indépendant du correctif d’activation |
| Documentation | Socle des applications et liens locaux vérifiés ; preuves historiques Passeport conservées |

La revue dans le navigateur intégré couvre les surfaces Projet, Rapport, RGA, Coupe,
Thermo, Drone, Recherche, Passeport Immo, CONNECT et Saisie unique. Projet est aussi
vérifié en largeur 390 px. Préférences Projet/Saisie unique, fermeture avec Échap et
annulation de la déconnexion CONNECT conservent les actions natives. La barre RGA
fait défiler son contenu en gardant Mon espace visible en bas, sans chevaucher les
filtres. Les essais utilisent les versions locales et des données fictives.

Les compilations signalent les bundles volumineux existants de Rapport et Passeport
Immo ; ce lot n’ajoute pas de dépendance et ne traite pas leur découpage. Les recettes
locales ne prouvent ni la connexion hébergée ni le stockage en ligne.

La fixture historique de migration d’activation est réalignée comme dans la PR #118 :
runner et cinq migrations copiés sans changement, empreintes vérifiées. Les assertions
de sauvegarde/restauration et de conservation restent actives ; la CI CONNECT générale
continue de tester le schéma complet. Ce changement concerne les tests uniquement.

Les audits historiques approuvés de Passeport Immo sont conservés à l’octet ;
[une annexe](../../avereo-app-passeport-immo/docs/source-audit-mon-espace.md) porte
l’écart nouveau et sa matrice. Le préparateur transverse conserve aussi le `.user.ini`
public racine nécessaire aux envois de pièces, sans inclure de configuration privée.
