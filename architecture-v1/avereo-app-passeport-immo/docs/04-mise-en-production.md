---
project: avereo-app-passeport-immo
document_type: production-preparation
title: Préparation de la mise en production de Passeport Immo
status: active
version: git
created: 2026-10-15
updated: 2026-10-15
owner: jpdandin
tags: [passeport-immo, production, exploitation]
---

# Préparation de la mise en production de Passeport Immo

Ce dossier prépare la suite demandée après les fusions des
[PR nº80](https://github.com/jpdandin44/AVEREO/pull/80) et
[PR nº81](https://github.com/jpdandin44/AVEREO/pull/81). Il décrit l'inventaire de
production réalisé le 15 octobre et les opérations à autoriser avant leur exécution.
Les statuts et accords actuels font foi dans le [suivi canonique](suivi-chantier.json),
notamment `developmentWorkflow.productionPreparation`.

La [preuve de qualification](../api/qualification-production-observation.json) conserve
la fusion de la PR nº81, les contrôles DNS/HTTPS, l'inventaire cPanel et la préparation
locale. La [preuve précédente](../api/preparation-production-observation.json) conserve
la provenance des archives après la PR nº80. Aucun de ces inventaires n'est un reçu de livraison.

[PR nº82 en brouillon](https://github.com/jpdandin44/AVEREO/pull/82) : qualification et outillage de production à relire ; aucun déploiement.

## Place dans les quatre phases

| Phase | Environnement de revue | Situation lors de la préparation |
|---|---|---|
| 0 — Cadrage | Local | Validée ; preuves conservées |
| 1 — Développement local | Local | Validée ; preuves conservées |
| 2 — Préproduction | Préproduction | PR nº80 fusionnée ; décision formelle de phase encore absente du cockpit |
| 3 — Mise en production | Préproduction pour la revue du candidat | Inventaire réalisé et lots locaux préparés ; phase non démarrée ; contrôles après livraison sur la production réelle |

Le responsable conserve la décision de phase, l'autorisation de déploiement
sur une cible et une version précises, puis l'éventuelle ouverture aux utilisateurs.
La fusion constatée ne crée aucune de ces décisions dans le suivi.

## Candidat conservé

La PR nº81 est fusionnée le 15 octobre à **19 h 58 min 57 s, heure de Paris**,
au commit `2995a2b95003016df0fefa84b34353c34dc5fee0`. Son arbre est identique à celui
de la tête revue `5e287e23ccdd70b2c6a5b0a0e48628351c0b2d7e` ; ses quatre cases humaines
sont observées cochées. Les workflows [CI](https://github.com/jpdandin44/AVEREO/actions/runs/38781822914)
et [Passeport Immo CI](https://github.com/jpdandin44/AVEREO/actions/runs/38781823500)
ont réussi. Les sources du runtime et de son packaging n'ont pas changé depuis
la fusion précédente : le candidat public ci-dessous reste conservé.

La PR nº80 a été fusionnée le 15 octobre 2026 à 17 h 11 min 21 s, heure de Paris.
Le commit de fusion `437f2689e8ea5a0f12e055be9e2b8713bf99b1bd` possède le même arbre
que la tête revue `74421367dadcae8de5b57636407bed45a6d74f04`.
Les workflows [CI](https://github.com/jpdandin44/AVEREO/actions/runs/38758111043)
et [Passeport Immo CI](https://github.com/jpdandin44/AVEREO/actions/runs/38758111947)
ont réussi sur ce commit.

L'archive publique téléchargée depuis cette dernière CI contient 16 fichiers,
relus par CRC, taille et SHA-256. Son empreinte est
`c44f397fd03daa433f19e6d4c72127f29e55dbf9fca679e8c7f41cc207a843cf` : elle est identique
à celle du [reçu de stockage en préproduction](../api/storage-observation.json).
Le suivi conserve donc le candidat installé, source `7209bf3334a5f3f98d422b41d177c734970a0750`,
et référence séparément la provenance de `main`. Aucun nouveau build n'est requis
pour cette préparation documentaire. Toute modification des octets exige une
nouvelle qualification.

Copie locale vérifiée : `.local/production-preparation/main-437f268/candidate.zip`
et `candidate.manifest.json`. Ne pas utiliser par défaut l'ancien `.local/candidate.zip`.
L'artefact CI est nommé `passeport-immo-437f2689e8ea5a0f12e055be9e2b8713bf99b1bd`,
identifiant `11984422099` ; la copie locale évite de dépendre de sa rétention GitHub.

Le lot privé de sauvegarde est séparé : `bundle.json` et `bundle.manifest.json`
dans le même dossier local, empreinte
`dd574fb98b8fe770f4c33c2fd2bacf76e17963c58aaa9c056e070d3326798ae1`.
Il contient les trois outils PHP de sauvegarde et `storage.sql`, hors archive publique.
Les quatre contenus sont vérifiés contre leur manifeste et les sources fusionnées.
Ce lot ne contient aucune configuration ni donnée du serveur.

## Qualification de la cible

L'adresse de production **`https://passeport-immo.avereo.fr` est confirmée par le
responsable le 15 octobre 2026**. L'inventaire authentifié suivant a été réalisé
dans cPanel, après reconnexion du responsable, sans création de domaine, de fichier,
de base ou de droit. La cible reste non prête dans le cockpit.

| Élément contrôlé | Constat du 15 octobre | Opération encore nécessaire |
|---|---|---|
| Domaine et DNS | Absent des 22 sous-domaines cPanel ; NXDOMAIN confirmé par Cloudflare et Google à 18:05 UTC | Créer le sous-domaine dédié et qualifier sa résolution |
| Compte et dossier | Compte `daje3540`, base `/home/daje3540` ; `passeport-immo.avereo.fr` et son dossier `public` absents | Préparer `/home/daje3540/passeport-immo.avereo.fr/public`, fermé avant rattachement public |
| HTTPS de Passeport Immo | Aucun contrôle possible par ce nom sans DNS | Certificat, chaîne TLS, redirections et refus anonyme à vérifier après création |
| CONNECT | `https://connect.avereo.fr/` répond 200 avec TLS valide ; page de connexion anonyme observée | Raccorder Passeport Immo et réaliser le parcours authentifié |
| Dossier CONNECT | `/home/daje3540/connect.avereo.fr/public`, chemin réel identique | Sauvegarder les deux fichiers concernés avant leur adaptation |
| Configuration CONNECT | Environnement `production`, fichier privé en 0600 ; paramètres URL/clé de lancement Passeport Immo absents | Compléter seulement les paramètres dédiés, sans réutiliser la clé de préproduction |
| Catalogue et droits CONNECT | Base `daje3540_connectprod` ; zéro entrée Passeport Immo, zéro droit d'organisation ou de compte ; transaction de lecture seule terminée | Déclarer le service et déterminer le compte/organisation autorisés en production |
| Base Passeport Immo | 12 bases listées ; seule `daje3540_pimpreprod` identifiée pour l'application | Base et compte dédiés proposés : `daje3540_pimprod`, absents de l'inventaire ; création non réalisée |
| Stockage privé | Dossiers de configuration, anti-rejeu et sauvegardes de production absents | Créer des emplacements séparés de la préproduction |
| PHP | CLI 8.3.35 et `pdo_mysql` disponibles | Confirmer le runtime Web, les extensions et limites sur le nouveau domaine |

La lecture de la configuration et les comptages SQL n'ont restitué aucune valeur
de secret ni donnée personnelle. L'identification Git ci-dessous ne concerne que
deux fichiers ; elle ne certifie pas l'intégralité du runtime CONNECT hébergé.

La préproduction connue est `https://passeport-immo-preprod.avereo.fr`.
Ses reçus sont datés ; ils ne prouvent ni l'état actuel du serveur ni la préparation
de CONNECT en production. Le lot CONNECT utilisé en préproduction ne doit pas être
rejoué sur un runtime de production sans comparaison des fichiers et de la configuration.

## Lots locaux préparés pour cette cible

Le dossier local ignoré par Git est `.local/production-qualification-20261015/`.

- **Application initialement fermée** : `closed-installation/preproduction.zip`,
  empreinte `9e9bde15d4b2c625967053220fc79f5a602ef2ab01a6a5fc3fdf537ee01b0404`.
  Les noms de fichiers sont ceux de l'outil de préparation historique ; cette copie
  est destinée à la préparation de production. Quinze fichiers du candidat sont
  identiques ; seul `.htaccess` impose `Require all denied`. CRC, inventaire,
  empreintes et restauration locale vérifiés. Cette restauration ne prouve pas
  une récupération sur l'hébergement.
- **Adaptation CONNECT** : `connect-delta/runtime-connect-compatible.zip`,
  empreinte `3b41fda26c0358a0a4eb3f49ebd2e132162fd737ce0078822d3e15a687884b63`.
  Les deux fichiers hébergés correspondent exactement à la base
  `7216fb1b1439d71a68bb948f16db0f57793c1fd8`. Le lot ajoute trois lignes : les deux
  variables privées à la liste autorisée et leurs correspondances URL/clé.
  Toute divergence d'empreinte avant pose doit faire refuser l'opération.
  Les 36 tests du backend historique et les 15 assertions du sas passent localement.
- **Sauvegarde de production** : adaptation locale de
  [scheduled-backup.php](../workflows/scheduled-backup.php) et
  [backup-cron.php](../workflows/backup-cron.php), avec environnement explicite,
  chemins et blocs cron distincts. L'ancien lot privé de préproduction ci-dessus
  reste la preuve de ce qui est installé ; il ne suffit pas pour la production.
  Lot `backup-production/bundle.json`, source
  `971e97460c90e9ae3ed36c5538491da400162982`, empreinte
  `b06e74f2528caa1887b151bb1d6052f7733388228ed710c2289cf0b6ab9ca0e8` :
  quatre fichiers relus contre le manifeste et les sources Git.
  Voir [la procédure de sauvegarde](sauvegarde-automatique.md#mise-en-production).

Aucun de ces lots n'est installé en production. Les archives et configurations
privées restent hors Git ; les preuves et manifestes sans secrets sont rattachés
au suivi. L'archive applicative publique conserve son empreinte initiale.

## Paramètres à préparer hors Git

Le chargeur du sas permet de conserver l'archive publique inchangée : il lit
`AVEREO_CONFIG_FILE` si défini, sinon le fichier privé correspondant à l'environnement.
Sur une cible de production, son chemin conventionnel est
`$HOME/.avereo/passeport-immo/config.php`. Qualifier le chemin réellement utilisé
sur l'hébergement avant activation ; ne pas copier les secrets de préproduction.

| Paramètre | Valeur ou exigence à qualifier |
|---|---|
| `environment` | `production` |
| `connect_portal_url` | `https://connect.avereo.fr/`, disponible anonymement ; parcours authentifié à qualifier |
| `connect_launch_secret` | Clé dédiée connue seulement du sas et de CONNECT ; valeur absente du dossier |
| `connect_launch_nonce_directory`, `connect_gate_cookie` | Répertoire privé et cookie distincts de la préproduction |
| `connect_gate_session_seconds` | Durée à confirmer ; préproduction actuelle : 1 800 secondes |
| `storage_enabled` | Activer seulement après préparation et vérification de la base et des fichiers |
| `storage_dsn`, `storage_user`, `storage_password` | Base et compte applicatifs dédiés, sans réutiliser la base CONNECT |
| `storage_directory`, `storage_origin` | Proposition : `/home/daje3540/.avereo/passeport-immo/documents` et `https://passeport-immo.avereo.fr` ; dossier absent lors de l’inventaire |
| `storage_profiles` | Profils d'affichage des identités signées ; les habilitations restent portées par CONNECT |

Le [modèle existant](../api/connect-config.example.php) illustre la préproduction.
Il ne constitue pas une configuration de production prête à déposer.

## Séquence de préparation et de livraison

1. **Terminer la revue formelle de préproduction.** Consigner les résultats du
   [guide de recette](recette-preproduction.md), les réserves éventuelles et la
   décision humaine dans le cockpit. La checklist GitHub de la PR nº80 est observée
   cochée ; elle n'est ni effacée ni transformée en nouvelle décision de phase.
2. **Recontrôler l'inventaire avant écriture.** L'inventaire initial est conservé
   ci-dessus. Revalider domaine, vacuité du chemin, fichiers CONNECT et disponibilité
   du nom SQL avant leur création ou adaptation. Créer d'abord le dossier avec sa
   fermeture `Require all denied`, puis rattacher le sous-domaine et qualifier TLS.
   Ne pas réexécuter l'installateur initial sur une cible peuplée.
3. **Décider du contenu initial.** Démarrage vide ou transfert explicitement choisi :
   TBD. L'import SCI autorisé en préproduction n'autorise pas son transfert automatique
   en production. Préparer un inventaire, un contrôle des propriétaires CONNECT,
   une comparaison des octets et une procédure d'import sans doublon si ce transfert est retenu.
4. **Préparer la récupération.** Sauvegarder fichiers, configuration et données
   existants avant écriture. Vérifier leur restauration dans un emplacement isolé.
   Pour une cible réellement vide, conserver la preuve d'isolement et la procédure
   de retrait du candidat. Tester aussi le retour arrière sur le candidat exact.
5. **Établir l'accord précis.** Lier cible, source acceptée, empreinte de l'archive,
   périmètre CONNECT/données et effet attendu. Exécuter le contrôleur `production`.
   Les erreurs doivent être résolues par des preuves, sans retirer de blocages artificiellement.
6. **Installer après accord.** Préparer configuration et récupération privées,
   fermer l'accès pendant l'opération, relire l'archive, installer les 16 fichiers
   publics et le lot privé dans leurs emplacements respectifs. Initialiser le schéma
   seulement dans la base dédiée qualifiée. Comparer les empreintes et permissions
   avant activation du lancement CONNECT. Ne pas inclure configuration, SQL,
   sauvegardes ou documents clients dans le document root.
7. **Contrôler la production réelle.** Vérifier TLS, refus anonyme, fichiers internes
   inaccessibles, tickets invalides/expirés/rejoués, lancement et déconnexion avec
   le compte autorisé, refus d'un autre compte, API/anti-CSRF, création d'un bien fictif,
   import, lecture, archivage, dédoublonnage, PDF et concurrence entre deux sessions.
   Nettoyer uniquement les données de test identifiées ; conserver les reçus sans secrets.
8. **Qualifier l'exploitation et clôturer.** Installer la sauvegarde privée selon
   la politique retenue, observer un déclenchement réel et une restauration isolée,
   puis consigner livraison, contrôles et réserves. Faire décider séparément de
   l'ouverture aux utilisateurs. Préparer la prochaine itération à partir des réserves.

Il n'existe pas de workflow de déploiement Passeport Immo opérationnel dans
`.github/workflows/` : la CI produit le candidat. Ce dossier ne prétend pas fournir
un déploiement automatique. Les opérations privées devront être qualifiées pour
la cible retenue avant leur exécution.

## Sauvegarde et retour arrière

La préproduction utilise une sauvegarde quotidienne à 03 h 20 Europe/Paris,
conserve trente succès et protège le dernier en cas d'échec. Réutiliser cette politique
en production est une proposition à confirmer ; répertoire, configuration et tâche
cron doivent rester distincts. Voir [le fonctionnement existant](sauvegarde-automatique.md).

Le travailleur fusionné avant ce lot refusait `environment=production` et
l'installateur cron visait uniquement les chemins de préproduction. L'adaptation
locale permet les deux environnements et préserve les autres blocs. Sa recette
isolée couvre 22 assertions de sauvegarde et 30 assertions d'API/stockage ; elle
ne déclenche aucune tâche hébergée. La copie préproduction installée reste inchangée.

Les preuves actuelles couvrent une restauration des tables dans un espace temporaire
et les empreintes des documents. Elles ne démontrent pas une restauration complète
de l'hébergement. La copie hors hébergement, les alertes et les objectifs de perte
de données/délai de reprise restent à décider avant de définir un engagement de service.

Un échec de TLS, d'identité, d'isolement des données, d'intégrité ou de sauvegarde
doit interrompre l'activation. Fermer les écritures, conserver les journaux et sauvegarder
l'état après incident avant toute restauration. Si des utilisateurs ont déjà écrit,
ne pas restaurer aveuglément une ancienne base : inventorier les nouvelles données,
choisir une récupération qui les préserve et faire approuver l'effet attendu.

## Incident distinct observé sur `main`

Le workflow [Deploy Prototype To GitHub Pages](https://github.com/jpdandin44/AVEREO/actions/runs/38758110234)
a échoué à l'étape `Setup Pages` : le site Pages n'est pas trouvé/configuré.
Les CI du monorepo et de Passeport Immo ont réussi. Cet échec ne constitue pas
un déploiement de Passeport Immo. Qualifier séparément l'utilité actuelle de ce
workflow avant de proposer sa configuration ou son retrait ; aucun réglage GitHub
Pages n'a été modifié par cette préparation.

L'échec est également observé sur [le commit de fusion de la PR nº81](https://github.com/jpdandin44/AVEREO/actions/runs/38781823276).
Seule sa conclusion a été relue lors de cette qualification ; le diagnostic détaillé
ci-dessus reste celui de l'exécution précédente.

## Reprise opérationnelle

Ouvrir [le point de session](point-session.md), puis le suivi du cockpit.
Prochaine action : consigner la revue de phase 2, choisir le contenu initial,
puis faire autoriser la préparation de la cible fermée et le raccordement exact
décrits ici. Qualifier ensuite la récupération et la recette sur la cible réelle.
La phase 3 et le déploiement attendent les décisions et preuves correspondantes.

Le contrôleur de production a été exécuté pendant la préparation ; il refuse le
passage avec huit prérequis manquants, conservés dans la preuve JSON. En particulier,
les reçus techniques de préproduction ne remplacent pas le contrôle de recette
attendu par le protocole ni l'acceptation humaine de l'archive exacte pour promotion.
