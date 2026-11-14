---
project: avereo-app-passeport-immo
document_type: feature-and-acceptance-guide
title: Corbeille et organisation des documents du bien
status: active
version: git
created: 2026-11-13
updated: 2026-11-13
owner: jpdandin
tags: [documents, corbeille, classement, recette]
---

# Corbeille et organisation des documents du bien

## Cadrage

Le responsable demande une corbeille restaurable avant suppression définitive,
des dossiers parents par catégorie, le choix d’une icône/couleur pour chaque
catégorie et la possibilité de modifier l’ordre des fichiers. Les préférences
sont conservées **par bien**, avec partage entre appareils dans le mode serveur.
Les six catégories métier existantes restent les références de classement.

Le [suivi canonique](../data/suivi-organisation-documents.json) et le
[reçu factuel](../api/organisation-documents-observation.json) décrivent cette
itération. Les décisions et preuves approuvées antérieures restent intactes.
La PR147 de livraison 500 Mo est fusionnée ; elle ne livre pas ce nouveau candidat.

[PR153 — revue locale fusionnée](https://github.com/jpdandin44/AVEREO/pull/153). Le responsable autorise ensuite la livraison privée ; la recette hébergée est distincte de cette acceptation locale.

## Développement local

### Utilisation

- **Documents**, **Archives** et **Corbeille** sont trois vues distinctes, avec compteurs.
- **Mettre à la corbeille** conserve le fichier, son client, sa catégorie et son
  éventuel état archivé. Aucune suppression automatique n’est programmée.
- **Restaurer le document** le rend à son état précédent. Un document anciennement
  archivé revient donc dans **Archives**.
- **Supprimer définitivement** ouvre une confirmation nommant le document.
  Annuler ou fermer ne déclenche aucune suppression. Après confirmation et succès,
  la ligne et le fichier du stockage actif sont retirés. Cette action n’est plus
  annulable depuis la corbeille ; les anciennes sauvegardes suivent leur rétention.
- Les documents sont regroupés sous des dossiers parents repliables par catégorie.
  Recherche, filtre et consultation restent disponibles, y compris dans la corbeille.
- **Personnaliser les catégories** propose huit icônes et un choix de couleur pour
  chacune des six catégories. **Enregistrer les catégories** conserve l’ensemble
  pour ce bien. Annuler conserve les réglages antérieurs.
- **Monter / Descendre** déplace les fichiers dans leur dossier. Les commandes
  sont désactivées aux extrémités et masquées pendant une recherche textuelle.
  Les positions des autres états restent conservées. Les nouveaux fichiers sans
  position explicite apparaissent après les fichiers déjà ordonnés.
- Un doublon présent dans la corbeille provoque un message demandant restauration
  ou suppression définitive, et annule le lot entier. Changer la catégorie retire
  l’ancienne référence d’ordre ; restaurer conserve la position encore disponible.

### Stockage et garanties

`pi_documents.trashed_at` est nullable et distinct de `archived_at`.
`pi_biens.document_settings` conserve catégories, ordre et révision, séparément du
modèle de bien autosauvegardé. IndexedDB conserve les mêmes informations sans
recréation de la base existante. Un conflit de révision refuse l’écrasement des
réglages enregistrés depuis une autre fenêtre.

L’API conserve identité, propriétaire du bien, origine et CSRF pour toute écriture.
`PATCH .../documents/:id` accepte `{"trashed": true}` ou `false` seul ; les
documents en corbeille ne sont pas modifiables sans restauration. `DELETE` exige
en plus `{"confirm": true}` et le passage préalable par la corbeille.
`PUT .../document-settings` accepte `revision`, `categories` et `order` ; icônes,
couleurs hexadécimales, unicité des identifiants et appartenance bien/catégorie sont
vérifiées. Aucun SVG ou style arbitraire fourni par le navigateur n’est exécuté.

La purge verrouille le bien, vérifie le blob, le déplace temporairement dans le
même répertoire privé puis supprime la ligne et nettoie les références d’ordre.
Après commit SQL, le fichier temporaire est effacé. Un rollback SQL confirmé
restaure les octets. En cas de commit incertain ou d’échec du nettoyage après
commit, le fichier privé `.purge-*` est conservé pour intervention opérateur et
l’API n’annonce pas de succès. Ne pas effacer ces fichiers automatiquement :
comparer ligne, empreinte, journal et sauvegarde avant récupération ou nettoyage.

Les sauvegardes existantes des quatre tables incluent corbeille et réglages ;
une sauvegarde antérieure peut encore contenir un document purgé. Le transfert
ciblé conserve ces champs et remappe les identifiants utilisés dans l’ordre.
Les anciens manifestes sans les deux champs restent importables avec valeurs nulles.
Les scripts historiques de reprise et leurs empreintes ne sont pas réécrits.

### Recette proposée

| Critère | Action sur données fictives | Attendu |
| --- | --- | --- |
| O1 | Mettre un PDF puis une archive à la corbeille, rouvrir le dossier. | Absents de la vue active, présents en corbeille avec octets conservés. |
| O2 | Restaurer un document actif puis un document archivé. | Retour dans la bonne vue, client/catégorie/contenu conservés. |
| O3 | Ouvrir la confirmation de purge puis annuler. | Document toujours présent et restaurable. |
| O4 | Confirmer la purge d’un document fictif de la corbeille. | Ligne et blob supprimés, autres documents inchangés. |
| O5 | Replier un dossier, rechercher et filtrer. | Classement par catégorie et résultats cohérents. |
| O6 | Choisir une icône/couleur, enregistrer, rouvrir. | Apparence conservée pour ce bien seulement. |
| O7 | Déplacer deux fichiers, rouvrir une seconde session. | Ordre conservé ; aucune référence à un autre bien acceptée. |
| O8 | Réimporter un contenu dans la corbeille, puis après purge. | Explication et lot annulé dans le premier cas ; nouvel ajout après purge. |
| O9 | Écriture étrangère, sans CSRF ou sur ancienne révision. | Refus sans perte de données. |
| O10 | Sauvegarde/restauration, transfert, migration et échec SQL pendant purge. | États, réglages et octets conservés ou rollback explicite. |

Qualification réussie : **67 tests frontend, 28 tests Python, 101 assertions API/MariaDB, 22 de sauvegarde planifiée, 37 de transfert et 83 Apache**. Parité, cockpit, PHP, build et ZIP fermé passent. La [CI du candidat](https://github.com/jpdandin44/AVEREO/actions/runs/43448211761) est réussie. Le navigateur local vérifie les dossiers, la personnalisation et l’ordre après réouverture, la corbeille et la restauration d’un document archivé ; la confirmation de purge y est annulée. Les purges effectives sont testées uniquement sur fixtures automatisées isolées.

### Matrice des écarts et contrôles

| Source | Évolution | Conservation vérifiée |
| --- | --- | --- |
| `DocumentsPanel.jsx`, `DocumentOrganisation.jsx` | Trois vues, dossiers parents, apparence, confirmation et déplacement. | Recherche, catégories, consultation, import et client obligatoires. |
| `document-store.js`, `document-settings.js` | Métadonnées IndexedDB, transactions corbeille/blob, révision et ordre. | Base existante, archives entières, doublons et anciens fichiers fictifs. |
| `server-store.js`, `api/index.php`, `api/storage.php` | API propriétaire/CSRF et suppression confirmée avec rollback. | Sessions CONNECT, accès privé, atomicité des lots et 500 Mo. |
| Schéma et migration | Deux colonnes nullables, simulation et vérification des données. | Quatre tables, modèle du bien et lignes historiques. |
| Sauvegarde et transfert ciblé | Champs sauvegardés, ordre remappé ; anciens manifestes acceptés. | Clients, états, dates, octets, autres comptes et autres biens. |

## Préproduction

Ce candidat est [installé et techniquement vérifié en préproduction privée](preproduction-organisation.md). Les deux colonnes sont ajoutées via l’administration existante, la sauvegarde comprend 28 documents, et 247 assertions HTTPS réussissent. Les vérifications visuelles retrouvent six actifs et trois archives SCI, dossiers, commandes d’ordre, personnalisation et corbeille vide. Les critères O1–O10 restent à valider humainement selon la recette liée.

La [migration additive](../workflows/migrate-document-organisation.php) doit être
qualifiée sur cette copie. Utiliser le vrai fichier de configuration privé et le
nom exact de sa base :

```text
php migrate-document-organisation.php /chemin/prive/config.php NOM_BASE
php migrate-document-organisation.php /chemin/prive/config.php NOM_BASE --apply
```

La première commande simule. L’application effective exige le nom de base exact,
les seules quatre tables Passeport Immo, le verrou de migration et le droit ALTER
sur cette base. Elle ajoute uniquement les deux colonnes manquantes, compare les
données existantes et peut être rejouée sans les réinitialiser. Le droit ALTER
reste une opération d’installation à qualifier séparément ; l’application n’a
pas besoin de ce droit en fonctionnement. Aucune valeur secrète n’est affichée.

Les anciennes versions ignorent ces champs et pourraient réafficher les documents
en corbeille lors d’un retour de code. Après utilisation de la corbeille, privilégier
un correctif conservant cette fonction ; ne pas supprimer les colonnes ni restaurer
une ancienne base sur des données récentes. Qualifier le retour arrière du nouveau
candidat avant livraison. Une migration DDL partiellement terminée se reprend par
simulation, puis ajout du champ restant ; ne pas masquer un échec de comparaison.

## Mise en production

La livraison décrite concerne la seule préproduction privée ; aucun document réel n’est mis à la corbeille ou purgé par les essais. Revue locale acquise, recette humaine hébergée et accord de production restent distincts. Ne pas rejouer migration SCI, activation CONNECT
ou cron pour ce lot.
