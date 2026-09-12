---
project: avereo-app-rapport
document_type: readme
title: Rapport AVEREO Pro
status: active
version: git
created: 2026-07-08
updated: 2026-09-12
owner: jpdandin
tags:
  - rapport
  - application
  - connect
---

# Rapport AVEREO Pro

Application autonome de creation de rapports d'expertise terrain dans le monorepo AVEREO.

- Slug : `rapport`
- URL locale : `http://rapport.avereo.localhost`
- Port HTTP technique direct : `8100`
- URL de production : `https://rapport.avereo.fr`
- Frontend : React 18 et Vite 7
- API : PHP sous `/api`
- Donnees : MySQL dediee
- Authentification cible : AVEREO CONNECT, adosse a Drupal OAuth/OpenID Connect

## Decision de depot

Rapport reste dans le monorepo. Son dossier, ses ports, sa base, son workflow, son sous-domaine, ses roles et sa configuration sont isoles. Voir `docs/architecture.md` pour les criteres qui pourraient justifier un depot separe plus tard.

## Source importee

La source historique `Rapport_AVEREO_Pro.txt` est conservee dans le ZIP d'audit local, exclu de Git. Le frontend integre preserve et etend ses fonctions. Voir `docs/source-audit.md` et `docs/migration-matrix.md`.

## Installation et build

```powershell
cd frontend
npm ci
npm test
npm run build
```

Le build produit `frontend/dist/`, y compris l'API PHP venant de `frontend/public/api/`.

## Types de rapport

Rapport conserve un seul assistant : `Dossier`, `Site`, `Protocoles`,
`Observations` et `Export`. Pour une nouvelle creation, l'etape `Dossier`
affiche uniquement `Expertise & Visite technique` et `Visite Globale`.
Les autres categories restent dans le catalogue du code comme modules
complementaires masques. Elles peuvent donc etre relues dans les anciens
dossiers et reactivees ulterieurement sans recreer un second moteur.

Pour `Visite Globale`, l'etape `Dossier` contient maintenant une premiere
tranche `Ecoute client` : motif, attentes, preoccupations, usages, contexte
d'occupation et accords pour les photos et la dictee. Ces donnees suivent le
meme brouillon, la meme sauvegarde JSON et les memes exports que le reste du
rapport. Les photos et la dictee sont desactivees tant que l'accord
correspondant n'est pas enregistre.

Le choix complementaire de `Visite Globale` correspond au type d'habitation :
`Maison`, `Appartement`, `Immeuble collectif` ou `Autre habitation`. `Eau`,
`Air`, `Terre` et `Feu` ne sont pas des sous-categories : ils forment le fil
conducteur obligatoire de l'analyse, dans cet ordre, pour chaque visite.

Dans l'etape `Protocoles`, ces quatre phases portent maintenant les controles
terrain adaptes : eau et humidite, renouvellement d'air, interfaces de
l'enveloppe, puis chauffage et confort. L'etape `Observations` reprend le meme
ordre et permet de rattacher chaque constat a une phase et a un point de
controle, sans perdre les anciennes observations non classees.

L'etape `Site` interroge l'endpoint JSON public Georisques V1 apres le
geocodage et affiche directement les risques naturels et technologiques
identifies, avec les statuts a l'adresse et sur la commune. La source, la date
de consultation et le lien vers le rapport officiel sont conserves dans le
brouillon et l'export. L'echec du cadastre ne bloque plus cette synthese.

La suite du workflow cible reste en partie une proposition en etude documentee dans
[`workflows/workflow-habitologie.md`](workflows/workflow-habitologie.md).

## Environnement local

```powershell
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 token-up
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 oauth-up
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 gateway-up
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 health
powershell -ExecutionPolicy Bypass -File .\local\rapport-local.ps1 gateway-down
```

Les secrets locaux sont generes dans des fichiers ignores. Aucun identifiant de production n'est requis pour developper.

`gateway-up` construit Rapport avec sa synchronisation en ligne, demarre sa
base isolee puis surcharge uniquement l'URL et le secret Rapport du CONNECT
Docker local. Les quatre autres applications conservent leurs pages de
demonstration. `gateway-down` arrete Rapport et restaure le catalogue CONNECT
local par defaut.

Ports locaux : application `8100`, MySQL `3310`, Adminer `8101`, mock OAuth `8102`.

## Production

Le workflow racine `.github/workflows/deploy-rapport-o2switch.yml` construit et publie uniquement `frontend/dist/` en FTPS. La configuration reelle reste hors document root dans `/home/CPANEL_USERNAME/.avereo/rapport/config.php`.

En environnement heberge, CONNECT est l'unique point d'authentification. Son
ticket signe ouvre le sas Rapport et etablit une identite applicative locale ;
Rapport ne redemande pas un second OAuth Drupal. Le mode `api_token` reste
strictement local et ne doit pas servir de raccourci en preproduction ou en
production.

Le workflow de production construit l'application avec
`VITE_ENABLE_ONLINE_SYNC=true`. La configuration privee Rapport doit utiliser
`auth_mode=connect_gateway` pour activer la persistance MySQL avec l'identite
signee par CONNECT. La procedure de bascule preproduction est detaillee dans
`docs/preproduction-connect-cutover.md`.

Le merge, la creation des ressources cPanel/Drupal et le deploiement restent des actions humaines.

## Documentation structurante

- `architecture.md` : index de l'architecture et sources techniques de reference.
- `requirements.md` : exigences durables et limites du parcours Habitologie.
- `decisions.md` : decisions structurantes et consequences.
- `changelog.md` : evolutions significatives, sans recopier l'historique Git.
- `roadmap.md` : priorites fonctionnelles et dette technique non bloquante.
- `docs/habitologie-light-plan.md` : parcours leger, sources, validation du prototype, lots et estimation.
- `docs/architecture.md` : architecture et frontieres de l'application.
- `docs/authentication.md` : authentification et sas CONNECT.
- `docs/deployment.md` : procedure de deploiement O2Switch.
- `database/README.md` : persistance MySQL et migrations.
