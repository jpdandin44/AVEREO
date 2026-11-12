---
project: avereo-platform
document_type: feature-contract
title: Médaillon personnel du compte CONNECT
status: active
version: git
created: 2026-11-12
updated: 2026-11-12
owner: jpdandin
tags: [connect, compte, preferences, interface, securite]
---

# Médaillon personnel — candidat local

## Besoin et état réel

Chaque compte actif règle son propre texte dans **CONNECT → Mon compte → Préférences**. Une à trois lettres/chiffres Unicode sont acceptés ; défaut `MOI`. Les applications connectées au même portail relisent cette préférence. Un changement ne modifie ni un autre compte, ni les organisations, habilitations ou dossiers. La PR #137 reste le candidat historique du modèle commun, pas la preuve de cette nouvelle fonction. [Suivi canonique de cette itération](../data/suivi-medaillon-personnel.json).

La fonction est implémentée et essayée localement avec identités fictives, **non installée en préproduction ou production**. L'ancien suivi et ses validations ne sont pas remplacés. L'activation d'`APPEARANCE_ADMIN_ORGANIZATION_ID` n'est pas nécessaire pour une préférence personnelle ; les autres réglages d'apparence commune conservent leur administration existante.

## Parcours

Le formulaire distingue la préférence du compte (en ligne) des préférences applicatives conservées dans ce navigateur. Annuler n'écrit rien. Enregistrer attend une confirmation serveur avant de changer le médaillon. Un échec garde le dialogue ouvert. La valeur personnelle n'est ni mise dans localStorage, ni exportée dans le modèle public d'apparence. Les anciens exports de Saisie unique restent compatibles et ne sont pas réinterprétés comme des préférences du compte.

Le menu recharge la valeur à son montage, au retour dans un onglet et au rétablissement de visibilité. Pas de surveillance ou polling permanent. Il revient immédiatement à `MOI` en attendant la réponse ou si CONNECT n'est plus accessible. Une réponse ancienne n'est pas réappliquée après fermeture de session. Le retour dans l'onglet ferme un formulaire resté ouvert pour ne pas conserver une saisie liée à une ancienne identité. Un contexte HMAC de compte/session refuse aussi côté serveur l'enregistrement d'un formulaire A sous une session B, même si le navigateur possède un nouveau CSRF.

## Contrat et stockage

`GET /api/v1/me/preferences` renvoie `accountBadge` et un `accountContext` opaque lié au compte et à la session. `PUT` accepte uniquement `{ "accountBadge": "JPD" }`, avec `X-CSRF-Token` et `X-Account-Context`. Aucun identifiant cible fourni par le navigateur n'est accepté. La session CONNECT rafraîchie désigne exclusivement le compte concerné. La lecture publique `/api/v1/appearance` reste séparée et ne reçoit aucune valeur personnelle. [Contrat HTTP](../../avereo-app-connect/backend/api/openapi.yaml).

Les préférences sont dans `account-preferences/<id-connect>.json`, sous le répertoire privé contenant la configuration CONNECT. Aucun changement SQL. Le GET n'initialise aucun fichier. La première sauvegarde crée le sous-répertoire privé (`0700`) ; fichiers, temporaires et verrous sont privés (`0600` sur hôte Unix). Écriture atomique sous verrou, refus des liens symboliques et validation des contenus. Les ACL Windows et les permissions du runtime hébergé restent des qualifications distinctes. Le corps de la requête est limité à 512 octets.

Les lectures interorigines utilisent la session CONNECT (`credentials: include`). CORS accepte seulement l'origine exacte d'une application déclarée dans les URL de lancement privées et pour laquelle le compte est actuellement habilité ; aucun joker ni confiance générale dans les sous-domaines. Le code applicatif est envoyé dans `?application=`. Les mutations interorigines sont refusées, y compris depuis une application habilitée. Aucune exposition CORS du CSRF. Toutes les réponses émises sont `Cache-Control: no-store`.

## Portée et limites

Le composant commun dessert CONNECT, Rapport, RGA, Projet, Coupe, Thermo, Drone, Recherche et Passeport Immo. Leur livraison doit inclure la source générée mise à jour et le backend CONNECT compatible. Le script `prepare-account-menu.mjs` prépare neuf applications du manifeste, dont Saisie unique autonome. Les surfaces non disponibles en ligne ne sont pas déclarées recettées.

La préférence suit **la session CONNECT courante**. Les sessions propres aux applications ne sont pas fusionnées ou révoquées par ce lot. Tester en préproduction les bascules de compte et les sessions applicatives anciennes ; en cas de divergence, revenir par CONNECT pour ouvrir le bon compte. Une session CONNECT expirée ou des cookies bloqués produisent `MOI`, sans contournement d'authentification. Le chargement interorigines sur les vrais domaines est encore à qualifier.

Saisie unique reste hors ligne, sans compte CONNECT ni synchronisation réseau : elle conserve son modèle autonome et constitue une exception explicite. Le portail historique sans session backend ne gagne pas une fausse personnalisation. Le module Développements, son propriétaire exact et son contrôle global Drupal restent hors modification ; le test de non-régression du pont est conservé.

## Vérifications et revue locale

- `php architecture-v1/avereo-app-connect/backend/tests/run.php` : 43 tests, dont isolation de deux comptes, membre ordinaire, CSRF, contexte périmé, valeurs invalides, persistance, origine et habilitation.
- `node --test architecture-v1/avereo-platform/tests/account-menu.test.mjs` : 31 tests, dont enregistrement/annulation, absence de faux succès, remontage, bascule de compte, huit applications et refus de réponse tardive.
- `php architecture-v1/avereo-app-connect/backend/tests/development-authorization.php` : 41 assertions de non-régression du pont privé, sans appel distant.
- `php -d extension=pdo_sqlite architecture-v1/avereo-app-connect/backend/tests/account-administration.php` : 48 contrôles sur base SQLite fictive ; pas une qualification de migration MySQL.
- Génération des copies puis `node .github/scripts/check-account-menu.mjs` : source distribuée identique ; les builds complets restent distincts des tests DOM.

Revue locale : `http://127.0.0.1:5327/`, routeur `backend/tests/account-ui-router.php`, données fictives uniquement, indicateur de recette explicite. Le lancement impose `APP_ENV=local`, `ACCOUNT_UI_FIXTURE=true`, un chemin privé `ACCOUNT_UI_DB` et une écoute sur la seule boucle locale. SQLite doit être chargé dans le PHP de recette ; ne pas réutiliser ces options en préproduction. Parcours visuel effectué : `MOI` → `JPD`, enregistrement, rechargement et réouverture du formulaire. [Capture locale](illustrations/medaillon-personnel.png). Cette recette ne prouve pas une identité réelle CONNECT/Drupal.

## Quatre phases et livraison ultérieure

| Phase | État |
| --- | --- |
| Cadrage | Préférence personnelle confirmée, ancien modèle commun distingué |
| Développement local | Implémentation et tests locaux, revue humaine et CI à suivre dans le suivi |
| Préproduction | Non installée ; nouvelle autorisation, sauvegarde/restauration et recette requises |
| Mise en production | Hors périmètre, non autorisée |

Ne pas réutiliser le ZIP des neuf fichiers #137 : ce candidat modifie aussi l'injection du service dans `public/index.php`. Préserver sa variante hébergée ; comparer et intégrer cette seule différence depuis une source qualifiée, sans écraser les raccordements #140, clients ou Développements. Qualifier les domaines, les URL de lancement, les permissions du stockage privé, les préimages et la version exacte avant tout remplacement. Préparer un paquet/reçu spécifique après la qualification CI, puis demander l'accord pour cette version et son effet.

Sauvegarder code sélectionné, configuration témoin, apparence commune, nouveau répertoire de préférences (ou son absence), fichiers clients et habilitations témoins. Tester la restauration sur une copie privée. Aucun utilisateur réel ne doit servir à une recette destructive ; utiliser deux comptes fictifs déjà autorisés. Contrôler les refus 401/403/409/413/422 et vérifier que les autres comptes, dossiers et accès privés restent intacts.

Retour arrière : conserver les nouvelles préférences privées, même en revenant au code antérieur. Aucun `DROP`, suppression de compte, réinitialisation du modèle ou restauration globale de base. Le code antérieur ignore le nouveau sous-répertoire ; la personnalisation ne sera plus affichée. Réinstaller seulement les préimages du paquet qualifié, sous contrôle de dérive. L'ancien risque #137 concernant un modèle commun à quatre champs reste historique et ne permet pas de supprimer ses réglages récents. La récupération hébergée n'a pas été exécutée.
