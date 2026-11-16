---
project: avereo-app-rapport
document_type: functional-specification
title: Attentes reprises de l’écoute client et notes complémentaires
status: active
version: git
created: 2026-11-16
updated: 2026-11-16
owner: jpdandin
tags: [rapport, attentes, ecoute, dictee, export]
---

# Attentes reprises de l’écoute client

## Cadrage

Complément demandé par le responsable le 13 novembre, lancé à sa demande de reprise du 16. Les deux sources proposées sont les textes complets « Attentes et priorités du client » et « Besoin reformulé avec le client », dans Dossier / Écoute client. Aucun autre sujet de l’entretien ne devient une attente automatiquement. Aucun découpage de texte libre, traitement IA, fichier audio ou échange avec Projet.

## Développement local

Dans Export, rubrique 1, « Attentes reprises de l’écoute client » présente les textes déjà saisis. « Reprendre cette attente » crée une attente modifiable avec un identifiant stable et la provenance. Le texte entier est copié, sans interprétation ni confirmation implicite des habitants. Un champ déjà repris reste identifié même après reformulation ; un changement dans l’écoute est signalé, sans écraser l’attente, son verbatim initial ou ses liens. Une attente manuelle ayant exactement le même texte est conservée sans doublon et sans changement silencieux de provenance. Les attentes historiques ne sont pas reclassées.

« Attentes à relier aux constats » garde les commandes existantes : formuler, préciser la priorité et la source, ajouter/supprimer et enregistrer localement. La matrice de la rubrique 3 utilise cette même liste, sans catalogue concurrent. Les liens et actions conservent les identifiants ; une suppression laisse les références manquantes signalées selon le comportement existant.

« Notes complémentaires et dictée » est un texte libre séparé, sauvegardé avec le dossier. La dictée utilise VoiceField et l’accord de Dossier ; elle ajoute du texte sans fichier audio. Ces notes ne créent aucune attente sélectionnable. Le rapport expert reprend les notes ; la synthèse client reprend les attentes formulées et leurs priorités, en excluant les notes et la provenance détaillée. Le verbatim de reprise reste consultable dans l’interface et dans le JSON.

### Données et compatibilité

Ajouts facultatifs à decision, schema_version 1 conservé :

- notes_attentes : chaîne, vide pour un ancien dossier ;
- attentes[].provenance_ecoute : objet facultatif contenant champ (attentes_client ou besoin_reformule) et texte_original (copie complète au moment de la reprise).

Le dossier JSON natif et les stockages existants portent ces données ; aucune nouvelle table, route, migration ou permission. La validation PHP contrôle les types, les deux noms de source autorisés et la borne existante de 32 000 octets par texte. La liste reste limitée à 100 attentes. Les rôles CONNECT restent distincts du profil métier.

Réserve préexistante reproduite : le passage PHP associatif d’un dossier neuf convertit quatre objets vides habitologie_protocoles.*.controls en tableaux vides. Aucun contrôle coché n’est perdu et ce lot ne change pas reports.php. L’export navigateur brut est conservé ; la recette SQL stricte utilise la représentation déjà stockée par l’API et garde toutes ses assertions d’égalité. La conservation générale des types objet/liste reste un sujet distinct, elle n’est pas déclarée corrigée ici.

### Contrôles et revue

209 tests Node (dont sept cas ciblés), 24 contrôles PHP de décision et 38 contrôles HTTP/PHP/MariaDB locaux. La recette HTTP utilise une base jetable et deux identités fictives signées : sauvegarde/relecture, téléchargement exact, nouvelle session, copie indépendante et propriétaire source conservé ; ce n’est pas une connexion CONNECT hébergée. Le script accepte désormais une fixture sans onlineReportId, cas normal d’un import indépendant ; aucune assertion supprimée.

Navigateur : source préremplie, reprise des deux champs, reformulation, absence de double reprise, modification de l’écoute signalée, association à T1, sauvegarde/rechargement et reprise avec liens/notes conservés. Le dossier fictif complet garde 14 constats, quatre photos, trois plans, signature et ancien contexte. Dictée sans accord désactivée ; microphone et service vocal réels restent à qualifier. Le brouillon initial, sauvegardé avant l’essai, est restauré et relu exactement dans les deux clés des deux stockages.

Deux Word téléchargés depuis l’application locale : ZIP/XML, textes et médias contrôlés (9/8 médias expert/client) ; attentes présentes dans les deux, notes présentes seulement dans l’expert. Aucune nouvelle lecture native Word/PDF ou qualification de pagination dans ce lot. Compilations et dernière observation GitHub sont rattachées au suivi canonique et au reçu de qualification.

[Revue locale](http://127.0.0.1:5192/) sur ce PC : Charger un dossier JSON → choisir architecture-v1/avereo-app-rapport/.local/attentes-recette.json dans cette copie → vérifier le résumé fictif → Charger le dossier complet → Export. Le brouillon antérieur a été restauré : ne pas utiliser Reprendre pour charger la recette. Exportez votre brouillon avant tout remplacement. Les preuves privées de sauvegarde ne sont pas publiées.

Pour relancer cette revue depuis frontend : npm.cmd ci puis npm.cmd run dev -- --host 127.0.0.1 --port 5192 --strictPort. La copie en revue utilise VITE_ENABLE_ONLINE_SYNC=false ; aucune donnée de cette recette n’est envoyée à Rapport hébergé. Les preuves locales sont dans .local/attentes-qa et le suivi [canonique](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>) sous rapportV12CadrageProfils20261112.attentesEcoute20261116.

## Préproduction

Non engagée pour ce candidat. Après revue locale et décision distincte : livraison conjointe interface/validation PHP, sauvegarde et récupération qualifiées, puis recette authentifiée sur dossier fictif avec sauvegarde, nouvelle session et Word expert/client. La recette Terrain du 14 reste datée et distincte ; elle ne vaut pas validation humaine hébergée du présent lot.

## Mise en production

Non engagée et non autorisée. Suites à cadrer séparément : interventions/planning avec Projet, autres profils métier, identité des organisations, activation et qualification des originaux privés. Les validations humaines et décisions de passage restent au responsable.
