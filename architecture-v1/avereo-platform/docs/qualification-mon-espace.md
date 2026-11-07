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

## État actuel — livraison en préproduction

PR #121 est fusionnée et ses 40 fichiers sont installés sur les sept cibles. La
[recette hébergée](livraison-mon-espace.md) fait référence. Le correctif RGA de
PR #122 est fusionné, déployé et vérifié depuis la carte intégrée. La réserve Coupe
reste ouverte ; les essais locaux ci-dessous conservent leur portée historique.

## Historique local — extension PR #121

Phase **Développement local**. Les projets et préférences restent propres à chaque
application ; profil et catalogue CONNECT communs. CONNECT demeure un portail sans
projets métier, décision confirmée par le responsable. La préparation #119 de 37
fichiers ci-dessous est historique et ne qualifie pas cette extension.

Contrôles locaux du 6 novembre : neuf compilations (Rapport en mode en ligne),
20 tests du composant, 101 tests Rapport dont 3 RGA, 3 Thermo, 3 Drone, 29 Passeport,
les tests Projet inclus dans son build, 10 tests de préparation, 5 d’emballage et
le contrôle général du dépôt. La variante Coupe enrichie a été appliquée à sa copie
hébergée historique avec inversion exacte, sans modification OAuth/API.

Revue du navigateur intégré, ports 53120 à 53127, avec données fictives :

- Thermo : deux rapports indépendants, sauvegarde avant retour à Mes projets,
  rechargement et réouverture du premier avec sa référence et son propriétaire.
  Préférences de tri et noms d’étapes conservées après rechargement.
- Drone : mission conservée par Mes projets, retrouvée après rechargement.
- RGA : point conservé et réouvert, consultation relancée et tri par nom mémorisé.
- Rapport : nouveau dossier au format client ; modifier la préférence en expert
  puis rouvrir ce brouillon conserve le format client. Mes projets sauvegarde le
  brouillon et revient à la liste native, y compris la liste des rapports en ligne.
- Passeport : biens de démonstration et masquage effectif de leur composition.
- Coupe : préférences de grille et d’aimantation retrouvées dans les contrôles CAO.
- Projet : actions natives et lien Mon compte direct vers CONNECT.
- CONNECT : préférences du catalogue et rubriques communes, sans Mes projets.
- Thermo à 390 × 844 : menu entre x=106 et x=378, sans débordement horizontal,
  dialogue de préférences accessible ; format de test rétabli ensuite.

Captures et journaux locaux : `.local/pr121-apps/`. L’aperçu fournit des identités
fictives CONNECT/Rapport et seulement des réponses GET ; aucune authentification
hébergée n’est prouvée. Thermo, Drone et les points RGA restent locaux. La recette
sur les sept cibles et les cases humaines restent à effectuer.

La [préparation de livraison de PR #121](preparation-mon-espace.md#historique-de-préparation--pr-121-étendue)
porte le candidat `317863a9e5603fbbed578a5aa9cfc323cb17b977` : 40 fichiers,
sauvegarde/restauration sur copies privées réussie pour les sept cibles, données et
configurations conservées. Ce contrôle ne constitue pas une installation ni une
recette utilisateur hébergée.

Les quatre contrôles techniques GitHub réussissent sur ce candidat. Le contrôle de
parité Passeport inverse exactement sept modifications autorisées du menu et des
préférences, puis compare tout le reste au source historique. Un essai négatif sur
copie altérant « Mes Biens » est refusé. Les preuves historiques restent inchangées.
Le contrôle local de leur empreinte rencontre la conversion CRLF du checkout
Windows ; le blob Git est intact et le contrôle complet du cockpit passe dans la CI
Linux. Aucun hash de référence n'a été modifié pour contourner ce contrôle.

Les [preuves GitHub](../data/preparation-mon-espace-pr121/github.json) séparent ces
résultats de PR Policy, qui attend uniquement les quatre cases humaines. Les
archives et captures finales sont conservées dans
`C:/Users/examg/Documents local/livraisons-avereo/mon-espace/preparation-pr121-317863a`.

## Historique — socle #119

Lot `mon-espace-commun-20261106`, issu de `main` après la fusion vérifiée de la
[PR #114](https://github.com/jpdandin44/AVEREO/pull/114), commit
`45c184970c9b99f41f345b10f56c545568bab3f2`.
La branche a ensuite intégré `main` à `8ea117d71e51d8b32ea05d47372e9c536a126864`
(PR #113) et inclut le menu de Saisie unique.
Phase : **Développement local**. La PR #119 est maintenant fusionnée sur main, à
`e08cbde814bb552dd3bdfa0ebec101fc0dcc5d52`. La [préparation hébergée](preparation-mon-espace.md)
est vérifiée pour sept cibles ; aucune installation applicative réalisée par ce lot.

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
par chaque application et CONNECT. Les index PHP ajoutent l’URL publique
du portail à la page déjà autorisée. Passeport Immo sert aussi le chemin exact
`/account-menu.js` par son contrôleur protégé, comme ses assets compilés ; aucune
autre ressource racine n’est autorisée. RGA reçoit une route de sortie qui expire son
cookie propre avant le retour au portail. Les confirmations et les gestionnaires
de déconnexion existants restent raccordés, notamment la sauvegarde de Rapport.

Les compilations et tests ne prouvent pas l’état préproduction. La prochaine étape
est la revue du candidat et l’identification des fichiers réellement installés sur
chaque cible, avant accord de remplacement. Les paquets historiques de lots
antérieurs restent attachés à leurs propres versions ; les nouveaux candidats doivent inclure `account-menu.js` et les points d’entrée
mis à jour, puis être comparés aux versions hébergées avant remplacement. Le préparateur
existant `outillage/acces-preproduction/prepare_application_candidates.py` emballe les
huit applications web ; le fichier autonome de Saisie unique reste distinct.

La PR #118, fusionnée et installée séparément, porte le retour d’activation.
La reconstruction après #119 inclut sa source ; la sélection de livraison conserve
son backend installé et ne remplace que le menu et la page du portail CONNECT.

## Revue humaine à réaliser

Ouvrir Mon espace, vérifier les rubriques et préférences propres à chaque application
sur une copie fictive et vérifier le retour au travail. En préproduction, contrôler
le compte de la bonne cible, la déconnexion et la conservation des données avant
et après installation. Les cases humaines de la PR restent au responsable.


## Copie du sas Recherche

La compilation régénère la copie Recherche depuis le sas partagé déjà versionné
après la PR #106. Cet alignement dérivé ajoute à cette copie la lecture de la période
et de la révocation déjà appliquée par la source commune ; ce lot ne définit aucune
nouvelle règle de droit. Il doit être inclus dans la comparaison du candidat à la cible.

## Résultats historiques de qualification du 6 novembre

| Contrôle local | Résultat |
| --- | --- |
| Menu commun, clavier, URL, actions natives | 14 tests réussis |
| Compilation et présence du composant | 9 frontends réussis ; copie PHP CONNECT identique |
| Projet | 196 tests ; 74 contrôles HTTP |
| Rapport et RGA | 98 tests Rapport ; 20 contrôles HTTP RGA |
| Recherche | 23 tests ; 25 contrôles de période/révocation du sas |
| Passeport Immo | 29 tests ; 74 contrôles HTTP Apache ; 30 stockage API, 22 sauvegardes et 35 transferts fictifs |
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

## Préparation après fusion

Le [dossier de livraison](preparation-mon-espace.md) précise les nouvelles compilations,
les 37 fichiers retenus, les restaurations sur copies, les écarts conservés et les
cas Recherche/Saisie unique. Ces preuves complètent les recettes locales ci-dessus ;
elles ne constituent pas une recette applicative hébergée après installation.
