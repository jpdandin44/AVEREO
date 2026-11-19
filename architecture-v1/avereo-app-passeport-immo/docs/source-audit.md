---
project: avereo-app-passeport-immo
document_type: source-audit
title: Audit source Passeport Immo
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [passeport-immo, audit, local]
---

# Audit source Passeport Immo

## Sources et hiérarchie
1. `../avereo-app-connect/frontend/src/App.jsx` (1230 lignes) : comportement.
2. Synthèse §1 : fonctionnalités ; §3 identique après normalisation. §2 cible future exclue.
3. Archives : 44 fichiers après extraction des deux ZIP imbriqués, hors Git.
4. Prototype racine et maquette : versions différentes, comparaison dans la phase 0.
5. Projet : service de revue existant et modèle du site.

## Dépendances et API navigateur
`App.jsx:1` : React/Zustand ; CDN PapaParse 5.3.2, jsPDF 2.5.1, html2canvas 1.4.1 (`:1209`).
`localStorage` (`:126`), FileReader/base64 (`:703`), capture canvas (`:815`),
Web Share (`:859`) et repli copie URL (`:863`). Aucun appel API métier dans ce code.
Classes Tailwind présentes, configuration absente du frontend historique.

## Archives consultées et limites
SRC-01–03 : propositions historiques de coffre documentaire et fusion métier.
SRC-04–05 : tableurs de chiffrage historiques, non repris comme catalogue.
SRC-06–19 et SRC-30–35 : captures d’anomalies ; présence inventoriée, comparaison visuelle à recetter.
SRC-20–26 : documents/échanges historiques et scans ; ne constituent ni contrat actif ni choix technique.
SRC-27–29 : bilans de campagne/itération ; références MVP-REQ, résultats d’une autre version.
SRC-36 : structure du jeu utilisateurs examinée ; aucune identité ou valeur importée.
SRC-37–44 : tests et stratégies de use cases, rattachés dans la matrice de phase 0.
Les PDF textuels et XML des DOCX/XLSX ont été lus sans modifier les originaux.
Certains PDF produisent des avertissements d’objets ; le scan SRC-26 n’expose pas de texte exploitable.
L’inspection des données ne valide pas le rendu d’un DOCX/XLSX ni l’application historique.

## Anomalies et limites observables dans le React
| Sujet | Preuve historique | État |
|---|---|---|
| Authentification et abonnement | `App.jsx:142`, `:146` | Simulés, profil admin/pro imposé ; erreurs mot de passe historiques non comparables |
| Partage | `App.jsx:851` | URL seulement, aucune sérialisation du bien ni expiration |
| Surfaces | `App.jsx:691`, `:1021` | >0 à l’ajout ; pas de validation métier avancée |
| Mise à jour estimation | `App.jsx:716` | Recalcul via biens/tarifs/gamme ; recette navigateur nécessaire |
| Modification pièce | `App.jsx:884`, `:898` | Édition interventions seulement ; nom/surface de pièce non éditables |
| Unités de calcul | `App.jsx:735` | h/ml donnent 0 ; import CSV les traite parfois comme unité |
| Deux pièces homonymes PDF | `App.jsx:789` | Lignes groupées par nom, duplication possible |
| Suppression catalogue | `App.jsx:133` | Les tarifs intégrés sont fusionnés au rechargement et peuvent réapparaître |
| Fenêtre bien | `App.jsx:992` | Retour avant hooks conservé ; aucune erreur reproduite en création/édition locale ; autres parcours à recetter |
| PDF | `App.jsx:845` | Nom adresse ; pas de nom de devis ni TVA indépendante |
| Stockage | `App.jsx:210` | Pièces jointes base64 en localStorage ; quota et multi-poste non gérés |

Les attentes serveur de SRC-37 et SRC-40 (Stripe, invitation, accès temporaire,
notifications, paiement et rapports) sont absentes de ce React ; elles restent hors reprise.
Les questions et prochaines actions sont centralisées dans le suivi JSON.

## Vérification de la reprise locale
Le contrôle inverse a/b/c vérifie l'identité du comportement source et des classes.
Les observations navigateur et les tests sont consignés dans
[le livrable local](01-reprise-identique.md). Le PDF fictif téléchargé affiche les
montants et l'image sur la première page, puis une page blanche (Q09). Le code de
pagination historique est conservé ; le même symptôme n'a pas été vérifié dans
un runtime historique distinct.

## Actualisation après demande de correction
L'observation de deux pages ci-dessus concerne le candidat initial `1ceb70a`.
Le responsable a ensuite autorisé le correctif PDF d. Le même dossier fictif donne
une page A4 complète après correction ; quatre tests couvrent arrondi blanc, pixel
final de contenu et documents de deux/trois pages. Le contrôle inverse a/b/c+d
retrouve le code historique pour tous les autres comportements et classes.
Voir les [preuves et limites](raccordement-cockpit.md).
