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

Après accord pour le candidat exact : sauvegarder et répéter le retour arrière sur copie privée, installer ensemble interface et API puis recetter deux comptes fictifs, téléchargement/empreinte, import indépendant, sauvegarde/réouverture dans une nouvelle session et propriétaire source conservé. Vérifier les anciens dossiers, Word et refus d’accès. Le diagnostic hébergé en lecture seule ne vaut pas recette hébergée de ce nouveau candidat.

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
