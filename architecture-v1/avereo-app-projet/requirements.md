---
project: avereo-app-projet
document_type: requirements
title: Exigences du planning local Projet
status: active
version: git
created: 2026-09-19
updated: 2026-09-19
owner: jpdandin
tags:
  - projet
  - exigences
---

# Exigences du planning local Projet

## Fonctionnel

- Configurer départ, cible et capacité hebdomadaire.
- Conserver les charges décimales ; réserver zéro aux jalons.
- Proposer un modèle séquentiel par défaut et un mode dépendances explicite.
- Valider IDs uniques, références existantes et graphe sans cycle.
- Refuser l'import invalide sans perte et confirmer le remplacement valide.
- Reprendre un brouillon versionné, exporter/importer un JSON complet.
- Conserver l'échange CSV neuf colonnes et l'import XLSX historique.
- Charger le pilote seulement dans le local admissible, sans écraser de brouillon.
- Conserver les données pilote hors du build public.

## Contraintes techniques

Le métier reste côté navigateur, sans backend métier, MySQL, compte ni secret.
Validation et calcul doivent être testables sans DOM. Le build doit conserver
les points d'entrée et artefacts du sas CONNECT.

Le stockage navigateur ne constitue pas une sauvegarde serveur. Erreurs
d'import, de version ou de quota ne doivent pas conduire à une confirmation
trompeuse.

## Recette et hypothèses

Les scénarios sont dans [tests/README.md](tests/README.md). Le pilote de
29,4 jours-personne doit être cohérent avec le départ proposé au 21 septembre,
la cible au 30 octobre 2026 et la capacité de 5 jours-personne par semaine.

Le calendrier est lundi–vendredi ; absences et fermetures restent à renseigner.
Estimations, affectations et dates sont proposées, sans preuve d'exécution.
Les évolutions métier EV du planning ne sont pas réalisées par ce lot.

Les tests moteur, interactions et contrôleur ainsi que la recette locale du
pilote sont consignés dans [l'audit](docs/source-audit.md). Le téléchargement
effectif d'un export JSON et l'import XLSX dans l'interface restent à qualifier.
Le sas hébergé et la disponibilité publique ne font pas partie de cette
qualification locale.
