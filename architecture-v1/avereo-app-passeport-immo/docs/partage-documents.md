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

État initial : candidat de partage non livré. Le contrôle en lecture seule trouve
le compte expert avec droit Passeport existant mais activation CONNECT en attente.
Ce prérequis reste à terminer par son titulaire. La cible reste privée ; qualifier
le nouveau candidat, la migration sur copie et la récupération fraîche avant
installation. Aucun partage réel ni activation fictive ne sert de test.

## Mise en production

Suspendue pour ce lot. La validation corbeille/classement et le merge PR155 restent
distincts du partage et de son nouveau candidat. Aucun déploiement de production,
changement de droits CONNECT ou envoi de message n’est autorisé implicitement.
