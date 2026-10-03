---
project: avereo-app-passeport-immo
document_type: architecture
title: Architecture Passeport Immo
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [passeport-immo, local]
---

# Architecture Passeport Immo

## Composants présents
SPA React 18 / Zustand 5 construite par Vite 5, avec Tailwind 3.4.17 compilé localement.
`frontend/src/App.jsx:100` porte le store et les écrans historiques.
`frontend/src/lib/chiffrage.js:2` et `:39` portent les calculs écran et PDF extraits.
`frontend/src/main.jsx:3` importe PapaParse 5.3.2, jsPDF 2.5.1 et html2canvas 1.4.1,
puis expose leurs globals attendus par le prototype. Aucun script CDN chargé.

## Flux et stockage
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
La session admin/pro et l'abonnement sont simulés. Aucun service serveur métier
ni API client/document n'est présent. Le sas CONNECT et o2switch restent prévus.

## Suivi indépendant de l'application
AVEREO Projet existant lit `docs/suivi-chantier.json` et les livrables déclarés.
Le lanceur utilise le port 5193. La lecture du chantier et de sa fiche d'itération
se vérifie dans le cockpit existant, sans décision de revue automatique.
L'enveloppe Python réutilise `markdown_view` du générateur mutualisé.
Les paramètres du poste restent dans `.local/review-settings.json`, ignoré par Git.
Les vues HTML/Markdown sont générées et contrôlées, sans modification manuelle.

## Limites et inconnues
Partage d'URL sans dossier ; stockage lié au navigateur ; absence d'identité réelle
et de facturation. Le futur stockage centralisé est TBD. Questions canoniques dans
le suivi, résultats techniques dans le livrable local ; aucun statut humain inféré.

## Candidat et contrôles
Le bloc `developmentWorkflow` complète le suivi à six phases. Le générateur Python
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
précise la qualification restante. Aucun transport distant ni identité CONNECT ajouté.
