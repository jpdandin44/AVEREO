---
project: avereo-connect
document_type: workflow
title: Préparer et récupérer l'administration des profils communs
status: active
version: git
created: 2026-11-17
updated: 2026-11-17
owner: jpdandin
tags: [connect, profils, droits, configuration, recuperation]
---

# Administration des profils communs

## Cadrage

Le [contrat fonctionnel](../docs/profils-et-droits.md) est la référence du lot.
Le responsable demande de terminer le nouveau lot avant sa préproduction.
Cette procédure prépare une livraison future, elle n'en constitue ni l'accord
ni la preuve. Reprendre les cibles, versions et décisions du cockpit.

## Développement local

Entrées : compte CONNECT actif, session, CSRF, définition ou affectation,
révision du catalogue et requête d'autorité signée. Sorties : catalogue privé,
historique et projection de droits ; aucun rôle ou compte Drupal écrit.

### Configuration privée requise pour activation future

- CONNECT : chemin PROFILES_PRIVATE_CONFIG dans la configuration privée existante,
  reconnu par le lanceur ; fichier PHP selon le [modèle désactivé](templates/profiles.private.example.php).
  Ne pas renseigner ce chemin tant que l'ensemble n'est pas qualifié.
- owner_connect_id : entier de l'identité propriétaire exacte ; ne pas le déduire
  d'une adresse ou d'un nom. La preuve de rôle Drupal est distincte.
- catalogue_file : chemin absolu privé du catalogue, hors de toutes les racines web,
  répertoire réservé à l'opérateur et fichiers 0600. Le fichier doit exister ;
  aucune initialisation automatique par GET.
- identity_issuer et identity_url : même fournisseur que l'OAuth CONNECT, HTTPS,
  chemin exact /avereo/profiles/authorization, aucun utilisateur/query/fragment.
- identity_key : nouvelle clé dédiée d'au moins 32 octets, différente des clés
  de lancement, OAuth, activation et suppression. Aucune valeur dans le dépôt.
- Identité Drupal : Settings::get('avereo_profiles_authority') avec enabled,
  secret, issuer et owner_subject exact. Le contrôleur relit rôle attribué et
  définition globale actuelle, sans ajouter de rôle. Cache/nonces natifs privés.
- TRIAL_ACCESS_POLICY_FILE reste la politique privée déjà partagée ; Rapport
  la retrouve via connect_trial_access_file. Ne pas créer une seconde politique
  indépendante qui ne recevrait pas les révocations.

L'initialiseur CLI est
backend/bin/initialize-profiles.php --catalogue-file CHEMIN_PRIVE --document-root RACINE_PUBLIQUE.
Il exige les deux chemins, refuse le stockage public et un fichier existant,
crée trois types sans droit et sans affectation. Le répertoire privé doit être
préparé et qualifié par l'opérateur ; la commande ne crée aucun compte ou secret.
Un fichier partiellement initialisé après erreur doit être examiné avant activation.

### Reprendre la recette fictive

Le serveur de revue CONNECT est lancé par backend/tests/profiles-http.py --serve
--port 5202 --receipt CHEMIN_RECU_PRIVE. Il réutilise PHP et SQLite existants ;
sous Windows, le script sélectionne explicitement les extensions installées.
Toutes les identités sont synthétiques, aucun mail n'est transmis.

La recette Rapport tests/report-files-http.py --serve --port 5204 utilise une
image MariaDB déjà présente, sans téléchargement, et une base temporaire dédiée.
Les options --connect-profile-db et --profile-admin-url raccordent la seule
fixture locale protégée. La fixture complète et les reçus sont dans l'archive
privée rapport-profils-admin-20261117. Les sources ne contiennent aucun ticket,
secret de session, mot de passe ou identifiant réel.

Les pages locales et processus sont temporaires. Après redémarrage, requalifier
les accès et recréer les cas fictifs au besoin ; ne pas annoncer conservé un
ancien identifiant dans une base recréée. Ne pas utiliser de dossier réel.

## Préproduction

Différée. Après accord sur le candidat exact :

1. Qualifier CONNECT, Identité Drupal et Rapport, leurs racines et configurations.
   Lire les versions réelles et identifier le propriétaire CONNECT et son sujet
   Drupal exact ; vérifier son rôle natif actuel sans changer de rôle.
2. Sauvegarder fichiers/configurations, catalogue/préférences/politique et données
   applicatives ; tester la restauration sur copies avant écriture.
3. Installer les contrôles Rapport et l'autorité Drupal avant activation des
   nouvelles affectations CONNECT. L'autorité reste désactivée tant que son
   paramétrage, les nonces et les refus ne sont pas qualifiés.
4. Installer CONNECT sans activer le chemin privé. Initialiser et qualifier le
   catalogue sans affectation, puis activer les paramètres cohérents en dernier.
   Le paquet PR164 seul ne contient pas ce nouveau lot à trois composants.
5. Recetter le seul compte global pour le catalogue et des comptes fictifs pour
   les droits. Tester accès autorisés/refusés, anciennes sessions, application,
   action, propriété, sauvegarde/nouvelle session, Word expert/client et origine.
   Comparer données/propriétaires et paramètres avant/après ; préserver brouillons.

### Incident et récupération

Une erreur de publication maintient le refus préalable des comptes concernés.
Après résolution du stockage : recharger le catalogue, puis réenregistrer le
profil ou l'affectation ; la révision empêche l'écrasement d'un état plus récent.
Ne pas annoncer une sauvegarde réussie sur la seule présence d'un horodatage.

Le retour d'un code ancien peut ignorer les cinq actions ou republier une règle
sans ses restrictions. **Ne pas restaurer seulement CONNECT ou Rapport ancien
tant que des profils restent affectés.** Inventorier les changements et refus
depuis la sauvegarde, préserver les protections récentes et garder les mutations
en maintenance si leur conservation ne peut être prouvée. Restaurer une cohorte
et des données/configurations compatibles après qualification et décision.
Retirer des affectations est une réattribution de droits antérieurs, à décider
explicitement, pas une opération automatique de récupération.

## Mise en production

Non engagée et non autorisée. Revue humaine, fusion, livraison et ouverture restent
distinctes. Après toute livraison future, conserver le reçu, versions exactes,
contrôles après installation, sauvegardes/récupération et réserves dans le cockpit.
