---
project: avereo-connect
document_type: functional-design
title: Catalogue de profils et droits depuis la gestion des comptes
status: active
version: git
created: 2026-11-17
updated: 2026-11-17
owner: jpdandin
tags: [connect, profils, comptes, droits, rapport, cadrage]
---


# Catalogue commun de profils et droits

## Cadrage

Le 17 novembre, le responsable demande de créer et gérer les types de profils,
leurs affectations, l'accès aux applications et les actions dans Rapport depuis
**Gérer les comptes**. Il confirme le **catalogue commun à AVEREO géré par son
compte administrateur global**, puis demande de terminer ce nouveau lot en local
avant toute mise en préproduction des profils.

PR164 est fusionnée en c2e2802, arbre identique au candidat 7b7b2a4 qualifié.
Elle apporte le métier personnel déclaré, pas cette administration. Les deux
notions restent distinctes : modifier **Mon profil** ou le métier d'un dossier
n'accorde aucun droit. Aucun profil ne prouve une qualification professionnelle.

Source opérationnelle :
rapportV12CadrageProfils20261112.catalogueProfilsDroits20261117 dans le suivi
canonique du cockpit privé. Les accords et états des anciens lots sont conservés.

### Parcours utilisateur

Dans **Gérer les comptes → Types de profils et droits — catalogue commun AVEREO** :

1. Créer un type, saisir son nom et sa description.
2. Choisir un parcours Rapport de référence : Habitologue, Architecte ou Maître
   d'œuvre. Un nom libre ne crée pas un nouveau moteur métier.
3. Cocher les applications permises et les actions Rapport.
4. Enregistrer après lecture du récapitulatif. Renommer ou désactiver un type
   conserve son identifiant et ses dossiers.
5. Sur la fiche d'un compte : ouvrir **Profil et droits**, choisir le type et
   enregistrer l'affectation. Le récapitulatif distingue les droits du type des
   attributions déjà présentes sur le compte.

Trois types initiaux existent, sans droit et sans affectation automatique. Un
nouveau type ne donne aucun accès tant que son administrateur ne les configure
pas et ne l'affecte pas. Un type sans application coupe les accès du compte
affecté ; la prévisualisation et la confirmation l'indiquent.

### Règles d'accès

Un profil administré par compte, commun à ses organisations. Il **limite**
les attributions existantes : compte actif et activé, dates, adhésion,
habilitations organisationnelles et refus individuels restent applicables.
Une case applicative du profil ne rétablit pas une application refusée sur le
compte ou absente des habilitations de l'organisation. Pour ajouter un accès,
l'administrateur configure aussi les attributions de compte existantes.

| Action | Effet |
| --- | --- |
| Consulter | Lire les dossiers dans le périmètre déjà autorisé |
| Créer | Créer un dossier appartenant à l'identité serveur |
| Modifier | Mettre à jour ses dossiers et envoyer leurs originaux selon les contrôles existants |
| Supprimer | Supprimer un dossier dans le périmètre déjà autorisé |
| Exporter | Télécharger le JSON serveur et utiliser les parcours officiels Word, JSON local, Projet, photo et partage |

L'accès Rapport demande le droit de consultation. Les habilitations Rapport
privilégiées déjà existantes et celles de copie organisationnelle restent
distinctes ; aucun type métier ne les accorde. Expertise technique reste masquée
dans le parcours général, conformément au lot 0. Aucun dossier ne change de
propriétaire lors d'une affectation ou d'un changement de droits.

Seul l'identifiant CONNECT propriétaire configuré, avec son **rôle global Drupal
actuel**, peut gérer types et affectations. Un administrateur d'organisation est
refusé par ces nouvelles routes. Le compte administrateur global ne peut pas
s'affecter lui-même un profil par ce parcours. Il peut affecter les autres comptes
éligibles, y compris un propriétaire d'organisation, sans modifier leurs rôles.
Un compte archivé doit être restauré par son action existante avant affectation.

## Développement local

Implémentation locale sur feat/connect-profils-droits, copie isolée
C:/Users/examg/Documents local/avereo-connect-profils-droits, base c2e2802.
La qualification et la revue humaine de ce candidat restent distinctes.

### Données et autorité

Le catalogue JSON privé est la référence des types, affectations et historique.
Aucune migration SQL ni conversion de compte. Enveloppe version 1, révision
optimiste, identifiants générés par le serveur, 100 types maximum, 32 applications
maximum par type, catalogue borné à 1 MiB. Historique conservé dans la limite de
500 événements et de la taille maximale ; lecture administrative des 50 derniers,
interface des dix derniers. Une révision périmée est refusée sans écrasement.

Les changements sont sérialisés avec le verrou existant de la politique d'accès.
La taille est vérifiée avant retrait d'accès ; catalogue et projection utilisent
des fichiers temporaires privés et renommages atomiques. Les comptes concernés
sont refusés avant publication. Une panne de publication ne produit pas un faux
succès : après résolution, recharger puis réenregistrer le profil ou l'affectation.
Certains comptes peuvent rester bloqués jusque-là. Cette cohérence conservatrice
n'est pas une transaction SQL globale entre fichiers.

L'autorité utilise une clé dédiée et une requête signée de trente secondes vers
le nouveau contrôleur Drupal /avereo/profiles/authorization. Il relit utilisateur,
rôles attribués et définition globale du rôle, sans créer ni modifier de rôle.
Le propriétaire est vérifié avant et après l'appel ; le rôle n'est pas accepté
depuis le navigateur ou le ticket de lancement. Contexte et usage cryptographique
sont distincts du lecteur Développements, qui reste inchangé.

Le catalogue filtre liste et lancement CONNECT. Sa projection ajoute
report_actions et access_profile à la règle privée existante. Tous les
publicateurs de période/statut/cycle de vie sont raccordés à ce filtre lorsque
le nouveau service est activé, pour conserver les restrictions du profil.
Sans affectation, fonctionnement historique inchangé. Retirer explicitement une
affectation rétablit ce fonctionnement ; désactiver un type retire ses accès.

[Contrat CONNECT](../backend/api/openapi.yaml) :
GET /profile-types, GET/POST /admin/profiles, PUT /admin/profiles/{profileId},
PUT /admin/organizations/{organizationId}/users/{userId}/profile.
Mutations avec session, autorité fraîche, CSRF, origine et révision contrôlés.
L'audit conserve auteur, date, requête, comptes concernés et états avant/après.

### Rapport

Les API vérifient à chaque requête les droits de consultation, création,
modification, suppression et export. Les écritures conservent le verrou partagé
et les contrôles de propriété. Les originaux demandent lecture ou modification
en plus de leur contrôle de propriétaire existant. Aucune exception administrateur
n'est ajoutée aux photos privées.

L'interface relit les droits au retour de focus et toutes les trente secondes.
Les champs et mutations sont désactivés en consultation, mais sections repliables,
navigation, choix de vue, zoom et consultation des photos restent utilisables.
Avec Exporter, le destinataire et les options de restitution peuvent être choisis
pour la copie locale sans autoriser une sauvegarde du dossier serveur.

La génération Word vérifie l'autorisation avant génération ; le contrôle commun
des téléchargements/partages la vérifie à nouveau avant remise du fichier.
Les fichiers déjà obtenus, le texte consulté et les données déjà présentes sur
l'appareil ne peuvent pas être rappelés. Ce mécanisme contrôle les parcours
officiels ; il n'est pas une protection contre la copie de données déjà lues,
et n'ajoute pas de moteur Word/PDF serveur.

Un défaut professionnel personnel lu pour le même compte reste prioritaire.
À défaut, le parcours de référence du profil administré, issu de l'identité
Rapport authentifiée, peut être proposé pour une nouvelle mission. Il ne change
aucun dossier existant, importé, repris ou rouvert. Les nouveaux types utilisent
les trois parcours existants ; leurs noms et droits restent dans CONNECT.

### Recette et accès

[CONNECT local](http://127.0.0.1:5202/) → Mon compte → Gérer les comptes.
[Rapport local](http://127.0.0.1:5204/fixture/) → Compte au profil administré
→ ouvrir RECETTE-PROFILS-DROITS-20261117 depuis la liste serveur.
Identités entièrement fictives ; aucun mail réel. Services/base temporaires à
requalifier après arrêt ou redémarrage.

Les preuves privées du cockpit conservent tests natifs, HTTP et navigateur,
réouverture de session, quatre tables CONNECT et dossiers/propriétaires exacts.
Le dossier de recette comprend 14 observations, quatre photos, quatre plans,
Terrain et signature. Les deux Word réels contiennent neuf médias expert et
huit client ; médias identiques à PR164 et texte conservé hors référence et date
de génération. Pas de nouvelle qualification de pagination native Word/PDF.

La préparation de la fixture conserve la réserve historique de représentation
PHP : quatre contrôles de protocole vides {} deviennent []. L'original est
conservé, seules ces quatre formes sont normalisées dans la fixture dérivée ;
les assertions d'égalité complète restent actives.

### Qualification locale du candidat actualisé

Après raccordement à main e6c6900 (transfert PR165), les apports des deux lots
sont conservés. 35 contrôles de profils, 36 de transfert, 44 CONNECT existants,
21 HTTP CONNECT et 70 HTTP Rapport/MariaDB réussissent. Les trois contrôles
supplémentaires prouvent que le profil limite aussi les destinataires d'un
transfert et que son retrait explicite rétablit l'éligibilité précédente.
Les 238 tests Node Rapport et le build en ligne réussissent ; le contrôleur
Drupal a 15 assertions sur doubles, distinctes d'une connexion native hébergée.

## Préproduction

**Différée explicitement par le responsable.** Aucun compte réel, droit natif,
configuration active, déploiement ou base hébergée modifiés par ce lot.
Les anciens paquets PR164 sont conservés et ne suffisent pas au nouveau lot,
qui ajoute le contrôleur d'autorité Drupal.

[Préparation et récupération](../workflows/profils-administration.md).
Avant livraison autorisée : qualifier les trois cibles, identifiants exacts,
rôle global frais, sauvegardes/restauration et refus sur sessions déjà ouvertes.
Les sessions natives des autres applications restent à qualifier sur leur cible ;
les essais actuels portent sur le catalogue/lancement CONNECT et les actions
Rapport. Les doubles locaux ne prouvent pas le vrai SSO ou le noyau Drupal hébergé.

## Mise en production

Non engagée et non autorisée. Fusion, livraison et ouverture restent des décisions
distinctes. Conserver versions, artefacts, contrôles, récupération et réserves
dans le suivi canonique après toute future livraison.
