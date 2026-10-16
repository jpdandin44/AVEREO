---
project: avereo-app-passeport-immo
document_type: technical-resumption
title: Reprise selon le protocole commun du 16 octobre 2026
status: active
version: git
created: 2026-10-16
updated: 2026-10-16
owner: jpdandin
tags: [passeport-immo, protocole, reprise, production]
---

# Reprise selon le protocole commun

Constat réalisé le **16 octobre 2026 vers 09 h 15, Europe/Paris**, en lecture
seule, à la demande du responsable de poursuivre en parallèle le comparatif CIL
et Passeport Immo. Ce point complète les observations antérieures ; il ne crée
aucune décision humaine et ne remplace pas le [suivi canonique](suivi-chantier.json).

## Protocole installé et utilisable

Les deux installations utilisateur du skill `developpement-github-cockpit`
pointent vers la même source locale :
`C:/Users/examg/Documents local/avereo-protocole-integration/outillage/protocole-developpement`.
Le skill et ses références ont une date de mise à jour du 15 octobre 2026.
Ils imposent la revue locale pour les phases 0 et 1, la revue en préproduction
pour les phases 2 et 3, et les contrôles après livraison sur la production réelle.
Le contrôle de fusion avant remise d'une PR et sa confirmation après publication
sont également présents. Ces règles sont disponibles sur ce poste et peuvent
être appliquées dès cette reprise.

La [PR nº75](https://github.com/jpdandin44/AVEREO/pull/75), qui publiait la règle
à quatre phases, est observée fusionnée et approuvée le 6 octobre 2026, au commit
`fbf395b31917ad46565896ae46317e11db0b611e`. Les compléments du 15 octobre sont
encore des modifications locales dans la source installée ; leur publication
reste distincte. Son suivi local conserve `awaiting_review` et aucune décision
humaine : ce décalage documentaire doit être traité dans le lot du protocole,
sans inventer de validation dans Passeport Immo. Il n'empêche pas d'appliquer
les instructions installées et la demande actuelle de reprise du responsable.

## État réel de Passeport Immo

La copie modifiable est `C:/Users/examg/Documents local/passeport-immo-local`.
La branche observée est `docs/passeport-immo-execution-production`, à la tête
`d95164ea0c9863073427e82fae89e89dadeac01f`. Les modifications locales déjà présentes
dans Passeport Immo, AVEREO Projet et la policy sont conservées.

| Phase | État constaté dans le suivi | Portée |
|---|---|---|
| Cadrage | Validée le 3 octobre | Validation historique conservée |
| Développement local | Validée le 14 octobre | Validation historique conservée |
| Préproduction | Validée le 16 octobre par D06 | Six livrables examinés, huit critères validés |
| Mise en production | En cours depuis le 16 octobre | Préparation technique ; aucune livraison réalisée |

La décision **D06**, enregistrée par `jpdandin` à **09 h 05 min 11 s, heure de Paris**,
porte le commentaire : **« Phase approuvée, passage en prod autorisé. »**
L'autorisation existante est référencée pour le candidat examiné sur
`https://passeport-immo.avereo.fr`, avec le dossier SCI retenu. Il n'y a pas lieu
de redemander cet accord pour la même cible, la même version et le même effet.
Les prérequis techniques restent à satisfaire avant exécution ; aucune ouverture
publique n'est comprise dans cet accord.

| PR relue sur GitHub | État et revue | Commit de fusion |
|---|---|---|
| [nº80](https://github.com/jpdandin44/AVEREO/pull/80) | Fusionnée, approuvée | `437f2689e8ea5a0f12e055be9e2b8713bf99b1bd` |
| [nº81](https://github.com/jpdandin44/AVEREO/pull/81) | Fusionnée, approuvée | `2995a2b95003016df0fefa84b34353c34dc5fee0` |
| [nº82](https://github.com/jpdandin44/AVEREO/pull/82) | Fusionnée, approuvée | `d95164ea0c9863073427e82fae89e89dadeac01f` |

Sur la fusion de la PR nº82, [CI](https://github.com/jpdandin44/AVEREO/actions/runs/38864545231)
et [Passeport Immo CI](https://github.com/jpdandin44/AVEREO/actions/runs/38864545332)
réussissent. Le [workflow distinct du prototype GitHub Pages](https://github.com/jpdandin44/AVEREO/actions/runs/38864545269)
reste en échec ; il ne réalise pas la livraison de Passeport Immo sur o2switch.

## Candidat et prérequis de livraison

Le [reçu de préparation courant](../api/production-readiness-observation.json)
rapproche D06, la fusion de la PR nº82 et les archives locales. L'archive
publique conserve l'empreinte
`c44f397fd03daa433f19e6d4c72127f29e55dbf9fca679e8c7f41cc207a843cf`,
source `7209bf3334a5f3f98d422b41d177c734970a0750`, identique au candidat de
préproduction. L'installation fermée, l'adaptation CONNECT et l'outillage de
sauvegarde sont identifiés séparément dans ce reçu. Aucun lot n'est livré en
production à ce stade.

Le même reçu constate, à **09 h 10, heure de Paris**, l'absence du domaine de
production et de la base dédiée proposée. Cette observation authentifiée n'est
pas répétée dans le présent audit : aucun accès cPanel n'est utilisé ici.
Le runtime CONNECT, le propriétaire de production et l'inventaire SCI doivent
être relus avant leurs opérations respectives. Les documents actifs et archivés
du dossier sélectionné sont à préserver, en excluant les essais et les autres biens.

### Vérification locale des lots conservés

À **09 h 19, heure de Paris**, GitHub confirme encore `main` à la fusion
`d95164ea0c9863073427e82fae89e89dadeac01f`. Les fichiers locaux et les blobs Git
de cette tête sont comparés en lecture seule. Les archives existantes sont relues
sans reconstruire le candidat.

| Lot local, sous `.local/` | Contrôle réellement effectué | Résultat |
|---|---|---|
| `production-preparation/main-437f268/candidate.zip` | SHA-256 `c44f397fd03daa433f19e6d4c72127f29e55dbf9fca679e8c7f41cc207a843cf`, CRC, noms, tailles et empreintes des 16 fichiers ; comparaison au `dist` existant et aux sources runtime fusionnées | Conforme ; frontend, sas partagé et packaging inchangés depuis la source `7209bf3` |
| `production-qualification-20261015/closed-installation/preproduction.zip` | SHA-256 `9e9bde15d4b2c625967053220fc79f5a602ef2ab01a6a5fc3fdf537ee01b0404`, CRC et manifeste des 16 fichiers ; comparaison au candidat public | Conforme ; seul `.htaccess` diffère et ferme tous les accès |
| `production-qualification-20261015/connect-delta/runtime-connect-compatible.zip` | SHA-256 `3b41fda26c0358a0a4eb3f49ebd2e132162fd737ce0078822d3e15a687884b63`, CRC et deux fichiers ; transformation compatible recalculée uniquement en mémoire depuis la base `7216fb1` et les sources de `main` | Conforme ; copie de test identique au delta ; préconditions serveur à relire avant pose |
| `production-qualification-20261015/backup-production/bundle.json` | SHA-256 `b06e74f2528caa1887b151bb1d6052f7733388228ed710c2289cf0b6ab9ca0e8`, décodage des quatre fichiers, tailles et empreintes ; comparaison aux sources Git fusionnées et aux fichiers de travail | Conforme ; aucune configuration ni donnée ajoutée au lot |

Les tests locaux sont réexécutés sur ce contenu : **19 tests Python**, **36 tests
du backend CONNECT isolé** et **15 assertions du contrat CONNECT/Passeport Immo**
réussissent. Les 19 cas Python couvrent notamment les archives, chemins interdits,
preuves approuvées et préconditions du delta. Aucun serveur de production n'est
utilisé par ces essais.

Le journal de la [CI du candidat fusionné](https://github.com/jpdandin44/AVEREO/actions/runs/38864545332)
est également relu : **30 assertions API/stockage et 22 assertions de sauvegarde**
ont réussi sous MariaDB 11.4 isolée, y compris la sauvegarde en environnement
production et la coexistence des tâches préproduction/production. Les sources
du lot de sauvegarde et de ses tests n'ont pas changé depuis la qualification
fusionnée ; ce test de conteneurs n'est donc pas répété ici. Cette preuve CI ne
remplace pas la récupération sur la future cible réelle.

Le contrôleur installé est exécuté contre le suivi courant avec le passage
`production`. Il refuse encore ce passage pour quatre motifs :

- blocages techniques présents ;
- cible de production non prête ;
- sauvegarde restaurée, ou vacuité et isolement de la cible, non prouvés ;
- retour arrière de ce candidat non qualifié sur cette cible.

L'accord humain est donc disponible ; le refus actuel porte sur la préparation
technique. Il ne doit pas être levé par une simple modification déclarative.

## Travail préparatoire à poursuivre

1. Préparer dans la source le mécanisme de reprise ciblée du dossier SCI et sa
   répétition sur une cible isolée : sélection explicite, contrôle des empreintes,
   rattachement au propriétaire CONNECT retenu, absence de doublon et conservation
   des archives. Aucun compte, secret ou autre dossier ne doit être transféré.
2. Actualiser l'inventaire réel avant exécution, puis qualifier la cible fermée,
   la base dédiée, le runtime CONNECT et les droits du compte de production.
   La [procédure de production](04-mise-en-production.md) est le point d'entrée
   existant ; ses constats du 15 octobre restent datés.
3. Prouver la récupération et le retour arrière adaptés à cette cible, en
   préservant toute nouvelle donnée. Relancer le contrôle de passage sur les preuves
   réelles actualisées avant de livrer le candidat autorisé.
4. Après livraison autorisée, effectuer la recette de production et conserver son
   reçu. Faire décider séparément de l'ouverture aux utilisateurs et préciser
   la politique de sauvegarde de production, actuellement proposée mais non approuvée.

### Séquence concrète des quatre prérequis techniques

Cette séquence précise la reprise du [dossier opérationnel](04-mise-en-production.md),
qui conserve les chemins, paramètres et contrôles de référence.

| Prérequis | Préparation locale disponible | Travail exigeant une session serveur et preuve attendue |
|---|---|---|
| Cible fermée | Candidat et copie fermée vérifiés, schéma et sas identifiés | Recontrôler l'inventaire, préparer le document root dédié et les espaces privés séparés, qualifier domaine/TLS/PHP Web et base dédiée. Conserver le refus anonyme, le noindex, les permissions et la preuve de vacuité/isolement avant tout chargement. |
| Données et compte | Delta CONNECT vérifié ; périmètre limité au dossier SCI, client associé et documents actifs/archivés | Relever l'identifiant stable du propriétaire autorisé dans CONNECT de production, comparer les deux fichiers aux préconditions du manifeste et actualiser l'inventaire SCI après recette. Qualifier un transfert ciblé dans un espace isolé, le rejouer sans doublon, comparer les empreintes et exclure essais/autres biens/comptes/secrets. Le mécanisme exécutable de reprise reste à produire et tester. |
| Récupération | Outils de sauvegarde fusionnés et 22 cas CI vérifiés ; politique actuelle de préproduction connue | Sauvegarder les éléments CONNECT réellement concernés avant modification et démontrer leur restauration isolée. Pour la cible Passeport neuve, prouver sa vacuité/son isolement ; après reprise SCI, vérifier une copie base/documents et sa récupération isolée. Rafraîchir les copies immédiatement avant l'écriture, sans remplacer la base CONNECT entière. |
| Retour arrière | Copie fermée et empreintes des deux fichiers CONNECT avant/après disponibles ; répétition locale de fichiers déjà prouvée | Qualifier la fermeture du lancement, le retour des seuls fichiers/configurations/droits touchés et la conservation des données nouvelles. Répéter sur un espace isolé correspondant à la cible, conserver les empreintes et le résultat, puis relancer le contrôle de production. Une ancienne base complète ne doit pas écraser les écritures intervenues depuis. |

La session serveur est nécessaire pour établir ces faits, pas pour renouveler
l'accord D06. Aucun obstacle d'environnement local ni artefact manquant n'a été
constaté pour les vérifications d'archives et de contrats réalisées ici. La limite
actuelle est la qualification réelle de la cible, du propriétaire et du transfert,
de la récupération et du retour arrière ; aucune réussite n'en est déduite des
tests locaux.

Un nouvel accord de livraison devient nécessaire si le candidat, la cible, le
périmètre des données, les droits ou l'effet changent par rapport à D06. La prochaine
décision distincte déjà identifiée est l'ouverture publique ; elle ne se déduit ni
du merge ni de D06. La publication des compléments du protocole appartient à son
propre lot et peut avancer en parallèle de ces préparations.

## Contrôle documentaire de cette reprise

Les socles documentaires du monorepo et de Passeport Immo sont présents. Le
contrôle `tests/check-cockpit.mjs` réussit : quatre phases, PR raccordées, preuves
approuvées intactes et tableaux courants cohérents. Le présent document est le
seul fichier créé par cette intervention. Les liens relatifs et les métadonnées
de ce nouveau point sont contrôlés ; aucune décision, phase, preuve approuvée,
PR fusionnée ou donnée hébergée n'est modifiée.

La documentation historique comporte encore des observations « PR nº82 en
brouillon » et « décision de phase 2 absente » ; elles sont dépassées par D06 et
le suivi courant. Leur présence ne doit pas conduire à redemander l'accord déjà
reçu. Le point de session et le dossier de production devront être réalignés
dans le lot d'exécution, en préservant les preuves approuvées. Le suivi du socle
commun doit de son côté être rapproché de la validation déclarée par le responsable.
