---
project: avereo-connect
document_type: decisions
title: Décisions techniques CONNECT
status: active
version: git
created: 2026-10-14
updated: 2026-11-24
owner: jpdandin
tags: [connect, documentation, preproduction]
---

## 2026-11-24 — Un droit de création, sans quatrième profil métier

Le responsable propose un profil Expert technique ou un droit spécifique, puis confirme la création seulement avec conservation des anciens dossiers. Choix : droit explicite par compte dans le catalogue privé existant, administré depuis CONNECT. Raisons : ne pas confondre profession et autorisation, conserver les trois parcours professionnels globaux, éviter une liste manuelle côté Rapport. Conséquences : pas d’accès technique implicite pour un administrateur, ni d’attribution automatique ; livraison CONNECT/Rapport coordonnée à qualifier. [Contrat](docs/profils-et-droits.md#droit-de-création-rapport-technique--complément-du-24-novembre).

## 24 novembre — Lancement d'AVEREO Vision

Contexte : l'application AVEREO Vision (`architecture-v1/avereo-app-vision`) s'authentifie par ticket CONNECT, comme Rapport.
Décision : ajouter ses clés de lancement à la configuration existante et réutiliser le sas commun, sans changer les autorisations du portail.
Raison : conserver le mécanisme HMAC et les contrôles métier des autres applications.
Conséquences : l'entrée du catalogue (table `applications`, commande `bin/manage-catalog.php`), la configuration privée hébergée (URL d'entrée, secret distinct par environnement), le compte de recette et l'habilitation restent à faire avec l'accord du responsable. Les accords humains restent dans les suivis canoniques.

## 17 novembre — Catalogue commun administré et métier déclaré distincts

Contexte : demande de types libres avec applications et actions Rapport,
puis confirmation d'un catalogue commun géré par le compte global.
Décision : une affectation administrative par compte, distincte du métier
personnel ; autorité native fraîche avec clé/usage dédiés. Les attributions
existantes restent un plafond, sans conversion automatique. Catalogue privé
atomique et projection sous le verrou d'accès existant, sans migration de
comptes. Conséquences : désactivation/révocation réévaluées, perte du catalogue
refusée et récupération coordonnée nécessaire ; aucun rôle Drupal ajouté.
[Choix, fonctionnement et limites](docs/profils-et-droits.md).
## 16 novembre — Fichier compagnon pour le métier déclaré

Contexte : ajout du profil de connexion demandé dans le même lot que les profils Rapport. Décision : réutiliser la route privée des préférences et conserver le métier dans un fichier compagnon par compte. Raisons : aucune migration de compte/SQL, ancien lecteur de médaillon compatible après rollback, une mutation atomique indépendante par préférence. Conséquences : défaut unique personnel, pas par organisation ; aucun droit acquis ; une nouvelle mission copie ensuite le choix. [Contrat et limites](../avereo-app-rapport/docs/profils-professionnels.md).

## 7 novembre — pont et stockage, état local courant

Contexte : `owner` d'organisation ne prouve pas le rôle global. Décision locale : autorité Drupal dédiée, décision HMAC brève liée à un défi, deux clés distinctes et relecture par requête ; ticket de lancement inchangé. Raisons : révocation à la prochaine requête et défaut fermé sans affecter les autres applications. Conséquences : routes opt-in, paramètres privés séparés, pas de connexion réelle installée. [Contrat](api/developments-authorization.md).


## 4 novembre 2026 — Applications indépendantes de la durée

À la demande du responsable, toutes les applications disponibles sont sélectionnables en temporaire. Les dates enregistrées demeurent inchangées lors d’une attribution. La décision initiale de limiter l’essai à Rapport/RGA est remplacée ; son historique ci-dessous est conservé. Conséquence : qualifier le contrôle de période dans chaque sas et livrer les protections avant CONNECT. [Portée](docs/acces-temporaires-applications.md).

## 2026-11-04 — Conservation et reprise de la suppression

Les dossiers Rapport sont conservés par défaut sous leur identifiant propriétaire. La suppression s’effectue après révocation et reste reprenable avec un choix verrouillé. Ce découpage évite de réactiver un compte lors d’un incident entre les bases et protège les dossiers associés à une autre identité. [Détails](docs/administration-comptes.md#cycle-de-vie-des-comptes--candidat-du-4-novembre).


## 2026-11-03 — Résoudre l’e-mail avant la validation native

Contexte : le profil CONNECT et le login Drupal technique sont distincts, et le formulaire natif ne retrouve pas un compte par e-mail. Décision : normaliser uniquement le champ identifiant du formulaire avant les validateurs existants, sans remplacer le service d’authentification. Pour le compte demandé, ajuster le nom natif via une opération privée ciblée, après collision et sauvegarde. Raisons : conserver mot de passe, anti-bruteforce, statut, UID/UUID et droits ; éviter un registre d’alias supplémentaire. Conséquences : aucun alias automatique depuis tous les noms affichés, refus des collisions et retour arrière portant sur le seul nom. Le provisionnement utilise la langue par défaut installée. [Détail](docs/connexion-identifiant-email.md).

## 2026-11-03 — Réutiliser le reset natif Drupal

Contexte : l’administration n’expose que l’invitation initiale. Décision : une action distincte pour les comptes initialisés, via le pont signé existant et le mail natif Drupal. Raisons : éviter un deuxième système de jetons et conserver le mot de passe chez l’identité. Conséquences : quota et envoi audité, aucune migration ni prolongation des droits ; recette hébergée séparée. [Détail](docs/reinitialisation-mot-de-passe.md).


## 2026-11-03 — Droits explicites et invitation séparée (implémenté localement)

Les nouveaux comptes créés depuis l'administration reçoivent le rôle membre et une liste explicite d'applications ; l'héritage reste inchangé pour les comptes historiques. La création ne déclenche pas de mail. Le fournisseur d'identité garde le mot de passe et le formulaire d'activation. La période est conservée dans CONNECT puis projetée dans un fichier privé partagé par les sas Rapport/RGA ; un échec de synchronisation reste fermé. Conséquence : l'essai temporaire de cette première version est limité aux deux applications dont les sessions ouvertes sont contrôlées. Ce choix ne vaut ni revue humaine ni livraison. [Périmètre et preuves](docs/administration-comptes.md).


## 2026-11-02 — Droits RGA indépendants

Contexte : après la première livraison du raccourci, le responsable demande une véritable application distincte et confirme la reprise initiale des droits de Rapport. Décision : utiliser le catalogue et les contrôles natifs de CONNECT ; copier une fois les habilitations et accès individuels, puis ne plus synchroniser. Raison : gérer RGA par compte dans l’administration existante. Conséquences : configuration privée, ticket et cookie dédiés ; contrôle de RGA également dans Rapport. [Contrat commun](../avereo-app-rapport/api/rga.md).


# Décisions techniques CONNECT

## 2026-10-14 — Lancement Passeport Immo

Contexte : préparation du raccordement après le lot documentaire approuvé.
Décision : ajouter ses clés de lancement à la configuration existante et réutiliser
le sas commun, sans changer les autorisations du portail ni créer de catalogue.
Raison : conserver le mécanisme HMAC et les contrôles métier des autres applications.
Conséquence : configuration, compte de recette et habilitation hébergés restent à qualifier.
Les accords humains restent dans les suivis canoniques, sans copie ici.

## 2026-11-04 — Distinguer compte CONNECT et identité native

Les comptes historiques peuvent utiliser une identité Drupal qui préexistait à CONNECT. Lors d’une suppression CONNECT, le pont préserve cette identité et ses rôles. Le contrôle UID/adresse protège la correspondance et la réponse du pont indique l’issue réelle. La confirmation distingue la conservation des dossiers Rapport et celle des données des autres applications. [Parcours et déploiement](docs/administration-comptes.md#alignement-des-comptes-non-propriétaires--candidat-local).

## 2026-11-06 — Réutiliser la déconnexion après activation

Contexte : la confirmation valide le compte ciblé mais conservait l’identité du navigateur. Décision : fermer cette session après confirmation et utiliser le pont signé existant, puis demander la connexion personnelle. Le mot de passe reste uniquement dans Drupal ; aucune modification de secrets ou de liste de retours. [Preuves et conséquences](docs/retour-activation-connexion.md).
