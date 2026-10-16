---
project: avereo-app-passeport-immo
document_type: session-handoff
title: Point de reprise de session
status: active
version: git
created: 2026-10-03
updated: 2026-10-16
owner: jpdandin
tags: [passeport-immo, local, cockpit]
---

# Point de reprise de session

## Contrôle complémentaire de préproduction — 16 octobre

Le [complément de contrôle](controle-candidat-preproduction.md) consigne la nouvelle recette ciblée : candidat applicatif inchangé, neuf documents conservés, réserve sur le compte famille levée après confirmation du maintien de Rapport et Passeport Immo en préproduction. D06 et ses quinze documents approuvés restent intacts. La préparation de production ci-dessous conserve sa prochaine action et ses prérequis.


## Suite courante — accord OAuth reçu, précontrôle de sécurité bloquant

Le responsable autorise les seules routes OAuth. Les deux fichiers sont intégrés
à l’identique dans une copie isolée du site Drupal, PR nº21. Les 66 contrôles avec
le vrai service de maintenance réussissent localement et en CI ; l’hygiène réussit.
La CI échoue sur quatre alertes du verrou de dépôt. Le relevé réel des deux cibles
est distinct : six alertes sur quatre composants, validate réussi, aucune mise à
jour de base en attente. Aucun fichier du site hébergé n’est remplacé.

La [preuve courante du fournisseur](../api/oauth-provider-preparation-observation.json)
conserve l’accord reçu et le précontrôle daté. La demande de lots de sécurité
distincts est en attente ; ne pas redemander l’accord déjà acquis sur les routes,
ni désactiver la maintenance ou contourner l’audit. Reprendre ensuite sauvegarde,
restauration et recette réelle selon les règles du site, puis CONNECT/SCI.
Les 57 contrôles Passeport Immo et la sauvegarde restent les preuves datées de
l’activation précédente ; ils ne sont pas rejoués ni étendus à OAuth aujourd’hui.
D06 et les 21 références approuvées restent inchangés ; phase 3 en cours.

## Historique — activation exécutée, premier blocage OAuth identifié

Le responsable confirme « activation terminée » ; le reçu serveur constate
l’exécution à 10:44:23 UTC. Le compte dandin est habilité, le sas signé et le stockage
sont actifs. Un premier vrai cron réussit à 10:45:02 UTC sur quatre tables et neuf
fichiers ; la tâche temporaire est retirée à 10:45:51. Ne pas relancer l’activation.

La recette applicative passe 57 contrôles HTTPS à 10:52:13 UTC : deux sessions
signées indépendantes, seize fichiers vérifiés, neuf documents exacts par session,
refus anonymes et garde-fous d’écriture vérifiés sans modifier les lignes métier.
Voir le [reçu courant](../api/production-verification-observation.json).

La connexion native Drupal de dandin réussit, puis CONNECT reçoit
OAUTH_UPSTREAM_REJECTED. Le journal non sensible donne token_exchange/503, sans
erreur de transport. Les trois routes OAuth installées n’ont pas l’option de
disponibilité pendant la maintenance ; celle-ci reste active sur le site public.

Le [correctif concret](blocage-oauth-production.md) passe 27 contrôles isolés avec
les vraies classes Drupal/Symfony ; quinze autres routes restent identiques.
Les deux fichiers visés n’existent pas encore dans le module du site. Aucun fichier
Drupal, cache, rôle ou secret n’est modifié. L’accord d’extension de périmètre est
demandé dans ce chat ; vérifier sa réponse avant toute intégration ou installation.

**Prochaine action :** après accord, reprendre le clone du site Drupal et ses règles,
qualifier le correctif en préproduction, puis effectuer seulement les opérations
autorisées après leurs contrôles. Rejouer ensuite la recette OAuth réelle et la
revue humaine du lot. La phase 3 reste en cours. La PR nº83 a été fusionnée par
le responsable à 10:47:35 UTC sur la tête `08f437a` ; ses quatre attestations
humaines sont relues et la policy stricte réussit. La PR nº84 est aussi fusionnée.
Les vérifications après activation et la proposition OAuth sont préparées dans
la [PR nº85](https://github.com/jpdandin44/AVEREO/pull/85), en brouillon, avec ses propres attestations à examiner. Les 21
références approuvées et D06 restent intacts. Famille conserve son accès de préproduction.
Le contrôle de clôture refuse encore le passage en raison du blocage OAuth et de
l’absence de recette de production complète ; ces deux réserves sont consignées.

## Historique — plan CIL livré et reprise privée préparée le 16 octobre

Le [plan d’action CIL](plan-action-cil.md) et son [Word](livrables/plan-action-cil.docx)
sont produits : quatorze actions avec dépendances, livrables et critères, douze
scénarios de recette, responsabilités proposées et jalons dans les quatre phases.
Les dix pages sont inspectées après rendu Microsoft Word ; contrôle de contenu
et audit d’accessibilité réussis. Le [workflow de génération](../workflows/generation-plan-cil.md)
conserve la source Markdown comme référence. Le futur lot est mentionné dans
`developmentWorkflow.nextIteration`, sans modifier les décisions du lot courant.

La session cPanel a été reconnectée par le responsable. Domaine et dossier fermé,
base dédiée et certificat sont créés ; HTTPS vérifié, accès anonyme refusé (403).
Le compte de production dandin est confirmé explicitement et trouvé actif/completed ;
les neuf fichiers SCI sont réempreintés, six actifs et trois archives. Les deux
fichiers CONNECT sont encore compatibles avec le delta préparé. La CI de la PR nº83
passe sur `90ad618` ; son archive téléchargée est identique au candidat c44f397f…
Voir le [reçu courant](../api/production-provisioning-observation.json).

Le responsable a créé l’utilisateur SQL dédié dans cPanel, puis a autorisé les sept
droits bootstrap sur cette seule base ; leur enregistrement est confirmé par cPanel.
Les quatre sources de sauvegarde et le CLI de reprise sont déposés hors web,
en 0600 dans un dossier 0700, sans configuration ni donnée et sans exécution.

**Prochaine action :** initialisation privée sans UAPI avec saisie du mot de passe
existant par le responsable dans le terminal masqué, contrôle SQL de vacuité avant
schéma, puis retrait de CREATE et REFERENCES et vérification des cinq droits utiles.
La règle de sécurité du navigateur impose de laisser l’humain effectuer la saisie
et la création de nouvelles informations d’authentification. Le précontrôle de
l’ancien initialiseur s’arrête : UAPI JSON et la commande ordinaire exigent un binaire
absent de la session cloisonnée. Ne pas utiliser son mode d’écriture.
Configuration, schéma et clé de sas ne sont pas encore créés ; récupération et
retour arrière restent à qualifier ensuite.
La variante sans UAPI est déposée en 0600, empreinte 2ee55c7d… vérifiée. Son précontrôle
réel de fichiers réussit et conserve les trois contrôles SQL à false. La commande
humaine est préparée sans exécution dans l’onglet Terminal ; l’invite attendue demande
le mot de passe existant en mode masqué. Après succès, retirer CREATE et REFERENCES,
puis relire les droits et le reçu privé avant toute reprise SCI.
La reprise SCI, le delta et les droits CONNECT, la livraison applicative et la
recette de production ne sont pas effectués. D06 reste acquis ; aucune ouverture publique.

## Historique local du 16 octobre — reprise ciblée préparée en parallèle du plan CIL

Le [mécanisme privé de reprise d'un bien](../workflows/reprise-bien.md) est produit
et qualifié localement avec **35 assertions sous MariaDB 11.4**, sur deux bases
isolées et des données fictives. Il sélectionne le seul bien/client/documents
actifs et archivés, impose une correspondance source/propriétaire cible explicite,
vérifie les empreintes et simule avant écriture. Le rejeu exact ne crée aucun doublon ;
toute différence existante est refusée sans écrasement. Comptes, droits, secrets,
tarifs et autres biens sont exclus. Le [reçu technique](../api/property-transfer-observation.json)
conserve la portée et les limites ; le [dossier de production](04-mise-en-production.md)
donne la séquence serveur à poursuivre.

Aucune installation, migration réelle, modification de compte/droit/secret ou
ouverture publique n'est effectuée. Le candidat applicatif autorisé reste inchangé.
D06 conserve sa portée ; aucune case, décision ou événement humain n'est ajouté.
**Prochaine action :** relire la session serveur, qualifier le propriétaire CONNECT
de production et l'inventaire SCI frais, préparer la cible fermée et la récupération,
puis appliquer et rejouer la copie exacte avant la recette de production.

## Suite du 16 octobre 2026 — D06 récupérée et PR nº82 fusionnée

Le responsable a approuvé la Préproduction dans le cockpit à **09 h 05 min 11 s,
Europe/Paris** : décision **D06**, six livrables et huit critères cochés, dont le
critère 07. Commentaire exact : **« Phase approuvée, passage en prod autorisé. »**
Le suivi conserve la décision et l'événement humain intacts ; il réutilise cet accord
pour préparer la phase 3. Les quinze documents approuvés sont relus à l'identique.

La [PR nº82](https://github.com/jpdandin44/AVEREO/pull/82) est fusionnée à 09 h 00 min 55 s,
commit `d95164ea0c9863073427e82fae89e89dadeac01f`. Sa checklist humaine et la policy
stricte passent. Les CI monorepo et Passeport Immo réussissent sur la fusion ;
l'archive téléchargée est identique au candidat examiné, avec seize fichiers.
Les lots fermé, CONNECT et sauvegarde sont relus contre leurs manifestes.
Le [reçu courant](../api/production-readiness-observation.json) conserve ces preuves.

Le [dossier de production](04-mise-en-production.md) porte la suite concrète :
créer et qualifier la cible fermée, établir le propriétaire CONNECT du dossier SCI,
actualiser son inventaire après recette, qualifier la reprise sans doublon puis la
récupération et le retour arrière. Le domaine et la base de production sont toujours
absents dans cPanel ; aucune mutation hébergée n'a été réalisée pendant cette préparation.
Le contrôle de passage conserve quatre réserves techniques, sans redemander l'accord D06.

Copie de travail : `C:\Users\examg\Documents local\passeport-immo-local` ;
branche `docs/passeport-immo-execution-production`, issue de la fusion nº82.
La [PR nº83](https://github.com/jpdandin44/AVEREO/pull/83), en brouillon, conserve
ce dossier et ses preuves ; elle est rattachée à la phase 3 dans le cockpit.
Reçus privés et candidat : `.local/production-next-20261016/`.
Le cockpit reste disponible sur <http://127.0.0.1:5193/> ; prototype local sur
<http://127.0.0.1:5175/>. Phase 2 validée, phase 3 en préparation, aucune livraison
ou ouverture publique déclarée. Les modifications Projet/policy préexistantes restent séparées.

## Historique — reprise du 16 octobre 2026 — sauvegarde nocturne disponible

**Statut : historique ; la validation D06 et la suite courante sont décrites ci-dessus.**

Reprise demandée par le responsable. Le cockpit est relancé sur
<http://127.0.0.1:5193/> et le prototype local sur <http://127.0.0.1:5175/>.
Le prototype utilise son stockage navigateur ; la revue de phase 2 reste celle
de la préproduction hébergée, selon le [guide de recette](recette-preproduction.md).

La sauvegarde prévue cette nuit est observée en succès à **03 h 20 min 02 s,
Europe/Paris, le 16 octobre**. Le [reçu de lecture](../api/nightly-backup-observation.json)
rapproche `status.json`, `latest.json`, `complete.json` et `scheduler.log` :
quatre tables, neuf documents, deux copies conservées sur une rétention cible
de trente succès. Les neuf fichiers sont aussi visibles dans le gestionnaire cPanel.
Le travailleur déclare les contrôles de fichiers et la récupération temporaire
réussis, sans changement des lignes actives. Cette reprise lit ces résultats ;
elle ne réexécute ni le calcul des empreintes ni une restauration indépendante.

Le dossier de cette copie et son compte rendu `complete.json` sont ouverts dans
le navigateur intégré. Le [mode d'accès](sauvegarde-automatique.md#retrouver-les-copies-et-diagnostiquer-un-echec)
donne le chemin à saisir dans cPanel ; aucun lien de session privé n'est conservé.

**Prochaine action :** le responsable examine la preuve, puis renseigne le critère 07
et termine la revue de Préproduction. Le suivi conserve les phases 0 et 1 validées,
la phase 2 « À valider » et la phase 3 non démarrée. Aucune case humaine, décision,
autorisation de production ou donnée hébergée n'est modifiée par cette reprise.
Les notes restent locales, non commitées ; les travaux préexistants sont conservés.
L'état GitHub ci-dessous est celui observé le 15 octobre, à recontrôler avant toute
intervention sur la PR ou livraison.

## Historique — clôture du 15 octobre 2026 — attendre la sauvegarde nocturne

**Statut : historique, remplacé pour la reprise par le constat du 16 octobre ci-dessus.**

Session close à la demande du responsable. Il souhaite vérifier la sauvegarde
automatique de cette nuit avant de valider le **critère 07 de la phase 2 —
Préproduction**. La prochaine échéance documentée est le **16 octobre 2026
à 03 h 20, Europe/Paris**. Son résultat n'est pas encore observé à la clôture.

À cette clôture, le [suivi canonique](suivi-chantier.json) portait `sessionHandoff.status =
closed_on_user_request`. Les phases 0 et 1 restent validées, la phase 2 reste
« À valider » et la phase 3 non démarrée. Aucune validation, reprise automatique,
livraison ou migration n'est déclenchée par la clôture.

### Première action à la reprise

1. Lire la [procédure de sauvegarde](sauvegarde-automatique.md), puis consulter
   en lecture seule `status.json`, `latest.json` et `scheduler.log` dans
   `/home/daje3540/private/passeport-immo-backups/preprod` via cPanel.
2. Vérifier un nouveau succès correspondant à la nuit du 15 au 16 octobre,
   après l'échéance prévue. Le dernier succès déjà prouvé est celui du
   **15 octobre à 13:34:02 UTC**, issu du déclenchement de qualification ; il ne
   prouve pas l'exécution de cette nuit. Si la copie est absente ou en échec,
   conserver le diagnostic et examiner la planification avant toute relance.
3. Examiner la copie pointée, son marqueur de fin et les résultats de contrôle :
   quatre tables, inventaire documentaire réel, tailles/empreintes et récupération
   temporaire. Le dernier reçu comptait neuf documents, actifs et archives inclus ;
   rapprocher les nombres du contenu réel au moment de la copie. La rétention vise
   les trente derniers succès ; elle ne signifie pas que trente copies existent déjà.
4. Conserver un reçu sans secret ni donnée personnelle, puis laisser le responsable
   valider le critère 07 et terminer la revue dans le cockpit. La validation de
   phase, le merge de la PR et l'accord de production restent des décisions distinctes.

La tâche de sauvegarde s'exécute sur l'hébergement et ne dépend pas du PC.
Aucune tâche distante n'est modifiée pendant cette clôture. La production reste
à préparer selon [son dossier](04-mise-en-production.md) ; le choix de reprendre
le dossier SCI est conservé, sans transfert effectué.

### État conservé pour la prochaine session

- Copie de travail : `C:\Users\examg\Documents local\passeport-immo-local`.
- Branche : `docs/passeport-immo-qualification-production` ; dernière tête publiée
  `8db97ea2a547cf20423c713ce0a609512a8c6d0e`.
- [PR nº82](https://github.com/jpdandin44/AVEREO/pull/82) ouverte en brouillon,
  relue à la clôture : 18 contrôles techniques réussis et état GitHub sans conflit
  avec `main` `2995a2b95003016df0fefa84b34353c34dc5fee0`.
- Notes de clôture et tableaux dérivés conservés localement, non commités et non
  poussés. Les travaux préexistants d'AVEREO Projet et de la policy restent séparés.
- À 21 h 39 à Paris, la vue ouverte du cockpit présente 0/6 livrables examinés,
  0/8 critères cochés, un commentaire vide et aucune confirmation cochée. Ce constat
  porte sur cet onglet uniquement ; aucun brouillon coché n'y est observé à sauvegarder.
- L'onglet de revue est conservé. Aucun service local n'est arrêté par cette clôture.
  Après fermeture du PC, relancer le cockpit avec [start-review.cmd](../start-review.cmd)
  si nécessaire ; le [guide d'accès](acces-suivi-local.md) précise que les brouillons
  non enregistrés restent propres à la page, contrairement aux décisions sur disque.

Les observations suivantes sont historiques. À la reprise, vérifier les états
GitHub et hébergés avant d'utiliser leurs constats datés.

## Historique — qualification après fusion de la PR nº81 — 15 octobre 2026

La PR nº81 est fusionnée dans `main` au commit
`2995a2b95003016df0fefa84b34353c34dc5fee0`, avec ses quatre cases humaines cochées.
Les CI du monorepo et de Passeport Immo réussissent sur ce commit. Le workflow
prototype GitHub Pages reste en échec ; il n'est pas le déploiement de cette application.

Copie de travail : `C:\Users\examg\Documents local\passeport-immo-local`.
Branche : `docs/passeport-immo-qualification-production`.
Le [dossier de production](04-mise-en-production.md) est la procédure de reprise ;
la [preuve de qualification](../api/qualification-production-observation.json)
conserve les constats et les lots exacts. Les fichiers privés sont dans
`.local/production-qualification-20261015/` ; ils restent hors Git.

Après reconnexion du responsable, cPanel confirme l'absence du domaine de production,
de son dossier et des emplacements privés Passeport Immo. Deux résolveurs confirment
NXDOMAIN. CONNECT de production répond en HTTPS mais n'a ni paramètres de lancement,
ni entrée de catalogue, ni droits Passeport Immo. Sa base et les deux fichiers à adapter
sont identifiés en lecture seule ; aucune donnée personnelle ou valeur de secret restituée.

Préparations locales : archive fermée de 16 fichiers (15 identiques au candidat),
adaptation CONNECT limitée à trois lignes, sauvegardes avec environnements séparés.
Contrôles réussis : 36 tests backend historique, 15 assertions du sas, 19 tests Python,
30 assertions API/stockage et 22 assertions de sauvegarde sous MariaDB isolée.
Aucun fichier, domaine, base, droit ni cron modifié sur l'hébergement.

**Données initiales retenues :** reprise du dossier SCI de préproduction, selon la
réponse du responsable du 15 octobre. Le [plan de reprise](04-mise-en-production.md#reprise-du-dossier-sci)
préserve les documents actifs et archivés ; aucun transfert réalisé ou autorisé
par ce seul choix.

**Prochaine action :** consigner la décision de phase 2, qualifier le propriétaire
CONNECT de production et actualiser l'inventaire du dossier SCI, puis autoriser
la cible fermée, le raccordement et le transfert exacts décrits dans le dossier.
La récupération et la recette sur la production restent à qualifier.
Les quatre phases, décisions et documents approuvés sont conservés. Les changements
locaux préexistants d'AVEREO Projet restent séparés du lot.

Les sections suivantes conservent les observations datées antérieures ; leurs
anciennes mentions de PR ouvertes ou d'actions futures ne sont pas le statut courant.

[PR nº82 en brouillon](https://github.com/jpdandin44/AVEREO/pull/82) : qualification et outillage de production à relire ; aucun déploiement.

## Historique — reprise après fusion de la PR nº80 — 15 octobre 2026

La PR nº80 est fusionnée dans `main` au commit
`437f2689e8ea5a0f12e055be9e2b8713bf99b1bd`. Le dossier
[04 mise en production](04-mise-en-production.md) prépare la suite demandée.
[PR nº81 en brouillon](https://github.com/jpdandin44/AVEREO/pull/81) : préparation à relire, sans livraison.

La branche de préparation est `docs/passeport-immo-preparation-production`, dans
la copie modifiable `C:\Users\examg\Documents local\passeport-immo-local`.

Les CI du monorepo et de Passeport Immo ont réussi. L'archive téléchargée est
identique au candidat installé en préproduction ; le lot privé de sauvegarde
est vérifié séparément. Les [preuves](../api/preparation-production-observation.json)
identifient les artefacts, leurs empreintes et leur copie locale ignorée par Git.
Le workflow distinct du prototype GitHub Pages échoue sur sa configuration Pages ;
aucun paramètre de déploiement n'est modifié.

**Adresse retenue :** `https://passeport-immo.avereo.fr`, confirmée par le responsable
le 15 octobre 2026. **Prochaine action :** consigner la décision formelle de phase 2,
puis qualifier cette cible de production et CONNECT en lecture seule.
La cible, le contenu initial, les accès privés et la récupération restent à établir
avant un accord de déploiement précis. La phase 3 reste non démarrée.

Vérifications de la préparation : 19 tests Python réussis, raccordement du cockpit
et parité conformes, tableaux régénérés et contrôlés, neuf documents approuvés
inchangés. Le contrôle de production refuse le passage : les huit prérequis
manquants sont conservés dans la preuve, sans contournement.

Le suivi et les tableaux dérivés décrivent cet état. Les décisions et documents
approuvés restent inchangés ; les modifications locales préexistantes d'AVEREO Projet
sont conservées à part. Les sections suivantes sont des observations historiques,
notamment celles où la PR était encore ouverte.

## Résolution des conflits GitHub — 15 octobre 2026

La [PR #80](https://github.com/jpdandin44/AVEREO/pull/80) est réalignée sur
`main` au commit `db7858ff110f5ceb954079532257d6619ca28e0c` après la fusion
historique de la PR #79. Les deux conflits sont documentaires : le rapport de
vérification conserve les observations plus récentes de cette branche et le
changelog racine conserve les entrées des deux branches. Le préparateur de
préproduction est identique à celui de la tête précédente `6daface` ; les apports
CONNECT de `main` sont conservés. Le suivi humain et les preuves approuvées de
Passeport Immo ne sont pas modifiés par la résolution.

Avant remise : contrôler la fusion avec la tête actuelle de `main`, le diff,
les tests locaux concernés puis l'état de fusion et les contrôles GitHub après
envoi. Les quatre cases de la PR étaient cochées lors de la lecture du 15 octobre ;
cette observation reste distincte d'une nouvelle décision de phase et d'une
qualification de production. Les sections suivantes conservent leur état daté.

Contrôles locaux de la résolution : 19 tests Python Passeport Immo et 6 tests du
contrôleur de PR réussis, parité et raccordement du cockpit conformes. Les neuf
documents approuvés conservent leurs empreintes ; les fins de ligne de la copie
de résolution Windows ont été rematérialisées depuis les blobs Git pour retrouver
leurs octets exacts. Trois documents, 57 liens locaux et les deux socles sont
contrôlés sans défaut. Le contrôle strict de la description doit porter sur les
cases réellement conservées sur GitHub, sans les recocher au nom du responsable.

## Recette humaine préparée — 15 octobre 2026

Le [guide de recette](recette-preproduction.md) est le point d'entrée courant.
Le cockpit local reste sur le port 5193 et la source réelle `docs/suivi-chantier.json`.
La phase 2 Préproduction est remise techniquement « À valider » avec six livrables
et huit critères. Les décisions et événements humains restent inchangés ; aucune
case cochée par l'agent. Les preuves approuvées des phases 0/1 sont conservées.
Relire les livrables, faire les essais sur la cible hébergée et un bien fictif,
puis laisser le responsable enregistrer sa décision et revoir la PR nº80.
La production reste non commencée et sans autorisation nouvelle.

## Sauvegarde automatique demandée — 15 octobre 2026

La [sauvegarde automatique](sauvegarde-automatique.md) est active : 03 h 20
Europe/Paris, trente copies complètes réussies, répertoire privé dédié. Premier
succès réellement déclenché par cron à 13:34 UTC, copie des quatre tables et neuf
documents vérifiée. Les autres lignes de crontab et les copies manuelles sont
conservées ; entrée provisoire retirée. Le [reçu](../api/automatic-backup-observation.json)
porte les empreintes et contrôles. Scripts source `652ef6d63cddea3e343c39a616be9cf1f9500ecd`,
lot `dd574fb98b8fe770f4c33c2fd2bacf76e17963c58aaa9c056e070d3326798ae1`.
Consulter `latest.json` et `status.json` dans le répertoire privé pour les prochains
résultats ; le reçu Git est un constat daté. Prochaine action : revue humaine de la PR nº80.

## Stockage documentaire demandé — 15 octobre 2026

Lot g installé et vérifié ; [conception et recette](stockage-serveur.md),
[reçu courant](../api/storage-observation.json). Candidat `7209bf3334a5f3f98d422b41d177c734970a0750`,
ZIP `c44f397fd03daa433f19e6d4c72127f29e55dbf9fca679e8c7f41cc207a843cf`.
Base dédiée, répertoire privé et neuf documents SCI opérationnels. Reprendre depuis
la revue humaine et la PR nº80 ; aucun nouvel import par navigateur.
Ne pas rejouer l’installation initiale ni écrire sur les bases CONNECT.
Les preuves antérieures de recette navigateur ci-dessous restent historiques.

## Correction SSO et dossier importé — 15 octobre 2026

Le candidat `8f7b26f84b50e0f36a9763a3744d18a9169f27b4`, ZIP
`84d1613183b6041518a9c5f5f528adfd55ceaa913e39b4ebf05d9fd419645575`,
est installé en préproduction privée. L'entrée et les règles d'accès protègent
HTML et tous les assets par cookie signé. La porte Basic propre à Passeport Immo
est retirée ; CONNECT conserve sa porte et ses habilitations. Une page 403 héritée
a été reproduite localement puis neutralisée. Sauvegardes et restaurations ciblées
répétées avant remplacement, douze fichiers relus, neuf contrôles CI et douze
contrôles HTTPS conformes. Les [reçus](../api/preproduction-sso-observation.json)
conservent les deux candidats successifs et les preuves datées.

Le ticket normal du compte choisi ouvre l'application dans le navigateur intégré,
sans nouvelle saisie ; styles, scripts, worker et deux pages des coupes chargés.
Le responsable confirme ensuite dans Chrome : « La troisième fenêtre a disparu ».
La recette complète de déconnexion et la revue humaine restent ouvertes ; le
bouton interne « Se connecter » et le profil Admin Démo restent ceux du prototype.

Le bien de la SCI est importé sur l'origine HTTPS dans le navigateur intégré :
six documents actifs et trois archivés, titres/catégories repris, conservation
après réouverture et neuf téléchargements identiques aux sources vérifiés.
**Ce dossier n'est pas partagé avec Chrome.** La sauvegarde privée serveur est
conservée ; les nouvelles dates d'import sont celles du 15 octobre, le manifeste
privé garde l'historique. Aucun serveur de documents métier n'est ajouté.

PR nº80 reste le support de la correction et de ses preuves. Les décisions et
statuts humains restent conservés ; aucune fusion ou livraison de production.
Le [rapport courant](03-preproduction.md) précise le périmètre et les réserves.
La question distincte sur la version de Rapport est contrôlée en lecture seule
dans le clone `preprod-acces-local`, sans installer ce lot depuis Passeport Immo.

Prochaine action : terminer la recette de déconnexion/revue et préciser le
navigateur de travail du dossier. Les sections suivantes conservent l'historique.

## Préproduction privée installée — 15 octobre 2026

cPanel reconnecté et compte habituel confirmé par le responsable. L'autorisation
déjà exprimée dans le chat est rattachée au candidat exact ; les décisions,
événements, dates et statuts de phase humains restent conservés. Le contrôle de
passage a réussi avant installation, après vérification des cibles réelles et
de la récupération des données ciblées. Cette trace ne crée pas une nouvelle
acceptation de phase ou de production.

Le [rapport de préproduction](03-preproduction.md) donne le résultat et les reçus :
installation des douze fichiers applicatifs et des deux fichiers CONNECT compatibles,
paramètres privés, catalogue actif et droits ciblés. Autres paramètres et protection
CONNECT conservés ; deux autres comptes existants refusés pour cette application.
Masque privé corrigé sur les deux sous-dossiers publics après refus 403 ; six
ressources reçoivent ensuite 401 Basic avec TLS valide. Le test du sas installé
accepte le ticket de l'émetteur réel et refuse signature invalide, expiration,
autre application et rejeu. Les secrets et tickets restent uniquement sur le serveur.

La sauvegarde du bien et de ses neuf documents est reçue et relue dans un dossier
privé hors site public : six actifs, trois archivés. **Elle n'est pas encore importée
dans l'application HTTPS.** Le stockage reste lié au navigateur et à l'origine.
Le navigateur intégré échoue à la porte visiteur ; une recette humaine dans Chrome
avec le compte choisi est demandée. Ensuite, terminer l'import, vérifier PDF,
classement et persistance. Les versions locales et la copie privée sont conservées.
PR nº80 toujours ouverte en brouillon au contrôle de cette reprise ; aucun merge
ou changement de production. Le moteur Projet local est préservé séparément.

Les sources impactées sont le présent point, le [rapport](03-preproduction.md),
le [suivi](suivi-chantier.json), ses vues, [README](../README.md),
[architecture](../architecture.md), [roadmap](../roadmap.md),
[décisions techniques](../decisions.md), [changelog](../changelog.md),
[qualification](qualification-preproduction.md), [vérification](verification-preproduction.md),
[runbook](deployment.md) et [index des reçus](../api/README.md).

Bilan documentaire : politique globale appliquée, socles racine et application
présents ; 35 documents Markdown et 189 liens locaux contrôlés sans erreur.
Les 19 tests Python, contrat cockpit, parité, vues générées et baseline passent.
Les preuves approuvées restent intactes. Aucun problème documentaire détecté
dans ce périmètre ; les deux réserves fonctionnelles sont la recette réelle et
l'import du dossier, conservées dans le suivi. Le passage en production est
contrôlé et reste refusé.

## Installation demandée et accès interrompu — 15 octobre 2026

Le responsable demande explicitement de poursuivre le raccordement et
l'installation en préproduction privée, avec son compte CONNECT habituel et le
transfert du bien de la SCI. Cet accord de périmètre est acquis dans le chat ;
il ne faut pas le redemander pour ces mêmes opérations. Aucune validation de
phase, décision ou case humaine n'est ajoutée au cockpit par l'agent.

Une nouvelle inspection authentifiée à 07:04 UTC retrouve les empreintes CONNECT
attendues, cinq applications actives sans Passeport Immo et trois comptes actifs.
L'identité du compte habituel reste à préciser par le responsable avant création
des droits ciblés. Les rôles existants sont conservés. Le relevé détaillé reste
uniquement dans le dossier privé d'installation sur le serveur.

Les neuf documents du cas ont été téléchargés par leurs commandes existantes,
avec leur classement : six actifs et trois archivés. Métadonnées du bien,
manifeste et archive de transfert sont conservés hors Git dans
`.local/preproduction-installation-20261015/`. Le reçu privé
`transfer-verification.json` constate tailles, SHA-256, relecture des octets et CRC.
Ces données ne sont ni téléversées ni importées sur l'origine HTTPS à ce stade.
Le stockage V1 reste propre au navigateur et à l'origine ; aucune base documentaire
partagée n'est ajoutée.

Le [relevé d'accès courant](../api/preproduction-access-observation.json) constate
401 Basic sur CONNECT et son healthcheck, 403 sur Passeport Immo, TLS valide.
Le navigateur intégré échoue avant la connexion CONNECT avec
`ERR_INVALID_AUTH_CREDENTIALS`. Cela ne prouve pas un mot de passe CONNECT erroné,
ni une incompatibilité générale du navigateur. La session cPanel précédente
n'est plus accessible ; son nouvel onglet affiche l'identification. Reconnexion
cPanel et choix du compte ont été demandés, sans transmission de secrets au chat.
Les services locaux arrêtés ont été relancés : HTTP 200 sur 5175 et 5193.

Reprise : rétablir cPanel, confirmer le compte de recette, qualifier la
récupération des données de catalogue, puis installer les mêmes archives
identifiées et leurs paramètres privés. Tester ensuite le parcours réel et
importer le dossier sur la nouvelle origine privée en conservant les archives.
La préparation de transfert est vérifiée ; installation et migration restent
non réalisées. La PR nº80 reste en brouillon, sans merge effectué par l'agent.

Bilan documentaire de cette reprise : [suivi canonique](suivi-chantier.json),
[vues du cockpit](tableau-de-bord.md), [rapport de vérification](verification-preproduction.md),
[relevé d'accès](../api/preproduction-access-observation.json),
[index des intégrations](../api/README.md), [roadmap](../roadmap.md),
[changelog](../changelog.md) et présent point actualisés. Socles racine/application,
34 documents Markdown, 161 liens locaux, contrat cockpit, parité et vues générées
contrôlés sans erreur. Les preuves approuvées restent intactes. Le contrôleur de
passage refuse encore les prérequis hébergés manquants et l'accord exact non
enregistré dans son bloc formel ; ce dernier constat ne retire pas l'autorisation
reçue dans le chat et ne justifie pas de la demander de nouveau.

## Vérification hébergée après reconnexion — 15 octobre 2026

cPanel authentifié ; catalogue CONNECT lu sans écriture et base distincte de
production vérifiée. Passeport Immo absent du catalogue, des droits actifs et des
paramètres de lancement ; sas privé et dossier anti-rejeu absents. Sa cible déclarée
contient seulement `.htaccess` et `cgi-bin`, fermée à tous. Les octets du fichier
de fermeture correspondent encore à la sauvegarde et restauration du 6 octobre.
Le [relevé sans secrets](../api/connect-hosted-observation.json) porte les faits.

Le delta initial CONNECT est refusé sur les empreintes hébergées. Les deux fichiers
correspondent exactement à la base Git `76566ca43b3e1e03a4a465391aac2f99017517cb`.
Variante limitée à trois lignes de lancement préparée : 32 tests du backend
historique, 15 assertions du sas et 19 tests Python réussis. Les autres fichiers
CONNECT et sa protection restent inchangés. Le [runbook](deployment.md) donne la
commande et exige une nouvelle vérification des empreintes avant installation.

Une [répétition hébergée](../api/connect-recovery-observation.json) sauvegarde et
restaure ensuite dans un dossier privé l'arbre Passeport Immo, les deux fichiers
CONNECT et sa configuration privée. Octets et permissions conformes ; emplacements
actifs inchangés, aucune base ni valeur de secret exportée.

Suite : choisir le compte de recette et son accès ciblé, préparer les paramètres
privés et le catalogue avec sa récupération de données, puis présenter le
candidat exact pour l'accord d'installation. La PR nº80 reste en brouillon.
Aucune installation, modification de secret, migration ou création de droit.
Les phases et l'approbation D05 restent inchangées. Le moteur Projet local conserve
ses modifications antérieures séparées de ce lot.

## Raccordement demandé après préproduction CONNECT — 14 octobre 2026

Le responsable indique CONNECT en préproduction et demande le raccordement puis
la préparation de Passeport Immo. Le lot est sur `feat/passeport-immo-connect-preprod`.
Sas commun copié au build, protection du HTML/routes, entrée et déconnexion PHP,
clés URL/SECRET reconnues côté CONNECT et catalogue proposé sans droit automatique.
Les cinq livrables approuvés D05 et toutes les décisions restent intacts.

Contrôles locaux : 15 assertions du contrat, 18 assertions sur Apache, 38 tests
backend, 26 tests frontend, 15 tests Python, build et parité réussis. Le candidat
contient douze fichiers ; l'archive de préparation est fermée et restaurée localement.
Le delta CONNECT contient seulement deux fichiers, avec préconditions d'empreinte.
Le [rapport](02-integration-connect.md) et le [runbook](deployment.md) décrivent
le fonctionnement, les limites du prototype et la recette encore nécessaire.

Le contrôle public confirme 401 Basic sur CONNECT et 403 sur Passeport Immo.
La session cPanel de ce chat est expirée ; une reconnexion est demandée. Le contenu
réel du catalogue et les paramètres hébergés restent non qualifiés. Aucun déploiement,
nouveau droit, secret réel ou migration n'est réalisé. Après reconnexion : relever
versions et cible, qualifier récupération et configuration, puis présenter le
lot exact pour l'accord applicable et la recette privée.

## Approbation locale enregistrée — 14 octobre 2026

Le responsable confirme la validation locale et la fusion de la PR nº78.
La relecture du cockpit constate l’approbation D05 des cinq livrables du lot
documents/coupes et de ses trois critères. Les empreintes approuvées sont
vérifiées ; ces documents restent figés dans leurs octets examinés. La fusion
de la PR est revérifiée sur GitHub. Le résumé `developmentWorkflow` est réaligné
sur cette décision existante, sans créer d’accord ni modifier les phases.

Le responsable indique travailler actuellement à la mise en préproduction de
CONNECT dans son lot distinct ; son achèvement n’est pas vérifié ici. La suite
Passeport Immo attend cette qualification : vérifier ensuite le raccordement
CONNECT, les accès privés et la récupération, puis préparer la recette privée
du candidat exact. Préproduction Passeport Immo reste non démarrée et sans
autorisation enregistrée ; aucun déploiement n’est lancé dans cette session.

## Préparation CONNECT et vérification de préproduction — 14 octobre 2026

La demande du responsable prépare CONNECT et les vérifications nécessaires à
Passeport Immo. Le [rapport](verification-preproduction.md) et le bloc canonique
`developmentWorkflow.preproductionVerification` conservent les constats.
Le candidat courant est retrouvé dans son archive CI et préparé séparément,
avec les sept assets conservés, fermeture initiale et restauration locale vérifiées.
Le lanceur de préparation accepte désormais `--output` pour préserver les archives
historiques. Onze tests Python, parité et contrat du cockpit passent.

Le lot distinct CONNECT possède maintenant une sauvegarde réelle de base, une
restauration hébergée et une répétition de migration sur clone, avec la base source
inchangée. Le module et la configuration d’activation restent à compléter avant
mise à jour du portail actif. Le sas, le catalogue et les paramètres de lancement
Passeport Immo restent absents ; la préparation de ses fichiers ne les implémente pas.
La cible publique reste fermée (403). Le passage hébergé reste en refus.

Le suivi vivant porte l’approbation D05 du lot documents/coupes, constatée lors de
cette reprise ; elle reste conservée avec ses preuves. Les phases, décisions,
revues, candidat et accords sont préservés. Le présent travail ne crée pas d’accord
sur l’intégration CONNECT ou sur une livraison. Le moteur Projet local est conservé.

## Accès au cockpit et revue de la PR nº78 — 14 octobre 2026

Le responsable signale que le suivi local est indisponible après fusion de la
PR nº78. Aucun service ne répond sur 5193 ; le cockpit est relancé en arrière-plan
avec son lanceur de revue existant. HTTP 200, lecture du suivi et synchronisation
GitHub sont contrôlés ; la carte indique désormais « Fusionnée ». La fusion
GitHub est observée le 14 octobre à 15:47:20 UTC, au commit
`c45812cc97d91062d562be2370d032b1977232fc`, pour le HEAD
`81b757b096887af942f2dc9c965bada4b0e23a9d`. La revue approuvée et les quatre
cases humaines de la PR sont constatées, sans les convertir en validation de phase.

Le diagnostic distingue l'arrêt du serveur du blocage fonctionnel : la phase
Développement local mélange le lot documents/coupes livré avec CONNECT non livré.
Ses cinq documents présents étaient consultables, mais le sixième livrable absent
empêchait « Soumettre à la revue », puis « Approuver la phase ». Le responsable
précise que la revue porte sur le lot documents/coupes, avec CONNECT conservé
comme prérequis de préproduction. La phase Développement local a été remise
« À valider » : cinq documents et trois critères ; D05 a ensuite été enregistrée
par le responsable, comme indiqué dans le point courant ci-dessus.
CONNECT et ses deux critères sont conservés dans les attentes de Préproduction,
avec blocage explicite avant toute installation distante. Le
[mapping courant](mapping-phases.md) décrit cette portée ; la clarification est
consignée dans le JSON, sans écrire de décision humaine ni changer l’historique.

Les 58 tests ciblés du moteur de revue, les onze tests Python Passeport Immo,
le contrat du cockpit et les vues générées passent. Sur une copie temporaire,
une approbation complète crée une décision D05 distincte, conserve D01 à D04
et laisse Préproduction non démarrée ; une revue aux critères incomplets est
refusée. Cette recette n’approuve pas le chantier réel. Le contrôle du cockpit
accepte désormais de futures décisions humaines tout en vérifiant la présence
des identifiants historiques et le maintien de CONNECT dans les prérequis.
Les 31 documents Markdown et 107 liens locaux sont contrôlés, socles présents.
Les documents historiques approuvés, décisions et journaux sont préservés.
Le lot du moteur Projet déjà présent reste local et séparé de la PR nº78 fusionnée.

## Session clôturée le 3 octobre 2026 au soir

Le responsable demande de confirmer le rattrapage du suivi puis d'arrêter la
session pour aujourd'hui. L'état canonique est dans [suivi-chantier.json](suivi-chantier.json) :
phases 0 et 1 validées, phase 2 autorisée et démarrée, PR nº74 fusionnée.
Le livrable CONNECT de phase 2 reste à produire ; aucun travail de cette phase
n'est lancé après cette clôture. Les phases ultérieures ne sont pas démarrées.

Le lot cockpit est conservé **localement, sans commit, push ni nouvelle PR** sur
`feat/projet-github-sync`. Il vérifie les PR chaque minute, conserve les cases et
commentaires pendant la revue, propose le chargement explicite des preuves
modifiées et un passage forcé motivé. Ce passage a été testé seulement sur une
démonstration. Les décisions humaines locales et leurs fichiers générés restent
préservés séparément ; ne pas les inclure mécaniquement dans le futur commit du moteur.

Le blocage de phase 0 provenait de la réécriture de la fiche d'itération après
approbation. Ses octets approuvés ont été restaurés depuis la sauvegarde de revue
après contrôle de l'empreinte, sans changer l'accord humain. La fiche est désormais
historique ; les cartes et tableaux du cockpit affichent le suivi actuel.

Contrôles finaux : 157 tests et build Projet, 10 tests Python Passeport Immo,
vues générées et empreintes approuvées conformes. Le guide, le contrat et l'audit
du moteur sont mis à jour ; périmètre documentaire : ces deux sous-projets.

**Reprise uniquement sur demande explicite.** Relire l'état Git et le suivi,
publier le lot cockpit dans une PR de revue, puis reprendre le lot CONNECT de
phase 2 dans son périmètre autorisé. Préproduction : dossier et HTTPS fermés
disponibles, accès privé utilisable et récupération hébergée à qualifier ; aucun
fichier applicatif installé. Les accords d'installation et de publication restent
distincts. Vérifier les ports 5175 et 5193 au prochain lancement.


## Reprise demandée dans AVEREO_2

Le 2026-10-03, le responsable demande explicitement de reprendre le fichier et
de lancer la reprise de Passeport Immo dans ce nouveau chat. Le clone existant
et les modifications de préparation sont relus ; la branche dédiée est conservée.
L'application et le cockpit répondent sur leurs ports locaux. La reprise est
consignée dans `sessionHandoff`, en conservant la date de clôture précédente.

Le lot a été publié dans la [PR nº74](https://github.com/jpdandin44/AVEREO/pull/74),
puis fusionné par le responsable ; la fusion a été vérifiée. Aucune installation
distante de l'application n'a été effectuée. Son
observation GitHub et les preuves de publication sont enregistrées dans
`developmentWorkflow.preproductionPreparation.publication`, puis affichées par
la fiche générée. Le candidat métier, les validations de phase et les accords
restent ceux du suivi existant. L'accès privé de consultation reste à préciser.
Le responsable retient le sous-domaine proposé et privilégie une lune gratuite si
disponible. L'adresse demandée et cette préférence sont dans
`developmentWorkflow.targets.preproduction`, affichées dans la fiche générée.
Après correction de l'URL par le responsable, cPanel est accessible et authentifié.
La lune préparée est constatée active, avec accès à son cPanel. Le diagnostic montre
que Mon Univers Web bloque l'affichage dans un panneau étroit ; le test en largeur
ordinateur fonctionne. Chrome n'est pas accessible aux outils de cette session.
Après vérification de la restriction o2switch entre comptes, le responsable conserve
l'adresse demandée sur le compte qui héberge `avereo.fr`, avec un dossier dédié protégé.
La première session cPanel est invalidée au retour vers le compte parent. Après
reconnexion du responsable, l'accès authentifié au compte parent est vérifié ; dossier
dédié hors `public_html` et sous-domaine sont créés. Le seul fichier présent est le
modèle `.htaccess` fermé, enregistré puis relu. Un certificat gratuit est simulé puis
installé par validation DNS, sans retirer cette fermeture. L'adresse HTTPS affiche
403 dans le navigateur ; Python valide le certificat et reçoit le même refus avec
l'en-tête d'interdiction d'indexation. Aucun fichier applicatif n'est installé.
Accès privé de test, récupération hébergée et lot CONNECT restent à qualifier.
Les observations datées et la prochaine action sont dans
la cible canonique et la [qualification](qualification-preproduction.md).

## Historique de clôture avant cette reprise

Le 2026-10-03, le responsable demande de documenter l'état puis de reprendre dans
un nouveau chat du projet **AVEREO_2**, afin de séparer les contextes. Ce point est
le relais du clone source ; le document de reprise du projet AVEREO_2 renvoie ici.
La clôture précédente est conservée dans `sessionHandoff` du suivi canonique.
La demande explicite du nouveau chat autorise la présente reprise ; elle ne
constitue pas une validation de phase.

À cette clôture, les modifications du lot étaient conservées localement sur
`feat/passeport-immo-preproduction`, à partir de la fusion nº72. Aucun nouveau commit,
push ou PR n'avait été créé pour ce lot. Une description de PR était seulement préparée dans
`.local/preproduction-preparation/pr-body.md` et sa forme est contrôlée en mode
prépublication, toutes les cases humaines décochées. Aucune CI distante de ce lot
n'avait été observée. Les serveurs locaux de l'application et du cockpit restaient actifs
à la clôture ; vérifier leur disponibilité lors de la reprise.

Contrôles du lot : six tests de préparation, raccordement au contrat du cockpit,
parité a/b/c+d, relecture du lot fermé, restauration locale, vues dérivées et
cohérence documentaire réussis. Le contrôleur de passage refuse la préproduction
pour les prérequis absents ; ce refus est attendu. La carte de la PR nº72 fusionnée
est vérifiée à l'écran en phase 0. Les 33 documents et 98 liens locaux du sous-projet
et des index racine sont vérifiés ; décisions, événements humains, statuts/dates de
phase, candidat, cibles, accords et livraison restent conservés. Audit des autres
applications et installation distante : non effectués.

## Disponible
Prototype local React/Tailwind après phase 0, puis raccordement demandé au protocole
GitHub/cockpit et correction PDF autorisée. Quatorze tests, build et parité a/b/c+d
réussis ; le même export court réel donne une page A4 complète.
La [fiche générée](iteration-developpement.md), issue du seul suivi JSON, identifie
le candidat, la PR nº71, les observations CI et les blocages. Ne pas la modifier à la main.
La CI et le candidat local sont identiques octet par octet, manifeste et cinq assets
vérifiés. Consulter cette fiche pour les SHA et dates ; ils ne sont pas dupliqués ici.

## Git et périmètre
Branche active à cette clôture : `feat/projet-github-sync`, issue de `origin/main`
au commit de fusion nº74. La branche de préparation précédente est conservée.
PR nº71 fusionnée par le responsable, observation vérifiée sur GitHub et dans main.
Base du prototype : `f4695d662546fe7277bf3a50c8c975ce97e8b9a0`.
Fusion observée dans main : `6399524cc0f92a90ab9c53c1990f07016e827775`.
La publication par connecteur GitHub a conservé exactement l'arbre local après
échec d'authentification du Git habituel. Les branches locales phase-0, phase-1
et `feat/passeport-immo-cockpit-local` conservent les étapes précédentes.
Le clone Collector original et la source CONNECT historique sont préservés.
Les chemins du poste, imports, données navigateur et preuves locales sont hors Git.

## Autorisation et état
Accords de périmètre : « Phase 0 puis prototype local dans cette session », puis
invocation du skill et « Raccordement et correction du PDF ».
À la clôture actuelle, le suivi canonique porte les validations humaines des
phases 0 et 1 et le démarrage autorisé de la phase 2. Leurs dates, décisions et
preuves sont celles enregistrées par le responsable dans le cockpit. La checklist GitHub humaine et la fusion valident le lot source nº71 ; les phases
formelles et la recette détaillée restent distinctes. Aucun accord de déploiement,
d'accès production ou d'ouverture n'a été acquis.
Préproduction dédiée o2switch choisie ; adresse demandée et stratégie de compte parent
retenues. Sous-domaine et répertoire créés ; HTTPS et fermeture initiale vérifiés.
L'accès privé utilisable par le responsable reste à configurer et vérifier.
Préproduction et production : isolement/vacuité ou sauvegarde
restaurée, intégration CONNECT et retour arrière à qualifier.

## Ouvrir et reprendre
Application : `../start-local.cmd`, <http://127.0.0.1:5175/>, « Se connecter ».
Cockpit Projet : `../start-review.cmd`, <http://127.0.0.1:5193/>.
Dans phase 0 ou 1, sélectionner le document « Itération GitHub et cockpit ».
Les deux services ont été lancés sur ce poste ; leurs instances peuvent être arrêtées
par Ctrl+C dans leur terminal. Ne pas arrêter un service inconnu occupant le port.

Tests et build depuis `frontend/` ; parité depuis le sous-projet.
Lire le [mapping du protocole](../workflows/developpement-github-cockpit.md)
pour packaging et contrôles de passage. Les paramètres locaux du skill et du rendu
sont dans `.local/review-settings.json` ignoré.
Avant chaque écriture du suivi, vérifier l'absence de `.projet-review.lock`,
puis régénérer les vues et utiliser `--check`.

## Suite et limites
Recette humaine R01…R13 et téléphone réel ouverts. Q09 est résolue techniquement ;
h/ml à zéro, partage d'URL et groupement PDF par nom restent inchangés.
Docker : configuration vérifiée, image non exécutée. Avertissement de bundle conservé.
Qualifier la cible dédiée o2switch et le lot CONNECT, puis préparer un accord
portant sur le candidat exact. Les contrôles de passage refusent les preuves absentes.
Claude n'a pas été consulté : interface accessible à l'écran de connexion dans
le lot initial ; le prompt fourni reste une ressource, sans session ouverte à sa place.

## Vérification documentaire
Socles du sous-projet et de la racine présents. Contrôle des métadonnées simples,
liens locaux, matrice, JSON, vues dérivées et lecture native du cockpit effectué.
Les détails et preuves sont dans [raccordement-cockpit.md](raccordement-cockpit.md).
Le périmètre vérifié est ce lot ; audit global des autres applications : TBD.

## Rebase de la PR nº72 après fusion du socle commun

Le responsable demande le rebase après avoir fusionné la PR nº73. Les deux commits
de suivi ont été rejoués sans conflit sur cette fusion. La comparaison des commits
avant et après confirme le même contenu ; aucun changement du frontend ni du
candidat accepté de la PR nº71. Le suivi conserve les phases et décisions humaines.

Le protocole commun est désormais présent dans cette branche. Le paramètre du poste
qui appelle son contrôleur est réaligné vers le skill utilisateur installé ; aucune
copie supplémentaire de la procédure n'est créée. Les informations GitHub du rebase
sont datées dans le suivi ; vérifier la tête de PR avant une décision.

## Reprise après fusion de la PR nº72

La fusion est vérifiée sur GitHub et dans `main`. La demande « continuer le
développement » lance un lot de préparation locale de la préproduction dédiée.
La [procédure de préparation](../workflows/preparer-preproduction.md) contrôle le
candidat déjà identifié, crée une archive avec fermeture initiale de l'accès,
relit ses fichiers et répète leur restauration dans un répertoire temporaire.
Six tests couvrent les contrôles d'intégrité, les chemins et les liens symboliques.
Les preuves et empreintes sont dans la fiche d'itération générée depuis le suivi.

À cette étape de l'historique, le sous-domaine et le dossier o2switch sont demandés
au responsable et restent inconnus. Leur création ultérieure est décrite au début
de ce point de reprise. Aucun accès privé ni sauvegarde/restauration hébergée n'est qualifié ;
aucune livraison distante n'est réalisée. La V1 statique, les décisions de phase
et les assets du candidat sont conservés. Le lot CONNECT reste à définir et à
autoriser séparément. Le plafond de ressources autorisé reste 20 % de la limite
hebdomadaire ; l'usage du compte n'est pas une mesure attribuable à ce lot.

Le responsable signale l'absence de la PR nº72 dans la vue. Le champ de suivi est
réaligné sur `reviewFollowUps`, attendu par le moteur ; la carte complémentaire
est rattachée à la phase 0. La fiche d'itération est disponible dès cette phase et
indique le travail actuel ainsi que les validations formelles restant à consigner.
La correction est vérifiée par le contrat du moteur et dans le navigateur.

## Reprise documents du 14 octobre 2026

Le responsable reprend le sujet pour mettre en place les documents d’un client
liés à son bien, avec le dossier réel fourni conservé localement. Il demande aussi
la rotation des scans dans le répertoire source et un statut face aux sources ExamIn.
La branche active est `feat/passeport-immo-documents`, basée sur `origin/main`
observé le 14 octobre. Les modifications du cockpit du 3 octobre restent conservées
localement ; elles ne sont pas incluses automatiquement dans le commit du module.

Le module est testé localement : 26 tests frontend et build réussis, contrôle
de parité a/b/c/d/e réussi. Le cas contient cinq PDF et 33 pages. Deux fichiers
(dix pages) sont retournés et le DPE réordonné ; originaux conservés. Les documents
réels, captures et reçus restent hors Git. L’adresse est confirmée par le responsable et vérifiée dans le devis et le DPE ;
la surface retenue est celle du DPE. La réserve initiale venait d’une erreur de lecture
de l’agent et a été retirée.

Le cockpit est regroupé en quatre phases, avec l’ancien suivi entier dans
`legacyTracking` et les décisions/projections explicitement historiques. Cadrage
conserve uniquement l’accord initial D01. Développement local reste en cours ;
la reprise identique anciennement validée ne valide pas le nouveau module.
Préproduction et Mise en production restent non commencées. Le candidat accepté
et les accords distants précédents restent conservés séparément du nouveau lot.

Prochaine action : recette humaine du dossier concret,
puis lot CONNECT et qualification privée avant toute installation distante.
Publication GitHub et recette navigateur finales seront consignées ci-dessous.

### Complément Coupe et recette locale

Le responsable choisit la comparaison avant/après. Deux projets sont chargés
et sauvegardés dans Coupe, puis exportés en SVG. Le PDF comparatif A3 paysage
est inspecté sur ses deux pages et importé dans les documents du bien.
Le lecteur Passeport Immo affiche les pages 1 et 2 ; le téléchargement conserve
l’empreinte du PDF source. Six documents sont actifs et une ancienne copie du
diagnostic reste archivée. Les sources, exports, projets modifiables et captures
sont conservés dans les dossiers privés ; [le guide](coupes-bien.md) précise les
cotes et les mesures manquantes. Le code de Coupe est conservé.

Le nouveau candidat documentaire est distinct du prototype déjà accepté :
les anciens contrôles, PR, préparations et accords restent dans `legacyTracking`.
La recette locale et les coupes ne donnent pas d’accord de phase ou de livraison.

### Publication du lot

[PR nº78](https://github.com/jpdandin44/AVEREO/pull/78) publiée en brouillon,
avec les quatre cases humaines décochées. Le candidat fonctionnel `322ad127`
est construit par la CI et par le poste. Les mêmes sept assets ont d’abord donné
des ZIP différents par l’ordre de deux noms, lié au tri Windows/Linux ; le tri
par chaîne du nom relatif corrige cette différence. Archive et manifeste sont
identiques après correction. Un test de packaging porte la suite Python à onze
cas ; les 26 tests frontend restent réussis. Les révisions GitHub de suivi sont
observées séparément du candidat et de son acceptation.

Les passages de préproduction, production et clôture sont contrôlés et refusés
pour les qualifications, accords et preuves de récupération manquants. Les
documents du cas, exports et captures restent hors Git. Prochaine action :
recette humaine du dossier et des coupes, puis cadrage du lot CONNECT et
qualification de la préproduction privée.

### Complément de lecture thermique

Le responsable demande d’utiliser les fonctions thermiques avancées de Coupe,
puis précise les environnements adjacents. Les renseignements restent dans les
projets et le PDF privés ; le chauffage non renseigné des volumes voisins est
marqué à confirmer. La source thermique historique est datée dans les dessins.
Les champs de zones/interfaces sont renseignés pour les sept éléments traversés,
tous laissés non validés. Les commandes natives appliquent les couleurs des
groupes chauffés et non chauffés sans régénérer la géométrie.

Le tableau de repérage arrondit au pas de 5 cm : commentaires et notice signalent
ce comportement ; les cotes exactes lues restent dans la scène CAO et le PDF.
La première esquisse et une préparation intermédiaire sont archivées dans le
dossier. Six PDF sont actifs, trois copies historiques archivées. Les deux pages
du PDF final sont inspectées puis consultées ; sa copie téléchargée est identique
au source. Les deux projets natifs et leurs SVG sont réenregistrés dans le dossier
source, avec une sauvegarde privée des premières coupes.

Le code des applications et les décisions humaines restent inchangés. Le guide,
l’audit et les vues courantes sont actualisés dans le lot de la PR nº78 ; aucune
nouvelle acceptation ou livraison distante n’est déduite des indications métier.
