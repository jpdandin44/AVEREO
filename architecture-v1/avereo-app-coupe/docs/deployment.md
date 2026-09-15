---
project: avereo-app-coupe
document_type: procedure
title: Déploiement de Coupe en production
status: active
version: git
created: 2026-07-08
updated: 2026-09-09
owner: jpdandin
tags: [coupe, production, o2switch, rollback]
---

# Déploiement de Coupe en production

Cette procédure prépare une mise en production contrôlée de Coupe. Le merge de
la PR et le déclenchement du workflow restent deux décisions humaines
distinctes. Le lanceur Docker local ne publie rien sur O2Switch.

## Cible et périmètre

- URL publique : `https://coupe.avereo.fr/`.
- Dossier cible : document root déclaré dans cPanel pour `coupe.avereo.fr`.
- Contenu publié : le résultat de compilation `frontend/dist/`.
- Workflow : `.github/workflows/deploy-coupe-o2switch.yml` — **Deploy Coupe to O2Switch**.
- Environnement GitHub : `coupe`, déjà utilisé par ce workflow.

Le lot de la PR #54 apporte le parcours Docker local, les tests du sas CONNECT
et la sortie de l'iframe vers la déconnexion CONNECT. Il ne modifie ni CONNECT,
ni Rapport, ni leurs configurations de production. Après merge, seul le
workflow de Coupe doit donc être exécuté.

## État de référence avant déploiement

Contrôles publics relevés le 9 septembre 2026 :

- la racine de Coupe répond `303` vers `https://connect.avereo.fr/?app=coupe` ;
- `connect/entry.php` répond `403` sans ticket, comme attendu ;
- les API d'identité et de projets répondent `403` sans cookie du sas ;
- `api/health.php` indique `authConfigured: true` et
  `authMode: connect_gateway` ;
- `api/health.php` indique toutefois `databaseConfigured: false`.

Ce dernier point n'empêche pas le parcours d'accès CONNECT et l'utilisation
locale du métier, mais il empêche la sauvegarde et la réouverture des projets
en base sur la production. Si le stockage en ligne fait partie du résultat
attendu, la mise en production est **NO-GO** tant que la configuration MySQL
n'a pas été complétée dans
`/home/<CPANEL_USERNAME>/.avereo/coupe/config.php`.

## Préconditions GO / NO-GO

La production est autorisable seulement si tous les points applicables sont
validés :

1. Les contrôles techniques de la PR #54 sont verts.
2. La checklist de la PR est relue et cochée par le validateur humain.
3. La PR #54 est mergée dans `main` par le validateur humain.
4. Le SHA de `main` affiché au démarrage du workflow contient bien le merge.
5. Les secrets nécessaires existent dans l'environnement GitHub `coupe` ;
   aucune valeur secrète n'est copiée dans la PR ou dans cette procédure.
6. Le domaine, le certificat HTTPS et le document root cPanel n'ont pas changé.
7. La disponibilité du stockage en ligne est décidée explicitement :
   - `databaseConfigured: true` si les sauvegardes en ligne sont incluses ;
   - acceptation documentée du mode sans stockage si elles sont hors périmètre.
8. Une fenêtre de contrôle et une personne habilitée à restaurer la sauvegarde
   sont disponibles.

## Déclenchement manuel

1. Ouvrir **GitHub > Actions > Deploy Coupe to O2Switch**.
2. Cliquer sur **Run workflow**.
3. Choisir la branche `main`.
4. Cocher la confirmation explicite de production.
5. Lancer le workflow et vérifier le SHA affiché.
6. Surveiller successivement la compilation, les tests PHP, la résolution du
   document root cPanel, la sauvegarde, le transfert FTPS et les contrôles
   publics.
7. Conserver l'URL du run et le nom de l'artefact
   `coupe-production-before-<run_id>-<run_attempt>` dans le compte rendu de
   déploiement. L'artefact est conservé 30 jours.

Le workflow crée la sauvegarde **avant** de synchroniser le nouveau contenu. Il
ne se déclenche pas automatiquement lors d'un push ou d'un merge.

## Recette post-déploiement

### Contrôles techniques

1. `https://coupe.avereo.fr/` répond `303` vers CONNECT.
2. `https://coupe.avereo.fr/connect/entry.php` répond `403` sans ticket.
3. `/api/auth.php?action=config` et `/api/projects.php` répondent `403` sans
   cookie de sas.
4. `/api/health.php` répond `200`, avec `authConfigured: true` et
   `authMode: connect_gateway`.
5. Si le stockage est inclus, `/api/health.php` indique également
   `databaseConfigured: true`.

### Parcours fonctionnel

1. Se connecter à CONNECT avec un compte de recette autorisé pour Coupe.
2. Ouvrir Coupe depuis le catalogue et vérifier que l'interface réelle apparaît.
3. Ouvrir un projet de recette et vérifier les fonctions métier essentielles.
4. Si le stockage en ligne est inclus, sauvegarder, fermer puis rouvrir ce projet.
5. Utiliser le lien de compte dans Coupe : la fenêtre principale revient sur
   CONNECT, sans rester enfermée dans l'iframe.
6. Dans CONNECT, cliquer sur **Se déconnecter**, confirmer, puis vérifier le
   retour en session anonyme et la possibilité de changer de compte.
7. Vérifier avec un compte non habilité que Coupe reste masquée et bloquée.
8. Vérifier que Rapport et le catalogue CONNECT n'ont pas régressé.

## Retour arrière

1. Déclarer le déploiement en échec et ne pas relancer une synchronisation.
2. Télécharger l'artefact `coupe-production-before-<run_id>-<run_attempt>` du
   run concerné et en conserver une copie locale.
3. Dans cPanel, relever à nouveau le document root exact de
   `coupe.avereo.fr`. Ne jamais utiliser `/home`, `public_html` ou un chemin
   parent comme cible globale.
4. Faire une copie de sécurité du contenu défaillant.
5. Restaurer le contenu de l'artefact **uniquement** dans le document root
   vérifié de Coupe, y compris les fichiers de contrôle d'accès présents dans
   l'archive.
6. Rejouer les contrôles techniques et le parcours fonctionnel ci-dessus.
7. Consigner le run, l'heure, la cause et le résultat du rollback.

La configuration privée située hors document root n'est pas remplacée par le
workflow. Un incident de configuration MySQL ou de secret doit être traité
séparément, après sauvegarde du fichier privé concerné.

## Première configuration ou maintenance de l'hébergement

Pour un nouvel hébergement seulement :

1. créer le sous-domaine et vérifier son document root ;
2. créer la base MySQL et son utilisateur dans cPanel ;
3. attribuer à cet utilisateur les droits nécessaires sur la base Coupe ;
4. créer `/home/<CPANEL_USERNAME>/.avereo/coupe/config.php` avec les paramètres
   MySQL et le mode `connect_gateway` ;
5. définir hors document root `connect_portal_url`, `connect_launch_secret` et
   `connect_launch_nonce_directory` ;
6. appliquer la migration
   `database/migrations/001_create_coupe_projects.sql` ;
7. vérifier HTTPS, le sas CONNECT et l'état de santé de l'API.

L'application ne se connecte jamais directement à MySQL depuis le navigateur :
elle utilise les endpoints PHP `/api/projects.php`, qui accèdent à la base par
PDO côté serveur.

Voir également [la bascule CONNECT](preproduction-connect-cutover.md) et
[la procédure locale](local-development.md).
