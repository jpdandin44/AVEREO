---
project: avereo-app-rapport
document_type: qualification
title: Volume des dossiers complets sans perte
status: active
version: git
created: 2026-11-21
updated: 2026-11-21
owner: jpdandin
tags: [rapport, passeport, volume, integrite, local]
---

# Volume des dossiers complets sans perte

Lot `RAP-PUBLICATION-VOLUME-SANS-PERTE-20261120`, priorité R12-18. **Candidat local en préparation de revue ; aucune livraison hébergée.** Le [cadrage métier et les critères VOL-01 à VOL-07](<C:/Users/examg/Documents local/Habitologue/Opportunité_Connect/docs/rapport-v1-2/cadrage-retours-philippe.md#lot-volume-sans-perte>) restent la référence des retours Philippe. Le suivi opérationnel canonique est `rapportV12CadrageProfils20261112.volumeSansPerte20261120` dans le [suivi de chantier](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>) ; les reçus y sont rattachés. Ce document décrit le contrat et la qualification du candidat, sans réattribuer les validations des lots précédents.

## Cadrage

Le message « La copie JSON dépasse 50 Mio » est reproduit sur un **dossier fictif complet de 61 081 494 octets**, comprenant 14 observations, 22 photos dont une de contexte, 12 plans, une signature, des légendes, repères et versions préparées. L'ancien seuil est **52 428 800 octets**. Le JSON réel complet de Philippe n'est pas disponible : sa taille, sa répartition et sa compatibilité avec le candidat restent **TBD**. Le partage manuel d'un document final observé en réunion ne prouve pas la préparation du paquet qui avait échoué.

La proposition bornée est **100 000 000 octets de JSON, soit 100 Mo**, avant et après reconstitution avec les originaux. Ce doublement couvre le cas reproduit ; il ne constitue pas une capacité illimitée ni une confirmation du cas réel de Philippe. L'acceptation de ce plafond et des ressources sur l'hébergement reste à qualifier avant livraison autorisée.

## Développement local

### Contrat commun et conservation

La source machine unique est [report-volumes.json](../../avereo-platform/shared/report-volumes.json). Les utilitaires JS/PHP ne portent que les limites, leur affichage et la vérification du budget mémoire. Le script racine `.github/scripts/prepare-report-volumes.mjs` produit les copies API des deux applications ; `npm test` vérifie leur identité, `dev` et `build` les préparent. Les copies versionnées permettent aussi les tests PHP d'un checkout neuf. Elles ne doivent jamais être modifiées seules.

| Objet | Limite exacte | Effet du candidat |
| --- | ---: | --- |
| JSON Rapport stocké ou réouvert | 100 000 000 octets = 100 Mo | Remplace les gardes 50 Mio du parcours |
| Paquet complet, fichier ou lot documentaire | 524 288 000 octets = 524,288 Mo (500 Mio) | Octets autorisés inchangés ; libellés corrigés |
| Requête multipart Passeport | 536 870 912 octets = 512 Mio | Enveloppe existante inchangée |
| Enveloppe API Rapport | 1 048 576 octets au-delà du JSON | Métadonnées de requête distinctes du plafond de contenu |

Le ZIP reste **STORE, schéma 1**. Aucun redimensionnement, recompression, retrait de média ou changement SQL. Les validations de chemins, nombres d'entrées, SHA-256, doublons, références, propriété, droits, CSRF, idempotence et transaction restent en place. Les plafonds individuels des images/plans ne changent pas. L'export de secours reste possible au-delà du plafond : à proximité de la limite, il utilise un JSON compact plutôt que de rendre l'export indûment trop gros par indentation.

La taille réouverte est calculée avant téléchargement d'originaux et génération Word, puis contrôlée à nouveau à la lecture. Le serveur Passeport vérifie lui aussi cette reconstitution avant dépôt. Un refus ne retire aucune photo et n'écrase pas le brouillon.

Les seules différences techniques d'une copie indépendante sont le retrait de `onlineReportId` et le remplacement de la référence privée `photo.original` du compte source par ses octets exacts dans `photo.src`. Les identifiants métier, associations, versions préparées, choix d'image, annotations, légendes et repères restent égaux.

Les essais ont aussi révélé une conversion historique des objets JSON vides en listes vides lors du stockage Rapport. Le candidat utilise une vue de validation en tableaux séparée de l'arbre natif stocké et réouvert ; `{}`, `[]` et les objets à clés numériques gardent leur type. Aucune réécriture des anciennes lignes.

### Preuves locales

Les reçus sont conservés dans [l'archive du lot](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-volume-sans-perte-20261120>). Le paquet complet avec une référence d'original ajoutée contient 61 081 754 octets de JSON et pèse 61 110 251 octets ; son stockage et sa lecture conservent les **37 occurrences de médias décodés, SHA-256 identiques**, ainsi que les contenus métier.

- Rapport : **257 tests** ; Passeport : **78 tests**, réussis. Les tests portent notamment sur les types JSON, les refus avant téléchargement et le contenu des copies indépendantes.
- Codec réel : seuil historique exact et +1, plafond de 100 000 000 accepté et réexportable, 100 000 001 refusé sans écriture réseau. Jeu complet avec original référencé, versions préparées et annotations exactes ; source inchangée.
- Rapport PHP/MariaDB local : **48 contrôles réussis** sur le dossier complet, nouvelle session indépendante, sauvegarde de copie, propriétaire source et lignes source préservés, téléchargement exact et refus de confirmation si la base n'a pas conservé le contenu.
- Passeport PHP/Apache/MariaDB local : **185 assertions HTTP**, sauvegarde puis restauration temporaire du paquet complet, nouvelle session, idempotence, copie privée inaccessible au destinataire, restitution client exacte, révocation et conservation de l'original. Les 41 contrôles de transfert historique et 22 contrôles de sauvegarde planifiée passent également.
- Inspecteur PHP réel : JSON de 100 000 000 accepté ; 100 000 001 refusé. Un budget PHP de 128 Mio refuse le dossier complet de façon lisible avant import ; aucun dépôt partiel.
- API Rapport PHP/MariaDB réelle : JSON de **100 000 000 octets enregistré**, téléchargé exactement après une nouvelle session fictive ; **100 000 001 refusé avec 413**, puis contenu sauvegardé toujours exact. Le jeu de seuil conserve aussi `{}` et `[]`. La ligne de test temporaire est supprimée après contrôle, sans toucher au dossier complet source.
- Outillage : **42 tests** de préparation/revue/livraison réussis et paquet applicatif Passeport relu à l'identique. La première CI a refusé les deux nouveaux fichiers de contrat absents de l'inventaire public du paquet ; cet inventaire les nomme désormais exactement et refuse un couple incomplet. Les fichiers privés et noms inattendus restent refusés ; les anciens candidats sans contrat de volume restent compatibles. La correction concerne l'empaquetage et ne change pas les octets du runtime déjà testé.

Le Word du test de transport est une petite restitution fictive. **Ces preuves ne valident pas la génération et la pagination des deux Word expert/client sur le gros dossier.** La qualification navigateur de ce lot n'a pas été effectuée, l'initialisation de l'outil étant indisponible. Les tests HTTP utilisent le sas natif avec des identités fictives locales, et ne constituent pas une reconnexion CONNECT/OAuth hébergée.

### Ressources et limites observées

Le processus Node des essais séquentiels aux seuils atteint **1 084 980 Kio de pic RSS**, avec un tas plafonné à 2 Gio. Ce n'est pas une mesure du navigateur ni une qualification mobile. L'inspection PHP du paquet complet culmine à 144 703 488 octets ; celle du JSON de 100 Mo à 203 423 744 octets sous un budget de 512 Mio. Les gardes mémoire sont des estimations préalables ; ils ne prouvent pas la capacité de toute structure JSON possible.

La recette Rapport utilise PHP 768 Mio, une base jetable limitée à 1 536 Mio/1 CPU et `max_allowed_packet=134217728`. Les requêtes sur le dossier de 61 Mo prennent jusqu'à **83,683 s** dans cet environnement ; le test de seuil à 100 Mo atteint **124,617 s** pour l'enregistrement et **121,435 s** pour le refus à +1 octet, avec une temporisation de test de 150 s. Cette latence reste une réserve ; elle ne doit pas être présentée comme une performance d'usage acceptable ou une mesure de l'hébergement. Les budgets, temporisations, taille de requête, `max_payload_bytes` privé et paquet MySQL doivent être vérifiés avant installation. Une configuration privée conservée à 50 Mio continue de refuser ce volume ; aucun fichier privé n'est modifié par le candidat.

### Reproduire sans données réelles

Depuis la racine du monorepo, après installation habituelle des dépendances des deux applications :

```text
node .github/scripts/prepare-report-volumes.mjs all --check
node --expose-gc --max-old-space-size=2048 architecture-v1/avereo-app-rapport/tests/qualify-report-volume.mjs CHEMIN_JSON_FICTIF DOSSIER_RESULTATS
python architecture-v1/avereo-app-rapport/tests/report-files-http.py --volume --fixture CHEMIN_JSON_FICTIF --receipt RECU_JSON --serve --port 5230
python architecture-v1/avereo-app-rapport/tests/qualify-report-api-volume.py --receipt RECU_SEUIL_JSON
```

Le second test HTTP dépend du serveur jetable lancé par le précédent ; ses modifications ne concernent que ses lignes fictives. Le jeu volumineux et les paquets ne sont pas commités. Pour étendre la recette Passeport existante, fournir le paquet fictif par `PASSEPORT_VOLUME_ARCHIVE` au script `tests/check-storage-http.py`. Aucun secret de cible hébergée n'est nécessaire.

## Préproduction

**Non autorisée pour ce lot.** À préparer après revue : génération réelle des Word expert/client, parcours navigateur complet du paquet, reconnexion hébergée, vérification des capacités et durées, sauvegarde/restauration fraîche et comparaison des dossiers/propriétaires existants. Le plan de livraison doit inclure les deux API et leurs deux fichiers de contrat avant leurs consommateurs ; les configurations, droits, règles d'accès et applications étrangères restent protégés. Une augmentation privée de plafond ou de ressource demande son propre accord applicable.

Retour arrière : restaurer les seuls fichiers du delta vérifié, conserver toutes les données/paquets créés. Les anciennes limites peuvent rendre un gros dossier non éditable par l'ancien runtime ; préserver la possibilité de récupérer sa copie complète et ne jamais supprimer ses données pour satisfaire le retour arrière.

## Mise en production

**Non autorisée.** Aucun merge, déploiement, droit temporaire ni ouverture publique réalisé. La prochaine reprise reste la revue du candidat local et la levée des réserves ; les autres retours Philippe conservent leur priorité dans le cadrage source.
