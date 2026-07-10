# Deploiement - Coupe AVEREO Reno Pro

## Cible O2Switch

- Sous-domaine : coupe.avereo.fr
- URL temporaire O2Switch : https://coupe.avereo.fr.daje3540.odns.fr/
- Dossier recommande : ~/public_html/coupe
- Contenu publie : frontend/dist/

## Procedure

1. Creer le sous-domaine dans cPanel.
2. Associer le dossier public recommande.
3. Configurer les secrets GitHub du depot.
4. Tant que `coupe.avereo.fr` ne resout pas publiquement, laisser la verification publique utiliser l'URL temporaire O2Switch.
   Quand le DNS final est actif, definir la variable d'environnement GitHub `O2SWITCH_PUBLIC_URL` de l'environnement `coupe` a `https://coupe.avereo.fr`.
5. Lancer le workflow Deploy Coupe to O2Switch.

## Rollback manuel

Conserver une archive du precedent contenu public avant de lancer rsync --delete, puis restaurer cette archive dans le dossier public si necessaire.
