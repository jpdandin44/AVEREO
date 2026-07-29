# Audit source - AVEREO CONNECT

## Source historique V1

- Fichier attendu : `AVEREO CONNECT.txt`
- Statut : trouvé dans le zip technique fourni
- Intégration : contenu conservé dans `frontend/src/App.jsx`

## Écart C7/V2 formalisé

Le besoin d'identification centralisée autorise désormais un backend dédié à
CONNECT. Le candidat ajouté dans cette PR provient de la version qualifiée en
préproduction le 27 juillet 2026.

Le périmètre ajouté comprend :

- API PHP 8.3 et contrat OpenAPI ;
- sessions serveur, CSRF et autorisations avec refus par défaut ;
- délégation OAuth à Drupal avec Authorization Code et PKCE S256 ;
- transaction OAuth privée, à usage unique et liée au navigateur ;
- schéma MariaDB/MySQL versionné et migrations réversibles ;
- tests unitaires et d'intégration.

Le lot de sécurisation du 29 juillet 2026 ajoute un sas serveur entre CONNECT,
Rapport et Coupe : ticket HMAC court, secret distinct par application, nonce à
usage unique et refus des accès directs. Les URL applicatives ne sont plus
publiées directement dans le catalogue. Une identité Drupal inconnue est
enregistrée sans droit dans `pending_identities`; seule la commande opérateur
confirmée peut créer son compte actif, son adhésion et ses habilitations.

## Compatibilité Simple OAuth

Simple OAuth 6.1.1 ne renvoie pas le `nonce` dans l'ID token du flux testé.
CONNECT exige sa correspondance lorsqu'il est présent et conserve, dans tous
les cas, les contrôles `state`, PKCE S256, code à usage unique et liaison de la
transaction au navigateur.

La valeur `OAUTH_ISSUER` doit correspondre exactement à l'émetteur Drupal,
slash final compris.

## Validation du candidat déjà en ligne

- syntaxe PHP 8.3 validée sur la copie de qualification ;
- 13 tests sur 13 réussis sur la copie de validation ;
- 11 tests sur 11 réussis sur l'instance active ;
- parcours réel de préproduction : login `200`, callback `303`, retour `200`,
  puis affichage d'une session Drupal authentifiée.

Ces preuves portent sur le candidat OAuth actuellement en ligne. Le sas
obligatoire, l'approbation en base et les refus d'API ajoutés le 29 juillet
restent soumis aux contrôles CI et à une qualification complète de
préproduction avant production.

## Hors périmètre de cette PR

- aucune configuration OAuth de production ;
- aucun secret, certificat privé ou donnée réelle ;
- aucune migration sur une base hébergée ;
- aucun déploiement automatique du backend ; le workflow de production reste
  exclusivement manuel ;
- aucun auto-provisioning : l'approbation crée explicitement l'utilisateur,
  l'adhésion et les habilitations ;
- aucune modification fonctionnelle du frontend V1.
