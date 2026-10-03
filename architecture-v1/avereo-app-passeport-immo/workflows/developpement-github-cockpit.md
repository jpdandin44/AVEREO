---
project: avereo-app-passeport-immo
document_type: workflow-mapping
title: Raccordement au protocole GitHub et cockpit
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [passeport-immo, github, cockpit]
---

# Raccordement au protocole GitHub et cockpit

## Référence et source unique
Le skill `developpement-github-cockpit` invoqué par le responsable est la procédure
commune. Sa source n'est pas recopiée ici. Le paramètre local
`developmentProtocolSkill` dans `.local/review-settings.json` identifie son fichier
SKILL.md installé ; `check-workflow-gate.py` appelle son contrôleur en lecture seule.

Le [socle commun versionné dans AVEREO](../../../outillage/protocole-developpement/README.md)
est présent dans la branche après le rebase de la PR nº72 sur la fusion nº73.
Sur ce poste, le paramètre local est réaligné vers le skill installé au niveau utilisateur,
afin de ne plus utiliser la copie historique initiale. L'appel `DEV :` ou `$dev` suit
ce même protocole ; les cibles et accords Passeport Immo restent à qualifier.

Le bloc `developmentWorkflow` du [suivi](../docs/suivi-chantier.json) est la fiche
canonique de l'itération. Les six phases antérieures, leurs dates, décisions et
événements sont conservés. Les trois étapes du protocole complètent ce suivi sans
écrire de transition de phase à la place du responsable.

## Projection dans le cockpit existant
| Contrat commun | Raccordement Passeport Immo |
|---|---|
| Objectif, état, prochaine action | `developmentWorkflow.objective`, `stage`, `status`, `nextAction` |
| Étapes et blocages | `stages`, `blockers` ; état réel, aucune progression arbitraire |
| Candidat | `candidate.sourceSha` et `artifactSha256`, issus de Git et de l'archive réelle |
| Contrôles datés | `checks`, distinguant local, CI, documentation et recettes des cibles |
| PR et observation GitHub | `github` ; lien également affiché par le mécanisme PR de la phase |
| Accords, reçus et récupération | `approvals`, `backups`, `rollback`, `delivery` ; vides/non qualifiés jusqu'à preuve |
| Suite | `nextIteration` ; réserves proposées, aucun engagement automatique |

`docs/actualiser-tableau-de-bord.py` produit la vue `iteration-developpement.md` à
partir du même JSON, plus les tableaux Markdown/HTML. Cette projection est déclarée
comme livrable consultable dans la revue Projet sur 5193. Aucun second journal manuel.
Le moteur Projet reste celui du monorepo ; les décisions restent humaines.

## Commandes qualifiées
Depuis `frontend/` : `npm.cmd ci`, `npm.cmd test`, `npm.cmd run build`.
Depuis le sous-projet :
```powershell
node tests/check-parity.mjs
python workflows/package-candidate.py
python docs/actualiser-tableau-de-bord.py
python docs/actualiser-tableau-de-bord.py --check
python workflows/check-workflow-gate.py --gate preproduction
python workflows/check-workflow-gate.py --gate production
python workflows/check-workflow-gate.py --gate close
```
L'archive `.local/candidate.zip` contient seulement `frontend/dist/`, noms triés,
dates et permissions fixes. Son manifeste accompagne les empreintes. Le script relit
l'archive et vérifie chaque fichier ; un nouveau build produit un nouveau candidat
si les octets changent. Les données `localStorage` ne sont jamais dans cet artefact.

Le workflow `.github/workflows/ci-passeport-immo.yml` exécute tests, parité et build,
puis publie une archive et son manifeste pour la revue. Aucun déploiement inclus.
Un commit ultérieur limité au pilotage ne modifie pas l'artefact : conserver le SHA
du candidat contrôlé, observer aussi le HEAD de la PR et vérifier les sources avant
toute promotion. Une CI d'un autre SHA ou artefact n'est pas déclarée équivalente.

## Cibles et accès
Local réel : <http://127.0.0.1:5175/> ; cockpit lancé et lecture du chantier vérifiée :
<http://127.0.0.1:5193/>.
Préproduction/production Passeport Immo : TBD — aucune cible, vacuité/isolement,
sauvegarde restaurée, accès ou configuration dédiée qualifiée dans ce lot.
L'intégration CONNECT prévue n'est pas encore réalisée. Les workflows des autres
applications ne prouvent pas un accès ni une livraison Passeport Immo.

La demande du 2026-10-03 appelle le protocole et sa préparation GitHub/cockpit ;
elle ne constitue pas un accord de merge, déploiement ou ouverture. Les contrôles de
passage doivent refuser les preuves manquantes et l'accord exact manquant.
