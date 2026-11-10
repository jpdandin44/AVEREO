---
project: avereo-app-projet
document_type: roadmap
title: Feuille de route de Projet
status: active
version: git
created: 2026-09-19
updated: 2026-11-10
owner: jpdandin
tags:
  - projet
  - roadmap
---

## 10 novembre — Référence locale des applications

Développement local du catalogue explicite et des chemins à copier ; tests de conservation et rétrocompatibilité. Mise en préproduction autorisée par le responsable le 10 novembre avec sauvegarde et test de retour. Installation et recette hébergée à constater séparément ; aucune mise en production.


## 9 novembre — préparation de PR avec qualification et rafraîchissement

Qualification consultative, collecte manuelle GET et projection Node/PHP sont préparées localement. Revue du lot en Développement local ; préproduction non installée. Suite : examiner la PR et ses preuves, qualifier les prérequis privés/sauvegarde/restauration et le canal de publication, puis autoriser une installation ciblée du candidat exact. Les critères de recette en ligne/PC éteint restent à vérifier sur la cible. [Plan et frontières](docs/preuves-et-actualisation-github.md).

## 9 novembre — cohérence locale à examiner

Raccordement des itérations et observations GitHub réalisé dans un candidat isolé, sans publication. Phase : Développement local ; revue humaine attendue. Suite distincte : qualifier les réserves de preuves/critères et les versions réellement installées, puis l’exploitation privée en ligne après accord exact. Préproduction et Mise en production non commencées. [Périmètre](docs/coherence-github-locale.md).

## 8 novembre — premier lot de préparation locale

Développement local autorisé et préparé depuis main `5e79a9c` : modèles inactifs, plan structuré, tests et récupération sur copie fictive. Le [guide](docs/preproduction-developpements.md) porte les opérations futures exactes et leurs réserves. Préproduction et Mise en production ne démarrent pas ; cible/horloges/permissions, secrets, sauvegarde indépendante/restauration, livraison privée et vraie chaîne d'identité restent à qualifier puis autoriser. Pas de nouveau critère ni accord humain déduit.

## Alignement et contrôles CI

Le [workflow dédié](workflows/ci-developpements.md) complète la qualification sur le candidat aligné, sans déployer. Le lot reste en Développement local, revue humaine attendue. L'installation, la vraie autorité Drupal, l'exploitation et la restauration du module restent des étapes séparées à autoriser.

## Reprise — session Projet et préparation de préproduction

Lecteur PHP et interface dédiés réalisés/testés sur le contrat natif avec fixtures ; paquet de préproduction séparé préparé, pas installé. Étape actuelle : Développement local, revue attendue. Cadrage conservé, Préproduction et Mise en production non démarrées. Avant suite : alignement Git/CI, vraie configuration propriétaire/sas/pont, HTTPS/noyau Drupal, ACL/quota et sauvegarde/restauration/canal de publication, puis accord d'installation. [Plan](docs/preproduction-developpements.md).

## 7 novembre — pont et stockage, état local courant

Pont PHP Drupal/CONNECT, client Node et copie persistante implémentés après demande explicite. Recette fictive pour l'habilitation ; copie réelle sous accès privé du poste. Le sous-suivi `hostingRequirement.framing` du cockpit propriétaire est en Développement local, à examiner ; critères non approuvés. Cadrage conservé, Préproduction et Mise en production non démarrées/non autorisées. Suite : lecteur PHP/session réelle, vraie configuration, noyau Drupal/HTTPS, profils fictifs tiers et révocation, ACL/quotas, sauvegarde indépendante. [Guide](docs/pont-stockage-local.md). Ne pas exposer le serveur local.

# Feuille de route de Projet

## Reprise après clôture — portefeuille local du 7 novembre

Le responsable reprend et autorise la consultation privée locale sans SSO. [Portefeuille](docs/cockpit-portefeuille.md) développé : les 12 applications/sites disposent d'un suivi lisible via 12 entrées sur 11 JSON, après raccordement Recherche/RGA. Phases, preuves et fraîcheur locale sont vérifiées sans écrire dans les sources. Phase **Développement local**, à examiner ; aucune validation humaine de critère ni phase suivante. Prochaines actions : compléter les informations insuffisamment renseignées avec les projets responsables et, dans un lot séparé, mesurer les versions réellement hébergées. Aucun déploiement.

## Reprise après clôture documentaire du 7 novembre

[Raccordement préparé, non exécuté](docs/raccordement-developpements-local.md). Sur nouvelle demande : qualifier la source d'autorité du compte administrateur global exact, confirmer les chemins canoniques, puis proposer un pilote local strictement consultatif avec matrice de refus. Le registre actuel ne vérifie pas le rôle réel ; aucune source réelle n'est raccordée. Le Développement local reste à examiner, sans changement de phase ni accord de préproduction/production. Les autres chats et services ne sont pas interrompus.

## Développements — candidat local à examiner

| Phase | État de ce lot, distinct des livraisons précédentes |
| --- | --- |
| Cadrage | Module demandé et développement local autorisé ; restriction au seul propriétaire administrateur global confirmée. |
| Développement local | Module, garde d'accès, adaptateurs, critères/preuves et journal opt-in réalisés ; recette sur fixtures, tests et build locaux. Revue humaine du candidat attendue. |
| Préproduction | Non démarrée, non autorisée. Qualifier d'abord identité/rôle CONNECT, pont privé et refus des autres profils. |
| Mise en production | Non démarrée, non autorisée ; contrôles après livraison et préparation de l'itération suivante restent dans cette phase. |

[Guide du candidat](docs/developpements-local.md). Aucun accord des anciens lots n'est transféré à cette itération.

## Itération en Préproduction — interface simple

Le [cadrage de l’interface](docs/proposition-interface-simple.md) porte les demandes de résultats cochables, options de vérification/date contrainte, planning allégé et échelles Mois/Années. [Suivi canonique](data/suivi-interface-simple.json). PR #114 fusionnée et installée le 6 novembre après accord, sauvegarde/restauration et contrôle de passage. Deux projets conservés. Réserve à lever : positionnement du menu lorsque l’en-tête revient à la ligne, constaté à 761 px. Prochaine étape : correction locale et nouvelle qualification, puis revue humaine hébergée. Aucune production autorisée.

## Reprise du 6 novembre — candidat sujets et colonnes

PR #111 constatée fusionnée à 07:04:20 UTC, commit `4d2f7ff`. La branche reprend cette base. Le responsable ne choisit pas un nouvel ordre ; conserver l’ordre et les dates, rendre l’emploi visible puis revoir les priorités si nécessaire.

| Phase | État |
| --- | --- |
| Cadrage | Périmètre fixé : classement explicite ou proposé, filtres temporaires, largeurs par navigateur. |
| Développement local | Implémenté et testé ; candidat et PR dans le suivi canonique. |
| Préproduction | Installé le 6 novembre après accord, sauvegarde et restauration sur copie ; deux projets vérifiés, données identiques. Validation utilisateur acquise et PR #112 fusionnée. |
| Mise en production | Non autorisée ; contrôles après livraison, récupération et prochaine itération à préparer après acceptation. |

[Suivi canonique](data/suivi-sujets-colonnes.json). Le relevé ci-dessous conserve la situation de clôture historique, désormais dépassée par cette reprise.

## Reprise après clôture du 5 novembre — sujets et lisibilité

Le responsable confirme que le menu fonctionne bien dans son usage. La validation du menu en préproduction est acquise ; aucune validation de l’ordonnancement métier n’en découle. PR #111 annoncée fusionnée par le responsable mais encore ouverte lors du contrôle GitHub de clôture : quatre cases non cochées, tests techniques réussis. Vérifier cet écart à la reprise sans cocher à sa place.

Prochain lot demandé, uniquement consigné à ce stade :

1. **Priorité emploi visible** : dissocier le sujet et la priorité du lot. Rendre la recherche d’emploi immédiatement identifiable ; revoir avec le responsable l’ordre des actions de continuité des ressources et de candidatures. Une priorité métier ne doit pas être déduite de la criticité du risque ou du statut.
2. **Filtres par sujet** : Tous, Emploi, AVEREO, TC Longages, avec extension possible. Le filtre masque l’affichage, sans recalculer les dates ou supprimer les tâches masquées. Afficher le nombre de résultats et signaler les dépendances vers des tâches masquées. Définir le classement des actions transversales ; ne pas le déduire définitivement des identifiants historiques.
3. **Colonnes ajustables** : élargir la zone Tâche et déplacer la séparation tableau/calendrier, avec commande clavier, largeur minimale et remise à zéro. Garder l’alignement des lignes, le défilement, les barres et le repère du jour. Prévoir un accès lisible au titre complet et à la description ; le clic sur la tâche ouvre déjà sa fiche.

| Phase | Prochaine étape |
| --- | --- |
| Cadrage | Confirmer les sujets et l’ordre emploi/continuité ; fixer le périmètre de mémorisation des largeurs et des filtres. |
| Développement local | Implémenter sur une nouvelle branche ; adapter modèle, validation frontend/PHP, sauvegarde et import/export si des champs sont ajoutés ; vérifier la rétrocompatibilité. |
| Préproduction | Préparer le candidat et sa sauvegarde, obtenir l’accord propre à ce lot puis vérifier filtres, colonnes et conservation des deux projets. |
| Mise en production | Décision distincte non acquise ; prévoir contrôles après livraison, récupération et suite de l’itération. |

Aucun code ni planning réel modifié pour ces demandes. Les mises à jour de clôture restent locales, non commitées et non publiées ; les intégrer dans un lot documentaire à la reprise sans réécrire une PR fusionnée.


## Menu de compte et import privé

Import indépendant effectué et vérifié en préproduction : [suivi](data/suivi-import-prive.json). La correction du bouton flottant suit les quatre phases dans le [suivi du menu](data/suivi-menu-compte.json) : candidat installé et vérifié en préproduction, PR #110 fusionnée et recette technique hébergée réalisée, menu confirmé fonctionnel par le responsable à la clôture, aucune production engagée.


## Itération préparée — import privé

Le [suivi de l’import privé](data/suivi-import-prive.json) complète les suivis existants. Cadrage : base Mon espace #108. Développement local : paquet hors dépôt, contrôles et PR. Préproduction : import autorisé et vérifié le 5 novembre ; contenu conservé dans un nouveau projet. Mise en production : décision ultérieure distincte, avec contrôles après livraison et suivi du planning.


## Itération courante — Mon espace

**Livré et vérifié en préproduction le 5 novembre à 15 h 50.** Le responsable peut
retrouver le Gantt et créer ses dossiers indépendants. Les PR #107 et #108 sont constatées fusionnées le 5 novembre à la clôture.

Le [suivi de l’espace projets](data/suivi-espace-projets.json) est la source de
l’étape, du candidat et de la livraison. Cadrage et développement local couvrent
l’accueil du compte, les dossiers indépendants, les archives et deux préférences.
La préproduction demandée est qualifiée séparément. Mise en production et merge
restent des décisions humaines distinctes.

Les suivis historiques Gantt et sauvegarde conservent leurs preuves et accords.
Suite éventuelle : tableau des échéances de plusieurs projets et registre clients
structuré, à cadrer après usage de la page simple.


## Priorité du 5 novembre 2026

**Réalisé en préproduction** : sauvegarde privée du Gantt et reprise en ligne
qualifiées. Prochaine action : constat dans Chrome par le responsable et revue
de la PR #107. Les données réelles ont été conservées à l’identique.

Retrouver le Gantt puis enregistrer ce même planning en ligne dans l'espace privé
AVEREO. Le [suivi du lot](data/suivi-enregistrement-en-ligne.json) porte les quatre
phases : Cadrage, Développement local, Préproduction, Mise en production.
La production reste hors intervention. Les clients/projets distincts restent
au cadrage, après cette sauvegarde du planning actuel.

La PR #90 est fusionnée depuis le 2 novembre ; son ancienne mention de brouillon
ci-dessous décrit la situation constatée le 28 octobre.


## Gantt préproduction — 28 octobre 2026

La version locale (défilement, synthèses repliées, déplacements et repère du jour)
est reprise sans changement des fichiers métier depuis la copie de pilotage,
sur une branche issue du `main` courant. Les revues locales déjà intégrées sont
conservées. Le [suivi](data/suivi-gantt-affichage.json) distingue Cadrage,
Développement local, Préproduction et Mise en production. La demande du responsable
autorise la préproduction Projet, pas un merge ou une livraison de production.
La livraison ciblée est réalisée et vérifiée, après CI réussie et récupération
privée répétée. La [PR #90](https://github.com/jpdandin44/AVEREO/pull/90) reste en
brouillon. Recette ciblée dans Chrome connecté réussie : import de la référence,
repli et trait du jour, export/rechargement avec conservation intégrale des
45 tâches. Validation humaine encore attendue. Ni merge ni production.

## Prochain lot demandé — dossiers clients et enregistrement serveur

Besoin confirmé le 28 octobre : conserver les projets en préproduction et mener
plusieurs dossiers clients en parallèle. Le [cadrage fonctionnel](requirements.md#projets-clients-et-enregistrement-serveur--besoin-demandé-non-implémenté)
est proposé ; cette V2 n'est pas développée. Les destinataires des accès restent à
préciser avant décision d'architecture. Le suivi du Gantt conserve cette suite,
sans mélanger son candidat déjà livré avec un futur backend.

1. **Cadrage** : utilisateurs, données, identité et droits, stockage/hébergement,
   sauvegarde/restauration, critères et budget. Source actuelle préservée.
2. **Développement local** : registre clients/projets et persistance sécurisée,
   tests sur deux clients/trois projets fictifs et reprise de la V1 sans perte.
3. **Préproduction** : candidat isolé autorisé, sauvegarde restaurée, contrôle des
   droits et de la concurrence, reprise dans un deuxième navigateur, revue humaine.
4. **Mise en production** : uniquement sur accord distinct et version acceptée,
   avec récupération qualifiée, contrôles après livraison et suite conservés.

## Revue locale des phases — 24 septembre 2026

L'espace de revue est développé sur `feat/projet-revue-phases`, à partir de
`48ae277`. Il consulte le chantier existant et enregistre observations,
corrections, remises, approbations et accords de passage. Résultats :
[recette locale](docs/recette-revue-locale.md).

L'état de revue du chantier est celui de son journal actuel, sans redemander
les accords déjà enregistrés. L'évolution du 24 septembre ajoute la progression
par phase et la consultation des validations antérieures fournies par le
chantier. Les fiches de livrables prévus et la lecture automatique du suivi sont
également implémentées et testées localement, avec conservation des saisies
et invalidation ciblée des attestations. Les résultats et la limite de recette
navigateur sont dans le complément de recette cité ci-dessus.
Livrer l'outil ne crée aucune nouvelle approbation de livrable.
Le moteur et ses évolutions de progression et de revues complémentaires sont
proposés dans la [PR #68](https://github.com/jpdandin44/AVEREO/pull/68), en brouillon
sur `feat/projet-pilotage-revues`. La base est `feat/projet-planning-local`
(`48ae277`), dont la PR #64 est encore ouverte en brouillon au constat du
25 septembre. Cette dépendance et ses validations ne sont pas modifiées.
Voir [la procédure](workflows/revue-developpement.md) pour les accords de publication.


## Existant constaté

Le frontend historique propose dashboard, Gantt, tâches, lots, dépendances,
risques et import CSV/XLSX. Il est enveloppé par React/Vite et possède
des points d'entrée PHP pour le sas CONNECT hébergé.

## Lot implémenté localement

Dates/capacité configurables, charges décimales, validation avant remplacement,
mode séquentiel, brouillon versionné, export/reprise JSON et CSV, pilote local
généré depuis une source unique, tests et documentation.

Le lot sert à organiser les évolutions du pilote, sans les implémenter.
Les tests automatisés et la recette navigateur du pilote sont réalisés ;
l'évolution est proposée pour revue dans une PR brouillon dédiée. Les résultats sont dans
[docs/source-audit.md](docs/source-audit.md).

Le build du planning initial et la prévalidation de policy avec cases décochées sont réussis.
Le téléchargement JSON et l'import XLSX dans l'interface restent à qualifier
avant une validation complète des échanges de fichiers. Le cochage de la
checklist et le merge restent humains. Aucun déploiement n'est réalisé par ce lot.

## Extension fiches et risques — testée localement

Le moteur et l'interface disposent des descriptions, actions, critères,
checklists et risques détaillés. La reprise des anciens projets est compatible ;
l'enrichissement ajoute les fiches manquantes sans remettre à zéro le suivi.
Le document des étapes est généré depuis la même source structurée et consultable
localement. Les tests moteur des validations et de la matrice sont exécutés.

Les tests intégrés, le build et l'inspection de l'artefact de cette extension
sont réussis. Les parcours de fiche, preuve et qualification/reprise de risque
ont été vérifiés dans le navigateur local. Les preuves et les compléments de
recette encore ouverts sont consignés dans [l'audit](docs/source-audit.md).
L’extension de planning du 19 septembre relève de la
[PR #64](https://github.com/jpdandin44/AVEREO/pull/64), sans nouvelle publication
hébergée ni réalisation implicite des EV planifiées.

## Suite à arbitrer

Sauvegarde distante, collaboration, absences/jours fériés et nivellement
multiressource ne sont pas engagés. Une activation backend/MySQL exigerait un
nouveau périmètre. Les corrections du sas et de sa publication demeurent un
lot distinct ; les inscrire dans le planning ne prouve pas leur réalisation.
