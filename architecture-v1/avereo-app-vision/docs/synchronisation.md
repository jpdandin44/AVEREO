---
project: avereo-app-vision
document_type: protocol
title: Synchronisation et médias terrain
status: active
version: git
created: 2026-11-24
updated: 2026-11-26
owner: jpdandin
tags: [vision, synchronisation, terrain]
---

# Protocole de synchronisation — AVEREO Vision

Statut : écrit au Lot 2B (24/11/2026), contrat commun du serveur (`frontend/public/api/sync.php`, `lib/sync.php`) et du client (`frontend/src/sync/`). Toute évolution passe par ce fichier d'abord. Exigences : R01 (fin), R03, R04 (partie logique), R05, R06.

## 1. Principes
- **Local d'abord** : toute modification s'écrit dans le stockage local (Dexie) puis part au serveur dès que possible. Aucun bouton « Enregistrer » (R03).
- **Un objet = une unité de synchronisation** (R06) : `batiment`, `niveau`, `piece`, `ouverture`, `photo`, `commentaire`. Les murs sont déduits du contour de la pièce (pas d'objet). Les cotes laser sont dans la pièce ; les octets photo sont séparés (§8). La vidéo reste au Lot 3B.
- **Dernière modification reçue gagne, par objet.** « Dernière » = ordre de réception par le serveur (`seq`), jamais l'horloge de l'appareil. L'état écrasé est inscrit au **journal** ; aucun objet n'est perdu en silence.
- **Suppressions logiques** (`deleted`) : elles se propagent ; seul le serveur purge.
- **Pas de temps réel** : envoi/réception à l'ouverture d'un projet, après chaque enregistrement local, au retour du réseau, au retour de l'onglet au premier plan, et **toutes les 30 s** (valeur proposée, à confirmer).
- Longueurs en **millimètres entiers**. Identifiants **générés par le navigateur**.

## 2. Objets
Un objet synchronisé : `{object_id, kind, parent_id, data, rev, deleted}` (plus `seq`, `updated_by`, `device_id` côté serveur).
- `object_id` : `^[A-Za-z0-9_-]{1,64}$`, unique dans le projet. Identifiants par défaut déterministes d'un projet neuf : `batiment-1`, `niveau-1` (deux appareils qui ouvrent le même projet vide créent le même objet).
- `rev` : compteur propre à l'objet, 1 à la création, +1 à chaque changement accepté.
- `seq` : compteur croissant **par projet**, attribué à chaque changement accepté ; c'est le curseur de réception.

| `kind` | `parent_id` | `data` (aucune autre clé n'est admise) |
|---|---|---|
| `batiment` | `null` | `{nom: texte 1–160}` |
| `niveau` | id du bâtiment | `{nom: texte 1–160, ordre: entier 0–9999}` |
| `piece` | id du niveau | `{nom: texte 1–160, hauteurMm: entier 1–100000, ordre: entier 0–9999, sommets: 3 à 64 points {x, y}, entiers −100 000 000 à 100 000 000}` |
| `ouverture` | id de la pièce | `{type: "porte"\|"fenetre", murIndex: entier 0–63, positionMm: entier 0–100 000 000, largeurMm: entier 1–100 000, hauteurMm: entier 1–100 000, alleMm: entier 0–100 000}` |

Les entiers sont des entiers JSON stricts (`2500.0` est refusé). Limites : `data` ≤ 8 192 octets en JSON ; 64 ouvertures par pièce (appliqué par le client) ; 5 000 objets par projet (413 `project_too_large` au-delà) ; 100 changements par envoi ; corps ≤ 262 144 octets. L'ordre des niveaux et des pièces vient de `ordre` puis de l'identifiant.

## 3. Envoi et réception
`POST /api/sync.php?project=<id du projet>` — `Content-Type: application/json`.
```json
{
  "device_id": "3f9c1a7e55d24b0a8c61d0f7a2b94e10",
  "since": 12,
  "changes": [
    {"object_id": "piece-ab12cd34-1", "kind": "piece", "parent_id": "niveau-1", "base_rev": 3, "deleted": false,
     "data": {"nom": "Salon", "hauteurMm": 2500, "ordre": 0, "sommets": [{"x":0,"y":0},{"x":4000,"y":0},{"x":4000,"y":3000},{"x":0,"y":3000}]}},
    {"object_id": "ouv-9a8b7c6d-2", "kind": "ouverture", "parent_id": "piece-ab12cd34-1", "base_rev": 2, "deleted": true}
  ]
}
```
- `device_id` : `^[A-Za-z0-9_-]{8,64}$`, tiré au hasard une fois par navigateur et par compte.
- `since` : dernier `seq` déjà reçu (0 pour tout recevoir). `changes` peut être vide (réception seule).
- `base_rev` : le `rev` de l'objet **tel que l'appareil le connaissait** lors de sa première modification non encore envoyée ; 0 pour un objet que l'appareil crée. `data` est absent (ou `null`) si `deleted` vaut `true`.

Réponse `200` :
```json
{
  "ok": true,
  "applied": [{"object_id": "piece-ab12cd34-1", "rev": 4, "seq": 13, "status": "applied"}],
  "changes": [{"object_id": "…", "kind": "…", "parent_id": "…", "data": {}, "deleted": false, "rev": 4, "seq": 13, "updated_by": "12", "device_id": "…"}],
  "seq": 15,
  "has_more": false
}
```
- `applied[].status` : `applied` (rev augmenté), `conflict` (appliqué **et** l'état écrasé est au journal), `unchanged` (identique à l'état du serveur : rien n'est écrit, aucun `seq`). Le rejeu d'un envoi déjà accepté donne donc `unchanged` ou `conflict` sans doublon.
- `changes` : objets du projet dont `seq > since`, dans l'ordre des `seq`, au plus 500 par réponse, lus dans **un instantané cohérent** (borné par le `seq` du projet au début de la transaction). Les changements que l'appareil vient d'envoyer y figurent aussi : le client les ignore s'il a déjà ce `rev`.
- `seq` : curseur à mémoriser pour le prochain appel ; si `has_more` est `true`, reprendre aussitôt avec ce curseur.
- Les changements d'un envoi s'appliquent **dans l'ordre**, dans une seule transaction avec verrou sur le compteur du projet : tout ou rien. Une modification invalide fait refuser **tout l'envoi** (422 avec `fields` indiquant l'indice).

`GET /api/sync.php?project=<id>&since=<N>` : réception seule, même réponse sans `applied`.

### Règle de conflit (R06)
Pour chaque changement reçu, dans l'ordre :
1. objet inconnu : création (`rev` 1) ; `base_rev` attendu 0 mais non exigé (un envoi rejoué après création reste `unchanged`) ;
2. valeur identique (même `parent_id`, même `deleted`, même `data`) : `unchanged` ;
3. `base_rev` = `rev` du serveur : `applied`, `rev + 1` ;
4. sinon (`base_rev` ≠ `rev`) : le changement est **quand même appliqué** (`rev + 1`). Si la valeur écrasée vient d'**un autre appareil**, le statut est `conflict` et l'état précédent du serveur est inscrit au journal : valeur écrasée, `rev` écrasé, appareil et auteur de cette valeur, appareil et auteur du gagnant. Si elle vient du **même appareil** (réponse perdue, rejeu avec un `base_rev` périmé), c'est un simple `applied` : un appareil ne s'écrase pas lui-même, rien n'est journalisé.

Conséquence : un appareil ne perd jamais une modification sans trace ; celui dont la valeur est écrasée la retrouve au journal (filtrer sur son `device_id`).

## 4. Journal des écrasements
`GET /api/sync.php?project=<id>&journal=1[&after=<id>]` → `{"ok": true, "entries": [...]}`, 200 entrées au plus, par `id` croissant.
```json
{"id": 7, "seq": 15, "object_id": "piece-ab12cd34-1", "kind": "piece", "created_at": "2026-11-24T20:01:02.123Z",
 "lost": {"rev": 3, "data": {"nom": "Salon"}, "deleted": false, "device_id": "…", "by": "12"},
 "won": {"rev": 4, "device_id": "…", "by": "12"}}
```
Visible par quiconque peut lire le projet (propriétaire, fondateur).

## 5. Projets et création hors ligne
- `POST /api/projects.php` accepte un champ optionnel **`id`** (32 caractères hexadécimaux minuscules, généré par le navigateur avec `crypto.getRandomValues`). Sans `id`, le serveur en choisit un (comportement du Lot 2A). Création avec un `id` : `201` ; **rejeu** d'une création par le même propriétaire : `200` avec le projet **existant** (jamais modifié par le rejeu : le client compare les champs et envoie une modification si besoin), sans doublon ; `id` déjà pris par un autre propriétaire : `409 id_conflict`. Un `id` mal formé est refusé (`422`) ; il ne se modifie jamais (`PATCH` : champ inconnu).
- Le client met en file ses créations (`projet.creer`), renommages et archivages ; il les envoie **avant** les objets du projet.
- Un projet archivé refuse l'envoi d'objets (`409 project_archived`) et reste lisible.

## 6. Client
- **Stockage local** (Dexie, base `avereo-vision`, **cloisonnée par identité** `provider:id`) : `projets`, `objets` (`{projectId, id, kind, parentId, data, rev, deleted}`), `file` (modifications non envoyées), `journal`, `meta` (`device_id`, dernier `seq` par projet, identité connue).
- **Enregistrement automatique** (R03) : à chaque état validé du relevé, comparaison avec l'état persisté (`diff`), écriture locale **immédiate** (aucun délai : une page rechargée aussitôt retrouve la modification) et mise en file ; seul l'envoi est différé de 1,5 s après le dernier enregistrement. Un état reçu du serveur n'est jamais renvoyé (le diff se fait contre l'état persisté).
- **File d'envoi** : les modifications successives d'un même objet sont regroupées (dernière valeur, **premier** `base_rev`) ; supprimer un parent supprime ses enfants. Une création suivie d'une suppression s'annulent **seulement si la création n'est jamais partie** : une entrée est marquée « envoyée » avant l'appel réseau (la réponse peut se perdre alors que le serveur a reçu la création), et la suppression part alors aussi.
- **Corrections pendant un envoi** : l'acquittement et le refus ne retirent que la **version** envoyée de l'entrée ; une modification faite pendant la requête reste dans la file avec le `rev` renvoyé comme base. Les numéros de version ne sont **jamais réutilisés** (horloge + aléa) : la réponse tardive d'un autre onglet pour une version déjà acquittée ne retire pas la modification suivante.
- **Plusieurs onglets, une seule base** : le moteur ne garde aucun état de projet en mémoire ; chaque opération relit l'état enregistré sous un verrou entre onglets (Web Locks) et les onglets se préviennent par `BroadcastChannel`. Aucune modification de la file n'est perdue quand deux onglets saisissent en même temps.
- **Un seul compte à la fois** : chaque requête du client porte l'en-tête `X-Vision-Expected-Identity: <fournisseur>:<identifiant>` (le compte de la base locale). Si la session est devenue celle d'un autre compte, le serveur répond `409 identity_changed` **avant toute lecture ou écriture** ; le client suspend ses envois (« Autre compte connecté : rechargez la page »), sans rien perdre ni rien envoyer sous l'autre compte.
- **Réception sur modification locale en attente** : l'objet local est conservé et son `base_rev` **n'est pas relevé** ; au prochain envoi, le serveur voit l'écart et journalise l'écrasement (R06).
- **Cohérence** : une ouverture dont le mur n'existe plus (un appareil a supprimé un sommet) est **signalée « hors plan »**, jamais supprimée.
- **Indicateur** (libellé et icône, jamais la couleur seule) : « Enregistré », « En attente d'envoi (n) », « Hors ligne », « Reconnexion nécessaire ».
- **Hors ligne** : une coupure réseau, ou une erreur 5xx **sans JSON** (proxy, passerelle, maintenance : notre API répond toujours en JSON), est traitée comme « Hors ligne » ; une erreur 5xx JSON de l'API est « Envoi impossible ». Dans les deux cas rien n'est perdu et l'envoi est retenté.
- **Sans réseau au démarrage** : l'application rouvre avec la dernière identité connue de l'appareil (`localStorage`, sans secret) et la base locale de ce compte ; le serveur reverifie la session à chaque envoi. « Se déconnecter » oublie cette identité mais garde les données locales, cloisonnées par compte.
- **401** (cookie CONNECT expiré) : la file n'est **jamais** vidée ; l'indicateur demande de relancer l'application depuis CONNECT ; l'envoi reprend ensuite.
- **Refus** : un `422` qui cite des changements (`changes.N…`) retire seulement ces changements de la file (version envoyée), qui passent en « refusés » (visibles, contenu conservé). Un `413`/`422` qui ne désigne personne (plafond du projet, corps trop gros) fait **réduire le lot de moitié** jusqu'à isoler le fautif : les modifications valides partent. Un `422` portant sur l'enveloppe (`device_id`, `since`) est une erreur d'envoi, jamais un refus de modification. Un `409 id_conflict` sur une création de projet est un refus définitif.
- **Journal** : relu après chaque réception venant d'un autre appareil ou chaque conflit ; si la lecture échoue, elle est reprise aux cycles suivants jusqu'à réussir. **Liste des projets** : si le serveur répond par une erreur (500, 503) alors que l'appareil n'a aucun projet en cache, l'écran le dit au lieu d'afficher « Aucun projet ». **Écriture locale en échec** (espace insuffisant) : bandeau d'alerte et reprise automatique toutes les 3 s.
- **Plusieurs projets** : un projet archivé ou introuvable n'empêche pas la synchronisation des suivants ; une coupure, une session perdue, un autre compte ou une erreur serveur interrompent le cycle.
- **Projet archivé** : l'envoi est refusé (`409 project_archived`) mais le client **reçoit quand même** (`GET`) les modifications des autres appareils ; ses modifications locales attendent la réactivation.
- Limites : historique annuler/rétablir non persisté ; 200 projets actifs au plus gardés en local ; stockage local non chiffré (protection = verrouillage de l'appareil) ; quota et éviction iOS à vérifier (R04, Lot 2C).

## 7. Sécurité
- Authentification et droits comme `docs/authentication.md` : lecture (`read`) pour recevoir et pour le journal, écriture (`update`) pour envoyer ; projet d'autrui → **404** ; archivé → lecture seule.
- Toutes les entrées sont validées par type (§2) ; requêtes préparées ; aucune donnée d'un projet dans les journaux d'erreur ; le contenu de `data` n'est jamais interprété par le serveur au-delà de la validation.
- Le journal et les objets sont cloisonnés par projet : l'identifiant du projet est vérifié avant toute lecture.

## 8. Contrat terrain T-10

Le lot 3A ajoute `photo` et `commentaire`, enfants du niveau, sans champ obligatoire nouveau dans les anciens relevés. `cotesLaser` est un champ optionnel des données de la pièce. La validation refuse les clés inconnues, nombres non entiers et objets de plus de `VISION_SYNC_MAX_DATA_BYTES` (8192 octets). La migration 004 doit précéder l'utilisation de ces types côté serveur.

Exemples de `data` (l'identifiant photo est un UUID minuscule généré par le navigateur) :

```json
{"xMm":100,"yMm":200,"pieceId":"salon","legende":"Mur nord","prisLe":"2026-11-26T12:00:00.000Z","largeurPx":1920,"hauteurPx":1080,"tailleOctets":125000,"sha256":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","mime":"image/jpeg"}
```

```json
{"texte":"Fissure à examiner","cible":{"type":"mur","pieceId":"salon","murIndex":0,"positionMm":1000}}
```

La cible d'un commentaire peut aussi être `{type:"point",xMm,yMm}`, `{type:"piece",pieceId}` ou `{type:"photo",photoId}`. Texte : 1 à 500 caractères Unicode, non blanc. Coordonnées : millimètres entiers dans ±100 000 000 ; indice de mur : 0 à 63 ; position sur mur : 0 à 100 000 000. Une cible absente donne `null` dans `positionCommentaire` et doit être signalée par le futur écran.

`cotesLaser` : `{longueur?:{murIndex,valeurMm},largeur?:{murIndex,valeurMm},controle?:{type:"hauteur",valeurMm}|{type:"diagonale",deSommet,aSommet,valeurMm}}`. Valeurs : 1 à 100 000 mm ; indices entiers présents dans le contour. L'écart absolu est comparé à `TOLERANCE_MM` (20). Une différence de 20 mm reste `ok`, au-delà `hors-tolerance`, avec texte et icône.

### Fonctions pour les écrans

Dans `frontend/src/domain/terrain.js` :

- `evaluerCotesLaser(piece)` → tableau `{nom,modeleMm,valeurMm,ecartMm,etat,icone,libelle}` ; lève si valeur ou repère invalide.
- `validerCommentaire(commentaire)` → validité du texte ; la cible est validée côté serveur.
- `positionCommentaire(niveau,commentaire)` → `{xMm,yMm}|null`. Une cible pièce utilise la moyenne des sommets ; une cible mur garde sa distance depuis le début du mur, même si elle dépasse un mur raccourci (à signaler par l'écran).
- `commentairesConcernes(niveau,cible)` → liste sans mutation. Cible de suppression : `{type:"piece",pieceId}`, `{type:"photo",photoId}` ou `{type:"sommet",pieceId,sommetIndex}`.
- `supprimerCible(niveau,cible,"supprimer"|"detacher")` → `{ok:true,niveau,concernes}` ou refus géométrique `{ok:false,message}`. Détacher convertit en point à la position précédant la suppression. Supprimer un sommet concerne les deux murs voisins ; les autres indices suivent les ouvertures. Une cible sans dernière position est refusée pour le détachement.
- `insererSommetTerrain(niveau,pieceId,murIndex,t=0.5)` → résultat avec niveau ; les commentaires suivent le découpage comme les ouvertures. Utiliser ces fonctions sur le niveau pour les modifications topologiques. Les fonctions du modèle renumérotent les cotes non touchées ; les cotes liées aux murs transformés ou aux sommets supprimés sont retirées et doivent être ressaisies.

Dans `frontend/src/sync/medias.js`, `creerMedias(moteur,projetId,niveauId)` est le service équivalent à `useMedias`, sans écran ni dépendance à React :

- `await ajouterPhoto(fichier,{xMm,yMm,pieceId?})` → `Photo` ; compression JPEG, empreinte, blob local, puis objet synchronisable.
- `await urlPhoto(photoId)` → URL blob locale si disponible ; sinon téléchargement par le client API lié à l'identité, puis URL blob. Les URL sont temporaires, à garder hors du modèle.
- `await supprimerPhoto(photoId,choix="detacher")` → suppression de l'objet et détachement/suppression des commentaires ; intention persistante de suppression du fichier serveur, y compris après une réponse PUT perdue.
- `fermer()` libère les URL blob ; l'appeler au démontage ou au changement de projet/compte.

Le moteur expose `modifierBatiment(projetId,fonctionPure)` pour modifier le relevé sous verrou, `listerMedias(projetId)` pour consulter les états et erreurs, et `reessayerMedia(projetId,id)` pour une reprise explicite après correction d'un refus 4xx. Le service reçoit le moteur du compte ouvert par `useMoteur` ; ne jamais le partager entre identités.

### Envoi et stockage des fichiers

Dexie v2 ajoute `medias` (clé `[projectId+id]`, index `projectId`, `etat`), en conservant les tables v1 : `{id,projectId,etat:"a-envoyer"|"envoye",blob,mime,sha256,taille,creeLe}`. Les marqueurs additionnels `supprimer` et `erreur` conservent les suppressions et refus sans boucle. Le stockage mémoire a le même contrat ; il ne survit pas au rechargement.

Le moteur attend l'acquittement de l'objet photo avant PUT. Les cycles existants (retour réseau, ouverture, minuterie) reprennent les médias, même si leur file d'objets est vide. Le compteur inclut les fichiers en attente. Les erreurs réseau/5xx sont reprises ; un 4xx définitif reste consultable et n'est pas renvoyé automatiquement. Un 401 produit le signal `reconnexion` du Lot 2D ; `identity_changed` suspend les envois. DELETE attend aussi que la suppression de l'objet soit acquittée ; 404 équivaut à une suppression déjà faite.

`compresserImage(fichier,{maxOctets:2000000,maxCote:2560})` → `{blob,largeurPx,hauteurPx}` : canvas JPEG, fond blanc, qualités de 0.9 à 0.3. Si aucun palier ne respecte le plafond, refus explicite ; aucune photo hors plafond n'est enregistrée. `dimensionsImage` et `QUALITES_JPEG` sont les décisions pures testées ; `empreinteSha256(blob)` utilise Web Crypto. La compression supprime les métadonnées de l'original en redessinant les pixels.

Le quota reste celui du navigateur : consulter `verifierStockage` de `stockage-durable.js` et afficher `decrireStockage` au prochain écran terrain. À partir de 80 % du quota utilisé, l'alerte est `presque-plein`. Une écriture locale échouée est une erreur visible, jamais un succès simulé. À VÉRIFIER : quota/éviction iOS et photo d'un autre appareil accessible hors ligne (non garanti en 3A). Les blobs pris sur cet appareil restent consultables localement.

### API privée des médias

`/api/medias.php?project=<32 hex>&id=<UUID>` : mêmes session, droits propriétaire/fondateur et en-tête `X-Vision-Expected-Identity` que la synchronisation.

| Méthode | Entrée et résultat |
|---|---|
| PUT | Corps brut ≤ 2 500 000 octets, `Content-Type: image/jpeg|image/png|image/webp`, `X-Vision-Sha256`. Signature binaire et type lus depuis l'image, empreinte recalculée. Nouveau : 201 ; même identifiant/empreinte : 200 sans réécriture ; autre contenu ou identifiant supprimé : 409. |
| GET | Octets après contrôle des droits ; type enregistré, `nosniff`, `Cache-Control: private, max-age=86400`, `Content-Disposition: inline`. Absent/supprimé : 404. |
| DELETE | Suppression logique dans `vision_media`, 200 ; fichier conservé pour purge ultérieure hors périmètre. |

Sans session : 401 ; projet inaccessible : 404 ; modification d'un projet archivé : 409 ; lecture d'un projet archivé conservée. Les chemins ne proviennent que des identifiants validés : `media_directory/<project>/<uuid>`, fichier temporaire puis renommage atomique, dossier projet 700 et fichier 600. Le précontrôle impose un dossier privé 700 accessible en écriture. Les médias n'ont aucune URL publique. `/api/` reste exclu du précache et du service worker ; seule l'API authentifiée peut lire les fichiers.
