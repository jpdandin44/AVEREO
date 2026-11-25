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
3. Si le ticket est accepté, un **cookie de passerelle** signé est posé : HttpOnly, SameSite=Lax, Secure et **nom préfixé `__Host-` hors local** (`__Host-AVEREO_VISION_GATE` : non écrasable depuis un sous-domaine), 1800 s par défaut (300 à 43200 s, durée relue dans la configuration à chaque appel). Le navigateur est redirigé vers l'application (303).
4. Chaque appel de l'API relit le cookie. Un ticket n'est jamais accepté comme cookie, ni un cookie comme ticket (le cookie porte `kind: "gate"`).
5. **Le cookie est signé avec une clé dérivée du secret ET de l'environnement** (`HMAC(secret, "vision-gate-cookie|<environnement>")`), distincte de la clé des tickets : un cookie de préproduction est refusé en production, même si le même secret est utilisé par erreur. **Il faut tout de même un secret différent par environnement** (les tickets, eux, sont signés avec le secret brut).
6. `POST /api/logout.php` efface le cookie (bouton « Se déconnecter », mode CONNECT). Limite : la session CONNECT n'est pas fermée et un compte désactivé dans CONNECT garde l'accès jusqu'à l'expiration du cookie (30 minutes par défaut) ; pas de révocation côté Vision.

## Rôles et droits (R02)
- Rôles : `fondateur` (identités listées dans `admin_user_ids` de la configuration) et `conseiller` (tous les autres).
- Tout passe par `vision_can(role, action)` et le tableau `vision_droits()` de `frontend/public/api/lib/droits.php` : **ajouter un rôle (par exemple « artisan partenaire ») ne demande de modifier que ce tableau.** Le rôle artisan n'est pas construit.
- Le conseiller crée, lit, modifie et archive **ses** projets ; le fondateur voit et modifie tous les projets, sans devenir leur propriétaire.
- Un projet d'autrui est **invisible** : l'API répond 404 (jamais 403) pour ne pas révéler son existence. Le propriétaire est de plus revérifié dans la requête SQL de modification.
- Une identité « local » n'est fondateur que dans l'environnement `local`.

## Configuration (hors du dossier publié)
Fichier PHP renvoyant un tableau, lu depuis `AVEREO_CONFIG_FILE`, sinon `~/.avereo/vision/config.php` (`~/.avereo/vision-preprod/config.php` si la racine web contient « preprod » ; le dossier personnel vient de `$HOME`, ou est déduit de la racine web `/home/COMPTE/…` sur l'hébergement mutualisé, où `$HOME` peut manquer). Modèle : `local/config.example.php`. Clés : `environment`, `auth_mode`, `db`, `api_token`, `admin_user_ids`, `connect_launch_secret` (≥ 32 caractères, partagé avec CONNECT), `connect_launch_nonce_directory`, `connect_gate_cookie`, `connect_gate_session_seconds`, `max_body_bytes`. Par défaut : production et mode `connect`. Les secrets ne sont jamais écrits dans les logs, les réponses ni le code livré au navigateur.

## Données locales sur l'appareil (Lot 2B)
- Le relevé est enregistré sur l'appareil (IndexedDB, base `avereo-vision:<fournisseur>:<identifiant>`), **une base par compte** : un autre compte sur le même téléphone ou le même navigateur n'y accède pas par l'application. Ces données **ne sont pas chiffrées** : la protection est le verrouillage de l'appareil (les relevés montrent des logements de particuliers) ; **À VÉRIFIER** avec le responsable si un chiffrement ou un effacement automatique est attendu.
- Sans réseau, l'application rouvre avec la dernière identité connue de l'appareil (`localStorage`, aucun secret). Elle ne donne aucun accès au serveur : chaque envoi est reverifié par le cookie de passerelle CONNECT ; un cookie expiré affiche « Reconnexion nécessaire » et ne supprime rien.
- Chaque requête du client indique le compte de sa base locale (en-tête `X-Vision-Expected-Identity`) : si la session est celle d'un autre compte, le serveur répond `409 identity_changed` avant toute lecture ou écriture (voir `docs/synchronisation.md`).
- « Se déconnecter » efface le cookie et oublie l'identité mémorisée mais **garde** les données locales (modifications non envoyées comprises) ; un avertissement s'affiche s'il en reste.

## Limites connues (relecture de sécurité du Lot 2A)
- **Connexion forcée par ticket (login CSRF)** : quelqu'un qui possède un ticket valide peut envoyer le lien `entry.php?ticket=…` à un collègue, qui se retrouve connecté sous le compte de l'émetteur. Le contrôle dépend de CONNECT (état lié au navigateur avant le lancement) : **À VÉRIFIER avec CONNECT**. En attendant, l'identité connectée est toujours affichée dans l'en-tête de l'application.
- **Jeton local et réseau** : le jeton de test est dans le bundle de `npm run dev`. Le plugin `vite-plugins/boucle-locale.js` refuse tout appel vers `/api` et `/connect` qui ne vient pas de la machine elle-même (même avec `--host`). Ne jamais mettre de vrais relevés dans la base locale.
- **L'en-tête Host peut être falsifié** par un client distant : le contrôle d'hôte n'est qu'un garde-fou ; la protection réelle est que la configuration refuse le jeton hors de l'environnement `local`.
- **Compte MySQL** : l'application et l'exécuteur de migrations utilisent le même compte en développement. En préproduction et production, prévoir deux comptes : un pour l'application (SELECT, INSERT, UPDATE) et un pour les migrations (droits DDL). **À VÉRIFIER** à la mise en place.
- **Textes libres** : les champs (nom, adresse, client) acceptent des caractères bidirectionnels ou de largeur nulle, et peuvent commencer par `=`, `+` ou `@` : à neutraliser dans les futurs exports CSV et PDF.
- **Hébergement** : la prise en compte de `api/lib/.htaccess` (`AllowOverride`) est à vérifier sur le serveur réel.

## Ce qui reste à faire pour brancher CONNECT en vrai
État du 24/11/2026 : l'enregistrement dans le code de CONNECT est mergé (PR #196) ; un ticket émis par le vrai émetteur de CONNECT a été accepté par la passerelle de Vision en essai local, et son rejeu refusé. Reste l'activation hébergée : procédure dans `docs/deploiement-mutualise.md`.
1. Enregistrer l'application « vision » dans CONNECT (code d'application, secret de lancement, URL d'entrée `…/connect/entry.php`) : modification de `architecture-v1/avereo-app-connect/`, **PR séparée avec l'accord du responsable**.
2. Déposer le même secret dans la configuration d'AVEREO Vision (`connect_launch_secret`) et créer le dossier des nonces (droits d'écriture pour le serveur web).
3. Utiliser **un secret différent pour chaque environnement** (préproduction, production).
4. Essayer un vrai ticket de bout en bout (préproduction ; décision de livraison séparée).
Les tests du dépôt forgent des tickets avec le même format et le même secret : ils prouvent le comportement du code, pas l'intégration avec CONNECT.
