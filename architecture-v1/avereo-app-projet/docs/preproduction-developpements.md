---
project: avereo-app-projet
document_type: preparation-preproduction
title: Module Développements — session Projet et préparation de préproduction
status: active
version: git
created: 2026-11-07
updated: 2026-11-09
owner: jpdandin
tags: [projet, developpements, session, preproduction, prive]
---

## 9 novembre — contrôle global compatible Drupal 11

Le contrôleur relit l’utilisateur, ses rôles réellement attribués et leur indicateur `isAdmin()`, après invalidation des caches d’entités. L’ancien champ `user.settings.admin_role` n’est plus consulté. L’identité propriétaire exacte, le contrôle frais, le refus des autres profils et la lecture seule sont conservés ; aucun rôle ou droit n’est modifié. Non-régression : absence de l’ancien champ acceptée seulement avec rôle global attribué, retrait du rôle et changement de définition refusés. Les essais de contrôleur passent sur doubles ; la recette du vrai noyau et l’installation restent des contrôles séparés.


## Préparation du 9 novembre — qualifications et observations GitHub

Le [complément](preuves-et-actualisation-github.md) conserve le contrôle propriétaire exact/global, GET côté PHP et absence de mutation métier. Les qualifications et observations ne sont pas incluses en clair dans le paquet public : elles seront transmises par projection privée signée, après sélection explicite des pièces et autorisation du canal. La collecte GitHub se fait sur le poste opérateur, pas par un jeton installé sur O2Switch. PR/paquet préparés, aucune installation, activation ou recette du vrai compte effectuée par ce lot.

# Session Projet et préparation de préproduction

## Premier lot de préparation locale — 8 novembre

Le responsable autorise la préparation locale, pas une intervention sur le serveur. La branche dédiée reprend `main` à `5e79a9c9dea3df49f5690f85dbc954397fca3036`, incluant les apports d'interface et de missions des PR #131 à #133. Le code d'autorisation et le lecteur restent inchangés : propriétaire exact **et** rôle global courant, autres profils refusés, consultation sans écriture. Les suivis réels ne sont ni exportés à nouveau, ni migrés, ni publiés par ce lot.

Le constructeur ajoute trois modèles PHP inactifs et un [plan structuré de préparation](../workflows/development-preparation-plan.json). Ce JSON est la référence exécutable du contenu de préparation ; il est copié dans le paquet avec l'empreinte du workflow public observé. Il ne pilote aucune opération distante, ne vérifie pas une cible et ne contient aucun accord d'installation. Les résultats locaux, SHA et empreinte définitifs restent dans le suivi canonique propriétaire du lot ; aucune CI distante n'est déduite des tests locaux.

## État réel

Le lecteur PHP et le point d'entrée privé sont développés localement. Ils consomment le cookie Projet natif signé par le sas existant, puis le [pont Drupal/CONNECT](../../avereo-app-connect/api/developments-authorization.md) pour une décision globale fraîche. Ce n'est pas un accès par ID, un compte local supplémentaire ou une copie du cookie hébergé vers localhost.

**Aucun déploiement ni raccordement effectif de la session hébergée n'a lieu dans ce lot.** La recette utilise des sessions fictives conformes au code natif. Un lecteur non installé ne peut pas traiter le cookie présent sur le domaine réel. Les observations antérieures du compte global restent datées, distinctes de la qualification du futur module.

Le [guide de copie privée locale](pont-stockage-local.md) reste la référence de l'export, des preuves opt-in et du stockage signé. Les vrais suivis restent canoniques et consultatifs. Aucun secret réel, compte, rôle, planning ou suivi externe n'est modifié.

## Raccordement réalisé dans le code

`backend/developments/SessionAuthorization.php` réutilise les fonctions de `connect/gate.php` :

1. Hôte et transport correspondent à la cible ; HTTPS exigé, pas de confiance dans un en-tête proxy fourni par le visiteur.
2. Signature, application `projet`, dates, nonce, fournisseur et identité du cookie existant sont vérifiés ; la politique privée de période/révocation existante reste appliquée.
3. L'identité du cookie doit être exactement `owner_connect_id` du fichier privé de planning. Ce fichier fournit aussi l'origine : aucun second propriétaire du module à maintenir, pas de droit déduit d'un nom ou e-mail.
4. Le module produit son défi machine dédié avec l'ID et la date de session issus du cookie. CONNECT relit compte, accès Projet, sujet Drupal et autorité globale ; aucun rôle du navigateur n'est accepté.
5. La décision signée, actuelle et liée au défi est vérifiée ; la session/politique locale est relue avant réponse.
6. Aucune autorisation positive mise en cache. Page, données, capacités et fichiers JS/CSS/pièces repassent par le même contrôle.

Les comportements historiques permissifs du sas sur une politique non configurée ou un compte hérité ne donnent pas un rôle global : une décision positive du nouveau pont reste obligatoire. Un autre administrateur global est refusé par l'épinglage propriétaire.

`Factory.php` est limité à `environment:preproduction` et à l'origine `https://projet-preprod.avereo.fr`. Activation de production hors périmètre ; configuration absente/inactive/invalide = refus. La configuration réelle et l'empreinte du sas hébergé restent à lire/qualifier avant installation.

## Entrée et API privées préparées

| GET | Rôle |
| --- | --- |
| `/developpements/` | Page du module, après autorisation complète |
| `/developpements/api.php?route=capability` | Capacité minimale positive, sans titre ou compteur de développement |
| `?route=state` | Catalogue, versions, suivis et dates de la copie |
| `?route=iteration&iteration=ID` | Quatre phases, critères et références de preuves |
| `?route=proof&iteration=ID&proof=ID` | Seule pièce déclarée, sélectionnée et intègre |
| `?route=asset&name=FICHIER` | JS/CSS privés explicitement présents au manifeste |

Aucune route d'écriture, revue, import, publication ou restauration via navigateur. POST/PUT/PATCH/DELETE refusés (405), sans mutation. Aucune origine CORS, pas de secret dans le frontend ; `no-store, private`, `nosniff`, politique de contenu restrictive et erreurs génériques. Les PDF sont des téléchargements, textes/Markdown restent du texte ; aucun HTML/SVG arbitraire comme preuve.

Le lecteur PHP vérifie les signatures de l'index et de la projection, l'empreinte du fichier, le schéma, les quatre phases et la lecture seule. Les pièces sont décodées/vérifiées à la demande, sans chemin de fichier fourni par le lecteur. Il ne crée aucun verrou, répertoire, journal ou réparation dans les suivis/plannings. Une corruption ferme la lecture.

## Interface et menu

Le même écran React sert les quatre phases ; le mode PHP utilise exclusivement cette API et présente un retour vers les projets, sans inventer une nouvelle connexion ni déconnexion du compte. Les preuves affichent commit/empreinte et validation humaine séparément. Une réponse 401/403 masque l'état privé déjà chargé.

`public/developpements/module-link.js` est une **intégration optionnelle préparée**, non ajoutée automatiquement au Gantt. Ce fichier n'affiche le lien « Développements » qu'après capacité serveur positive, propriétaire/global attestés. Il retire le lien avant nouvelle vérification et ne se replie pas sur un rôle navigateur.

Lors d'une installation autorisée, intégrer une seule inclusion de ce fichier dans le template Projet réellement courant, puis vérifier l'absence de lien chez les tiers :

```html
<script defer src="/developpements/module-link.js"></script>
```

Ne pas remplacer le `legacy-app.html` hébergé par une copie ancienne pour ajouter ce lien. Le paquet du module ne contient aucun fichier de planning ni modification de ce template. L'entrée privée directe fonctionne indépendamment du menu après installation qualifiée.

## Paquet séparé, désactivé par défaut

Depuis `frontend/` :

```powershell
node ../workflows/prepare-development-preproduction.mjs --output DOSSIER_NOUVEAU_HORS_DEPOT
```

Le constructeur refuse un dossier existant ou dans le dépôt/frontend et ne lance aucun déploiement. Le build normal de Projet reste inchangé et exclut le module ; un build privé séparé réutilise ses dépendances déjà installées, sans ajout de bibliothèque.

```text
DOSSIER/
  manifest.json                 empreinte du paquet et liste de fichiers
  build-private/                sortie de construction locale, ne pas publier
  package/
    public/developpements/      seuls points d'entrée et lien optionnel
    private/runtime/            classes PHP et SignedMessage depuis CONNECT
    private/assets/             HTML/JS/CSS et empreintes, jamais servis directement
    configuration/              trois modèles PHP enabled=false, secrets vides
    dependencies/               empreintes du pont CONNECT/Drupal requis
    preparation/plan.json        copie du plan + constat du workflow public
    installation.md             copie dérivée du présent guide
```

Les chemins `public/` et `private/` ne sont pas des instructions d'installation automatique. **Ne pas téléverser le dossier entier sous la racine web.** Les fichiers privés doivent être placés hors de toutes les racines servies ; les points d'entrée seuls vont sous `developpements/`. Le paquet ne contient ni clés de publication, cookies, vraie projection, preuves réelles, identifiants de compte, configuration active ni dossiers clients.

Le manifeste relève HEAD et l'état Git avant/après la construction : source propre et HEAD stable donnent `sourceSha:SHA_TESTÉ`, sinon `sourceSha:null` et `localUncommitted:true`. Le premier paquet local non committé reste historique ; l'alignement ne lui attribue pas rétroactivement un SHA. Même un paquet de source propre reste `readyToDeploy:false` et `deployed:false` : ni cible prête ni accord de livraison ne sont déduits. La copie de `SignedMessage.php` est dérivée de CONNECT et contrôlée par empreinte, pas une seconde implémentation maintenue à la main.

Le [workflow CI dédié](../workflows/ci-developpements.md) explicite lint, suites PHP, refus et lecture seule sur fixtures, build normal sans module privé et contrôle du paquet lié au SHA exact. Les empreintes de sorties Windows/Linux restent distinctes si leurs octets diffèrent ; le même SHA ne permet pas de les confondre.

## Configuration future, non créée sur le serveur

Les modèles de référence sont dans `workflows/templates/` et sont copiés sans interpolation par le constructeur :

| Modèle | Destination future, à qualifier | Particularité |
| --- | --- | --- |
| `developments.example.php` | Configuration privée Projet `developments.php` | Propriétaire/origine relus depuis le planning existant ; aucun second ID |
| `connect-developments.example.php` | Fichier privé sélectionné par `DEVELOPMENTS_PRIVATE_CONFIG` | ID CONNECT, deux clés et répertoire des nonces dédiés |
| `drupal-authority.example.php` | Valeur privée de `$settings['avereo_developments_authority']` | Le modèle retourne un tableau ; il ne modifie pas Settings |

Tous gardent `enabled:false`, secrets et identifiants vides, domaines `example.invalid`. Changer seulement `enabled` ne suffit pas à rendre ces modèles opérationnels. Ils ne sont pas chargés automatiquement et ne doivent jamais être copiés sous une racine web. L'ID CONNECT doit être celui du propriétaire du planning existant ; le sujet Drupal doit être celui effectivement lié à ce compte, sans privilège déduit du nom, e-mail, UID 1 ou rôle d'organisation.

Relations à renseigner uniquement après accord : clé Projet = `CONNECT.project_key`, clé d'autorité `CONNECT.identity_key` = `Drupal.secret` ; ces deux clés doivent être distinctes entre elles, de la clé de publication et des secrets de lancement/session existants. Aucun secret réel n'est créé par la préparation.

Le fichier privé `developments.php`, hors webroot, contient :

- `enabled:false` tant que les prérequis ne sont pas levés ;
- `environment:preproduction` ;
- `planning_config_file` : fichier existant, lu seulement pour propriétaire/origine/répertoire à préserver ;
- `runtime_directory`, `asset_directory` et `storage_directory` : trois emplacements privés qualifiés ; stockage du cockpit distinct et non imbriqué dans celui des clients ;
- `project_channel_key` : secret dédié distinct du secret du sas et de la clé de publication ;
- `connect_authorization_url` : HTTPS, route exacte `/api/v1/developments/authorize`, sans redirection.

Le chemin par défaut est `/home/<compte>/.avereo/projet-preprod/developments.php`. `AVEREO_DEVELOPMENTS_CONFIG` permet un chemin privé explicitement configuré. Aucun paramètre de requête ne change ce chemin. Le runtime lit la clé de publication du seul stockage dédié déjà admis ; aucune clé n'est fabriquée ou affichée par une requête.

POSIX : propriétaire du processus qualifié, répertoires 0700, fichiers 0600 ; validation hors webroot et refus des liens. Cette protection ne sépare pas deux applications sous le même compte Unix. Sous Windows, les ACL sont à qualifier via l'outil local existant ; une recette sous Windows n'atteste pas les permissions de l'hôte.

## Plan avant installation autorisée

1. Aligner le candidat sur le Git courant, produire le SHA/PR/CI requis et examiner les changements ; ne pas écraser les travaux locaux ni les anciennes preuves.
2. Vérifier directement la configuration propriétaire existante et le code du sas installé ; rapprocher identité CONNECT, sujet Drupal et rôle global, sans changer les vrais droits.
3. Qualifier les URLs/services du pont, le runtime PHP/cURL/TLS/horloges, les clés séparées, les ACL et le fonctionnement du cache/verrou Drupal.
4. Qualifier le stockage privé cible, son quota et la copie initiale explicitement permise ; le paquet de code n'embarque pas la projection réelle.
5. Préparer le canal privé de publication et son admission/activation atomique. **Aucun transfert distant ou synchronisation continue n'est installé ici.** Ne pas recopier un ancien index pour revenir silencieusement en arrière.
6. Sauvegarder les fichiers/répertoires concernés, sans englober ou restaurer une base/planning client. Vérifier une restauration sur copie, l'indépendance des sauvegardes et la capacité à retirer le module seul.
7. Qualifier la maintenance des nonces CONNECT (limite actuelle 4096, sans purge automatique) et la rétention des projections (20 instantanés, sans purge automatique).
8. Obtenir l'accord ciblé d'installation, puis seulement réaliser la recette hébergée du même candidat : propriétaire réel en lecture seule, autres profils fictifs/refus, révocation sur fixtures, deux navigateurs et PC éteint.

Retour arrière prévu : fermer le module (`enabled:false`), retirer son lien optionnel, restaurer uniquement ses points d'entrée/runtime/assets approuvés. Garder la projection et son historique privés ; ne pas remplacer le planning, la configuration CONNECT ou les données clients. La procédure reste à éprouver sur la cible avant usage.

## Publication privée — procédure préparée, transport non installé

1. Qualifier et autoriser source par source le stockage canonique privé ; ne pas déplacer les vrais suivis sans accord. L'historique déjà public reste un problème distinct, non résolu par un lecteur privé.
2. Préparer le registre privé avec toutes ses entrées `writable:false`, la liste des preuves explicitement permises et les empreintes avant export. Ne joindre ni projection réelle, ni pièce, ni secret à une PR publique ou à un artefact CI.
3. Exporter une projection signée avec une séquence strictement supérieure au `highWater` distant observé, en conservant génération, provenance et versions déclarées. Conserver les sources byte-for-byte ; la lecture multi-dépôts n'est pas transactionnelle.
4. Après accord de transfert, employer un canal privé authentifié à qualifier. Aucun transfert, agent permanent ni endpoint d'import navigateur n'est implémenté par ce lot. L'API interne `importSnapshot()` n'est pas exposée sur Internet.
5. Sur la cible qualifiée, vérifier signature, schéma, empreintes, taille, quota et séquence avant activation atomique de l'index. Conserver un reçu privé avec séquence/hash/date, jamais la clé.
6. Relire le résultat avec le propriétaire réel en lecture seule ; comparer catalogue, versions, critères/preuves dans deux navigateurs puis avec le poste arrêté. « Actualiser » relit la copie publiée, pas les sources du poste. La première publication peut rester manuelle ; aucune synchronisation continue n'est annoncée.

## Récupération ciblée — procédure préparée et copie fictive testée

Avant toute écriture future : inventorier les chemins réels, versions/hash et permissions ; qualifier l'espace/quota et une sauvegarde fraîche indépendante. Séparer sauvegarde de code/configuration du module, copie privée de projection et garde témoin des plannings/dossiers clients. Les sauvegardes ne vont jamais sous une racine servie ou dans un dépôt public.

Sur une copie isolée et non servie, restaurer les fichiers du module seulement, comparer chaque hash et tester le lecteur avec des fixtures. Le test local `development-preparation.test.mjs` copie un stockage fictif de séquence 2, restaure explicitement le précédent (séquence 1), vérifie `highWater:2`, refuse le rejeu de 2 puis accepte 3. L'original reste à 2 avec son index identique ; les sources fictives restent byte-for-byte identiques. Ce test ne prouve ni l'indépendance, ni la restauration d'une sauvegarde hébergée.

Une récupération technique de projection utilise `restorePrevious()` et conserve le seuil anti-rejeu ; **ne jamais recopier un ancien `index.json` sur l'index actif**. Si l'index ou sa séquence haute sont perdus/corrompus, fermer le module, conserver l'incident et faire qualifier la reconstruction et le seuil depuis les reçus indépendants ; aucune réparation automatique n'est fournie. Un retour de code ne justifie pas une restauration complète d'identité, de base CONNECT ou de planning client.

Après accord ciblé de retour arrière : désactiver le module, retirer uniquement son inclusion optionnelle, restaurer seulement ses points d'entrée/runtime/assets et les paramètres dédiés approuvés. Ne pas remplacer les configurations globales CONNECT/Drupal ni le Gantt par des copies anciennes. Garder privé l'historique des projections. Comparer ensuite plannings/configurations hors lot aux témoins ; compte, rôle et autres développements restent inchangés.

## Livraison publique, moindre privilège et horloges — réserves explicites

Le workflow public `deploy-projet-o2switch.yml` contient `rsync -az --delete` et cible la production, pas une installation privée du module. Le plan conserve l'empreinte exacte de ce fichier ; ce constat de source ne qualifie pas les secrets GitHub ni le chemin réel. Un module absent du build normal peut être supprimé par une telle livraison si les cibles se recouvrent. **Workflow inchangé et usage pour ce module bloqué.** Proposition à examiner séparément : protéger/exclure `/developpements/***`, contrôler les protections existantes du sas/API clients, inventorier la destination et examiner un dry-run sans suppression. Aucun ajout d'exclusion, dry-run distant ou remplacement de template hébergé n'est effectué ici.

Moindre privilège proposé, non appliqué : fichiers dédiés 0600 et dossiers 0700, propriétaire effectif du processus web à qualifier, hors de toutes les racines servies et sans liens. Pour les paramètres Drupal partagés, qualifier d'abord les UID PHP/CLI et le mécanisme de sauvegarde ; ne pas appliquer aveuglément un chmod global. Un compte Unix partagé reste une limite de cloisonnement.

L'écart relatif poste/serveur précédemment observé ne désigne pas l'horloge correcte. Préparer une comparaison UTC de chaque acteur avec une référence indépendante, puis une demande de correction ciblée sur l'acteur erroné. Aucun service d'heure, horloge ou permission n'est modifié ; tolérance d'avance de 5 s et durée maximale de 30 s inchangées. Les échanges entre services hébergés doivent être qualifiés séparément des messages émis depuis le poste.

## Phases et résultats de recette

**Cadrage → Développement local → Préproduction → Mise en production.** Le lot reste en Développement local, préparation de préproduction avec réserves. La phase Préproduction n'est pas démarrée ; aucun accord humain n'est créé.

Tests locaux : session au format natif signée, chaîne broker/autorité sur fixtures, rôle/requête/temps/identité invalides, période et révocation existantes, données et fichiers refusés avant lecture, intégrité Node/PHP et stockage inchangé. Les tests de service ne sont pas un kernel Drupal ni un test sur ton compte réel. Le reçu canonique du cockpit porte les résultats effectivement exécutés et le candidat.

La première utilisation de la vraie session sur le module, le menu hébergé, les versions réellement installées, les sauvegardes/quotas et la synchronisation distante restent **À VÉRIFIER** après autorisation et installation.
