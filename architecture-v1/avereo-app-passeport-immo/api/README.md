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
Le [sas CONNECT](../docs/02-integration-connect.md) est préparé et testé localement.
Le [catalogue proposé](connect-catalogue.json) et la
[configuration privée exemple](connect-config.example.php) restent à installer et qualifier.
Le [relevé hébergé daté](connect-hosted-observation.json) décrit catalogue,
présence des paramètres et empreintes utiles sans secret ni compte personnel.
Il constitue une observation ; recontrôler la cible avant toute écriture.
Le [reçu de récupération](connect-recovery-observation.json) constate une restauration
hébergée en dossier privé et des actifs inchangés ; seuls les faits sans secrets
sont exportés. La récupération des données CONNECT reste distincte.
