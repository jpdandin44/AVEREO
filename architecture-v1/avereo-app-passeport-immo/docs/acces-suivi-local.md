---
project: avereo-app-passeport-immo
document_type: user-guide
title: Accéder au suivi Passeport Immo
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [avereo, documentation, local]
---

# Accéder au suivi Passeport Immo

## Accès
Le responsable double-clique sur `../start-review.cmd`. Le chantier est affiché
par l'AVEREO Projet de cette copie du dépôt à <http://127.0.0.1:5193/>.
Le lot de raccordement utilise ce serveur pour vérifier les vues. Aucun compte requis.
Dans les livrables de phase 1, ouvrir « Itération GitHub et cockpit » pour ses trois étapes.

## Préparer et vérifier
Depuis `../avereo-app-projet/frontend`, installer les dépendances avec `npm ci`
si elles sont absentes. Ne pas remplacer le service de revue par un outil nouveau.
Le lanceur utilise le chemin relatif du dossier docs et le port 5193 strict.
Le contrat [de revue](../../avereo-app-projet/api/revue-locale.md) et le
[guide commun](../../avereo-app-projet/docs/guide-utilisateur.md) expliquent les actions.

## Reprise et sauvegarde
Le [suivi](suivi-chantier.json) porte l'avancement ; les vues sont générées.
Les sauvegardes avant décisions se trouvent dans `.review-backups/` hors Git.
Les paramètres du poste sont dans `../.local/review-settings.json` hors Git.
Si le port est occupé, ne pas arrêter un service inconnu. Le lanceur reste au
premier plan ; Ctrl+C arrête sa propre instance. L'adresse est limitée à ce PC.
