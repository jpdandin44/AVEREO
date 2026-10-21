---
project: avereo-app-saisie-unique
document_type: user-guide
title: Accéder au suivi AVEREO Saisie unique
status: active
version: git
created: 2026-10-21
updated: 2026-10-21
owner: jpdandin
tags: [avereo, documentation, local]
---

# Accéder au suivi AVEREO Saisie unique

## Accès
Le responsable double-clique sur `../start-review.cmd`. Le chantier est affiché
par l'AVEREO Projet de cette copie du dépôt à <http://127.0.0.1:5191/>.
Aucun compte requis. L'adresse est limitée à ce PC.

Le chantier suit les quatre phases du modèle commun : Cadrage, Développement local,
Préproduction, Mise en production. Cette mission couvre le cadrage et le développement
local ; les deux dernières phases ne sont ni démarrées ni détaillées.

## Préparer et vérifier
Depuis `../avereo-app-projet/frontend`, installer les dépendances avec `npm ci`
si elles sont absentes. Ne pas remplacer le service de revue par un outil nouveau.
Le lanceur utilise le chemin relatif du dossier docs et le port 5191 strict.
Si ce port est occupé, ne pas arrêter un service inconnu : choisir un autre port libre
dans `../start-review.cmd` et dans `../.local/review-settings.json`.
Le contrat [de revue](../../avereo-app-projet/api/revue-locale.md) et le
[guide commun](../../avereo-app-projet/docs/guide-utilisateur.md) expliquent les actions.

## Paramètres propres au poste
Le fichier `../.local/review-settings.json` est ignoré par Git. Il contient le chemin
absolu, sur ce poste, du générateur de tableau de bord mutualisé (clé `dashboardGenerator`)
et le port. Exemple de forme, avec un chemin fictif :

```json
{
  "dashboardGenerator": "CHEMIN_ABSOLU_VERS_actualiser-tableau-de-bord.py",
  "port": 5191
}
```

Sans ce fichier, `actualiser-tableau-de-bord.py` s'arrête avec un message qui le dit.

## Reprise et sauvegarde
Le [suivi](suivi-chantier.json) porte l'avancement ; les vues
`tableau-de-bord.md` et `tableau-de-bord.html` sont générées et ne se modifient pas à la main.
Pour les régénérer, depuis la racine du dépôt :

```
python architecture-v1/avereo-app-saisie-unique/docs/actualiser-tableau-de-bord.py
python architecture-v1/avereo-app-saisie-unique/docs/actualiser-tableau-de-bord.py --check
```

Les sauvegardes avant décisions se trouvent dans `.review-backups/`, hors Git.
Le lanceur reste au premier plan ; Ctrl+C arrête sa propre instance.

## Qui écrit quoi
L'agent écrit les livrables et, dans le JSON, `deliverables`, `exitCriteria`, `nextAction`,
`pullRequest`, `history` et `verificationQuestions`. Le responsable, seul, écrit
`decisions`, `reviewEvents` et les transitions de phase, par AVEREO Projet.
Si un fichier `.projet-review.lock` est présent dans ce dossier, le serveur de revue est
en train d'écrire : ne rien modifier avant son arrêt.
