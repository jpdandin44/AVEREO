---
project: avereo-app-passeport-immo
document_type: deployment-runbook
title: Installation privée de Passeport Immo
status: active
version: git
created: 2026-10-14
updated: 2026-10-15
owner: jpdandin
tags: [connect, preproduction, installation]
---

# Installation privée de Passeport Immo

## Cadrage

Cible retenue : `https://passeport-immo-preprod.avereo.fr`, document root
`/home/daje3540/passeport-immo-preprod.avereo.fr/public`. Requalifier inventaire,
permissions, TLS et protection avant écriture. Le [suivi canonique](suivi-chantier.json)
porte candidat, empreintes, preuves et accords.

## Développement local

Construire avec `npm.cmd run build` dans `frontend/`, puis
`python workflows/package-candidate.py --output CHEMIN_CANDIDAT`.
Préparer le ZIP fermé avec `prepare-preproduction.py`, options `--candidate`,
`--manifest` et un nouveau dossier `--output`. Le candidat contient HTML,
assets et cinq fichiers du sas. Les cinq textes du sas sont normalisés en LF pour
garder les mêmes octets sur Windows et Linux ; les assets Vite restent inchangés.
Le ZIP fermé remplace uniquement `.htaccess`
par `Require all denied` ; le manifeste garde l'empreinte de la politique runtime
présente dans le candidat original. Conserver les archives historiques.

## Préproduction

Le [rapport du 15 octobre](03-preproduction.md) décrit l'installation réellement
effectuée et la recette restante. Les étapes suivantes constituent la procédure
de préparation ; leurs inconnues initiales sont maintenant remplacées par les
reçus liés dans ce rapport. Ne pas réexécuter un installateur initial sur une cible
déjà peuplée : refaire inventaire, comparaison et récupération du nouvel état.

1. Vérifier PR/CI du candidat et version CONNECT réellement installée.
2. Recontrôler la [sauvegarde restaurée le 15 octobre](../api/connect-recovery-observation.json) :
   arbre Passeport Immo, deux fichiers CONNECT et configuration privée, octets et
   permissions vérifiés dans un dossier privé distinct. Les actifs sont inchangés.
   Refaire la sauvegarde si l'état a évolué. Cette preuve porte sur les fichiers ;
   préparer séparément la récupération des données avant modification du catalogue.
3. Préparer hors document root
   `/home/daje3540/.avereo/passeport-immo-preprod/config.php` (0600) et le dossier
   anti-rejeu privé. Le [modèle](../api/connect-config.example.php) contient une clé
   vide, à renseigner sur le serveur sans l'exporter.
4. Préparer la même clé et l'URL `.../connect/entry.php` dans CONNECT dédié.
   Les deux fichiers CONNECT concernés sont `src/Config.php` et `public/index.php`.
   Préserver le reste du backend, sa version et ses paramètres hébergés.
   Le préparateur `workflows/package-connect-delta.py --base-sha SHA_BASE_COMPLET`
   produit deux fichiers et les empreintes attendues avant écriture. Refuser le
   remplacement si le runtime hébergé diffère : qualifier sa version et préparer
   un delta compatible, sans remplacer aveuglément tout CONNECT.
   Le [relevé du 15 octobre](../api/connect-hosted-observation.json) correspond,
   pour ces deux fichiers seulement, à `76566ca43b3e1e03a4a465391aac2f99017517cb`.
   Depuis le sous-projet, préparer la variante ciblée avec :

   ```powershell
   python workflows/package-connect-delta.py --base-sha 76566ca43b3e1e03a4a465391aac2f99017517cb --hosted-receipt api/connect-hosted-observation.json
   ```

   Elle produit `runtime-connect-compatible.zip` et son manifeste dans
   `.local/connect-preparation/`. Trois lignes sont ajoutées au runtime historique ;
   la protection Basic et les autres fonctions restent dans leurs octets observés.
   Le reçu doit correspondre exactement aux deux blobs Git ; contexte ambigu,
   intégration déjà présente ou empreinte différente provoquent un refus.
   Relever à nouveau les empreintes immédiatement avant écriture, même si le reçu
   précédent correspond. Si CONNECT évolue entre-temps, préparer un nouveau delta.
5. Prévisualiser le [catalogue proposé](../api/connect-catalogue.json) via
   `bin/manage-catalog.php`, la configuration dédiée et un opérateur réel
   owner/admin. Aucun `--confirm`, activation ni habilitation n'est exécuté par
   cette préparation. Identifier le compte de recette et approuver son accès ciblé.
6. Présenter cible, SHA, ZIP, opérations, protection et retour arrière pour
   l'accord exact d'installation et de recette.
7. Après accord, installer le ZIP fermé, sans écraser paramètres privés ou fichiers
   hors inventaire. Vérifier 403 sur racine, HTML, assets et entrée du sas.
8. Après qualification de l'accès privé et accord applicable, activer la politique
   runtime du candidat. CONNECT conserve sa protection visiteur distincte de
   Drupal/CONNECT ; ne pas ouvrir globalement API ou points d'identité.
   Passeport Immo protège HTML et tous les assets par le sas signé : ne pas ajouter
   une seconde porte Basic sur son origine, qui redemanderait le compte visiteur.
   Conserver `ErrorDocument 403 default` pour neutraliser les pages d'erreur
   héritées et vérifier les refus depuis l'extérieur. Fixer explicitement les sous-dossiers
   publics en 0755 : un masque privé peut réduire le mode demandé à la création.
   Garder les dossiers privés en 0700 et configurations/nonces en 0600.
9. Recetter connexion, catalogue/droits, ticket, ouverture, refus, rejeu et
   déconnexion ; importer explicitement les pièces privées et tester consultation,
   classement, archives, persistance et PDF sur l'origine HTTPS.

Le cookie Secure impose HTTPS. La connexion interne du prototype reste simulée ;
elle ne prouve aucune identité métier. Les données locales ne changent pas
automatiquement d'origine et ne figurent pas dans l'archive applicative.

## Retour arrière et Mise en production

Remettre la fermeture, restaurer fichiers/permissions sauvegardés et retirer
uniquement les ajouts encore identiques au candidat. Conserver sources privées
et données navigateur. Paramètres et droits CONNECT nécessitent leur propre
sauvegarde et rétablissement ciblé. Production et ouverture restent distinctes.
