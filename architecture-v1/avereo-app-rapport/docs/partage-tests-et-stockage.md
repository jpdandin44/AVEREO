---
project: avereo-app-rapport
document_type: procedure
title: Partager un dossier de test et suivre le stockage de Rapport
status: active
version: git
created: 2026-11-10
updated: 2026-11-10
owner: jpdandin
tags: [rapport, partage, stockage, administration]
---

# Partager un dossier de test et suivre le stockage de Rapport

## Transmettre le dossier ouvert

Dans Rapport, reprendre le brouillon du bon navigateur ou ouvrir la sauvegarde en ligne voulue. Vérifier la version avant de poursuivre. Dans **Export**, choisir **Partager une copie pour les tests**. Le propriétaire peut télécharger le JSON et le remettre au support par un canal privé. Si le navigateur propose le partage de fichiers, il peut aussi choisir le destinataire dans le menu de son appareil.

La copie conserve les catégories, les protocoles, les phases, les choix reconnus et une observation fictive par constat. Elle exclut les identifiants d’origine, le contenu libre, les coordonnées, la localisation, les pièces jointes, les plans, les images et la signature. Cette copie permet de tester la structure du dossier. Pour reproduire un problème de photo ou de texte, le destinataire ajoute un exemple fictif. **Export JSON** et **Enregistrer en local** produisent, eux, un export complet à usage du propriétaire.

Le destinataire utilise **Export → Import JSON** dans un profil de test. Une sauvegarde en ligne de cette copie crée un dossier indépendant sous son compte. Le partage s’effectue sur l’appareil, sans création de lien de consultation, sans requête de partage au serveur et sans modification des droits.

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
