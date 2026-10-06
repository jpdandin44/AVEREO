---
project: avereo
document_type: roadmap
title: Roadmap du dépôt AVEREO
status: active
version: git
created: 2026-10-03
updated: 2026-10-06
owner: jpdandin
tags: [avereo, documentation, local]
---

# Roadmap du dépôt AVEREO

Les suivis propres à chaque chantier font foi. Le chantier
[Passeport Immo](architecture-v1/avereo-app-passeport-immo/roadmap.md) conserve son périmètre
d'état des lieux et de reprise locale.
TBD : roadmap globale ; aucune priorité des autres chantiers modifiée.

Le [socle commun de développement](outillage/protocole-developpement/roadmap.md) est
préparé dans une PR distincte. Son adoption se fait lors des prochains lots autorisés
dans chaque dépôt ; aucun déploiement des applications n'en découle.

Le [suivi des accès préproduction](outillage/acces-preproduction/suivi-chantier.json)
porte le pilote CONNECT puis la généralisation demandée. Les préproductions
CV/Passeport fermées et les fournisseurs d’identité restent à qualifier.

La réparation technique de `auth-next-preprod` est appliquée ; la prochaine
étape du pilote est la recette avec le compte du responsable et le lancement
des applications, avant généralisation. Les preuves et limites restent dans
le suivi canonique du lot.

La prochaine qualification couvre les huit applications avant production :
ensemble local construit depuis une même référence, comparaison des versions et
configurations hébergées, puis livraisons de recette qualifiées par cible.
L’inventaire hébergé est maintenant terminé et les restaurations privées des
fichiers de sept cibles sont vérifiées. Le prochain passage porte sur le lot
préparé Rapport/Coupe/Projet/Thermo/Drone, après accord de préproduction.
CONNECT exige une migration et une récupération de base préparées ; Recherche
exige une cible et un raccordement, Passeport Immo une installation et un contrat
CONNECT. Aucune de ces opérations n’est une mise en production.
Les preuves, réserves et prochaines actions par application restent dans
[le relevé dérivé](outillage/acces-preproduction/releve-heberge.md#alignement-des-applications).
Aucun passage de phase ni remplacement applicatif n’est déduit des tests locaux.
