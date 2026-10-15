---
project: avereo-app-passeport-immo
document_type: api-index
title: État des intégrations
status: active
version: git
created: 2026-10-03
updated: 2026-10-15
owner: jpdandin
tags: [avereo, documentation, local]
---

# État des intégrations

Aucune API métier n'est implémentée dans le prototype local.
Le service de revue est fourni par [AVEREO Projet](../../avereo-app-projet/api/revue-locale.md).
Le [sas CONNECT](../docs/02-integration-connect.md) est installé en préproduction privée.
Le [catalogue proposé](connect-catalogue.json) et la
[configuration privée exemple](connect-config.example.php) restent des modèles ;
l'état installé et sa recette restante sont dans le [rapport](../docs/03-preproduction.md).
Le [relevé hébergé daté](connect-hosted-observation.json) décrit catalogue,
présence des paramètres et empreintes utiles sans secret ni compte personnel.
Il constitue une observation ; recontrôler la cible avant toute écriture.
Le [reçu de récupération](connect-recovery-observation.json) constate une restauration
hébergée en dossier privé et des actifs inchangés ; seuls les faits sans secrets
sont exportés. La récupération des données CONNECT reste distincte.
Elle est complétée par le [reçu ciblé du catalogue et des droits](connect-catalogue-recovery-observation.json).
Le [relevé d'accès et de préparation du transfert](preproduction-access-observation.json)
décrit l'échec de la porte visiteur dans le navigateur intégré, les contrôles
HTTPS et la relecture de l'archive privée. Il n'inclut aucun document du cas et
ne constate ni installation ni migration effectuée.
Le [reçu d'installation](preproduction-installation-observation.json), les
[contrôles du code déployé](preproduction-post-install-observation.json) et les
[requêtes HTTPS anonymes](preproduction-http-observation.json) décrivent l'état suivant.
Les observations antérieures restent datées ; aucun document privé, secret ou ticket n'est publié.
Le [reçu de correction SSO](preproduction-sso-observation.json) conserve les candidats
successifs, récupération ciblée, contrôles CI/HTTPS et recette par ticket dans le
navigateur intégré. Il constate l'import et la persistance des neuf documents,
sans leurs contenus ni données personnelles ; le stockage Chrome reste distinct.
