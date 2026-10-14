---
project: avereo-app-passeport-immo
document_type: integration-report
title: Raccordement Passeport Immo à CONNECT
status: active
version: git
created: 2026-10-14
updated: 2026-10-14
owner: jpdandin
tags: [connect, passeport-immo, preproduction]
---

# Raccordement Passeport Immo à CONNECT

## Cadrage

Le responsable demande de vérifier le raccordement et de préparer la préproduction
après approbation D05 des documents/coupes. Les cinq documents approuvés gardent
leurs empreintes. Le nouveau lot ajoute un sas autour du même frontend ; aucun
serveur de documents, identité métier ou stockage partagé n'est ajouté.

Le contrôle public du 14 octobre reçoit 401 Basic sur CONNECT et sa santé, puis
403 sur la racine et le HTML de Passeport Immo, avec TLS vérifié. Le catalogue,
la version active et les paramètres privés restent à vérifier avec un accès
authentifié courant ; la session cPanel disponible est expirée.

## Développement local

Le sas commun est copié au build, sans seconde source maintenue. Le HTML et les
routes SPA passent par `index.php`. Un ticket HMAC CONNECT court, lié à
`passeport-immo`, crée un cookie signé Secure/HttpOnly/SameSite=Lax ; son nonce
est consommé une seule fois. La déconnexion efface ce cookie et retourne au portail.

CONNECT reconnaît `APP_LAUNCH_PASSEPORT_IMMO_URL` et
`APP_LAUNCH_PASSEPORT_IMMO_SECRET` dans sa configuration privée.
Le [catalogue proposé](../api/connect-catalogue.json) reste en brouillon sans
habilitation automatique. Le [modèle privé](../api/connect-config.example.php)
reste hors de l'archive publique : sa clé vide doit être renseignée sur le serveur
et correspondre à la clé dédiée CONNECT. Aucun secret réel n'est livré.

La recette utilise le vrai émetteur CONNECT : preuve valide, signature altérée,
expiration, autre application, rejeu et session altérée. Apache vérifie l'accès,
les refus, la déconnexion et la fermeture initiale. Les essais utilisent des
comptes fictifs et ne donnent aucun droit à un utilisateur réel.

## Préproduction

La [procédure](deployment.md) distingue ZIP fermé et politique Apache runtime.
Catalogue, droits ciblés, paramètres privés, récupération et parcours réel
Drupal → CONNECT → Passeport Immo restent à qualifier. TBD : version CONNECT
active et compte de recette autorisé. Préparer des fichiers ne prouve pas leur
installation ; les critères CONNECT du cockpit restent à vérifier sur la cible.

## Mise en production

Aucune intervention incluse. Le prototype conserve Admin Démo/Pro interne,
stockage navigateur et partage d'URL sans dossier. Le sas protège son entrée ;
il ne crée pas de permission métier et ne révoque pas instantanément un cookie
déjà émis. La connexion réelle et les habilitations dépendent de CONNECT.
