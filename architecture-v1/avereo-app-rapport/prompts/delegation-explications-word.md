---
project: avereo-app-rapport
document_type: prompt
title: Délégation explications et Word du lot Habitologue
status: active
version: git
created: 2026-11-12
updated: 2026-11-12
owner: jpdandin
tags: [rapport, habitologue, delegation]
---

# Délégation explications et Word du lot Habitologue

## Objectif

Implémenter les explications et liens dans les restitutions Word et adapter ces restitutions au profil Habitologue, en parallèle du travail de Codex sur l'interface.

## Contexte

Le responsable a autorisé ce lot local et sa délégation à Claude Code. Branche partagée `feat/rapport-v12-habitologue`. Lire les AGENTS.md applicables. Ne pas modifier, commiter ni annuler les changements d'un autre intervenant.

## Entrées et contrat

- `report.profil_metier === 'habitologue'` désigne le profil explicite. Valeur absente ou inconnue : parcours historique inchangé.
- `frontend/src/reportProfiles.js` existe, appartient à Codex. Importer `isHabitologueProfile`, `allowsDecisionProjections`, `observationAdviceLabel` sans modifier ce module.
- Nouveau champ texte `observation.explications`, facultatif, défaut chaîne vide. Les anciens conseils restent dans `observation.actions`.
- L'ordre demandé est Constat → Explications → Conseils d’habitologue pour ce profil. Le champ Explications est disponible dans tous les profils.

## Instructions et fichiers autorisés

Claude peut modifier uniquement :

- `frontend/src/textLinks.js` et son test, nouveaux : exporter `textLinks(text)` renvoyant une liste `{ text, href? }` conservant exactement le texte d'entrée, avec `href` seulement pour URL HTTP/HTTPS valides. Codex utilisera cette fonction pour un aperçu React. Fournir aussi `textToLinkedHtml(text)` avec échappement HTML et retours à la ligne ; pas de dépendance circulaire à reportHtml.
- `frontend/src/reportHtml.js`, `reportDelivery.js`, `reportDocx.js` et tests concernés : restituer les explications dans les observations expert et dans les seules observations sélectionnées pour le client ; URL HTTP/HTTPS cliquables, aucun HTML utilisateur interprété, aucun chargement externe. Utiliser observationAdviceLabel pour les conseils.
- `frontend/src/decisionSupport.js` et son test : supprimer de la restitution Word et des alertes du profil Habitologue les projections/actions/options/comparaison/arbitrage (sections 4,5,6). Conserver les sections 1,2,3 et les données JSON historiques intactes. Autres profils inchangés. Les liens des sections conservées doivent rester contrôlés.
- `frontend/public/api/reports.php` : si nécessaire valider `explications` et `profil_metier` comme chaînes sans toucher aux droits, propriétaires, comptes ni accès.
- `docs/delegation-explications-resultat.md` : compte rendu factuel avec métadonnées YAML, fichiers, choix, tests, limites.

Codex modifie App.jsx, DecisionSupportPanel.jsx, reportProfiles.js, styles et documentation canonique. Ne pas les éditer. Ne pas changer les dépendances, le lockfile ni un autre dossier du monorepo. npm ci est géré par Codex.

## Contraintes

- Aucun commit, push, merge, déploiement, connexion serveur, accès client ou secret.
- Ne pas transformer les textes libres existants. Ne pas supprimer les actions/options historiques.
- Pas de PDF, Gantt, compression photo ni gestion des comptes dans ce lot.
- N'utiliser que des données fictives pour les tests.
- Les URL javascript/data/file ne doivent jamais devenir des liens ; tester HTML malveillant, caractères &, guillemets, ponctuation et parenthèses dans les URL, retours à la ligne, HTTP/HTTPS.

## Sources autorisées

Uniquement le code et la documentation de Rapport dans ce worktree et les instructions applicables. Aucune donnée personnelle externe.

## Format de sortie

Implémentation directement dans les fichiers autorisés, tests existants et compte rendu Markdown. Indiquer les tests réellement exécutés, tout échec et les limites. Ne pas demander de permission pour les changements locaux autorisés.

## Tests

Exécuter les tests Node ciblés puis le test du frontend si les dépendances sont présentes. Le build final et la recette dans le navigateur seront faits par Codex. Vérifier conservation des profils absents, filtrage client et absence de fuite des sections 4–6 Habitologue.

## Historique des versions

- 2026-11-12 : prompt initial du lot local, issu de la demande courante du responsable.
