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

État initial : **67 tests frontend, 28 tests Python, parité, cockpit et build
réussis**. PHP est vérifié localement. Les nouveaux scénarios HTTP/MariaDB et de
transfert sont préparés ; leur exécution CI reste à qualifier dans le reçu.

## Préproduction

Ce candidat n’est pas installé. Le site privé conserve le candidat 500 Mo précédent.
Préparer une sauvegarde fraîche des quatre tables, documents et code, puis tester
sa restauration sur une copie avant toute future livraison autorisée.

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

Aucune modification distante ni purge d’un document réel n’est réalisée dans cette
préparation. Revue locale, migration/recette de préproduction, acceptation et accord
de production restent distincts. Ne pas rejouer migration SCI, activation CONNECT
ou cron pour ce lot.
