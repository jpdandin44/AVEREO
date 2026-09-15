---
project: avereo-app-rapport
document_type: readme
title: Rapport AVEREO Pro
status: active
version: git
created: 2026-07-08
updated: 2026-09-15
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

Pour le prototype frontend hors ligne, depuis `frontend/` :
`npm.cmd run dev -- --host 127.0.0.1 --port 52872 --strictPort`, puis ouvrir
<http://127.0.0.1:52872/>. Garder le terminal ouvert ; un redemarrage du PC
necessite de relancer cette commande. Ce serveur Vite ne remplace pas le
parcours CONNECT/MySQL sur Docker. Exporter regulierement une copie JSON.

## Types de rapport

Rapport conserve un seul assistant : `Dossier`, `Site`, `Protocoles`,
`Observations` et `Export`. Pour une nouvelle creation, l'etape `Dossier`
affiche uniquement `Expertise & Visite technique` et `Visite Globale`.
Les autres categories restent dans le catalogue du code comme modules
complementaires masques. Elles peuvent donc etre relues dans les anciens
dossiers et reactivees ulterieurement sans recreer un second moteur.

Pour `Visite Globale`, l'etape `Dossier` contient maintenant une premiere
tranche `Ecoute client` : histoire du bien, travaux passes, vecu quotidien,
attentes, besoin reformule, criteres de reussite, contraintes et accords pour
les photos et la dictee. Ces donnees suivent le
meme brouillon, la meme sauvegarde JSON et les memes exports que le reste du
rapport. Les photos et la dictee sont desactivees tant que l'accord
correspondant n'est pas enregistre.

Les accords de Visite Globale sont places juste sous « Informations de base,
client et mission », avant l'entretien, pour autoriser la dictee des le debut.
Dans Site, quatre vues separent validation cadastrale, synthese des risques,
urbanisme et relief/orientation. Voir le
[parcours et les limites du contexte du bien](api/contexte-du-bien.md).

Apres confirmation du lieu, le bloc `Informations deja disponibles` propose
GoRenove et les typologies Pro'Reno. Les fiches sont choisies manuellement,
avec date et notes conservees dans le dossier et l'export ; aucun resultat
n'est importe automatiquement. Voir [l'evolution 2 et sa recette](api/ressources-batiment.md).
Son apercu isole utilise `npm.cmd run dev -- --host 127.0.0.1 --port 52873 --strictPort`
depuis `frontend/`, puis <http://127.0.0.1:52873/>.

Le choix complementaire de `Visite Globale` correspond au type d'habitation :
`Maison`, `Appartement`, `Immeuble collectif` ou `Autre habitation`. `Eau`,
`Air`, `Terre` et `Feu` ne sont pas des sous-categories : ils forment le fil
conducteur de l'analyse, dans cet ordre. Le perimetre retenu peut exclure une
phase sans la supprimer du fil conducteur.

Dans l'etape `Protocoles`, ces quatre phases portent maintenant les controles
terrain adaptes : eau et humidite, renouvellement d'air, interfaces de
l'enveloppe, puis chauffage et confort. L'etape `Observations` reprend le meme
ordre et permet de rattacher chaque constat a une phase et a un point de
controle, sans perdre les anciennes observations non classees.

Le fil conducteur est en en-tete de `Protocoles`. Les nouveaux dossiers
Habitologie n'ont aucun controle coche par defaut ; les sujets explicitement
identifies a l'ecoute suggerent des controles que le professionnel ajuste.
Ses choix manuels et les selections des anciens brouillons sont preserves.

Cliquer sur le numero ou le nom d'une phase permet de la suspendre puis de
restaurer ses choix. Une phase non retenue reste grisee ; ses observations et
photos restent visibles et exportees avec cette mention. Voir les regles et
la [recette des phases activables](workflows/workflow-habitologie.md#recette-de-levolution-1).

L'etape `Site` interroge l'endpoint JSON public Georisques V1 apres le
geocodage et affiche directement les risques naturels et technologiques
identifies, avec les statuts a l'adresse et sur la commune. La source, la date
de consultation et le lien vers le rapport officiel sont conserves dans le
brouillon et l'export. L'echec du cadastre ne bloque plus cette synthese.

Une carte cadastrale IGN est integree directement dans `Site` : parcelles
sur plan ou vue aerienne, repere du bien, recentrage et confirmation avec le
client. Aucun compte Google ni cle API n'est necessaire. Le rendu local a ete
verifie sur un lieu public ; la qualification hebergee reste a effectuer.
Voir [`api/cartographie.md`](api/cartographie.md) pour les sources et limites.

La suite du workflow cible reste en partie une proposition en etude documentee dans
[`workflows/workflow-habitologie.md`](workflows/workflow-habitologie.md).

## Environnement local

Pour l'apercu fonctionnel React sans Docker et le depannage d'une connexion
locale refusee, suivre [`docs/local-development.md`](docs/local-development.md).
Les commandes ci-dessous concernent le parcours integre avec API et base.

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
