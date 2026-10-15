---
project: avereo-app-passeport-immo
document_type: architecture
title: Architecture Passeport Immo
status: active
version: git
created: 2026-10-03
updated: 2026-10-15
owner: jpdandin
tags: [passeport-immo, local]
---

# Architecture Passeport Immo

## Sauvegarde privée planifiée

Le [travailleur CLI](docs/sauvegarde-automatique.md) copie les quatre tables et
les fichiers privés, contrôle leur intégrité et restitue les lignes dans des
tables temporaires. Un verrou et une date quotidienne évitent les doublons.
La copie vérifiée est publiée avant rotation ; un échec préserve le dernier succès.
Les scripts, copies, statut et journal restent hors document root.

## Stockage privé du 15 octobre 2026

Le [lot serveur](docs/stockage-serveur.md) complète le mode local décrit ci-dessous :
API PHP, identité CONNECT signée, base MySQL séparée, fichiers privés hors document root,
transactions et contrôle de révision. Le mode local conserve IndexedDB/localStorage.
Le schéma SQL et le contrat PHP sont les sources exécutables de référence.

## Sas CONNECT installé en préproduction privée

Le build copie le sas commun depuis `avereo-platform/shared/connect-gate.php`.
CONNECT → ticket HMAC → entrée à nonce unique → cookie signé → HTML et assets protégés.
Le correctif installé du 15 octobre étend ce contrôle aux assets CSS/JS/MJS :
réécriture vers l'entrée, vérification du cookie et du chemin réel, réponse privée
sans cache partagé. Les scripts internes ne sont pas directement accessibles.
Cette version remplace la porte Basic du seul sous-domaine Passeport Immo.
La politique impose une page 403 standard pour éviter qu'une page d'erreur héritée
repasse par le routage SPA. CONNECT conserve sa protection visiteur.
`index.php`, `connect/entry.php`, `connect/logout.php` et `.htaccess`
complètent les assets ; la configuration privée reste hors document root.
Sans module de réécriture Apache, la politique runtime ferme l'accès.

CONNECT reconnaît les deux clés de lancement de `passeport-immo`. Le
[modèle de catalogue](api/connect-catalogue.json) conserve sa proposition en brouillon ;
l'installation réelle est active avec l'habilitation ciblée décrite dans le
[rapport de préproduction](docs/03-preproduction.md). Le lot serveur ajoute ensuite
la persistance métier et l’identité réelle ; seule la version locale conserve la
connexion de démonstration.

## Composants présents
SPA React 18 / Zustand 5 construite par Vite 5, avec Tailwind 3.4.17 compilé localement.
`frontend/src/App.jsx:100` porte le store et les écrans historiques.
`frontend/src/lib/chiffrage.js:2` et `:39` portent les calculs écran et PDF extraits.
`frontend/src/main.jsx:3` importe PapaParse 5.3.2, jsPDF 2.5.1 et html2canvas 1.4.1,
puis expose leurs globals attendus par le prototype. Aucun script CDN chargé.

## Flux et stockage du mode local
Actions d'écran → store Zustand → biens/tarifs → `localStorage`.
Clés : `avereo-passeport-immo-biens`, `avereo-passeport-immo-tarifs`.
Biens → dossier → pièces/interventions et pièces jointes en URL de données.
La lecture des pièces jointes utilise FileReader ; PapaParse lit le CSV des tarifs.
Biens + tarifs + gamme → calcul écran ; biens + tarifs → détail PDF standard et
trois totaux. Les unités calculées sont `m²`, `unité`, `forfait` ; les autres donnent zéro.
`PdfLayout` hors écran → html2canvas → image paginée A4 par jsPDF → téléchargement.

## Exécution locale et dépendances
Serveur Vite sur 127.0.0.1:5175 ; build dans `frontend/dist/`.
Le modèle Docker contient un étage Node 22 pour tests/build puis Nginx pour les assets.
Configuration Compose vérifiée ; exécution Docker non vérifiée.
La session admin/pro et l’abonnement sont simulés dans le serveur Vite local.
Le mode hébergé utilise l’API PHP et la session CONNECT décrites dans le lot serveur. Le sas CONNECT est installé sur o2switch ;
la protection visiteur Basic est portée par CONNECT, distincte de son identité
et de ses droits. Passeport Immo vérifie le cookie signé sans autre porte Basic.
Les sous-dossiers publics
sont en 0755 ; configurations et répertoires privés sont en 0600/0700.

## Suivi indépendant de l'application
AVEREO Projet existant lit `docs/suivi-chantier.json` et les livrables déclarés.
Le lanceur utilise le port 5193. La lecture du chantier et de sa fiche d'itération
se vérifie dans le cockpit existant, sans décision de revue automatique.
L'enveloppe Python réutilise `markdown_view` du générateur mutualisé.
Les paramètres du poste restent dans `.local/review-settings.json`, ignoré par Git.
Les vues HTML/Markdown sont générées et contrôlées, sans modification manuelle.

## Limites du mode local et inconnues initiales
Partage d'URL sans dossier ; stockage lié au navigateur ; session interne de
démonstration et absence de facturation. L'identité CONNECT protège l'entrée
hébergée, sans synchroniser les dossiers. Le futur stockage centralisé est TBD. Questions canoniques dans
le suivi, résultats techniques dans le livrable local ; aucun statut humain inféré.

## Candidat et contrôles
Le bloc `developmentWorkflow` complète le suivi actif à quatre phases ; les six phases historiques sont archivées. Le générateur Python
en produit une fiche d'itération consultable dans Projet et dans les vues dérivées.
Le workflow GitHub dédié exécute tests, parité, build puis packaging. L'archive des
assets est déterministe et relue fichier par fichier ; le manifeste lie le SHA Git
et les empreintes. Aucun workflow de déploiement Passeport Immo n'est configuré.

La pagination compare le débordement au pas d'un pixel du canvas. Une dernière ligne
blanche issue de l'arrondi A4 ne crée plus de page ; une ligne avec du contenu conserve
la page. Le téléchargement reste en image, comme le prototype historique.

## Préparation privée de livraison

`workflows/prepare-preproduction.py` lit le candidat canonique, son archive et son
manifeste. Le lot hors Git contient les mêmes assets et un `.htaccess` initialement
fermé. Version et empreintes sont contrôlées ; la restauration est répétée uniquement
sur des fichiers temporaires locaux. La [procédure](workflows/preparer-preproduction.md)
précise la qualification restante. Aucun transport distant ajouté ; le sas d'entrée CONNECT est préparé séparément.

La cible o2switch retenue est un dossier dédié protégé dans le compte du domaine
parent : l'hébergeur impose ce compte aux sous-domaines. Le dossier, son rattachement
et le certificat gratuit sont créés. Le modèle `workflows/preproduction.htaccess`
était le seul fichier installé lors de la qualification initiale : il refuse toute consultation et interdit l'indexation.
La fermeture 403 initiale a d'abord été remplacée par Basic et le sas, puis par
le sas seul sur Passeport Immo après contrôle de tous les assets. Sans session,
le HTML renvoie vers CONNECT (303), les assets et tickets invalides sont refusés
(403). Aucun isolement entre comptes n'est déclaré :
les chemins dédiés et les bases distinctes sont contrôlés. Fichiers et lignes de
catalogue/droits disposent de récupérations vérifiées ; la recette authentifiée reste ouverte.
Les observations et valeurs exactes restent dans le suivi canonique et la
[fiche de qualification](docs/qualification-preproduction.md).

## Conservation d'une projection approuvée

`actualiser-tableau-de-bord.py` recense les empreintes des vues générées approuvées
dans le suivi. Une vue encore conforme n'est plus réécrite ; une vue déjà modifiée
est signalée en erreur. `iteration-developpement.md` peut donc conserver l'état
historique de sa revue, tandis que les tableaux et le cockpit montrent le JSON
actuel. Quatre tests dédiés complètent les six tests de préparation ; un onzième
test protège l’ordre de packaging des noms mêlant majuscules et minuscules.
Les noms relatifs des assets sont triés comme chaînes pour obtenir les mêmes
octets d’archive sur Windows et Linux. La CI exécute ces tests par découverte `test_*.py`.

## Documents par client et par bien

`DocumentsPanel` est placé au-dessus du dossier de travaux. `document-store.js`
utilise quatre collections IndexedDB : `clients`, `biens` (association du bien au
client), `documents` (métadonnées, SHA-256, catégorie, dates, archive), `files`
(Blob). Les index isolent les dossiers et dédoublonnent le contenu par bien.
Les noms/titres et catégories ne changent pas les fichiers sources. La transaction
confirme les métadonnées et le Blob ensemble. Les PDF/images sont servis au lecteur
par URL locale temporaire, libérée à sa fermeture ; les autres formats se téléchargent.
PDF.js dessine une page à la fois dans un canvas, via son worker local et un import
dynamique, pour fonctionner aussi dans le navigateur intégré. Le changement de page
annule le rendu précédent ; le document et le worker sont libérés à la fermeture.
Il n’y a ni API de document ni transport distant. Les limites de conservation
du navigateur sont explicitées dans le guide. Références :
[IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API),
[transactions](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction),
[URL temporaires](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static).

La copie de migration du cas réel est déposée séparément dans un répertoire privé
du serveur, sans exposition par l'application. Ce dépôt n'ajoute pas de stockage
documentaire partagé. L'import explicite sur l'origine HTTPS est effectué dans
le navigateur intégré, avec six actifs et trois archivés ; persistance et octets
restitués sont vérifiés. Chrome conserve son propre stockage. Les dates de nouvel
import sont celles du 15 octobre ; le manifeste privé garde les métadonnées sources.

Le cas de coupes utilise une circulation de fichiers locale : plans source →
projets CAO dans Coupe → exports SVG → PDF comparatif → import dans le dossier
documentaire. Les projets Coupe et exports restent dans le dossier source privé.
Le PDF est une restitution des SVG, sans API entre les applications ; le code de
Coupe est inchangé. Le [guide](docs/coupes-bien.md) distingue les mesures lues,
les hypothèses et la reprise des projets modifiables.
