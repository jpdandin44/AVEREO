# Brief Codex T-04 — passerelle CONNECT : ticket, nonce, cookie signé (R08)

Lot : 2A — Branche : vision/lot-2a-api-projets — Rédigé par Claude Code le 24/11/2026

## Contexte
Lis `architecture-v1/avereo-app-vision/AGENTS.md` (règles permanentes), puis uniquement les fichiers listés ci-dessous.
AVEREO Vision s'authentifie comme l'application Rapport : CONNECT émet un **ticket signé** (HMAC-SHA256, courte durée, nonce à usage unique) ; l'application l'échange contre un **cookie de passerelle signé** que chaque appel d'API vérifie. Ce code est **critique pour la sécurité** : écris-le strict (refuse dans le doute), sans dépendance, PHP 8.4, `declare(strict_types=1)`. Ce brief décrit le comportement ; les références (à lire, ne pas copier aveuglément) sont :
- émission du ticket : `architecture-v1/avereo-app-connect/backend/src/Security/AppLaunchTicketIssuer.php` ;
- consommation côté Rapport : `architecture-v1/avereo-app-rapport/frontend/public/connect/gate.php` (fonctions `avereo_gate_decode_signed`, `avereo_gate_assert_payload`, `avereo_gate_normalize_identity`, `avereo_gate_consume_nonce`, `avereo_gate_issue_cookie`, `avereo_gate_cookie_payload`).
Ne reprends pas la logique d'« accès d'essai » (`avereo_gate_assert_trial_access`) ni les redirections vers le portail : hors périmètre.

## Format du ticket (émis par CONNECT)
`ticket = base64url(payload_json) . '.' . base64url(hmac_sha256(base64url(payload_json), secret, binaire))`
`payload` = `{"v":1,"app":"vision","iat":<int>,"exp":<int>,"nonce":"<base64url 24 à 128 car.>","remembered":<bool>,"identity":{"provider":"avereo_connect","id":"<chiffres>"}}`.
`base64url` = base64 avec `+/` remplacés par `-_` et sans `=`.

## Ce que tu fais
Crée `frontend/public/api/lib/connect_gate.php` et `tests/api/connect_gate_test.php`.

### API de `connect_gate.php` (fonctions globales, préfixe `vision_gate_`)
```php
const VISION_GATE_APP = 'vision';
function vision_gate_b64url_encode(string $value): string
function vision_gate_b64url_decode(string $value): string   // strict : caractères hors alphabet ou longueur impossible => InvalidArgumentException

/** Décode « charge.signature » ; signature vérifiée avec hash_equals ; renvoie le tableau de la charge JSON. InvalidArgumentException si : secret < 32 octets, forme invalide, signature fausse, JSON invalide ou non-objet. La signature est vérifiée AVANT de décoder le JSON. */
function vision_gate_decode_signed(string $value, string $secret): array

/** Normalise une identité : provider === 'avereo_connect' et id = chaîne de 1 à 20 chiffres ; renvoie ['provider'=>..., 'id'=>...]. Sinon InvalidArgumentException. */
function vision_gate_normalize_identity(mixed $identity): array

/** Charge d'un TICKET : v === 1 ; app === 'vision' ; iat et exp entiers ; pas de clé 'kind' ; 'remembered' booléen ; nonce ^[A-Za-z0-9_-]{24,128}$ ; exp > $now ; exp - iat <= $maxLifetimeSeconds (défaut 600) ; iat <= $now + 60 (décalage d'horloge toléré) ; identité normalisée. InvalidArgumentException sinon. */
function vision_gate_assert_ticket_payload(array $payload, int $now, int $maxLifetimeSeconds = 600): void

/** Consomme un nonce : crée atomiquement (fopen mode 'x') le fichier « <dossier>/<sha256(nonce)>.used ». Dossier absent : le créer (0700) ; impossible : RuntimeException. Fichier déjà présent : InvalidArgumentException « nonce déjà utilisé » (rejeu). Efface au passage, au plus 50 fichiers .used plus vieux que $expiresAt + 3600. */
function vision_gate_consume_nonce(string $directory, string $nonce, int $expiresAt, int $now): void

/** Échange un ticket : exige config['connect_launch_secret'] (>= 32 octets) et config['connect_launch_nonce_directory'] non vide ; décode, contrôle, consomme le nonce ; renvoie ['provider'=>..., 'id'=>..., 'remembered'=>bool]. */
function vision_gate_exchange_ticket(array $config, string $ticket, ?int $now = null): array

/** Valeur du cookie de passerelle : charge {"v":1,"app":"vision","kind":"gate","iat","exp","nonce"(24 octets aléatoires base64url),"remembered","identity"} signée comme le ticket. $lifetimeSeconds borné entre 300 et 43200. Renvoie la chaîne « charge.signature ». */
function vision_gate_build_cookie_value(array $identity, bool $remembered, string $secret, int $now, int $lifetimeSeconds): string

/** Lit un cookie : signature, v === 1, app === 'vision', kind === 'gate', exp > $now, exp - iat <= $maxLifetimeSeconds (défaut 43200), iat <= $now + 60, identité normalisée. Renvoie ['provider','id','remembered','exp']. InvalidArgumentException sinon. Un TICKET ne doit jamais être accepté comme cookie (pas de 'kind') ni un cookie comme ticket (clé 'kind' présente). */
function vision_gate_read_cookie_value(string $value, string $secret, int $now, int $maxLifetimeSeconds = 43200): array

/** Options pour setcookie() : path '/', httponly true, samesite 'Lax', secure true sauf si config['environment'] === 'local', expires = $expires. */
function vision_gate_cookie_options(array $config, int $expires): array
```
Aucune fonction n'appelle `setcookie`, `header` ni `exit` (elles restent testables) ; l'appelant (`connect/entry.php`, écrit par Claude Code) s'en charge.

### Tests obligatoires (`tests/api/connect_gate_test.php`, avec `vision_test('nom', function () {…});`)
Secret de test : 40 caractères fixes ; répertoire de nonces : un sous-dossier unique de `sys_get_temp_dir()` nettoyé en fin de test. Fabrique les tickets dans le test avec le même algorithme que CONNECT (ne réutilise pas les fonctions testées pour les signer : réécris l'encodage dans un petit assistant du test).
- Ticket valide → identité `avereo_connect`/`12`, `remembered` correct ; **vecteur figé** : un ticket construit à la main avec iat=1000000000, exp=1000000300, nonce de 24 caractères fixes, secret fixe, dont la signature attendue est écrite en dur dans le test (calculée une fois par `hash_hmac`), est accepté avec `$now = 1000000100`.
- Refus : signature modifiée (un caractère) ; charge modifiée avec l'ancienne signature ; secret différent ; secret de moins de 32 octets ; ticket vide, sans point, avec deux points, base64 invalide ; JSON invalide ; JSON non-objet (`"abc"`, `[]` accepté ou refusé selon ton choix documenté dans le test : une liste n'est pas une charge valide, refuse-la).
- Refus de contenu : `v` = 2 ; `app` = 'rapport' ; ticket expiré (exp <= now) ; `exp - iat` = 601 ; `iat` à now + 61 ; nonce trop court (23), trop long (129), avec caractère interdit ; `remembered` absent ou non booléen ; identité d'un autre provider ; `id` non numérique, vide, de 21 chiffres ; présence de `kind`.
- Nonce : un même ticket échangé deux fois → la 2e fois est refusée (« déjà utilisé ») ; deux tickets de nonces différents passent ; le dossier est créé s'il manque ; un nonce ne crée pas de fichier hors du dossier (le nom est le sha256, jamais le nonce brut).
- Cookie : aller-retour `build` puis `read` ; cookie expiré refusé ; cookie signé avec un autre secret refusé ; **un ticket n'est pas accepté comme cookie** et **un cookie n'est pas accepté comme ticket** ; durée demandée 10 s bornée à 300 s, 999999 s bornée à 43200 s (vérifie `exp - iat`).
- `vision_gate_exchange_ticket` sans `connect_launch_secret` (ou de 31 octets) ou sans dossier de nonces : exception, aucun nonce consommé.
- `vision_gate_cookie_options` : `secure` false en `local`, true en `production` et en `preproduction` ; `samesite` Lax ; `httponly` true.

## Périmètre
- Fichiers à créer : `architecture-v1/avereo-app-vision/frontend/public/api/lib/connect_gate.php`, `architecture-v1/avereo-app-vision/tests/api/connect_gate_test.php`.
- Fichiers à lire : les deux références ci-dessus (lecture seule, sans les modifier), `tests/api/support.php`, `tests/api/run.php`, `docs/architecture.md` (§8), `docs/exigences.md` (R08).
- Tu ne touches à aucun autre fichier (en particulier aucun fichier de `avereo-app-connect/` ni de `avereo-app-rapport/`), et jamais à `data/suivi-vision.json` ni à `docs/plan-lots.md`.
- Aucune nouvelle dépendance.

## Terminé quand
- `php tests/api/run.php connect_gate` (depuis `architecture-v1/avereo-app-vision/`) passe, sans base de données ni réseau.
- `php -l` réussit ; aucune fonction ne dépend de `$_GET`, `$_COOKIE`, `header()` ni `exit`.
- Tu as relu ton diff et signalé tout comportement de la référence que tu as volontairement écarté.

## Ce que tu rends
- Liste des fichiers créés ; commandes lancées et leur résultat ; « À VÉRIFIER » éventuels (par exemple un écart avec le format réel de CONNECT).
Tu ne commites pas, tu ne pousses pas, tu ne merges pas : Claude Code vérifie puis commite.
