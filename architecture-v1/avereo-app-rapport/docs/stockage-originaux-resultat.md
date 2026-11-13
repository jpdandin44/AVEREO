---
project: avereo-app-rapport
document_type: compte-rendu
title: Résultat de la délégation « Stockage privé des originaux » — tranche serveur
status: active
version: git
created: 2026-11-13
updated: 2026-11-13
owner: jpdandin
tags: [rapport, photos, originaux, stockage, php, delegation]
---

# Stockage privé des originaux — tranche serveur locale

Compte rendu factuel de l'exécution par Claude Code du [prompt](../prompts/delegation-stockage-originaux.md) sur `feat/rapport-photos-compression` (reprise sur `63e4233`). **Rien n'est commité, poussé, installé ni déployé ; aucune migration n'a été exécutée ; aucun accès réseau, serveur hébergé ou compte.** Le client JS, l'interface, `bootstrap.php`, `config.example` et tous les documents existants sont laissés à Codex. Cadrage fonctionnel : [photos originales et annotations](photos-originales-et-annotations.md).

## Fichiers (les cinq autorisés)

| Fichier | Rôle |
| --- | --- |
| `frontend/public/api/photo-original-store.php` | Service `RapportPhotoOriginalStore`, testable sans bootstrap HTTP (PDO + répertoire privé). |
| `frontend/public/api/photo-originals.php` | Endpoint authentifié (sas CONNECT, `api_require_auth`), mince : validation HTTP puis appel du service. |
| `database/migrations/003_photo_originals.sql` | Table additive `rapport_photo_originals` ; aucune clé étrangère. **Non exécutée sur MySQL.** |
| `tests/photo-originals.php` | Tests réels sur SQLite temporaire et répertoire privé temporaire. |
| `docs/stockage-originaux-resultat.md` | Ce document. |

## Interface du service

```php
final class RapportPhotoOriginalException extends RuntimeException {
    public readonly int $status;        // statut HTTP
    public readonly string $errorCode;  // not_found | invalid_request | invalid_image | hash_mismatch
}                                       // file_too_large | quota_exceeded | storage_unavailable

final class RapportPhotoOriginalStore {
    const MIME_BY_TYPE;                 // JPEG, PNG, WebP seulement
    const MAX_SIDE_PIXELS = 32767;      // propositions, en-tête seul lu
    const MAX_TOTAL_PIXELS = 200000000;

    __construct(PDO $pdo, string $root, int $maxBytes, int $ownerQuotaBytes, array $forbiddenRoots = []);
    static isEnabled(array $config): bool;                       // === true uniquement
    static fromConfig(PDO $pdo, array $config, array $webRoots = []): self;
    capabilities(): array;              // {enabled:true, maxOriginalBytes, allowedMimeTypes}
    listForReport(string $ownerProvider, string $ownerId, string $reportId): array;
    open(string $ownerProvider, string $ownerId, string $reportId, string $originalId): array;
                                        // {metadata, stream (resource), filename}
    store(string $ownerProvider, string $ownerId, string $reportId, string $sourcePath,
          string $claimedSha256, string $clientName = ''): array;   // métadonnées
    static metadata(array $row): array; // {id,reportId,sha256,bytes,mime,width,height,name,createdAt}
    static sanitizeName(string $name): string;
    static downloadName(array $metadata): string;
}
```

Le PDO doit lever des exceptions (`ERRMODE_EXCEPTION`, déjà le cas d'`api_pdo`). Le service ne connaît aucun rôle : l'appelant lui passe l'identité du compte ordinaire. `canManageAll` n'est jamais utilisé.

## Contrat HTTP réalisé

Conforme au prompt (capacités, liste, lecture, envoi multipart `reportId`/`sha256`/`file`, `X-Avereo-Photo: 1`, Origin et `Sec-Fetch-Site`, pas de CORS, pas de DELETE). Précisions et écarts à connaître :

- Codes d'erreur choisis : `not_found` 404, `invalid_image` et `hash_mismatch` 422, `invalid_request` 422 (champs mal formés), `file_too_large` 413, `quota_exceeded` 409, `storage_unavailable` 503. Ajouts du endpoint : 403 `photo_header_required`, 403 `origin_refused`, 405 `method_not_allowed`. Le sas et l'identité renvoient les 403/401 existants.
- Identifiants mal formés en GET : 404 (aucune information) ; en POST : 422.
- Même fichier dans le même rapport : **200** avec l'original existant, après nouveau calcul de son empreinte réelle (pas de code 201 distinct).
- Exemplaire conservé absent ou altéré : **503 `storage_unavailable`**, jamais de remplacement ; la lecture vérifie aussi taille et empreinte (coût : une lecture complète avant diffusion).
- Photo d'un rapport supprimé : 404. Les lignes restent comptées dans le quota du propriétaire.
- `capabilities` : `{ok:true,enabled:false}` sans base si non configuré ; si activé, la base et la configuration sont validées (503 sinon).
- Le verrou partagé de politique de révocation de `reports.php` est repris pour POST, avec second contrôle du sas.
- **Propriétaire recontrôlé pendant l'envoi** (correction après relecture Codex) : trois contrôles successifs dans `store()` — à l'entrée, **sous le verrou du propriétaire**, puis **dans la transaction juste avant l'insertion** (`FOR UPDATE` sur la ligne du rapport sous MySQL). Un rapport supprimé ou réattribué entre-temps donne 404 ; le fichier neuf est retiré, aucune ligne n'est ajoutée.
- **Erreur de base = 503 générique** : toute `PDOException` (table absente, connexion perdue) devient `storage_unavailable` dans le service, avec un filet identique dans l'endpoint. Seul le code SQLSTATE est journalisé ; la réponse n'a ni SQL ni chemin.
- **Nom nettoyé en UTF-8 valide sans mbstring** : coupe à 120 caractères par expression régulière `/u`, jamais à 120 octets.
- Les curseurs SQL sont refermés après chaque lecture (un curseur ouvert gardait un verrou de lecture SQLite et bloquait une écriture concurrente ; sans effet visible sous MySQL).

## Configuration (à raccorder par Codex)

Champs privés lus dans le tableau de configuration, sans toucher à `bootstrap.php` : `photo_originals_enabled` (désactivé si absent ou différent du booléen vrai), `photo_originals_directory` (racine absolue **préexistante**, chemin réel, non-lien, hors racine web), `photo_originals_max_bytes` et `photo_originals_owner_quota_bytes` (entiers positifs requis ; chaîne de chiffres tolérée). Aucune valeur d'hébergement n'est supposée ; les valeurs des tests sont fictives. La racine web interdite est déduite de `DOCUMENT_ROOT`, `CONTEXT_DOCUMENT_ROOT` et du dossier public de l'application.

Disposition privée : `<racine>/o-<sha256(fournisseur NUL id)>/<rapport>/<id aléatoire>.bin`, plus `<racine>/.locks/`. Le nom reçu n'entre jamais dans un chemin.

## Vérifications exécutées (13 novembre 2026, Windows, PHP 8.4.23)

Le `php.ini` n'est pas modifié ; les extensions SQLite sont chargées pour le seul processus :

```bash
php -l frontend/public/api/photo-original-store.php
php -l frontend/public/api/photo-originals.php
php -l tests/photo-originals.php
php -d extension_dir=<php>/ext -d extension=pdo_sqlite -d extension=sqlite3 tests/photo-originals.php
```

| Contrôle | Résultat |
| --- | --- |
| Lint des trois fichiers PHP | Aucune erreur de syntaxe |
| `tests/photo-originals.php` | **PASS**, plusieurs exécutions (3 consécutives après la dernière modification, aussi avec `-d extension=fileinfo` comme chez Codex), environ 3,5 s ; données temporaires supprimées à la fin |
| Mutations du service, première série (7) | 6 détectées : propriétaire ignoré, quota désactivé, empreinte de l'exemplaire non vérifiée, verrou retiré, empreinte annoncée non comparée, type réel non contrôlé. La 7e (taille non vérifiée) n'est pas détectée car l'empreinte la recouvre. |
| Mutations, deuxième série (5, nouveaux contrôles) | 5 détectées : contrôle sous verrou retiré, contrôle avant insertion retiré, erreurs PDO non converties, coupe du nom en octets, fichier neuf conservé après refus d'insertion. Service restauré à l'identique (empreinte vérifiée). |

Couvert par le test : aller-retour octet pour octet et empreinte ; nouvelle instance et nouvelle connexion ; JPEG, PNG, WebP reconnus par signature ; refus liste/lecture/envoi pour un second compte et pour un administrateur non propriétaire, lecture d'un original via le rapport d'un autre ; empreinte erronée ou fichier altéré après annonce ; texte déguisé, signature sans en-tête, GIF, dimensions et pixels hors limites, fichier vide ; dépassement d'octets et de quota (tous rapports confondus, propriétaires indépendants) ; dédoublonnage sans consommation, y compris quota plein ; exemplaire altéré (taille différente, **ou octet modifié à taille égale**) et absent : refus sans remplacement ; lien (jonction NTFS sur cette machine, à défaut de droit de lien symbolique) refusé pour le répertoire d'un rapport et pour la racine ; traversée de chemin ; configuration (désactivé par défaut, limites requises, chemin relatif, absent, `..`, sous la racine web) ; panne d'écriture, insertion refusée (fichier neuf retiré, existant conservé) et reprise, racine disparue ; messages sans chemin privé ni détail SQL ; suppression du rapport (404, lignes conservées et comptées) ; changement de propriétaire du rapport ; lignes et propriétaires des rapports inchangés ; **rapport supprimé ou réattribué sous le verrou, puis juste avant l'insertion** (4 cas, via un PDO de test qui modifie le rapport avant le 2ᵉ ou le 3ᵉ contrôle : 404, aucune ligne, aucun fichier, aucune transaction ouverte, plus un cas neutre qui passe) ; **noms accentués ou multi-octets coupés à 120 caractères en UTF-8 valide** (mbstring absent de ce PHP, le code n'en dépend pas) ; **table des originaux ou des rapports absente : liste, lecture et envoi en 503 `storage_unavailable`, sans SQL ni nom de table dans le message et sans fichier conservé** ; **sauvegarde puis restauration à blanc** (copie de la base SQLite et de l'arbre privé vers une copie neuve et vide : rapports et propriétaires identiques, métadonnées identiques, réouverture octet-identique de chaque original avec le même propriétaire, refus inter-comptes, quota et dédoublonnage retrouvés, source non modifiée ; restauration partielle base seule : références présentes, fichier absent signalé en 503) ; deux processus simultanés sous un quota ne laissant passer qu'un envoi ; migration additive sans clé étrangère et colonnes identiques au schéma de test.

HTTP réel (serveur PHP intégré, configuration et clé fictives) : sans sas, cookie falsifié, cookie expiré et sas sans identité refusés ; capacités désactivées par défaut ; liste refusée tant que non activé ; `X-Avereo-Photo` obligatoire ; Origin étrangère et `Sec-Fetch-Site` cross-site refusés, même origine acceptée ; DELETE et PUT en 405 ; aucun en-tête CORS ; activé sans base, refus sans fuite de chemin.

## Réception et intégration Codex

Le bilan ci-dessus est celui de la délégation de Claude, terminé sans nouvelle modification. Codex a ensuite exécuté séparément les vraies migrations sur MariaDB temporaire et 31 contrôles HTTP (multipart, nouvelle session locale, refus inter-comptes/admin, sauvegarde et restauration SQL + fichiers), puis le parcours navigateur. Les limites « non vérifié » ci-dessous décrivent donc la portée de Claude, et non l’état de l’intégration entière. La [source de qualification actuelle](photos-originales-et-annotations.md#développement-local) centralise résultats, réserves et prochaines actions. Aucune qualification hébergée n’est revendiquée.

## Limites et recette restante

- **Aucun chiffre local n'est une décision d'hébergement.** La limite par original et le quota par propriétaire (et tout seuil de disque) restent **à choisir avant toute activation**, à partir de mesures sur la cible. Les valeurs des tests (quelques milliers d'octets) sont fictives ; elles n'ont aucune portée sur O2Switch ni sur les 500 Mo de Passeport. La fonction reste désactivée par défaut et rien n'est activé.
- **Sauvegarde/restauration :** le cas testé est une copie à blanc locale (SQLite + arbre privé). La procédure réelle (MySQL, fichiers privés de l'hébergement, ordre de restauration, cohérence des deux) reste à définir et à répéter en préproduction ; une restauration partielle est détectée à la lecture (503), pas réparée.

- **Non vérifié :** exécution de la migration sur MySQL/MariaDB (aucun serveur local, pas d'image Docker téléchargée) ; le schéma SQLite du test est équivalent, ses colonnes sont comparées à la migration. Collations `ascii_bin`/`utf8mb4_bin` et index composites à contrôler à l'application.
- **Non vérifié par HTTP :** POST multipart avec fichier, GET d'un original (en-têtes `Content-Disposition`, `Content-Length`, `nosniff`), mappage des erreurs d'envoi PHP (`upload_max_filesize`, `post_max_size`), verrou de révocation `connect_trial_access_file`, vrai cookie CONNECT et session expirée : ils exigent MySQL et CONNECT. À couvrir par la recette de Codex, avec deux comptes réels de test.
- **Droits 0600/0700 :** posés mais non mesurés (exécution sous Windows) ; le test les contrôle sous POSIX.
- **Concurrence :** le verrou est un `flock` par propriétaire, valable pour les processus d'un même hôte, pas entre machines.
- **Validation d'image :** en-tête, signature, type et dimensions déclarés ; le corps n'est pas décodé (un fichier à en-tête valide mais corps corrompu est conservé tel quel, ce qui est voulu pour un original).
- **Fichier orphelin :** un arrêt brutal entre la publication du fichier et l'insertion laisserait un fichier sans ligne, non compté. Nettoyage à prévoir avec la procédure d'effacement.
- **Hors périmètre, à décider :** effacement et rétention, accès d'un administrateur ou du support (refusé ici), copie vers un autre propriétaire, sauvegarde et restauration des fichiers (non couverts par la sauvegarde SQL), valeurs de quota et de taille d'hébergement, versions de PHP minimales (le code utilise `never` et `readonly`, déjà présents dans l'application).
- **Intégration :** le test n'est pas branché dans la CI (hors périmètre) ; il demande `pdo_sqlite` et `proc_open`.

## Historique des versions

- 2026-11-13 : première tranche serveur locale du stockage privé des originaux.
- 2026-11-13 : corrections après relecture Codex — propriétaire recontrôlé sous verrou et avant insertion, nom UTF-8 sans mbstring, erreurs de base en 503 générique, sauvegarde puis restauration à blanc testées.
