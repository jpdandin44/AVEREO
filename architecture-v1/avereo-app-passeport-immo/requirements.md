---
project: avereo-app-passeport-immo
document_type: requirements
title: Exigences Passeport Immo
status: active
version: git
created: 2026-10-03
updated: 2026-10-16
owner: jpdandin
tags: [avereo, documentation, local]
---

# Exigences Passeport Immo

## Évolution CIL proposée — 16 octobre

Le responsable demande un plan pour proposer un CIL complet, en parallèle de la
production de la version actuelle. Le [plan d’action](docs/plan-action-cil.md)
conserve les quatorze évolutions proposées, leurs dépendances et critères, ainsi
que les douze scénarios de recette. Son cadrage, ses moyens et son calendrier restent
à valider dans une itération distincte ; ces propositions ne sont ni des fonctions
déjà livrées ni de nouveaux prérequis ajoutés au candidat autorisé par D06.

## Préparation de production après fusion du 15 octobre 2026

Conserver le candidat vérifié en préproduction et établir son équivalence avec
l'archive de `main`. Qualifier la cible de production, CONNECT, la configuration
privée, le contenu initial et la récupération avant livraison. Enregistrer la
décision de préproduction et l'accord précis de déploiement sans les déduire du merge.
Les contrôles et inconnues de ce lot sont décrits dans le
[dossier de mise en production](docs/04-mise-en-production.md).

Pour la suite après PR nº81, préparer un lot CONNECT limité aux fichiers observés
et refuser sa pose si leurs empreintes divergent. Les sauvegardes doivent accepter
l'environnement de production avec des emplacements et un bloc cron distincts,
sans modifier la tâche de préproduction. Les erreurs, tâches non identifiées,
blocs incomplets et destinations publiques restent bloquants. La qualification
locale de cet outillage n'autorise pas son installation.

Les données initiales choisies par le responsable sont celles du dossier SCI de
préproduction. Conserver le bien, le client lié, les métadonnées, les documents
actifs et les archives ; vérifier leur intégrité et leur correspondance avec le
propriétaire CONNECT de production. La reprise doit préserver les sources,
détecter doublons et conflits et attendre l'accord exact de transfert. Voir le
[plan de reprise](docs/04-mise-en-production.md#reprise-du-dossier-sci).

## Raccordement privé de production — 16 octobre

L’activation doit refuser toute dérive du candidat, des deux configurations, du
catalogue, du crontab ou de la copie SCI préparée. Limiter les droits aux membres
actuels sélectionnés, préserver les rôles et les autres applications, fermer le
site en cas d’échec et conserver les données pour inspection. Le compte famille
reste autorisé en préproduction selon le choix humain ; son isolement vis-à-vis
du dossier SCI est vérifié côté serveur. Le premier vrai succès cron est vérifié ;
la recette navigateur reste bloquée
par le service de jetons du fournisseur d’identité en maintenance. Voir
[l’activation privée](workflows/activation-production.md).

## Sauvegarde automatique demandée le 15 octobre 2026

- E25 : sauvegarder automatiquement la base applicative et tous les documents de préproduction, archives incluses.
- E26 : vérifier chaque copie, conserver trente succès et préserver le dernier en cas d’échec.
- E27 : exécuter sur l’hébergement sans dépendre du PC ; conserver les autres tâches et les sauvegardes manuelles.

Procédure et limites : [sauvegarde automatique](docs/sauvegarde-automatique.md).

## Lot serveur autorisé le 15 octobre 2026

- E20 : conserver biens, clients, tarifs et métadonnées dans une base dédiée en préproduction.
- E21 : conserver les fichiers privés sur le serveur, accessibles au propriétaire CONNECT du bien.
- E22 : retrouver le même dossier depuis plusieurs sessions, refuser les écritures périmées et les accès d’un autre compte.
- E23 : migrer les neuf documents du cas SCI sans perte des archives ni modification des octets.
- E24 : vérifier une sauvegarde des données et fichiers avant activation ; garder les données locales et les sources.

La description [du lot g](docs/stockage-serveur.md) complète les exigences locales historiques.

## Accès continu demandé le 15 octobre 2026

- E24 : après la porte visiteur de CONNECT et l'identification habituelle,
  ouvrir Passeport Immo selon les droits CONNECT sans nouvelle saisie du mot de passe.
- E25 : protéger aussi les assets de Passeport Immo par la session signée ;
  refuser leur lecture anonyme ou avec un cookie altéré avant de retirer sa porte Basic redondante.

Cette correction de préproduction ne crée pas d'identité métier dans le prototype.
Le compte de démonstration interne et le stockage par navigateur restent documentés.

## Préparation CONNECT demandée le 14 octobre 2026

- E20 : protéger le HTML et les routes SPA par le sas existant, refuser tickets
  absents, altérés, expirés, d'une autre application ou rejoués.
- E21 : déclarer les clés de lancement dans CONNECT sans accorder de droit implicite.
- E22 : garder paramètres privés et documents hors archive ; fermer le ZIP initial,
  vérifier restauration locale et préparer la recette/récupération hébergée.
- E23 : préserver les cinq livrables et décisions approuvés, ainsi que le parcours
  local du prototype ; documenter l'absence d'identité métier dans son interface.

Le [rapport de raccordement](docs/02-integration-connect.md) décrit l'écart f
autorisé par cette demande et les critères qui restent à qualifier sur le serveur.

## Fonctionnelles
- E01 : conserver création, édition, suppression et consultation des biens.
- E02 : conserver composition, pièces, interventions et trois gammes de chiffrage.
- E03 : conserver pièces jointes, PDF et partage avec leurs limites historiques.
- E04 : conserver édition du catalogue et import CSV.
- E05 : conserver connexion/abonnement simulés et persistance locale.

## Techniques et contraintes
Parité selon [la matrice](docs/00-etat-des-lieux.md). Les changements initiaux de
reprise V4 sont renommage/clés, remplacement CDN/Tailwind et extraction des calculs.
Tout correctif supplémentaire requiert une justification et une autorisation.
Pas de donnée personnelle réelle dans les tests ; domaine `example.test`.
Le lot initial était local. La demande suivante autorise son raccordement GitHub/cockpit
et la correction de pagination PDF, sans intégrer CONNECT ni déployer.

## Inconnues
Le compte de production `dandin` et son appartenance active sont relus et le responsable
confirme ce destinataire. Le domaine fermé, HTTPS, la base et son utilisateur dédié
sont créés ; l’inventaire SCI est actualisé à neuf documents. Le mécanisme de reprise
ciblée est qualifié sur données fictives et reste à exécuter sur le dossier réel.
Le stockage privé est initialisé mais désactivé, quatre tables vides et cinq droits
utiles vérifiés. TBD : installation et recette authentifiée de la cible, export stabilisé et transfert
réel du dossier SCI, volumétrie et objectifs de récupération en production,
qualification de sauvegarde/retour arrière et suppression future du frontend historique.
Le stockage partagé et l'identité CONNECT sont réalisés en préproduction dans le
lot serveur du 15 octobre ; les questions historiques Q01… restent conservées dans le suivi.

## Exigences de l'itération initiale du 3 octobre 2026
- E06 : supprimer la page blanche finale du PDF court sans perdre un pixel de contenu
  et conserver les documents de deux ou trois pages ; quatre tests de régression.
- E07 : rattacher PR, candidat, preuves, blocages et prochaine action au suivi existant.
- E08 : appliquer le contrôleur du skill installé ; conserver les décisions antérieures.
- E09 : qualifier la cible réelle et l'accord exact avant un passage distant.
La correction PDF d est le seul nouvel écart fonctionnel autorisé dans cette itération.

## Préparation de préproduction après fusion du suivi

La demande de continuation du 2026-10-03 permet de préparer le lot local suivant.
E10 : conserver le candidat identifié et refuser une archive ou un manifeste différents.
E11 : préparer une fermeture initiale et vérifier sa prise en compte sur la cible réelle.
E12 : distinguer récupération locale, récupération hébergée et accord d'installation.
Les inconnues de cible et d'accès restent bloquantes ; le choix d'une préproduction
ne constitue pas un accord de livraison distante.

## Lot documents demandé le 14 octobre 2026

- E13 : associer un client existant ou nouveau au bien ; un client peut posséder plusieurs biens.
- E14 : importer fichiers/dossier local, classer, renommer, rechercher et consulter les documents du bien.
- E15 : conserver les Blob sur le PC, dédoublonner par contenu et protéger les lots invalides/concurrents.
- E16 : archiver/restaurer sans suppression définitive ; garder les fichiers sources et anciennes pièces jointes.
- E17 : retourner les scans dans le dossier fourni et conserver les originaux ; signaler les références divergentes.
- E18 : maintenir un statut sourcé face aux 14 fonctionnalités ExamIn, sans convertir leurs anciennes recettes en validations actuelles.
- E19 : préparer dans Coupe une comparaison avant/après à partir des plans fournis, distinguer cotes et hypothèses, puis intégrer le PDF au dossier du bien.

L’écart e est autorisé par cette demande. L’initiale conservation stricte concerne
le reste du prototype ; le stockage serveur, l’identité réelle, les droits et le
partage sécurisé restent hors de ce lot local.
