---
project: avereo-app-rapport
document_type: readme
title: Rapport AVEREO Pro
status: active
version: git
created: 2026-07-08
updated: 2026-11-10
owner: jpdandin
tags:
  - rapport
  - application
  - connect
---

Depuis **Export**, le propriétaire peut transmettre une [copie pour les tests](docs/partage-tests-et-stockage.md) du dossier ouvert.

## Essais temporaires — candidat local

Contrôle de période et de révocation par identité préparé pour Rapport et RGA, testé localement, sans ouverture de compte. [Contrat, preuves et limites](docs/essais-temporaires.md).


## Repérage des observations — candidat local du 2 novembre

Dans Observations, importer les plans et coupes du dossier, placer et déplacer les repères, puis retrouver les vues annotées dans le Word. Les cinq vues du Cricq sont préparées dans une copie privée locale, sans localisation métier inventée. [Parcours, données et limites](docs/reperage-observations.md). La validation de l’expert est reportée au futur circuit des PDF finaux vers Passeport Immo.


## Validation et export — livré en préproduction le 2 novembre

Boutons micro dans les champs textuels et « Enregistrer cette attente », avec confirmation locale ; « Sauver en ligne » conserve la copie serveur. Candidat fonctionnel `63ec279` installé sur [Rapport préproduction via CONNECT](https://connect-preprod.avereo.fr/?app=rapport), après accord explicite. Sauvegarde fraîche des 148 fichiers et de la configuration privée ; installation/restauration répétée sur copie privée, puis trois fichiers livrés et 147 fichiers préexistants conservés. Configuration inchangée, aucune migration ni écriture SQL de livraison. Les reçus sont rattachés à `finalisation20261102.exportInput20261102` dans le suivi canonique. [Qualification et réserves](docs/reprise-demo-philippe.md).


## Nouvelle recherche RGA — candidat du 2 novembre

Application RGA distincte dans CONNECT et carte à l’adresse dans Site → Rapport des risques, avec un accès RGA propre. Les droits Rapport sont copiés une fois lors de la déclaration, puis gérés indépendamment. Lecture cartographique indicative 2026 et synthèse Géorisques séparées ; création explicite d’un dossier depuis la carte et conservation dans les restitutions. [Parcours, sources, lancement local et limites](api/rga.md). État hébergé dans le suivi canonique référencé par ce contrat.

## Reprise Géorisques — candidat local

Un correctif local de récupération Géorisques est préparé : tentatives espacées
et conservation de la dernière synthèse datée au même point. Il n'est pas livré
et le service externe reste intermittent. [État et limites](api/georisques.md).

## Corrections livrées le 1er novembre

Le candidat `9ce22fd` est livré en préproduction le 1er novembre à 20 h 38 (Paris), après sauvegarde des 31 fichiers et de la configuration privée, puis restauration répétée sur copie privée. « Complétude de saisie » distingue le remplissage de la revue métier ; le message photo/dictée correspond aux accords existants. Les deux copies DEMO sont enrichies, sauvegardées et rouvertes, puis quatre Word natifs hébergés sont contrôlés : Tilleuls expert/client 17/5 pages, Cricq 27/7. [Preuves et reprise](docs/reprise-demo-philippe.md). La session applicative dure 30 minutes ; relancer Rapport depuis CONNECT avant chaque maison pendant la démo de 90 minutes.

## Aide à la décision en préproduction

Dans une Visite Globale, ouvrir Export puis Aide à la décision : attentes et projet séparés, liens aux constats, actions classées et deux options comparables. Le JSON et les deux restitutions reprennent le même bloc. Aucune décision ni estimation automatique. [Périmètre et critères](docs/aide-decision-demo.md).

Candidat `9a4f414` livré le 30 octobre après sauvegarde et répétition du retour arrière. Entrée : [CONNECT préproduction → Rapport](https://connect-preprod.avereo.fr/?app=rapport). Deux copies sont disponibles dans la liste serveur : `DEMO TILLEULS DECISION` et `DEMO CRICQ DECISION`. Leur sauvegarde/réouverture, JSON et Word expert/client sont contrôlés. [Reprise et récupération](docs/reprise-demo-philippe.md). La revue métier reste au responsable.


## Deux livrables AVEREO — 24 octobre 2026

Le générateur propose un rapport expert complet et une synthèse client illustrée
à partir du même dossier. Choisir le destinataire dans Export, sélectionner les
visuels et exporter en vrai Word `.docx` avec images incorporées. Les pièces et
choix sont conservés dans le JSON existant. Voir la [procédure de transmission](docs/transmission-generation-rapports.md) pour l'usage, les
sources, la recette et la reprise. L'état hébergé est dans le point de reprise.

# Rapport AVEREO Pro

## Préparation démo Philippe — 24 octobre 2026

La branche `feat/rapport-demo-rga-20261024` prépare la réouverture des sauvegardes en ligne et l’accès à la carte RGA dans Rapport. Le candidat `7082d422` est livré en préproduction, avec la correction du chevauchement déconnexion/Suivant ; recette authentifiée complète restante. Le [point de reprise](docs/reprise-demo-philippe.md) distingue les contrôles acquis et les étapes restantes.

L’état du 16 octobre ci-dessous est historique : le suivi opérationnel du 23 octobre enregistre depuis la livraison de Rapport, le rétablissement OAuth et la confirmation humaine de connexion/ouverture en production. AVEREO reste en maintenance. Cette itération modifie uniquement Rapport préproduction ; aucune écriture en production.

`npm run build` assemble désormais également les deux cartes sous PHP, avec contrôle de leurs empreintes. Pour un candidat hébergé, construire avec `VITE_ENABLE_ONLINE_SYNC=true` et conserver les protections propres à la cible. Le serveur Vite seul n’exécute pas les pages PHP RGA.


## État de livraison — 16 octobre 2026

Les deux types de Rapport sont livrés et vérifiés en préproduction ; la PR #84 est
fusionnée. La production sert encore l'ancienne interface. Le [dossier de passage
en production](../../outillage/acces-preproduction/preparation-production-rapport-passeport.md)
décrit le candidat exact, les opérations préparées et les conditions encore à lever.

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

Dans `Relief / orientation`, `Etudier le relief` affiche maintenant les
neuf altitudes sur le fond cadastral (plan ou photo aerienne). La zone
mesuree est distincte des limites de la parcelle ; le tableau reste disponible.

Si le repere ne correspond pas au batiment, choisir `Deplacer le point`,
cliquer ou faire glisser le repere, puis `Utiliser ce point` et confirmer
de nouveau le bien. L'adresse reste inchangee ; les recherches utilisent
ensuite le point ajuste. La procedure et ses effets sur les donnees sont
decrits dans [le contexte du bien](api/contexte-du-bien.md#correction-manuelle-du-point-de-visite).

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

Dans Site, « Superposer le RGA » affiche les couleurs sous les parcelles ;
« Intensité des couleurs » règle leur transparence. La nouvelle carte RGA
propose également « Cadastre + RGA » et « Vue des territoires ». Le repère
ne change pas lors de ces réglages. [Usage et limites](api/rga.md).

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

## Mon espace — candidat commun du 6 novembre 2026

L’en-tête Rapport réutilise le menu et conserve la sauvegarde avant déconnexion. RGA autonome reçoit le même menu et une sortie qui expire seulement le cookie RGA ; la carte intégrée masque le menu redondant.

[Règle commune](../avereo-platform/docs/fonctionnalites-communes.md) · [Qualification et suivi](../avereo-platform/docs/qualification-mon-espace.md). Ce candidat local ne prouve pas une installation hébergée.

## Espaces applicatifs — candidat PR #121

Mes projets revient à la liste native avec sauvegarde du brouillon avant sortie. Les préférences proposent le format expert/client pour les nouveaux rapports uniquement. RGA conserve ses points repérés et ses réglages dans des espaces de stockage locaux distincts de Rapport ; les résultats de risque sont consultés à nouveau à l’ouverture.

[Règle et portée](../avereo-platform/docs/fonctionnalites-communes.md) · [Qualification](../avereo-platform/docs/qualification-mon-espace.md).

## Retrouver un rapport en ligne

Dans **Rapports sauvegardés en ligne**, les cinq derniers dossiers sont visibles. Le menu **Afficher** permet d’en voir jusqu’à cinquante. La recherche par référence, titre ou adresse porte aussi sur les dossiers plus anciens accessibles au compte. Si un brouillon existe, sélectionner **Ouvrir** place en haut de la liste la confirmation, l’export JSON et l’annulation. [Contrat de recherche](api/README.md#recherche-des-sauvegardes-en-ligne). [Aperçu sur données fictives](docs/illustrations/rapports-en-ligne.png).

## Habilitations par organisation — candidat local

[Exporter un rapport en JSON depuis les dossiers autorisés](../../docs/administration-acces-exports.md).
