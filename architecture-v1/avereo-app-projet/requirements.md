---
project: avereo-app-projet
document_type: requirements
title: Exigences du planning local Projet
status: active
version: git
created: 2026-09-19
updated: 2026-11-12
owner: jpdandin
tags:
  - projet
  - exigences
---

## 12 novembre — PQ-01, inventaire privé

Afficher les volumes et listes justificatives du patrimoine avec source, date et portée ; dédupliquer les objets logiques et séparer fichiers de tests/cas exécutés, emplacements de sauvegarde/restauration et lecture/qualification. Métadonnées bornées, pas de contenu client ou secret, ni suivi de lien externe. Consultation seule et même contrôle serveur du propriétaire exact/global. Les anciennes projections sans patrimoine restent lisibles. La collecte n'est ni un rafraîchissement Git ni une publication automatique. [Contrat](api/patrimoine.md) et [suivi du premier lot](data/suivi-patrimoine-pq01.json).

## 12 novembre — Session et reprise de navigation

Expliquer une session Projet absente ou expirée sans la confondre avec la session CONNECT ni avec un refus de rôle. Effacer les données privées après refus et proposer le parcours normal de reconnexion, sans prolonger ou contourner les droits. Vue d’ensemble doit pouvoir relire un état absent ; une actualisation demandée doit donner un retour explicite, sans revendiquer une collecte distante ou une mise à jour Git.

## 11 novembre — Référence avec historique Git

Utiliser un clone complet propre de jpdandin44/AVEREO sur main ; séparer les archives sans historique des sources de développement. Refuser les autres dépôts, clones superficiels, mauvaises branches et chemins hors référence. Conserver les métadonnées métier et décisions lors du remplacement des chemins ; aucune synchronisation Git automatique ni changement de droit.


## 10 novembre — Dossiers de référence dans le cockpit privé

Afficher version commune, dix chemins applicatifs et quatre dossiers de classement. Permettre copie et sélection de secours, conserver les anciennes publications et toutes les validations. Refuser les traversées, versions divergentes, séquences concurrentes et doubles ajouts. Aucune nouvelle lecture de fichiers du PC depuis le serveur.


## 9 novembre — navigation locale depuis un lien extérieur

Un lien utilisateur vers l'entrée locale doit permettre de rejoindre la connexion privée sans erreur JSON trompeuse. L'exception ne sert qu'un sas public sans suivi, cookie, chemin privé ou droit ajouté. Conserver le refus des API/assets/pièces, iframes, fetch et POST intersites, Host/boucle locale exacts, session privée par navigateur, bootstrap à usage unique et origine/CSRF pour les actions. [Contrat](api/developpements-local.md#correction-du-9-novembre--navigation-extérieure-vers-lentrée).

## 9 novembre — preuves, critères et versions fusionnées

Conserver toutes les validations et sources ; refuser un rapprochement dont le JSON ou fichier a changé ; n’ouvrir que le fichier explicitement qualifié. Les critères documentés sans preuve directe restent non validés. Collecte GitHub explicite, bornée, réservée à l’administrateur local avec session/origine/CSRF ; aucun dépôt ou chemin du navigateur accepté. Panne/concurrence = observation précédente conservée. Préproduction : collecte opérateur puis projection privée signée, aucune clé GitHub installée par ce lot. [Contrat](docs/preuves-et-actualisation-github.md).

## 9 novembre — cohérence locale sans altérer les validations

Distinguer état GitHub observé/état déclaré, conserver dates et versions de chaque portée, rendre les sources manquantes lisibles sans copies manuelles de statuts. Tous les adaptateurs et suivis réels restent consultatifs ; sélecteurs absents/ambigus refusés, racines de preuves confinées, aucun accord ni passage de phase déduit. [Contrat réalisé et limites](docs/coherence-github-locale.md).

## Premier lot local — 8 novembre

Préparer seulement le code/paquet et les procédures : modèles des trois services inactifs, identifiants/secrets vides ; aucune publication de vraies sources, connexion serveur, modification de permissions/horloges ou livraison. Conserver propriétaire exact ET rôle global frais, refus de tous les autres profils et lecture seule. Tester la récupération sur copie fictive sans abaisser la séquence haute et signaler la livraison `--delete` comme non qualifiée, sans modifier le workflow public. [Guide](docs/preproduction-developpements.md).

## Qualification du candidat et de la CI

Conserver le propriétaire administrateur global exact et le mode consultatif pendant l'alignement Git. Tester explicitement les refus, les suites PHP du pont, les régressions Projet et la séparation public/privé sur fixtures sans secret réel. Relier le paquet au SHA propre réellement testé et ne pas confondre CI, recette du vrai compte et accord humain. [Contrôles exécutables](workflows/ci-developpements.md).

## Reprise — session Projet et préparation de préproduction

Raccorder le code à la vraie session Projet native sans recopier son cookie ni créer un second propriétaire. Exiger propriétaire exact et rôle global frais sur entrée/API/assets/preuves ; garder lecture seule, quatre phases et séparation du planning. Préparer la préproduction, pas la déployer. Configuration préproduction inactive par défaut, paquet sans données/secrets, conservation des suivis et refus d'écriture. [Réalisation et critères à qualifier](docs/preproduction-developpements.md).

## 7 novembre — pont et stockage, état local courant

Périmètre autorisé : développement local seulement, propriétaire exact ET rôle global courant, refus d'autres administrateurs/rôles, comptes bloqués, droit Projet absent, signature/nonce/durée incorrects, révocation et panne. Vrais suivis consultatifs, aucune approbation créée. Stockage persistant privé signé, séquence croissante, preuves sélectionnées, restauration explicite et dates de copie visibles. [Réalisation et limites](docs/pont-stockage-local.md). SSO réel, lecteur PHP/transport hébergés et qualifications de cible restent à faire ; aucun déploiement.

# Exigences du planning local Projet

## Développements en ligne — cible demandée le 7 novembre

Préparer la consultation durable du cockpit dans un module Développements de Projet, privé au seul propriétaire administrateur global exact. Le mode local ci-dessous est l'état réalisé, non une limite de la cible future. Le [guide](docs/cockpit-portefeuille.md#cible-future-en-ligne--exigence-du-7-novembre) renvoie au cahier canonique du besoin : premier lot hébergé en lecture seule, protections serveur sur toutes les ressources, données disponibles sans le PC, publication traçable et ancienneté visible, quatre phases et conservation du Gantt/projets clients. Identité/rôle CONNECT et mécanisme hébergé restent non qualifiés ; aucun raccordement ni déploiement n'est effectué pour prendre cette exigence en compte.

## Portefeuille demandé le 7 novembre

Complément demandé : raccorder Recherche et RGA à leurs sources actuelles et vérifier la conformité des informations affichées aux JSON et Git du poste. Préserver une distinction explicite entre donnée datée, modification du fichier et lecture ; ne pas actualiser artificiellement une livraison historique. Les sources et accords des autres projets restent en lecture seule ; la projection d'un sous-suivi ne copie pas les accords de son parent.

Donner une visibilité à toutes les applications sur leur version locale et les développements, en conservant les quatre phases. Le responsable confirme l'accès privé sur son poste, en lecture seule, sans connexion automatique à CONNECT. Distinguer code local/candidat/lot hébergé déclaré ; montrer les absences, les dates et les réserves sans inventer une version installée. Le registre ne copie pas les statuts ; les chantiers communs restent canoniques. Aucun autre profil, écriture métier ou déploiement autorisé. [Périmètre et limites](docs/cockpit-portefeuille.md).

## Développements privés — demande autorisée le 6 novembre 2026

- Réserver lecture, écriture et preuves au seul propriétaire administrateur global ; refuser les autres profils, y compris un autre administrateur global. Contrôle serveur obligatoire, fermé par défaut.
- Afficher Cadrage, Développement local, Préproduction et Mise en production, avec critères identifiés, preuves reliées au candidat, décisions explicites et historique conservé.
- Séparer résultat technique, disponibilité/fraîcheur de preuve et validation humaine ; ne pas fabriquer les critères ou les accords manquants.
- Lire plusieurs schémas sans migration forcée ; n'écrire que dans une source qui accepte le contrat, avec contrôle de concurrence et récupération qualifiée sur fixtures.
- Préserver le Gantt, les projets clients, les anciens accords et les travaux parallèles ; aucune action implicite de merge, phase suivante ou livraison.
- Réalisation locale uniquement, sans déploiement. Identité réelle/rôle CONNECT et pont privé hébergé restent **TBD avant préproduction**. Le candidat actuel utilise un accès local privé et des données fictives, pas un droit acquis dans CONNECT.

[Guide et périmètre réalisé](docs/developpements-local.md), [contrat](api/developpements-local.md).

## Demandes de simplification du 6 novembre — préproduction

Résultats attendus cochables, vérification complémentaire optionnelle, saisie de date contrainte masquée par défaut, planning plus lisible et échelles Mois/Années. La [proposition et sa réalisation locale](docs/proposition-interface-simple.md) distinguent le besoin initial et le candidat. Le schéma de planning est conservé ; le contrat des préférences est étendu. Recette technique hébergée réalisée le 6 novembre ; validation humaine hébergée encore attendue. Le menu doit rester intégralement dans la largeur disponible, y compris avec un titre long et un en-tête sur plusieurs lignes : réserve observée à 761 px, voir le suivi.

## Demandes du 5 novembre — implémentées localement le 6 novembre

Rendre la priorité emploi visible ; filtrer les actions par sujet (notamment Emploi, AVEREO et TC Longages) ; permettre d’agrandir les colonnes et la zone des intitulés. Distinguer sujet, lot, priorité métier, état d’avancement et risque. Préserver dates, dépendances, identifiants, checklists, risques et contenu complet lors des filtres, de la sauvegarde et des échanges. Les critères de reprise et inconnues sont conservés dans la [roadmap](roadmap.md#reprise-après-clôture-du-5-novembre--sujets-et-lisibilité).


Implémentation locale : filtres temporaires, classement optionnel explicite, propositions signalées et largeurs mémorisées par navigateur. Ordre et dates conservés ; recette hébergée technique réalisée le 6 novembre, filtres et colonnes confirmés fonctionnels par le responsable. [Suivi](data/suivi-sujets-colonnes.json).

## Menu de compte — correction demandée le 5 novembre 2026

Conserver Mon espace en bas à gauche ; ouvrir le menu au-dessus. Rendre la déconnexion accessible dans ce menu sans recouvrir les boutons de sauvegarde. Conserver les accès aux projets, préférences et compte, la navigation clavier et la route de déconnexion actuelle. Le lien est masqué en mode local sans service en ligne.


## Intégration du contenu privé — 5 novembre 2026

Préparer une PR sur la dernière version de Projet, conserver le JSON personnel hors dépôt public, vérifier sa compatibilité sans perte et préparer son import dans un projet indépendant. Préserver le planning courant et ses révisions. La préparation ne vaut ni import effectif, ni fusion des versions, ni accord de merge ou de livraison. Voir le [workflow](workflows/import-prive.md).


## Espace du compte — demande du 5 novembre 2026

Le responsable demande une page liée au compte pour retrouver ses différents
projets enregistrés en ligne et accéder simplement aux préférences et au compte.
Le périmètre privé réservé au propriétaire est conservé.

- Accueil Mes projets, accès par la zone du compte, recherche et tri.
- Création d’un planning vide ; import JSON complet dans un nouveau dossier.
- Référence client facultative ; titre modifiable dans les paramètres du planning.
- Archives réversibles sans suppression définitive ; historique indépendant.
- Préférences en ligne : échelle jours/semaines et lots repliés à l’ouverture.
- Profil et administration via CONNECT, sans nouveau système de comptes.
- Conserver le planning existant à l’identique ; aucun découpage automatique.
- Empêcher les mélanges entre projets, comptes, onglets ou versions concurrentes.

L’identifiant du propriétaire et le stockage sont déjà qualifiés pour le lot de
sauvegarde. Le cadrage historique ci-dessous ne bloque plus cette réalisation.
TBD pour un futur lot : portefeuille d’échéances, registre clients structuré,
partage avec une équipe et sauvegarde indépendante périodique. Aucun de ces
éléments n’est présenté comme installé par cette page.


## Lot autorisé le 5 novembre — sauvegarde privée du planning existant

- Retrouver le même Gantt et les mêmes fiches depuis plusieurs navigateurs.
- Accès au seul propriétaire CONNECT ; identité vérifiée côté serveur.
- Accusé daté et révision, copie locale avant envoi, reprise après panne.
- Refus des écritures périmées, des origines étrangères et des comptes tiers.
- JSON complet conservé, export indépendant et version précédente récupérable.
- Données hors dossier public, sauvegarde/restauration répétée avant livraison.
- Préproduction explicitement demandée ; aucune autorisation de production ou
  de merge n'est déduite. Les dossiers clients distincts restent différés.


## Projets clients et enregistrement serveur — besoin demandé, non implémenté

Le 28 octobre, le responsable demande l'enregistrement des projets en
préproduction, avec un projet par client et plusieurs projets menés en parallèle.
Cette demande forme un nouveau lot : elle ne transforme pas la V1 statique
livrée en une application dotée d'une sauvegarde distante.

Périmètre fonctionnel proposé pour le premier lot :

- Écran « Mes projets » : créer, nommer, ouvrir et archiver sans suppression
  définitive ; rattacher un projet à un client et autoriser plusieurs projets
  pour le même client, sans mélanger leurs tâches.
- Identifiants stables pour client et projet. Les cartouches actuels regroupent
  les `lot` d'un seul planning ; ils ne sont pas des dossiers clients indépendants.
- Projet actif explicite et confirmation des changements non enregistrés avant
  bascule ; conserver dates, tâches, dépendances, fiches, preuves et risques propres
  à chaque projet.
- Enregistrement sur serveur avec accusé de réussite, date et révision ; ne jamais
  afficher « enregistré » sur la seule réussite du stockage navigateur. En cas
  d'erreur, préserver la saisie et permettre l'export de secours.
- Reprise depuis un autre navigateur autorisé ; détection des écritures
  concurrentes et refus d'écraser silencieusement une révision plus récente.
- Vue portefeuille des projets actifs et de leurs échéances ; distinguer le
  parallélisme des dossiers de la capacité réelle du responsable. Un nivellement
  automatique multi-projet ne fait pas partie du minimum proposé.
- Export/import complet par projet et récupération contrôlée ; reprendre le
  Gantt AVEREO actuel comme un projet interne, sans convertir automatiquement ses
  cartouches en clients ou supprimer le brouillon d'origine.

Contraintes préalables à la réalisation : authentification et droits contrôlés
sur chaque lecture/écriture serveur, données hors des fichiers statiques publics,
révisions, validation serveur des entrées, protection des écritures et sauvegarde
dont la restauration est testée. Aucun mot de passe ni secret dans le frontend.
La session actuelle de sas autorise une application ; elle ne fournit pas à elle
seule une identité métier et des droits par client/projet.

TBD — accès pour le responsable seul, équipe interne ou clients ; raccordement
de l'identité et des droits ; stockage et quotas réellement disponibles ; durée
de conservation et procédure de sauvegarde ; budget et charge du lot. La piste
PHP/MySQL sur l'hébergement existant reste une proposition, pas une installation.
Respecter la frontière V1/V2 et qualifier ce nouveau périmètre avant activation.

Recette minimale proposée : deux clients, trois projets dont deux pour un même
client ; changements isolés ; fermeture/réouverture et deuxième navigateur ;
écritures concurrentes ; panne d'enregistrement sans perte ; refus anonyme et
refus d'accès à un autre projet ; export/reprise et restauration de sauvegarde.
Utiliser des données fictives jusqu'à qualification de ces protections.

## Gantt et préproduction ciblée — 28 octobre 2026

- Alignement au défilement ; projets repliables avec synthèse calendrier.
- Repère du jour daté, correct dans les deux zooms et sans interception des gestes.
- Dates et ordre modifiables par glisser-déposer/clavier avec proposition puis application.
- Préserver dépendances, statuts, détails et validations ; refuser les éditions périmées.
- Annuler le geste ou le dernier déplacement de la session, sans écraser une autre saisie.
- Livrer uniquement les quatre fichiers du planning sur la racine de préproduction vérifiée.
- Sauvegarder/restaurer en copie privée, refuser toute dérive avant écriture.
- Préserver index, règles d'accès, sas, configuration, bases et production.
- Importer le JSON sur la nouvelle origine ; ne pas annoncer une persistance partagée.

## Extension de revue locale

- Lire les livrables du chantier connecté sans créer une seconde référence.
- Exiger décideur, commentaire, confirmation et, pour approuver, lecture de chaque
  livrable et vérification explicite de chaque critère de sortie.
- Distinguer observation, correction, remise, approbation, accord de passage et démarrage.
- Conserver état et preuves sur disque, avec le journal des décisions remplacées.
- Refuser une révision périmée, une phase non autorisée et les chemins hors du dossier.
- Bloquer le passage après modification d'un livrable approuvé depuis l'interface.
- Actualiser les vues dérivées ou signaler leur échec après une sauvegarde réussie.
- Tester sur des données fictives ; ne pas auto-approuver l'audit réel.
- Conserver le planning et exclure service et données de revue du build hébergé.
- Afficher la PR principale et les revues complémentaires de la phase depuis les
  métadonnées locales contrôlées, sans dupliquer une référence ni remplacer les
  preuves acquises. Le constat daté n'est pas une synchronisation GitHub.

Le service de revue est un outil local de développement. L'identité est
déclarative, sans authentification multiutilisateur. Le contrat est dans
[api/revue-locale.md](api/revue-locale.md). Les contraintes de navigateur
ci-dessous concernent le planning ; les décisions de revue sont stockées sur disque.


## Fonctionnel

- Configurer départ, cible et capacité hebdomadaire.
- Conserver les charges décimales ; réserver zéro aux jalons.
- Proposer un modèle séquentiel par défaut et un mode dépendances explicite.
- Valider IDs uniques, références existantes et graphe sans cycle.
- Refuser l'import invalide sans perte et confirmer le remplacement valide.
- Reprendre un brouillon versionné, exporter/importer un JSON complet.
- Conserver l'échange CSV neuf colonnes et l'import XLSX historique.
- Charger le pilote seulement dans le local admissible, sans écraser de brouillon.
- Conserver les données pilote hors du build public.
- Afficher l'objectif, les actions, les critères attendus et les références de chaque fiche.
- Distinguer réalisation et validation d'une étape ; exiger preuve, vérificateur
  et horodatage explicites avant validation, sans modifier automatiquement le lot.
- Conserver les fiches existantes lors de l'enrichissement du pilote et préserver
  durée, progression, paramètres, dates et autres modifications utilisateur.
- Suivre les causes, conséquences, qualification, prévention, réaction et revue
  des risques ; présenter la préqualification du pilote comme indicative et
  conserver le statut À qualifier tant que la revue humaine n'est pas consignée.
- Exiger une qualification, un responsable, une preuve et une date de revue pour
  résoudre ou accepter un risque, sans déduire ces informations de la checklist.
- Garder le JSON comme sauvegarde complète et expliciter ce qui manque au CSV.
- Afficher le document local des étapes comme texte, sans interprétation HTML.

## Contraintes techniques

Le métier reste côté navigateur, sans backend métier, MySQL, compte ni secret.
Validation et calcul doivent être testables sans DOM. Le build doit conserver
les points d'entrée et artefacts du sas CONNECT.

Le stockage navigateur ne constitue pas une sauvegarde serveur. Erreurs
d'import, de version ou de quota ne doivent pas conduire à une confirmation
trompeuse.
Les champs détaillés doivent être bornés et les listes avoir des identifiants
uniques. Le JSON normalisé doit respecter les limites de taille du lecteur de
sauvegarde, caractères et octets UTF-8 compris ; voir [data/README.md](data/README.md).

## Recette et hypothèses

Les scénarios sont dans [tests/README.md](tests/README.md). Le pilote de
29,4 jours-personne doit être cohérent avec le départ proposé au 21 septembre,
la cible au 30 octobre 2026 et la capacité de 5 jours-personne par semaine.

Le calendrier est lundi–vendredi ; absences et fermetures restent à renseigner.
Estimations, affectations et dates sont proposées, sans preuve d'exécution.
Les évolutions métier EV du planning ne sont pas réalisées par ce lot.

Les tests moteur, interactions et contrôleur ainsi que la recette locale du
pilote sont consignés dans [l'audit](docs/source-audit.md). Le téléchargement
effectif d'un export JSON et l'import XLSX dans l'interface restent à qualifier.
Le sas hébergé et la disponibilité publique ne font pas partie de cette
qualification locale.
Les tests et la recette ciblée de l'extension fiches/checklists/risques sont
consignés dans l'audit. Ils ne valent pas validation de tous les parcours UI ;
les échanges de fichiers et autres cas restant ouverts y sont explicités.

## Visibilité de la progression des phases

- Présenter toutes les phases, leurs états, dates connues, prochaine action et blocages renseignés.
- Distinguer nombre de phases validées, livraisons historiques et phases actuellement à valider.
- Calculer la disponibilité depuis les livrables effectivement accessibles, sans la confondre avec leur validation.
- Afficher les accords antérieurs fournis par le chantier avec leur provenance et leur date de relevé.
- Conserver les décisions, commentaires et preuves ; l'affichage ne démarre ni n'approuve aucune phase.
- Ne déduire aucun pourcentage d'effort lorsque les données ne le mesurent pas.

## Livrables prévus et progression actualisée

- Présenter les titres, descriptions et preuves attendues facultatifs de chaque
  livrable, même lorsque son fichier n'existe pas encore.
- Distinguer un livrable prévu, un document de travail accessible et une phase
  remise à la revue ; ne jamais déduire une livraison ou une validation de la
  seule présence d'un fichier.
- Actualiser le snapshot toutes les 25 secondes lorsque la page est visible et
  au retour au focus/à la visibilité, sans mutation automatique du chantier.
- Préserver commentaire, décideur, phase et document sélectionnés s'ils sont
  encore disponibles ; signaler une panne du service sans effacer les brouillons.
- Annuler uniquement les attestations des phases dont les preuves ou le contexte
  de revue pertinent ont changé, y compris par leurs dépendances ; détecter un
  fichier modifié même si le JSON est inchangé.
- Ignorer une ancienne réponse de lecture qui termine après le début d'une
  écriture ; garder les contrôles de concurrence existants côté service.
