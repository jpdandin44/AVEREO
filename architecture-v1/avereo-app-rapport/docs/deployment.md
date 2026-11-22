---
project: avereo-app-rapport
document_type: deployment-guide
title: Deploiement Rapport sur O2Switch
status: active
version: git
created: 2026-07-08
updated: 2026-11-16
owner: jpdandin
tags:
  - rapport
  - deploiement
  - o2switch
  - mysql
---

## Candidat Profils et CONNECT — non livré

Installation coordonnée future : CONNECT puis Rapport après revue et autorisation du candidat exact. Sauvegarder code/configuration et préférences privées des deux cibles, vérifier restauration et retour arrière. Le fichier compagnon du métier conserve le format de médaillon compatible avec l’ancien lecteur ; Rapport garde un choix manuel avec un ancien CONNECT. [Périmètre et contrôles](profils-professionnels.md#préproduction). La livraison PR163 ci-dessous reste historique et effective.

## 16 novembre — Livraison PR163 et alignement confirmés

Candidat validé de0edf3, fusion 9f8645b866ae4fc5e9927070b31b8d4fc9f26897 et arbre complet 85e3171 identiques. Archive eb6d1258 promue sans reconstruction : cinq fichiers, index en dernier. L’installation du candidat explicitement autorisé a précédé l’observation de la fusion ; reçu initial conservé comme historique, preuve d’alignement distincte après fusion. Sauvegarde application/configuration relue, restauration/rollback sur copie, sauvegarde privée des dossiers relue sans restauration SQL. [Cible et reçus](interventions-projet.md#préproduction).

## 16 novembre — Livraison PR162 attestée

Tests déclarés OK, quatre cases humaines cochées et fusion f4017be vérifiés ; même arbre que b04ea2b qualifié. Archive f7c8a973 promue sans reconstruction : JS principal, CSS, module Word et index HTML en dernier. Sauvegarde fraîche application/configuration relue, restauration et rollback code vérifiés sur copie ; sauvegarde privée des dossiers relue sans restauration SQL. 208 fichiers préexistants conservés, 24 dossiers/toutes colonnes/propriétaires exacts après navigation ; configuration/production et journal intacts. Composants partagés et différences de fins de ligne déjà qualifiés conservés. [Cible, reçus et limites](organisation-ecrans.md#préproduction).

## 16 novembre — Recette serveur Interventions achevée

Recette autorisée après livraison PR161, sans nouveau déploiement : deux sauvegardes du même dossier fictif, connexion normale après déconnexion complète et réouverture serveur sans brouillon. Les 23 dossiers/colonnes/propriétaires antérieurs sont exacts, 24 au total ; code/configuration/production et journal conservés. Brouillon initial restauré et relu. [Reçus, accès et limites](interventions-proposees.md#recette-complète-du-16-novembre). Les comptes de la livraison ci-dessous décrivent l’état avant cette recette.


## 16 novembre — Livraison PR161 attestée

Après tests et merge humains, source 1d8b103 et fusion 97a902c, arbre identique. Paquet 080b8213 qualifié, sans reconstruction ; quatre fichiers installés, index en dernier. Sauvegarde fraîche application/configuration relue et restauration/retour arrière code répétés sur copie, sauvegarde privée des dossiers relue sans restauration SQL. 205 fichiers préexistants conservés, 23 dossiers/colonnes/propriétaires exacts. [Cible, preuves et périmètre](interventions-proposees.md#préproduction).

## 16 novembre — Recette serveur Attentes achevée

Après la livraison de PR159, recette fonctionnelle réalisée sur un dossier fictif indépendant, sans nouveau déploiement : deux sauvegardes sur le même identifiant et réouverture serveur dans une nouvelle session, sans brouillon. Les 22 dossiers/colonnes/propriétaires antérieurs restent exacts, 23 au total ; code/configuration/production préservés. Brouillon initial restauré. [Reçus, accès de revue et limites](attentes-ecoute-client.md#recette-complète-du-16-novembre). Les comptes de dossiers de la section de livraison suivante décrivent l’état avant cette recette.

## 16 novembre — Livraison PR159 attestée

Demande explicite après tests/merge humains : source 73c4447, merge 58d6aab, même arbre. Paquet 150 fichiers qualifié, sans rebuild ; cinq fichiers livrés ensemble (api/decision-validation.php, JS/CSS/module Word/index). Contrôle de passage réussi, sauvegarde fraîche relue, restauration/rollback code répétés sur copie ; sauvegarde privée des dossiers relue, sans restauration SQL. 202 fichiers préservés, 22 dossiers et propriétaires exacts. [Cible, reçus et périmètre hébergé](attentes-ecoute-client.md#préproduction).

## 16 novembre — Préparation du complément Attentes

Candidat local uniquement. Une future livraison autorisée doit aligner l’interface et api/decision-validation.php, préserver les données existantes, qualifier sauvegarde/retour arrière et effectuer la recette CONNECT sur dossier fictif. Aucun endpoint, secret ou schéma SQL nouveau. Les vérifications HTTP/MariaDB de ce lot sont locales, elles ne remplacent pas la recette hébergée. [Parcours et critères de passage](attentes-ecoute-client.md#préproduction).


# Deploiement Rapport sur O2Switch

## Candidat en cours — 16 octobre 2026

Le [dossier de production courant](../../../outillage/acces-preproduction/preparation-production-rapport-passeport.md)
fait référence pour la suite de la PR #84 fusionnée : archive exacte, racine cPanel
confirmée, trois remplacements/deux ajouts, préservation des données et prérequis.
Le workflow manuel décrit plus bas reconstruit les assets ; il n'est pas qualifié
pour promouvoir cette archive exacte. Sauvegarde/restauration de production,
retour arrière, connexion OAuth et accord de livraison restent à qualifier.
La production sert encore l'ancienne interface au relevé du 16 octobre.

## Cible

- Sous-domaine : `https://rapport.avereo.fr`
- Contenu publie : contenu de `frontend/dist/` uniquement
- Transport : FTPS
- Configuration privee : `/home/CPANEL_USERNAME/.avereo/rapport/config.php`
- Base : `CPANEL_USERNAME_rapport`
- Utilisateur de production : `CPANEL_USERNAME_rptprod`

## Workflow

Le workflow `.github/workflows/deploy-rapport-o2switch.yml` s'execute uniquement a la demande avec `workflow_dispatch`, exige la branche `main` et une confirmation de production explicite. Un merge sur `main` ne declenche aucun deploiement. Il utilise Node.js 20.19, `npm ci`, le build Vite avec `VITE_ENABLE_ONLINE_SYNC=true`, la resolution cPanel du document root, une sauvegarde FTPS conservee 30 jours comme artefact, le deploiement FTPS et une verification du sas CONNECT.

Secrets existants attendus :

- `CPANEL_SERVER`
- `CPANEL_USERNAME`
- `CPANEL_PASSWORD` ou `CPANEL_API_TOKEN` pour la resolution du document root
- facultatifs : `O2SWITCH_FTP_SERVER`, `O2SWITCH_FTP_USER`, `O2SWITCH_FTP_PASSWORD`

Variable facultative : `O2SWITCH_FTP_PORT`.

Le workflow ne cree, ne remplace et ne journalise aucun secret.

## Preparation humaine

### Prerequis Drupal avant OAuth

Ne pas exposer les routes OAuth tant que le rapport d'etat Drupal contient une alerte de securite critique. Avant l'installation de Simple OAuth :

1. Sauvegarder la base, les fichiers publics/prives et la configuration Composer.
2. Mettre a jour Drupal core et tous les modules signales par `/admin/reports/updates` comme mises a jour de securite.
3. Executer les mises a jour de base de donnees et reconstruire les caches.
4. Configurer `trusted_host_patterns` pour `avereo.fr` et ses seuls sous-domaines effectivement utilises.
5. Desactiver le mode de developpement Twig et reactiver les caches de rendu, de page dynamique et de page.
6. Recontroler `/admin/reports/status` et le site public avant d'installer le fournisseur OAuth.

Audit du 13 juillet 2026 : Drupal core 11.2.8 et Paragraphs 8.x-1.19 sont signales comme vulnerables par l'interface d'administration. Les versions de securite affichees sont respectivement Drupal 11.4.2 et Paragraphs 8.x-1.21. Ces numeros doivent etre reverifies au moment de l'intervention Composer.

### Etape 1 - ancienne preversion sans donnees partagees

Cette etape est conservee uniquement comme historique et solution de retour
arriere. Le workflow de production courant ne construit plus la preversion
statique : il publie l'application authentifiee et son sas CONNECT.

L'ancien artefact `frontend/deploy-preview/` excluait `api/` et `auth/`. Il ne
doit plus etre utilise pour la cible securisee.

Verifier avant publication que l'accueil affiche `Preversion sans compte`, que le parcours ne propose aucune connexion AVEREO et qu'aucune requete vers `/api/auth.php` ou `/api/reports.php` n'est emise pendant la creation et l'export d'un brouillon.

### Etape 2 - ouverture de la persistance

1. Creer la base et l'utilisateur MySQL Rapport dans cPanel, puis limiter ses droits a cette base. En production, utiliser le suffixe utilisateur `rptprod` documente dans `../database/README.md`.
2. Appliquer `database/migrations/001_create_rapport_reports.sql`.
3. Creer le fichier prive depuis `backend/config.example.php`, remplacer tous les placeholders et lui donner des permissions restrictives (`600` recommande lorsque possible).
4. Activer le sous-domaine et HTTPS.
5. Configurer `auth_mode=connect_gateway`, le secret de lancement Rapport et
   le repertoire anti-rejeu selon `authentication.md`.
6. Configurer les secrets/variables GitHub sans remplacer ceux d'une autre application.
7. Faire relire et merger la PR humainement.
8. Apres le merge et les derniers controles, lancer humainement `Deploy Rapport to O2Switch` depuis GitHub Actions sur la branche `main`.

9. Configurer `connect_portal_url`, `connect_launch_secret` et
   `connect_launch_nonce_directory` hors document root.
10. Verifier que l'acces direct retourne `303` vers CONNECT, qu'un ticket signe
    ouvre Rapport et qu'un ticket rejoue retourne `403`.

## Verification

- `https://rapport.avereo.fr/` redirige vers CONNECT sans cookie de sas.
- Un lancement depuis CONNECT charge l'application.
- `https://rapport.avereo.fr/api/health.php` retourne `app: rapport`.
- `/api/auth.php?action=config` retourne `403` sans cookie de sas et expose
  `mode=connect_gateway` apres un lancement CONNECT.
- `/api/reports.php` retourne `403` sans cookie de sas.
- L'ancien chemin `/auth/callback/` retourne `303` vers la racine protegee.
- `/api/auth.php?action=me` retourne `provider=avereo_connect` sans bearer
  OAuth supplementaire.
- Une session de sas historique sans identite demande un nouveau lancement
  depuis CONNECT.
- Un utilisateur standard ne voit que ses rapports.
- Seuls les IDs presents dans `connect_admin_user_ids` peuvent administrer tous
  les rapports.

Voir `rollback.md` avant toute mise en production.
