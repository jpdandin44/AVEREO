---
project: avereo-app-saisie-unique
document_type: recette-sheet
title: Fiche de recette de UNI en préproduction
status: draft
version: git
created: 2026-11-23
updated: 2026-11-23
owner: jpdandin
tags: [avereo, uni, preproduction, recette, connect]
---

# Fiche de recette de UNI en préproduction

Fiche à dérouler par le responsable sur `https://uni-preprod.avereo.fr/`. Elle reprend les contrôles R1 à R12 du
[plan d'installation](plan-installation-preproduction.md). Les résultats ci-dessous sont **vides** : seul le responsable
les renseigne. Cette fiche ne vaut ni recette acquise, ni autorisation de merge.

## Avant de commencer

- Compte de démonstration autorisé sur CONNECT préproduction, avec le droit `uni:use`. Un second compte **sans** ce
  droit sert à R5 (facultatif).
- Navigateur : Chrome. Edge n'est pas qualifié. Utiliser une fenêtre normale (le stockage du navigateur doit fonctionner).
- Données : **uniquement fictives**. Aucune donnée de dossier réel, aucune capture montrant des données réelles.
- Un ticket de lancement CONNECT est un justificatif de connexion valable quelques dizaines de secondes. Ne le
  collez ni dans le chat, ni dans une PR, ni dans un fichier.
- Version attendue : fichier installé le 21/11/2026, SHA-256 `private/app.html` commençant par `fadd2649…` (voir le plan).
- Durée : environ 15 minutes pour R1 à R2 et R6 à R12 ; R3 à R5 demandent les outils de développement du navigateur.

## Déroulé

| # | Contrôle | Comment | Attendu | Déjà constaté |
|---|---|---|---|---|
| R1 | Accès direct sans session | Fenêtre privée, ouvrir `https://uni-preprod.avereo.fr/` | Redirection vers l'écran de connexion CONNECT ; aucune page UNI | Oui, le 23/11 (redirection `?app=uni`) ; à refaire en navigateur |
| R2 | Ouverture depuis la tuile | Se connecter à CONNECT, ouvrir la tuile UNI | UNI s'affiche (tableau de bord) ; la tuile est présente | Tuile visible selon le responsable |
| R3 | Ticket rejoué | Avant R2, ouvrir les outils de développement (F12), onglet Réseau, cocher « Conserver le journal ». Cliquer la tuile. Copier l'URL de la requête `connect/entry.php?ticket=…`, l'ouvrir dans un nouvel onglet | Message « L'autorisation AVEREO CONNECT est invalide ou expirée. », code 403 | Non |
| R4 | Ticket expiré (avancé, facultatif) | Réseau : clic droit sur la requête `entry.php` > « Bloquer l'URL de la requête », cliquer la tuile (ticket non consommé), copier l'URL, attendre plus de 5 minutes, l'ouvrir | Même message, 403 | Non |
| R5 | Compte sans droit (facultatif) | Avec le second compte, chercher la tuile ; tenter l'URL de lancement | Tuile absente ; accès refusé | Non |
| R6 | Déconnexion | Utiliser « Déconnexion » depuis UNI, puis rouvrir `https://uni-preprod.avereo.fr/` | Retour au portail CONNECT, puis UNI inaccessible sans nouvelle connexion | Non |
| R7 | Parcours métier | Tableau de bord, ajouter le dossier de démonstration, ouvrir sa fiche : 5 onglets (Administratif, Projet, Financement, Énergie, Travaux). Tester la recherche (nom, commune, programme, numéro), les alertes, programmes, territoires. Geler le devis, vérifier le plan Factures, modifier, constater que le devis reste figé. Recharger la page | Conforme à [demo-2026-11-23.md](demo-2026-11-23.md) ; les dossiers sont toujours là après rechargement | Local seulement |
| R8 | Documents | Ouvrir les aperçus des 13 documents. Générer les 12 modèles PDF/Word. Imprimer la synthèse UNI en PDF | Fichiers générés avec la mise en page d'origine et les en-têtes PDF conservés ; refus clair si trop de postes ou texte trop long. Cases, signatures, pièces et photos restent à contrôler à la main | Local seulement |
| R9 | Sauvegarde et réimport | Dans la liste, « Exporter les dossiers » (fichier JSON), puis « Importer une sauvegarde… » avec ce fichier | Les dossiers sont ajoutés sous de nouveaux identifiants, sans remplacer les existants ; un fichier illisible est refusé en entier | Échec en Chrome local, réussite en CI ; jamais sur la cible |
| R10 | Console et réseau | F12 pendant R7 à R9 | Aucune erreur JavaScript ; aucune requête vers un autre domaine que `uni-preprod.avereo.fr` (CONNECT hors ticket) | Local seulement |
| R11 | Mobile | Mode appareil du navigateur, largeur 375 px, parcourir le tableau de bord et une fiche | Pas de débordement horizontal ; actions utilisables | Local seulement |
| R12 | Cible réservée | Vérifier avec CONNECT que seuls les comptes de démonstration ont le droit `uni:use` | Aucun compte réel dans le périmètre | Non |

## Résultats (à remplir par le responsable)

| # | Résultat (OK / KO / non fait) | Date et heure | Navigateur | Remarque ou écart |
|---|---|---|---|---|
| R1 |  |  |  |  |
| R2 |  |  |  |  |
| R3 |  |  |  |  |
| R4 |  |  |  |  |
| R5 |  |  |  |  |
| R6 |  |  |  |  |
| R7 |  |  |  |  |
| R8 |  |  |  |  |
| R9 |  |  |  |  |
| R10 |  |  |  |  |
| R11 |  |  |  |  |
| R12 |  |  |  |  |

## Preuves

Conserver hors dépôt ou sans donnée réelle : captures de R2, R3, R6, R8 (fichiers générés), R9 et de la console en R10,
heure de la recette. Ne jamais conserver d'URL contenant un ticket.

## Limites de cette fiche

- Elle ne remplace pas les validations humaines existantes de la phase 2.
- Le rendu des Word n'est pas garanti : l'ouverture dans Word reste à faire à la main.
- Les modèles sont ceux fournis, sans attestation de validité réglementaire actuelle.
- Le stockage métier reste local au navigateur : vider ses données efface les dossiers.
- En cas d'échec, noter l'écart dans la colonne « Remarque » et ne pas modifier la cible : le retour arrière est décrit
  dans le plan d'installation.
