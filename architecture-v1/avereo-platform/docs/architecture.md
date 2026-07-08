# Architecture AVEREO V1

AVEREO V1 retient une architecture hybride : un depot central de standards et six depots applicatifs independants.

Le monorepo applicatif est refuse car les six applications ont des rythmes, des sous-domaines, des dependances et des trajectoires de refactorisation differents. Les separer limite les risques de deploiement croise et clarifie la responsabilite de chaque application.

Chaque application dispose donc de son propre depot Git, de ses propres workflows GitHub Actions et de sa propre cible O2Switch. Le depot `avereo-platform` ne porte pas le code applicatif vivant : il conserve les templates, la documentation commune, les scripts et les fragments d'infrastructure.

Backend et MySQL sont repousses a la V2. La V1 reste statique afin de livrer vite, deployer simplement via cPanel/O2Switch et eviter des endpoints ou schemas inutiles avant validation metier.
