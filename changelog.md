---
project: avereo
document_type: changelog
title: Changelog du dépôt AVEREO
status: active
version: git
created: 2026-10-03
updated: 2026-10-16
owner: jpdandin
tags: [avereo, documentation, local]
---

# Changelog du dépôt AVEREO

## 2026-10-16 — Préparation de production après les PR #83 et #84

Fusions et attestations humaines relues. Le [dossier commun](outillage/acces-preproduction/preparation-production-rapport-passeport.md)
prépare la livraison exacte de Rapport, constate Passeport Immo déjà activé et son
cron réel réussi, puis identifie le blocage OAuth restant. Reçus, opérations,
contrôles de passage et suivi canonique alignés. Les décisions existantes et les
travaux Passeport Immo/Projet menés dans leur copie propre sont conservés.

## 2026-10-16 — Rapport et Passeport Immo en préproduction

Rapport est livré avec Expertise & Visite technique et Visite Globale. Passeport Immo conserve son candidat actuel, déjà installé. La [recette ciblée](outillage/acces-preproduction/livraison-rapport-passeport.md) documente sauvegardes restaurées en privé, contrôle des fichiers, parcours authentifiés et candidats exacts. La divergence avec un ancien relevé de droits CONNECT est résolue par confirmation humaine : le compte famille conserve Rapport et Passeport Immo en préproduction. Réserve levée dans la PR #84 et les suivis ; aucune habilitation ni production modifiée. Les observations antérieures et les validations de phase sont conservées.


## 2026-10-15 — Résolution des conflits de la PR #80

Intégration de `main` au commit `db7858ff110f5ceb954079532257d6619ca28e0c`
dans la branche de la PR #80. Le rapport Passeport Immo conserve ses observations
plus récentes et le journal conserve les entrées des deux branches. Les apports
CONNECT de la PR #79 restent intacts ; aucun fichier exécutable de Passeport Immo
ne change par rapport à la tête précédente de la PR. La résolution ne constitue
ni la fusion de la PR dans `main`, ni une nouvelle qualification hébergée.

## 2026-10-15 — Environnement de validation des PR

Le modèle de PR nomme la phase et l'environnement réellement soumis à validation :
local pour les phases 0 et 1, préproduction pour les phases 2 et 3. La livraison et
les contrôles après livraison de phase 3 concernent toujours la production.
La première case désigne l'environnement de validation. Pour la PR #80, la cible est la
préproduction privée de Passeport Immo, accessible depuis CONNECT. Les quatre
attestations humaines et le vérificateur strict restent conservés ; les essais
locaux ne constituent pas une validation de cette cible. Le contrôle lit les libellés
du modèle ; son implémentation et les workflows de déploiement restent inchangés.

## 2026-10-14 — Préparation CONNECT et activation

Ajout du [lot de préparation CONNECT](outillage/acces-preproduction/preparer-connect-activation.md),
du ZIP reproductible issu des blobs de main, du helper de sauvegarde privée et
de la restauration sur base de test distincte. Tests de refus, répétition MariaDB
et CI sans accès distant préparés. Le suivi et ses vues distinguent préparation,
sauvegarde réellement exécutée, migration et livraison après accord exact.
Vérification du candidat documentaire Passeport Immo et de ses prérequis,
sans installation ni création de compte, secret ou validation humaine.

## 2026-10-03
Ajout du socle documentaire racine manquant sous forme d’index et du chantier local
[Passeport Immo](architecture-v1/avereo-app-passeport-immo/changelog.md).
Les évolutions historiques des autres applications ne sont pas reconstruites ici.

Ajout du [socle transverse GitHub et cockpit](outillage/protocole-developpement/README.md),
des skills `dev` et `developpement-github-cockpit`, de leur installateur utilisateur
et des contrôles ciblés. Les applications et déploiements restent sous leurs lots propres.

## 2026-10-06

Reprise de la PR #76 : inventaire cPanel de onze préproductions, confirmation du
filtrage IP de CONNECT et préparation privée de son remplacement par Basic sur
HTTPS. Raccordement du lot au cockpit avec conservation du suivi initial, et
contrôles d’accès portables sur Windows. Pilote CONNECT appliqué après accord direct,
avec sauvegarde privée vérifiée, contrôle HTTPS 401/Basic et refus HTTP 403 sans
challenge. Accès avec le bon compte et recette métier en attente ; aucune modification
de production. Voir le [relevé](outillage/acces-preproduction/releve-heberge.md).

Après fusion de la PR #76, diagnostic en lecture seule de l’échec de connexion
sur le fournisseur d’identité de préproduction. Le suivi identifie une installation
Simple OAuth incomplète, avec deux bibliothèques PHP absentes ; la recette reste
bloquée avant le lancement des applications. Aucune réparation distante ni
modification des comptes ou secrets effectuée pendant ce diagnostic.

Réparation demandée puis appliquée au seul serveur d’identité : contrat Composer
exact conservé dans Git, ajout des bibliothèques manquantes, disposition et
empreinte du cœur Drupal préservées. Premier candidat restauré après échec de
chargement ; second candidat qualifié et recette technique réussie, avec écran
OAuth de connexion accessible. Huit tests locaux de réparation et 22 tests CI
réussis. Parcours avec le compte du responsable et lancement des applications
encore à recetter ; aucune livraison de production ni modification de compte.

Clarification des liens de revue de la PR #77 : accès de recette CONNECT,
fournisseur d’identité, tests locaux du correctif et cockpit de suivi distingués.
Une première correction de la case de test pointait vers la procédure de
validation ; elle est corrigée pour ouvrir directement CONNECT préproduction.
Le lien a été cliqué depuis la PR : destination CONNECT confirmée, protection
HTTPS 401 Basic contrôlée. Le navigateur intégré bloque sur l’authentification ;
le parcours avec le compte du responsable reste à recetter. Le suivi conserve
ce contrôle et sa limite. Les serveurs et validations humaines sont inchangés.

Après confirmation utilisateur du fonctionnement de l’accès, contrôle en lecture
seule de la version Rapport ouverte depuis CONNECT. La cible configurée est bien
Rapport préproduction, mais elle sert encore un ancien bundle sans Visite Globale.
Le catalogue à deux choix est déjà dans `main`, via la PR #61 fusionnée le
14 septembre. L’écart de livraison est enregistré dans le suivi et le relevé ;
aucun fichier hébergé, compte ou donnée modifié pendant ce diagnostic.

Qualification multi-applications demandée avant production : préparation locale
de huit candidats depuis la même référence intégrée, sept builds réussis, suites
métier existantes et test transversal du véritable émetteur CONNECT vers six sas.
Ajout des contrôles d’intégrité et d’exclusion des fichiers privés dans les archives.
Observations HTTP anonymes enregistrées ; version ancienne Rapport, PR Coupe #54
ouverte, adresse Recherche non résolue et Passeport Immo fermé explicités.
La première lecture cPanel était interrompue ; la reprise complète maintenant
l’inventaire des huit applications. Les cinq bundles hébergés et sept fichiers
CONNECT diffèrent des candidats. Sept sauvegardes/restaurations privées des
fichiers passent, avec source active inchangée ; aucune base n’est sauvegardée
par ce reçu. CONNECT manque les colonnes de la migration d’activation, Recherche
n’a pas de cible/configuration/catalogue, Passeport n’a que sa fermeture.
Un lot exact de cinq cibles existantes est préparé avec règles d’accès et plan de
recette/retour arrière ; aucun candidat applicatif installé ni production modifiée.

Clôture de session demandée par le responsable : [point de reprise](outillage/acces-preproduction/point-session.md)
enregistré, avec les sources, archives privées à conserver, limites des sauvegardes
et ordre de reprise. L'accord sur le lot exact de cinq applications reste en attente ;
aucun déploiement ni validation de phase ajouté par cette clôture.

## 2026-10-09

Reprise demandée avec session cPanel et revue dans Claude. État GitHub actualisé,
archives originales vérifiées et huit cibles réexaminées en lecture seule ; les
sept sauvegardes et copies privées de fichiers/modes correspondent toujours aux
racines actives. Les configurations dédiées et les prérequis SQL sont inchangés.

Correction de la préparation du lot de cinq applications : règle OAuth de Coupe
conservée, fichiers identiques après normalisation LF laissés en place, opérations
de création/remplacement et retour arrière explicites, modes d'origine conservés.
Six tests du préparateur passent ; suite locale : 33 tests, dont six Apache sautés
sur ce poste. Le plan corrigé possède une nouvelle empreinte et reste en attente
d'accord de préproduction. Le [point de session](outillage/acces-preproduction/point-session.md)
et le suivi canonique portent les preuves datées ; aucune application remplacée,
aucune base migrée et aucune production modifiée.
