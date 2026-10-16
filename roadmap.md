---
project: avereo
document_type: roadmap
title: Roadmap du dépôt AVEREO
status: active
version: git
created: 2026-10-03
updated: 2026-10-16
owner: jpdandin
tags: [avereo, documentation, local]
---

# Roadmap du dépôt AVEREO

## Suite courante — 16 octobre 2026

Après fusion des PR #83 et #84, le [dossier de production Rapport/Passeport Immo](outillage/acces-preproduction/preparation-production-rapport-passeport.md)
porte la suite. Le correctif OAuth et Core/Symfony sont livrés sur l’identité de
préproduction ; la nouvelle connexion et l’accès aux deux applications sont
confirmés par le responsable dans Chrome. OAuth #22 est accepté et fusionné dans
Gin #24, pas dans `main`. Le site est livré techniquement ; sa revue visuelle reste
distincte. Examiner #25/#24, intégrer Gin dans Core #23 puis vérifier son audit.
Le dernier contrôle de l’identité de production reste bloquant. La livraison de
Rapport attend sa récupération et son retour arrière qualifiés, puis l’accord
exact ; Passeport Immo conserve son activation, sa reprise SCI et son cron.
Les correctifs de sécurité du site sont suivis dans le lot Drupal coordonné.
Aucune nouvelle validation de phase n’est créée par cette préparation.

## Repères des travaux antérieurs

La demande du 14 octobre prépare séparément CONNECT préproduction :
qualification de sauvegarde/restauration de base et migration d’activation,
puis vérification des prérequis de Passeport Immo. La
[procédure](outillage/acces-preproduction/preparer-connect-activation.md) et le
bloc `connect_activation_preparation` du suivi canonique portent les contrôles
et la prochaine action. Le lot des cinq autres applications reste conservé.

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

Le 9 octobre, les cibles et récupérations de fichiers sont revérifiées. La
préparation conserve désormais le retour OAuth de Coupe et détaille le retrait
des fichiers ajoutés lors d'un éventuel retour arrière. La prochaine action porte
sur l'accord du **lot corrigé**, puis sa livraison et sa recette réelle ; les
préparations distinctes CONNECT, Recherche et Passeport restent nécessaires.
