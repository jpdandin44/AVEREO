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

Copie de développement : `C:/Users/examg/Documents local/avereo-preprod-rapport-passeport`, branche `feat/rapport-demo-rga-20261024`, base `cf21b593faf9b6f4fae5e88eea3ff0117d41a074`. Candidat source `7082d422acb99f406a8d631ae8dc66b5ee428b0f`, livré en préproduction ; [PR 89](https://github.com/jpdandin44/AVEREO/pull/89) en brouillon, sans fusion. Les éventuels commits documentaires suivants ne changent pas cet artefact livré.

Le [suivi opérationnel canonique](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>) et son [point de session](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/point-session.md>) conservent les accords et preuves historiques. Ne pas remplacer les travaux locaux de cette autre copie. Le plan métier reste `priorites-demo-philippe.md` dans ce même dossier.

## État des quatre phases

| Phase | État réel | Suite |
| --- | --- | --- |
| Cadrage | Périmètre et choix d’intégration RGA établis | Conserver les critères de `requirements.md` |
| Développement local | Changements écrits ; 60 tests et build avec sauvegarde en ligne réussis | Essais locaux et affichage bureau/mobile contrôlés ; 16 contrôles techniques GitHub réussis sur le candidat |
| Préproduction | Candidat livré le 24 octobre, sauvegarde/restauration et empreintes contrôlées | Confirmer le rendu après actualisation, puis recette authentifiée complète et cartes |
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
- `VITE_ENABLE_ONLINE_SYNC=true npm.cmd run build` : réussi ; deux cartes protégées empaquetées, empreintes des sources vérifiées. Artefact et reçu exacts conservés dans le suivi canonique, bloc `demo_v1_preparation_20261023`.
- Syntaxe PHP des quatre pages RGA (index, garde, deux cartes générées) : conforme ; test existant `tests/connect-gate.php` : PASS. Syntaxe des cinq fichiers PHP candidats également contrôlée sur le serveur. Les trois pages RGA hébergées renvoient 401 sans identifiants, par la protection Basic Auth existante ; cette preuve ne remplace pas le parcours CONNECT authentifié.
- Socle documentaire racine/application présent ; métadonnées et liens des Markdown applicatifs modifiés vérifiés, sans erreur ; contrôle du diff conforme hors espaces de fin de ligne des deux exports HTML générés, conservés intacts pour respecter leurs empreintes d’origine.
- Au contrôle HTTP de la session : AVEREO `/` répond 503 et `/user/login` 200 ; Rapport préproduction répond 401 sans identifiants. `rga.avereo.fr` ne résout pas. Après livraison, la maintenance et la page de connexion ont été recontrôlées ; aucune écriture en production.
- cPanel : archive téléversée dans un dossier privé, SHA-256 vérifié, puis huit fichiers de Rapport préproduction installés. Conserver des commandes terminal sur une seule ligne. Aucun mot de passe ni cookie de session copié.
- Le responsable déclare la préproduction connectée dans Chrome « AVEREO ». La fenêtre « AVEREO CONNECT » a été retrouvée. L’automatisation Windows s’est arrêtée avant toute action dans Chrome, car son contrôle de sécurité ne pouvait pas déterminer l’URL courante avec suffisamment de certitude. Aucun parcours hébergé sauvegarde/réouverture/export n’a donc été réalisé dans cette session. Le parcours local ci-dessous est une preuve distincte.
- Les sondes Géorisques de cette session n’ont pas renvoyé de réponse exploitable. Ne pas en déduire une absence de risque ou une panne générale du service.

## Recette locale du 24 octobre

Essais dans le navigateur intégré sur `http://127.0.0.1:52876/`, avec API simulée en mémoire et cas entièrement fictif Maison des Tilleuls. Aucune écriture dans une base hébergée.

- Modification d’O2, sauvegarde en ligne simulée, accueil, export préventif du brouillon, réouverture : texte retrouvé, identifiant serveur conservé, 4 observations et 3 photos conservées.
- JSON et document HTML/Word téléchargés : texte modifié et 3 photos embarquées contrôlés. Aperçu ouvert. Rendu natif Word et pagination encore à vérifier.
- Erreur 503 simulée à la réouverture : message explicite, brouillon conservé et reprise possible après annulation/rechargement.
- En-tête à 1280 × 900 et 390 × 844 : déconnexion dans l’en-tête, « Suivant » dans le pied de page ; rectangles sans intersection. Captures dans `.codex-imports/rapport-demo-20261024/logout-desktop.png` et `logout-mobile.png` (preuves locales non versionnées).
- La simulation ne qualifie pas OAuth, MySQL ni l’accès réel aux cartes. Les contrôles PHP de la garde sont distincts de la future recette hébergée.

## Livraison et récupération

Cible : `https://rapport-preprod.avereo.fr/`, via `https://connect-preprod.avereo.fr/?app=rapport`. Archive `rapport-demo-7082d422.zip`, SHA-256 `a6c260518bd2e677ec60648bc63ca8b0e3af05fd276a84e05a068a0a36417fd3`.

Huit chemins installés : `index.php`, `index.html`, `assets/index-B4IoivhH.js`, `assets/index-D_D1yonr.css` et les quatre PHP de `rga/`. Les autres 17 fichiers existants, dont API, CONNECT et `.htaccess`, restent identiques. Configuration privée inchangée ; aucune écriture ni migration de base.

La configuration préproduction existe en mode 0600, avec base et nom de cookie distincts de la production, mode `connect_gateway` et portail CONNECT préproduction. Sauvegarde des 19 fichiers initiaux et de cette configuration ; installation puis restauration répétées dans une copie privée et empreintes initiales retrouvées. Le contrôle de passage préproduction a réussi avant livraison.

Reçus canoniques : `archives/demo-rapport-20261024/` dans le dossier opérationnel cité plus haut (`manifest.json`, `recovery.json`, `delivery.json`, preuves HTTP et captures). Dossier serveur privé : `/home/daje3540/.avereo/rapport-preprod/demo-20261024-7082d422`. `deliver.py verify` contrôle l’état livré ; `deliver.py rollback` restaure les seuls chemins du lot et refuse un état modifié depuis. Il ne restaure aucune base. Les sauvegardes restent privées.

## Prochaine action exacte

1. Confirmer après actualisation du navigateur connecté que « Se déconnecter » est dans l’en-tête et « Suivant » dégagé. Demande de confirmation envoyée au responsable ; réponse non encore reçue au moment de cette note.
2. Retrouver un navigateur contrôlable pour la recette complète, sans copier cookies/jetons ni modifier les protections. Chrome n’est toujours pas exposé aux outils de ce chat ; CONNECT interne présente une page inaccessible.
3. Avec le cas fictif `maison-des-tilleuls.json`, exporter d’abord le brouillon existant, modifier O2, sauver en ligne, revenir à l’accueil, ouvrir la copie serveur, contrôler le texte, les 4 observations et les 3 photos, exporter JSON/Word.
4. Ouvrir les deux cartes RGA après connexion et contrôler le retour vers Rapport. Vérifier séparément la réponse Géorisques réelle et ses libellés ; une indisponibilité n’est jamais une absence de risque.
5. Ouvrir et relire le Word sur le poste de séance : photos, accents, tableaux, pagination, RGA et sources. La recette humaine et l’avis métier de Philippe restent distincts des tests techniques.

TBD : recette complète authentifiée, rendu natif Word et disponibilité RGA réelle. Aucun merge, nouveau déploiement de production ou accès public dans cette itération.
