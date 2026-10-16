---
project: avereo-app-passeport-immo
document_type: documentation-index
title: Index workflows Passeport Immo
status: active
version: git
created: 2026-10-03
updated: 2026-10-16
owner: jpdandin
tags: [passeport-immo, audit, local]
---

# Index workflows Passeport Immo

Source de référence : [revue-locale.md](revue-locale.md).

[Raccordement GitHub/cockpit](developpement-github-cockpit.md) : mapping vers le skill
commun, packaging du candidat et commandes du contrôleur. La procédure commune
reste dans le skill installé ; ce projet conserve seulement son raccordement.

[Préparer la préproduction privée](preparer-preproduction.md) : contrôle du candidat,
lot initialement fermé et répétition locale de restauration, sans transfert distant.

[Reprise ciblée d'un bien](reprise-bien.md) : export privé, correspondance explicite
des propriétaires, simulation, import sans écrasement et rejeu sans doublon ;
qualification locale sous MariaDB et reprise SCI réelle vérifiée selon le reçu courant.

[Génération du plan CIL](generation-plan-cil.md) : source Markdown, restitution
Word et contrôles de contenu, d’accessibilité et de mise en page avant diffusion.

[Activation privée de production](activation-production.md) : candidat fermé et SCI
repris, préparation avec répétition isolée puis action humaine finale ; clé existante,
droits limités, politique signée et sauvegarde dédiée, sans ouverture publique.

[Blocage OAuth et proposition ciblée](../docs/blocage-oauth-production.md) : activation
privée et sauvegarde vérifiées, recette HTTPS réussie, correction Drupal préparée
sans installation ; trois sources natives de proposition et qualification isolée.
