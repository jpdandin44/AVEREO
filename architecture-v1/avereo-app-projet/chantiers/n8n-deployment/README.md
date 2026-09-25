# Suivi du chantier n8n

Ce dossier alimente AVEREO Projet en mode `trackingOnly` pour le déploiement n8n sur le Synology DS224+.

## État initial

- Phase 0 : audit NAS terminé le 25/09/2026.
- Phase 1 : architecture n8n P0 en cours.
- Port local dédié : `http://127.0.0.1:5192/`.
- Lancement : `start-n8n-tracking.cmd` depuis `architecture-v1/avereo-app-projet/`.

## Suivi simplifié

Le mode `trackingOnly` conserve l'affichage professionnel de Projet :
progression, phases, jalons, prochaine action et historique.

Il masque le panneau de décision et le circuit renforcé de revue/approbation.
Ce choix est volontaire pour ce chantier non critique. Les chantiers existants
continuent d'utiliser le workflow complet sans changement.

## Sécurité et données

- aucune donnée client n'est introduite ;
- aucun secret, mot de passe, jeton, fichier `.env` ou configuration NAS sensible n'est versionné ;
- le suivi contient uniquement des informations techniques de chantier ;
- le service Projet reste local sur `127.0.0.1` ;
- le mode simplifié ne déclenche ni commit, ni merge, ni déploiement ;
- le site AVEREO, CONNECT et les autres applications ne sont pas modifiés.

## Limites

Le chantier n8n n'utilise pas le circuit de validation renforcé. Les changements
de statut sont donc entretenus dans son `suivi-chantier.json` au fil de
l'accompagnement. Avant toute mise en production de n8n, la sauvegarde,
la sécurité réseau et l'exposition HTTPS feront l'objet de phases dédiées.
