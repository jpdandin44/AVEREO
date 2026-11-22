---
project: avereo-app-rapport
document_type: delegation-prompt
title: Stockage privé des originaux — première tranche locale
status: active
version: git
created: 2026-11-13
updated: 2026-11-13
owner: jpdandin
tags: [rapport, photos, stockage, delegation]
---

# Stockage privé des originaux

## Objectif et contexte

Le responsable demande de lancer le prochain lot après PR149 installée en préproduction. Reprendre le lot photo PR150 dans la copie enfant existante, déjà réalignée avec main (HEAD de reprise 63e4233). La préproduction n'est pas modifiée par ce travail local. Lire les AGENTS.md et docs/photos-originales-et-annotations.md. Le prochain incrément est la conservation/réouverture d'un original privé ; annotations et compression active restent ultérieures.

Codex développe l'interface et le client JS. Claude Code développe uniquement la partie serveur décrite ici. Les trois documents locaux existants ont été sauvegardés ; ne pas les modifier.

## Entrées et périmètre exclusif

Racine autorisée : `C:/Users/examg/Documents local/avereo-rapport-v12-habitologue/.codex-worktrees/rapport-photos-code/architecture-v1/avereo-app-rapport`.

Créer uniquement :

- `frontend/public/api/photo-original-store.php` : service PHP testable sans bootstrap HTTP ; PDO et stockage privé.
- `frontend/public/api/photo-originals.php` : endpoint authentifié utilisant bootstrap.php existant.
- `database/migrations/003_photo_originals.sql` : table additive de métadonnées ; aucune migration exécutée.
- `tests/photo-originals.php` : tests réels sur SQLite temporaire et répertoire privé temporaire, deux propriétaires fictifs.
- `docs/stockage-originaux-resultat.md` : bilan factuel de cette délégation avec métadonnées.

Ne modifier aucun autre fichier. Aucun commit, push, réseau, dépendance, compte, configuration hébergée ou déploiement. Ne pas utiliser l'ancienne consigne de compression comme autorisation de brancher ce module.

## Contrat HTTP convenu avec Codex

Même origine, cookies CONNECT existants ; le sas et api_require_auth sont contrôlés pour toute requête. L'identité CONNECT ordinaire doit correspondre au propriétaire **actuel** du rapport ; aucune exception administrateur. Ne pas réutiliser canManageAll pour les photos.

- `GET photo-originals.php?action=capabilities` → `{ok:true, enabled:false}` si non configuré ; si activé, `{ok:true, enabled:true,maxOriginalBytes,allowedMimeTypes}`.
- `GET photo-originals.php?reportId=...` → `{ok:true, originals:[metadata...]}`.
- `GET photo-originals.php?reportId=...&id=...` → octets de l'original, Content-Type exact, Content-Disposition attachment avec nom sûr, Cache-Control private/no-store, nosniff ; aucune URL publique ou chemin serveur en réponse.
- `POST photo-originals.php` : multipart `reportId` (32 hex), `sha256` (64 hex), `file` (un seul fichier). `X-Avereo-Photo: 1` obligatoire ; Origin si présent doit correspondre à api_current_origin et Sec-Fetch-Site si présent à same-origin. Aucun CORS permissif. Retour `{ok:true,original:metadata}`. Métadonnées : `{id,reportId,sha256,bytes,mime,width,height,name,createdAt}` ; id 32 hex aléatoire. Même fichier dans un rapport = même original après vérification réelle des octets existants.
- Erreurs `{ok:false,error,message}` : 404 dossier/original absent ou autre propriétaire ; 422 image invalide/empreinte incorrecte ; 413 limite fichier ; 409 quota dépassé ; 503 stockage indisponible/non configuré. Aucun chemin privé ni détail SQL dans la réponse.
- Aucun DELETE, remplacement, partage ou copie interpropriétaire dans cette tranche.

## Configuration locale et refus par défaut

Champs privés nouveaux : `photo_originals_enabled` (défaut false), `photo_originals_directory` (racine absolue préexistante hors document root), `photo_originals_max_bytes` et `photo_originals_owner_quota_bytes` (entiers positifs explicitement requis si activé). Aucune valeur d'hébergement supposée. Les valeurs de tests sont fictives, sans portée sur O2Switch ni sur les 500 Mo Passeport. La racine, ses descendants et les fichiers ne doivent pas suivre de symlink ; chemin construit uniquement à partir d'identifiants/empreintes contrôlés, jamais du nom reçu. Refuser une racine située sous la racine web. Fichiers/dossiers privés (0600/0700 là où applicable).

Ne pas modifier bootstrap/config.example : Codex documentera et raccordera les champs après relecture.

## Invariants de stockage et propriété

Original octet-identique, jamais remplacé. Vérifier SHA-256 recalculé, signature/type réel et dimensions raisonnables JPEG/PNG/WebP ; refuser formats non pris en charge sans effacer la photo du navigateur. Aucun réencodage ni extraction EXIF à envoyer en réponse. Borner octets et pixels avant chargement complet inutile ; garder les octets exacts.

Métadonnées liées au public_id du rapport et à owner_provider/owner_id. Vérifier à chaque accès à la fois le propriétaire du rapport courant et celui de la métadonnée. Dédoublonnage par rapport/empreinte seulement. Transaction et verrou privé par propriétaire pour empêcher deux envois concurrents de dépasser le quota ; vérifier l'intégrité de l'exemplaire dédoublonné. Écriture fichier atomique, pas d'annonce de conservation après refus ou écriture partielle. Si une insertion échoue, ne pas effacer un fichier préexistant et conserver la cohérence ; échouer sans fuite de contenu.

Ne pas ajouter de FK empêchant la suppression existante d'un rapport ou effaçant les fichiers en cascade : suppression/conservation définitive reste à décider. Après suppression du rapport, aucun accès à ses originaux n'est possible ; les métadonnées restent comptées dans le quota jusqu'à la future procédure d'effacement. Aucun changement du propriétaire ou des colonnes du rapport source.

L'endpoint POST reprend le verrou partagé de politique de révocation présent dans reports.php, puis recontrôle le sas avant l'écriture. La lecture vérifie aussi le sas courant. Une session expirée ou un compte révoqué doit être refusé.

## Vérifications et sortie

PHP existant : `C:/Users/examg/AppData/Local/Programs/PHP/php.exe`, avec DLL SQLite déjà installée utilisable pour le seul processus de test (`-d extension=pdo_sqlite`). Pas de modification de php.ini. Finfo peut nécessiter la DLL locale déjà fournie, ne rien installer. Aucune nouvelle infrastructure de tests.

Tester réellement : round-trip et empreinte, nouvelle instance/session du service, refus lecture/liste/envoi pour le second compte et un administrateur non propriétaire, altération/refus hash, image invalide, dépassement octets/quota, dédoublonnage sans nouvelle consommation, original existant altéré, symlink/path traversal quand supporté, panne de stockage et conservation des lignes/propriétaires du rapport. Les routes HTTP/auth doivent être couvertes ou explicitement laissées à la recette Codex ; ne pas confondre tests du service et CONNECT réel.

Conserver un court bilan dans le document réservé : fichiers, interface de la classe, commandes réellement exécutées, résultats, limites. Prévenir Codex de la fin ; ne pas intervenir dans son interface ou ses fichiers.

## Historique

- 2026-11-13 : reprise explicite du prochain lot ; délégation de la première tranche serveur, sans livraison.
