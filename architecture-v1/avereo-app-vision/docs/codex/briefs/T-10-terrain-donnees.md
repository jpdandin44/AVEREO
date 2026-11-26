# Brief Codex T-10 — Lot 3A : données, serveur et synchronisation des cotes laser, photos et commentaires

Lot : 3A — Branche : `vision/lot-3a-terrain` (depuis `main`) — Rédigé par Claude Code le 26/11/2026

## Contexte
Lis `architecture-v1/avereo-app-vision/AGENTS.md`, `docs/exigences.md` (R13, R17, R36, R37, R38), `docs/synchronisation.md`, `docs/architecture.md`, puis les fichiers cités.

Décisions du responsable (26/11/2026) : le Lot 3 est découpé en **3A** (écrans terrain, cotes laser, photos, commentaires : R13, R17, R36, R37, R38) puis **3B** (vidéo, envoi tus, R14 à R16). Photos et vidéos sont stockées **chez O2Switch, dans un dossier privé hors racine web**, servies seulement par l'API après contrôle de session et de droits. Les relevés montrent des logements de particuliers : aucune donnée ne sort des serveurs AVEREO.

**Ce brief couvre la partie données, serveur et moteur de synchronisation de 3A.** L'interface (écrans, marqueurs sur le plan Konva, boîtes de dialogue) sera faite ensuite par Claude Code : expose des fonctions et des hooks propres, documentés et testés, sans écrire d'écran.

Fichiers à lire : `frontend/src/domain/modele.js` (Piece : `sommets`, `ouvertures` avec `murIndex` et `positionMm`), `domain/metres.js`, `domain/geometrie.js`, `domain/precision.js`, `domain/alertes.js`, `src/sync/` (`objets.js`, `diff.js`, `assembler.js`, `moteur.js`, `stockage-dexie.js`, `stockage-memoire.js`, `file-envoi.js`, `useMoteur.js`), `frontend/public/api/sync.php`, `api/lib/sync.php`, `api/lib/projects.php`, `api/lib/droits.php`, `api/lib/http.php`, `api/lib/config.php`, `database/migrations/002_create_vision_sync.sql`, `tests/api/sync_test.php`, `frontend/tests/sync-*.test.mjs`, `deploiement/verifier-prive.php`, `deploiement/transmettre-migrations.sh` (+ son test).

## Ce que tu fais
### 1. Modèle (logique pure, `src/domain/`)
- **Cotes laser (R17)** sur la pièce : `cotesLaser?: { longueur?: {murIndex, valeurMm}, largeur?: {murIndex, valeurMm}, controle?: {type: "hauteur", valeurMm} | {type: "diagonale", deSommet, aSommet, valeurMm} }`. Fonction pure `evaluerCotesLaser(piece)` → pour chaque cote saisie : valeur du modèle (longueur du mur, hauteur, distance entre sommets), écart en mm, et état `ok` / `hors-tolerance` (écart **> 20 mm**, tolérance R29 ; réutilise `precision.js` si une constante existe). Message et icône via `alertes.js` (jamais la couleur seule).
- **Photos (R36, R38)** au niveau : `photos: Photo[]` avec `{id, xMm, yMm, pieceId?, legende?, prisLe (ISO), largeurPx, hauteurPx, tailleOctets, sha256, mime}` ; l'image elle-même n'est pas dans l'objet.
- **Commentaires (R37)** au niveau : `commentaires: Commentaire[]` avec `{id, texte (1 à 500 caractères), cible}` où `cible` vaut `{type: "point", xMm, yMm}` | `{type: "mur", pieceId, murIndex, positionMm}` | `{type: "piece", pieceId}` | `{type: "photo", photoId}`. Fonction pure `positionCommentaire(niveau, commentaire)` → coordonnées actuelles (un commentaire de mur suit le mur quand les sommets bougent, comme une ouverture).
- Suppression d'un mur (sommet retiré), d'une pièce ou d'une photo : fonction pure qui liste les commentaires concernés et applique le choix « supprimer » ou « détacher » (détacher = convertir en `point` à sa dernière position). Mêmes règles que les ouvertures pour la renumérotation des murs.
- Tests unitaires avec valeurs chiffrées (pièce 4,00 × 3,00 m, h 2,50 m : longueur laser 4 012 mm → écart 12 mm ok ; 4 025 mm → hors tolérance ; diagonale 5 000 mm, etc.).

### 2. Synchronisation
- Nouveaux types d'objets **`photo`** et **`commentaire`** (parent : le niveau) dans `objets.js`, `assembler.js`, `diff.js` et côté serveur (`VISION_SYNC_KINDS`, validation stricte des données par type, tailles bornées, `VISION_SYNC_MAX_DATA_BYTES` respecté) ; `cotesLaser` voyage dans les données de la pièce (validation serveur des bornes : 1 mm à 100 000 mm, indices entiers).
- Rétrocompatibilité : un relevé sans ces champs reste valide ; `docs/synchronisation.md` à jour (protocole, exemples).
- Mets à jour la fixture partagée `tests/fixtures/sync/ref2-envoi.json` seulement si nécessaire, et les tests PHP et JS qui l'utilisent.

### 3. Fichiers des photos (serveur)
- Migration **`003_create_vision_media.sql`** : table `vision_media` (`id` CHAR(36) choisi par le client, `project_id`, `kind` = `photo`, `mime`, `size_bytes`, `sha256` CHAR(64), `created_by`, `created_at`, `deleted_at`), clés et index ; idempotente (`CREATE TABLE IF NOT EXISTS`). Ajoute-la à la liste de `transmettre-migrations.sh` si nécessaire (le test des dépendances doit passer).
- Nouvelle clé de configuration **`media_directory`** (chemin absolu, hors racine web ; obligatoire en préproduction et production ; en local, un dossier du conteneur) : `api/lib/config.php`, `local/config.example.php`, `local/vision-local.ps1` et `vision-revue.ps1` (dossier créé), `deploiement/verifier-prive.php` (le dossier existe, est en 700 et accessible en écriture), tests.
- **`api/medias.php`** :
  - `PUT ?project=<id>&id=<uuid>` : corps brut de l'image ; en-têtes `Content-Type` (`image/jpeg`, `image/png` ou `image/webp`) et `X-Vision-Sha256` ; **2,5 Mo au plus** ; type vérifié par les premiers octets (pas seulement l'en-tête) ; empreinte recalculée et comparée ; écriture atomique (fichier temporaire puis `rename`) dans `media_directory/<project>/<id>` avec des noms dérivés **uniquement** d'identifiants validés (aucun chemin fourni par le client) ; idempotent (même id et même empreinte : 200 sans réécrire ; même id, autre empreinte : 409) ; refus si le projet est archivé (409) ou inaccessible (404).
  - `GET ?project=<id>&id=<uuid>` : renvoie le fichier après contrôle des droits, `Content-Type` stocké, `X-Content-Type-Options: nosniff`, `Cache-Control: private, max-age=86400`, `Content-Disposition: inline` ; 404 si absent ou supprimé.
  - `DELETE` : suppression logique (le fichier reste jusqu'à une purge ultérieure, hors périmètre).
  - Droits : mêmes règles que le projet (propriétaire ou fondateur), identité attendue (`X-Vision-Expected-Identity`) comme `sync.php`.
- `frontend/public/api/.htaccess` et le service worker : `/api/` reste hors cache du service worker ; aucune URL publique de fichier.
- Tests PHP : envoi valide, idempotence, conflit d'empreinte, taille, faux type (texte nommé `.jpg`), identifiants invalides (`../`, non-UUID), projet d'autrui (404), projet archivé, lecture, suppression, et sans session (401).

### 4. Moteur côté navigateur (sans écran)
- Dexie : nouvelle version du schéma avec une table **`medias`** (`id`, `projectId`, `etat` = `a-envoyer` | `envoye`, `blob`, `mime`, `sha256`, `taille`, `creeLe`) ; migration Dexie sans perte. Équivalent dans `stockage-memoire.js`.
- Utilitaires : `compresserImage(fichier, {maxOctets: 2_000_000, maxCote: 2560})` (canvas, JPEG, qualité décroissante ; partie pure : choix de dimensions et paliers de qualité, testée), `empreinteSha256(blob)` (Web Crypto).
- Le moteur envoie les fichiers `a-envoyer` **après** la synchronisation réussie de l'objet `photo` correspondant ; reprise automatique au retour du réseau ; erreurs 4xx non répétées en boucle (état signalé) ; 401 → même signal que la synchronisation (bandeau de reconnexion du Lot 2D).
- `useMedias(projetId)` (ou équivalent) : `ajouterPhoto(fichier, {xMm, yMm, pieceId})` → compresse, enregistre localement, crée l'objet `photo` ; `urlPhoto(photoId)` → blob local s'il existe, sinon l'API ; `supprimerPhoto(photoId)`. Hors ligne : une photo prise sur l'appareil reste visible (blob local). **À VÉRIFIER** : affichage hors ligne des photos prises sur un autre appareil (non garanti en 3A).
- `docs/stockage` ou `docs/synchronisation.md` : quotas (alerte de `stockage-durable.js` quand l'espace devient faible).

### 5. Documentation
- `docs/exigences.md` : R17, R36, R37, R38 passent « en cours » avec ce qui est fait et ce qui reste (interface, essais) ; R13 reste à l'interface.
- `docs/licences.md` : rien de nouveau attendu (APIs du navigateur, PHP sans dépendance).
- `docs/deploiement-mutualise.md` : clé `media_directory` (`/home/daje3540/.avereo/vision-preprod/medias`, 700) et migration 003, **avant** le prochain déploiement.

## Ce que tu ne fais pas
- Pas d'écran ni de composant d'interface (Claude Code s'en charge) ; pas de vidéo (3B).
- Pas de déploiement, pas de connexion au serveur, pas de secret, pas de réglage GitHub.
- Pas de modification d'un autre sous-projet ; pas de changement des tables existantes (ajout de la table `vision_media` seulement).
- Pas de dépendance nouvelle.

## Terminé quand
- `npm test` (frontend), `node --test deploiement/*.test.mjs` et `php tests/api/run.php` passent (Claude Code relancera le mode strict PHP 8.3 + MySQL) ; `npm run build` réussit ; `bash -n` / `php -l` sur les fichiers touchés.
- Un commit sur `vision/lot-3a-terrain` (message en français, `Co-Authored-By: Codex <noreply@openai.com>`), ou, si c'est impossible, les changements laissés dans l'arbre de travail avec un rapport.
- Rapport final : fichiers, API exposée aux écrans (signatures), choix, limites et « À VÉRIFIER ».
