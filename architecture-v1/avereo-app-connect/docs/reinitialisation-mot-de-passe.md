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
- L’interface locale utilise des adresses `example.invalid` et un transport fictif. La livraison SMTP et l’utilisation d’un véritable lien natif de reset restent à qualifier en préproduction sur une identité de recette. Ne pas qualifier le compte d’un utilisateur réel par substitution de mot de passe.

## Préproduction et retour arrière

Livraison du patch SHA-256 `5c5dce77a1d227102670dddc7e707a5ff01d423bcbf0199014dd2a1123852592`. Les neuf empreintes installées et les fichiers protégés ont été contrôlés. Les empreintes des tables CONNECT des comptes, adhésions, applications, organisations, habilitations et migrations sont identiques avant/après installation. Cache Drupal reconstruit. Aucun remplacement de `.htaccess`, configuration privée, sas Rapport/RGA, base ou dossier métier.

Recette hébergée exécutée : bouton visible sur les comptes initialisés ; confirmation du destinataire puis annulation sans envoi. Identité synthétique créée dans une transaction annulée : contrôleur installé, mail natif réellement construit avec livraison désactivée, présence du lien natif, délai configuré, refus UUID incorrect/rejeu/double demande rapprochée et identité conservée, huit contrôles réussis. La réception SMTP, l’envoi complet depuis le navigateur et l’usage du formulaire natif restent non vérifiés ; le résultat de transport a été simulé uniquement dans le processus de recette, sans changement de configuration globale. Aucun courrier à un utilisateur réel. La définition d’un mot de passe de compte réel reste à son titulaire. Retour arrière par les seuls fichiers sauvegardés, sans restaurer une base ni réinitialiser la politique d’essai.

## Les quatre phases

| Phase | État |
| --- | --- |
| Cadrage | Périmètre et critères établis |
| Développement local | Implémentation et contrôles locaux ; candidat/CI dans le cockpit |
| Préproduction | Runtime installé ; restauration sur copie et recette partielle réussies ; réception SMTP et formulaire natif restant à qualifier |
| Mise en production | Non autorisée |
