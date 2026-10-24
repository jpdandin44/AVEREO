---
project: avereo-app-rapport
document_type: migration-matrix
title: Matrice de migration fonctionnelle
status: active
version: git
created: 2026-07-13
updated: 2026-10-24
owner: jpdandin
tags:
  - rapport
  - migration
  - fonctionnalites
---

# Matrice de migration fonctionnelle

## État du lot démo au 24 octobre

L’interface de réouverture depuis la liste serveur est implémentée et livrée en préproduction, en réutilisant les opérations API existantes. Le RGA dispose d’un affichage explicite et les cartes d’origine sont empaquetées derrière CONNECT. Le lien de déconnexion flottant a été remplacé par une action d’en-tête, contrôlée sur écran large et étroit ; le brouillon le plus récent est repris entre les deux stockages. Ces écarts et leurs sources sont décrits dans le [point de reprise](reprise-demo-philippe.md) et l’[architecture](architecture.md). Le build authentifié et les 60 tests réussissent ; les empreintes livrées, la restauration et les refus anonymes sont vérifiés ; la recette authentifiée et la revue native Word restent à effectuer.

Les états du 16 octobre ci-dessous sont historiques ; la production du 23 octobre est enregistrée dans le suivi opérationnel. Aucune preuve antérieure n’est réattribuée au nouveau code.


## Passage en production après fusion de la PR #84

La [préparation du 16 octobre](../../../outillage/acces-preproduction/preparation-production-rapport-passeport.md)
confirme l'identité des sources exécutables avec `main`, l'ancienne version encore
servie en production et le plan ciblé de cinq écritures. Le point OAuth répond 503 ;
la récupération et le retour arrière Rapport restent à qualifier. Aucun comportement
applicatif ni statut de qualification fonctionnelle n'est changé par ce dossier.

## Préproduction du 16 octobre 2026

Les deux types de rapport, leur sauvegarde/relecture en ligne, reprise du brouillon, aperçus et exports JSON/Word sont contrôlés sur le candidat livré. Les données métier existantes et le brouillon initial sont conservés. Le [compte rendu transverse](../../../outillage/acces-preproduction/livraison-rapport-passeport.md) fournit les empreintes et limites exactes. Cette recette ciblée ne requalifie pas les services géographiques, photos, dictée ni le rendu natif Word ; les limites spécifiques de la matrice restent valables.


| Fonctionnalite | Source | Donnees/services | Cible AVEREO et test | Statut |
| --- | --- | --- | --- | --- |
| Relief sur cadastre | demande utilisateur | `terrain.analysis.samples`, tuiles IGN existantes | Neuf valeurs geolocalisees, extremes relatifs, emprise et tableau ; voir `../api/contexte-du-bien.md` | valide localement, qualification hebergee/tactile restante |
| Correction du repere | demande utilisateur | `cadastre.lon/lat`, `localisation.point_manuel` | Ajustement explicite, annulation, donnees derivees invalidees, notes conservees, reprise locale ; voir `../api/contexte-du-bien.md` | valide localement, qualification hebergee restante |
| Ressources du batiment (evolution 2) | demande utilisateur | `ressources_batiment`, liens manuels GoRenove/Pro'Reno | Sources/date/notes, URL validees, ancien brouillon compatible, rattachement caduc sans perte | prototype implemente, qualification hebergee restante ; voir `../api/ressources-batiment.md` |
| Phases activables (evolution 1) | demande utilisateur | `habitologie_protocoles[phase].enabled`, controles conserves | Sans indicateur : phase active ; desactivation/retablissement sans perte ; reprise et exports controles, 44 tests | valide localement, revue humaine et qualification hebergee restantes |
| Vues du contexte du bien | retour utilisateur du 14 septembre | Georisques, attributs GPU, neuf altitudes IGN, orientation manuelle | Synthese dans Site, relance, notes et exports ; 39 tests et build ; vues, reprise et apercu verifies | valide localement, qualification hebergee restante |
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
| Reouverture depuis la liste serveur | absente | PHP, MySQL | API existante et interface OnlineReports | livree en preproduction le 24 octobre, recette authentifiee restante |
| Authentification | absente | AVEREO CONNECT adosse a Drupal | ticket signe, cookie de sas, roles `utilisateur_rapport`/`administrateur_rapport` | adaptee |
| Mode technique local | absente | Jeton genere localement | `api_token`, ignore de Git, admin local temporaire | adaptee |
| Parcours CONNECT local reel | absent | CONNECT Docker, ticket HMAC, cookie de sas, MySQL Rapport | `gateway-up`, secret local ignore, vraie interface Rapport sur `127.0.0.1:8100` | adaptee |
| Catalogue de rapports simplifie | plusieurs categories visibles | `categorie`, `sous_categorie`, charge JSON existante | Deux categories visibles; type d'habitation pour Visite Globale; parcours d'analyse commun Eau, Air, Terre, Feu; modules complementaires masques | adapte, a valider |
| Ecoute client de Visite Globale | proposition de workflow | Objet `ecoute` dans le payload JSON existant | Section conditionnelle dans `Dossier`; saisie et dictee texte; accords photo/dictee; apercu et export Word | adaptee, validee localement |
| Entretien enrichi et suggestions | retour utilisateur | Champs ecoute, sujets explicites et choix manuels | Histoire du bien, travaux, besoin reformule et criteres de reussite ; aucun controle par defaut ; anciens choix preserves | implemente, a valider par l'utilisateur |
| Confirmation du lieu | retour utilisateur | Tuiles IGN WMTS / Leaflet, objet `localisation` | Cadastre sur plan ou vue aerienne ; confirmation datee, annulation et correction d'adresse ; aucune migration SQL | rendu et transitions valides localement, a qualifier en preproduction |
| Backend Node.js | absent | aucun | Aucun runtime Node.js en production | non integree |

Aucune fonctionnalite source n'est volontairement supprimee. La persistance serveur et l'authentification sont ajoutees sans retirer le brouillon hors ligne. La preversion reste utilisable sans OAuth avec les brouillons navigateur; la nouvelle interface de reouverture d’une copie serveur reste a qualifier en preproduction.

Le lien vers le rapport officiel Georisques conserve la fonction historique de
consultation. La synthese structuree, son horodatage et sa source sont
maintenant integres au dossier ; la confirmation ou le commentaire manuel des
risques reste a definir.
