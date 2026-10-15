---
project: avereo-app-passeport-immo
document_type: workflow-mapping
title: Raccordement au protocole GitHub et cockpit
status: active
version: git
created: 2026-10-03
updated: 2026-10-15
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
ce même protocole ; les cibles et accords sont qualifiés séparément pour chaque environnement.

Le bloc `developmentWorkflow` du [suivi](../docs/suivi-chantier.json) est la fiche
canonique de l'itération. Le parcours courant présente exactement quatre phases :
Cadrage, Développement local, Préproduction, Mise en production. Les six phases
antérieures, leurs dates, décisions et événements sont archivés dans `legacyTracking` ;
le [mapping](../docs/mapping-phases.md) reste conservé. Les champs techniques `stages`
complètent le parcours sans écrire de transition à la place du responsable.
La revue s'effectue en local pour les phases 0 et 1, en préproduction pour les
phases 2 et 3 ; les contrôles après livraison portent sur la production réelle.

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
| Préparation après fusion | `productionPreparation` ; dossier, preuves d'archives et prérequis, sans démarrage automatique |

`docs/actualiser-tableau-de-bord.py` produit la vue `iteration-developpement.md` à
partir du même JSON, plus les tableaux Markdown/HTML. Cette projection est déclarée
comme livrable consultable dans la revue Projet sur 5193. Après approbation,
la version conforme de cette fiche reste conservée pour maintenir sa preuve ;
le JSON, les tableaux et les cartes affichent les observations actuelles. Aucun
second journal manuel.
Le moteur Projet reste celui du monorepo ; les décisions restent humaines.

Les revues complémentaires utilisent le champ `reviewFollowUps` défini par le
[contrat du moteur](../../avereo-app-projet/api/revue-locale.md). Le champ antérieur
`followUps` n'était pas lu par l'interface : il est corrigé pour afficher la PR
nº72 dans la phase 0. La PR principale nº71 est conservée. La fiche d'itération
est le premier document disponible dans cette phase ; son début distingue les
travaux actuels des validations du parcours formel. `tests/check-cockpit.mjs`
contrôle ce raccordement avec le normaliseur réellement utilisé par le moteur.

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
L'archive produite contient le frontend compilé et les fichiers runtime PHP/Apache
explicitement autorisés par `candidate_contract.py`, noms triés, dates et permissions
fixes. Le manifeste accompagne les empreintes. Les paramètres privés, documents,
schéma SQL et outils de sauvegarde restent hors archive publique. Le script relit
chaque fichier ; un nouveau build produit un nouveau candidat si les octets changent.
La copie exacte à promouvoir après PR nº80 est identifiée dans le
[dossier de production](../docs/04-mise-en-production.md), sans remplacer les archives historiques.

Le workflow `.github/workflows/ci-passeport-immo.yml` exécute tests, parité et build,
puis publie une archive et son manifeste pour la revue. Aucun déploiement inclus.
Un commit ultérieur limité au pilotage ne modifie pas l'artefact : conserver le SHA
du candidat contrôlé, observer aussi le HEAD de la PR et vérifier les sources avant
toute promotion. L'équivalence d'une CI issue d'un autre SHA exige la comparaison
réelle des sources et des archives ; un autre artefact exige une nouvelle qualification.

## Cibles et accès
Points d'entrée locaux enregistrés, à vérifier au redémarrage :
application <http://127.0.0.1:5175/> ; cockpit
<http://127.0.0.1:5193/>.
Préproduction : <https://passeport-immo-preprod.avereo.fr>, avec lancement CONNECT,
stockage privé et sauvegarde observés le 15 octobre ; les reçus sont liés au
[rapport de préproduction](../docs/03-preproduction.md). La production reste TBD :
le [dossier préparé](../docs/04-mise-en-production.md) décrit sa qualification.
Les workflows des autres applications ne prouvent pas un accès ni une livraison Passeport Immo.

La PR nº80 est fusionnée ; la demande du 15 octobre prépare la suite. Les accords
de préproduction historiques gardent leur portée. La décision de phase et l'accord
de production restent distincts du merge ; le contrôleur doit signaler les preuves
ou accords manquants avant toute livraison.
