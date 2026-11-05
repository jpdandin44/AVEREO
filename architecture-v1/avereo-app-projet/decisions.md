---
project: avereo-app-projet
document_type: decisions
title: Décisions de Projet
status: active
version: git
created: 2026-09-19
updated: 2026-11-05
owner: jpdandin
tags:
  - projet
  - decisions
---

# Décisions de Projet

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
