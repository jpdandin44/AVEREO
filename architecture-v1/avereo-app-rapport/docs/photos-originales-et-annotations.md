---
project: avereo-app-rapport
document_type: cadrage
title: Photos originales privées et versions annotées du rapport
status: active
version: git
created: 2026-11-12
updated: 2026-11-12
owner: jpdandin
tags: [rapport, photos, originaux, annotations, connect, passeport]
---

# Photos originales privées et versions annotées du rapport

Cadrage du prochain lot fonctionnel, préparé dans la [délégation de compression](../prompts/delegation-compression-photos.md) (section « Complément du responsable »). Il ne développe ni API, ni stockage, ni éditeur : rien de décrit ici n'existe encore, sauf mention « Existant ».

## Statuts utilisés

| Statut | Sens |
| --- | --- |
| Confirmé | Demandé par le responsable. |
| Existant | Constaté lors de la délégation initiale sur `f48a3a9` ; les changements du lot 0 sont ensuite intégrés sans modifier ces flux photo. |
| Proposition | Piste de ce cadrage, à valider. |
| TBD | Décision ou mesure manquante ; aucune valeur n'est supposée. |

## Besoin et principes

| Point | Statut |
| --- | --- |
| Conserver les photos **originales** pour rouvrir un détail. | Confirmé |
| Les placer dans un **espace privé du dossier en ligne**, accessible avec CONNECT. | Confirmé |
| Proposer recadrage, commentaires et formes sur une **version dérivée** réinjectable dans le rapport. | Confirmé |
| Aucune optimisation ne supprime le seul exemplaire d'un original. | Confirmé |
| Les 500 Mo concernent le chargement dans Passeport Immo (500 Mo par fichier **et** par lot, puis plusieurs lots), pas un quota total. Rapport garde son plafond JSON par défaut de 50 Mio. Aucune limite de Passeport ou d'o2switch n'est modifiée. | Confirmé |
| Aucun nouveau rôle ni accès partagé implicite. | Confirmé |
| Bibliothèque privée liée au dossier **et** à son propriétaire, accès intercomptes refusé. | Confirmé |
| Envois fichier par fichier, sans originaux en base64 dans le JSON. | Proposition |
| Contrôle d'accès côté serveur à **chaque** lecture et écriture avec identité CONNECT : exigence de confidentialité confirmée ; détails d'implémentation à préparer. | Confirmé / Proposition d'implémentation |
| Original immuable ; version « rapport » dérivée ; opérations de recadrage, texte et formes **réversibles** (liste d'opérations rejouable sur l'original) ; choix explicite de la version avant export. | Proposition |

## Existant utile

| Élément | Constat |
| --- | --- |
| Photos du dossier | `observations[].photos[]` = `{ id, name, src, horodatageISO }`, `src` étant une data URL dans le JSON (`App.jsx`). |
| Brouillon local | IndexedDB (`idb-keyval`) avec repli `localStorage`. |
| Sauvegarde en ligne | `reports.php` enregistre le JSON dans `rapport_reports.payload_json` ; propriétaire `owner_provider` + `owner_id`. Pour un compte ordinaire : dossier d'autrui absent de la liste, lecture GET 404, écriture POST 403. Les administrateurs habilités suivent l'exception existante. Plafond `max_payload_bytes` par défaut = 50 Mio (réponse 413). |
| Administrateur | Le rôle `administrateur_rapport` peut administrer tous les rapports (`docs/authentication.md`). Son droit sur des fichiers privés n'est pas défini. |
| Copie de test | Exclut images, plans et signature ; import JSON + sauvegarde en ligne crée un dossier indépendant sous le compte importateur ([partage](partage-tests-et-stockage.md)). |
| Export / import JSON | Le JSON complet contient les photos en base64 ; import limité à 50 Mio (`MAX_REPORT_BYTES`). |
| Sauvegarde | La mesure de capacité et la sauvegarde documentées portent sur la base MySQL et la configuration ; aucun fichier privé de photos n'existe encore ([rollback](rollback.md)). |
| Word | `reportDocx.js` lit les data URL `png/jpeg/gif/webp` et affiche les photos au plus à 570 px de largeur. Cette transformation d'affichage ne réduit ni la définition ni les octets JPEG/PNG/GIF incorporés ; WebP est converti en PNG à définition native. Le poids du Word reste donc à maîtriser par une version rapport adaptée, après conservation de l'original. |
| Plans | Les plans annotés (repères) sont déjà rendus par canvas (`annotatedPlanImage`) ; ce n'est pas un éditeur de photos. |
| Passeport Immo | Contrat local `MAX_FILE_SIZE`/`MAX_BATCH_SIZE` de 500 Mo, 100 fichiers par requête, empreinte SHA-256 par bien (`document-store.js`, `docs/import-volumineux.md`). Candidat local, qualification hébergée distincte. Consulté sans modification. |
| Compression | `photoCompression.js` et ses 12 tests existent comme [candidat isolé](compression-photos.md), non branché dans le parcours. |

## Phase 0 — Cadrage

### Raccordements à traiter

| Raccordement | Existant | Proposition à valider | Refus et échecs à prévoir |
| --- | --- | --- | --- |
| Import fichier et caméra | Import : lecture directe en data URL ; caméra : PNG canvas | L'original est envoyé individuellement au serveur ; la photo du dossier porte une référence `original` (`id`, SHA-256, octets, type, dimensions) et une version rapport | Refus de stockage, fichier trop lourd, perte réseau : la photo reste utilisable localement, jamais marquée « original conservé » |
| Brouillon local | JSON dans IndexedDB | Original en attente conservé comme fichier (Blob) hors du JSON, avec état « à envoyer » | Fermeture avant envoi : reprise à la réouverture |
| Sauvegarde en ligne | JSON seul, 50 Mio | JSON = références et opérations ; originaux sur leur propre chemin | Dossier remplacé ou constat supprimé pendant un envoi : l'envoi est rattaché à l'identifiant du dossier d'origine, jamais injecté dans un autre ; orphelin signalé |
| Réouverture, autre session ou ordinateur | Rouvre le JSON du serveur | Version rapport immédiate ; original chargé à la demande | Session expirée (30 min) : relance CONNECT sans perte |
| Copie vers un autre propriétaire | Copie de test sans images | Une référence d'un autre compte est refusée ou retirée à l'import ; toute copie d'original est un acte explicite du propriétaire | Refus inter-comptes, test avec deux identités |
| Export JSON | Photos en base64 | Export allégé (références) ; « export complet avec originaux » = TBD | Un JSON importé ailleurs ne donne jamais accès aux originaux |
| Sauvegarde et restauration | Base MySQL | Les fichiers privés **ne sont pas couverts** par la sauvegarde SQL : sauvegarde jointe des fichiers et de leur table, restauration cohérente | Restauration à blanc sur copie privée ; référence sans fichier détectée |
| Word | Data URL de la version rapport | Inchangé : la version rapport sert de `src` ; l'original n'est jamais exporté sans choix | Pas de version rapport : l'export le signale |
| Futur PDF et Passeport | Aucun PDF natif ; Passeport accepte des fichiers par lot | Transfert des **seuls fichiers choisis** (original ou version rapport, au choix explicite), empreinte transmise ; jamais de copie automatique de la photothèque | Limites de Passeport respectées sans les modifier |

### Contrôles côté serveur à préparer

- Chaque lecture et écriture vérifie l'identité CONNECT puis le propriétaire du dossier ; aucune URL publique, aucun lien partageable.
- Original immuable : un identifiant existant ne peut être ni remplacé ni modifié ; l'empreinte SHA-256 calculée par le navigateur est recalculée et vérifiée par le serveur.
- Même contenu dans un dossier : détecté par empreinte, un seul exemplaire ; jamais de dédoublonnage entre propriétaires.
- Accès d'un administrateur aux originaux : TBD, **refusé tant qu'il n'est pas décidé**.

### Décisions TBD

| Sujet | Piste |
| --- | --- |
| Lieu de stockage : fichiers hors racine web ou base de données | Fichiers privés hors racine web, métadonnées en base (comme les données privées déjà tenues hors du document root) |
| Taille maximale par original, quota par dossier ou par compte | Aucune valeur supposée ; à mesurer sur l'espace réel de l'hébergement (page Utilisation du disque) |
| Suppression d'une photo du dossier : le fichier privé est-il supprimé ? | À arbitrer entre immuabilité et droit à l'effacement |
| Durée de conservation, suppression d'un dossier | TBD |
| Accès administrateur et support | Voir ci-dessus |
| Formats : HEIC et autres formats de téléphone | TBD, à constater sur appareils |
| Métadonnées EXIF (dont position) de l'original | Conservées dans l'original privé ; absentes de la version rapport |
| Forme des opérations (recadrage en fractions, texte, formes simples) et interface | Cadrage fonctionnel séparé avant tout éditeur |

### Critères d'acceptation du lot

1. Un original envoyé est relu octet pour octet, avec la même empreinte, depuis une autre session.
2. Un autre compte CONNECT n'obtient ni lecture, ni écriture, ni liste.
3. Aucune compression ne remplace un exemplaire non confirmé côté serveur.
4. Recadrage, texte et formes se défont ; la version rapport se régénère depuis l'original.
5. Le Word utilise la version rapport choisie ; l'original n'est jamais embarqué sans choix.
6. Anciens dossiers et photos sans original : inchangés, utilisables.
7. Échec de stockage, envoi interrompu, dossier remplacé pendant l'envoi : aucun état faux annoncé, reprise possible.
8. Sauvegarde puis restauration à blanc : fichiers et références concordent.

## Phase 1 — Développement local

Périmètre proposé, à engager séparément après le lot 0 : table de métadonnées additive et point d'accès PHP aux envois et lectures individuels, côté Rapport seulement ; lecture/écriture de la référence dans le dossier ; envoi du Blob depuis l'import et la caméra ; version rapport et opérations ; Word depuis la version rapport. Aucune limite de Passeport ou d'o2switch modifiée.

Contrôles : tests PHP de refus inter-comptes, d'immutabilité et d'empreinte erronée ; tests `node:test` des règles pures (dont les 12 de `photoCompression.js`) ; recette navigateur avec images **fictives** et deux identités locales ; essai d'échec de stockage et de reprise. Aucune donnée réelle. Revue locale.

La compression locale n'est **activée qu'à cette phase**, et seulement après confirmation serveur de l'original.

## Phase 2 — Préproduction

Candidat nommé avec son point d'entrée réel. Sauvegarde fraîche (base, configuration **et** fichiers privés) puis restauration sur copie privée avant installation. Qualification avec deux comptes CONNECT réels de test : refus inter-comptes, réouverture depuis un autre appareil, session de 30 minutes. Valeurs PHP effectives et espace disque mesurés sur cette cible, taille maximale par original arrêtée à partir de ces mesures. Recette de vraies photos de téléphone par le responsable, sur dossiers de test. Revue en préproduction.

## Phase 3 — Mise en production

Après accord humain explicite : sauvegarde préalable de la base et des fichiers, migration additive, retour arrière documenté (les fichiers privés ne sont jamais supprimés par un retour applicatif). Contrôles après livraison sur la **production réelle** : envoi, relecture identique, refus inter-comptes, export Word. Le transfert vers Passeport reste une évolution distincte, par fichiers choisis, selon la qualification de Passeport.

## Historique des versions

- 2026-11-12 : première version du cadrage, après confirmation de la conservation des originaux dans l'espace privé du dossier en ligne.
