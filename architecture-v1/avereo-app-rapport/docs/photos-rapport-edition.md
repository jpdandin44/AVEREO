---
project: avereo-app-rapport
document_type: specification
title: Préparer une photo pour le rapport sans modifier son original
status: active
version: git
created: 2026-11-13
updated: 2026-11-13
owner: jpdandin
tags: [rapport, photos, recadrage, annotations]
---

# Préparer une photo pour le rapport

## Cadrage

Reprise autorisée par le responsable après validation et fusion de PR154. Le prochain jalon du suivi photo est la version recadrée/annotée, précédée du traitement du fichier orphelin non compté après arrêt brutal. Source canonique : `rapportV12CadrageProfils20261112.editionPhotos20261113` dans [suivi-chantier.json](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>).

Périmètre local : recadrage, rectangle, flèche et commentaire ; annuler/rétablir ; choix explicite original ou version préparée dans le rapport. L'original `photo.src` et sa référence privée restent intacts. Les anciens dossiers restent utilisables. La copie préparée et ses opérations sont conservées dans le JSON du dossier ; les deux restitutions utilisent le même choix en respectant la sélection client. Aucun accès supplémentaire, migration, activation du stockage hébergé ou PDF direct.

Critères : original conservé octet pour octet, annulation sans effet, opérations réversibles, réouverture du JSON avec le même choix et les annotations, export expert/client conforme, refus d'un résultat tardif visant une autre photo. Le quota des originaux doit compter les fichiers privés sans ligne SQL, y compris temporaires, sans suppression automatique ; les octets déjà réservés en base restent comptés si le fichier manque.

## Développement local

Copie isolée `C:/Users/examg/Documents local/avereo-rapport-photos-edition`, branche `feat/rapport-photos-edition`, base `e7302bc5b1fe18b02a51d9df5702ed00b1358871`. Candidat local implémenté. Entrée de revue : [Rapport local](http://127.0.0.1:5188/) ; le service doit être actif sur ce poste. Charger le [dossier fictif préparé](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-photos-edition-20261113/dossier-photos-preparees.json>), puis Observations → observation 2 → Préparer la photo du rapport. Préserver tout autre brouillon du même navigateur avant import ; ce candidat utilise son propre port.

### Parcours et contrat

Choisir un outil, glisser pour recadrer/tracer ou saisir un commentaire puis cliquer pour le placer. **Annuler la modification** et **Rétablir la modification** concernent la séance en cours. **Tout le cadrage** réaffiche l’image entière avec ses annotations ; **Repartir de l’original** propose une image entière sans annotation et reste annulable. **Annuler et fermer** ou Échap ne modifie pas le dossier. **Appliquer au rapport** crée la copie et la sélectionne. Les commandes **Utiliser l’original** / **Utiliser la version préparée** changent le choix sans effacer la copie.

`photo.src` reste inchangé. Le champ optionnel `reportVersion` contient `version: 1`, `sourcePhotoId`, `sourceSha256` (empreinte de l’original décodé), `operations: { crop, annotations }`, `src`, `width`, `height`, `preparedAt`. Le champ `reportPhotoChoice` vaut `prepared` ou `original` ; absence = original. Le recadrage `{x,y,width,height}` est en fractions de l’original et garde au moins 1 % par dimension. Les annotations sont `rectangle` / `arrow` (`x,y,x2,y2`) ou `text` (`x,y,text`), toujours dans ce repère complet. Les éléments en dehors du cadrage sont masqués par ce cadrage, leurs opérations sont conservées. L’historique annuler/rétablir n’est pas une archive de versions : seule la composition appliquée est persistée.

Copie JPEG de côté maximal 1 600 px, qualité canvas 0,90 ; aperçu de côté maximal 1 000 px. Au plus 30 annotations, 200 caractères par commentaire et 40 étapes d’historique. JPEG/PNG/WebP intégrés uniquement, aucune image distante chargée ; décodage refusé en cas d’erreur ou au-delà de 40 millions de pixels constatés. La limite est vérifiée après décodage par le navigateur, sans garantie de mémoire sur tous appareils. L’original conserve ses métadonnées ; la copie réencodée peut retirer EXIF/position. Aucune police externe, aucun HTML de commentaire exécuté. L’empreinte décrit l’original de la préparation et n’accorde aucun droit de lecture privé.

### Vérifications et limites

- 186 tests Node réussis, dont choix original/préparée, JSON, attachement tardif, opérations invalides, annuler/rétablir et filtrage des deux livrables. Deux builds réussis (synchronisation désactivée/activée).
- Tests PHP complets réussis avec SQLite, processus concurrents, restauration, refus inter-comptes/admin et routes HTTP hors base. Le cas des résidus après crash échoue sur l’ancien code puis passe après correction. Fichiers absents toujours réservés et orphelins non supprimés.
- Navigateur de bureau : recadrage, trois annotations, annuler/rétablir, annuler sans appliquer, choix réversible, reprise du brouillon dans un autre onglet et réimport JSON réussis sur mire synthétique. Les originaux, plans et signature restent identiques. Les deux Word intègrent exactement la copie choisie ; l’autre photo originale reste dans l’expert et le filtrage client est conservé.
- **Réserve :** HTTP/MariaDB non rejoué, Docker Desktop échoue avant lancement de la base. Aucun résultat MariaDB, CONNECT hébergé, vraie photo mobile, contrôle Word natif ou PDF de ce candidat annoncé. Relancer ce contrôle quand le service local est disponible avant de préparer une activation hébergée.

[Recette navigateur](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-photos-edition-20261113/verification-navigateur.json>) · [Intégrité et Word](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-photos-edition-20261113/verification-artifacts.json>). Le JSON conserve l’original et la copie : le poids total peut augmenter, plafond 50 Mio inchangé. La copie JPEG à 1 600 px peut être insuffisante pour certains détails ; choisir l’original pour ces cas. La galerie, la caméra et l’ouverture privée des originaux gardent leurs parcours ; leurs vrais appareils restent à qualifier.

## Préproduction

Non engagée. La conservation des originaux reste désactivée sur la cible. Quotas réels, rétention/effacement, sauvegarde/restauration conjointe et recette CONNECT restent nécessaires avant activation ; aucune valeur de Passeport Immo n'est réutilisée comme quota Rapport. Recette locale sur images synthétiques, sans fichier réel.

## Mise en production

Non engagée, non autorisée. Revue humaine du candidat local puis décisions de livraison distinctes.
