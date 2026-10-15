---
project: avereo-app-passeport-immo
document_type: preproduction-report
title: Installation privée et recette restante
status: active
version: git
created: 2026-10-15
updated: 2026-10-15
owner: jpdandin
tags: [passeport-immo, connect, preproduction, recette]
---

# Installation privée et recette restante

## Cadrage

Le responsable autorise dans ce chat le raccordement, l'installation privée et
le transfert du bien de la SCI, puis confirme son compte CONNECT d'administration.
La trace de cette instruction est rattachée au candidat dans le suivi ; aucune
décision de phase, case de revue, fusion ou autorisation de production n'est créée.
Les quatre phases et leurs décisions historiques restent conservées.

L'hébergeur confirme les racines distinctes de la préproduction Passeport Immo,
de CONNECT préproduction, de CONNECT production et du site principal. Chemins
réels sans lien symbolique ; base CONNECT préproduction distincte de production.
Le [reçu d'installation](../api/preproduction-installation-observation.json)
conserve les valeurs et les observations datées, sans données du dossier client.

## Développement local

Le candidat applicatif et le delta CONNECT compatible restent ceux déjà testés
et identifiés dans le suivi. PR nº80 vérifiée ouverte en brouillon, même HEAD,
18 contrôles techniques réussis ; policy humaine ignorée sur ce brouillon.
Aucun merge réalisé par l'agent. Les douze fichiers applicatifs et les deux
fichiers du delta sont relus après transfert privé, avant remplacement.

Une [sauvegarde ciblée du catalogue et des droits](../api/connect-catalogue-recovery-observation.json)
est relue et restaurée en tables temporaires dans la base isolée : cinq
applications, cinq habilitations d'organisation et six accès individuels.
Les lignes actives sont inchangées. Cette répétition complète la récupération
des fichiers et paramètres ; elle ne constitue pas une restauration complète
de base. Le test des droits d'installation est exécuté en transaction puis annulé.

## Préproduction

Installation effectuée le 15 octobre à 07:33:53 UTC sur
<https://passeport-immo-preprod.avereo.fr/>. Le candidat apporte douze fichiers ;
le delta remplace uniquement les deux fichiers CONNECT dont les empreintes
correspondaient aux préconditions. Les autres paramètres CONNECT et sa protection
restent conservés. Le catalogue est actif pour le compte choisi ; les deux autres
comptes existants sont explicitement refusés, leurs rôles et leurs droits aux
autres applications restent identiques.

Une clé de service dédiée est générée uniquement sur le serveur et partagée entre
les deux configurations privées, en 0600. Les répertoires privés et anti-rejeu sont
en 0700. Aucune valeur de clé ou de ticket n'est exportée. La politique Apache du
candidat reçoit une configuration d'environnement Basic utilisant le fichier de
comptes visiteurs existant ; son empreinte spécifique est consignée séparément.

Les sous-dossiers publics `assets` et `connect` ont initialement hérité du masque
privé en 0700 ; le contrôle externe a détecté leur refus 403. Leurs permissions
sont corrigées explicitement en 0755. Les fichiers privés et la sauvegarde du cas
restent protégés. Le nouveau contrôle externe reçoit 401 Basic sur les six
ressources vérifiées, avec TLS valide et noindex sur Passeport Immo.

| Vérification | Résultat et portée |
|---|---|
| Fichiers applicatifs et delta | Octets relus sur le serveur : 12 et 2 fichiers conformes ; politique d'environnement séparée |
| Catalogue et droits persistés | Compte choisi autorisé ; deux autres comptes existants refusés ; autres droits conservés |
| Émetteur CONNECT et sas installés | Ticket produit et accepté en contrôle serveur, configuration privée découverte |
| Refus de tickets | Signature invalide, expiration, autre application et rejeu refusés en contrôle serveur |
| Protection HTTPS | Six contrôles anonymes conformes ; aucune identification visiteur effectuée par ces requêtes |
| Parcours réel Drupal → CONNECT → application | À recetter avec la connexion réelle du responsable |
| Bien de la SCI et documents | Copie privée reçue et relue ; import dans l'application HTTPS non réalisé |

Sources : [contrôle du code installé](../api/preproduction-post-install-observation.json)
et [contrôle HTTP](../api/preproduction-http-observation.json). Le contrôle serveur
ne remplace pas une identification OAuth ou une recette dans le navigateur.

La sauvegarde de transfert contient les métadonnées du bien, six PDF actifs et
trois archivés. Elle est en dehors du document root, en répertoire 0700 et fichiers
0600. Le ZIP applicatif ne contient aucune pièce du cas. La V1 conserve ses données
dans le navigateur et par origine : cette copie serveur ne fait pas apparaître
le bien dans l'interface. La nouvelle origine et le navigateur de recette doivent
recevoir un import explicite, puis une vérification de la persistance.

Recette à renseigner par le responsable, sans cases cochées par l'agent :

- [ ] Ouvrir CONNECT en passant la protection visiteur et l'identité habituelle.
- [ ] Vérifier la carte Passeport Immo et son ouverture avec le compte choisi.
- [ ] Vérifier le refus d'un ticket invalide après identification visiteur, puis la déconnexion.
- [ ] Retrouver le bien, six documents actifs et trois archivés sur la nouvelle origine.
- [ ] Consulter les PDF, les deux pages des coupes et vérifier classement et persistance.

Le navigateur intégré échoue actuellement à la porte visiteur. Un contrôle humain
dans Chrome est demandé ; la connexion Chrome n'est pas partagée automatiquement
avec le navigateur intégré. Cette limite empêche encore la recette et l'import
effectifs par les outils disponibles. Les sources locales et la copie serveur
sont conservées pour terminer le transfert sans perte.

## Mise en production

La production n'est ni livrée ni ouverte. En cas de retour arrière de cette
préproduction : rétablir d'abord la fermeture, restaurer les seuls fichiers et
paramètres concernés depuis la sauvegarde fraîche, puis rétablir uniquement les
ajouts de catalogue/droits encore attribuables à cette installation. Conserver
les journaux d'audit, les sources et les données récentes ; aucun écrasement
global de base ou de dossier client. Le [runbook](deployment.md) et les reçus
identifient les sauvegardes disponibles. Recette humaine et import du dossier
restent ouverts avant revue finale et préparation d'une livraison de production.
