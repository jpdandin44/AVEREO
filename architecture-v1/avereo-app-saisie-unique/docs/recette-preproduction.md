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

Fiche à dérouler sur `https://uni-preprod.avereo.fr/`. Elle reprend les contrôles R1 à R12 du
[plan d'installation](plan-installation-preproduction.md). Les résultats sont ceux d'une première passe partielle (voir plus bas) ; la validation reste humaine.
Cette fiche ne vaut ni recette acquise, ni autorisation de merge.

## Avant de commencer

- Compte de démonstration autorisé sur CONNECT préproduction, avec le droit `uni:use`. Un second compte **sans** ce
  droit sert à R5 (facultatif).
- Navigateur : Chrome. Edge n'est pas qualifié. Utiliser une fenêtre normale (le stockage du navigateur doit fonctionner).
- Données : **uniquement fictives**. Aucune donnée de dossier réel, aucune capture montrant des données réelles.
- Un ticket de lancement CONNECT est un justificatif de connexion valable quelques dizaines de secondes. Ne le
  collez ni dans le chat, ni dans une PR, ni dans un fichier.
- Version attendue : première passe sur le fichier installé le 21/11/2026 (SHA-256 `private/app.html` `fadd2649…`) ; seconde passe sur le candidat installé le 23/11/2026 (`dcb934db…`, voir la procédure de remplacement).
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

## Résultats

Passe du 23 novembre 2026, réalisée par Claude dans le navigateur intégré, sur le compte CONNECT `avereo_admin`
(organisation AVEREO, compte administrateur : ce n'est pas un compte de démonstration dédié), Chrome embarqué.
Heure détaillée non relevée. Résultats constatés, **pas une recette validée** : la validation reste humaine.

| # | Résultat | Navigateur | Remarque ou écart |
|---|---|---|---|
| R1 | OK (hors navigateur) | curl, sans session | `https://uni-preprod.avereo.fr/` répond 303 vers `https://connect-preprod.avereo.fr/?app=uni` ; refait en fenêtre privée navigateur : non fait |
| R2 | OK | Chrome intégré | La tuile « AVEREO UNI » est dans les applications autorisées de CONNECT ; son lancement ouvre UNI (« Saisie unique », bandeau « Données fictives ») |
| R3 | Non fait | — | Le ticket de lancement est consommé par la redirection et n'est pas lisible dans cet environnement. Contrôle partiel : `connect/entry.php` avec un ticket invalide ou sans ticket répond 403 « L'autorisation AVEREO CONNECT est invalide ou expirée. » |
| R4 | Non fait | — | Même limite que R3 |
| R5 | Non fait | — | Pas de second compte sans droit |
| R6 | Non fait | — | Déconnecterait la session CONNECT du responsable ; à faire avec son accord |
| R7 | Partiel | Chrome intégré | Dossier de démonstration ajouté, fiche ouverte (5 onglets, 13 aperçus, « Plan équilibré » 12 400 €). **Gel du devis OK** : dans l'onglet Financement, la barre « Plan Devis / Plan Factures » porte « Figer au dépôt… » ; après confirmation, « Plan Devis · figé le 23/11/2026 », plan Factures créé et modifiable, bouton disparu, 45 des 53 champs de la vue Devis verrouillés, « Attestation (factures) » et « Rapport de fin » deviennent disponibles. Recherche, alertes, programmes, territoires et rechargement non vérifiés. Rectification : ma première passe avait écrit que l'action restait introuvable ; je ne l'avais pas cherchée dans le bon onglet |
| R8 | Partiel | Chrome intégré | Avant gel : 9 modèles remplis téléchargés (7 PDF, 2 Word, `UNI-DEMO-*-devis`, de 49 Ko à 3,3 Mo) et enregistrés ; après gel : 2 Word de plus générés (`UNI-DEMO-ATF-factures.docx` 108 529 octets, `UNI-DEMO-RFA-factures.docx` 62 925 octets), restés en fichiers temporaires dans Téléchargements ; leurs copies sont des archives Word valides sans champ de fusion restant. Soit 11 modèles utilisables sur 12. **Défaut confirmé dans le code** : « Procuration (fonds) » est désactivée car la fiche la déclare sous l'identifiant `PRP` (`documents.js`, ligne 331) alors que le pack la range sous `PRF` (`workflows/preparer-modeles.py`, lignes 93 et 96) ; l'interface cherche `pack.documents[doc.id]` (`FormulaireOriginal.jsx`) et affiche « Modèle original non embarqué dans cette édition ». Le chat UNI indique que le pack embarque bien 12 modèles (8 PDF, 4 Word) et reproduit le défaut sur la copie locale de même empreinte. « Synthèse du logement » reste hors des 12 (Imprimer). Impression, ouverture des Word, mise en page, en-têtes PDF, cases et signatures : non vérifiés |
| R9 | OK avec réserve | Chrome intégré | Export `avereo-uni-sauvegarde-2026-11-23.json` (7 695 octets, format `avereo-uni-sauvegarde` version 1, 2 dossiers). Réimport : 2 dossiers ajoutés, 4 au total, les existants conservés. Réserve : le fichier a été fourni à l'application par script (le sélecteur de fichiers natif n'est pas pilotable), pas par le sélecteur du navigateur |
| R10 | OK avec réserve | Chrome intégré | Aucune erreur dans la console ; aucune ressource externe chargée ; politique de sécurité `connect-src 'none'` en place ; clé `avereo-uni-dossiers` utilisée. Réserve : la console n'était observée que depuis le chargement de la page |
| R11 | **KO** | Émulation 375 px | Le tableau de bord tient dans 375 px, mais la liste « Dossiers » déborde : la page s'élargit à 536 px et les colonnes Statut et Programme sont coupées |
| R12 | Non fait | — | À confirmer dans CONNECT par le responsable |

Effets de la passe : le stockage du navigateur intégré contient maintenant 4 dossiers fictifs (`avereo-uni-dossiers`, dont 2 doublons issus du réimport ; le dossier de démonstration utilisé a son devis figé) ;
12 fichiers fictifs sont dans le dossier Téléchargements du poste (9 modèles, 1 sauvegarde, 2 Word en fichiers temporaires `.tmp`) ;
aucune donnée réelle, aucune modification de la cible ni de CONNECT.

## Seconde passe : après remplacement du candidat

Passe du 23 novembre 2026, même compte `avereo_admin`, Chrome intégré, après installation du candidat
`dcb934dbcd36b969687e04529edb42d4d57e9126f3b312bfb4912d4b4721504a` (commit source `171f711`, PR #184 et #185 fusionnées).
Constats, **pas une recette validée**.

| # | Résultat | Remarque |
|---|---|---|
| R1 | OK (hors navigateur) | curl sans session : 303 vers `https://connect-preprod.avereo.fr/?app=uni` ; `connect/entry.php` sans ticket : 403 |
| R2 | OK | CONNECT rouvert, lancement depuis la tuile « AVEREO UNI » (le lien s'ouvre dans un nouvel onglet que le panneau bloque : adresse de lancement ouverte dans l'onglet courant) ; la page servie contient le pack à 12 codes dont `PRP` |
| R8 | Partiel, écart levé | « Procuration (fonds) » : bouton actif, génération de `UNI-DEMO-PRP-devis.pdf` (téléchargement intercepté, aucun fichier écrit). Impression de la synthèse, Word, mise en page, cases, signatures : non vérifiés |
| R10 | OK avec réserve | aucune erreur dans la console, aucune ressource externe, `connect-src 'none'` présent ; la console n'était observée que depuis le chargement de la page |
| R11 | OK | à 375 px la page tient dans 375 px ; la liste des dossiers défile dans son cadre (293 px visibles pour 589 px de contenu) |

Non refaits dans cette passe : R3 à R7 (hors ouverture et rechargement), R9, R12.

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
