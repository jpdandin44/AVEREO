# Protocole de synchronisation — AVEREO Vision (Lot 2B)

Statut : écrit au Lot 2B (24/11/2026), contrat commun du serveur (`frontend/public/api/sync.php`, `lib/sync.php`) et du client (`frontend/src/sync/`). Toute évolution passe par ce fichier d'abord. Exigences : R01 (fin), R03, R04 (partie logique), R05, R06.

## 1. Principes
- **Local d'abord** : toute modification s'écrit dans le stockage local (Dexie) puis part au serveur dès que possible. Aucun bouton « Enregistrer » (R03).
- **Un objet = une unité de synchronisation** (R06) : `batiment`, `niveau`, `piece`, `ouverture`. Les murs sont déduits du contour de la pièce (pas d'objet). Photos, vidéos, cotes laser, annotations viennent au Lot 3.
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

Limites : `data` ≤ 8 192 octets en JSON ; 64 ouvertures par pièce (appliqué par le client) ; 5 000 objets par projet (413 `project_too_large` au-delà) ; 100 changements par envoi ; corps ≤ 262 144 octets. L'ordre des niveaux et des pièces vient de `ordre` puis de l'identifiant.

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
4. sinon (`base_rev` ≠ `rev`) : le changement est **quand même appliqué** (`rev + 1`, `status: conflict`), et l'état précédent du serveur est inscrit au journal : valeur écrasée, `rev` écrasé, appareil et auteur de cette valeur, appareil et auteur du gagnant.

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
- `POST /api/projects.php` accepte un champ optionnel **`id`** (32 caractères hexadécimaux minuscules, généré par le navigateur avec `crypto.getRandomValues`). Sans `id`, le serveur en choisit un (comportement du Lot 2A). Création avec un `id` : `201` ; **rejeu** d'une création par le même propriétaire avec les mêmes champs : `200` avec le projet existant, sans doublon ; `id` pris par un autre propriétaire ou champs différents : `409 id_conflict`.
- Le client met en file ses créations (`projet.creer`), renommages et archivages ; il les envoie **avant** les objets du projet.
- Un projet archivé refuse l'envoi d'objets (`409 project_archived`) et reste lisible.

## 6. Client
- **Stockage local** (Dexie, base `avereo-vision`, **cloisonnée par identité** `provider:id`) : `projets`, `objets` (`{projectId, id, kind, parentId, data, rev, deleted}`), `file` (modifications non envoyées), `journal`, `meta` (`device_id`, dernier `seq` par projet, identité connue).
- **Enregistrement automatique** (R03) : à chaque état validé du relevé, comparaison avec l'état persisté (`diff`), écriture locale (délai 400 ms après le dernier changement), mise en file, puis envoi. Un état reçu du serveur n'est jamais renvoyé (le diff se fait contre l'état persisté).
- **File d'envoi** : les modifications successives d'un même objet sont regroupées (dernière valeur, **premier** `base_rev`) ; création puis suppression avant tout envoi s'annulent ; supprimer un parent supprime ses enfants.
- **Réception sur modification locale en attente** : l'objet local est conservé et son `base_rev` **n'est pas relevé** ; au prochain envoi, le serveur voit l'écart et journalise l'écrasement (R06).
- **Cohérence** : une ouverture dont le mur n'existe plus (un appareil a supprimé un sommet) est **signalée « hors plan »**, jamais supprimée.
- **Indicateur** (libellé et icône, jamais la couleur seule) : « Enregistré », « En attente d'envoi (n) », « Hors ligne », « Reconnexion nécessaire ».
- **401** (cookie CONNECT expiré) : la file n'est **jamais** vidée ; l'indicateur demande de relancer l'application depuis CONNECT ; l'envoi reprend ensuite.
- Après un `409 id_conflict` ou un `422`, l'élément de la file en cause passe en « refusé » (visible), sans bloquer les suivants.
- Limites : historique annuler/rétablir non persisté ; 200 projets actifs au plus gardés en local ; stockage local non chiffré (protection = verrouillage de l'appareil) ; quota et éviction iOS à vérifier (R04, Lot 2C).

## 7. Sécurité
- Authentification et droits comme `docs/authentication.md` : lecture (`read`) pour recevoir et pour le journal, écriture (`update`) pour envoyer ; projet d'autrui → **404** ; archivé → lecture seule.
- Toutes les entrées sont validées par type (§2) ; requêtes préparées ; aucune donnée d'un projet dans les journaux d'erreur ; le contenu de `data` n'est jamais interprété par le serveur au-delà de la validation.
- Le journal et les objets sont cloisonnés par projet : l'identifiant du projet est vérifié avant toute lecture.
