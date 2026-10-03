---
project: avereo-app-passeport-immo
document_type: session-handoff
title: Point de reprise de session
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [passeport-immo, local]
---

# Point de reprise de session

## Livré le 2026-10-03
État des lieux, inventaire des sources, matrice de 40 fonctions, socle documentaire et
suivi à six phases. Prototype local React/Tailwind autonome, calculs extraits sans
changement de logique, dix tests réussis, build et parité vérifiés.
Copie isolée à chemin court ; clone Collector et source historique CONNECT préservés.
Base `origin/main` observée : `f4695d662546fe7277bf3a50c8c975ce97e8b9a0`.
Phase 0 : commit local `f1d865b`, branche `feat/passeport-immo-phase-0`.
Lot local : branche `feat/passeport-immo-phase-1` ; consulter Git pour son commit final.
Les chemins personnels, imports et preuves du poste sont hors Git.

## Autorisation et limites
Accord explicite du responsable : « Phase 0 puis prototype local dans cette session ».
Le JSON reste à la phase 0 en cours ; phase 1 formellement non commencée, prototype
disponible sous cet accord distinct. Aucun événement de revue ou décision humain simulé.
Aucun push, PR, merge, déploiement, sas CONNECT ou accès production réalisé.
Le cockpit multi-projets et le stockage centralisé restent hors de ce lot.

## Ouvrir et reprendre
Application : `../start-local.cmd`, <http://127.0.0.1:5175/>, bouton « Se connecter ».
Contrôles : `npm.cmd test` et `npm.cmd run build` depuis `frontend/` ;
`node tests/check-parity.mjs` depuis le sous-projet.
Revue : `../start-review.cmd`, <http://127.0.0.1:5193/> ; dépendances installées,
serveur non démarré par l'agent. Examiner les livrables de phase 0 puis le
[livrable local](01-reprise-identique.md), remplir les résultats de recette humaine.
Vues de suivi : régénérer avec `docs/actualiser-tableau-de-bord.py`, puis `--check`.
Avant tout écrit JSON, vérifier l'absence de `.projet-review.lock`.

## Points à traiter
Page blanche finale sur le PDF fictif exporté (Q09) : correction de pagination à décider.
Recette humaine, partage/suppressions, scénarios PDF longs et téléphone réel (Q05).
Comparaison visuelle des captures historiques (Q07), unités/groupement PDF (Q04).
Docker : configuration vérifiée, image non exécutée. Bundle Vite volumineux conservé.
Connexion Claude non disponible : application native absente des surfaces accessibles,
site web à l'écran de connexion. Le prompt fourni a servi de ressource, sans échange
avec Claude ni ouverture de session à sa place.

## Périmètre documentaire vérifié
Sources Markdown/YAML/JSON identifiées ; socle obligatoire du sous-projet présent.
Socle racine complété par des index, sans audit global des autres applications.
Métadonnées et liens des nouveaux documents, vues générées, JSON et parité contrôlés.
Audit global du monorepo : TBD, n'est pas acquis par cette session.
