---
project: avereo-app-passeport-immo
document_type: session-handoff
title: Point de reprise de session
status: active
version: git
created: 2026-10-03
updated: 2026-10-15
owner: jpdandin
tags: [passeport-immo, local, cockpit]
---

# Point de reprise de session

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
