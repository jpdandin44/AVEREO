---
project: avereo-app-coupe
document_type: architecture
title: Architecture de Coupe
status: active
version: git
created: 2026-09-09
updated: 2026-09-09
owner: jpdandin
tags: [coupe, architecture, connect]
---

# Architecture de Coupe

## Composants et responsabilités

- `frontend/src/App.jsx` : wrapper React d'une iframe pleine page.
- `frontend/public/legacy-app.html` : interface métier, canvas Fabric, import de
  plans, édition de coupes et exports. Les bibliothèques CDN existantes nécessitent
  un accès Internet ; ce lot ne garantit pas un fonctionnement entièrement hors ligne.
- `frontend/public/connect/` : contrôle PHP des tickets CONNECT, anti-rejeu,
  cookie signé et service du contenu protégé.
- `frontend/public/api/` : identité applicative, santé et code existant de
  sauvegarde en ligne. La configuration privée est chargée côté serveur uniquement.
- `backend/` et `database/` : exemples de configuration et schéma SQL existants.

## Parcours local

1. CONNECT local (`8080`) fournit les profils de démonstration et contrôle le droit `coupe`.
2. Son lien de lancement porte un ticket HMAC à usage unique vers Coupe (`8200`).
3. Apache/PHP échange le ticket, conserve son nonce hors du dossier public et
   émet `AVEREO_COUPE_GATE_LOCAL` avec l'identité CONNECT minimale signée.
4. Le wrapper et l'iframe sont servis après contrôle du cookie. Les appels API
   relisent cette identité ; un rôle d'administration Coupe n'est jamais déduit
   automatiquement du profil administrateur CONNECT.
5. Le bouton de compte sort de l'iframe, efface le cookie Coupe puis rejoint
   CONNECT. Son bouton « Se déconnecter » ouvre la confirmation : celle-ci ne
   s'ouvre pas automatiquement à l'arrivée sur `?logout=1`.

Le lanceur Coupe réutilise le lanceur Rapport fusionné en PR #53, puis superpose
uniquement la configuration de lancement Coupe à celle de Rapport. Les autres
applications restent des écrans simulés. Aucun fichier source CONNECT ou Rapport
n'est modifié par ce lot.

## Séparation local / hébergé

Le mode `environment=local` autorise un portail HTTP/HTTPS de boucle locale et
un cookie compatible HTTP, toujours `HttpOnly` et `SameSite=Lax`. Par défaut et
en hébergement, le portail reste limité à HTTPS AVEREO et le cookie reste `Secure`.
La signature, l'expiration et l'anti-rejeu sont contrôlés dans les deux modes.

Drupal reste le fournisseur d'identité du parcours hébergé, en amont de CONNECT.
Les profils locaux ne sont pas des comptes Drupal et ne déclenchent aucun email.

## Données et dépendances

Coupe locale n'a pas de base : [les fichiers JSON exportés](data/README.md)
constituent la sauvegarde des projets. CONNECT utilise sa base éphémère de test ;
Rapport conserve sa propre stack et son volume isolé. Les tickets et cookies ne
transportent pas les projets. Les contrats existants sont décrits dans
[l'index API](api/README.md), sans dupliquer leur implémentation PHP.
