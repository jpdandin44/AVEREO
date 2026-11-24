---
project: avereo-app-passeport-immo
document_type: deployment-and-acceptance
title: Livraison privée de la bibliothèque UX/UI
status: active
version: git
created: 2026-11-24
updated: 2026-11-24
owner: jpdandin
tags: [passeport-immo, ux-ui, preproduction, recette]
---

# Bibliothèque UX/UI — préproduction privée

## Cadrage

Le responsable demande la mise à jour de préproduction après fusion de [PR191](https://github.com/jpdandin44/AVEREO/pull/191). Le [suivi canonique](../data/suivi-ux-ui.json) et le [reçu factuel](../api/preproduction-ux-ui-observation.json) portent le périmètre exact. Les phases, décisions et preuves historiques sont conservées.

## Développement local

Source du paquet CI `f91e98cc25a7f4f906f3201286ade7f3611db7be`, SHA-256 `967407e1b86e346907ae997363b438809c8aae3f76321fe86413fe75f22771f9`, 22 fichiers. Les fichiers applicatifs sont identiques après intégration de main dans la PR puis fusion `2f5a15f65195f8a9934fdb57deffba246669c509`. La PR fusionnée passe la policy stricte avec ses quatre cases réellement cochées. Les 85 tests de l’application et la CI de ce paquet restent les preuves du [guide local](ux-ui-bibliotheque.md) ; 44 tests de préparation, packaging et garde-fous de livraison réussissent lors de la reprise.

Le [livreur UI](../workflows/release-ui-preproduction.py) réutilise le moteur existant, fixe l’archive et n’autorise que `index.html` et `assets/`. Aucun changement d’API, menu de compte commun, configuration, règle d’accès ou schéma. Les fichiers antérieurs restent conservés pour le retour arrière.

## Préproduction

**Installée le 24 novembre 2026 à 09 h 53 min 18 s, heure de Paris ; contrôles techniques réussis, recette humaine en attente.** Entrée de recette : [CONNECT — Passeport Immo](https://connect-preprod.avereo.fr/?app=passeport-immo). Cible : [Passeport Immo privé](https://passeport-immo-preprod.avereo.fr/).

Sauvegarde fraîche : quatre tables et trente fichiers privés, avec prise en charge des copies de publications Rapport. Relecture de chaque fichier et restauration des lignes dans des tables temporaires réussies ; aucun enregistrement métier modifié. Base distincte de la production vérifiée. Candidat puis retour à l’ancien code appliqués sur copie privée, avec comparaison exacte des fichiers et permissions. Le plan prévoit une page remplacée et trois nouveaux assets ; dix-huit chemins du paquet restent conservés. Production, configuration privée et cron sont comparés avant/après.

Les configurations, snapshots de base et documents restent dans la zone privée du serveur. Les tickets et cookies de recette ne sont ni consignés dans les reçus publics ni versionnés ; la copie transitoire du ticket à usage unique a été retirée du PC après consommation. Seuls les reçus non sensibles sont conservés dans le dépôt.

### Installation et vérification réelles

Le contrôle de passage réussit avant installation. Les quatre écritures prévues sont appliquées et relues ; les vingt-deux chemins du paquet sont vérifiés selon le plan, les accès et tous les chemins non listés sont conservés. Les gardes production/configuration/cron restent identiques. Aucun schéma ou endpoint n’est remplacé.

La recette HTTPS réussit **212 assertions**, avec deux sessions du compte habituel et téléchargement progressif de ses **26 documents**, dont 17 actifs et 9 archivés. Les trente fichiers privés de la sauvegarde sont identiques. L’API refuse les accès anonymes, les tickets invalides et les écritures sans CSRF ; les droits de l’autre compte déjà habilité ne donnent pas accès aux documents du propriétaire.

Dans le navigateur hébergé, les deux biens sont présents. Le bien partagé conserve ses onze actifs et son destinataire en lecture seule ; SCI conserve six actifs, trois archives et aucun partage actif. Les quatre rubriques, la conservation de recherche, les rapports privés et la section de travaux sont contrôlés. Un plan PDF réel s’affiche sur deux pages ; aucun message d’erreur console observé. L’export PDF est disponible mais n’a pas été lancé sur l’hébergement pendant cette recette. Après navigation, une nouvelle comparaison des quatre tables et des trente fichiers réussit : aucune ligne métier ni empreinte modifiée.

La capture de l’application réelle reste dans `.local/hosted-ui/bibliotheque-preproduction.jpg`, hors Git, car elle contient des informations du bien. Le [reçu](../api/preproduction-ux-ui-observation.json) conserve son empreinte, les limites et les résultats. Le contrôle navigateur utilise un ticket CONNECT normal du compte déjà habilité ; il ne prétend pas vérifier une nouvelle saisie de mot de passe Drupal ou une connexion de l’expert. Aucun e-mail ni nouveau droit créé.


### Recette du responsable après livraison

1. Ouvrir Passeport Immo depuis CONNECT et vérifier les quatre rubriques du bien : Vue d’ensemble, Documents, Rapports privés, Travaux et devis.
2. Dans chacun des deux biens, retrouver les documents et les catégories. Sélectionner un PDF pour l’aperçu, le consulter en grand, puis télécharger un fichier et une archive entière.
3. Tester recherche, filtre, dossiers repliés et Actions ; changer de rubrique puis revenir pour vérifier leur conservation. Retrouver les réglages de catégories et l’ordre existants.
4. Sur un document fictif seulement, vérifier import, confirmation, corbeille et restauration. Les archives restent entières. La reprise multi-lots est qualifiée localement ; un nouvel envoi volumineux réel n’est pas présumé testé par la livraison.
5. Ouvrir le dialogue de partage du bien voulu et lire le périmètre : documents actifs actuels/futurs, lecture seule, révocable. Le bien SCI et les copies complètes privées de Rapport conservent leurs protections.
6. Ouvrir Travaux et devis, retrouver les pièces et interventions, puis tester l’export PDF. Vérifier également la lisibilité et le clavier sur le matériel habituel.

## Mise en production

Non réalisée par cette livraison. La recette humaine hébergée du candidat, la préparation de production, la sauvegarde/restauration et l’accord propre à cette cible restent distincts. L’invitation CONNECT historique n’est ni relancée ni requalifiée par ce lot.
