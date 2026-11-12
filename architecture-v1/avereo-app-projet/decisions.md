---
project: avereo-app-projet
document_type: decisions
title: Décisions de Projet
status: active
version: git
created: 2026-09-19
updated: 2026-11-11
owner: jpdandin
tags:
  - projet
  - decisions
---

## 11 novembre — Git fait autorité pour les développements

Contexte : l’export sans répertoire Git a été utilisé comme point de référence. Décision du responsable : utiliser un clone complet sur main avec historique et conserver l’export comme archive. Conséquences : chemins du clone explicitement qualifiés, libellés distincts, générateur versionné et conservation des suivis/livraisons. L’interface ne lance aucun fetch ni opération locale.


## 2026-11-09 — qualification annotative et collecte par opérateur

Contexte : références hors copie de travail, critères non reliés et demande de dernières fusions. Décision : autoriser des fichiers exacts scellés dans une qualification privée, conserver les décisions originales et afficher les documents comme contexte non concluant. Collecter GitHub explicitement sur le poste avec l’identité CLI existante ; transmettre le résultat dans la projection privée plutôt qu’introduire un jeton serveur. Conséquences : pas d’écriture métier, source modifiée = qualification à revoir, données réelles exclues de Git/CI, exploitation hébergée à qualifier séparément. [Guide](docs/preuves-et-actualisation-github.md).

## 2026-11-09 — observation distante distincte du journal métier

Contexte : l’audit détecte des PR périmées et des itérations non projetées. Décision : afficher une observation GitHub datée en surcouche consultative, sans réécrire les JSON sources ; sélectionner les itérations par identité plutôt que position. Raisons : préserver les travaux et validations, ne pas transformer merge/CI en accord de phase. Conséquences : copies locales conservées, collecte ponctuelle distincte du rafraîchissement de page, contrôle hébergé non réalisé. [Guide](docs/coherence-github-locale.md).

## 2026-11-08 — Préparation inactive sans automatiser l'installation

Contexte : premier lot local autorisé, aucune modification du serveur. Décision : conserver le runtime d'accès, centraliser les trois modèles et le plan de préparation dans les sources du constructeur, avec secrets vides, configuration désactivée et blocage de livraison explicite. Raisons : ne pas confondre paquet de code, habilitation réelle et accord de livraison ; ne pas exposer de données par commodité de préparation. Conséquences : publication/restauration hébergées et protection contre suppression rsync restent à qualifier/autoriser ; aucune configuration privée réelle ni workflow public modifié. [Guide](docs/preproduction-developpements.md).

## Reprise — session Projet et préparation de préproduction

Contexte : préparer une consultation depuis la session Projet réelle sans déploiement. Décision locale : réutiliser cookie/sas/propriétaire existants ; exiger le pont global et servir aussi les assets derrière l'autorisation. Construire un paquet PHP/React séparé, sans remplacer le Gantt ni y ajouter automatiquement le menu. Raisons : pas de compte parallèle, pas de protection limitée au menu, pas de régression du planning depuis une copie ancienne. Conséquences : installation coordonnée et configuration privée restent à qualifier ; activation de production refusée. [Guide](docs/preproduction-developpements.md).

## 7 novembre — pont et stockage, état local courant

Contexte : préparer le cockpit privé durable sans installation distante. Décision locale : autorité Drupal courante, propriétaire exact, deux clés de frontière et contrôle par requête, sans modifier le ticket existant ; copie signée avec séquence haute et preuves opt-in, sans retour métier. Raisons : ne pas assimiler `owner` à global ni conserver un accord révoqué. Conséquences : accès réel actuel par capacité privée du poste ; lecteur Node n'est pas un SSO. Hébergement et migration privée des sources restent des étapes distinctes. [Contrat et limites](docs/pont-stockage-local.md).

# Décisions de Projet

## 2026-11-07 — Recherche/RGA et fraîcheur par projection canonique

**Contexte.** Recherche possède une recette dans le lot Missions ; RGA possède un correctif isolé dans `correctiveDeployment` du suivi des fonctions communes. Les afficher comme des suivis absents masque des sources existantes, mais les recopier ou leur attribuer le statut du parent serait trompeur.

**Décision.** Référencer ces sources dans le registre et autoriser une projection privée uniquement consultative par propriété propre. Respecter phase, candidats, accords et preuves de chaque portée. Comparer les dates déclarées avec leurs fuseaux et conserver la provenance par empreinte et heure de lecture. Ne pas déduire une version hébergée ou un candidat absent.

**Conséquences.** Douze applications ont un suivi lisible sur onze JSON, sans nouvel historique manuel ni modification de leurs sources. La fraîcheur est qualifiée par rapport au poste uniquement ; le SSO, GitHub distant et les hôtes ne sont pas requalifiés.

## 2026-11-07 — Consultation locale privée du portefeuille, sans SSO

**Contexte et accord.** Le responsable demande un cockpit utilisable pour toutes les applications et confirme « Oui, accès privé local et lecture seule ». Le SSO CONNECT réel reste distinct.

**Décision.** Réutiliser le garde privé existant, un registre de chemins qualifiés et des sources `writable: false`. Observer Git local sans fetch et distinguer les livraisons déclarées par lot d'une version complète mesurée sur l'hôte. Conserver les inconnues et les mappings historiques.

**Conséquences.** Aucun droit CONNECT ni accès distant n'est ajouté. Les clés temporaires sont protégées par ACL du compte Windows courant et SYSTEM ; la confiance dans le poste reste nécessaire. Les sources des autres chats ne sont pas modifiées. Les versions hébergées actuelles et les deux suivis dédiés manquants restent à qualifier. [Guide](docs/cockpit-portefeuille.md).

## 2026-11-06 — Développements réservés au propriétaire et réalisation locale fermée

**Contexte.** Le responsable autorise le développement local du module en exigeant que lui seul, administrateur global, puisse consulter les développements en cours. Aucun déploiement n'est autorisé. Le ticket CONNECT inspecté ne porte pas le rôle global.

**Décision de réalisation locale.** Ajouter un lanceur privé distinct, protéger toutes ses ressources et épingler l'identifiant propriétaire côté serveur. Utiliser une capacité locale temporaire, sans lui attribuer une valeur de preuve du rôle CONNECT. Recetter les mutations sur fixtures uniquement. Les adaptateurs lisent les suivis existants ; les décisions individuelles sont activées seulement par opt-in de la source et enregistrées dans le même JSON.

**Raisons et conséquences.** Un simple menu masqué ou un rôle envoyé par le navigateur n'est pas une protection. Les autres profils, y compris un autre administrateur global, sont refusés. L'hébergement reste fermé : qualifier l'identité réelle et le pont de données avant toute livraison distinctement autorisée. Le module privé est exclu du build hébergé ; aucune nouvelle permission CONNECT ou publique n'est créée. [Contrat et limites](api/developpements-local.md).

## 2026-11-06 — Réutiliser les résultats existants et rendre la vérification optionnelle

**Contexte.** Le responsable approuve la simplification de la fiche et du planning après la PR #112.

**Décision.** Conserver le schéma du planning : une entrée de checklist correspond à un résultat cochable. Une section réalisée n’est pas une vérification humaine et ne termine pas la tâche. La vérification complémentaire et la saisie de date contrainte sont des préférences d’affichage, désactivées par défaut. Les preuves, dates actives et textes historiques restent conservés.

**Raisons et conséquences.** Éviter une migration inutile, préserver les échanges JSON et garder une action explicite pour la vérification. Les cellules de calendrier sont agrégées par période réelle, avec la borne existante de 3 660 jours. Le retour arrière après enregistrement de nouvelles préférences requiert un lecteur compatible ; ne pas restaurer un ancien catalogue complet qui écraserait les projets créés depuis.


## 2026-11-06 — Séparer classement, affichage et ordonnancement

**Contexte.** Le regroupement P1 Revenu masque visuellement l’emploi ; les colonnes fixes tronquent les intitulés. Le responsable ne tranche pas entre candidatures et continuité des ressources.

**Décision.** Conserver ordre et dates. Proposer un sujet et une priorité visibles, avec confirmation ou correction dans la fiche. Conserver les anciens documents sans ajouter implicitement de métadonnées. Enregistrer les largeurs par navigateur et garder les filtres temporaires.

**Raisons et conséquences.** La priorité métier ne se confond ni avec le risque ni avec une modification de calendrier. Les propositions peuvent être erronées et restent signalées. Un reclassement explicite est sauvegardé avec la tâche ; un filtre ne modifie aucune donnée. Recharger les anciens onglets avant de saisir les nouveaux champs.


## 2026-11-05 — Déconnexion dans le menu de compte

**Contexte.** Le lien injecté par `index.php`, fixe en bas à droite avec un z-index maximal, recouvre le formulaire du Gantt. Le responsable confirme le maintien de Mon espace en bas à gauche.

**Décision.** Retirer uniquement cette injection et proposer la route existante dans un menu natif du compte, ouvrant au-dessus de la barre.

**Conséquences.** La session reste contrôlée par le sas existant ; la déconnexion quitte l’iframe par `_top`. Échap et le clic extérieur ferment le menu. Aucun changement de données ou de droits.


## 2026-11-05 — Conserver les données de planning hors du dépôt public

**Contexte.** Une PR est demandée pour intégrer un contenu de planning personnel dans la dernière version de Projet ; Mon espace permet déjà l’import indépendant.

**Décision.** Versionner la préparation et la procédure génériques, conserver la source et son paquet privé hors Git, et préparer l’import dans un nouveau projet.

**Raisons.** Protéger les informations privées et éviter le remplacement du document courant par un export antérieur.

**Conséquences.** La PR ne contient pas le planning réel et ne l’installe pas. L’import ultérieur utilise l’API existante après accord sur le fichier et la cible. [Procédure](workflows/import-prive.md).


## 2026-11-05 — Catalogue de projets du propriétaire

**Contexte.** Après la sauvegarde du Gantt, le responsable demande une page liée
au compte pour retrouver plusieurs projets en ligne et les réglages essentiels.

**Décision.** Prolonger le stockage privé JSON avec un catalogue et des dossiers
indépendants. Conserver le Gantt actuel en place sous l’identifiant `principal`.
Utiliser une référence client libre, des archives réversibles et les comptes CONNECT.

**Raisons.** Le service existant fournit déjà l’identité, les révisions et les
copies de récupération. Un nouveau système de comptes ou une base SQL n’apporte
rien au périmètre personnel demandé.

**Conséquences.** Les lots du Gantt ne deviennent pas des dossiers clients.
La limite est de 100 projets, archives comprises. Le retour arrière restaure le
code et conserve les documents créés entre-temps ; l’ancienne interface ne liste
alors que le projet principal. Une panne pendant la publication du catalogue peut
laisser un dossier privé non listé, récupérable manuellement, sans écraser un projet.


## 2026-11-05 — Sauvegarde privée du Gantt actuel

**Contexte.** Le responsable constate des plannings différents selon le navigateur
et demande l'enregistrement en ligne puis sa mise en place en préproduction.
L'usage privé réservé au propriétaire était confirmé le 29 octobre.

**Décision.** Livrer le premier service V2 en PHP avec documents JSON privés,
verrou, révision, écriture atomique et copies de récupération. Réutiliser
l'identité signée conservée par le sas de la PR #106. Garder l'ancien brouillon.

**Raisons.** Le besoin actuel porte sur un Gantt personnel complet. Une base SQL,
des accès d'équipe et un registre clients ne sont pas nécessaires pour ce lot.

**Conséquences.** Le JSON reste exportable et portable ; le serveur devient la
référence après confirmation. Les conflits demandent un choix explicite après
export. Les versions tournantes ne remplacent pas une sauvegarde indépendante.


## 2026-09-24 — Revue dans l'outil de développement local

**Contexte.** L'utilisateur demande la revue et l'approbation directes dans
Projet, avec une version locale et son workflow de développement.

**Décision.** Ajouter l'espace de revue et un middleware de développement
sur boucle locale. Écrire dans le JSON existant du chantier, en conservant
événement, empreintes, sauvegarde et verrou. Séparer l'approbation de phase,
l'accord de passage et le démarrage ; conserver le planning distinct.

**Raisons.** Rendre les décisions durables et disponibles à la reprise,
avec une seule référence et sans changer le périmètre hébergé. Une copie
du suivi dans le stockage du planning créerait une divergence.

**Conséquences.** Node et Python nécessaires. Identité déclarative et journal
modifiable par le propriétaire des fichiers. Aucun accord GitHub, fusion,
publication ou démarrage d'agent n'est déduit d'une décision locale.
Voir [le workflow](workflows/revue-developpement.md).


## 2026-09-19 — Maintenir le métier dans le navigateur

**Contexte.** Le frontend et les instructions locales maintiennent une V1 sans
backend métier.

**Décision.** Ajouter validation, calendrier, brouillon local et reprise JSON.

**Raisons.** Rendre le planning utilisable sans infrastructure ou compte nouveau.

**Conséquences.** Données propres à l'origine du navigateur, pas de partage
serveur ; conserver une copie indépendante par export.

## 2026-09-19 — Séparer charge et calendrier de démonstration

**Contexte.** Les dates historiques sont figées en 2024 et les durées importées
sont tronquées.

**Décision.** Dates/capacité configurables, fractions conservées, calcul
séquentiel par défaut.

**Raisons.** Respecter une capacité commune sans inventer de parallélisme.

**Conséquences.** Le mode dépendances représente une autre hypothèse ; ses
chevauchements ne garantissent pas la disponibilité des personnes.

## 2026-09-19 — Source unique et diffusion locale du pilote

**Contexte.** JSON, CSV et paramètres peuvent diverger s'ils sont maintenus à part.

**Décision.** Source `data/planning-pilote.json`, génération sous
`data/generated/`, endpoints Vite uniquement en développement.

**Raisons.** Garantir la cohérence et ne pas embarquer ce pilote dans le site publié.

**Conséquences.** Ne pas corriger manuellement les dérivés ; vérifier leur
absence dans `dist/` et le chargement initial sans écrasement de brouillon.

## 2026-09-19 — PR brouillon avant toute publication

**Contexte.** Un merge sur `main` peut déclencher le déploiement Projet.

**Décision.** Branche dédiée et PR brouillon pour la recette locale.

**Raisons.** Préserver la revue et l'autorisation humaines.

**Conséquences.** Aucun merge/déploiement dans cette intervention ; l'approbation
ultérieure doit tenir compte du déclencheur automatique existant.

## 2026-09-19 — Séparer fiches de référence et suivi local

**Contexte.** Les lots doivent expliquer les actions attendues et permettre de
consigner leur vérification sans effacer le suivi commencé.

**Décision.** Conserver les fiches structurées dans la source JSON du pilote et
leurs références documentaires ; générer leurs représentations et stocker les
modifications et preuves dans le projet local. Ajouter les fiches absentes d'un
pilote reconnu et compléter uniquement les préqualifications restées dans leur
état initial, selon les conditions du contrôleur.

**Raisons.** Donner un point de départ documenté et conserver les saisies humaines.

**Conséquences.** Une fiche partiellement remplie n'est pas écrasée. Le JSON de
sauvegarde conserve tous les détails ; le CSV reste au format neuf colonnes.

## 2026-09-19 — Garder des états de suivi distincts

**Contexte.** Réaliser une action, vérifier son résultat et traiter un risque
ne constituent pas la même opération.

**Décision.** Séparer réalisation, validation documentée, avancement du lot et
qualification du risque. Une validation ou clôture exige les informations
explicites prévues par le modèle, sans transition automatique entre ces états.

**Raisons.** Éviter qu'un préchargement ou un calcul de score atteste un travail
ou une décision qui n'a pas été consigné.

**Conséquences.** Les risques initiaux restent à qualifier ; le suivi et sa
validation restent humains, sans authentification propre du vérificateur.
