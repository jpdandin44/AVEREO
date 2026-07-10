# Deploiement - Coupe AVEREO Reno Pro

## Cible O2Switch

- Sous-domaine : coupe.avereo.fr
- Dossier cible : document root declare dans cPanel pour `coupe.avereo.fr`
- Contenu publie : frontend/dist/

## Procedure

1. Creer le sous-domaine dans cPanel.
2. Associer le sous-domaine au dossier public voulu.
3. Configurer les secrets GitHub du depot.
4. Verifier que `coupe.avereo.fr` resout publiquement et que le certificat HTTPS est actif.
5. Lancer le workflow Deploy Coupe to O2Switch.

## Rollback manuel

Conserver une archive du precedent contenu public avant de relancer le workflow, puis restaurer cette archive dans le dossier public si necessaire.
