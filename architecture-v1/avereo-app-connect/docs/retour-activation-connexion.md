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
aucun abaissement de limite, aucune saisie de mot de passe par l’agent. L’enregistrement
personnel et la nouvelle connexion restent à confirmer. Ce blocage est distinct du
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
| Développement local | Correctif et tests prêts à revue |
| Préproduction | Cible identifiée ; installation et recette du correctif à autoriser |
| Mise en production | Non autorisée |
