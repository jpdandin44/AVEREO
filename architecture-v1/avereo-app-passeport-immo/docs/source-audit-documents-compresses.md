---
project: avereo-app-passeport-immo
document_type: source-audit
title: Annexe de parité — formats documentaires compressés
status: active
version: git
created: 2026-11-12
updated: 2026-11-13
owner: jpdandin
tags: [parite, documents, archives]
---

# Annexe de parité — formats documentaires compressés

La suite [imports volumineux](import-volumineux.md) relève d’un nouveau candidat :
limites 500 Mo, planification des lots, progression et décomptes serveur. Elle est
documentée séparément ; les constats PR144 ci-dessous et ses reçus ne lui
attribuent aucune qualification hébergée.

La demande du 12 novembre autorise l’évolution des types de fichiers pour
centraliser les archives du client dans Passeport Immo. Le point de départ est
`main` à `16338e844912fade2a5e8b315b8313fe6f7e2dbd`, dans une copie de travail
isolée. Les modifications et données des anciennes copies sont conservées.

Cette annexe complète les audits et matrices approuvés sans réécrire leurs
octets, ni leur attribuer l’acceptation de la présente évolution.

| Composant | Évolution autorisée | Conservation vérifiée |
| --- | --- | --- |
| `document-store.js` | Six extensions, types d’archive, signatures et filtre de sélection commun. | Association client/bien, Blob, empreinte, transaction et métadonnées existants ; aucun extracteur. |
| `DocumentsPanel.jsx` et `documents.css` | Formats annoncés, sélecteur élargi, texte de consultation adapté aux archives ; étapes client/import visibles et explication de l’enregistrement automatique avec sa cible. | Association client toujours obligatoire : imports et sélecteur désactivés avant confirmation ; catégories, recherche, original, classement et archivage/restauration conservés. |
| `api/storage.php` | Même liste d’extensions, signatures et MIME canoniques d’archive. | Droits, contrôles du lot, fichiers privés, base et règles de téléchargement inchangés. |
| Tests et CI | Fixtures fictives, refus, restitution intersession, sauvegarde et tests PHP dédiés. | Pas de données client ni d’archives réelles dans Git ou le build. |
| Application principale | Aucun changement de `App.jsx`. | Chiffrage, navigation, identité, PDF et CSV contrôlés par la parité et les tests de régression. |

Le contrôle de parité existant réussit sur ce périmètre ; il reste consacré à
la comparaison historique du prototype et aux écarts déjà inversés. Les tests
documentaires qualifient séparément la nouvelle extension des formats.

Les 21 références documentaires déjà approuvées restent inchangées. D06 et
les autres décisions antérieures gardent leur portée ; elles n’acceptent pas
automatiquement ce nouveau candidat ni son déploiement.

## Rétablissement des références lors de la reprise

La nouvelle copie Windows avait converti les fins de ligne des Markdown approuvés.
Leurs octets ont été rétablis depuis les sources correspondant aux empreintes de
validation. Une règle Git limitée aux Markdown de ce dossier conserve désormais LF.
Un ajout du 4 novembre avait aussi modifié le guide `02-integration-connect.md`
après sa validation : son information est conservée dans
[l’annexe du cycle de vie CONNECT](integration-connect-cycle-vie.md), puis le
guide historique est restauré exactement. Aucune empreinte ni décision n’est recalculée
pour faire accepter un document modifié.

## Livraison privée à 500 Mo après PR146

Le nouveau livreur réutilise le moteur existant, fixe le paquet CI et ajoute seulement les deux limites `.user.ini` et `api/index.php` sur leurs empreintes antérieures exactes. `.htaccess`, CONNECT et le menu sont préservés. Les sondes privées qualifient la réception réelle sans document fictif ajouté ; [reçu et limites de preuve](preproduction-import-volumineux.md). Les 21 références approuvées restent identiques.

## Corbeille et dossiers personnalisés

Le [lot organisation](organisation-documents.md#matrice-des-écarts-et-contrôles) porte la matrice du nouveau candidat. L’ancien guide approuvé reste inchangé ; parité, tests métier et références documentaires sont vérifiés séparément.

La [livraison PR153](preproduction-organisation.md) installe le même candidat CI en préproduction privée : six écritures, douze chemins préservés, deux colonnes additives sans extension des droits applicatifs. Les 28 documents et les valeurs métier initiales sont comparés à la sauvegarde ; les 21 références approuvées restent identiques.
