# Rollback Rapport

## Application

1. Identifier le dernier commit et le dernier artefact fonctionnels.
2. Creer une PR de revert; ne pas pousser directement sur `main`.
3. Apres review et merge humains, relancer le workflow Rapport.
4. Verifier la page, `/api/health.php`, l'authentification et un rapport test.

## Base de donnees

Avant toute migration destructive, exporter la base Rapport depuis cPanel. La migration initiale est additive et idempotente (`CREATE TABLE IF NOT EXISTS`). Toute migration future doit fournir une strategie de retour ou une restauration de sauvegarde.

La base et l'utilisateur Rapport ne doivent jamais etre supprimes pour effectuer un rollback applicatif.

## Configuration

Conserver une copie protegee de `/home/CPANEL_USERNAME/.avereo/rapport/config.php`. Un rollback du build ne doit ni publier ni remplacer ce fichier.
