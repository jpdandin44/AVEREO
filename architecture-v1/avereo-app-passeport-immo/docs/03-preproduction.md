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

## Recette humaine courante

Utiliser [le guide de recette de la PR nº80](recette-preproduction.md) pour les
livrables et les huit critères du cockpit. La phase est remise à la revue technique
« À valider » à la demande du responsable, sans nouvelle décision humaine enregistrée.
Les sections datées ci-dessous conservent les étapes successives : les limites
de stockage navigateur de l'installation initiale sont remplacées par le lot serveur.

## Nouveau lot de stockage

Le stockage par navigateur constaté dans la recette suivante est remplacé par
un [lot serveur installé et vérifié](stockage-serveur.md). Le
[reçu courant](../api/storage-observation.json) établit seize fichiers publics relus,
base dédiée et neuf documents partagés, 34 assertions HTTPS et deux sessions
indépendantes. Le navigateur intégré confirme import dédoublonné, modification
de métadonnées, PDF, téléchargement et persistance après rechargement. Les constats
SSO et déclarations humaines ci-dessous restent historiques. La revue humaine de
préproduction, la fusion et la production sont toujours distinctes.

## Historique — correction de la troisième identification avant stockage serveur

Le responsable confirme l'ouverture de Passeport Immo depuis CONNECT dans Chrome.
Cette déclaration établit un premier parcours humain ; elle ne vaut pas validation
de tous les critères. La troisième fenêtre identifiant/mot de passe provient de
la protection Basic propre au sous-domaine Passeport Immo.

Le [correctif installé](02-integration-connect.md) protège tous les assets avec la
session signée du sas. Il permet de retirer la porte Basic redondante uniquement
sur Passeport Immo ; la porte visiteur CONNECT et les habilitations restent en place.
Le [reçu courant](../api/preproduction-sso-observation.json) identifie le candidat,
ses neuf contrôles CI, les sauvegardes des seuls fichiers concernés et les douze
contrôles HTTPS : CONNECT 401 Basic, HTML 303 vers CONNECT, assets/ticket invalide
et script interne 403 sans demande Basic. Les douze fichiers installés sont relus.
La page 403 héritée de l'hébergement a été reproduite localement puis neutralisée.

La recette dans le navigateur intégré utilise un ticket normal du composant
CONNECT installé, après vérification des droits du compte choisi et du refus
des deux autres comptes. Aucun nouveau droit ou secret n'est ajouté. HTML,
styles, scripts, worker PDF et les deux pages des coupes se chargent. L'identité
OAuth n'est pas rejouée dans ce navigateur : sa porte visiteur CONNECT restait
inutilisable par les outils. Le responsable avait confirmé le parcours dans Chrome
avant correction ; il confirme ensuite que la troisième fenêtre a disparu dans
Chrome. Cette déclaration porte sur l'ouverture, sans recette complète de déconnexion. Le bouton
interne « Se connecter » demeure celui du prototype de démonstration, sans champ
identifiant/mot de passe et sans identité métier synchronisée.

Le bien de la SCI est importé sur l'origine HTTPS dans le navigateur intégré :
association du client, références confirmées, six documents actifs et trois
archives, titres et catégories repris. Après réouverture, le bien et les neuf
documents sont conservés. Les neuf téléchargements ont le même SHA-256 que les
fichiers sources ; les deux pages des coupes s'affichent. Les dates d'import dans
la nouvelle interface sont celles du 15 octobre ; les métadonnées historiques
restent dans le manifeste privé. **Ce dossier n'est pas synchronisé avec Chrome.**
La copie privée du serveur est conservée ; aucun backend documentaire n'est ajouté.

Les sections suivantes décrivent l'installation initiale et ses limites à cette
date. Elles ne remplacent pas l'état courant ci-dessus. Les cases humaines restent
au responsable et aucune validation de phase ou de production n'est déduite.

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

## Préproduction — installation initiale avant stockage serveur

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
