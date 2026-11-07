---
project: avereo-app-projet
document_type: preparation-preproduction
title: Module Développements — session Projet et préparation de préproduction
status: active
version: git
created: 2026-11-07
updated: 2026-11-07
owner: jpdandin
tags: [projet, developpements, session, preproduction, prive]
---

# Session Projet et préparation de préproduction

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
    configuration/              exemple PHP enabled=false, sans secret réel
    dependencies/               empreintes du pont CONNECT/Drupal requis
    installation.md             copie dérivée du présent guide
```

Les chemins `public/` et `private/` ne sont pas des instructions d'installation automatique. **Ne pas téléverser le dossier entier sous la racine web.** Les fichiers privés doivent être placés hors de toutes les racines servies ; les points d'entrée seuls vont sous `developpements/`. Le paquet ne contient ni clés de publication, cookies, vraie projection, preuves réelles, identifiants de compte, configuration active ni dossiers clients.

Le manifeste relève HEAD et l'état Git avant/après la construction : source propre et HEAD stable donnent `sourceSha:SHA_TESTÉ`, sinon `sourceSha:null` et `localUncommitted:true`. Le premier paquet local non committé reste historique ; l'alignement ne lui attribue pas rétroactivement un SHA. Même un paquet de source propre reste `readyToDeploy:false` et `deployed:false` : ni cible prête ni accord de livraison ne sont déduits. La copie de `SignedMessage.php` est dérivée de CONNECT et contrôlée par empreinte, pas une seconde implémentation maintenue à la main.

Le [workflow CI dédié](../workflows/ci-developpements.md) explicite lint, suites PHP, refus et lecture seule sur fixtures, build normal sans module privé et contrôle du paquet lié au SHA exact. Les empreintes de sorties Windows/Linux restent distinctes si leurs octets diffèrent ; le même SHA ne permet pas de les confondre.

## Configuration future, non créée

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

## Phases et résultats de recette

**Cadrage → Développement local → Préproduction → Mise en production.** Le lot reste en Développement local, préparation de préproduction avec réserves. La phase Préproduction n'est pas démarrée ; aucun accord humain n'est créé.

Tests locaux : session au format natif signée, chaîne broker/autorité sur fixtures, rôle/requête/temps/identité invalides, période et révocation existantes, données et fichiers refusés avant lecture, intégrité Node/PHP et stockage inchangé. Les tests de service ne sont pas un kernel Drupal ni un test sur ton compte réel. Le reçu canonique du cockpit porte les résultats effectivement exécutés et le candidat.

La première utilisation de la vraie session sur le module, le menu hébergé, les versions réellement installées, les sauvegardes/quotas et la synchronisation distante restent **À VÉRIFIER** après autorisation et installation.
