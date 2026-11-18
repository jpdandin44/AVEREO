---
project: avereo-app-rapport
document_type: functional-specification
title: Interventions proposées après les recommandations
status: active
version: git
created: 2026-11-16
updated: 2026-11-18
owner: jpdandin
tags: [rapport, interventions, habitologue, export, planning]
---

## 16 novembre — Raccordement Projet réalisé localement

Le sous-lot suivant est désormais préparé et qualifié dans [Interventions vers Projet](interventions-projet.md) : sélection/estimations, aperçu et fichier pour import indépendant. Le [contrat courant](../api/interventions-projet.md) remplace les inconnues de cette première tranche ; création directe et planning Word/PDF restent à cadrer. Les paragraphes suivants conservent l’historique du premier lot d’interventions et ses recettes hébergées, sans nouvel accord de livraison.

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

Les contrôles locaux ci-dessus précèdent la livraison ; la préproduction servait alors PR159. Les tests et le merge ont ensuite été validés par le responsable ; la livraison est décrite ci-dessous. La revue métier hébergée et la mise en production restent distinctes. La réserve PHP préexistante objet/liste des contrôles vides reste un sujet séparé, sans changement de reports.php.

## Préproduction

Livraison explicitement demandée le 16 novembre après tests déclarés OK et merge humain de PR161. [Rapport préproduction](https://rapport-preprod.avereo.fr/) via CONNECT sert le candidat 1d8b103fcddcf2293ee402fc27e85ba83aede37e, merge 97a902c9540734352c90f194448ab524c9a84d36, même arbre 9255d33. Paquet qualifié de 150 fichiers réutilisé sans reconstruction, SHA-256 080b8213ab59fb653c1b18c2544dfb2cf4e0baeab8cda186162c81451329f197. Quatre fichiers installés : api/decision-validation.php, assets/index-C3KuFkmh.js, assets/reportDocx-Bbc10jHt.js et index.html en dernier ; CSS inchangée.

Cible et base distinctes vérifiées. Sauvegarde fraîche application/configuration relue, restauration et retour arrière code répétés sur une copie indépendante ; sauvegarde privée des dossiers relue. Aucune restauration SQL ou écriture de dossier. **23 dossiers, toutes leurs colonnes et propriétaires inchangés**, configuration et fichiers de production préservés. **205 fichiers préexistants conservés** à l’installation. Variantes communes déjà revues et différences de fins de ligne retenues hors du périmètre. Après navigation, une seule ligne attendue « Ticket invalide » au journal CONNECT due au contrôle d’entrée anonyme ; préfixe sauvegardé et autres octets exacts.

Trois ressources HTTPS identiques, accès anonymes refusés et SSO normal réussi. Interface fraîche sur la copie fictive complète : deux interventions, Correctif, liens T1/attentes et modalités, 14 constats/quatre photos/quatre plans/signature ; projections 4–6 toujours masquées. Deux requêtes volontairement invalides reçoivent 422 report_decision_invalid pour realisation et inclure_client ; leur identifiant de dossier invalide empêche toute écriture même avec l’ancien validateur. Aucun compte/droit ou original privé activé.

Les deux Word générés depuis l’hôte ont les **textes, liens et fichiers images identiques** aux références qualifiées (neuf images expert, huit client). Intervention liée au constat exclu et notes internes absentes du client. Aucune nouvelle lecture native de pagination Word/PDF. La lecture locale d’une copie Word dans OneDrive a été temporairement refusée ; les mêmes téléchargements ont été inspectés depuis des copies hors du répertoire synchronisé, sans modification des fichiers.

Brouillon initial sauvegardé avant import fictif, restauré dans les deux clés des deux stockages et empreintes identiques après rechargement, également comparées au fichier privé initial. Le rechargement a demandé un renouvellement de l’accès applicatif ; une relance normale depuis CONNECT a réussi et affiche l’ancien brouillon. Aucun code ou paramètre d’authentification changé. Le fichier privé de sauvegarde du brouillon n’est pas publié.

[Reçu de livraison](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr161-preprod-20261116/delivery.json>) · [sauvegarde et retour arrière](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr161-preprod-20261116/recovery.json>) · [conservation après navigation](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr161-preprod-20261116/verification-post-navigation.json>) · [Word](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr161-preprod-20261116/verification-word-preproduction.json>). Source canonique : rapportV12CadrageProfils20261112.interventions20261116.preproduction20261116.

**Livraison et alignement terminés.** À l’issue de ce contrôle d’alignement, la recette dédiée Interventions avec nouvel enregistrement en ligne et réouverture serveur dans une nouvelle session restait distincte : aucun nouveau dossier créé pendant l’alignement. La recette Attentes et les preuves Terrain/photo sont conservées sans nouvelle acceptation déduite. Microphone réel, nouvelle lecture native Word/PDF, revue métier hébergée et contrat Projet/Gantt restent leurs sujets propres. La recette dédiée est ensuite demandée et réalisée ci-dessous ; les preuves de livraison gardent leur périmètre initial.

### Recette complète du 16 novembre

Recette explicitement autorisée, sans nouveau code/build/déploiement : dossier **RECETTE-INTERVENTIONS-PR161-20261116**, identifiant ba92a46d13bfcb987df06a5710449c98, propriétaire avereo_connect:1. Deux sauvegardes réussies sur le même identifiant ; modification de l’intitulé et complément de modalités relus après la seconde sauvegarde. Trois interventions Correctif, Préventif et Évolutif, avec modalités multilignes et URL, constats T1/chauffage 9/T2, attentes 1+3/2/3 et sélections client conservés. Les deux identifiants d’intervention déjà présents restent stables ; le troisième provient de l’ajout explicite dans l’interface.

Déconnexion de Rapport puis confirmation de déconnexion complète CONNECT ; nouvel onglet anonyme, connexion normale effectuée par le responsable, **Reprendre désactivé**. Téléchargement complet et ouverture depuis la liste serveur. JSON avant/après **identique octet pour octet**, 1 039 715 octets, SHA-256 65274198e9173199688191905a1fa33ff69b10165abb766004e9899d034377ba. Relecture des sept champs et des cases sélectionnées de chaque intervention conforme ; avertissement client sur le chauffage exclu conservé, projections 4–6 absentes pour Habitologue. Attentes, notes, provenance et deux liens existants restent exacts ; 14 constats/quatre photos/quatre plans/signature préservés.

Deux audits en lecture seule confirment les **23 dossiers antérieurs, toutes leurs colonnes et propriétaires exacts** ; un seul dossier fictif ajouté, **24 au total**. La nouvelle ligne et son propriétaire sont inchangés entre sauvegarde et réouverture. Code/assets, configuration, production et journal restent exacts ; schéma inchangé hors avance normale du compteur. Les sauvegardes SQL privées restent côté serveur.

Brouillon initial courant sauvegardé avant import, puis restauré dans les quatre emplacements ; empreintes exactes après rechargement, comparaison à la sauvegarde privée indépendante et ancien brouillon visible à l’accueil. La lecture temporairement refusée de fichiers récents dans OneDrive est résolue par des copies identiques hors du dossier synchronisé, sans nouvelle écriture serveur. Aucun obstacle restant à cette recette technique.

[Reçu final](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr161-interventions-recette-20261116/verification-finale.json>) · [réouverture](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr161-interventions-recette-20261116/recette-reouverture-serveur.json>) · [conservation](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr161-interventions-recette-20261116/conservation-after-reopen.json>) · [brouillon restauré](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr161-interventions-recette-20261116/restauration-brouillon.json>). Source canonique : rapportV12CadrageProfils20261112.interventions20261116.preproduction20261116.functionalRecipe20261116.

Revue métier : CONNECT → Rapport → rechercher la référence dans **Rapports sauvegardés en ligne** → Ouvrir le dossier → Export → Interventions proposées. Utiliser la liste serveur ; Reprendre contient le brouillon initial restauré. La recette technique ne crée pas d’acceptation humaine hébergée. Les Word vérifiés à la livraison gardent leur portée ; aucun nouvel export ou rendu natif Word/PDF, microphone réel, compte/droit ou activation privée qualifié dans cette recette.

La prochaine priorité choisie est le contenu et la disposition des écrans ; onglets et modifications précis à cadrer avant les autres évolutions. La barre de navigation n’est pas incluse par déduction.

## Mise en production

Non engagée et non autorisée. Après le lot de contenu/disposition des écrans priorisé par le responsable, un sous-lot distinct doit qualifier le contrat Rapport → Projet sur la seule liste existante : sélection explicite, projet indépendant, lien au dossier, droits et absence d'écrasement ; les horizons libres ne fournissent aucune date/durée calculable. TBD — règles de calendrier et contrat Projet non arrêtés.

Le [suivi canonique](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>) porte `rapportV12CadrageProfils20261112.interventions20261116`. Les preuves des lots Attentes, Terrain et photo restent distinctes.

## 18 novembre — Correction de pagination des interventions

La réserve `WORD-TABLE-CONTINUATION-20261118` concerne le Word expert de la recette coordonnée : la dernière ligne de la deuxième intervention est seule sur la page suivante. Le convertisseur Word conserve désormais les deux dernières lignes d’une intervention ensemble. La liaison s’arrête à sa dernière ligne ; les autres lignes et les tableaux ordinaires gardent leur pagination. La lecture native d’un tableau long a écarté une première variante qui liait toutes ses lignes et créait une page presque vide. Cette variante n’a pas été déployée. Aucun texte, donnée, média, droit ou format de sauvegarde ne change.

Un contrôle OOXML couvre une intervention courte, une longue et un tableau ordinaire, la dernière ligne et la libération du bloc suivant. La qualification native Word/PDF en préproduction reste à réaliser avant de lever la réserve. L’autorisation du responsable porte sur cette correction et sa livraison en préproduction ; merge et production restent distincts.

Source de suivi : `rapportV12CadrageProfils20261112.paginationWordExpert20261118` dans le [suivi canonique](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>). Les preuves historiques restent conservées.
