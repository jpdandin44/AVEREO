---
project: avereo-connect
document_type: development-handoff
title: Reprise du parcours de création et invitation des comptes
status: active
version: git
created: 2026-11-02
updated: 2026-11-03
owner: jpdandin
tags: [connect, comptes, reprise, preproduction]
---

## État de reprise du 3 novembre

La reprise est engagée sur demande du responsable. Les quatre fonctions et le contrat de création sont implémentés localement ; les sections de préparation du 2 novembre ci-dessous restent l’historique du plan. Le [parcours actualisé](administration-comptes.md) porte le comportement effectivement codé et les limites. Aucun compte réel, invitation ou livraison. La prochaine étape est la fin de qualification et la PR du candidat exact, puis la préparation contrôlée de préproduction.


# Reprendre le parcours des nouveaux comptes CONNECT

## Résultat demandé et état de départ

Préparation demandée le 2 novembre pour un démarrage sur demande le 3 novembre avant la démonstration de 9 h 30. Livrer un parcours « Créer un compte → choisir ses applications → définir sa période → envoyer l'invitation ». Le [document fonctionnel des comptes](administration-comptes.md) conserve les exigences ; cette fiche organise leur exécution. Le bouton d'administration pour réinitialiser un mot de passe existant passe après cette première livraison ; le parcours Drupal de mot de passe oublié reste disponible.

L'interface de ce lot n'est **pas développée**. L'envoi/renvoi d'activation existe pour un compte provisionné ; le pont Drupal renvoie `ACCOUNT_NOT_FOUND` pour une identité absente. Les sas temporaires Rapport/RGA sont un **candidat local non publié**, pas une preuve de fonctionnement hébergé : [contrat et limites](../../avereo-app-rapport/docs/essais-temporaires.md).

## Sources et reprise de la copie

- Copie de travail : `C:/Users/examg/Documents local/avereo-essai-philippe`.
- Branche : `feat/essai-temporaire-20261103` ; base observée `7e4c3c03f95cb245920f688d10ec3037d6f95178`, intégrant les PR 92, 93, 95 et 94. Les PR sont fusionnées dans GitHub ; leurs états hébergés restent séparés.
- Des fichiers sont modifiés et non suivis. Ne pas nettoyer, réinitialiser ou recréer cette copie. Une photographie des fichiers et un patch sont conservés dans l'archive privée du lot, indiquée par le cockpit.
- Instructions à lire : `AGENTS.md` racine, celui de CONNECT et celui de Rapport pour les sas. Réutiliser le protocole développement GitHub/cockpit.
- Source opérationnelle : `outillage/acces-preproduction/suivi-chantier.json` dans la copie privée `preprod-acces-local`, bloc `demo_v1_preparation_20261023.decisionSupport20261030.finalisation20261102.temporaryTrial20261103.adminDevelopmentPreparation`. Les fichiers d'archive sont dérivés de ce bloc.

À la reprise, vérifier `git status`, la base distante et les autres changements avant adaptation. Préserver le prototype React historique de CONNECT : le portail réel est `backend/public/index.html`, servi par le backend PHP. Ne pas remplacer ce portail par le frontend historique.

## Les quatre phases

| Phase | Travail prévu | Condition de passage |
| --- | --- | --- |
| Cadrage | Reprendre cette fiche, les limites et les paramètres privés de l'essai ; contrôler les cibles réelles | Périmètre et inconnues consignés ; aucune ouverture ni invitation déduite du document |
| Développement local | Quatre fonctions, contrat de création Drupal, droits et période, échecs, tests, documentation et PR | Candidat exact, preuves locales/CI et artefact identifiés ; restauration et cible préparées |
| Préproduction | Sauvegarder, restaurer sur copie, installer le candidat autorisé, vérifier deux comptes puis préparer le vrai compte | Expiration, dossiers, invitation et activation réellement qualifiés ; preuve d'envoi distincte de réception |
| Mise en production | Hors objectif immédiat ; conserver le reçu de préproduction et le backlog | Aucun accord de production acquis ; décision distincte requise |

La présente clôture termine la préparation, pas ces phases d'exécution. Aucun démarrage automatique demain matin.

## Ordre de réalisation et fichiers concernés

| Priorité | Travail concret | Points d'appui existants |
| --- | --- | --- |
| P0 | Formulaire nom/e-mail, applications à cocher, accès permanent ou période avec dates, récapitulatif avant création | `backend/public/index.html` ; conserver la vue des comptes et les contrôles d'accès existants |
| P0 | Création serveur protégée, sans mail automatique, droits minimaux dès la transaction et résultat récupérable après échec | `backend/src/Application.php`, `Repository/ConnectRepository.php`, `Repository/PdoConnectRepository.php` |
| P0 | Provisionner l'identité Drupal sans mot de passe, renvoyer son sujet stable, prévenir les doublons et les rejeux | Nouveau client/service dans `backend/src/Identity/` ; extension ciblée de `integrations/drupal/avereo_identity_bridge` et de son contrat signé |
| P0 | Période du compte dans les contrôles de catalogue et de lancement, fuseau explicite et fin exclusive | Repository, migrations réversibles et contrat OpenAPI à mettre à jour ; aucune date d'organisation modifiée pour limiter une seule personne |
| P0 | Alimenter les contrôles des deux applications depuis la politique CONNECT de référence | Sas Rapport `frontend/public/connect/gate.php`, compilation RGA `frontend/scripts/build-rga.mjs` ; politique privée dérivée, non modifiable indépendamment de l'administration |
| P0 | Action séparée « Envoyer l'invitation », résultat visible et renvoi | `IdentityAccountActivationClient.php`, routes `activation-email`, `AccountActivationController.php`, `ActivationPasswordForm.php` |
| P0 | Tester les échecs, droits, échéances et conservation des fonctions déjà livrées | Tests CONNECT et Drupal existants, tests d'essai Rapport/RGA ; nouveaux cas ciblés |
| Suite | Réinitialisation d'un mot de passe existant depuis l'administration et cloisonnement des brouillons sur poste partagé | Parcours Drupal existant ; ne pas détourner l'activation ni promettre l'isolement local actuel |

### Contrat de création à implémenter, non disponible actuellement

Proposition : `POST /api/v1/admin/organizations/{id}/accounts`, avec nom, e-mail, rôle membre, codes d'applications et période. La route ne doit pas envoyer de mail. Une action distincte réutilise la route d'activation existante. Une modification de période pourra utiliser une route dédiée à documenter. Ne pas ajouter ces routes au contrat actif comme si elles étaient déjà implémentées.

Le contrôleur doit valider session, rôle, organisation, CSRF, limites des champs, codes d'applications et dates avant tout effet. Les comptes client ne peuvent pas créer de compte ; un administrateur ne peut pas créer un owner/admin. Pour cette première version, un e-mail déjà utilisé produit un conflit explicite : aucune réactivation ou fusion silencieuse. Un retour réseau incertain doit être réconcilié avant une nouvelle création, sans second compte ni second mail.

Ne pas appeler aveuglément `approvePendingIdentity` : ce parcours hérite des droits de l'organisation et déclenche actuellement un mail. Le nouveau parcours doit choisir ses droits avant de devenir lançable et garder la notification séparée.

### Modèle de période et droits — proposition locale à valider par le code

Prévoir dans une migration réversible des dates de début/fin **au niveau du compte**, nulles pour les comptes permanents, et un mode d'accès permettant de distinguer les comptes historiques qui héritent du catalogue des nouveaux comptes limités à une liste explicite. Par exemple : `access_starts_at`, `access_ends_at`, `application_access_mode` (`inherit` historique, `explicit` nouveau). Les noms finaux restent à définir dans la migration ; aucun de ces champs n'existe dans le schéma observé.

Avec le mode explicite, l'absence d'une ligne d'autorisation doit refuser l'application, y compris une application ajoutée ultérieurement. Les requêtes actuelles autorisent les lignes absentes : adapter ensemble catalogue, liste des applications et lancement, sans changer les comptes historiques. Un compte ne reçoit pas l'administration de Rapport par simple rôle d'organisation.

Stocker les instants en UTC, afficher et saisir en Europe/Paris ; début inclus et fin exclue. Les sept jours de l'essai sont définis par deux instants confirmés, pas par un compteur relancé à chaque connexion. Le calendrier de l'essai ne doit pas être confondu avec les 24 heures de validité du lien d'invitation.

CONNECT et sa base constituent la référence des droits et de la période. Le JSON privé lu par les sas est une projection générée : écriture atomique, permissions minimales, jamais de secret dans le navigateur. Si sa mise à jour échoue, ne pas ouvrir le compte ni confirmer un accès comme actif ; conserver une barrière effective pour toute session déjà délivrée. Ne pas ajouter un second réglage manuel concurrent dans les applications.

Le nouveau service de création Drupal doit être signé, limité à cette opération, protégé contre le rejeu et ne jamais retourner de mot de passe ou de lien personnel dans les journaux. L'identité créée sans mot de passe reste inutilisable jusqu'au parcours prévu. Ne pas créer de rôle privilégié Drupal. Réutiliser les conventions du pont d'activation ; les paramètres privés nécessaires sont à qualifier sur la cible, sans modifier les secrets pendant la préparation.

## Critères d'acceptation P0

| ID | Vérification | Résultat attendu |
| --- | --- | --- |
| A1 | Création nominale, puis nouvelle requête avec le même e-mail | Une identité Drupal et un compte CONNECT ; conflit/reprise explicite, aucun doublon |
| A2 | Création sans action d'envoi | Compte préparé, aucun mail et aucune application lançable avant activation |
| A3 | Deux applications sélectionnées et autre URL de lancement appelée directement | Seules les deux choisies sont accessibles après activation ; refus serveur des autres et des futurs ajouts non autorisés |
| A4 | Utilisateur non admin, autre organisation et CSRF invalide | Refus sans compte, droit, message ou journal de succès trompeur |
| A5 | Avant début, début exact, fin exacte, dates inversées et compte permanent | Période correcte, fin exclusive, refus des dates invalides ; historique permanent préservé |
| A6 | Session Rapport/RGA déjà ouverte lors d'une échéance courte | Refus serveur au-delà de la fin, sans effacer artificiellement le cookie et sans bloquer le compte témoin |
| A7 | Deux comptes et leurs dossiers serveur, accès direct par ID, modification et suppression | A ne voit ni n'altère les dossiers de B ; rôle administrateur non attribué au compte d'essai |
| A8 | Invocation explicite de l'envoi puis ouverture du lien par le destinataire | Résultat du transport enregistré ; formulaire de mot de passe, confirmation et deux applications accessibles |
| A9 | Expiration/réutilisation/renvoi du lien | Lien expiré ou consommé refusé ; ancien lien invalidé par renvoi ; aucun nouveau mot de passe connu de l'admin |
| A10 | Échec Drupal, base, projection privée ou transport mail | Reprise visible et sans ouverture partielle, doublon, mail automatique ou fausse confirmation |
| A11 | Anciens comptes, Cricq, dictée, RGA et export | Données et accès existants conservés ; fonctions du candidat réellement installé contrôlées |
| A12 | Isolation du navigateur de Philippe | Profil personnel distinct et vide de brouillon AVEREO ; aucun import automatique du Cricq dans son compte |

A6 vise l'accès serveur : les Word téléchargés et données déjà chargées ne sont pas effacés à distance. L'isolement des brouillons dans un même profil n'est pas démontré par A7.

## Contrôles disponibles à reprendre

Les commandes suivantes sont identifiées dans le dépôt ; elles ne sont pas exécutées à nouveau pour cette clôture. Le mode MariaDB est nécessaire pour qualifier la migration et les requêtes natives ; un test SQLite n'en est pas l'équivalent.

Depuis CONNECT :

```powershell
php backend/tests/run.php
php integrations/drupal/avereo_identity_bridge/tests/activation-flow.php
docker compose -f compose.c7.yaml up -d database
docker compose -f compose.c7.yaml run --rm php php bin/migrate.php --direction=up
docker compose -f compose.c7.yaml run --rm php php tests/integration.php
```

Le test `integration.php` écrit ses fixtures : le réserver à la base locale éphémère, jamais à la base hébergée. Vérifier Docker avant utilisation ; sa disponibilité pour ce lot n'est pas attestée.

Depuis Rapport :

```powershell
php tests/trial-access.php rapport
php tests/trial-access.php rga
python -X utf8 tests/trial-http.py
python -X utf8 tests/rga-http.py
php tests/connect-gate.php
php tests/rga-gate.php
```

Construire d'abord `frontend/dist` avec `VITE_ENABLE_ONLINE_SYNC=true`, puis `npm.cmd test` depuis `frontend`. Le test HTTP d'essai requiert PDO SQLite ; sur ce poste la DLL existe mais n'est pas chargée globalement. Le test la charge uniquement pour son serveur temporaire. Une compilation locale ne justifie pas l'écrasement de tous les fichiers hébergés.

## Préparation de la préproduction et revue

Préparer une PR unique du périmètre, avec environnement local dans Validation, SHA complet, manifeste, tests et limites. Les quatre cases humaines du template restent décochées. Rafraîchir la base et qualifier la fusion sans conflit avant remise. Le candidat combiné n'a pas encore de commit, PR ni empreinte d'artefact ; ne pas utiliser le SHA de base comme celui du nouveau candidat.

À l'exécution, résoudre les chemins CONNECT et Drupal réels ainsi que les configurations privées, relever les versions et sauvegarder les fichiers, bases CONNECT/identité et configurations concernés. Préserver les dossiers Rapport et les livraisons récentes, répéter l'installation/restauration sur copies privées et archiver les preuves. Les anciennes sauvegardes d'autres candidats ne qualifient pas ce lot.

Pour le passage, utiliser le contrôleur `check-gate.py` du skill avec la fiche dérivée du cockpit. Il doit rester en refus tant que candidat, CI, cible prête, accord exact et restauration ne sont pas prouvés. Aucune de ces preuves ne sera créée par simple rédaction du présent document.

Ne pas restaurer un ancien sas dépourvu du contrôle d'essai tant qu'un cookie d'essai peut rester valide. Préparer la récupération avant toute invitation réelle ; ne pas supprimer de compte ou restaurer une base entière par défaut après des écritures nouvelles. Les données du Cricq et les comptes existants doivent rester inchangés.

## Décision avant la démonstration

Point de décision **proposé à 9 h**, pour garder une marge avant 9 h 30 ; ce n'est pas une promesse de livraison ni une reprise planifiée. Si tous les critères P0 et contrôles hébergés ne sont pas acquis, conserver la version stable et dérouler Cricq puis cas pratique sous le compte du démonstrateur. Ne pas prêter son compte ou partager son mot de passe ; le compte personnel et son invitation seront finalisés ensuite. Le cas pratique de Philippe reste distinct du dossier de référence.

Si tout est qualifié, préparer le compte nominatif avec les seuls paramètres du suivi privé, vérifier droits et période, puis envoyer l'invitation par l'action prévue. Conserver l'état « envoyé » et demander au destinataire sa confirmation d'activation ; ne pas annoncer une réception non constatée.

## Première action demain

Sur demande du responsable : ouvrir cette copie, relire le suivi canonique et les accès encore valides, préserver le travail non commité, puis commencer par la création sans mail et les droits explicites. Ne pas lancer d'abord le compte réel. Après le parcours local complet, préparer le candidat de revue et son installation contrôlée.
