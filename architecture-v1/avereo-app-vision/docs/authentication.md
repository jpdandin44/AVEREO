# Authentification et droits — AVEREO Vision

Décision du 24/11/2026 (Lot 2A). Reprend le principe de l'application Rapport : AVEREO Vision ne gère aucun mot de passe ; l'identité vient d'AVEREO CONNECT. Un jeton statique, réservé au développement local, permet de travailler sans CONNECT.

## Les deux modes (`auth_mode` dans la configuration)
| Mode | Usage | Comment |
|---|---|---|
| `connect` (défaut) | préproduction et production | ticket signé émis par CONNECT, échangé contre un cookie de passerelle |
| `token` | développement local uniquement | jeton statique d'au moins 32 caractères dans l'en-tête `Authorization: Bearer …` ; identité de test dans `X-Vision-Local-User` (chiffres, « 1 » par défaut) |

Le mode `token` est **refusé** hors de l'environnement `local` : la configuration est invalide (l'API répond 503 « misconfigured ») et le code d'authentification le rejette aussi si l'hôte de la requête n'est pas local (`localhost`, `127.0.0.1`, `::1`, `*.localhost`).

## Parcours CONNECT
1. L'utilisateur ouvre AVEREO Vision depuis CONNECT. CONNECT émet un **ticket** : `base64url(charge).base64url(HMAC-SHA256(base64url(charge), secret))` ; charge = `{"v":1,"app":"vision","iat":…,"exp":…,"nonce":"…","remembered":false,"identity":{"provider":"avereo_connect","id":"<chiffres>"}}` (format de `avereo-app-connect/backend/src/Security/AppLaunchTicketIssuer.php`).
2. Le navigateur est redirigé vers `/connect/entry.php?ticket=…`. Le ticket est refusé (403, sans détail) s'il est mal signé, expiré (durée de vie de 600 s au plus, décalage d'horloge de 60 s toléré), destiné à une autre application, déjà utilisé (nonce à usage unique, fichier `<sha256(nonce)>.used` dans le dossier des nonces) ou si l'identité n'est pas un identifiant CONNECT numérique.
3. Si le ticket est accepté, un **cookie de passerelle** signé est posé (`AVEREO_VISION_GATE`, HttpOnly, SameSite=Lax, Secure hors local, 1800 s par défaut, 300 à 43200 s) et le navigateur est redirigé vers l'application (303).
4. Chaque appel de l'API relit le cookie. Un ticket n'est jamais accepté comme cookie, ni un cookie comme ticket (le cookie porte `kind: "gate"`).
Aucune déconnexion n'est prévue au Lot 2A : le cookie expire (À VÉRIFIER : besoin d'un bouton de déconnexion).

## Rôles et droits (R02)
- Rôles : `fondateur` (identités listées dans `admin_user_ids` de la configuration) et `conseiller` (tous les autres).
- Tout passe par `vision_can(role, action)` et le tableau `vision_droits()` de `frontend/public/api/lib/droits.php` : **ajouter un rôle (par exemple « artisan partenaire ») ne demande de modifier que ce tableau.** Le rôle artisan n'est pas construit.
- Le conseiller crée, lit, modifie et archive **ses** projets ; le fondateur voit et modifie tous les projets, sans devenir leur propriétaire.
- Un projet d'autrui est **invisible** : l'API répond 404 (jamais 403) pour ne pas révéler son existence. Le propriétaire est de plus revérifié dans la requête SQL de modification.
- Une identité « local » n'est fondateur que dans l'environnement `local`.

## Configuration (hors du dossier publié)
Fichier PHP renvoyant un tableau, lu depuis `AVEREO_CONFIG_FILE`, sinon `$HOME/.avereo/vision/config.php` (modèle : `local/config.example.php`). Clés : `environment`, `auth_mode`, `db`, `api_token`, `admin_user_ids`, `connect_launch_secret` (≥ 32 caractères, partagé avec CONNECT), `connect_launch_nonce_directory`, `connect_gate_cookie`, `connect_gate_session_seconds`, `max_body_bytes`. Par défaut : production et mode `connect`. Les secrets ne sont jamais écrits dans les logs, les réponses ni le code livré au navigateur.

## Ce qui reste à faire pour brancher CONNECT en vrai
1. Enregistrer l'application « vision » dans CONNECT (code d'application, secret de lancement, URL d'entrée `…/connect/entry.php`) : modification de `architecture-v1/avereo-app-connect/`, **PR séparée avec l'accord du responsable**.
2. Déposer le même secret dans la configuration d'AVEREO Vision (`connect_launch_secret`) et créer le dossier des nonces (droits d'écriture pour le serveur web).
3. Essayer un vrai ticket de bout en bout (préproduction ; décision de livraison séparée).
Les tests du dépôt forgent des tickets avec le même format et le même secret : ils prouvent le comportement du code, pas l'intégration avec CONNECT.
