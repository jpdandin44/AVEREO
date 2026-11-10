---
project: avereo
document_type: procedure-habilitations
title: Gérer les accès et exporter les rapports par organisation
status: proposed
version: git
created: 2026-11-10
updated: 2026-11-10
owner: jpdandin
tags: [connect, rapport, habilitations]
---

# Gérer les accès et exporter les rapports par organisation

## Cadrage

Le candidat distingue la gestion des accès applicatifs et l’export intégral d’un rapport. Une même personne peut exercer ces fonctions dans plusieurs organisations. Chaque droit correspond à une décision d’habilitation dans un environnement précis.

Les dossiers historiques portent le fournisseur et l’identifiant de leur propriétaire. Aucun registre fiable d’appartenance des rapports à une organisation n’a été identifié. Le nom, l’adresse e-mail, la référence du dossier et l’adhésion actuelle du propriétaire ne suffisent pas à établir ce rattachement.

## Développement local

**CONNECT.** Dans « Mon profil », choisir l’organisation à administrer, puis ouvrir « Gérer les comptes » dans « Mon espace ». Le sélecteur apparaît à partir de deux organisations administrables. Une délégation donne accès aux cases des applications déjà disponibles pour les membres et lecteurs actifs de cette organisation. Les approbations d’identité, les autres administrateurs, le compte du délégataire, la période et le cycle de vie du compte restent protégés. La gestion habituelle des propriétaires et administrateurs conserve sa portée.

La table `application_access_delegations` désigne une adhésion CONNECT et porte la référence de décision et son échéance éventuelle en UTC. Le service vérifie l’état du compte, la période, l’adhésion et l’organisation. Il relit la délégation pour chaque action et dans la transaction d’écriture. Le portail utilise la mutation applicative et le journal CONNECT existants. [Contrat CONNECT](../architecture-v1/avereo-app-connect/backend/api/openapi.yaml).

**Rapport.** Depuis les rapports sauvegardés en ligne, la section « Exports autorisés par organisation » permet de chercher une référence exacte et de télécharger un dossier après choix du motif. Le fichier contient les octets JSON sauvegardés, y compris les pièces intégrées et les champs inconnus du frontend. Le téléchargement conserve le brouillon ouvert dans le navigateur.

La base de chaque environnement conserve deux informations indépendantes. Une permission d’export associe un compte CONNECT à une organisation. Une fiche de rattachement associe un rapport précis, son propriétaire vérifié et une organisation. L’export requiert les deux. Pour un dossier historique, faire confirmer le dossier et sa mission par une source habilitée, par exemple le propriétaire avec une référence de mission contrôlée. Conserver la preuve dans le registre privé. Un dossier en attente de vérification reste dans l’espace de son propriétaire. L’opération de rattachement concerne une table distincte de la table des rapports.

Le service réserve ce parcours aux sessions Rapport authentifiées par CONNECT. La liste est limitée aux dossiers autorisés. Le téléchargement vérifie de nouveau les droits et consigne l’acteur destinataire, l’organisation, le dossier, le motif, la décision et la date, avant la remise du fichier. Le service ne modifie que le journal. Le même droit ne donne accès à aucune route de modification ni de suppression.

### Rejouer la recette

- [CONNECT](../architecture-v1/avereo-app-connect/backend/tests/application-access-delegations.php) utilise deux organisations fictives, teste les refus, le retrait et l’échéance. La variante MariaDB utilise les tables temporaires de la CI et exerce également l’attribution et le retrait d’une application.
- [Rapport](../architecture-v1/avereo-app-rapport/tests/organization-exports.php) compare le JSON exact, la propriété, la dernière sauvegarde et le journal. Il couvre le propriétaire commun aux deux organisations, un dossier sans rattachement et une permission retirée entre deux requêtes.
- [Recette navigateur](../architecture-v1/avereo-app-rapport/tests/organization-exports.browser.mjs) utilise la compilation de Rapport avec `VITE_ENABLE_ONLINE_SYNC=true`, un navigateur isolé et des réponses de test. Elle vérifie le fichier téléchargé, le motif, le refus suivant et la conservation du brouillon.

## Préproduction

Les migrations créent des tables vides. L’opérateur habilité utilise le registre de l’environnement pour y porter les décisions et les rattachements vérifiés. Le portail public ne permet pas de créer ces délégations ou de déclarer soi-même le rattachement d’un dossier tiers. Le registre local de décisions du projet n’est pas importé dans les bases.

Après sauvegarde et répétition de la restauration sur copie, installer le candidat et les migrations [CONNECT](../architecture-v1/avereo-app-connect/database/migrations/20261110120000_application_access_delegations.up.sql) et [Rapport](../architecture-v1/avereo-app-rapport/database/migrations/002_organization_exports.sql). Dans les configurations privées du seul environnement visé, CONNECT utilise `APPLICATION_ACCESS_DELEGATIONS_ENABLED` (chaîne `true`) et Rapport `organization_exports_enabled` (booléen vrai). Les deux fonctions sont désactivées par défaut.

Utiliser des comptes et dossiers fictifs pour vérifier les deux permissions indépendamment, y compris après retrait. Comparer les octets, le propriétaire et la dernière sauvegarde avant et après l’export. Vérifier le reçu et l’absence des données du rapport dans les journaux. En cas de difficulté, couper les deux options et restaurer le candidat précédent. Conserver les preuves, les rattachements et le journal.

## Mise en production

Promouvoir le candidat qualifié en préproduction. L’opérateur vérifie les décisions propres à la production ainsi que le périmètre réellement confié pour les données des organisations clientes. Vérifier ensuite la portée des comptes et le journal sur cet environnement. Le transfert de propriété demeure un chantier distinct.
