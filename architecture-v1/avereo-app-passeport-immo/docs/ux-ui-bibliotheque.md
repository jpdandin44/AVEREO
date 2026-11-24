---
project: avereo-app-passeport-immo
document_type: qualification
title: Bibliothèque documentaire — guide et recette locale
status: active
version: git
created: 2026-11-24
updated: 2026-11-24
owner: jpdandin
tags: [passeport-immo, ux-ui, bibliotheque]
---

# Bibliothèque documentaire

Le lot est développé dans `C:/Users/examg/Documents local/passeport-immo-ux-ui`, branche `feat/passeport-immo-bibliotheque`, depuis `5f59740` de main. [Suivi canonique](../data/suivi-ux-ui.json) · [Observation des contrôles](../api/ux-ui-local-observation.json) · [Cadrage initial](proposition-ux-ui.md). L’état hébergé n’est pas requalifié par cette itération.

## Fonctionnement du candidat

- Navigation du bien : Vue d’ensemble, Documents, Rapports privés, Travaux et devis. Les panneaux restent montés pendant la navigation afin de garder filtres, dossiers repliés et brouillons.
- Documents : dossiers par catégorie dans la colonne de gauche, liste et aperçu PDF/image. Le titre sélectionne l’aperçu ; Consulter ouvre le lecteur complet avec téléchargement. Sur petit écran, le focus amène à l’aperçu, puis revient au titre à sa fermeture. Une archive reste entière et n’est pas téléchargée automatiquement par la sélection de son titre.
- Le bouton Ajouter des documents ouvre le parcours client puis fichiers/dossier. Le formulaire est ouvert à l’arrivée dans un dossier vide. L’ajout, la détection des doublons et les plafonds proviennent du dépôt documentaire existant.
- La progression compte uniquement les fichiers des lots confirmés. Le libellé Envoi et vérification ne prétend pas mesurer les octets transférés. En cas d’interruption, Reprendre les fichiers restants renvoie le lot interrompu et les suivants dans leur catégorie d’origine, avec détection des doublons. Les objets File ne sont gardés que dans la session de la page ; après fermeture, il faut sélectionner à nouveau les fichiers.
- Renommer/classer, archiver, corbeille, restauration, purge confirmée et ordre manuel se trouvent sous Actions. La recherche suspend le réordonnancement pour conserver sa portée existante. Les icônes et couleurs personnalisées restent propres à chaque catégorie et bien.
- Les informations du bien et les travaux conservent leur enregistrement automatique natif, local ou serveur. Les documents affichent leur propre confirmation. Les boutons du bandeau commun gardent les gestionnaires natifs et leur disponibilité, notamment Sauvegarder dans le formulaire de bien ; aucun export complet supplémentaire n’est annoncé.
- Partage : adresse du seul bien, lecture seule et révocation explicites. L’activation en attente reste visible. Le dossier reçu ne propose aucun import, mutation, archives, corbeille ou copie complète privée de Rapport. L’actualisation du partage conserve recherche et catégorie ; un refus retire le dossier affiché.
- Rapports privés : le parcours existant de publication est conservé dans sa rubrique. La restitution client peut rejoindre les documents actifs ; les copies complètes privées restent dans l’espace propriétaire. La version locale explique l’indisponibilité de la publication serveur.

## Palette et composants communs

Bleu AVEREO `#002B45`, Graphite `#263238`, Blanc `#FFFFFF`, Ardoise `#64748B`, surfaces Brume `#EEF3F6`, texte sur Brume `#345469`. Typographie Inter si disponible, puis polices système, sans appel externe. Le logo et Mon compte restent le composant commun existant ; aucune copie de son authentification ou de ses fonctions n’est créée. Cibles de commande de 44 px, focus visible et noms accessibles sur les nouvelles commandes. Ce contrôle ne vaut pas audit WCAG complet.

## Recette locale à effectuer par le responsable

Point d’entrée : [application locale](http://127.0.0.1:5186/). Cliquer Se connecter (démo locale), puis ouvrir **Bien de démonstration · Bibliothèque**. Ce dossier fictif est enregistré dans le navigateur de contrôle, sans document client. Un autre navigateur/profil peut ne pas le contenir : créer alors un bien fictif et son client, puis ajouter ses fichiers de test.

| Critère | Vérification attendue |
| --- | --- |
| UX01 — Repères | Retrouver l’adresse et le client, passer entre les quatre rubriques, revenir à Mes biens. |
| UX02 — Bibliothèque | Filtrer par catégorie et titre, replier un dossier, sélectionner le PDF pour l’aperçu et le consulter en grand. Vérifier le téléchargement du fichier d’origine et d’un ZIP entier. |
| UX03 — Import | Voir pourquoi le client est requis, importer un fichier puis un dossier ; attendre la confirmation et retrouver la liste. Un ZIP reste entier. Le scénario d’interruption multi-lots est couvert par tests automatisés locaux ; sa recette réseau sur hébergement reste distincte. |
| UX04 — Classement | Ouvrir Actions, renommer/classer, changer icône/couleur, déplacer deux fichiers d’une catégorie, archiver/restaurer, mettre à la corbeille/restaurer. La purge n’est à essayer que sur un document de test après confirmation. |
| UX05 — Continuité | Saisir une pièce sans l’ajouter, changer de rubrique et vérifier la conservation. Faire de même avec recherche et dossier replié. Vérifier la lisibilité à 390 px et le clavier. |
| UX06 — Confidentialité | Lire le périmètre du dialogue de partage. Les tests locaux contrôlent la vue reçue sans commandes d’écriture et sa fermeture après révocation. Le vrai parcours CONNECT et les copies privées seront requalifiés en préproduction, après accord. |

## Quatre phases

| Phase | État du lot |
| --- | --- |
| Cadrage | Piste Bibliothèque retenue dans la demande de développement ; aucune validation formelle historique réécrite. |
| Développement local | Implémentation et qualification du candidat ; revue humaine et PR à effectuer. |
| Préproduction | Non commencée pour ce candidat ; version hébergée et accès à recontrôler après autorisation. |
| Mise en production | Non commencée pour ce candidat ; accord, sauvegarde/restauration et contrôles propres à la livraison restent distincts. |

## Limites et suite

Le modèle CIL complet et les mutations en masse restent des lots séparés. La recherche porte sur les titres/noms, sans extraction d’archive ni indexation du contenu. L’import en lots ne fournit pas une mesure réseau en octets ni une reprise après fermeture du navigateur. Pas de migration, modification d’API, nouveau droit, invitation ni opération sur l’hébergement. La [parité UX](source-audit-ux-ui.md) complète les preuves approuvées sans les modifier.

## Candidat vérifié

Source applicative `9b4ccc9814f14a3a9f8881d6184f29b6d58a1b76` ; paquet local de 22 fichiers, SHA-256 `623e3aaa249d65d78e8364e0a66400e4acdeeb95637a2aafa8a15ffd583a36c9`. Les éventuels commits de suivi documentaire suivants ne modifient pas ce contenu applicatif. 85 tests frontend et 42 tests Python réussis, parité intégrale, preuves historiques et vues cockpit conservées ; build et relecture de l’archive réussis. Dix documents et 242 liens locaux vérifiés. Captures locales bureau et mobile dans `.local/`, décrites par le reçu. La CI et la recette humaine restent des preuves distinctes.
