# avereo-platform

Socle partage du monorepo AVEREO.

Il porte les templates, la documentation commune, les scripts de generation et les fragments d'infrastructure. Il ne contient pas le code metier vivant des applications.

## Gateway HTTP local

Le gateway Traefik dans `infra/local-gateway/` reserve le port HTTP local et charge des routes declaratives sans acces au socket Docker. Il permet a plusieurs applications d'utiliser simultanement leurs sous-domaines `*.avereo.localhost` sans exposer leurs ports techniques dans les URLs.

Chaque application peut s'assurer que le gateway est actif, mais sa commande `down` ne doit pas l'arreter. L'arret explicite du gateway s'effectue avec son propre script.
