---
project: avereo-app-passeport-immo
document_type: user-guide
title: Documents du client et du bien
status: active
version: git
created: 2026-10-14
updated: 2026-10-14
owner: jpdandin
tags: [passeport-immo, documents, local]
---

# Documents du client et du bien

Le dossier documentaire se trouve en haut de la fiche du bien. Il permet de
consulter les documents du client dans cette version locale de Passeport Immo.

## Utiliser le dossier

1. Ouvrir un bien depuis « Mes Biens », puis associer un client existant ou saisir son nom/raison sociale.
2. Choisir la catégorie des nouveaux documents ; ajouter plusieurs fichiers ou sélectionner un dossier.
3. Utiliser « Renommer ou classer » pour donner un titre lisible sans renommer le fichier source.
4. Rechercher par titre/nom de fichier ou filtrer par catégorie.
5. « Consulter » ouvre le PDF ou l’image dans un lecteur. Les documents bureautiques se téléchargent pour être ouverts dans leur logiciel.
6. « Archiver » retire le document de la liste active ; « Archives » permet de le consulter ou de le restaurer. Aucune suppression définitive n’est proposée.

Un client peut être associé à plusieurs biens. Les documents restent dans le
dossier du bien où ils ont été importés. Le client d’un dossier rempli ne peut
pas être remplacé silencieusement. Les anciennes pièces jointes peuvent être
reprises dans le dossier, avec conservation de leur copie précédente.

## Formats et conservation

PDF, JPEG, PNG, WebP, TXT, CSV, DOC/DOCX, XLS/XLSX et ODT : 25 Mo par fichier,
100 Mo et 100 fichiers par import. Les sous-dossiers cachés de sauvegarde sont
ignorés lors d’un import de dossier. Les ZIP restent à extraire sur le poste. Le lecteur PDF intégré utilise PDF.js,
avec pages précédente/suivante et adaptation à la largeur de la fenêtre.
Le contenu identique d’un fichier n’est ajouté qu’une fois par bien, même si son
nom change. Un lot invalide ou un enregistrement refusé conserve l’état antérieur.

Les copies sont conservées dans le navigateur du PC, à la même adresse locale
et dans le même profil. Elles restent présentes après fermeture/reprise, mais
effacer les données du navigateur peut les supprimer. Conserver le dossier source
et télécharger les pièces importantes. Le stockage partagé et la sauvegarde
centralisée ne sont pas disponibles dans ce lot.

## Cas concret fourni

Le cas comporte cinq PDF et 33 pages : diagnostic et annexes, façades, plans,
urbanisme, devis/factures. Dix pages de deux fichiers ont été retournées ; le
diagnostic a aussi été remis dans l’ordre imprimé 1 à 8. Trois fichiers étaient
déjà lisibles et sont restés identiques. Les sauvegardes et les reçus détaillés
restent privés, hors Git. Les fichiers corrigés sont enregistrés dans le dossier source.

Le responsable confirme l’adresse du bien. La lecture en grand format du devis
et du diagnostic confirme la même référence. La surface retenue provient du DPE.
Une première réserve issue d’une erreur de lecture a été retirée de la fiche.

Les [coupes comparatives préparées dans Coupe](coupes-bien.md) ajoutent un PDF
de deux pages : six documents actifs et 35 pages au total, avec une ancienne
copie du diagnostic archivée. Les projets modifiables et SVG restent dans le
sous-dossier `coupes/` du dossier source réel.

## Suite

Le [statut face aux sources ExamIn](progression-examin.md) distingue la version
locale des exigences serveur, de partage et de droits encore absentes.
