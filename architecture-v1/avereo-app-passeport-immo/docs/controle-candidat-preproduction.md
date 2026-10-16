---
project: avereo-app-passeport-immo
document_type: verification-record
title: Contrôle complémentaire du candidat de préproduction
status: active
version: git
created: 2026-10-16
updated: 2026-10-16
owner: jpdandin
tags: [passeport-immo, preproduction, candidat]
---

# Contrôle complémentaire du candidat de préproduction

Le 16 octobre, la demande de livraison des dernières versions de Rapport et
Passeport Immo conduit à recontrôler le candidat installé. La source structurée
de cette opération est le bloc `selected_applications_delivery` du
[suivi transverse de la branche de revue](https://github.com/jpdandin44/AVEREO/blob/chore/preprod-rapport-passeport-20261016/outillage/acces-preproduction/suivi-chantier.json).
Le [compte rendu et ses reçus](https://github.com/jpdandin44/AVEREO/blob/chore/preprod-rapport-passeport-20261016/outillage/acces-preproduction/livraison-rapport-passeport.md)
portent les résultats détaillés et leurs limites.

Les seize fichiers de l'archive `c44f397f…` sont déjà présents et conformes ;
aucun fichier applicatif Passeport Immo n'est réécrit. Le dossier SCI s'ouvre,
les six documents actifs et les trois archives sont conservés et leurs neuf
téléchargements ont les empreintes attendues. Le stockage, les sessions et leur
déconnexion sont contrôlés. La récupération a été répétée sur des copies et
tables temporaires privées, sans modification des données métier actives.

Une réserve reste ouverte : le compte interne 2 a actuellement un droit CONNECT
explicite actif, alors qu'un relevé antérieur attendait son refus. Les droits
individuels sont effectivement contrôlés ; aucun droit n'est modifié par ce lot.
Faire confirmer le périmètre attendu et actualiser le relevé correspondant avant
de présenter la qualification comme dépourvue de réserve.

La décision humaine D06, ses preuves et les quinze documents approuvés restent
intacts. Ce complément n'annule ni ne recrée cette décision. Le code exécutable
est identique au candidat autorisé ; le plan CIL et les outils privés de reprise
SCI de la PR #83 ne constituent pas une nouvelle interface déjà installée.
La phase de Mise en production conserve son suivi propre, ses prérequis et sa
prochaine action. Ce contrôle ne réalise aucune livraison ni ouverture de production.
