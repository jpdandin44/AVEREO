---
project: avereo-app-rapport
document_type: functional-specification
title: Interventions proposées après les recommandations
status: active
version: git
created: 2026-11-16
updated: 2026-11-16
owner: jpdandin
tags: [rapport, interventions, habitologue, export, planning]
---

# Interventions proposées

## Cadrage

Le responsable demande le 16 novembre de lancer le prochain lot après la recette Attentes PR159. La priorité 4 du cadrage conservé prévoit une rubrique sous Recommandations, puis un raccordement volontaire à un planning Projet distinct. Cette première tranche porte sur la liste d'interventions dans Rapport ; le raccordement Projet, son Gantt, les droits et les dates/durées constituent le sous-lot suivant.

Réutiliser `decision.actions`, ses identifiants, constats et attentes : aucune liste concurrente. Pour le profil Habitologue dans une Visite Globale, les rubriques 4–6 restent masquées ; la liste est accessible sous Recommandations. Les autres profils gardent leurs projections actuelles. Aucune attente, action ou date n'est extraite automatiquement du texte.

Conserver les champs existants : intitulé, catégorie Correctif/Préventif/Évolutif, priorité, horizon libre, préalables, explicatif et références. Ajouter seulement les modalités de réalisation libres et un choix explicite d'inclusion dans la synthèse client. Sans choix client, une ancienne action reste uniquement dans le rapport expert. Si un constat lié est absent, ambigu ou exclu de la synthèse, l'intervention entière est exclue du client. Les préalables et l'explicatif restent dans l'expert.

Le responsable confirme « Correctif — conserver le libellé actuel » le 16 novembre. Correctif, Préventif et Évolutif sont conservés, sans changement des valeurs historiques. Les modalités peuvent préciser professionnel, délégation, participation des habitants et limites ; aucun catalogue ou engagement n'est inventé.

### Fichiers et critères

- `frontend/src/InterventionsPanel.jsx` et `App.jsx` : panneau sous Recommandations, champs et dictée existante soumise à l'accord.
- `frontend/src/interventions.js` : périmètre profil, avertissements, filtrage client et rendu partagé par aperçu/Word.
- `frontend/src/reportHtml.js` et `reportDelivery.js` : insertion après les recommandations dans l'expert et section filtrée dans le client.
- `frontend/public/api/decision-validation.php` : types et bornes des deux champs facultatifs, sans changement d'autorisation ou de stockage.
- Tests métier/PHP existants et ciblés : compatibilité, échappement, filtrage, persistance et données adjacentes.
- Documentation structurante, qualification et suivi canonique : état réel, preuves et réserves.

Critères : modifier une intervention conserve son identifiant et les références des options ; ouvrir un ancien dossier ne le réécrit pas silencieusement ; trois phases de projection restent absentes pour Habitologue ; sauvegarde/reprise et JSON conservent modalités et sélection client ; données hors interventions et propriétaire inchangés. Le client n'affiche ni les modalités internes non sélectionnées, ni le texte d'un constat exclu. Aucune date/durée inventée, migration, écriture Projet, droit, activation privée ou livraison hébergée.

## Développement local

Copie `C:/Users/examg/Documents local/avereo-rapport-interventions`, branche `feat/rapport-interventions`, base main `d5ae90eb1e9f634a8bd6f91ca0ad065d7a7718c6` (PR160 fusionnée ; PR159 incluse). Les sept documents de livraison/recette déjà modifiés dans la copie Attentes ont été repris à l'identique, source conservée. Les socles racine/application existent.

### Données et compatibilité

`decision.schema_version = 1` et liste `decision.actions` conservées. Deux propriétés facultatives seulement : `realisation` (chaîne, validation 32 000 octets, saisie 8 000 caractères) et `inclure_client` (booléen strict). L’absence de sélection client exclut l’intervention. Aucun identifiant régénéré à la lecture ; propriétés inconnues, références des options, constats/attentes et champs adjacents conservés. Une suppression explicite peut laisser une référence manquante dans une option historique, comme le comportement existant : aucune référence n’est effacée automatiquement.

La synthèse exige une sélection explicite et un identifiant d’intervention unique ; chaque constat lié doit être unique et parmi les trois constats retenus. L’ensemble de l’intervention est exclu si un seul de ses constats manque ou est exclu ; aucune tentative de réécriture de son texte. Les attentes et notes historiques gardent leur filtrage existant. Les autres profils gardent leurs projections ; modalités/sélection restent sauvegardées, sans nouvel éditeur dans ces profils. Format futur de décision : conserver le JSON, pas d’édition/rendu d’interventions.

### Qualification locale

**216 tests Node**, dont sept cas ciblés : identité/propriétés inconnues, rendu expert à la bonne place, choix client explicite, constats absents/ambigus/exclus, anciens profils, échappement et absence de calendrier inventé. **29 contrôles PHP**, dont types/bornes des nouveaux champs. Les deux compilations passent avec 150 fichiers chacune ; l’avertissement de taille du bundle est préexistant. **38 contrôles HTTP/PHP/MariaDB** sur base jetable et identités fictives signées : sauvegarde/téléchargement, nouvelle session, copie indépendante, refus croisés et propriétaire source conservé. Ce n’est pas CONNECT/OAuth hébergé.

Navigateur local : brouillon initial absent sur l’origine dédiée ; ajout/suppression, choix Correctif, liens à T1/attente et modalités saisis, sauvegarde/rechargement puis ouverture de la liste serveur réussis. JSON UI et serveur identiques pour décision/écoute/constats/plans/signature/contexte. Deux interventions, 14 constats, quatre photos, quatre plans et signature conservés. Les autres origines et brouillons n’ont pas été modifiés ; le cas fictif reste disponible pour revue.

Les deux Word sont téléchargés depuis l’interface : ZIP/XML, textes et médias vérifiés (neuf fichiers images expert, huit client). Première intervention et modalités présentes dans les deux ; seconde intervention liée au chauffage exclu absente du client, préalables/justification/notes d’attentes réservés à l’expert. Les projections 4–6 restent absentes. **Aucune nouvelle lecture native de pagination Word/PDF**, aucun test microphone/service vocal réel. Les preuves sont référencées par [la qualification](../data/interventions-qualification.json) et le suivi canonique ; aucune preuve hébergée n’est déduite de ces essais.

**Revue locale** : [ouvrir les comptes fictifs](http://127.0.0.1:5195/fixture/) → Compte fictif A → dossier RECETTE-INTERVENTIONS-20261116 dans la liste serveur → Export → rubrique Interventions proposées sous Recommandations. La base de revue est temporaire et exige le service local. Pour la relancer depuis la racine de l’application : `python -X utf8 tests/report-files-http.py --fixture .local/interventions-recette.json --serve --port 5195` ; PHP, Docker/MariaDB et les dépendances Node déjà installés sont requis. Aucun secret hébergé. Le compte B sert aux refus/copies indépendantes.

La préproduction reste PR159. Revue métier, merge, passage en préproduction et mise en production sont des décisions distinctes. La réserve PHP préexistante objet/liste des contrôles vides reste un sujet séparé, sans changement de reports.php.

## Préproduction

Non engagée pour ce lot ; la préproduction reste la PR159 qualifiée. Avant une future livraison autorisée : paquet exact, sauvegarde/restauration/retour arrière sur cible et recette CONNECT avec conservation des dossiers/propriétaires.

## Mise en production

Non engagée et non autorisée. Le prochain sous-lot doit qualifier le contrat Rapport → Projet sur la seule liste existante : sélection explicite, projet indépendant, lien au dossier, droits et absence d'écrasement ; les horizons libres ne fournissent aucune date/durée calculable. TBD — règles de calendrier et contrat Projet non arrêtés.

Le [suivi canonique](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>) porte `rapportV12CadrageProfils20261112.interventions20261116`. Les preuves des lots Attentes, Terrain et photo restent distinctes.
