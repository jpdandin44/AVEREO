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

## Reprise active — livrables AVEREO livrés en préproduction

Livraison le 24 octobre 2026 à 21 h 19 (Paris), candidat
`5d70e41ac7d2a814e6a4a318ffe7fcc17836d2cf`, branche
`feat/rapport-demo-rga-20261024`, [PR 89](https://github.com/jpdandin44/AVEREO/pull/89)
ouverte en brouillon, sans fusion. Accord de préproduction et transfert documentaire,
sans production ni ouverture publique. AVEREO reste en maintenance.

### Candidat et récupération

- Cible : [CONNECT préproduction → Rapport](https://connect-preprod.avereo.fr/?app=rapport).
- Deux restitutions AVEREO, quatre illustrations pédagogiques, annexes propres au
  dossier, vrai DOCX et affichage fidèle des valeurs importées.
- Archive `rapport-branding-5d70e41.zip`, SHA-256
  `b09d501e247cc29a891094ea5550a71ed1a5c073e0676f5925d7221770841ac9`.
- Quatre fichiers livrés : `index.html`, `assets/index-CbZUH6kP.js`,
  `assets/index-DJfA60DM.css`, `assets/reportDocx-XuLK_hY5.js`.
  Vingt-quatre autres fichiers et configuration privée inchangés ; aucune écriture
  de base, modification OAuth, CONNECT ou production.
- Répertoire privé : `/home/daje3540/.avereo/rapport-preprod/branding-20261024-5d70e41`.
  Dans ce répertoire, `python3 deliver.py verify` vérifie l'installation ;
  `python3 deliver.py rollback` restaure le code précédent `7082d422` si l'état
  n'a pas changé depuis la livraison. Aucune restauration de base.
- Sauvegarde de 25 fichiers + configuration privée ; installation/restauration
  testées sur copie privée et empreintes contrôlées avant/après livraison.
- Preuves : `C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-branding-20261024/`
  (`manifest.json`, `delivery.json`, `recovery.json`, captures, contrôles HTTP et Word).

### Vérifications et réserve réelle

64 tests, build authentifié, contrôle racine et diff réussis ;
[CI du candidat](https://github.com/jpdandin44/AVEREO/actions/runs/40124279636) réussie ;
audit des dépendances de production sans vulnérabilité. Import, sauvegarde locale,
rechargement, reprise et export JSON : 5 observations, 4 photos et 3 annexes
conservées ; « Non qualifiée » correctement affiché. Deux DOCX produits depuis le
formulaire : expert **23 pages / 12 images**, client **5 pages / 4 images**.
Ouverture Word, rendu PDF et inspection des 28 pages réalisés. Les maquettes
éditoriales antérieures 26/6 pages restent des preuves historiques distinctes.

À 21 h 21 : AVEREO 503 maintenance, page de connexion 200, CONNECT préproduction
401, Rapport et les deux cartes RGA 303 vers CONNECT, API rapports 403 sans session.
Les trois assets servis correspondent aux empreintes du candidat.

**Recette authentifiée hébergée encore à réaliser.** Chrome est exposé mais ne
présente qu'un nouvel onglet. Ce n'est pas un constat d'échec OAuth. Aucun accès
contourné, compte technique ou fausse identité de recette. Le scénario local ne
prouve pas une sauvegarde MySQL ni une nouvelle connexion OAuth sur cette version.

### Reprendre et transmettre

La [procédure réutilisable](transmission-generation-rapports.md) décrit les champs,
le code, les crédits, l'utilisation, les contrôles et le retour arrière. Copie
privée importable : `frontend/.local/cricq-demo.json` (2,22 Mo). Une copie reste
dans le répertoire privé du lot sous `example-cricq.json`, jamais publiée dans
le document root. Word/PDF et rendus : `frontend/.local/qualification/`.

Prochaine action : exposer l'onglet connecté, exporter préventivement le brouillon,
importer le cas, sauvegarder en ligne, rouvrir, comparer JSON et DOCX, puis ouvrir
les cartes RGA. Vérifier identité et dossier cible avant création d'une copie
serveur. Revue métier, sens de DELTA et autorité de remise restent à confirmer.
Les légendes distinguent Géorisques historique, Ubakus à requalifier et Mollier
pédagogique des mesures du bien.


## Périmètre et source de vérité

Demande : priorité 1 (sauvegarde, réouverture, export) en préproduction, et ajout du RGA avec accès à la carte existante. Le responsable a choisi d’intégrer la carte à Rapport préproduction. AVEREO doit rester en maintenance.

Copie de développement : `C:/Users/examg/Documents local/avereo-preprod-rapport-passeport`, branche `feat/rapport-demo-rga-20261024`, base `cf21b593faf9b6f4fae5e88eea3ff0117d41a074`. Candidat source `7082d422acb99f406a8d631ae8dc66b5ee428b0f`, livré en préproduction ; [PR 89](https://github.com/jpdandin44/AVEREO/pull/89) en brouillon, sans fusion. Les éventuels commits documentaires suivants ne changent pas cet artefact livré.

Le [suivi opérationnel canonique](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>) et son [point de session](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/point-session.md>) conservent les accords et preuves historiques. Ne pas remplacer les travaux locaux de cette autre copie. Le plan métier reste `priorites-demo-philippe.md` dans ce même dossier.

## État des quatre phases

| Phase | État réel | Suite |
| --- | --- | --- |
| Cadrage | Périmètre et choix d’intégration RGA établis | Conserver les critères de `requirements.md` |
| Développement local | Changements écrits ; 60 tests et build avec sauvegarde en ligne réussis | Essais locaux et affichage bureau/mobile contrôlés ; 16 contrôles techniques GitHub réussis sur le candidat |
| Préproduction | Candidat livré le 24 octobre, sauvegarde/restauration et empreintes contrôlées | Affichage confirmé par le responsable ; recette authentifiée complète et cartes restantes |
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

## Confirmation humaine de l’affichage

Le 24 octobre, le responsable confirme après actualisation de sa session de préproduction : « Oui, l’affichage est corrigé ». La preuve, attachée au candidat livré, est conservée dans le suivi canonique sous `iteration20261024.humanDisplayConfirmation`. Cette confirmation ne valide pas les autres parcours du lot.

## Prochaine action exacte

La demande suivante du responsable précise la cible des exports : deux
livrables AVEREO, un dossier expert détaillé et une synthèse client illustrée.
Le [cadrage de référence](../workflows/workflow-habitologie.md#deux-livrables-avereo-demandés-le-24-octobre)
est enregistré après lecture du dossier du Cricq. Les deux modèles sont
maintenant préparés et relus : 26 pages expert, 6 pages client, Word/PDF,
photographies du dossier et schémas AVEREO. Le [paquet de revue](<C:/Users/examg/Documents local/Habitologue/Opportunité_Connect/modeles-avereo-cricq/README.md>)
porte les sources, les données réimportables, les exports natifs et les preuves.
La demande impose de montrer les rendus avant intégration : prochaine action,
recueillir les retours sur la présentation et le contenu, puis préparer le
raccordement des deux sorties. Aucun modèle nouveau n’est intégré ni livré.
Visuels enrichis avec Géorisques, AQC, ADEME, VMC, plan du Cricq, Mollier et capture Ubakus historique ; la revue reste attendue.

Le cas AVEREO CRICQ 20261024 a été importé, enregistré et rouvert localement,
avec 5 observations et 4 photos. Les exports natifs JSON/Word sont comparés.
Les accords restent faux ; aucune nouvelle visite ni qualification de risque.
Réserve à corriger : les listes pièce/élément/gravité ne représentent pas toutes
les valeurs importées (« Non qualifiée » affiche « Mineure » sans changer la
donnée exportée). Après clarification de provenance et nouveaux exports, le
dernier rechargement a rencontré ERR_NETWORK_CHANGED puis un refus de lecture
de la page d’erreur. Serveur local arrêté ; aucune recette hébergée ajoutée.
Le responsable confirme que Rapport s'ouvre dans Chrome, mais pas dans le
navigateur intégré. Le nouvel inventaire ne présente toujours aucune session
Chrome contrôlable par ce chat ; aucun nouvel essai de connexion n'est effectué.

Reprise du 24 octobre à 10:13 UTC : AVEREO affiche toujours la maintenance (503) et le formulaire Drupal reste accessible (200). La PR 89 est ouverte, en brouillon, non fusionnée et sans conflit signalé ; tête `d4f58037`, cible `cf21b593`. Les contrôles CI n’ont pas été relancés lors de cette reprise.

L’inventaire du navigateur montre CONNECT comme « Ce site est inaccessible ». La politique de sécurité du navigateur a refusé l’observation de cet onglet avant toute lecture de page. Aucun contournement ni action sur le brouillon n’a été tenté. Le responsable est invité à ouvrir et authentifier Rapport dans le navigateur intégré. La preuve détaillée et la préparation du cas fictif sont conservées dans `archives/demo-rapport-20261024/recipe-resumption.json` du suivi opérationnel canonique. Aucun parcours hébergé supplémentaire n’est validé.

1. Après l’action du responsable, vérifier que le navigateur expose bien le formulaire Rapport authentifié, sans copier cookies/jetons ni modifier les protections.
2. Exporter d’abord le brouillon existant. Importer ensuite la copie fictive préparée `.codex-imports/rapport-demo-20261024/recette-preproduction-maison-des-tilleuls.json`, référence `RECETTE PREPROD 20261024`, sans identifiant serveur préexistant. Modifier O2, sauver en ligne, revenir à l’accueil, ouvrir la copie serveur, contrôler le texte, les 4 observations et les 3 photos, exporter JSON/Word. Restaurer le brouillon initial en fin de recette si nécessaire.
3. Ouvrir les deux cartes RGA après connexion et contrôler le retour vers Rapport. Vérifier séparément la réponse Géorisques réelle et ses libellés ; une indisponibilité n’est jamais une absence de risque.
4. Ouvrir et relire le Word sur le poste de séance : photos, accents, tableaux, pagination, RGA et sources. La recette humaine et l’avis métier de Philippe restent distincts des tests techniques.

TBD : recette complète authentifiée, rendu natif Word et disponibilité RGA réelle. Aucun merge, nouveau déploiement de production ou accès public dans cette itération.
