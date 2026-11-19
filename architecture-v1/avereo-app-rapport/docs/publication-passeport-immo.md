---
project: avereo-app-rapport
document_type: feature-scope
title: Publication des dossiers finalisés dans Passeport Immo
status: active
version: git
created: 2026-11-19
updated: 2026-11-19
owner: jpdandin
tags: [rapport, passeport-immo, publication, partage]
---

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

Le lot de publication n’est pas encore livré : contrôles locaux et CI, sauvegarde/restauration de la cible, installation du même artefact et recette fictive restent à enregistrer. Aucun accès à un document réel ni destinataire réel créé.

# Mise en production

Aucune intervention incluse dans cette reprise. Les règles de livraison, de sauvegarde et les accords de production restent distincts des travaux locaux et de la recette fictive.
