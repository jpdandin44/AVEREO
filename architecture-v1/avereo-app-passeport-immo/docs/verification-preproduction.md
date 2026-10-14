---
project: avereo-app-passeport-immo
document_type: preproduction-verification
title: Vérification des prérequis CONNECT et de préproduction
status: active
version: git
created: 2026-10-14
updated: 2026-10-14
owner: jpdandin
tags: [passeport-immo, connect, preproduction, sauvegarde]
---

# Vérification des prérequis de préproduction

## Vérification du raccordement après déclaration CONNECT en préproduction

La nouvelle demande du responsable autorise la préparation du sas Passeport Immo.
Le contrôle anonyme courant confirme CONNECT protégé (401 Basic) et Passeport Immo
fermé (403), avec validation TLS. La session cPanel de ce chat affiche un cookie
expiré ; version active, catalogue, paramètres et droits restent à recontrôler
après reconnexion. La déclaration du responsable est conservée comme contexte.

Le [raccordement local](02-integration-connect.md) est désormais implémenté :
15 assertions de contrat, 18 assertions HTTP sur Apache isolé, 38 tests backend,
26 tests frontend, 15 tests Python et parité réussis. Le build ajoute cinq fichiers
de sas aux sept assets. Catalogue proposé en brouillon sans grant, configuration
privée non emballée et ZIP de préproduction initialement fermé. Les opérations
et préconditions de version sont dans le [runbook](deployment.md).

Les observations ci-dessous décrivent la préparation antérieure de CONNECT et
du candidat documentaire. Le bloc canonique porte l'état courant et ses versions.

La demande du responsable porte sur la préparation de CONNECT, sa sauvegarde de
base et sa migration d’activation, puis les vérifications permettant de finaliser
Passeport Immo. Le [suivi vivant du clone de travail](suivi-chantier.json), bloc
`developmentWorkflow.preproductionVerification`, porte les preuves et blocages de
cette vérification sur le poste. Les décisions de revue locales et les changements
antérieurs du moteur Projet restent conservés dans ce clone ; la PR de préparation
CONNECT publie uniquement ce rapport et l’option de destination du préparateur.
Les décisions humaines et la revue du lot documents/coupes
restent distinctes du passage hébergé.

## Cadrage

La PR nº78 est fusionnée ; le candidat documentaire de sept assets reste celui
du suivi. La préproduction dédiée et son HTTPS ont été préparés antérieurement.
Les requêtes anonymes du 14 octobre reçoivent 403 sur la racine, `index.html` et
`connect/entry.php`. Ce refus constate la fermeture actuelle ; il ne démontre
ni présence du sas, ni installation de l’application, ni accès privé utilisable.

## Développement local

Le chemin par défaut `.local/candidate.zip` désigne encore l’ancien prototype.
La préparation le refuse correctement car son manifeste ne correspond pas au
candidat courant. L’archive CI du lot documentaire et son manifeste ont été
retrouvés dans `.local/documents-cadrage/ci-candidate/`, contrôlés par empreinte,
puis préparés dans un dossier distinct, sans écraser les archives historiques :

```powershell
python workflows/prepare-preproduction.py --candidate .local/documents-cadrage/ci-candidate/candidate.zip --manifest .local/documents-cadrage/ci-candidate/candidate.manifest.json --output .local/preproduction-preparation/documents-20261014
```

Le ZIP fermé conserve les sept assets. Le manifeste, la relecture du ZIP et la
répétition locale de restauration des fichiers sont contrôlés. Les onze tests
Python, la parité a/b/c/d/e et le contrat du cockpit passent. Ces preuves ne
qualifient pas une récupération hébergée ou une recette du dossier privé.

## Préproduction

| Prérequis | Constat | Condition restante |
|---|---|---|
| Candidat documentaire | Archive courante identifiée et préparation fermée vérifiée | Promouvoir ces mêmes octets après accord exact |
| CONNECT préproduction | Porte Basic active ; sauvegarde réelle restaurée sur base distincte, migration répétée sur ce clone | Mise à jour du pont Drupal et configuration d’activation, accords exacts et recette hébergée à qualifier |
| Sas Passeport Immo | Aucun récepteur ni règle de protection applicative dans le frontend courant | Préparer et tester le contrat de ticket et l’accès sans ticket refusé |
| Catalogue et habilitation | Le catalogue/les variables CONNECT actuels portent les six autres applications | Ajouter Passeport Immo dans un lot autorisé et tester ses droits |
| Paramètres privés | Aucun secret de lancement Passeport Immo installé par cette préparation | Qualifier les deux extrémités et faire saisir les nouveaux secrets hors Git |
| Consultation privée | Fermeture totale observée | Définir puis vérifier l’accès privé du responsable, sans ouvrir publiquement le frontend |
| Isolement et récupération | Cible dédiée connue ; dernière vacuité et récupération datées/incomplètes | Relever son état actuel, sauvegarder et répéter le retour arrière sur cette cible |
| Accord d’installation | Aucun accord portant sur cette cible et ce ZIP | Présenter l’artefact, l’effet et les preuves puis obtenir l’accord exact |
| Recette réelle | Dossier et coupes testés sur l’origine locale | Tester connexion, droits, import/lecture, persistance et PDF sur l’origine HTTPS privée |

La migration d’activation CONNECT ne crée pas le sas ou l’entrée de catalogue de
Passeport Immo. La préparation conserve l’application statique ; elle n’ajoute
ni backend de documents ni stockage partagé. Les données IndexedDB/localStorage
du navigateur local sont liées à cette origine et ne sont pas transférées
automatiquement sur la nouvelle adresse. Conserver les sources privées et prévoir
un import de recette explicite, sans les inclure dans le ZIP applicatif.

Le contrôleur de passage reste en refus tant que les preuves manquent. Les
vérifications de fichiers et la fusion GitHub ne constituent pas un accord de
déploiement ni une validation de la recette HTTPS.

## Mise en production

Aucune livraison ni ouverture n’est incluse. La prochaine action est la
qualification du lot CONNECT et du contrat Passeport Immo, puis un accord exact
de préproduction sur un artefact complet et récupérable.
