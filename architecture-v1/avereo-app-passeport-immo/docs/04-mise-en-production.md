---
project: avereo-app-passeport-immo
document_type: production-preparation
title: Préparation de la mise en production de Passeport Immo
status: active
version: git
created: 2026-10-15
updated: 2026-10-16
owner: jpdandin
tags: [passeport-immo, production, exploitation]
---

# Préparation de la mise en production de Passeport Immo

Ce dossier prépare la suite demandée après la fusion de la
[PR nº82](https://github.com/jpdandin44/AVEREO/pull/82) et la validation humaine
de Préproduction le 16 octobre. Les inventaires et préparations des 15 et 16 octobre
sont datés ; ils ne constituent pas une livraison.
Les statuts et accords actuels font foi dans le [suivi canonique](suivi-chantier.json),
notamment `developmentWorkflow.productionPreparation`.

La [preuve de qualification](../api/qualification-production-observation.json) conserve
la fusion de la PR nº81, les contrôles DNS/HTTPS, l'inventaire cPanel et la préparation
locale. La [preuve précédente](../api/preparation-production-observation.json) conserve
la provenance des archives après la PR nº80. Aucun de ces inventaires n'est un reçu de livraison.

## État courant — activation et sauvegarde vérifiées, OAuth bloqué

La [vérification réelle](../api/production-verification-observation.json) complète
le reçu historique d’installation fermée conservé plus bas.

| Contrôle réel, 16 octobre | Résultat observé, UTC |
|---|---|
| Activation humaine | 10:44:23 : sas signé et stockage actifs pour dandin, autres comptes actuels refusés ; aucun rôle ni secret créé |
| Premier vrai cron | 10:45:02 : quatre tables et neuf documents ; empreintes et restitution temporaire vérifiées |
| Planification finale | 10:45:51 : entrée temporaire retirée, autres tâches conservées ; quotidien 03 h 20 Paris et trente copies vérifiées |
| Application HTTPS | 10:52:13 : 57 assertions réussies, deux sessions indépendantes, seize fichiers et neuf téléchargements vérifiés par session ; données métier inchangées |
| Navigateur OAuth | Connexion native Drupal de dandin réussie ; échange de jetons refusé avec 503, sans erreur de transport |
| Proposition de correction | 10:59:04 : 27 contrôles sur une collection privée des vraies routes Drupal ; quinze autres routes inchangées, aucun déploiement |

Le [correctif proposé](blocage-oauth-production.md) ajoute l’option de maintenance
aux seules routes d’autorisation, de jetons et d’identité. Les exigences et mécanismes
d’authentification restent identiques ; le site public reste fermé. Le site Drupal
est un autre périmètre dont l’accord est maintenant acquis. La
[préparation du fournisseur](../api/oauth-provider-preparation-observation.json)
constate l’intégration de deux fichiers et 66 contrôles réussis dans la PR Drupal
nº21, puis l’échec de l’audit des deux cibles : six avis de sécurité, quatre
composants. Le déploiement OAuth reste non effectué ; les lots de sécurité
distincts nécessitent leur propre accord et qualification.

L’installation privée de Passeport Immo est réelle. Sa recette HTTPS signée ne
remplace pas la recette OAuth complète, qui reste bloquée. D06, les critères humains,
le merge et l’ouverture publique gardent leurs portées distinctes. La sauvegarde
reste sur le même hébergement ; copie distante et alertes non qualifiées.

## Historique — installation fermée et reprise SCI du 16 octobre

Le [reçu d’exécution](../api/production-execution-observation.json) est la source
structurée de l’avancement courant. Les constats ci-dessous remplacent les états
de préparation historiques conservés plus bas.

| Contrôle réel | Résultat observé, UTC |
|---|---|
| Initialisation humaine et restriction SQL | 09:00:13 : quatre tables initialement vides, cinq droits utiles, configuration 0600/dossiers 0700 |
| Récupération CONNECT isolée | 09:16:34 : cinq fichiers et catalogue restaurés, delta de deux fichiers appliqué/retiré sur copie, dépôt réel vérifié en tables temporaires |
| Archives et isolement famille | 09:27:05 : trois ZIP conformes ; accès famille conservé, bien SCI et neuf documents refusés par les méthodes serveur |
| Reprise SCI réelle | 09:28:44 : un bien, un client, six actifs/trois archives ; export stable, import et rejeu exact sans doublon ; source inchangée |
| Sauvegarde SCI | Quatre tables restaurées temporairement et neuf fichiers restaurés dans un dossier privé séparé ; empreintes et métadonnées conformes |
| Installation fermée | 09:31:42 : seize fichiers conformes à la variante fermée ; `cgi-bin` vide conservé, stockage web désactivé |
| Activation répétée isolément | 09:44:01 : deux fichiers CONNECT, deux configurations et politique signée ; propriétaire permis et autre compte existant refusé dans trois tables temporaires ; retour arrière vérifié ; accès réels inchangés |

Le contrôle de passage production ne rapporte plus de réserve technique pour
l’installation fermée. Il ne réalise pas l’activation et ne valide pas la phase 3.
HTTPS strict confirme le certificat et le refus 403 à la racine ; les trois contrôles
rapprochés suivants ont reçu 429, sans contenu applicatif, et ne prouvent pas le
comportement final du sas. La recette authentifiée reste à effectuer après activation.

La [procédure d’activation](../workflows/activation-production.md) conserve le script
exact, sa qualification et les effets de l’action finale préparée : clé existante
copiée uniquement sur le serveur, accès `dandin`, refus explicites des autres membres
actuels, stockage web, sas signé et sauvegarde de production séparée. La planification
préparée est 03 h 20 Europe/Paris, rattrapage horaire, trente copies vérifiées.
Elle n’est pas encore installée et aucun vrai succès cron de production n’est revendiqué.

Le responsable doit exécuter l’action qui raccorde la clé et crée les accès, selon
la règle de sécurité du navigateur. D06 reste acquis pour cette cible et ce candidat ;
les critères humains et le merge restent inchangés. Aucun accès public n’est ouvert.
La sauvegarde reste sur le même hébergement ; copie distante et alertes non qualifiées.

## Historique — initialisation privée qualifiée à 09:00:13 UTC

Le responsable a initialisé les quatre tables vides et la configuration privée,
puis CREATE et REFERENCES ont été retirés. Les cinq droits utiles sont relus dans
SQL et testés dans une table temporaire. Aucun secret n’est restitué.
La [réserve famille](controle-candidat-preproduction.md) est levée par confirmation
humaine du maintien d’accès ; aucun droit de préproduction n’est modifié.

## Historique — provisionnement fermé avant initialisation du 16 octobre

Le [reçu actuel](../api/production-provisioning-observation.json) remplace l’inventaire
initial ci-dessous pour l’état des ressources. Le dossier dédié a été créé vide
avec refus Apache avant création du sous-domaine ; la base `daje3540_pimprod` est
créée sans utilisateur applicatif ni initialisation. Le responsable a ensuite créé
l’utilisateur dédié dans cPanel ; les sept droits bootstrap sont enregistrés sur
cette seule base après son accord explicite. Le schéma et la configuration privée
ne sont pas encore créés. Le certificat DNS-01 est installé
pour le seul domaine prévu. Une connexion TLS avec vérification stricte du certificat
et du nom retourne **403**, comme le navigateur intégré ; aucun contournement de
certificat n’est utilisé. Le client Windows curl refuse encore la nouvelle chaîne ;
le contrôle indépendant utilise le magasin de confiance de Node.

cPanel a ajouté son répertoire `cgi-bin`, réel et strictement vide ; il est conservé
sous la fermeture du dossier. Un initialiseur technique a été déposé hors web,
en 0600. Son précontrôle réel s’arrête avant toute création d’identifiant : la voie
UAPI exige un binaire absent de la session cloisonnée. La relecture dans un terminal
rouvert confirme que la commande ordinaire est également indisponible ; l’observation
antérieure d’une lecture réussie ne qualifie pas cette capacité courante.
Les tests locaux ne qualifient donc pas cet initialiseur sur l’hébergement ; ne pas
le lancer en écriture. La reprise utilise le compte `daje3540_pimprod` créé par le
responsable et les droits attribués dans l’interface MySQL standard : SELECT, INSERT,
UPDATE, DELETE, CREATE TEMPORARY TABLES, CREATE et REFERENCES. Une initialisation
sans UAPI demandera le mot de passe existant sur le terminal masqué, puis contrôlera
les droits et la vacuité SQL avant le schéma. CREATE et REFERENCES devront ensuite
être retirés, et les cinq droits d’exploitation vérifiés avant activation.
Aucun mot de passe ne doit transiter dans le chat ou les arguments d’une commande.

La variante privée sans UAPI est déposée en 0600 et son empreinte 2ee55c7d… est relue.
Son précontrôle réel retourne `filesystem_ready_no_sql_check` : fermeture et chemins
vérifiés, aucun contrôle de compte, droits ou vacuité SQL revendiqué à ce stade.
Les essais isolés couvrent 19 assertions MariaDB et deux saisies sur pseudo-terminal,
avec masquage et restauration de l’écho en sortie normale ou erreur. Le responsable
doit exécuter l’initialisation et saisir le mot de passe lui-même ; aucun mode
d’écriture de cette variante n’a encore été lancé. Une interruption SIGINT/SIGTERM
n’est pas gérée ; rétablir l’écho par `stty echo` si nécessaire, puis examiner l’état
avant toute reprise. Une saisie erronée ou des droits/tables inattendus arrêtent
la procédure avant création de configuration ou clé.

Les quatre sources de sauvegarde et le CLI de reprise sont déposés dans un nouveau
répertoire privé d’opérations (0700, fichiers 0600), empreintes relues. Ce dépôt
ne contient ni configuration ni document client et n’exécute aucun de ces outils.

Le responsable confirme le compte de production **dandin**, trouvé actif avec
onboarding terminé et appartenance owner active. Le compte source préproduction
reste **avereo_admin** ; les identifiants de stockage sont lus séparément.
Leurs sujets externes et issuers diffèrent : le rattachement repose sur ce choix
explicite, sans prétendre établir une égalité technique entre les identités.
Le dossier SCI et ses six documents actifs/trois archives sont relus à
**08:05:04 UTC**, avec contrôle des neuf tailles et empreintes. L’export final
reste à stabiliser avant copie. Les deux fichiers CONNECT correspondent encore
aux préconditions du delta qualifié ; ni delta, ni clé, ni droit ne sont installés.

La CI de la PR nº83, tête `90ad61855a6d5d10aeee4f79d81ba829ae895d6d`, passe les
contrôles de reprise (35), API/stockage (30) et sauvegarde (22). L’archive publique
téléchargée contient les mêmes seize fichiers et conserve l’empreinte c44f397f…
autorisée. La cible reste **non prête pour activation** : identifiants techniques,
configuration privée, schéma, récupération et retour arrière sont encore à préparer,
puis reprise SCI et raccordement/recette réels. Aucun candidat applicatif, document
client ou compte/droit CONNECT n’a été modifié par le provisionnement fermé.

## Historique — accord récupéré et inventaire initial — 16 octobre

La [PR nº83](https://github.com/jpdandin44/AVEREO/pull/83) publie cette préparation
en brouillon et porte sa revue. Sa fusion reste distincte de l'accord opérationnel
D06 déjà reçu et de la future livraison.

La décision **D06**, enregistrée par `jpdandin` le **16 octobre à 09 h 05 min 11 s,
Europe/Paris**, approuve les six livrables et les huit critères de Préproduction,
dont le critère 07. Son commentaire est : **« Phase approuvée, passage en prod autorisé. »**
Les quinze documents approuvés des phases précédentes sont relus à l'identique ;
ils deviennent des preuves figées. Le [reçu courant](../api/production-readiness-observation.json)
rapproche cette décision, la fusion, les archives et l'inventaire cPanel.

L'accord de production est acquis pour le candidat examiné, le domaine retenu
`https://passeport-immo.avereo.fr` et la suite avec le dossier SCI choisi.
Le suivi référence D06 sans inventer une nouvelle décision ni demander de répéter
cet accord. La phase 3 est en préparation ; aucune installation ou reprise de données
n'est effectuée. Une ouverture publique ne fait pas partie de cet accord.

L'inventaire cPanel initial du 16 octobre confirmait l'absence du sous-domaine de production,
de la base `daje3540_pimprod` et du compte SQL proposé du même nom. Le dossier cible,
les fichiers CONNECT et le propriétaire restent à relire avant intervention.
Le contrôle de passage reconnaît la revue et l'accord ; il conserve quatre motifs
de refus techniques : blocages déclarés, cible non prête, sauvegarde/restauration
de cible absente et retour arrière non qualifié. La reprise SCI fait partie des
blocages déclarés ; sa préparation ne doit pas importer les données fictives de recette.

## Place dans les quatre phases

| Phase | Environnement de revue | Situation lors de la préparation |
|---|---|---|
| 0 — Cadrage | Local | Validée ; preuves conservées |
| 1 — Développement local | Local | Validée ; preuves conservées |
| 2 — Préproduction | Préproduction | Validée par D06 le 16 octobre, huit critères examinés |
| 3 — Mise en production | Préproduction pour la revue du candidat | Passage autorisé par le commentaire D06 ; préparation en cours, aucune livraison ; contrôles après livraison sur la production réelle |

L'accord provient de la décision humaine existante, pas de la fusion ou de la CI.
Un changement de cible, de candidat, de données ou d'effet doit être requalifié.
Les prérequis techniques restent obligatoires ; l'ouverture aux utilisateurs demeure distincte.

## Candidat conservé

La PR nº82 est fusionnée le **16 octobre à 09 h 00 min 55 s, Europe/Paris**,
au commit `d95164ea0c9863073427e82fae89e89dadeac01f`. Son arbre est identique à la tête
revue `8db97ea2a547cf20423c713ce0a609512a8c6d0e`. Les quatre cases humaines sont cochées
et la policy stricte passe. Les workflows [CI](https://github.com/jpdandin44/AVEREO/actions/runs/38864545231)
et [Passeport Immo CI](https://github.com/jpdandin44/AVEREO/actions/runs/38864545332)
réussissent sur ce commit. L'archive de cette CI est téléchargée puis comparée
octet pour octet au candidat accepté : même empreinte et seize fichiers vérifiés.
Copie de travail privée : `.local/production-next-20261016/main-artifact/candidate.zip`.
Les lots fermé, CONNECT et sauvegarde ci-dessous sont également relus ; leurs contenus
restent identiques aux manifestes. Le lot de sauvegarde correspond aux sources fusionnées.

Les provenances suivantes conservent l'historique du même candidat public.

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

## Historique de qualification de la cible avant provisionnement

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

## Reprise du dossier SCI

Le responsable a choisi le 15 octobre 2026 de **reprendre le dossier SCI de
préproduction** pour les données initiales de production. Ce choix est enregistré
dans `developmentWorkflow.productionPreparation.initialData` du
[suivi canonique](suivi-chantier.json). Le choix du 15 octobre fixait le périmètre
sans autoriser à lui seul un transfert. Le commentaire D06 du 16 octobre autorise
ensuite le passage en production ; l'inventaire exact, la correspondance du propriétaire
et le mécanisme de reprise restent à qualifier avant toute copie.

Le périmètre comprend le bien sélectionné, son client lié, les informations du
dossier, les métadonnées et les fichiers de ses documents actifs et archivés.
Le [reçu du 15 octobre à 09:53:50 UTC](../api/storage-observation.json) constate
un bien, un client, six documents actifs et trois archivés, avec les neuf fichiers
vérifiés dans deux sessions indépendantes. Ces nombres sont un repère historique :
l'inventaire réel devra être relu après la recette humaine et avant le transfert.
La copie nocturne a précédé cette recette ; elle n'est pas supposée couvrir des
écritures postérieures. Les autres dossiers, essais de recette, données de démonstration,
comptes, droits et secrets de préproduction sont exclus.

La préparation et les contrôles à effectuer sont les suivants :

1. **Identifier les données exactes.** Inventorier le dossier sélectionné et ses
   dépendances utiles, y compris les archives, puis conserver hors Git un manifeste
   avec les identifiants sources, les nombres, les métadonnées, les tailles et les
   empreintes SHA-256. Toute dépendance extérieure au dossier doit être explicitée
   avant inclusion ; ne pas recopier l'ensemble de la base de préproduction.
2. **Qualifier le propriétaire en production.** Identifier le compte et, le cas
   échéant, l'organisation CONNECT destinataires ; établir la correspondance avec
   le propriétaire source. Ne pas supposer qu'un identifiant numérique identique
   désigne le même compte entre environnements. Les habilitations de production
   restent à accorder dans le périmètre autorisé.
3. **Préparer une reprise cohérente et sans doublon.** Définir un instant de copie
   stable pour les données et les fichiers, comparer l'état cible avant import,
   puis conserver la correspondance des identifiants source/cible et le manifeste
   appliqué. Une reprise de l'opération doit détecter les éléments déjà importés
   et les conflits, sans écrasement silencieux. L'outil exact et cette propriété
   sont désormais disponibles et qualifiés sur deux bases MariaDB fictives avec
   [l'outil de reprise ciblée](../workflows/reprise-bien.md) ; leur contrôle sur la
   cible et les propriétaires réels reste nécessaire avant utilisation en production.
4. **Préserver les sources et la récupération.** Conserver le dossier de
   préproduction intact. Sauvegarder l'état cible avant écriture, ou constater sa
   vacuité et son isolement, puis vérifier la récupération conformément à la
   section [sauvegarde et retour arrière](#sauvegarde-et-retour-arrière).
5. **Contrôler après transfert autorisé.** Comparer nombres, liens client/bien,
   métadonnées, états actif/archivé, tailles et empreintes de tous les documents
   avec le manifeste actualisé. Vérifier lecture, téléchargement et persistance
   avec le compte de production, ainsi que le refus d'un autre compte. Conserver
   un reçu sans données personnelles ni secrets avant toute ouverture.

À qualifier sur le serveur : compte propriétaire de production, inventaire actualisé,
application du mécanisme, rejeu sans doublon et récupération sur la cible réelle. L'accord D06
est conservé ; aucune correspondance d'identité, aucun contenu supplémentaire ni
réussite de transfert ne sont déduits de ce seul accord.

### Mécanisme exécutable qualifié localement — 16 octobre

Le CLI privé [transfer-property.php](../workflows/transfer-property.php) et sa
[procédure](../workflows/reprise-bien.md) limitent la copie au bien sélectionné,
au client lié et aux documents actifs/archivés. Le plan explicite les environnements
et propriétaires source/cible ; un manifeste privé et son empreinte indépendante
lient cette sélection. La simulation précède l'import, qui conserve le modèle,
les métadonnées, les dates et les octets. Les identifiants client/documents sont
recalculés de façon stable ; un rejeu exact ne crée aucun doublon et ne change
pas la révision. Une différence cible ou un fichier orphelin entraîne un refus.
Les comptes, droits, secrets, tarifs et autres biens ne sont pas transférés.

Le [reçu local](../api/property-transfer-observation.json) couvre **35 assertions
sous MariaDB 11.4**, avec deux bases et des données fictives uniquement : sélection,
archives, comptes/base erronés, empreintes, simulation sans écriture, conflit,
retour transactionnel, rejeu et conservation des écritures ultérieures de la cible.
Ce lot privé ne modifie pas les seize fichiers du candidat public et ne constitue
pas une livraison de l'outil sur le serveur. L'inventaire SCI actualisé, le propriétaire
de production, la cible fermée et la récupération/retour arrière réels restent à établir.

## Séquence de préparation et de livraison

1. **Revue formelle récupérée.** D06 approuve la phase 2 et ses huit critères.
   Les checklists des PR fusionnées et les empreintes des livrables sont conservées.
   Relire la preuve courante et le candidat exact avant intervention.
2. **Recontrôler l'inventaire avant écriture.** L'inventaire initial est conservé
   ci-dessus. Revalider domaine, vacuité du chemin, fichiers CONNECT et disponibilité
   du nom SQL avant leur création ou adaptation. Créer d'abord le dossier avec sa
   fermeture `Require all denied`, puis rattacher le sous-domaine et qualifier TLS.
   Ne pas réexécuter l'installateur initial sur une cible peuplée.
3. **Préparer la reprise du dossier SCI choisi.** Appliquer le
   [plan de reprise](#reprise-du-dossier-sci) : inventaire actualisé, correspondance
   du propriétaire CONNECT, intégrité et import sans doublon. Le choix est consigné ;
   les prérequis de reprise restent à satisfaire dans le périmètre autorisé par D06.
4. **Préparer la récupération.** Sauvegarder fichiers, configuration et données
   existants avant écriture. Vérifier leur restauration dans un emplacement isolé.
   Pour une cible réellement vide, conserver la preuve d'isolement et la procédure
   de retrait du candidat. Tester aussi le retour arrière sur le candidat exact.
5. **Vérifier la portée de l'accord existant.** D06 et le reçu courant lient
   la cible, la source acceptée et l'empreinte de l'archive. Conserver le périmètre
   CONNECT/dossier SCI et l'accès fermé prévu ; requalifier toute divergence.
   Exécuter le contrôleur `production` après les préparatifs. Les erreurs doivent
   être résolues par des preuves, sans retirer de blocages artificiellement.
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

L'échec est également observé sur [le commit de fusion de la PR nº81](https://github.com/jpdandin44/AVEREO/actions/runs/38781823276)
et sur [celui de la PR nº82](https://github.com/jpdandin44/AVEREO/actions/runs/38864545269).
Seule sa conclusion a été relue lors de cette qualification ; le diagnostic détaillé
ci-dessus reste celui de l'exécution précédente.

## Reprise opérationnelle

Ouvrir [le point de session](point-session.md), puis le suivi du cockpit.
La phase 2 est validée et le passage en production autorisé dans D06.
Prochaine action : préparer la cible fermée, qualifier le propriétaire CONNECT
du dossier SCI et son inventaire actualisé, puis le mécanisme de reprise, la
récupération et le retour arrière. L'installation et les contrôles réels suivent
la séquence ci-dessus ; aucune livraison n'est déclarée pendant cette préparation.

Le contrôleur de production est réexécuté le 16 octobre : les quatre réserves
techniques figurent dans le reçu courant et le suivi. Les huit réserves du 15 octobre
restent un constat historique ; les absences de revue et d'accord sont désormais résolues.
