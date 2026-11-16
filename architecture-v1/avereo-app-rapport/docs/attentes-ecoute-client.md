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

Le 16 novembre, le responsable déclare les tests OK ; les quatre cases humaines sont constatées cochées et la PR159 fusionnée (58d6aab), arbre identique au candidat qualifié 73c4447. Les contrôles locaux ci-dessous restent attachés à cette version ; la livraison hébergée est décrite dans Préproduction.

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

Deux Word téléchargés depuis l’application locale : ZIP/XML, textes et médias contrôlés (9/8 entrées du dossier ZIP media, dont 8/7 fichiers images expert/client) ; attentes présentes dans les deux, notes présentes seulement dans l’expert. Aucune nouvelle lecture native Word/PDF ou qualification de pagination dans ce lot. Compilations et dernière observation GitHub sont rattachées au suivi canonique et au reçu de qualification.

[Revue locale](http://127.0.0.1:5192/) sur ce PC : Charger un dossier JSON → choisir architecture-v1/avereo-app-rapport/.local/attentes-recette.json dans cette copie → vérifier le résumé fictif → Charger le dossier complet → Export. Le brouillon antérieur a été restauré : ne pas utiliser Reprendre pour charger la recette. Exportez votre brouillon avant tout remplacement. Les preuves privées de sauvegarde ne sont pas publiées.

Pour relancer cette revue depuis frontend : npm.cmd ci puis npm.cmd run dev -- --host 127.0.0.1 --port 5192 --strictPort. La copie en revue utilise VITE_ENABLE_ONLINE_SYNC=false ; aucune donnée de cette recette n’est envoyée à Rapport hébergé. Les preuves locales sont dans .local/attentes-qa et le suivi [canonique](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>) sous rapportV12CadrageProfils20261112.attentesEcoute20261116.

## Préproduction

Livraison explicitement demandée le 16 novembre après les tests et le merge humains de PR159. [Rapport préproduction](https://rapport-preprod.avereo.fr/) via CONNECT sert le candidat 73c44473f9197bc2d57699bbdb15fde24c29b4a9, merge 58d6aab4469e8ec973a9e32f85e254c10124058f, arbre identique. Paquet qualifié de 150 fichiers promu sans reconstruction, SHA-256 12afd494d8e384d93dc8db02c9ca3e13af66df29d32f3e5ec655737e4bdcc996. Cinq fichiers livrés : validation PHP, JS/CSS, module Word et index.html en dernier.

Cible isolée vérifiée ; sauvegarde fraîche de l’application/configuration relue, restauration et retour arrière code répétés sur une copie indépendante ; sauvegarde privée des dossiers relue. Aucune restauration SQL, migration ou écriture de dossier. **22 dossiers, toutes leurs colonnes et propriétaires inchangés**, configuration et production conservées. 202 fichiers préexistants conservés à l’installation ; les variantes communes déjà revues restent hors de ce périmètre. Après navigation, seule une ligne attendue « Ticket invalide » est ajoutée au journal CONNECT par le test de refus ; préfixe sauvegardé intact, autres empreintes exactes.

Trois ressources HTTPS exactes ; racine redirigée vers CONNECT et accès anonymes refusés. Connexion SSO normale réussie, sans nouveau compte ou droit. Interface fraîche vérifiée sur le dossier fictif complet : deux attentes, reformulation, signalement de source modifiée, notes, lien à T1 et parcours Habitologue conservés. Deux requêtes de contrôle rejetées par la nouvelle validation PHP ; identifiant de corps volontairement invalide empêchant toute écriture même avec une ancienne validation. Aucune activation des originaux privés.

Les deux Word générés depuis l’hôte ont les **textes, liens et fichiers images identiques** aux fichiers qualifiés localement (8 images expert, 7 client). Notes complémentaires seulement dans l’expert. Les nombres historiques 9/8 comptaient aussi l’entrée du répertoire ZIP media ; aucune image manquante. Aucune nouvelle lecture native Word/PDF ou qualification de pagination. Brouillon initial restauré dans les quatre emplacements et empreintes identiques après rechargement.

[Reçu de livraison](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr159-preprod-20261116/delivery.json>) · [sauvegarde et retour arrière](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr159-preprod-20261116/recovery.json>) · [alignement après navigation](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr159-preprod-20261116/verification-post-navigation.json>) · [Word](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr159-preprod-20261116/verification-word-preproduction.json>). Source canonique : rapportV12CadrageProfils20261112.attentesEcoute20261116.preproduction20261116.

Le contrôle de livraison ci-dessus était limité à l’alignement, l’interface et les exports, sans nouvelle écriture de dossier. La recette dédiée a ensuite été explicitement demandée par le responsable ; son résultat figure ci-dessous. Les preuves de livraison et de Terrain du 14 restent historiques et conservées.

### Recette complète du 16 novembre

**Recette technique réussie** sur RECETTE-ATTENTES-PR159-20261116, identifiant serveur 4e6c15beb119de79798a097fb722214e, propriétaire avereo_connect:1. Copie fictive indépendante du dossier de recette Terrain ; la source n’a pas été modifiée. Trois attentes créées par l’interface : reprise entière de deux textes de l’écoute puis reformulation de la première, et troisième attente manuelle. Priorité, source et verbatim conservés ; modification de l’écoute signalée sans écrasement ni doublon. Notes complémentaires avec URL et deux liens : T1 vers attentes 1/3, chauffage numéro 9 vers attente 2. Une seconde correction du libellé conserve les associations.

Deux sauvegardes en ligne réussies sur le même identifiant, puis téléchargement du JSON complet depuis la liste serveur. **14 constats, quatre photos, quatre plans et signature** conservés ; attentes, notes, liens, écoute et provenance exacts par rapport au brouillon final. Rapport puis CONNECT déconnectés normalement ; nouvel onglet anonyme, connexion normale réalisée par le responsable, **Reprendre désactivé**, téléchargement et ouverture depuis la liste serveur. JSON avant/après identique octet pour octet, 1 037 996 octets, SHA-256 269e84d40f6d4d45c9a6de35adfb81ae6b02394b9c96c4bc1c6c29e02c95e281. Relecture dans Export : reformulation, notes, texte initial, avertissement et sélections T1/chauffage conservés.

**22 dossiers antérieurs, toutes leurs colonnes et propriétaires exacts ; 23 au total**, un seul cas fictif ajouté. Nouvelle ligne inchangée dans toutes ses colonnes entre les deux audits ; source Terrain intacte. Audits sans écriture SQL, schéma identique hors avance normale du compteur AUTO_INCREMENT. Code, ressources, configuration et fichiers de production préservés ; aucune nouvelle ligne au journal dans les deux audits de recette. Les chiffres de la livraison ci-dessus restent ceux de ce contrôle antérieur.

Brouillon initial restauré dans les deux clés de localStorage et les deux clés IndexedDB, valeurs comparées puis empreintes identiques après rechargement. Accueil relancé normalement par CONNECT et ancien brouillon affiché. Aucun contenu privé initial publié. Premier refus lié à un accès Rapport expiré résolu par le parcours normal CONNECT, avec recherche avant création ; pause respectée puis reprise explicite. Un accès applicatif expiré au dernier rechargement a également été renouvelé par le lien normal CONNECT. Aucun compte, droit ou réglage de sécurité modifié.

[Reçu final](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr159-attentes-recette-20261116/verification-finale.json>) · [réouverture serveur](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr159-attentes-recette-20261116/recette-reouverture-serveur.json>) · [conservation](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr159-attentes-recette-20261116/conservation-after-reopen.json>) · [restauration du brouillon](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr159-attentes-recette-20261116/restauration-brouillon.json>). Source canonique : rapportV12CadrageProfils20261112.attentesEcoute20261116.preproduction20261116.functionalRecipe20261116.

**Revue métier** : ouvrir [Rapport préproduction](https://rapport-preprod.avereo.fr/) par CONNECT, rechercher RECETTE-ATTENTES-PR159-20261116 dans la liste serveur puis Ouvrir le dossier → Export. Ne pas utiliser Reprendre pour la recette : le brouillon antérieur est restauré. La revue humaine hébergée reste à recueillir. Les deux Word de la livraison gardent leurs preuves ; aucune nouvelle génération/lecture native Word/PDF ni qualification du microphone ou du service vocal dans cette recette. La réserve préexistante des types objet/liste reste distincte. Aucun nouveau code, déploiement ou prochain lot engagé.

## Mise en production

Non engagée et non autorisée. Suites à cadrer séparément : interventions/planning avec Projet, autres profils métier, identité des organisations, activation et qualification des originaux privés. Les validations humaines et décisions de passage restent au responsable.
