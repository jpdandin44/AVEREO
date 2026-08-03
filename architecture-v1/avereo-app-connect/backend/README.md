# Backend - AVEREO CONNECT

Backend PHP 8.3 sans dépendance applicative externe, préparé pendant la gate C7.

## Périmètre C7

- contrat OpenAPI sous `api/openapi.yaml` ;
- front controller sous `public/index.php` ;
- session serveur et CSRF ;
- routes santé, session, profil, organisations, catalogue et habilitations ;
- autorisation côté serveur, refus par défaut et audit des mutations ;
- migrations via `bin/migrate.php`.

Le SSO Drupal est activé lorsque les variables `OAUTH_*` sont complètes. La transaction
OAuth est conservée à la fois dans la session PHP et, par défaut pendant quinze minutes,
dans un stockage privé à usage unique lié à un cookie de navigateur distinct. Ce
second stockage sécurise le callback lorsque l'hébergeur renouvelle la session PHP
entre le départ vers Drupal et le retour vers CONNECT.

Le callback établit l'identité Drupal dans la session CONNECT. Le catalogue de
démarrage `/api/v1/catalog` expose alors des routes de lancement CONNECT, jamais
les URL applicatives directes. Les routes
`/api/v1/apps/{code}/launch` sont refusées aux sessions anonymes et aux
comptes non approuvés.

Après le callback, CONNECT rattache le `subject` Drupal à une ligne `users`
active. Si ce rattachement n'existe pas, l'identité et les attributs publics
retournés par Drupal sont enregistrés dans `pending_identities`, sans créer de
compte actif ni attribuer de droit. Le lancement reste refusé tant que le compte
n'est pas approuvé, rattaché à une organisation active et couvert par une
habilitation applicative valide.

Après contrôle humain du compte Drupal, un owner/admin utilise l'interface
« Gérer les comptes » de CONNECT pour approuver ou refuser l'identité. L'écran
permet aussi à un owner d'activer, suspendre ou désactiver un compte, sans
suppression de données, et à un owner/admin autorisé d'accorder ou révoquer les
applications par compte. Les routes d'administration réappliquent les rôles
côté serveur, exigent le CSRF et auditent chaque mutation. Une révocation filtre
le catalogue et bloque aussi le lancement direct.

La déconnexion est confirmée dans l'interface CONNECT. Après confirmation,
CONNECT ferme sa session et émet une URL HMAC à usage unique vers le module
`integrations/drupal/avereo_identity_bridge`. Ce pont ferme la session
d'identité puis revient immédiatement à CONNECT ; aucune interface technique
intermédiaire n'est présentée à l'utilisateur.

La commande idempotente `bin/approve-pending-user.php` reste disponible pour le
premier compte, la reprise et les interventions d'urgence. Sans `--confirm`, la
commande ne modifie rien. Le premier compte exige `--bootstrap` et le rôle
`owner`; les approbations suivantes exigent le `subject` d'un owner/admin actif.
Exemple de première approbation en préproduction :

```bash
AVEREO_PRIVATE_CONFIG=/home/CPANEL_USERNAME/private/connect-preprod/config.php \
php bin/approve-pending-user.php \
  --email=admin@example.invalid \
  --organization-slug=avereo \
  --organization-name=AVEREO \
  --role=owner \
  --applications=rapport,coupe,projet,thermo,drone \
  --bootstrap \
  --confirm
```

La création et l'approbation des utilisateurs restent donc des opérations
d'administration explicites : une authentification Drupal seule n'accorde
aucun accès applicatif. Voir `../docs/administration-comptes.md`.

Chaque lancement produit un ticket HMAC signé, limité à 90 secondes, lié à une
seule application et muni d'un nonce. Le ticket contient aussi l'identifiant
interne minimal du compte CONNECT approuvé. Il ne contient ni mot de passe, ni
jeton Drupal, ni nom, ni adresse e-mail. Chaque application dispose de son
secret de lancement distinct, uniquement côté serveur. L'application consomme le
nonce une seule fois, établit un cookie `Secure`, `HttpOnly` et `SameSite=Lax`
de 30 minutes,
puis retire le ticket de l'URL. Un accès direct à la page d'entrée renvoie vers
CONNECT.

Le sas protège aussi les points d'entrée de toutes les applications ; seul
l'endpoint de santé reste public. Rapport consomme désormais l'identité signée
par CONNECT et ne lance plus un second parcours OAuth Drupal. Coupe applique le
même contrat à son API projets. Leurs cookies locaux signés portent
l'identifiant CONNECT et protègent aussi les API métier. Les autres
applications, déjà protégées par leur sas, restent compatibles : les
champs historiques du ticket restent inchangés. Aucun secret n'est placé dans
le catalogue, l'URL ou le JavaScript.

Avec Simple OAuth 6.1.1, `OAUTH_ISSUER` doit correspondre exactement à l'URL racine
émise par Drupal, slash final compris (par exemple `https://idp.example/`). Cette
version ne recopie pas le paramètre `nonce` dans l'ID token du flux Authorization
Code. CONNECT conserve donc les protections `state`, code à usage unique, PKCE S256
et liaison au navigateur ; si un fournisseur émet un nonce, sa correspondance reste
obligatoirement vérifiée.

## Contrôles locaux

Depuis la racine de l'application :

```powershell
docker compose -f compose.c7.yaml build php
docker compose -f compose.c7.yaml up -d database
docker compose -f compose.c7.yaml run --rm php php tests/run.php
docker compose -f compose.c7.yaml run --rm php php bin/migrate.php --direction=up
docker compose -f compose.c7.yaml run --rm php php tests/integration.php
docker compose -f compose.c7.yaml run --rm php php bin/migrate.php --direction=down --all
docker compose -f compose.c7.yaml down
```

Le service MariaDB utilise un stockage `tmpfs` et des identifiants uniquement locaux. Aucun secret ou accès hébergé ne doit être ajouté au dépôt.
