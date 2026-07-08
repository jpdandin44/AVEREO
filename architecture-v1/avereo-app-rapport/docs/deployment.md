# Deploiement - Rapport AVEREO Pro

## Cible O2Switch

- Sous-domaine : rapport.avereo.fr
- Dossier recommande : ~/public_html/rapport
- Contenu publie : frontend/dist/

## Procedure

1. Creer le sous-domaine dans cPanel.
2. Associer le dossier public recommande.
3. Configurer les secrets GitHub du depot.
4. Lancer le workflow Deploy frontend to O2Switch.

## Rollback manuel

Conserver une archive du precedent contenu public avant de lancer rsync --delete, puis restaurer cette archive dans le dossier public si necessaire.
