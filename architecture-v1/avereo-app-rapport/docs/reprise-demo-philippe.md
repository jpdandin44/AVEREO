---
project: avereo-app-rapport
document_type: session-handoff
title: Reprise de la préparation démo Philippe
status: active
version: git
created: 2026-10-24
updated: 2026-10-24
owner: jpdandin
tags: [rapport, demonstration, rga, preproduction]
---

# Reprise de la préparation démo Philippe

## Périmètre et source de vérité

Demande : priorité 1 (sauvegarde, réouverture, export) en préproduction, et ajout du RGA avec accès à la carte existante. Le responsable a choisi d’intégrer la carte à Rapport préproduction. AVEREO doit rester en maintenance.

Copie de développement : `C:/Users/examg/Documents local/avereo-preprod-rapport-passeport`, branche `feat/rapport-demo-rga-20261024`, base `cf21b593faf9b6f4fae5e88eea3ff0117d41a074`. Modifications non commitées, sans PR ni candidat hébergé.

Le [suivi opérationnel canonique](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>) et son [point de session](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/point-session.md>) conservent les accords et preuves historiques. Ne pas remplacer les travaux locaux de cette autre copie. Le plan métier reste `priorites-demo-philippe.md` dans ce même dossier.

## État des quatre phases

| Phase | État réel | Suite |
| --- | --- | --- |
| Cadrage | Périmètre et choix d’intégration RGA établis | Conserver les critères de `requirements.md` |
| Développement local | Changements écrits ; 60 tests et build avec sauvegarde en ligne réussis | Essais locaux et affichage bureau/mobile contrôlés ; identifier le candidat/PR |
| Préproduction | Non livrée pour ce lot ; session Chrome déclarée connectée par le responsable | Sauvegarde/restauration, préparation de l’artefact authentifié, qualification de la cible, livraison puis recette réelle |
| Mise en production | Hors de cette itération autorisée | Accord propre au nouveau candidat requis ; maintenance AVEREO conservée |

## Fichiers de développement

- `frontend/src/OnlineReports.jsx` : liste et chargement via les GET existants, confirmation du remplacement du brouillon et possibilité de l’exporter.
- `frontend/src/App.jsx` : branchement de la liste, attente de sauvegarde avant retour accueil, encadré RGA et export Word.
- `frontend/src/georisquesRiskSummary.js` : identification et conservation des libellés RGA, compatibilité des anciens rapports.
- `frontend/src/styles.css` : présentation de la liste et adaptation de l’en-tête sur écran étroit.
- `frontend/public/index.php` et `Header` : retrait du lien flottant qui recouvrait « Suivant », déconnexion dans l’en-tête ; attente de sauvegarde du brouillon avant déconnexion.
- `frontend/src/draftRecovery.js` : sélection du brouillon le plus récent, même si un ancien secours existe encore.
- `data/rga/` : sources HTML figées et empreintes ; les données originales AVEREO_2 restent intactes.
- `frontend/public/rga/` et `frontend/scripts/build-rga.mjs` : index, garde CONNECT et production des cartes PHP protégées ; script raccordé à `frontend/package.json`.

## Vérifications acquises et limites

- `npm.cmd test` : 60 tests réussis, dont RGA présent/absent/ancien dossier et sélection du brouillon le plus récent entre IndexedDB et son secours localStorage.
- `VITE_ENABLE_ONLINE_SYNC=true npm.cmd run build` : réussi ; deux cartes protégées empaquetées, empreintes des sources vérifiées. Le candidat de livraison sera identifié dans le suivi canonique après commit et contrôle CI.
- Syntaxe PHP des quatre pages RGA (index, garde, deux cartes générées) : conforme ; test existant `tests/connect-gate.php` : PASS. Cela ne prouve pas encore le refus anonyme des pages RGA sur le serveur réel.
- Socle documentaire racine/application présent ; métadonnées et liens des Markdown applicatifs modifiés vérifiés, sans erreur ; `git diff --check` conforme.
- Au contrôle HTTP de la session : AVEREO `/` répond 503 et `/user/login` 200 ; Rapport préproduction répond 401 sans identifiants. `rga.avereo.fr` ne résout pas. Aucune modification distante effectuée.
- cPanel : terminal connecté, lecture des dossiers uniquement. L’invite a été rétablie après une saisie multiligne incomplète ; utiliser une commande sur une seule ligne ou une méthode d’envoi déjà qualifiée.
- Le responsable déclare la préproduction connectée dans Chrome « AVEREO ». La fenêtre « AVEREO CONNECT » a été retrouvée. L’automatisation Windows s’est arrêtée avant toute action dans Chrome, car son contrôle de sécurité ne pouvait pas déterminer l’URL courante avec suffisamment de certitude. Aucun parcours hébergé sauvegarde/réouverture/export n’a donc été réalisé dans cette session. Le parcours local ci-dessous est une preuve distincte.
- Les sondes Géorisques de cette session n’ont pas renvoyé de réponse exploitable. Ne pas en déduire une absence de risque ou une panne générale du service.

## Recette locale du 24 octobre

Essais dans le navigateur intégré sur `http://127.0.0.1:52876/`, avec API simulée en mémoire et cas entièrement fictif Maison des Tilleuls. Aucune écriture dans une base hébergée.

- Modification d’O2, sauvegarde en ligne simulée, accueil, export préventif du brouillon, réouverture : texte retrouvé, identifiant serveur conservé, 4 observations et 3 photos conservées.
- JSON et document HTML/Word téléchargés : texte modifié et 3 photos embarquées contrôlés. Aperçu ouvert. Rendu natif Word et pagination encore à vérifier.
- Erreur 503 simulée à la réouverture : message explicite, brouillon conservé et reprise possible après annulation/rechargement.
- En-tête à 1280 × 900 et 390 × 844 : déconnexion dans l’en-tête, « Suivant » dans le pied de page ; rectangles sans intersection. Captures dans `.codex-imports/rapport-demo-20261024/logout-desktop.png` et `logout-mobile.png` (preuves locales non versionnées).
- La simulation ne qualifie pas OAuth, MySQL ni l’accès réel aux cartes. Les contrôles PHP de la garde sont distincts de la future recette hébergée.

## Prochaine action exacte

1. Retrouver un accès navigateur contrôlable à CONNECT préproduction, sans copier les mots de passe, cookies ou jetons et sans affaiblir la protection. L’interruption Windows doit être résolue avant de reprendre ses interactions ; ne pas contourner ce contrôle par extraction de session.
2. Examiner les refus anonymes des pages RGA et le rendu des cartes hébergées ; les cas locaux de réouverture et stockage sont contrôlés ci-dessus.
3. Construire le candidat avec `VITE_ENABLE_ONLINE_SYNC=true`, inventorier et empreinter l’artefact ; préparer la PR avec cases humaines décochées. Vérifier les contrôles du dépôt et l’absence de conflit.
4. Relever la configuration réelle de Rapport préproduction et conserver ses overlays d’accès. Qualifier sauvegarde/restauration et retour arrière avant remplacement, sans copie de données de production. Exécuter le contrôle de passage du protocole commun sur un suivi rempli à partir des preuves.
5. Livrer uniquement la préproduction autorisée, puis utiliser le cas fictif `maison-des-tilleuls.json` du dossier Habitologue, après export du brouillon déjà présent. Modifier O2, sauver en ligne, revenir à l’accueil, ouvrir la copie serveur, vérifier le texte et exporter JSON/Word.
6. Ouvrir et relire le Word sur le poste de séance : photos, accents, tableaux, pagination, RGA et sources. La recette humaine et l’avis métier de Philippe restent distincts des tests techniques.

TBD : candidat final, PR, reçu de livraison, recette complète, rendu natif Word et disponibilité RGA réelle. Aucun merge, déploiement de production ou accès public n’est réalisé par ce point de reprise.
