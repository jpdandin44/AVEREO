---
project: avereo-connect
document_type: changelog
title: Évolutions CONNECT
status: active
version: git
created: 2026-10-14
updated: 2026-11-02
owner: jpdandin
tags: [connect, documentation, preproduction]
---

## 2026-11-02 — RGA distincte, après retour du responsable

Remplacement du raccourci synthétique par le catalogue natif et le lancement `rga`. Ajout des paramètres dédiés, d’une déclaration transactionnelle avec copie unique des droits Rapport et d’un retour arrière ciblé sous contrôle d’empreinte. Ajout des contrôles d’indépendance et des fixtures locales.


## 2026-11-02 — Raccourci RGA

Ajout du raccourci de la carte hébergée dans Rapport et du choix fixe de vue, sans changement de droits ni de configuration. [Contrat et état de livraison](../avereo-app-rapport/api/rga.md).

# Évolutions CONNECT

## 2026-10-14

Reconnaissance des clés `APP_LAUNCH_PASSEPORT_IMMO_URL` et
`APP_LAUNCH_PASSEPORT_IMMO_SECRET`, y compris dans le chargeur de configuration
privée. Le contrôle des clés applicatives inclut les noms comportant un underscore.
Socle documentaire complété avec références vers les contrats et procédures existants.
Aucune migration, habilitation ou installation hébergée exécutée par ce lot.
