---
project: avereo-app-rapport
document_type: functional-specification
title: Contexte Environnement et Terrain
status: active
version: git
created: 2026-11-14
updated: 2026-11-14
owner: jpdandin
tags: [rapport, terrain, contexte, word, recette]
---

# Contexte Environnement / Terrain

## Cadrage

Le responsable demande le 14 novembre de lancer ce lot après la recette photo PR156, puis choisit explicitement : **« Terrain dans une rubrique de contexte séparée, sans modifier les numéros des observations Eau/Air/Terre/Feu. »** Cette décision remplace la proposition de placer Terrain avant Eau dans la numérotation commune.

Le [cadrage des retours de Philippe](<C:/Users/examg/Documents local/Habitologue/Opportunité_Connect/docs/rapport-v1-2/cadrage-retours-philippe.md>) conserve l'origine des critères DC-01–06, W-01–07 et T-01–04. L'état opérationnel unique est le bloc `rapportV12CadrageProfils20261112.environnementTerrain20261114` du [suivi canonique](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>). La revue métier reste au responsable ou au relecteur désigné.

Le titre professionnel visible reste « Intervenant ». Les mesures de relief, l'orientation et les notes déjà présentes dans Site ne sont pas remplacées. Le contexte ne constitue ni une cinquième phase du protocole, ni un diagnostic automatique.

## Développement local

**Candidat implémenté et vérifié localement, à soumettre à la revue humaine.** Copie dédiée `C:/Users/examg/Documents local/avereo-rapport-terrain`, branche `feat/rapport-environnement-terrain`, base `d316466` incluant PR156. Les modifications documentaires non publiées de la copie photo sont préservées dans leur copie d'origine.

### Parcours

1. Dans Dossier, choisir le profil explicite **Habitologue**.
2. Dans **Site → Contexte Environnement / Terrain**, cliquer sur **Renseigner le contexte extérieur**.
3. Renseigner titre, zone, constat, explications avec liens/URL et conseils habitologue. Les boutons de dictée réutilisent l'accord de Dossier ; aucun fichier audio n'est conservé.
4. Ajouter facultativement une photo PNG/JPEG, sa légende et sa source ; choisir éventuellement une vue déjà chargée dans **Observations → Repérage sur les plans**. La rubrique reste utilisable sans coordonnées, image ou service cartographique.
5. Choisir explicitement **Inclure ce contexte dans la synthèse client** si souhaité. Ce choix, désactivé à la création, est indépendant des trois observations sélectionnables. Le contexte renseigné figure dans le rapport expert.
6. Sauver le dossier complet, le rouvrir depuis la liste serveur et générer les deux Word dans Export.

La suppression retire uniquement le contexte. Les observations conservent ordre, identifiants, numéros, sélection client et repères. Une vue supprimée conserve sa référence et affiche son indisponibilité ; aucune autre image ne lui est substituée. L'association à une vue reprend son fond original avec titre et source, sans ajouter de repère numéroté.

### Données et composants

Le champ racine facultatif `contexte_exterieur` contient `id`, `titre`, `zone`, `constat`, `explications`, `conseils`, `planId`, `photo` et `includeInClient`. L'identifiant reste stable pendant les modifications. `photo`, facultative, contient `id`, `name`, `src`, `width`, `height`, `source`, `caption` et `horodatageISO`. Les champs inconnus compatibles sont conservés. Un ancien dossier ne reçoit aucun contexte par défaut. Un changement de profil masque la rubrique sans effacer son contenu.

| Élément | Responsabilité |
| --- | --- |
| `EnvironmentContext.jsx`, `environmentContext.js` | Saisie dans Site, validation client, mises à jour ciblées, protection contre un résultat photo tardif après remplacement/suppression du contexte ou changement de dossier. |
| `App.jsx` | Validation, compteur global des photos et verrou existant de sauvegarde pendant une lecture/transfert photo. |
| `reportFiles.js` | Import complet et compteurs incluant la photo du contexte ; import indépendant du dossier source. |
| `reportHtml.js`, `reportDelivery.js` | Section non numérotée ; ajout client explicite sur une page après la couverture, avant les observations sélectionnées. |
| `report-download.php` | Compteur de la photo facultative dans l'accusé relu ; téléchargement des octets bruts et empreinte inchangés. |

`observationOrder.js` et le repérage des observations restent inchangés. Le JSON complet, le brouillon et les opérations serveur existantes conservent le nouveau champ ; aucune nouvelle route, table ou migration SQL. Les droits et propriétaires restent ceux du dossier.

La photo suit les bornes existantes des images de plan : **4 Mio**, dimensions maximales **12 000 px** par côté et **24 millions de pixels**. Les octets du fichier accepté restent dans le JSON. Sources distantes et formats non acceptés sont refusés à l'import/édition du contexte ; textes échappés et seuls liens HTTP/HTTPS cliquables. Le JSON complet reste limité à **50 Mio**. Le serveur conserve son contrat de payload brut, sans nouvelle validation sémantique PHP du contexte.

Cette première rubrique accepte une photo simple ; elle n'est pas raccordée à l'éditeur de recadrage/annotation ni à la conservation privée des originaux. Les fonctions existantes des photos d'observation restent disponibles. Aucun quota hébergé ou stockage privé n'est activé par ce lot.

### Qualification effectuée

Les preuves datées sont dans [l'archive locale du lot](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-terrain-20261114>). Elles ne constituent pas une recette hébergée.

| Critère / vérification | Résultat et portée |
| --- | --- |
| T-01 : édition et suppression | Création/édition avec identifiant stable, photo/source/légende, suppression du seul contexte vérifiées dans l'interface et les règles de données. |
| T-02 : ordre et numéros | Règle choisie par le responsable ; aucun numéro ou déplacement parmi les observations. Observations 1–12 et sélection client 2/9 inchangées. |
| T-03 : média facultatif | Photo originale et fond de plan fictifs, source/légende dans les Word ; autre cas sans coordonnées/photo/plan utilisable, absence signalée. |
| T-04 : persistance | Brouillon, JSON complet, sauvegarde puis déconnexion et nouvelle session sans brouillon ; réouverture serveur exacte. |
| Tests client | **194 tests Node réussis**, dont 8 sur compatibilité, ordre/repères, choix client, images/liens, résultat tardif, vue absente, copie expurgée et entrées invalides. |
| PHP et compilation | `php tests/report-download.php` réussi ; builds `VITE_ENABLE_ONLINE_SYNC=false` puis `true` réussis, 150 fichiers chacun. Avertissement existant de taille du module principal, sans échec. |
| HTTP et MariaDB locales | **38 contrôles réussis** : vrai PHP, base éphémère, deux propriétaires fictifs, octets exacts, nouvelle session signée, copie indépendante, refus croisés et propriétaire source conservé. Fournisseur CONNECT/OAuth hébergé non rejoué. |
| Navigateur | Compteurs 12 observations/3 photos/1 plan pour le cas complet ; texte et URL longs sans visuel ; suppression ciblée ; largeur simulée 390 px sans débordement horizontal ; aucune erreur console observée. Dernier chargement photo contrôlé puis dossier de revue restauré depuis sa sauvegarde. |
| Word et PDF de contrôle | Quatre Word ouverts sans réparation et convertis dans Microsoft Word en PDF Standard : cas A complet **21 pages expert / 8 client**, cas B sans visuel et texte long **21 / 7**, soit **57 pages inspectées**. Textes/liens, photo originale et préparée déjà présente, fond de plan, numéros et signature expert conservés. DOCX identiques après lecture. |
| Choix client | Cinquième DOCX avec contexte exclu : contenu et médias vérifiés, sans rendu natif supplémentaire. La synthèse existante ne comporte pas de signature. |

La couverture client a été isolée du contexte pendant la qualification. Les longues explications et URL peuvent se poursuivre sur la page suivante ; aucun contenu tronqué ou chevauchement constaté dans les deux cas. Le contrôle texte PDF tient compte des en-têtes/pieds de page répétés et du caractère de coupure de ligne produit par PDFium ; les pages rendues ont aussi été inspectées. Les critères techniques concernés ne valent pas acceptation métier globale des retours de Philippe.

### Revue à effectuer

[Ouvrir la revue locale](http://127.0.0.1:5190/fixture/) tant que le service est actif. Le sas propose des comptes fictifs sans identifiant réel. Choisir le compte A, puis ouvrir `RECETTE-TERRAIN-INTERFACE-20261114` depuis la liste serveur ; contexte dans Site. `RECETTE-TERRAIN-B-20261114` permet de relire le texte long sans visuel. Cette base est temporaire ; les JSON archivés permettent une reprise après arrêt.

À valider par le responsable : libellés et place dans Site ; choix client séparé ; modification/suppression ; numéros et repères ; Word expert/client avec ou sans contexte. Les tests ne cochent pas cette revue.

Pour relancer la base isolée : `python -X utf8 tests/report-files-http.py --fixture CHEMIN_JSON_FICTIF --receipt CHEMIN_RECU_JSON --serve --port 5190`, depuis la racine Rapport. PHP, Docker actif et image `mariadb:11.4` déjà disponible requis. Utiliser la fixture synthétique `cas-a-contexte-separe.json` de l'archive ; aucune donnée réelle. [Commandes et prérequis](../tests/README.md).

## Préproduction

Non engagée et non autorisée pour ce candidat. Après revue/CI et accord applicable : qualifier l'artefact, préparer sauvegarde et retour arrière, puis vérifier CONNECT réel, sauvegarde/réouverture dans une nouvelle session, propriété source et Word sur dossiers fictifs. La recette photo PR156 terminée conserve sa portée et ses preuves propres.

## Mise en production

Non engagée et non autorisée. Revue métier et accords de merge/livraison restent distincts. Attentes issues de l'Écoute client, autres profils, interventions/planning Projet, identité des organisations et activation des originaux privés restent dans leurs lots respectifs.
