---
project: avereo-connect
document_type: functional-specification
title: Réinitialisation du mot de passe depuis les comptes CONNECT
status: active
version: git
created: 2026-11-03
updated: 2026-11-03
owner: jpdandin
tags: [connect, comptes, mot-de-passe, securite]
---

# Réinitialisation administrative du mot de passe

## État et parcours

Candidat développé localement sur `feat/connect-password-reset`, fondé sur le parcours des comptes de la PR #96 déjà installé en préproduction. Le nouveau bouton n’est pas encore livré. Aucun reset réel envoyé pendant la préparation.

Dans « Gérer les comptes », un compte actif dont l’initialisation est terminée présente « Envoyer la réinitialisation du mot de passe ». Une confirmation affiche le destinataire ; seul le serveur choisit son adresse, depuis le compte. Le bouton est désactivé pendant la demande. Le message final distingue envoi accepté et échec ; « envoyé » ne prouve pas la réception.

Un compte encore en initialisation conserve son bouton d’invitation, sans reset. Le propriétaire peut agir dans son organisation ; un administrateur agit sur ses membres/lecteurs, pas sur un autre administrateur ou propriétaire. Comptes et adhésions suspendus/désactivés refusés.

## Flux et conservation

`POST /api/v1/admin/organizations/{organizationId}/users/{userId}/password-reset-email` exige la session CONNECT et CSRF ; son corps est vide. La requête signée existante vers le pont Drupal porte `purpose=password_reset`, couvert par HMAC. Elle impose la correspondance exacte e-mail/UUID, une identité active et un premier mot de passe déjà initialisé.

Drupal utilise son opération native `user/password_reset` du gestionnaire de mails : le lien et son usage restent gérés par le cœur Drupal. Le délai provient de `user.settings.password_reset_timeout`, pas du délai de l’invitation. Le code ne retourne aucun lien ou secret à l’administrateur. Le quota par compte et l’anti-rejeu signés existants sont conservés.

L’envoi seul ne change pas le mot de passe, les statuts, la date d’invitation, les applications, l’échéance ni la projection d’essai. Seul l’événement `identity.password_reset_email` (succès/échec) est ajouté au journal. Pas de migration, de nouveau secret ou de modification de l’entrée HTTP cPanel.

## Vérifications et limites

- 26 contrôles de reset backend : autorisations, CSRF, organisation, adresse non substituable, initialisation, erreurs, audit, conservation des données et signature. Exécutés sur SQLite isolé et MariaDB 11.4 avec tables temporaires.
- 15 contrôles du contrôleur Drupal avec cache/entités/mail fictifs : signature, destination, identité inactive, première initialisation, quota, rejeu, mail natif, erreurs et absence de modification du mot de passe.
- Régressions : 38 backend, 38 administration, activation Drupal et 10 provisionnement.
- L’interface locale utilise des adresses `example.invalid` et un transport fictif. La livraison SMTP et l’utilisation d’un véritable lien natif de reset restent à qualifier en préproduction sur une identité de recette. Ne pas qualifier le compte d’un utilisateur réel par substitution de mot de passe.

## Préproduction et retour arrière à préparer

Après accord sur le candidat exact : vérifier les empreintes et la version courante, sauvegarder les fichiers touchés, tester la restauration sur copie, puis installer le même patch sur CONNECT et son pont Identité préproduction. Aucun remplacement de `.htaccess`, configuration privée, sas Rapport/RGA, base ou dossier métier.

Recette hébergée : compte fictif initialisé, bouton et destinataire, envoi contrôlé, réception, délai natif et lien, puis vérification du maintien des droits/périodes et du refus d’un second usage. La définition d’un mot de passe de compte réel reste à son titulaire. Retour arrière par les seuls fichiers sauvegardés, sans restaurer une base ni réinitialiser la politique d’essai.

## Les quatre phases

| Phase | État |
| --- | --- |
| Cadrage | Périmètre et critères établis |
| Développement local | Implémentation et contrôles locaux ; candidat/CI dans le cockpit |
| Préproduction | Installation non effectuée pour ce lot ; accord et recette hébergée requis |
| Mise en production | Non autorisée |
