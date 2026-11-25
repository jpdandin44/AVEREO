---
project: avereo-app-rapport
document_type: workflow
title: Relecture experte, validation et publication du PDF client
status: active
version: git
created: 2026-11-25
updated: 2026-11-25
owner: jpdandin
tags: [rapport, passeport-immo, relecture, validation, pdf]
---

# Relecture experte et PDF final

## État et décisions

Développement local autorisé le 25 novembre par « OK, peux-tu lancer le développement stp? ». Le responsable confirme ensuite : **« L’expert rédacteur peut valider ; second expert facultatif »**. La validation reste une action explicite sur une version et ses deux PDF ; un export ou une signature déjà présente ne vaut pas décision.

Branche `feat/rapport-relecture-validation-pdf`, fondée sur `09a4e768e9b2f11e2cdcecac65099139893c64b2` de PR199 encore en revue au démarrage. La branche de PR199 et ses paquets préparés sont conservés. Le suivi canonique est `rapportV2Technique20261124.reviewWorkflowDevelopment20261125` dans le [suivi privé](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>).

Pendant le développement, PR199 est observée fusionnée en `73ba5e07d9ed702871765ac61fe8f3536204d240` et sa branche distante supprimée. Le complément est ensuite aligné sans conflit sur `main` `95400893696938705b004f93e281b6bab80b14b0`, qui inclut PR199. Cet alignement ne change aucun fichier Rapport/Passeport du candidat local qualifié ; la nouvelle PR cible donc directement `main`. Les anciennes réserves et paquets ne sont pas requalifiés par cette observation.

## Répartition et sources

- **Rapport** : rédaction, corrections, contenu et sélection expert/client, Word et préparation d'une demande privée. Mission → Constats → Rapport et les cinq étapes d'Analyse globale sont conservées.
- **Passeport Immo** : demande privée, nomination explicite du relecteur, consultation des deux PDF, décision, historique et publication séparée du PDF client.
- **CONNECT** : identité et éligibilité actuelles, vérifiées via le répertoire privé existant à chaque opération. Le propriétaire accorde par sa nomination le droit de relire/décider sur cette seule version ; ce droit n'est ni un profil professionnel ni le droit de créer un Rapport Technique. Aucun nouveau rôle global ni changement du backend CONNECT.
- **Dossier natif Rapport** : source des contenus métier ; la demande conserve une copie datée et intacte. Les Word/PDF sont dérivés de cette version. Les remarques et décisions sont des données natives Passeport, sans modification automatique du dossier Rapport.

Le [workflow métier antérieur](workflow-habitologie.md#revue-et-critères-dacceptation), le [contrat de publication historique](../docs/publication-passeport-immo.md) et le [partage Passeport](../../avereo-app-passeport-immo/docs/partage-documents.md) gardent leur rôle. Ce lot n'implémente pas les enrichissements/analyse automatisés envisagés dans le workflow Habitologie.

## Parcours réalisé localement

1. Dans la dernière étape de Rapport, ouvrir **Demander une relecture experte dans Passeport Immo** puis **Préparer les deux Word pour relecture**. Une clé de série privée `reviewSeriesId` est conservée dans le dossier. La préparation fige une copie et son empreinte, puis génère les deux Word avec les filtres existants.
2. Télécharger les Word expert et client, les convertir en PDF sans modifier leurs contenus, puis joindre les deux PDF. **La conversion est manuelle dans cette tranche** ; aucun moteur PDF intégré ou service externe n'est installé. La concordance de contenu Word/PDF reste à contrôler par l'expert. Le format et les empreintes assurent l'identité des fichiers soumis, sans prouver cette concordance sémantique.
3. **Préparer la demande pour Passeport Immo** produit un `.review.avereo.zip`. Si le dossier Rapport a changé depuis la préparation des Word, l'interface refuse et demande une nouvelle préparation. Le brouillon et les fonctions de sauvegarde/export restent conservés.
4. Dans Passeport, bien → bibliothèque → **Rapports**, associer le client si nécessaire puis ouvrir **Relecture experte → Soumettre une version à relecture**. Choisir le paquet, rechercher son propre compte CONNECT ou celui du second expert, vérifier son identité puis confirmer la nomination. Cette opération n'ajoute aucun document aux partages du bien.
5. Sur l'accueil Passeport, **Mes revues de rapports** affiche les demandes déposées ou reçues. Le relecteur nommé peut ouvrir/télécharger les PDF expert et client. La copie complète n'est téléchargeable que par le propriétaire du bien. La nomination ne donne pas accès aux autres documents du bien.
6. **Demander des corrections** exige un motif ; préciser les constats/pages dans le texte libre. **Valider cette version** exige l'ouverture des deux PDF dans l'interface et une confirmation explicite. Le serveur contrôle le relecteur, la révision courante et les empreintes des PDF ; il ne prétend pas mesurer la qualité de la relecture humaine.
7. Pour corriger, le propriétaire rouvre le dossier source dans Rapport ou télécharge sa copie privée et utilise l'import existant. Le réimport conserve la série et crée une copie indépendante lors d'une nouvelle sauvegarde en ligne ; le dossier serveur initial reste conservé. Une nouvelle demande de la même série remplace les états non publiés précédents, sans supprimer leurs fichiers ni remarques.
8. Après validation, **Publier le PDF client validé** est réservé au propriétaire du bien et séparé de l'approbation. Une confirmation rappelle le périmètre du partage et les destinataires actuels ; une modification de leur révision bloque la publication jusqu'à nouvelle lecture. Seuls les octets du PDF client approuvé sont ajoutés aux documents actifs. Rapport expert, source complète et remarques restent privés.

## États et concurrence

| État natif | Libellé et transition |
| --- | --- |
| `pending` | À relire ; seul le relecteur désigné peut décider. |
| `corrections` | Motif et décision conservés ; corriger dans Rapport puis soumettre une nouvelle version. |
| `approved` | Deux PDF approuvés ; publication séparée possible par le propriétaire. |
| `published` | PDF client actif et identifiant documentaire conservé ; aucun remplacement silencieux. |
| `superseded` | Nouvelle version de la série soumise ; aucune nouvelle décision/publication sur l'ancienne. |
| `cancelled` | Demande retirée par le propriétaire ; accès PDF du relecteur fermé, historique/source conservés. |

Une révision numérique par bien protège les soumissions concurrentes ; chaque demande possède également sa révision pour les décisions. Les changements sont sérialisés par la ligne MySQL du bien. Répéter le même paquet et le même relecteur ne crée pas de doublon ; même identifiant avec contenu/relecteur différent : refus. Une décision périmée ou concernant une série remplacée est refusée.

Les noms d'états historiques `RAPPORT_A_VALIDER`, `RAPPORT_VALIDE`, `SYNTHESE_PRETE`, `PUBLIE` restent le cadrage métier complet : ce lot réalise la revue de fichiers déjà générés, sans une seconde machine d'analyse. Les PDF client préparés pour revue restent privés avant validation/publication.

## Paquet privé et compatibilité

Schéma `avereo-rapport-review`, version machine `1`, confirmation `validatedByProfessional=false`, identifiant de version et `seriesId` hexadécimaux de 32 caractères. Le JSON contient la même `reviewSeriesId`. Entrées obligatoires :

- `dossier-rapport.json` ;
- `rapport-client.docx`, `rapport-expert.docx` ;
- `rapport-client.pdf`, `rapport-expert.pdf` ;
- `manifest.json` et, si nécessaires, les `originaux/<id>.jpg|png|webp` vérifiés.

Les contrôles existants du codec sont réutilisés : ZIP STORE sans chiffrement/compression/liens symboliques, liste blanche, tailles et SHA-256 exacts, manifeste 64 Kio, 2 001 entrées, JSON réouvrable au plus 100 000 000 octets, paquet au plus 524 288 000 octets. Les PDF sont contrôlés comme PDF au dépôt puis rendus par le lecteur Passeport existant. Aucun marquage du PDF n'est retiré après validation : son statut est porté par l'interface.

L'import Rapport reconnaît les anciens paquets finalisés et les nouvelles demandes, réintègre les originaux et retire l'ancien identifiant de sauvegarde en ligne comme auparavant. Les anciens dossiers et paquets sont conservés. Le parcours historique de publication Word reste disponible pour les dossiers sans série de revue ; un dossier engagé dans la revue utilise le nouveau parcours de publication PDF. Les permissions ordinaires d'ajout de documents dans Passeport ne sont pas retirées.

Le dépôt documentaire ordinaire refuse les deux schémas de paquet, y compris renommés avec une autre extension ZIP compatible, pour éviter le partage accidentel d'une source privée.

## API et droits

Toutes les routes utilisent la session Passeport native. Mutations : origine exacte et CSRF existants, confirmation, révision et requêtes préparées. Aucun CORS nouveau.

| Méthode | Route | Droit |
| --- | --- | --- |
| POST | `/api/review-recipient` | Propriétaire du bien ; identité exacte CONNECT et compte actif. |
| GET, POST | `/api/biens/{bien}/report-reviews` | Propriétaire ; liste privée ou dépôt multipart `review`, `revision`, `recipient`, `expectedRecipient`, `confirm=true`. |
| GET | `/api/report-reviews` | Ses propres dépôts et les demandes qui lui sont nominativement attribuées. |
| GET | `/api/report-reviews/{id}/file/client` ou `/expert` | Propriétaire ou relecteur nommé, accès CONNECT frais ; demande retirée refusée au relecteur. |
| GET | `/api/report-reviews/{id}/file/source` | Propriétaire du bien uniquement. |
| PATCH | `/api/report-reviews/{id}` | `approve`/`corrections` : relecteur ; `cancel`/`publish` : propriétaire. Corps JSON : `action`, `revision`, `confirm`, empreintes PDF ; motif pour corrections, révision de partage pour publication. |

Une nomination explicite peut viser le propriétaire lui-même. Le droit de créer une mission technique n'accorde aucune revue supplémentaire, et sa révocation ne retire pas les droits ordinaires acquis sur les dossiers existants. Les destinataires du partage ordinaire n'acquièrent aucun accès aux routes de revue.

Une projection CONNECT périmée, un compte ou propriétaire devenu inéligible ferment les accès. Les fichiers déjà téléchargés ne peuvent pas être rappelés ; la révocation contrôle les prochaines requêtes. Aucun e-mail ni nouvelle invitation CONNECT n'est envoyé par ce lot.

## Stockage, migration et récupération

Ajout nullable `pi_biens.report_reviews LONGTEXT` : révision, versions, relecteur, état, décisions, empreintes et document publié. Les quatre tables existantes sont conservées. Cent versions maximum par bien, historique borné à 2 Mio et remarque à 8 000 octets. Pas de purge automatique.

Le paquet est un blob privé `review-<empreinte propriétaire/bien/version>.blob`, hors `pi_documents` et dossier public. Les PDF de revue sont extraits temporairement après contrôle de l'archive et des droits ; le PDF final est copié dans le dépôt documentaire sous la transaction de publication. Un échec SQL annule la nouvelle ligne et le nouveau fichier sans effacer les fichiers préexistants.

`workflows/migrate-report-reviews.php CONFIG BASE` simule par défaut ; `--apply` ajoute la seule colonne sur la base dédiée exacte, sous verrou, avec contrôle de conservation et idempotence. **Aucune migration distante n'est exécutée par le développement.** Sans la colonne, les routes de revue refusent de fonctionner explicitement ; les autres fonctions restent disponibles.

`workflows/backup-storage.php` inclut toutes les archives de revue privées, leurs empreintes et métadonnées ; restauration des lignes vérifiée sur tables temporaires et fichiers relus. Le transfert CLI historique refuse un bien contenant une publication ou une revue privée avant tout export partiel. Les anciens transferts sans revue restent compatibles. Avant une livraison, aligner la copie hébergée du schéma et des outils privés de sauvegarde avec le candidat exact.

## Qualification et limites

Qualification du 25 novembre : 263 tests Node Rapport, 88 tests d'interface Passeport, deux compilations, 60 contrôles API/SQL Rapport (série conservée après nouvelle session), 223 contrôles Passeport HTTP/SQL dont sauvegardes/restaurations, 41 contrôles de transfert et 44 tests d'outillage réussis. Le navigateur Chrome local exerce nomination, refus, correction/nouvelle soumission, rendu des deux PDF, validation, publication, nouvelle session et largeur 390 px : sept contrôles, aucune erreur JavaScript observée. Quatre contrôles navigateur Rapport supplémentaires vérifient les vrais DOCX, le refus d’un paquet devenu périmé et la copie complète de revue. Les PDF de cette recette sont des pièces fictives simples ; cette preuve ne qualifie pas la pagination Word/PDF d'un rapport professionnel complet ni le SSO hébergé.

[Reçu structuré de qualification](../../avereo-app-passeport-immo/api/report-review-local-observation.json).

Pour la revue locale, après les compilations : `python tests/report-files-http.py --technical --serve --port 5260` depuis l'application Rapport, et `python tests/check-storage-http.py --serve --port 5261` depuis Passeport. Entrées : `http://127.0.0.1:5260/fixture/` et `http://127.0.0.1:5261/fixture/`. Les deux processus doivent rester vivants ; ils utilisent des copies et bases temporaires fictives, sans lecture de configuration hébergée. Leur arrêt efface la base temporaire Passeport. Dans Passeport : déposant/expert A (42), second expert B (43), client fictif (44) ; des fenêtres privées séparées évitent de remplacer la session de l'autre rôle. Le répertoire fictif est rafraîchi pendant la revue.

Le test navigateur automatique facultatif utilise un Playwright déjà disponible, indiqué par `PASSEPORT_REVIEW_BROWSER_PACKAGE`, et écrit les rendus/reçu dans `PASSEPORT_REVIEW_OUTPUT`. Il n'ajoute pas de dépendance aux applications et ne nécessite aucun compte réel.

Contrôles à maintenir : codec Rapport avec les deux PDF et récupération complète ; confirmations UI de nomination, refus motivé et publication ; API PHP/MariaDB avec nouvelles sessions fictives, retraits d'accès, source interdite au relecteur, partage client sans brouillon, nouvelle soumission et décision périmée, retour arrière de transaction, sauvegarde/restauration et identité exacte du PDF client publié.

La synchronisation entre applications est **par paquet explicite** : une modification du dossier Rapport après soumission ne réécrit pas la version en revue. Le rédacteur doit soumettre la nouvelle version. Les corrections métier effectuées dans un Word externe doivent être reportées dans Rapport ; aucun import automatique des modifications Word n'est ajouté.

TBD : moteur de conversion automatique et capacité de la cible, qualification native Word/PDF sur un cas professionnel complet, rétention/purge des revues, remplacement explicite d'une ancienne version publiée. Plusieurs versions publiées restent conservées tant que leur archivage n'est pas demandé. Aucune annotation libre dans le PDF ou gestion de plusieurs valideurs simultanés dans ce premier lot.

## Quatre phases

| Phase | État de ce lot |
| --- | --- |
| Cadrage | Développement et auto-validation de l'expert explicitement autorisés le 25 novembre. |
| Développement local | Implémentation et qualification locales ; candidat et résultats tenus dans le suivi canonique. |
| Préproduction | Non engagée ; après accord applicable, qualifier cibles, sauvegardes fraîches/restauration et recette native. |
| Mise en production | Non engagée ; autorisation distincte, contrôles après livraison, bilan et préparation de la suite. |
