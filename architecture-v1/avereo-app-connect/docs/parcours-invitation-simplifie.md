---
project: avereo-connect
document_type: functional-workflow
title: Simplifier l’invitation et la première connexion
status: active
version: git
created: 2026-11-03
updated: 2026-11-06
owner: jpdandin
tags: [connect, invitation, connexion, cadrage]
---

# Résultat utilisateur attendu

Recevoir un seul e-mail AVEREO en français, ouvrir un lien d’activation, définir une fois son mot de passe dans un formulaire français et arriver sur CONNECT avec ses seules applications. L’adresse e-mail est l’identifiant proposé. Aucun nom technique ni formulaire général de profil ne doit détourner l’utilisateur.

## Diagnostic confirmé le 3 novembre

Le passage de l’identité Drupal de bloquée à active déclenche la notification native de statut, puis le pont envoie l’invitation AVEREO. La première mène au parcours natif de profil ; la seconde au formulaire prévu pour CONNECT. Un test natif avec collecteur et tables temporaires reproduit exactement deux messages pour une invitation : le test d’unicité ajouté pour le diagnostic est rouge. Il ne constitue pas un correctif réussi.

Le compte de recette avait un mot de passe initialisé et une connexion native réussie, mais la confirmation CONNECT restait en attente. Le retour signé était arrêté par la protection HTTP Basic du portail. Ce cas est distinct du défaut de sujet UUID déjà corrigé.

Le formulaire mêle français et indications natives anglaises, puis le profil expose un nom technique. Le suivi canonique connectOnboardingSimplification20261103 conserve les preuves privées ; aucune adresse personnelle ni URL d’activation dans cette source.

## Parcours du candidat du 4 novembre

1. L’administrateur crée le compte, vérifie les applications et la durée, puis envoie l’invitation par l’action dédiée.
2. Drupal envoie un e-mail AVEREO en français avec un lien à usage unique valable 24 heures. La notification native de changement de statut est supprimée uniquement pendant l’enregistrement de l’identité concernée par cet envoi. Les autres notifications, dont la réinitialisation, suivent le fonctionnement Drupal.
3. Une nouvelle identité ouvre deux champs en français. Drupal vérifie la correspondance et une longueur minimale de 12 caractères, dont une lettre et un chiffre. Une identité déjà initialisée passe directement à l’étape suivante et conserve son mot de passe.
4. Sur « Terminer mon activation », cliquer sur « Continuer vers AVEREO CONNECT ». Si le navigateur demande les identifiants d’entrée de préproduction, utiliser ceux communiqués séparément. Après l’arrivée dans CONNECT, se connecter avec l’adresse e-mail et le mot de passe AVEREO personnel.
5. Si le retour est interrompu, revenir à « Terminer mon activation » et cliquer à nouveau. La session peut générer une nouvelle confirmation signée jusqu’à l’échéance de l’invitation. Chaque tentative garde le nonce et la durée courte du retour signé. CONNECT inscrit la confirmation puis affiche son portail. Si l’échéance est passée et que l’accès reste en attente, demander une nouvelle invitation. Le mot de passe déjà défini est conservé.

La protection HTTP de préproduction et les contrôles d’accès aux applications s’appliquent à ce parcours. Une éventuelle évolution vers un seul identifiant d’entrée relève d’une décision de sécurité séparée.

## Critères de vérification

- Une invitation déclenche exactement un e-mail total ; le mail français attendu est le seul. Le compteur ne doit pas filtrer le mail parasite avant l’assertion.
- Un lien ouvre le formulaire prévu, sans page de profil général ni seconde définition du mot de passe.
- Un lien invalide, expiré, rejoué ou destiné à une autre identité échoue ; aucun élargissement des rôles ou applications.
- Le même compte CONNECT est retrouvé après activation et connexion par e-mail. Période et droits sont conservés.
- Échec ou délai de confirmation : message compréhensible et reprise disponible, sans nouveau mot de passe arbitraire ni réussite simulée.
- Recette HTTP et navigateur neuve, collecte des mails fictifs, réception réelle autorisée séparément et saisie personnelle du mot de passe. La preuve locale sur contrôleurs ne remplace pas cette recette.
- Si le sas HTTP est retiré, qualifier les routes publiques/privées, approbation, sessions, CSRF, rôles, droits et refus à expiration sur la cible exacte avant invitation métier.

| Phase | État |
| --- | --- |
| Cadrage | Diagnostic reproduit et maintien de la protection HTTP retenu pour ce lot |
| Développement local | Correctif contrôlé localement avec Drupal et MariaDB |
| Préproduction | Recette et livraison suivies dans le cockpit |
| Mise en production | Non autorisée |

## Reprise et données de test

Le responsable a ensuite demandé la suppression de trois comptes de test dans Drupal et CONNECT. Ce nettoyage opérationnel est terminé, avec sauvegardes/restaurations et vérification indépendante. Il ne livre aucune nouvelle fonction produit de suppression. Recréer un compte et inviter une personne uniquement sur instruction de reprise, après correction et qualification du parcours.

L’archivage et la suppression définitive dans l’interface relèvent d’un lot distinct : voir [administration des comptes](administration-comptes.md#cycle-de-vie-des-comptes--candidat-du-4-novembre).

## Correctif du retour du 6 novembre

Le candidat ferme les anciennes sessions CONNECT et Identité après confirmation, puis revient à la connexion avec le même mot de passe. [Diagnostic et qualification](retour-activation-connexion.md). Cette évolution locale n’est pas encore installée en préproduction.
