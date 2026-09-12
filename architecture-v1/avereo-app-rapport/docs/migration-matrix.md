---
project: avereo-app-rapport
document_type: migration-matrix
title: Matrice de migration fonctionnelle
status: active
version: git
created: 2026-07-13
updated: 2026-09-12
owner: jpdandin
tags:
  - rapport
  - migration
  - fonctionnalites
---

# Matrice de migration fonctionnelle

| Fonctionnalite | Source | Donnees/services | Cible AVEREO et test | Statut |
| --- | --- | --- | --- | --- |
| Assistant multi-etapes | `Rapport_AVEREO_Pro.txt`, `frontend/src/App.jsx` | Donnees du rapport | Frontend Vite; navigation et reprise manuelles | conservee |
| Brouillon hors ligne | `App.jsx` | IndexedDB, `localStorage` | Mode local conserve; test de rechargement | conservee |
| Photos et camera | `App.jsx` | Fichiers, MediaDevices, data URLs | Frontend; taille bornee avant sauvegarde serveur | adaptee |
| Dictee vocale | `App.jsx` | Web Speech API | Frontend avec degradation gracieuse | conservee |
| Adresse et cadastre | `App.jsx` | BAN, API Carto IGN | Appels publics conserves; erreurs reseau gerees | conservee |
| Urbanisme et Geoportail | `App.jsx` | API Carto, Geoportail | Frontend; verification des liens | conservee |
| Rapport officiel des risques | `App.jsx` historique | Georisques, longitude et latitude | Bouton dans `Site`; URL validee par tests; ouverture du PDF officiel sans autre donnee du dossier | restauree |
| Synthese des risques | besoin Habitologie | Georisques V1 `resultats_rapport_risque`, longitude et latitude | Affichage dans `Site`; risques presents et statuts officiels; source, date et lien conserves dans le payload | integree, validee localement |
| Observations et protocoles | `App.jsx` | Donnees metier | Payload JSON du rapport; tests CRUD API | adaptee |
| Protocole Habitologie | besoin metier | Eau, Air, Terre, Feu et points de controle | Quatre phases dans `Protocoles`; observations groupees et rattachees; anciennes observations conservees dans `A classer` | integree, validee localement |
| Signature | `App.jsx` | Canvas/data URL | Frontend puis payload prive authentifie | adaptee |
| Apercu | `App.jsx` | HTML `srcDoc` | Iframe sandboxee sans permission et sans referrer | conservee |
| Export JSON | `App.jsx` | Blob | Frontend; import/export manuel | conservee |
| Export document | `App.jsx` | Blob HTML/Word | Frontend; controle du fichier produit | conservee |
| Sauvegarde en ligne | absente | PHP, PDO, MySQL | `/api/reports.php`, propriete utilisateur, CRUD | adaptee |
| Reouverture depuis la liste serveur | absente | PHP, MySQL | API disponible; interface differee au lot de consolidation OAuth | non integree |
| Authentification | absente | AVEREO CONNECT adosse a Drupal | ticket signe, cookie de sas, roles `utilisateur_rapport`/`administrateur_rapport` | adaptee |
| Mode technique local | absente | Jeton genere localement | `api_token`, ignore de Git, admin local temporaire | adaptee |
| Parcours CONNECT local reel | absent | CONNECT Docker, ticket HMAC, cookie de sas, MySQL Rapport | `gateway-up`, secret local ignore, vraie interface Rapport sur `127.0.0.1:8100` | adaptee |
| Catalogue de rapports simplifie | plusieurs categories visibles | `categorie`, `sous_categorie`, charge JSON existante | Deux categories visibles; type d'habitation pour Visite Globale; parcours d'analyse commun Eau, Air, Terre, Feu; modules complementaires masques | adapte, a valider |
| Ecoute client de Visite Globale | proposition de workflow | Objet `ecoute` dans le payload JSON existant | Section conditionnelle dans `Dossier`; saisie et dictee texte; accords photo/dictee; apercu et export Word | adaptee, validee localement |
| Backend Node.js | absent | aucun | Aucun runtime Node.js en production | non integree |

Aucune fonctionnalite source n'est volontairement supprimee. La persistance serveur et l'authentification sont ajoutees sans retirer le brouillon hors ligne. La preversion reste utilisable sans OAuth avec les brouillons navigateur; la reouverture d'une copie serveur sera finalisee avec le parcours d'authentification de production.

Le lien vers le rapport officiel Georisques conserve la fonction historique de
consultation. La synthese structuree, son horodatage et sa source sont
maintenant integres au dossier ; la confirmation ou le commentaire manuel des
risques reste a definir.
