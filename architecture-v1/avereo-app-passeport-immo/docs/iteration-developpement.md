---
project: avereo-app-passeport-immo
document_type: generated-iteration
title: Itération de développement Passeport Immo
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [cockpit, genere]
---

# Itération de développement Passeport Immo

Vue générée depuis `developmentWorkflow` dans `suivi-chantier.json`. Ne pas modifier à la main.

## Itération GitHub et cockpit

**passeport-immo-2026-10-03** — Rattacher le prototype au protocole GitHub/cockpit et corriger la page blanche PDF.

Responsable : jpdandin. Étape : preproduction. État : Bloquée.

Ces étapes techniques complètent les phases formelles du chantier ; une fusion GitHub ne modifie pas leurs décisions.

| Étape | État | Prochaine action |
|---|---|---|
| Local | Validée | Source fusionnée après checklist GitHub humaine ; conserver les limites de recette non documentées. |
| Préproduction | Bloquée | Préparer la cible dédiée o2switch : adresse, accès, protection et récupération ; aucun déploiement engagé. |
| Production | Bloquée | Attendre recette réelle préproduction, acceptation humaine et récupération qualifiée. |

### Candidat et GitHub

- SHA source : `f076a9b1644ae9c0620aa77df8531773c8cb00af`.
- SHA-256 de l'archive : `84b4d07bb966bd674a98576c1fb3a9564e87cade118a01700f257091c099ceab`.
- PR : [Ouvrir la PR](https://github.com/jpdandin44/AVEREO/pull/71).
- Complément de suivi : [Ouvrir la PR de suivi](https://github.com/jpdandin44/AVEREO/pull/72).
- Dernière observation GitHub : 2026-10-03T12:52:58+00:00.
- Revue humaine de la source GitHub : Confirmée.
- Acceptation de l'archive exacte pour promotion : À consigner avant production.

### Contrôles datés

| Nature | Résultat | Observation |
|---|---|---|
| Sur le poste | Réussi | 2026-10-03T12:44:51+00:00 |
| GitHub Actions | Réussi | 2026-10-03T12:42:48+00:00 |
| Documentation | Réussi | 2026-10-03T12:44:51+00:00 |

Preuves du candidat identifié ci-dessus :

- Sur le poste : raccordement-cockpit.md : 14 tests, build, parité a/b/c+d ; PDF réel court 1 page complète ; archive relue et répétée.
- GitHub Actions : https://github.com/jpdandin44/AVEREO/actions/runs/37123530922
- Documentation : 32 documents, socles, métadonnées simples, liens locaux, matrice 40 lignes, vues générées ; lecture Projet sans mutation.

### Contrôles de passage

- Préproduction : passage refusé (2026-10-03T12:54:58+00:00).
- Production : passage refusé (2026-10-03T12:54:59+00:00).
- Clôture : passage refusé (2026-10-03T12:54:59+00:00).

### Blocages de passage

- o2switch choisi ; adresse, répertoire, accès et isolation de la cible dédiée non qualifiés.
- Accord exact de préproduction absent ; vacuité/isolement ou sauvegarde restaurée non prouvés.
- Intégration CONNECT non réalisée ; recette humaine détaillée, cible de production et récupération à qualifier.

Prochaine action : Préciser la cible dédiée o2switch, ses accès et sa protection, puis préparer le lot CONNECT et l’accord de déploiement du candidat exact.

### Accords et livraison

Accords spécifiques enregistrés : 0. Sauvegardes qualifiées : 0.
Retour arrière : non testé. Livraison : non réalisée.
Les validations antérieures de phase ne sont ni remplacées ni déduites de ces constats.

### Suite proposée

- Intégration CONNECT après accord sur les fichiers concernés.
- Partage sécurisé et stockage centralisé à spécifier à la demande des clients.
