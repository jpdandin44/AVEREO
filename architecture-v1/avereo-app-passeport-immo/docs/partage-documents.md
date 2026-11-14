---
project: avereo-app-passeport-immo
document_type: incident-and-acceptance
title: Partage nominatif des documents entre comptes CONNECT
status: active
version: git
created: 2026-11-13
updated: 2026-11-13
owner: jpdandin
tags: [partage, connect, documents, securite]
---

# Partage nominatif des documents entre comptes CONNECT

## Cadrage

Le bouton historique « Partager » ouvrait `navigator.share` avec l’adresse générale
du site et un titre de devis. Il ne créait aucun droit, ne ciblait aucun bien ni
destinataire. Le responsable signale cet incident pour transmettre les documents
d’un bien à un expert et confirme un accès **en lecture seule et révocable**.
La recette corbeille/classement est validée dans le chat ; PR155 reste ouverte,
ses cases GitHub et la production ne sont pas validées par l’agent.

Le [suivi du partage](../data/suivi-partage-documents.json) fait foi pour l’état de
ce nouveau candidat. Aucune donnée client ou correspondance nominative n’est
commise dans les fixtures. L’accès réel exige une confirmation nominative distincte.

## Développement local

Le nouveau bouton ouvre un écran interne : saisie exacte du compte, vérification
du destinataire, périmètre visible puis confirmation. Le partage comprend la liste,
la consultation et le téléchargement des **documents actifs, actuels et futurs**.
Les documents archivés et ceux de la corbeille sont exclus. Les tarifs, devis,
pièces du logement et autres biens ne sont pas transmis. Aucun e-mail automatique.

Le destinataire trouve « Documents partagés avec moi » dans son propre espace.
Les documents restent chez le propriétaire, avec classement et ordre ; les routes
d’écriture propriétaires ne lui sont jamais ouvertes. Révoquer bloque les appels
suivants ; les fichiers déjà téléchargés et les requêtes déjà commencées ne peuvent
pas être rappelés depuis son appareil.

### Identités et droits

Une projection privée des seuls noms, identifiants CONNECT, empreintes de recherche
et indicateurs d’éligibilité est renouvelée par une commande de maintenance.
Elle ne contient ni secret ni adresse e-mail en clair. La recherche porte sur une
valeur exacte (nom CONNECT, identifiant, adresse ou partie locale d’adresse unique) ;
une ambiguïté est refusée. Le compte confirmé est lié à son identifiant signé ;
une correspondance modifiée avant confirmation entraîne un refus.

Le [producteur de projection](../workflows/export-share-directory.php) lit CONNECT
avec sa configuration existante en CLI. Le processus web Passeport conserve ses
seuls identifiants de base dédiés. Aucun fichier de CONNECT n’est modifié. Une
projection absente, incohérente, d’un autre environnement ou âgée de plus de trois
minutes ferme les partages ; le renouvellement est prévu chaque minute.

L’éligibilité effective est celle du dépôt CONNECT (`canLaunchApplication`).
Un compte déjà autorisé à Passeport mais dont l’activation est en attente peut
recevoir une invitation préparée ; il ne peut lire aucun document avant activation
normale. L’agent ne marque pas cette activation à sa place. Une révocation CONNECT
ou de l’accès au bien bloque les prochaines requêtes. Le propriétaire doit aussi
rester éligible.

### Stockage, sauvegarde et transfert

`pi_biens.document_shares LONGTEXT NULL` conserve révision, destinataires,
identifiants aléatoires, date de création et révocation. Les écritures verrouillent
le bien et refusent une révision périmée. Quatre tables sont conservées ; les
sauvegardes de lignes incluent ces champs. Le schéma SQL archivé par la sauvegarde
planifiée doit être actualisé lors de la livraison. Les transferts entre
environnements excluent explicitement les autorisations : les identités CONNECT
ne sont pas supposées identiques et aucun accès n’est créé par une migration.

La [migration](../workflows/migrate-document-sharing.php) simule par défaut et
requiert le nom exact de la base dédiée. Elle ajoute une colonne nullable, relit
les données et ne nécessite aucun nouveau privilège permanent pour l’application.

### Critères de recette

| Critère | Attendu |
| --- | --- |
| P1 | Le bouton ouvre l’écran interne ; aucun partage Windows d’une URL générale. |
| P2 | Le propriétaire vérifie un compte exact puis confirme son identité et le périmètre. |
| P3 | Le destinataire éligible retrouve le bien et télécharge les octets originaux. |
| P4 | Aucune écriture, réorganisation, corbeille ou gestion du partage depuis le compte destinataire. |
| P5 | Un autre compte, un lien recopié ou une requête sans authentification ne donne aucun accès. |
| P6 | Archives, corbeille, autres biens et modèle privé du logement sont exclus. |
| P7 | Révocation du partage ou de l’éligibilité CONNECT : appels suivants refusés. |
| P8 | Compte en attente, projection périmée et révision concurrente : état explicite, aucun accès indu. |
| P9 | Sauvegarde/restauration conserve les droits ; transfert entre environnements n’en crée pas. |
| P10 | Consultation et gestion existantes du propriétaire, fichiers 500 Mo et classement conservés. |

## Préproduction

Le même paquet CI gelé est installé le 13 novembre dans la seule préproduction
privée après récupération fraîche et retour arrière testé sur copie : 19 chemins
vérifiés, six écritures publiques, une colonne nullable ajoutée par l’administration
existante, sans nouveau privilège permanent pour l’application. Le schéma archivé
de sauvegarde, resté ancien, est réaligné avec les colonnes actuelles ; sa copie
antérieure est conservée. La projection privée est renouvelée chaque minute,
avec conservation des tâches de sauvegarde existantes. Aucun code CONNECT ou
autre application, aucune production ni ligne métier n’est modifié par l’installation.

Les [preuves hébergées](../api/preproduction-partage-observation.json) distinguent
140 assertions HTTP/API en CI, 13 assertions positives/négatives sur tables
temporaires hébergées et 210 assertions HTTPS sur les données existantes. Les
26 documents du relevé frais sont téléchargés à l’identique dans deux sessions
normales indépendantes du compte usuel. Le relevé antérieur corbeille en comptait
28 ; aucune restauration de cette ancienne photographie ne remplace les données
courantes. Les tests incluent l’autre bien du même propriétaire, exclu du partage.

Le navigateur affiche le bon destinataire et le seul bien désigné : 11 documents
actifs, six archives exclues. La confirmation nominative du nouvel accès reste
en attente. Le contrôle trouve le droit Passeport existant du destinataire mais
son activation CONNECT inachevée : ce prérequis reste à terminer par son titulaire.
Aucune activation fictive ni connexion positive du destinataire n’est revendiquée.

Pour la recette P1–P10 : depuis CONNECT, ouvrir le bien autorisé, choisir
**Partager les documents**, vérifier le compte exact puis confirmer le périmètre.
Le destinataire active son compte normalement et ouvre Passeport depuis son
CONNECT ; son accueil doit montrer **Documents partagés avec moi**. Vérifier les
11 documents actifs et leur téléchargement, l’absence de l’autre bien et des
commandes de modification, puis la révocation sur un partage de recette convenu.
Ne jamais tester une purge ou modifier un document réel pour la démonstration.

[PR157 du correctif](https://github.com/jpdandin44/AVEREO/pull/157), en brouillon, empilée sur PR155 ouverte ; fusion sans conflit au contrôle, quatre attestations humaines décochées.

## Mise en production

Suspendue pour ce lot. La validation corbeille/classement et le merge PR155 restent
distincts du partage et de son nouveau candidat. Aucun déploiement de production,
changement de droits CONNECT ou envoi de message n’est autorisé implicitement.
