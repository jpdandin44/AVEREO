---
project: avereo-app-rapport
document_type: workflow
title: Relecture et validation Word puis publication du PDF final
status: active
version: git
created: 2026-11-25
updated: 2026-11-25
owner: jpdandin
tags: [rapport, passeport-immo, relecture, validation, pdf]
---

# Relecture et validation Word, puis PDF final

## Décision de référence du 25 novembre

Le responsable confirme : **« la relecture et la validation doivent être sur le document word et non pas sur le pdf »**. Cette décision remplace le circuit PDF du premier candidat de PR202. L'auto-validation du rédacteur reste permise ; un second expert est facultatif, avec nomination explicite dans les deux cas.

Le circuit courant est **Word → relecture/remarques → corrections → validation des Word → conversion du Word client en PDF → contrôle de rendu → publication**. Le contrôle du PDF est une opération de restitution après validation du contenu ; il ne devient pas une seconde validation professionnelle du rapport.

Branche `feat/rapport-relecture-validation-pdf`, PR202, initialement fondée sur PR199 puis alignée sur `main` après sa fusion. Le premier candidat `ffc22cb` portait la décision sur les PDF ; ses preuves restent historiques et ne qualifient pas ce nouveau circuit Word. Suivi canonique : `rapportV2Technique20261124.reviewWorkflowDevelopment20261125` du [suivi privé](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>).

## Responsabilités et sources

- **Rapport** conserve rédaction, corrections métier, médias, sauvegarde complète, sélection expert/client et génération des deux Word. Rapport Technique garde Mission → Constats → Rapport ; Analyse globale garde ses écrans approfondis.
- **Passeport Immo** conserve les Word soumis, la nomination, les remarques, la décision datée et l'historique. Le PDF final est déposé ensuite par le propriétaire ; sa publication est séparée.
- **CONNECT** fournit identité et éligibilité fraîche. Une nomination donne accès et décision sur cette seule version ; elle ne crée ni propriété du bien, ni profil professionnel, ni droit de créer un Rapport Technique.
- **Dossier natif Rapport** reste la source du contenu métier. Les corrections repérées dans Word sont reprises dans Rapport, puis les Word sont régénérés et soumis dans une nouvelle version. Aucun import automatique de modifications Word n'est annoncé.

La relecture se fait dans Microsoft Word ou le logiciel Word habituel du professionnel après téléchargement privé des `.docx`. Aucun éditeur Office web ni transmission à un service externe n'est ajouté. Les remarques de relecture sont saisies dans Passeport avec les références des constats/pages ; les annotations ou modifications d'un Word téléchargé ne réécrivent pas automatiquement le dossier Rapport.

## Parcours courant

1. Rapport, dernière étape : **Demander une relecture experte → Préparer les deux Word pour relecture**. La copie source et ses empreintes sont figées ; `reviewSeriesId` rattache les soumissions successives. Les deux Word sont téléchargeables.
2. **Préparer la demande pour Passeport Immo** crée un `.review.avereo.zip` avec Word expert, Word client, JSON complet et originaux nécessaires. **Aucun PDF n'est fourni à cette étape.** Un dossier modifié depuis la préparation impose de régénérer les Word.
3. Passeport, bien → Rapports privés → Relecture experte : importer le paquet, vérifier son propre compte ou celui du second expert, confirmer la nomination. Rien n'est ajouté aux documents partagés avec le client.
4. Le relecteur retrouve **Mes revues de rapports**, télécharge les Word expert/client et les ouvre dans Word. **Demander des corrections** exige un motif ; le propriétaire corrige dans Rapport puis soumet une nouvelle version. L'ancienne version et ses remarques sont conservées.
5. **Valider les Word** nécessite téléchargement des deux documents et confirmation explicite de leur relecture. La décision serveur conserve identité, date, `basis=word`, révision et `wordSha256` expert/client. Seul le relecteur nommé peut décider. L'interface ne prétend pas mesurer la qualité de cette lecture humaine.
6. Après validation seulement, le propriétaire utilise **Préparer le PDF après validation Word**. Il télécharge le Word client exact approuvé, le convertit en PDF sans changement de contenu et contrôle textes, images, tableaux et pagination. La conversion reste manuelle dans cette tranche. Le dépôt exige l'empreinte du Word client approuvé et une confirmation explicite du contenu et de la mise en page.
7. Le PDF ainsi préparé reste privé et peut être affiché par **Contrôler le PDF final**. Une nouvelle mise en page crée une nouvelle copie PDF privée sans modifier la décision Word ni effacer la précédente. Une correction du contenu exige une nouvelle demande Word, pas un simple remplacement PDF.
8. **Publier le PDF client** exige une confirmation propriétaire séparée, avec relecture des destinataires actuels et de leur révision. Les octets du PDF privé contrôlé sont copiés dans les documents actifs. Word expert/client, source complète et remarques restent dans les espaces privés autorisés.

## États et concurrence

| État | Effet |
| --- | --- |
| `pending` | Word à relire ; décision réservée au relecteur nommé. |
| `corrections` | Refus motivé, source et remarques conservées ; nouvelle soumission nécessaire. |
| `approved` | Word approuvés, avec décision `basis=word` et empreintes exactes ; PDF à préparer. |
| `pdf_ready` | PDF préparé après approbation Word et contrôle de rendu ; publication propriétaire possible. |
| `published` | PDF client actif conservé, sans remplacement silencieux. |
| `superseded` | Nouvelle version Word de la série ; décision/publication sur l'ancienne refusées. |
| `cancelled` | Nomination retirée ; accès de lecture du relecteur fermé, copies et historique conservés. |

La révision du bien protège les soumissions concurrentes ; la révision de la demande protège décisions, dépôt du PDF et publication. Un nouvel envoi de série remplace les états non publiés précédents. Même paquet et même relecteur : dépôt idempotent ; même identifiant avec contenu/relecteur différent : refus. Un dépôt PDF exact est également idempotent.

## Paquets et anciens dossiers

Le schéma `avereo-rapport-review`, **version machine 2**, contient `manifest.json`, `dossier-rapport.json`, `rapport-client.docx`, `rapport-expert.docx`, et les originaux nécessaires. `validatedByProfessional=false` : préparer le paquet n'approuve rien. Les PDF sont refusés dans les paquets v2. Les deux DOCX doivent être des conteneurs Word valides (types et document XML présents) et leurs tailles/empreintes sont vérifiées.

L'import de l'ancien schéma de revue v1 avec Word/PDF reste possible, ainsi que les anciens paquets de publication. Une décision PDF historique reste identifiée comme telle : elle ne devient pas une approbation Word, n'autorise ni dépôt de PDF après Word ni nouvelle publication. Une nouvelle demande Word doit être soumise. Les anciennes publications déjà conservées ne sont pas effacées ou requalifiées.

Le codec réutilise ZIP STORE, liste blanche, contrôle des tailles/SHA-256 et originaux : manifeste 64 Kio, 2 001 entrées, JSON réouvrable au plus 100 000 000 octets, paquet au plus 524 288 000 octets. Le réimport réintègre les originaux, conserve la série et retire l'ancien identifiant serveur comme auparavant. Les sauvegardes et droits ordinaires restent inchangés. Le dépôt documentaire ordinaire refuse les paquets privés, y compris renommés.

## API et droits

Les routes utilisent session Passeport, origine exacte, CSRF, confirmations, révisions et requêtes préparées. Le répertoire CONNECT frais ferme l'accès lorsqu'un compte, le propriétaire ou la projection deviennent inéligibles/périmés. Les fichiers déjà téléchargés ne peuvent pas être rappelés.

| Méthode | Route | Périmètre |
| --- | --- | --- |
| POST | `/api/review-recipient` | Propriétaire ; vérification du compte exact et actif. |
| GET, POST | `/api/biens/{bien}/report-reviews` | Propriétaire ; liste privée ou dépôt nominatif de paquet. |
| GET | `/api/report-reviews` | Ses dépôts et les demandes nominativement reçues. |
| GET | `/api/report-reviews/{id}/file/word-client` ou `/word-expert` | Propriétaire ou relecteur nommé, sauf demande retirée. |
| GET | `/api/report-reviews/{id}/file/source` | Propriétaire uniquement. |
| PATCH | `/api/report-reviews/{id}` | `approve`/`corrections` : relecteur, `wordSha256` exacts ; `cancel`/`publish` : propriétaire. |
| POST | `/api/report-reviews/{id}/pdf` | Propriétaire après Word approuvés ; multipart `pdf`, `revision`, `fromWordSha256`, `confirmLayout=true`. |
| GET | `/api/report-reviews/{id}/file/final` | Propriétaire ; PDF privé courant contrôlé par taille/empreinte. |

Les anciennes routes `/file/client` et `/file/expert` restent des lectures des PDF présents dans les paquets v1 ; elles ne servent pas au nouveau processus de décision. Aucun e-mail, lien public ou invitation automatique ajouté.

## Stockage, sauvegarde et récupération

La colonne nullable existante du candidat `pi_biens.report_reviews` conserve versions et décisions. La décision Word et les PDF postérieurs sont distincts : `finalPdfs` contient leurs empreintes, date, propriétaire préparateur et empreinte du Word client approuvé ; `activeFinalPdfId` désigne la mise en page retenue. Cent revues maximum par bien, vingt mises en page PDF par revue, historique borné à 2 Mio et remarque à 8 000 octets. Pas de purge automatique.

Les paquets et les PDF restent hors `pi_documents` jusqu'à publication, dans des blobs privés dérivés du propriétaire/bien/revue/version PDF. Un nouvel envoi PDF ne remplace pas les octets antérieurs. Le serveur contrôle leurs empreintes ; la correspondance sémantique Word/PDF et le rendu restent une confirmation humaine tant que la conversion n'est pas automatisée.

La migration additive `migrate-report-reviews.php CONFIG BASE` simule par défaut, contrôle la base dédiée et les lignes, et exige `--apply` pour ajouter la colonne. **Aucune nouvelle migration SQL n'est nécessaire pour la correction Word** : les champs facultatifs de l'état JSON permettent la compatibilité. Aucune migration distante n'est exécutée ici.

`backup-storage.php` conserve archives et toutes les mises en page PDF privées, avec relecture des octets et restauration des métadonnées sur tables temporaires. Le transfert historique refuse toujours les biens contenant des revues avant export partiel. Les échecs de dépôt/publication annulent uniquement les nouvelles écritures ; source et PDF privés préexistants sont conservés.

## Vérifications et reprise locale

Les résultats datés sont dans le [reçu structuré](../../avereo-app-passeport-immo/api/report-review-local-observation.json). La [parité de la revue](../../avereo-app-passeport-immo/docs/source-audit-relecture.md) conserve le contrôle intégral du conteneur et l'audit historique gelé à l'identique. Les preuves initiales sur PDF restent historiques ; seules les nouvelles recettes qualifient Word → décision → PDF.

Contrôles requis : préparation sans PDF et conservation des Word/source, refus des Word altérés, décision sur les empreintes DOCX, auto-validation/second expert, refus motivé, nouvelle soumission, décisions périmées, ancien accord PDF non assimilé à Word, PDF avant approbation interdit, mauvais Word source refusé, contrôle de rendu obligatoire, conservation des mises en page successives, confidentialité client et sauvegarde/restauration de tous les fichiers.

Après compilation : depuis Rapport, `python tests/report-files-http.py --technical --serve --port 5260` ; depuis Passeport, `python tests/check-storage-http.py --serve --port 5261`. Entrées `http://127.0.0.1:5260/fixture/` et `http://127.0.0.1:5261/fixture/`. Les processus doivent rester vivants ; disponibilité et données temporaires à revérifier à la reprise. Les deux fixtures utilisent des identités fictives distinctes et un échange explicite par paquet ; elles ne qualifient pas le SSO hébergé.

TBD : conversion PDF automatique, revue native Word et pagination d'un cas professionnel complet, rétention/purge, remplacement explicite d'une ancienne publication. Aucun éditeur Word web ou retour automatique des modifications Word dans Rapport.

## Quatre phases

| Phase | État |
| --- | --- |
| Cadrage | Relecture et validation Word explicitement confirmées ; auto-validation ou second expert facultatif conservés. |
| Développement local | Correction du candidat de PR202, qualification locale puis revue humaine sur les nouveaux Word. |
| Préproduction | Non engagée pour ce complément ; cible, sauvegarde/restauration, recette native et accord applicables à qualifier. |
| Mise en production | Non engagée ; accord distinct, contrôles après livraison, bilan et préparation de la suite. |
