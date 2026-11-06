---
project: avereo-connect
document_type: qualification
title: Retour à la connexion après activation
status: active
version: git
created: 2026-11-06
updated: 2026-11-06
owner: jpdandin
tags: [connect, activation, connexion, qualification]
---

# Retour à la connexion après activation

## Livraison en préproduction du 6 novembre 2026

Après l’accord explicite du responsable, les deux fichiers de la PR #118 sont
installés à **13 h 51, heure de Paris**. Le [reçu serveur](../data/preproduction-retour-activation/deployment.json)
porte les empreintes avant/après et le retour arrière privé. L’archive acceptée est
inchangée ; les remplacements préservent les permissions. Le point d’entrée PHP,
la protection du répertoire et la configuration privée gardent leurs empreintes.
Aucune migration ni écriture en base par l’installation.

Les 40 tests natifs passent avec le candidat puis avec les fichiers installés,
sur des comptes et dépôts fictifs en mémoire. Le navigateur confirme le nouveau
message de connexion, le retour par SSO de l’administrateur existant et le refus
de trois confirmations invalides : paramètres absents, date expirée, signature
incorrecte. La session existante reste utilisable après ces refus.
Les [contrôles HTTPS anonymes](../data/preproduction-retour-activation/anonymous-https-checks.json)
constatent un portail public de connexion et une session non authentifiée (`200`),
puis le refus du catalogue et des organisations (`401`), avec `Cache-Control: no-store`.
Ils ne constituent pas une preuve de protection HTTP Basic ; cette hypothèse
initiale a été corrigée sans modifier les protections de la cible.

La [fixture nominative](../data/preproduction-retour-activation/fixture-preparation.json)
est le compte CONNECT 27 / Drupal 26, « Recette PR118 — première connexion »,
à adresse `.invalid`, limité jusqu’au 6 novembre à 16 h, heure de Paris. Le formulaire
de création exige une application : RGA a été choisie puis retirée avant activation.
Le compte n’a donc aucun accès applicatif. Le contrôleur natif d’invitation a produit
un lien, capturé par un collecteur en mémoire pour cette seule invocation : aucun
mail externe, aucun changement de configuration globale d’envoi.

Le responsable a défini le premier mot de passe dans le formulaire natif, depuis
le navigateur qui possédait encore l’ancienne session administrateur. Après le
retour à la connexion, il a confirmé son entrée avec ce même mot de passe, sans
réinitialisation. Le navigateur a affiché **Recette PR118 — première connexion**,
compte actif, profil Client, aucune application. La base confirme le statut
`completed`, le mot de passe initialisé et la connexion Drupal du 6 novembre à
**15 h 20, heure de Paris**. Aucun mot de passe n’a été lu ou saisi par l’agent.

Le [reçu final](../data/preproduction-retour-activation/fixture-completion.json) et
la [confirmation humaine](../data/preproduction-retour-activation/human-first-login.json)
valident ce parcours hébergé avec une ancienne identité présente. Le scénario
hébergé depuis un navigateur entièrement neuf n’a pas été rejoué séparément ;
les contrôles locaux Drupal et CONNECT décrits plus bas couvrent ce cas.
Les [observations préalables](../data/preproduction-retour-activation/browser-checks.json)
restent historiques.

Le compte fictif a ensuite été archivé à **15 h 25, heure de Paris**, via le service
natif de cycle de vie. Sa session CONNECT est devenue anonyme après rechargement.
L’état métier des autres comptes, leurs droits applicatifs et leurs entrées dans
la politique privée sont identiques avant/après cette opération. Aucun compte
n’a été supprimé définitivement ; aucun dossier réel n’a été modifié.

Les outils ponctuels sont conservés dans le dossier privé de livraison et dans
`C:/Users/examg/Documents local/livraisons-avereo/activation-connect`. Ils ne font
pas partie des fichiers applicatifs. La première exécution du préparateur de fixture
a été refusée sur une colonne mal nommée avant toute mutation ; correction vers
le champ natif `email_normalized`, puis exécution réussie. Le nettoyage a aussi été
arrêté avant mutation par une différence de fin de fichier au transfert puis par
un type de date Drupal inattendu ; transfert exact et conversion explicite en entier
corrigés, reçu d’archivage vérifié. Les garde-fous de la fixture locale Drupal/SQLite
d’origine restent inchangés. Ces corrections concernent les outils privés de recette,
pas l’artefact applicatif accepté.

## Historique — préparation après fusion du 6 novembre 2026

La PR #118 est fusionnée au commit `b042d5ae5cace46791ac8cf78d43ebd0c56e5cf6`.
Les quatre cases humaines sont cochées et les contrôles GitHub du commit accepté
`47eda950604a7c16d26c0f21ae90f2e3768ad527` réussissent. Les deux fichiers du paquet
initial sont identiques aux fichiers fusionnés ; l’archive est conservée.

Les deux fichiers actuels de préproduction correspondent à la base attendue.
Le pont Drupal et le retour autorisé sont vérifiés sans afficher de secret.
Une sauvegarde privée et une restauration après remplacement fictif sur copies
réussissent ; les fichiers actifs restent inchangés. Le [suivi canonique](../data/suivi-retour-activation.json)
référence le reçu d’exploitation et conserve l’accord de déploiement en attente.

Le lien local de revue a exposé `IDENTITY_PROVIDER_NOT_CONFIGURED` lors d’un clic
sur Se connecter : cet aperçu ne possède pas de fournisseur d’identité. Le lanceur
local `preview-router.php`, conservé avec le paquet hors du dépôt applicatif,
affiche désormais cette limite, désactive le bouton et renvoie l’ancien lien de
connexion vers l’explication. Il n’entre pas dans les deux fichiers à livrer.
La première connexion complète reste à vérifier en préproduction après installation.

Les contrôles et étapes ci-dessous décrivent la qualification du candidat ; la
fusion ne vaut ni installation ni validation du parcours hébergé.

## Constat et limite du diagnostic

Le contrôle en lecture seule du 6 novembre en préproduction constate, pour le
compte signalé, un compte Drupal actif avec `password_initialized=1`, un compte
CONNECT actif avec `onboarding_status=completed` et une confirmation d’activation
réussie dans le journal. Aucun mot de passe ni empreinte de mot de passe n’a été
consulté, copié ou modifié. Le navigateur du responsable n’a pas été inspecté :
l’identité exacte de sa session au moment de la capture reste non déterminée.

Le code confirme un défaut indépendant et reproductible : le retour signé active
le compte ciblé puis redirige vers le portail en conservant la session CONNECT
précédente. Une autre identité encore en attente peut donc afficher le message
d’activation. CONNECT relit le statut en base ; ce statut n’est pas mis en cache
dans la session. Il ne faut ni forcer à nouveau l’activation en base ni dupliquer
le mot de passe Drupal pour traiter ce cas.

## Connexion refusée pendant le test personnel

Un second contrôle confirme que l’adresse saisie se résout vers le même compte
Drupal, dont le nom de connexion est technique (le prénom affiché dans CONNECT
n’est pas un alias). Six tentatives échouées ont atteint la limite native de cinq
pour ce compte et ce navigateur. Le motif des premiers refus n’est pas déterminé.
Le code du formulaire de premier mot de passe correspond au dépôt après
normalisation des fins de ligne ; ce constat ne vérifie pas le mot de passe saisi.

Le responsable a demandé lui-même une réinitialisation et atteint sa page native.
Le code Drupal installé confirme que ce parcours efface le compteur individuel
lors de l’entrée par le lien à usage unique. Aucune suppression manuelle du compteur,
aucun abaissement de limite, aucune saisie de mot de passe par l’agent. Le responsable confirme ensuite son accès à CONNECT après récupération. Cette
réussite personnelle ne valide pas la première connexion d’un compte neuf. Ce blocage est distinct du
correctif de retour proposé ci-dessous ; ce correctif ne prétend pas résoudre un
mot de passe refusé.

## Comportement du candidat

1. Vérifier la confirmation signée existante et la configuration du pont de déconnexion.
2. Confirmer le compte ciblé, avec la synchronisation des accès existante.
3. Fermer la session CONNECT courante uniquement après cette réussite.
4. Rediriger vers le pont signé de déconnexion Identité, qui ferme la session Drupal.
5. Revenir à la page de connexion CONNECT déjà autorisée (`/?logout=1`). L’utilisateur
   clique sur **Se connecter** et utilise son adresse e-mail et le mot de passe AVEREO
   qu’il vient de définir.

Le message de retour indique les identifiants attendus. Un ancien écran d’activation
explique aussi la reconnexion si le mot de passe a déjà été défini. Aucune ouverture
de session au nom du compte ciblé n’est effectuée par la confirmation d’activation.

## Validation locale

- Avant correction, le test de fermeture de la session échoue : `previous CONNECT
  identity cleared`, attendu `true`, reçu `false`.
- Après correction, `php architecture-v1/avereo-app-connect/backend/tests/run.php` :
  **40/40**. Les nouveaux scénarios couvrent le navigateur anonyme, une ancienne
  identité approuvée, une autre identité en attente, une signature altérée, un lien
  expiré et l’absence du pont de déconnexion. La destination existante et sa
  signature sont vérifiées ; un échec conserve session et statut.
- `php architecture-v1/avereo-app-connect/integrations/drupal/avereo_identity_bridge/tests/activation-flow.php` : réussi,
  conservation du mot de passe et route du formulaire.
- Syntaxe PHP et contrôle du socle du dépôt : réussis.
- Revue locale du portail : `http://127.0.0.1:52968/?logout=1`, serveur PHP natif
  sans fournisseur d’identité ni base de comptes réels. Elle vérifie le message
  et le bouton ; elle ne simule pas une connexion Drupal réussie.

## Recette native de première connexion

`tests/first-login-http.py` et `tests/first-login-fixture.php` dans le module Drupal
exercent 17 contrôles sur Drupal **11.4.10**, dans un conteneur jetable local lié à
`127.0.0.1:8094`, avec une base SQLite fictive et le collecteur de mails natif.
Deux comptes neufs sont créés : navigateur anonyme, puis ancienne identité ouverte.
Les deux formulaires enregistrent le premier mot de passe (ASCII puis accentué),
le retour signé cible le compte invité, le pont de déconnexion natif fonctionne et
le même mot de passe authentifie le compte par e-mail sans reset. Une seule invitation
est collectée par compte et le lien consommé est refusé. **17/17 réussis.**

La confirmation CONNECT et sa fermeture de session sont vérifiées séparément par
les 40 tests applicatifs ; cette recette n’est pas un parcours OIDC complet hébergé.
Le script refuse une cible distante et n’envoie aucun e-mail réel. Il exige
`AVEREO_FIRST_LOGIN_LOCAL=1`, le conteneur de recette nommé dans le script, Drush et
le module courant ; la fixture PHP exige la racine et la base SQLite jetables.

La CI a également révélé un ancien test de migration qui attend cinq migrations
mais exécutait désormais les migrations ultérieures de période/cycle de vie.
La fixture de cette transition historique copie le runner réel et les cinq fichiers
SQL concernés, avec égalité d’empreinte ; toutes les assertions de conservation,
restauration et idempotence restent inchangées. La suite CI générale teste séparément
l’ensemble des migrations récentes.

## Sécurité, données et préparation de livraison

Deux fichiers applicatifs changent : `backend/src/Application.php` et
`backend/public/index.html`. Aucune migration, modification de secret, de rôle,
d’habilitation, de période ou de données de dossier. Aucun changement du module
Drupal ni de sa liste d’URL de retour autorisées.

Une confirmation invalide ou une déconnexion non configurée échoue avant toute
mutation. Si le pont distant échoue après confirmation, le compte reste activé ;
le retour depuis « Terminer mon activation » reste réessayable selon sa durée
existante. La nouvelle signature de déconnexion conserve son nonce et sa durée
courte. Les paramètres signés ne doivent pas être copiés dans les preuves publiques.

Avant installation : contrôler la version fusionnée, le pont existant et son URL
de retour, comparer les deux fichiers à la version hébergée, sauvegarder hors
répertoire public puis restaurer sur copies. Après accord de déploiement, installer
les deux fichiers de ce candidat et vérifier leurs empreintes. Recette sur comptes
fictifs : navigateur neuf puis ancienne session ouverte, formulaire une seule fois,
retour à la connexion et entrée avec le même mot de passe ; rejet d’une confirmation
altérée ou expirée. La connexion personnelle finale appartient au responsable.

## Suivi

Source canonique : [fiche d’itération](../data/suivi-retour-activation.json), reliée
au [cockpit](../../../outillage/acces-preproduction/suivi-chantier.json).

| Phase | État |
| --- | --- |
| Cadrage | Lecture seule hébergée et défaut local reproduit |
| Développement local | PR #118 validée et fusionnée ; artefact inchangé |
| Préproduction | Deux fichiers installés ; parcours du compte neuf avec ancienne identité et archivage réussis |
| Mise en production | Non autorisée |
