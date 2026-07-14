# Base MySQL Rapport

La base est strictement dediee a Rapport.

- Production : `CPANEL_USERNAME_rapport`.
- Utilisateur : `CPANEL_USERNAME_rapport_user`.
- Local : valeurs generees dans `local/.env`.
- Moteur : InnoDB.
- Encodage : `utf8mb4`, collation `utf8mb4_unicode_ci` conforme au modele Coupe.

`migrations/001_create_rapport_reports.sql` cree la table de payloads JSON, les colonnes de propriete et les index de recherche/tri. Le script est reexecutable grace a `CREATE TABLE IF NOT EXISTS`.

Les photos et signatures incluses dans le JSON peuvent rendre les payloads volumineux. La limite API par defaut est de 50 Mio et doit etre ajustee avec les limites PHP/cPanel de facon coherente.

Ne jamais partager cette base ou son utilisateur avec une autre application AVEREO.
