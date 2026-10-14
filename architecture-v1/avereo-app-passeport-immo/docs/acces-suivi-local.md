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
Le tableau courant présente quatre phases. La fiche d’itération initiale conservée
en Cadrage reste historique ; les livrables du lot documentaire se trouvent dans
« Développement local ».

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

## Actualisation et reprise de la revue

Le serveur de cette copie vérifie automatiquement les PR référencées toutes les
minutes avec GitHub CLI connecté sur le poste. L'écran relit les observations
sans recharger la page et conserve les cases de revue. Si une preuve change
pendant la lecture, utiliser **Charger les nouvelles preuves** avant une décision
normale. Le guide commun décrit aussi **Forcer le passage à la phase suivante**,
avec motif et confirmation spécifiques.

Une fiche d'itération approuvée conserve sa version historique. Le JSON, les
cartes GitHub et les tableaux affichent l'état actuel du chantier. Les décisions
sur disque survivent à la fermeture du serveur ; un brouillon non enregistré
reste propre à la page ouverte.
