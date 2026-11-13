---
project: avereo-app-rapport
document_type: procedure
title: Partager un dossier de test et suivre le stockage de Rapport
status: active
version: git
created: 2026-11-10
updated: 2026-11-13
owner: jpdandin
tags: [rapport, partage, stockage, administration]
---

# Partager un dossier de test et suivre le stockage de Rapport

## État du 13 novembre

Correctif local construit après PR149, puis réaligné sur `main` après la fusion du lot photo PR150. Le chargement complet et les contrôles d’originaux privés coexistent ; le stockage privé reste désactivé par défaut. Les fichiers privés hors JSON ne sont pas empaquetés par ce téléchargement. Le fichier reçu du responsable est une **structure de test**, avec douze constats fictifs et aucune photo ; ce n’est pas une sauvegarde des textes de Philippe. La lecture de la base de préproduction, des identifiants historiques et de la sauvegarde privée PR149 retrouve uniquement une ancienne sauvegarde du compte du 6 novembre, sans texte ni photo de visite. Le responsable indique que l’original n’est plus accessible. Ces contrôles n’ont changé aucun compte, droit, dossier ou propriétaire. Ils ne couvrent pas tous les historiques de l’hébergement ni le disque du poste de Philippe. Le fichier reçu seul ne permet pas de reconstruire le contenu retiré.

La preuve privée du diagnostic et l’état de récupération sont tenus dans `rapportDossiersComplets20261113` du [suivi canonique](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>). Aucune donnée réelle ni fichier reçu n’est incorporé aux tests du candidat.

## Cadrage

Le dossier complet et la structure de test sont deux fichiers différents. Le JSON complet contient tous les champs et images présents dans le dossier ; une structure de test remplace les noms/textes et retire les pièces privées. Ni le titre ni l’heure d’une ligne de liste ne prouvent la présence du contenu.

Critères : charger depuis l’accueil ; confirmer les compteurs avant remplacement du brouillon ; exporter ou annuler avant ce remplacement ; récupérer les octets sauvegardés sous les droits existants ; rouvrir dans une nouvelle session ; sauvegarder une copie sous un autre compte fictif sans altérer le source ni ses références internes ; refuser les résumés seuls, contenus altérés et accès croisés.

## Développement local

### Charger et récupérer un dossier complet

- **Accueil → Charger un dossier JSON** : choisir le fichier, vérifier observations, photos, plans et signature ; exporter le brouillon existant si nécessaire, puis confirmer. L’opération ne remplace le brouillon qu’après validation. Un JSON d’API contenant `report.payload` est accepté ; un horodatage seul est refusé.
- **Accueil → Rapports sauvegardés en ligne → Ouvrir le dossier** charge le contenu de la sauvegarde, pas le résumé de liste. La confirmation de remplacement du brouillon existant reste proposée.
- **Télécharger JSON complet**, dans chaque ligne, récupère la sauvegarde sans modifier le brouillon. Le fichier est vérifié par SHA-256 et conserve les octets de la base, y compris les champs inconnus et grands entiers JSON.
- **Export → Télécharger le dossier complet (JSON)** exporte le dossier ouvert, y compris les saisies encore locales. C’est le fichier à transmettre par un canal privé aux personnes autorisées. Il n’envoie aucun message ni droit de consultation.
- **Sauver en ligne** reste une action explicite. Après écriture, le serveur relit le contenu et confirme ses compteurs. Si la saisie continue pendant l’envoi, elle est conservée dans le brouillon et un nouvel envoi est nécessaire. Les enregistrements automatiques du brouillon ne sont pas une synchronisation serveur.

Un JSON importé est une **copie indépendante** : le lien `onlineReportId` est retiré, les identifiants et références des observations, plans et attentes sont conservés. Sa prochaine sauvegarde crée un autre dossier sous le compte destinataire. L’ouverture depuis la liste reste la modification de la sauvegarde d’origine, selon les droits existants. Ce correctif n’accorde aucun droit de lecture à un destinataire et ne réalise aucun transfert de propriété.

### Créer une structure de test

Dans Export, **Créer une structure de test sans textes ni photos** puis **Télécharger la structure seule**. Le fichier `rapport-structure-test-sans-contenu.json` est explicitement marqué `copie_test: true`. Les anciennes copies ayant exactement la forme du fichier reçu sont reconnues. À l’import, un avertissement indique les retraits et la confirmation devient **Charger la structure de test**.

Cette fonction garde catégories, protocoles, phases et choix de catalogue, avec un constat fictif par observation. Elle retire les identifiants d’origine, contenus libres, coordonnées, pièces, plans, photos et signature. Un exemple fictif doit être ajouté pour reproduire un problème de photo ou de texte. Elle ne reconstitue jamais le contenu original.

### Contrat et qualification

[Contrat machine](../api/dossiers-complets.json). Même table `rapport_reports`, mêmes contrôles de lecture/écriture ; l’export organisationnel par grant reste distinct. `report-download.php` valide sans réencoder ; GET `reports.php?id=…&download=1` émet pièce jointe privée et empreinte. Après POST, le serveur relit le JSON et vérifie son empreinte avant l’accusé. Une confirmation non acquise conserve le brouillon et, quand connu, l’identifiant de la sauvegarde pour éviter une nouvelle ligne au prochain envoi.

Commandes : depuis `frontend`, `npm.cmd test` et `npm.cmd run build` ; depuis l’application, `php tests/report-download.php` et `python -X utf8 tests/report-files-http.py`. Le dernier utilise PHP et l’image déjà installée `mariadb:11.4`, sans téléchargement ; migration 001 dans une base éphémère, identités fictives du sas existant, aucune configuration hébergée. Ajouter `--serve --port 5186` laisse l’[entrée de revue locale](http://127.0.0.1:5186/fixture/) ouverte ; Ctrl+C arrête ses seuls processus et son conteneur. La base est temporaire. Cette recette n’est pas une connexion OAuth/CONNECT réelle.

Qualification initiale de PR152 : **149 tests Node** (dont 14 ajoutés), tests PHP du téléchargement et 27 contrôles existants décision/plans, sas CONNECT, **35 contrôles HTTP/MariaDB** et deux compilations réussis. Un déclencheur SQL fictif retire volontairement le contenu avant stockage : l’API répond 409 avec identifiant, jamais un succès de sauvegarde complète. Le navigateur confirme import de 12 observations/2 photos/1 plan/signature, avertissement sur l’ancienne copie reçue, refus d’un horodatage seul, export du brouillon avant annulation, sauvegarde/réouverture dans un nouveau lancement local, conservation des champs et du propriétaire source, Word expert et client cohérents. Une latence fictive de deux secondes vérifie la conservation d’une saisie pendant l’envoi et son message de nouvel enregistrement nécessaire. Revue visuelle sur le bureau courant ; aucun essai mobile revendiqué. Les scripts navigateur CLI historiques ont leurs libellés/fixtures réalignés, mais ces parcours ont été exécutés via CUA, pas par ces scripts.

Les preuves courantes sont dans [l’archive privée du lot](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-dossiers-complets-20261113>). Résultats détaillés et candidat exact dans le suivi canonique ; aucune case humaine de PR n’est déduite des tests.

La réconciliation avec `main` après PR150 conserve les deux apports des imports et des protections de sauvegarde. Sur le code combiné : **171 tests Node**, **35 contrôles HTTP dossiers complets**, **31 contrôles HTTP originaux privés**, les validations PHP des deux lots et les deux compilations sont réussis. Les références du candidat, empreintes, CI et limites restent rattachées au suivi canonique. La recette navigateur initiale est conservée comme preuve de son candidat ; elle n’est pas présentée comme une nouvelle recette navigateur du réalignement. Aucune donnée hébergée ni activation modifiée.

### Limites

Le téléchargement serveur conserve un grand entier JSON exact ; le chargement/édition d’un entier hors précision JavaScript est refusé avec explication, pour empêcher un arrondi silencieux. Le plafond JSON existant reste 50 Mio. Les originaux privés futurs hors JSON ne sont pas empaquetés dans cette tranche ; les images présentes dans `src` sont conservées. Aucun historique de versions ni sauvegarde serveur automatique ajouté. Une réouverture prouve le contenu au moment du contrôle, sans résoudre les conflits d’édition entre plusieurs onglets. Aucun contenu absent du fichier et des sauvegardes contrôlées n’est inventé.

## Préproduction

**Livraison du 13 novembre 2026 :** PR152 fusionnée (`d8dad46`), même paquet que le candidat qualifié `cea3177`, installée sur [Rapport par CONNECT préproduction](https://connect-preprod.avereo.fr/?app=rapport). Huit fichiers de code sont livrés ; 188 fichiers existants restent intacts. Le contrôle de passage a été exécuté après sauvegarde fraîche des fichiers, de la configuration privée et du JSON des 18 dossiers. Le retour arrière applicatif a été répété sur une copie séparée ; la sauvegarde JSON est relue, sans restauration SQL sur la cible.

Les 18 lignes de dossiers, propriétaires, contenus et autres colonnes ont une empreinte identique avant/après livraison, puis après les contrôles de navigateur. Configuration privée et fichiers de production inchangés. Aucune migration SQL ni activation des originaux privés. Les deux composants partagés déjà hébergés (`account-menu.js`, `assets/missions.js`) sont conservés à leurs empreintes vérifiées ; huit autres différences de représentation LF/CRLF sont conservées sur place après comparaison normalisée. Le paquet n’a pas été reconstruit.

Contrôles initiaux après livraison : lancement CONNECT, présence des nouveaux boutons, téléchargement vérifié du dossier fictif de structure, aperçu d’un fichier fictif complet (12 observations, 2 photos, 1 plan, signature), puis annulation ; menu du compte et préférences ouverts puis annulés. Le brouillon existant est resté à sa référence et date antérieures, sans remplacement. API anonyme refusée ; assets JavaScript/CSS servis aux empreintes attendues ; capacité des originaux `enabled: false` sous session authentifiée. La recette complète a ensuite été exécutée : voir ci-dessous. Les essais locaux antérieurs restent distincts ; aucun dossier réel écrit pour ces contrôles.

[Suivi et reçus de livraison](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>), bloc `rapportDossiersComplets20261113.preproduction20261113` ; [preuve serveur](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr152-preproduction-20261113/delivery.json>). Les paragraphes « correctif local » décrivent la qualification initiale. Pour une prochaine livraison :

Après accord pour le candidat exact : sauvegarder et répéter le retour arrière sur copie privée, installer ensemble interface et API puis recetter deux comptes fictifs, téléchargement/empreinte, import indépendant, sauvegarde/réouverture dans une nouvelle session et propriétaire source conservé. Vérifier les anciens dossiers, Word et refus d’accès. Le diagnostic hébergé en lecture seule ne vaut pas recette hébergée de ce nouveau candidat.


### Recette complète entre deux comptes fictifs — 13 novembre

**Recette technique réussie sur le candidat installé**, distincte de la revue métier. Les deux utilisateurs fictifs CONNECT déjà existants sont réutilisés dans leurs seules organisations et avec leurs droits ordinaires ; aucun droit global ni accès à un dossier réel ajouté. Les sessions réelles sont émises par le `SessionManager` installé ; le lancement signé CONNECT, les API et l’interface hébergés sont utilisés sans simulation. Le parcours de mot de passe/OAuth Drupal n’est pas rejoué.

Depuis le compte A, le dossier fictif complet est ouvert puis sauvé dans l’interface : accusé serveur de **12 observations, 2 photos et 1 plan**, signature présente dans le contenu. Son JSON complet est téléchargé, puis importé sous le compte B après aperçu et confirmation. La sauvegarde B crée un autre identifiant, appartenant à B. Le propriétaire source reste A ; toutes les colonnes du dossier source sont strictement inchangées après copie, réouverture et essais d’accès croisés.

L’ancienne session B est invalidée (HTTP 401) et remplacée par une session distincte. Les seules clés de brouillon utilisées par la recette sont vidées après sauvegarde privée du brouillon d’origine. Dans un nouvel onglet, **Reprendre est désactivé** ; **Ouvrir le dossier** depuis la liste serveur charge la copie complète. Le réexport conserve textes, identifiants internes, champs inconnus, photos, plan et signature. Quatre collections de contrôles de protocoles vides sont normalisées de `[]` vers `{}` à la réouverture ; elles ne contenaient aucun contrôle et aucun champ renseigné n’est exclu de la comparaison.

Lectures et téléchargements croisés refusés (404), écritures croisées refusées (403), dans les deux sens. Les **18 dossiers antérieurs restent identiques sur toutes leurs colonnes** ; seuls les deux nouveaux dossiers fictifs sont ajoutés et conservés pour la traçabilité. Utilisateurs, organisations et politiques fictifs retrouvent leur état antérieur ; sessions de recette invalidées, accès B refusé après retrait (403). Les deux valeurs IndexedDB et les valeurs localStorage du brouillon d’origine sont restaurées et comparées par empreintes individuelles ; sessions CONNECT/Rapport d’origine restaurées, référence et date du brouillon vérifiées dans l’Accueil.

Preuves et identifiants exacts : bloc canonique `rapportDossiersComplets20261113.fullHostedFunctionalRecipe20261113` ; [contrôle serveur](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr152-recette-20261113/recette-serveur.json>), [parcours navigateur](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr152-recette-20261113/recette-navigateur.json>) et [comparaison du contenu](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr152-recette-20261113/verification-contenu.json>). Aucune nouvelle qualification Word/PDF ou mobile, activation des originaux privés, récupération du texte absent de Philippe, ni livraison en production déduite de cette recette.


### Contrôle des exports Word et PDF — 13 novembre

**Contenu vérifié, deux réserves de pagination ouvertes.** Le même JSON complet réexporté après la réouverture serveur sous B est chargé dans l’interface hébergée de PR152. Les Word expert et client sont générés par **Générer Word (.docx)** ; aucun nouveau dossier n’est sauvé en ligne et les comptes fictifs restent dans leur état final de la recette précédente. Le brouillon original est sauvegardé puis restauré à l’identique, avec contrôle SHA-256 individuel des clés IndexedDB/localStorage et référence/date vérifiées dans l’Accueil.

L’application ne propose actuellement **aucun export PDF direct**. Les deux PDF contrôlés sont obtenus dans **Microsoft Word installé → Enregistrer sous → PDF, qualité Standard**, à partir des fichiers générés en préproduction. Le moteur de rendu empaqueté `render_docx.py` est essayé mais LibreOffice est absent ; la conversion Word native réussit, puis les PDF sont rendus en images avec le runtime fourni. Les **27 pages** sont inspectées visuellement, en complément de l’extraction des textes et des contrôles d’images.

| Restitution | Word et PDF contrôlés | Contenu vérifié |
| --- | --- | --- |
| Rapport expert détaillé | 21 pages | 12 constats, explications et URL, conseils, écoute, analyse/recommandations, lien de décision, 2 occurrences photo, plan et signature. Photos aux pages 7–8, signature à la page 21 du PDF. |
| Synthèse client illustrée | 6 pages | Les deux constats sélectionnés dans le dossier (`e2`, `f`), leurs textes et conseils, une occurrence photo et le plan filtré. La présentation actuelle n’inclut pas de signature. |

Les deux occurrences photo de la fixture utilisent la même mire : deux placements sont vérifiés dans le rapport expert, même si le fichier image n’est stocké qu’une fois dans le DOCX. Les pixels des photos et de la signature sont identiques après conversion PDF. Le plan, les légendes, les repères et l’ordre Eau → Air → Terre → Feu → À classer sont relus. Les coordonnées clonées de la fixture superposent les repères 1/3 et 2/4 sur le plan expert ; les quatre observations restent dans la légende. Ce contrôle ne qualifie ni toutes les photos de terrain, ni le rendu de repères à coordonnées distinctes.

Réserves consignées, sans correction de code ni modification des exports générés : **RAPPORT-EXPORT-CLIENT-PAGINATION**, observation coupée entre pages 2–3 et conseil isolé ; **RAPPORT-EXPORT-EXPERT-PAGINATION**, mention finale de l’aide à la décision rejetée seule page 20. Aucun texte perdu ou tronqué détecté. La prochaine action est d’améliorer les règles de saut et de maintien des blocs, puis de régénérer et revoir les fichiers avant remise finale.

Preuves : bloc canonique `rapportDossiersComplets20261113.exportsWordPdf20261113` ; [contrôle des quatre fichiers et réserves](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr152-recette-20261113/exports-word-pdf/verification-exports.json>). La recette antérieure sauvegarde/réouverture/propriétaire reste réussie et distincte. Aucun nouvel accord métier, déploiement, accès réel ou stockage d’original activé.



### Correction de pagination — 13 novembre

Le correctif en cours traite les deux réserves ci-dessus dans une copie isolée `avereo-rapport-pagination`, branche `fix/rapport-pagination-exports`. Chaque constat sélectionné client est regroupé avec ses explications, conseils et photo ; la conclusion de décision lie les avertissements à leurs limites. Le convertisseur applique `keepNext` et `keepLines` en arrêtant la chaîne à la fin de chaque groupe, afin de ne pas attacher tous les constats entre eux. Photo et légende restent ensemble. Le resserrement des espacements et marges verticales est limité à l’aide à la décision ; aucune police ni contenu métier supprimé ou réduit.

Les trois nouveaux contrôles OOXML sont d’abord en échec sur le code antérieur, puis réussissent avec le correctif ; les deux contrôles HTML garantissent le regroupement des contenus attendus. **176 tests Node réussis**, compilation locale réussie. Premier contrôle Word/PDF local expert : 20 pages au lieu de 21, avertissement et limites ensemble page 19, signature page 20 ; textes et médias identiques à l’ancien export. La synthèse client et les régénérations hébergées sont encore à vérifier ; aucune réserve ne sera close sur ce seul résultat local.

Source opérationnelle : `rapportDossiersComplets20261113.paginationCorrection20261113` dans le [suivi canonique](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>). La demande actuelle autorise cette correction et sa préproduction ; aucune fusion ni production n’en est déduite. La validation porte sur le même dossier fictif complet et sur les deux restitutions, sans sauvegarde de dossier réel. Le PDF reste obtenu par conversion native Word.


## Mise en production

Après qualification et accord distinct, promouvoir l’artefact accepté puis contrôler les parcours réels, les données et les accès. Aucun déploiement ni ouverture de production dans la tranche locale.

## Mesurer la capacité en préproduction

Dans cPanel, ouvrir phpMyAdmin et sélectionner la base de Rapport confirmée par la configuration de préproduction. Dans l’onglet SQL, cette lecture mesure les dossiers actifs, le volume des documents JSON et la taille du plus grand dossier.

```sql
SELECT COUNT(*) AS rapports,
       COALESCE(SUM(payload_bytes), 0) AS octets_json,
       COALESCE(MAX(payload_bytes), 0) AS plus_grand_rapport_octets
FROM rapport_reports;
```

Pour connaître l’espace estimé alloué aux données et aux index de toutes les tables de la base sélectionnée, y compris les éventuelles tables de restauration, utiliser cette seconde lecture.

```sql
SELECT COALESCE(SUM(data_length), 0) AS octets_donnees,
       COALESCE(SUM(index_length), 0) AS octets_index
FROM information_schema.tables
WHERE table_schema = DATABASE();
```

Les deux mesures répondent à des questions différentes. Les photos intégrées au JSON comptent dans le poids du dossier. Les fichiers de sauvegarde de l’hébergement peuvent occuper de l’espace supplémentaire. La page **Utilisation du disque** de cPanel complète ce contrôle.

Une ligne de `rapport_reports` associe le JSON complet à un identifiant de rapport, un fournisseur d’identité et un identifiant de propriétaire. La ligne contient aussi la taille enregistrée et les dates de création et de dernière sauvegarde. L’API contrôle les droits sur le serveur. Une nouvelle sauvegarde du même dossier actualise la ligne. Un administrateur de l’hébergement disposant des droits SQL peut techniquement lire le JSON complet. La supervision ci-dessus lit uniquement des agrégats.
