# Database Coupe

La sauvegarde en ligne utilise MySQL via l'API PHP `frontend/public/api/`.

## Table

La table principale est `coupe_projects`.

- `public_id` : identifiant public de projet utilise par l'application.
- `name`, `address`, `sources` : champs d'affichage et de recherche future.
- `payload_json` : sauvegarde complete du projet Coupe.
- `payload_bytes` : taille du projet pour surveiller les usages lourds.
- `updated_at` : index de tri pour charger rapidement les derniers projets.

La migration SQL de reference est :

```text
database/migrations/001_create_coupe_projects.sql
```

L'API execute aussi `CREATE TABLE IF NOT EXISTS` au premier appel, afin de rendre le deploiement tolerant si la table n'existe pas encore.
