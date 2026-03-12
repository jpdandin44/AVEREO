# Integration Nextcloud - V1

Ce document decrit le branchement cloud collaboratif pour AVEREO CONNECT V1.

## But

Utiliser Nextcloud comme coffre documentaire collaboratif pour les dossiers biens:
- Upload de fichiers dossier
- Conservation locale de metadata dans l'app
- Affichage local immediat (preview)

## Base technique actuelle

Dans `avereo-v1-base/app.jsx`:
- configuration cloud en localStorage (`avereo-cloud-config`)
- creation auto des collections WebDAV (`MKCOL`)
- upload WebDAV via `PUT /remote.php/dav/files/...`
- fallback local si upload cloud indisponible

## Configuration recommandee

Dans l'app (section `Configurer cloud`):
- Base URL: `https://cloud.avereo.fr`
- Username: utilisateur Nextcloud dedie
- App password: mot de passe applicatif Nextcloud (pas le mot de passe principal)
- Root folder: `AVEREO_CONNECT` (sous-dossiers possibles, ex: `AVEREO/CONNECT`)

## Prerequis Nextcloud

1. Creer un utilisateur dedie AVEREO (ou groupe dedie)
2. Generer un app password
3. Verifier l'acces WebDAV
4. Autoriser CORS depuis le domaine front (ex: `https://app.avereo.fr`)
5. Forcer HTTPS cote app et cote cloud

## Points d'attention V1

- Suppression locale n'efface pas encore le fichier distant Nextcloud
- Pas encore de lien public partageable genere automatiquement
- Pas encore de synchronisation serveur/API (tout est cote front)
- Les identifiants cloud sont stockes localement (mode demo)

## Evolution V2 cible

- Deplacer l'upload cloud cote API (jetons et identifiants jamais dans le front)
- Gerer suppression distante et versioning
- Ajouter partage securise par lien temporaire
- Journal d'audit des acces fichier
