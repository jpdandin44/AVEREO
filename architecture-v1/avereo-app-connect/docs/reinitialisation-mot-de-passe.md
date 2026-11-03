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

Runtime `3ac6b66ccf681c30f825a3c071884205814ccc0e` de la PR #97 installé le 3 novembre 2026 sur CONNECT et Identité préproduction après accord explicite. Patch de neuf fichiers vérifié ; huit fichiers existants sauvegardés et restauration sur copie privée contrôlée par empreintes et permissions. Aucune migration ou livraison en production.

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
- L’interface locale utilise des adresses `example.invalid` et un transport fictif. La réception d’un mail réel et l’ouverture du formulaire natif sont désormais vérifiées en préproduction sur un compte du responsable explicitement autorisé. La soumission personnelle, la confirmation de sauvegarde et une nouvelle connexion Identité ont également été vérifiées après réparation ciblée de la langue du profil. Ne pas qualifier le compte d’un utilisateur réel par substitution de mot de passe.

## Préproduction et retour arrière

Livraison du patch SHA-256 `5c5dce77a1d227102670dddc7e707a5ff01d423bcbf0199014dd2a1123852592`. Les neuf empreintes installées et les fichiers protégés ont été contrôlés. Les empreintes des tables CONNECT des comptes, adhésions, applications, organisations, habilitations et migrations sont identiques avant/après installation. Cache Drupal reconstruit. Aucun remplacement de `.htaccess`, configuration privée, sas Rapport/RGA, base ou dossier métier.

Recette hébergée exécutée : bouton visible sur les comptes initialisés ; confirmation du destinataire puis annulation sans envoi. Identité synthétique créée dans une transaction annulée : contrôleur installé, mail natif réellement construit avec livraison désactivée, présence du lien natif, délai configuré, refus UUID incorrect/rejeu/double demande rapprochée et identité conservée, huit contrôles réussis. Lors de cette première recette isolée, la réception SMTP, l’envoi complet depuis le navigateur et l’usage du formulaire natif étaient non vérifiés ; le résultat de transport a été simulé uniquement dans le processus de recette, sans changement de configuration globale. Aucun courrier à un utilisateur réel pendant cette première recette isolée. La définition d’un mot de passe de compte réel reste à son titulaire. Retour arrière par les seuls fichiers sauvegardés, sans restaurer une base ni réinitialiser la politique d’essai.

## Recette réelle autorisée, après livraison

Le 3 novembre 2026, à la demande explicite du responsable sur son propre compte, la confirmation initiale a été achevée puis le bouton de reset utilisé. Mail reçu dans la boîte destinataire à 18 h 13 (Europe/Paris), lien natif accepté, formulaire Password / Confirm password affiché sans ancien mot de passe. Une première tentative rapprochée du mail de confirmation a été refusée avec le message d’attente ; la tentative suivante après le délai a réussi. La session Identité administrateur a dû être quittée avant d’ouvrir le lien d’un autre compte, conformément au parcours Drupal.

Le titulaire a saisi, confirmé et validé lui-même le nouveau secret. Confirmation « The changes have been saved. » observée, puis déconnexion Identité et nouvelle connexion avec le secret saisi personnellement : profil du bon compte et menu authentifié vérifiés. Réutilisation du lien non retestée après sauvegarde. Le mail et le formulaire restent en anglais : amélioration de présentation identifiée, sans modification de ce lot. Les preuves privées dans le cockpit ne conservent ni mot de passe ni lien de réinitialisation.

## Anomalie de langue identifiée pendant la sauvegarde

Le provisionnement imposait `fr` aux champs `langcode` et `preferred_langcode`, alors que la cible ne dispose que de `en`. La validation native refusait le profil entier avec « The value you selected is not a valid choice. », sans champ visible signalé. Les violations observées concernent précisément ces deux champs, pas le fuseau horaire ni la force du mot de passe.

Réparation opérationnelle limitée au compte personnel explicitement testé : sauvegarde des deux valeurs de langue, réalignement sur la langue par défaut disponible, validation native sans erreur. Empreinte des attributs protégés identique (mot de passe, identité, statut, rôles et dates de connexion inclus). Formulaire GET neuf ouvert avant nouvelle saisie personnelle ; aucun secret saisi par l’agent et aucun autre compte modifié.

Correction durable préparée **localement seulement** dans `AccountProvisioningController` : utiliser la langue par défaut du site. Test en échec avant correction ; 12 contrôles de provisionnement et 15 de reset réussis après correction. Ce code n’est pas installé et ne répare pas automatiquement les comptes existants ; qualification hébergée et accord sur un nouveau candidat requis avant livraison.

## Identifiant de connexion et nom affiché

La création administrative utilise actuellement un nom Drupal technique `avereo-invite-` suivi d’une empreinte de l’adresse ; le nom de profil CONNECT est distinct. Le message d’activation antérieur au reset montrait déjà ce nom technique. Le reset ne renomme pas l’identité. Le responsable attend la possibilité d’utiliser son login lisible ou son adresse e-mail. Contrôle hébergé en lecture seule du service UserAuthentication : ni le nom de profil ni l’adresse e-mail ne retrouvent le compte ; seul le nom technique le retrouve. Le libellé « login ou adresse mail » serait donc incohérent avec ce comportement. Le raccordement est désormais préparé dans le [candidat de connexion par identifiant ou e-mail](connexion-identifiant-email.md), non installé. Il conserve la validation native et prévoit un ajustement ciblé du nom, sans nouvelle identité ni changement de mot de passe.

## Les quatre phases

| Phase | État |
| --- | --- |
| Cadrage | Périmètre et critères établis |
| Développement local | Implémentation et contrôles locaux ; candidat/CI dans le cockpit |
| Préproduction | Runtime installé ; réception, sauvegarde et nouvelle connexion vérifiées sur le compte personnel ; anomalie de langue réparée sur ce seul compte ; correction du provisionnement locale non livrée |
| Mise en production | Non autorisée |
