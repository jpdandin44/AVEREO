---
project: avereo-app-passeport-immo
document_type: feature-and-acceptance-guide
title: Centraliser les fichiers compressés d’un bien
status: active
version: git
created: 2026-11-12
updated: 2026-11-12
owner: jpdandin
tags: [documents, archives, recette, stockage]
---

# Centraliser les fichiers compressés d’un bien

## Résultat proposé

Le dossier documentaire accepte **ZIP, 7z, RAR, TAR, GZ et TGZ**, en complément
des PDF, images et documents bureautiques existants. Un `.tar.gz` utilise le
format GZ. Le fichier reste entier, associé au client et au bien : recherche,
classement, titre, détection de doublons, archivage réversible et téléchargement
utilisent les mêmes fonctions que pour les autres documents.

La version locale est consultable sur [5178](http://127.0.0.1:5178/).
Le stockage y est celui du navigateur. Cette évolution n’est pas encore livrée
sur les domaines hébergés. [État des lieux et réserves](reprise-documents-compresses.md).

Le responsable a confirmé le 12 novembre : **« Conserver les archives entières,
sans extraction »**. L’application conserve donc le conteneur original,
sans extraire ses membres. Ce choix fonctionnel ne vaut pas validation du
candidat, de phase, de merge ou de déploiement.

## Utilisation

1. Ouvrir le bien et associer son client si nécessaire.
2. Dans **Documents du bien**, choisir la catégorie puis **Ajouter des fichiers**.
3. Sélectionner les archives ; **Importer un dossier** peut aussi inclure ces fichiers.
4. Utiliser **Consulter**, puis **Télécharger le document**, pour récupérer l’original.
5. Au besoin, renommer le titre, classer, archiver ou restaurer le document.

**25 Mo par fichier**, **100 Mo et 100 fichiers par lot** : les limites portent
sur la taille des fichiers importés, sans décompression. Les noms et octets des
fichiers restent conservés. Une archive chiffrée est stockée telle quelle ; aucun
mot de passe n’est demandé ou conservé par Passeport Immo.

## Validation et sécurité

Les contrôles local et PHP reconnaissent la signature de début du conteneur et
une taille minimale cohérente avec son type. TAR désigne ici les conteneurs avec
en-tête USTAR, incluant les formats modernes usuels. Cette reconnaissance n’est
ni une extraction, ni une vérification exhaustive des membres/CRC, ni un antivirus.
Un fichier sans signature correspondante ou un lot partiellement invalide est refusé.

Aucun moteur de décompression n’est ajouté. Les fichiers restent des copies
privées, sans exécution du contenu et sans aperçu PDF/image pour les archives.
L’API conserve session CONNECT, propriétaire, contrôle du bien, CSRF, origine,
lots atomiques, empreintes et téléchargement en pièce jointe sous politique sandbox.
Le MIME navigateur n’est pas utilisé comme preuve du type d’une archive.

Le modèle de données et la sauvegarde existants sont réutilisés sans migration
de schéma. Les archives sont des fichiers documentaires comme les autres ; les
tests HTTP étendus vérifient leur restitution et la récupération du lot sauvegardé.
Leur exécution effective est à distinguer des seuls tests de reconnaissance PHP.

## Recette locale

| Critère | Action | Attendu |
| --- | --- | --- |
| A1 | Ajouter `dossier.zip` fictif à un bien/client de test. | Un document apparaît avec son nom ZIP et sa catégorie. |
| A2 | Consulter et télécharger. | Message d’archive conservée, aucun lecteur PDF ; octets téléchargés identiques. |
| A3 | Réimporter le même ZIP renommé. | Doublon signalé, pas de deuxième copie du contenu. |
| A4 | Renommer/classer, archiver puis restaurer. | Métadonnées modifiables, original conservé. |
| A5 | Tester les sept fixtures ZIP/7z/RAR4/RAR5/TAR/GZ/TGZ et des faux conteneurs. | Formats reconnus ; faux, tronqués, vides et trop gros refusés ; lot invalide sans ajout partiel. |
| A6 | En recette serveur isolée, utiliser un second compte et une seconde session. | Le même compte retrouve les octets ; l’autre compte est refusé ; sauvegarde/restitution contrôlée. |

Les fichiers de recette ne contiennent que des données fictives. Les tests
réels du navigateur ont importé et téléchargé un ZIP à l’identique sur 5178.
Les essais hébergés de cette évolution restent à effectuer après acceptation
du candidat et qualification de la cible.

## Références techniques

- [Reconnaissance 7z et structure de ses en-têtes, 7-Zip](https://www.7-zip.org/recover.html).
- [Structure RAR5 et signatures, RARLAB](https://www.rarlab.com/technote.htm).
- [Spécification GZIP, RFC 1952](https://www.rfc-editor.org/info/rfc1952/).
- [Annexe de conservation et parité](source-audit-documents-compresses.md).
- [Suivi de l’itération](../data/suivi-documents-compresses.json).

La [CI isolée qualifiée](https://github.com/jpdandin44/AVEREO/actions/runs/43213408562) réussit 68 contrôles API, 22 de sauvegarde et 35 de transfert sur ce nouveau candidat. Cette preuve complète la recette locale, sans remplacer la future recette sur le vrai hébergement.
