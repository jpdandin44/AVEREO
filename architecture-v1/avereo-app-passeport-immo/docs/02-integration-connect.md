---
project: avereo-app-passeport-immo
document_type: integration-report
title: Raccordement Passeport Immo à CONNECT
status: active
version: git
created: 2026-10-14
updated: 2026-10-15
owner: jpdandin
tags: [connect, passeport-immo, preproduction]
---

# Raccordement Passeport Immo à CONNECT

## Cadrage

Le responsable demande de vérifier le raccordement et de préparer la préproduction
après approbation D05 des documents/coupes. Les cinq documents approuvés gardent
leurs empreintes. Le nouveau lot ajoute un sas autour du même frontend ; aucun
serveur de documents, identité métier ou stockage partagé n'est ajouté.

Le [relevé authentifié du 15 octobre](../api/connect-hosted-observation.json)
confirme le document root dédié, fermé et contenant `.htaccess` et `cgi-bin`.
CONNECT conserve Basic et une base distincte de production. Son catalogue compte
cinq applications actives ; Passeport Immo n'y figure pas et n'a aucun droit actif.
URL, clé de lancement, configuration privée du sas et dossier anti-rejeu sont absents.
Le contrôle public du 14 octobre avait reçu 401 Basic sur CONNECT et 403 sur
Passeport Immo avec TLS vérifié ; la recette connectée reste à réaliser.

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
Les deux fichiers CONNECT concernés correspondent exactement au commit historique
`76566ca43b3e1e03a4a465391aac2f99017517cb`, sans identifier pour autant toute
la version déployée. Le delta initial basé sur `c45812cc` est incompatible.
Une variante conserve les fichiers observés et ajoute seulement trois lignes
URL/SECRET : aucun code d'activation de compte ou autre fonction n'est importé.
Elle passe 32 tests du backend historique et les 15 assertions du sas ; les
19 tests Python incluent quatre contrôles du refus d'une base ou d'un contexte différent.

Après relecture des sauvegardes du 6 octobre, une nouvelle
[répétition hébergée](../api/connect-recovery-observation.json) sauvegarde l'arbre
Passeport Immo, les deux fichiers CONNECT et sa configuration privée, puis les
restaure dans un dossier privé séparé. Octets, permissions et absence de changement
des actifs sont vérifiés. Aucun secret n'est exporté ; aucune base n'est incluse.
Avant installation : recontrôler la version, préparer paramètres, catalogue,
droits ciblés et accord exact. Les changements futurs du catalogue nécessitent
leur propre récupération de données. TBD : compte de recette autorisé et
parcours réel Drupal → CONNECT → Passeport Immo. Les critères CONNECT restent
à vérifier sur la cible. Aucun code, droit ou secret hébergé n'a été modifié.

## Mise en production

Aucune intervention incluse. Le prototype conserve Admin Démo/Pro interne,
stockage navigateur et partage d'URL sans dossier. Le sas protège son entrée ;
il ne crée pas de permission métier et ne révoque pas instantanément un cookie
déjà émis. La connexion réelle et les habilitations dépendent de CONNECT.
