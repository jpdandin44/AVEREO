---
project: avereo-app-saisie-unique
document_type: changelog
title: Évolutions de Saisie unique
status: active
version: git
created: 2026-11-06
updated: 2026-11-23
owner: jpdandin
tags: [avereo, saisie-unique, documentation]
---

# Évolutions de Saisie unique

## 2026-11-23

Un brouillon de [plan d'installation en préproduction](docs/plan-installation-preproduction.md) est ajouté. Il n'est pas exécuté et ne vaut pas accord d'installation. Il part d'une hypothèse corrigée le jour même : UNI est déjà présent en préproduction ; l'empreinte du fichier installé est relevée et rapprochée du manifeste d'origine dans le plan (réponse déclarative du chat de fabrication). La tuile UNI est visible dans le catalogue de préproduction selon le responsable ; la recette hébergée reste à faire. Les 46 tests unitaires et le build ont été relancés localement sans changement de code.

Une [fiche de recette](docs/recette-preproduction.md) de la préproduction est ajoutée, avec les résultats d'une première passe partielle du 23 novembre (R11 en échec : la liste des dossiers déborde à 375 px ; R7 : gel du devis OK ; R8 partiel : 11 modèles sur 12 utilisables, « Procuration (fonds) » bloquée par un écart d'identifiant PRP/PRF ; R9 OK).

Le candidat corrigé (PR #184 et #185) est installé en préproduction le 23 novembre : empreinte `dcb934db…`, ancien fichier conservé, [procédure et reçu](docs/procedure-remplacement-preproduction.md). Seconde passe de recette partielle : ouverture depuis CONNECT, procuration (fonds) générable et liste mobile sans débordement, 12 modèles sur 12 générés et parcours R7 OK ; la déconnexion UNI laisse la session CONNECT active, comportement voulu selon le responsable.

## 2026-11-22

La PR #179 est fusionnée : tableau de bord, recherche, alertes, programmes et territoires, préremplissage des modèles PDF/Word privés, entrée UNI dans CONNECT et candidat PHP protégé. [Candidat de démonstration](docs/demo-2026-11-23.md). La mention « publication en préproduction non effectuée » de ce candidat date du 21 novembre ; le 23 novembre, la cible `uni-preprod.avereo.fr` répond derrière CONNECT (empreinte du fichier installé relevée dans le plan).

## 2026-11-06

Le code local de la PR #113 est présent ; [livrable de développement](docs/01-developpement-local.md). Le lot transversal ajoute le menu Mon espace et le socle documentaire de navigation, sans modifier les données ni les événements humains du chantier.
