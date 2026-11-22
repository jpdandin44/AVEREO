---
project: avereo-app-rapport
document_type: feature-scope
title: Publication des dossiers finalisés dans Passeport Immo
status: active
version: git
created: 2026-11-19
updated: 2026-11-21
owner: jpdandin
tags: [rapport, passeport-immo, publication, partage]
---

## 21 novembre — Correction de volume en préparation locale

Le [lot sans perte](volume-sans-perte.md) remplace dans le candidat les gardes JSON de 50 Mio décrits ci-dessous par 100 Mo avant et après reconstitution. Le plafond de paquet historiquement libellé « 500 Mo » est exactement 524 288 000 octets, soit 500 Mio, sans augmentation dans ce lot. Les observations datées de la PR173 restent historiques ; leurs autorisations et preuves ne valent pas livraison du nouveau candidat. Le stockage des types JSON vides est aussi corrigé pour les futures sauvegardes. Aucune donnée ancienne réécrite.


# Cadrage

Demande du responsable le 19 novembre : terminer le transfert fictif entre comptes et rendre les dossiers finalisés publiables dans Passeport Immo pour les conserver et les partager. Ce lot porte la publication d’une restitution depuis Rapport, en conservant l’original et son propriétaire. Aucun document réel ni partage nominatif réel n’est désigné par cette demande.

## Existant vérifié dans le code

- Rapport génère déjà un Word expert/client et un JSON complet réouvrable. La validation de l’onglet Export distingue erreurs de saisie et alertes métier ; elle n’est pas une validation humaine automatique.
- Passeport Immo stocke des documents attachés à un bien et à son client. Le téléversement existe, notamment pour PDF, Word et ZIP, jusqu’à 500 Mo par fichier/lot. JSON brut n’est pas un format de dépôt autorisé actuellement.
- Son partage nominatif CONNECT est en lecture seule et révocable. Il couvre les documents **actifs, actuels et futurs** d’un bien ; archives et corbeille sont exclues. Déposer un nouveau fichier actif dans un bien déjà partagé peut donc le rendre accessible aux destinataires existants.
- Le destinataire n’acquiert pas la propriété des documents et ne peut pas modifier le bien. Transférer la propriété d’un dossier Rapport et partager une restitution dans Passeport sont deux opérations distinctes.

Références : [partage Passeport](../../avereo-app-passeport-immo/docs/partage-documents.md), [stockage des documents](../../avereo-app-passeport-immo/docs/documents-bien.md), [contrôle du JSON complet](../frontend/src/reportFiles.js).

## Contenu confirmé le 19 novembre

Le responsable confirme **rapport final et copie complète privée du dossier réouvrable**, et autorise la poursuite en préproduction. La restitution destinée aux destinataires est distincte de la copie complète. La réouverture métier pour reprendre/modifier la visite se fait dans **Rapport** ; Passeport Immo assure la conservation et le téléchargement de la copie, sans devenir un éditeur Rapport. Cette séparation applicative n’est pas un chiffrement empêchant la lecture technique d’un fichier téléchargé.

Une copie complète peut contenir les notes d’écoute et des détails d’expertise absents de la restitution client. Son dépôt ne doit pas entraîner leur partage par défaut. Ne pas assimiler le classement dans une catégorie ou le nom du fichier à un contrôle d’accès privé. Le statut d’archive n’est pas une nouvelle permission permanente. Si des originaux photo sont conservés séparément du JSON sur le serveur Rapport, le format de copie complète doit les prendre en compte et contrôler leur réimport ; un simple lien vers les fichiers du propriétaire source ne constitue pas une copie autonome.

## Critères proposés pour la recette

1. Un dossier finalisé produit une version identifiée, datée et reliée au dossier source ; la validation professionnelle reste explicite.
2. Le propriétaire choisit le bien et le client de destination autorisés. L’original Rapport et son propriétaire restent conservés.
3. Le contenu réellement enregistré est vérifiable après reconnexion ; un nouvel envoi ne remplace pas silencieusement une version précédente.
4. Le périmètre destiné au client ne contient pas la copie de travail complète par défaut. Si la copie complète est retenue, sa conservation privée et son exclusion des partages doivent être contrôlées côté serveur.
5. Le partage réutilise l’identité CONNECT, une confirmation nominative et la révocation existante. Aucun lien public ni courriel automatique n’est déduit de la publication.
6. Les droits Rapport de lecture/export et les droits Passeport sur le bien sont vérifiés séparément ; la présence d’un identifiant de dossier ou de bien dans une requête n’est pas une autorisation.
7. Mauvais compte, ancien état, fichier incomplet, limite de taille, reprise après erreur et tentative de doublon sont explicites. Les documents et partages déjà présents restent conservés.

# Développement local

Branche `feat/rapport-publication-passeport`, base main `b2eb8e57afce57780e8657a49a321c11116da639`. Candidat implémenté, qualification en cours. Les 251 tests Rapport et 78 tests d’interface Passeport passent. Le navigateur local a généré puis réimporté le dossier fictif de 14 observations, 4 photos (dont contexte), 12 plans et signature ; les empreintes et l’exclusion de l’intervention confidentielle dans le Word client sont contrôlées. Ces preuves restent locales, distinctes d’un dépôt hébergé.

Parcours :

1. Rapport → Export → « Conserver et partager dans Passeport Immo » : relire la restitution client, confirmer, puis préparer le fichier `.avereo.zip`. Le statut indique qu’il n’est pas encore publié.
2. Passeport → bien/client → dossier documentaire → « Versions finalisées de Rapport » : choisir ce fichier et confirmer. La restitution client Word devient un document actif et suit les partages nominatifs actuels/futurs. Aucun courriel ou destinataire supplémentaire n’est créé par cet import.
3. Seul le propriétaire du bien télécharge la copie complète, avec son contrôle d’empreinte. Rapport → « Charger un dossier JSON ou Passeport » vérifie et prévisualise le contenu avant le remplacement éventuel du brouillon. Une sauvegarde crée une nouvelle ligne sous le compte courant ; la ligne source reste intacte.

## Format et limites

ZIP à entrées **STORE** (pas d’expansion d’archive compressée), maximum 500 Mo et 2 001 entrées. `manifest.json` (64 Kio maximum) déclare `schema=avereo-rapport-publication`, `version=1`, identifiant hexadécimal de 32 caractères, date, titre/référence, confirmation de finalisation, chemins, tailles, SHA-256 et correspondances des originaux. Entrées autorisées : `rapport-client.docx`, `dossier-rapport.json` (50 Mio maximum) et `originaux/<id>.jpg|png|webp`. Noms inconnus, doublons, chemins traversants, liens symboliques serveur, compression et fichiers altérés sont refusés.

Le JSON complet reste intact dans le paquet. Les originaux privés sont téléchargés par le service Rapport avec vérification de leur référence, taille et empreinte ; leur indisponibilité bloque la préparation, sans copie incomplète silencieuse. Au réimport, leurs octets remplacent les anciennes références de compte, tout en conservant les versions recadrées/annotées. La limite finale de 50 Mio de Rapport reste applicable après réintégration. Le format est un conteneur documentaire, pas une signature cryptographique d’identité.

## Stockage, compatibilité et sauvegarde

Passeport utilise la colonne additive nullable `pi_biens.report_publications`. `workflows/migrate-report-publications.php CONFIG BASE` prévisualise ; `--apply` n’agit que sur la base dédiée identifiée, sous verrou, en contrôlant la conservation des lignes et l’idempotence. Sans cette colonne, le nouvel import refuse de fonctionner ; les documents et partages historiques continuent de fonctionner.

Le paquet complet est un blob privé indépendant de `pi_documents`, avec nom dérivé du propriétaire, du bien et de la version. Les listes et téléchargements partagés ne consultent jamais ce stockage. Une ancienne version de l’application ignore la nouvelle colonne : un retour arrière de code ne rend pas la copie partageable. Le Word final utilise la transaction de dépôt existante, incluse dans une transaction globale avec les métadonnées privées. Un échec confirmé annule les écritures de la nouvelle version sans effacer un fichier déjà présent.

La sauvegarde `workflows/backup-storage.php` inclut ces blobs privés et vérifie leur empreinte ; le schéma et la copie programmée de cet outil doivent être alignés lors de la livraison. Les notes privées restent dans ces sauvegardes hors dossier public. Le dépôt ordinaire d’une archive contenant ce manifeste est refusé, même si elle est renommée : son utilisateur est orienté vers l’import privé dédié. L’ancien outil CLI de transfert sélectif entre environnements continue de fonctionner sur les biens sans publication ; il refuse explicitement un bien contenant une copie privée, avant tout export partiel. Son adaptation à un transfert complet est à qualifier dans un lot distinct.

## API Passeport

Routes sous l’identité CONNECT du propriétaire du bien :

| Méthode | Route | Effet |
| --- | --- | --- |
| GET | `/api/biens/{bien}/report-publications` | Métadonnées des versions privées |
| POST | même route | Multipart `publication`, `confirm=true`, origine et CSRF requis |
| GET | `/api/biens/{bien}/report-publications/{version}/source` | Copie complète privée en pièce jointe et SHA-256 |

Même identifiant et même archive : réponse idempotente ; même identifiant et contenu différent : 409. Compte étranger ou bien erroné : 404. Un destinataire partagé n’acquiert aucun de ces droits.

# Préproduction

`avereo-app-passeport-immo/workflows/release-report-publications.py` réutilise le moteur de livraison sélectionnée des deux applications. `prepare` vérifie les cibles déclarées, sauvegarde et restaure les fichiers sur copie et les données en tables temporaires. Les empreintes hébergées attendues sont figées dans la sélection du candidat. `apply --authorized-selection SHA256` exige le même couple de paquets, protège les chemins non concernés, installe l’ajout nullable et aligne les outils privés de sauvegarde sous leur verrou existant. Les dépendances API précèdent le routeur et les index. Un échec restaure uniquement les octets encore identiques à cette livraison ; la colonne nullable peut rester présente sans exposer de source. `verify` contrôle les fichiers effectivement installés. Production, configuration, portes d’accès et calendrier des tâches restent gardés par empreintes.

Transfert fictif réel terminé le 19 novembre : copie complète de 14 observations transférée de 37 à 38, sauvegarde destinataire et réouverture serveur après déconnexion complète/nouvelle connexion natives réussies. Original complet et témoin restent au compte source ; 29 dossiers préexistants exacts, périodes et configuration rétablies. Le suivi opérationnel garde les reçus. Le parcours visuel privé Chrome n’est pas validé.

Le candidat `4b6696ca24fc678465327bb31a3eeb0777365029` est installé en préproduction privée dans la PR173. [Reçu figé et périmètre](../../avereo-app-passeport-immo/api/report-publication-observation.json). Sélection livrée : SHA-256 `7040b2b08ee7c85e0b2e926948f5b8ae380e53e4b1b82ca6744958d1eeab1c78`. Les deux paquets sont des deltas des écrans et API nécessaires ; compagnons de menu, RGA, règles d’accès et chemins non concernés conservés.

Le compte applicatif n’avait pas le droit ALTER. Après refus avant remplacement public, le responsable autorise explicitement l’ajout temporaire de ce seul droit sur la base Passeport de préproduction. Migration réussie, cinq droits initiaux remis exactement après neuf secondes ; aucun droit de production modifié. Le retour arrière préparé reste privé et la colonne nullable est compatible avec l’ancien lecteur.

Recette **native HTTPS authentifiée**, par les connexions Drupal → CONNECT → applications ordinaires des comptes fictifs 37/38 :

- Publication propriétaire 38 sur un bien/client fictifs ; Word client exact partagé vers le compte 37, copie complète inaccessible à ce destinataire (liste, route privée et route de document partagé).
- Envoi identique idempotent, une version seulement ; source Rapport et propriétaire inchangés.
- Déconnexion complète et nouvelle connexion native 38 ; même version listée et paquet privé récupéré octet pour octet. Partage ensuite révoqué : accès destinataire fermé, copie privée propriétaire conservée.
- Téléchargement réimporté par l’UI locale Rapport et le codec natif : 14 observations, 4 photos dont contexte, 12 plans et signature ; marqueur de la sauvegarde destinataire conservé. Nouvelle sauvegarde serveur indépendante `7e3343ac2d14a54fc4244d543382d9c2`, propriétaire 38, refus de lecture par 37.
- Les 26 documents Passeport et 30 dossiers Rapport préexistants sont exacts. Après recette : sauvegarde et restauration temporaire des quatre tables Passeport et 28 fichiers (27 documents ordinaires et une copie privée). Périodes, habilitation Passport fictive, politique et configuration restaurées ; aucun mot de passe ni rôle changé.

La normalisation historique des quatre cartes de contrôles protocolaires vides `{} / []` est explicitement contrôlée ; les contenus métier sont égaux. Le paquet privé ne subit aucune modification de ses octets stockés. Les originaux photo séparés sont couverts par les tests locaux du codec ; ce jeu hébergé complet n’a pas de référence externe d’original photo.

**Limite visuelle :** préparation/réimport contrôlés dans le navigateur local ; recette hébergée et reconnexion contrôlées par les services natifs. La fenêtre privée Chrome n’a pas été pilotée. La revue métier humaine de la PR173 reste à faire ; ces preuves ne cochent aucune attestation.

## Revue métier à effectuer

1. Depuis CONNECT de préproduction, créer/charger un dossier fictif dans Rapport ; vérifier les options et l’aperçu client, confirmer sa finalisation et préparer le paquet.
2. Dans Passeport de préproduction, créer un bien fictif et son client ; importer le paquet par « Versions finalisées de Rapport ». Vérifier la confirmation de partage, le Word dans les documents et la copie privée dans la section dédiée. Le dépôt par l’ajout ordinaire de ZIP est refusé pour protéger les notes privées.
3. Réimporter le même paquet : une seule version. Télécharger la copie privée et la charger dans Rapport après lecture de son résumé ; contrôler textes, photos, repères, plans et signature. Sauver en ligne comme nouveau dossier puis vérifier que le source reste conservé.
4. Les contrôles natifs des deux comptes et de révocation sont consignés au reçu. Les comptes fictifs ont retrouvé leurs périodes et droits initiaux après recette ; leur remise en service éventuelle doit rester bornée.


# Mise en production

Aucune intervention incluse dans cette reprise. Les règles de livraison, de sauvegarde et les accords de production restent distincts des travaux locaux et de la recette fictive.
