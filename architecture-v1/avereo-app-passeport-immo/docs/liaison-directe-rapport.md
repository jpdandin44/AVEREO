---
project: avereo-app-passeport-immo
document_type: integration-proposal
title: Préparation de la liaison directe Rapport vers Passeport Immo
status: active
version: git
created: 2026-11-26
updated: 2026-11-26
owner: jpdandin
tags: [rapport, passeport, revue, word, integration]
---

# Liaison directe Rapport → Passeport Immo

**Proposition préparée, non implémentée et non livrée.** Répondre au besoin existant REC-03/DEMO26-06, rattaché uniquement à `rapportV2Technique20261124.hostedAcceptance20261126.directPassportLinkRequirement`. Le correctif des27 fichiers est un candidat distinct ; cette préparation ne lui ajoute pas un transfert automatique.

## Cadrage

Le circuit manuel est maintenant qualifié sur le cas fictif61 Mo : paquet de revue, deux Word et source privés reçus à l’identique ; décision explicite sur les Word ; PDF natif du Word client approuvé, contrôle puis publication séparée. Le besoin restant est de supprimer la manipulation obligatoire du ZIP entre applications et d’ouvrir le bon contexte après réception effective.

### Parcours proposé

1. Depuis Rapport, **Soumettre à relecture dans Passeport Immo** utilise la version exacte et les deux Word préparés. Si le contenu a changé, refaire la préparation avant dépôt ; aucune ancienne approbation réutilisée.
2. Ouvrir Passeport par son entrée CONNECT du même environnement et établir une session fraîche. Rapport conserve son brouillon et son paquet en mémoire pendant l’authentification. Fermeture, expiration ou refus d’ouverture n’effacent rien ; téléchargement manuel disponible.
3. Présenter depuis Rapport le choix explicite d’un bien éligible et d’un relecteur, puis un récapitulatif de la version, du bien et du compte résolu. Passeport fournit seulement les biens du compte autorisé ; un partage en lecture seule n’ouvre aucun dépôt. L’auteur peut se désigner ; second expert facultatif.
4. Après confirmation, transmettre le paquet exact au contexte Passeport authentifié, sans téléchargement local imposé. Passeport utilise son API de revue privée existante ; aucun document client actif n’est créé à ce stade.
5. Afficher **Revue reçue dans Passeport** seulement après reçu serveur vérifié, puis proposer **Ouvrir cette revue** sur le bon bien et la bonne version. En cas de réponse perdue, rechercher/rejouer la même version au même endroit avant tout nouveau dépôt.
6. Relecture/corrections puis validation des **Word exacts** dans Passeport ; report des corrections dans Rapport et nouvelle version si nécessaire. Conversion manuelle du Word client approuvé en PDF, contrôle du rendu, dépôt privé et publication distincte restent inchangés.

### Appuis vérifiés dans la source

| Fonction existante | Réutilisation prévue |
| --- | --- |
| Rapport `createReview` et téléchargement `.review.avereo.zip` | Produire une seule version/source avec ses Word ; garder le paquet manuel comme secours. |
| Passeport `GET /api/workspace` | Biens propres au compte connecté ; pas d’annuaire global de biens. |
| `POST /api/review-recipient` | Résoudre le compte pour le bien et recontrôler son éligibilité ; même auto-validation autorisée. |
| `GET /api/biens/{bienId}/report-reviews` | Révision fraîche et historique avant dépôt. |
| `POST /api/biens/{bienId}/report-reviews` | Multipart existant : `review`, `recipient`, `expectedRecipient`, `revision`, `confirm=true`. Propriété, client lié, origine et CSRF vérifiés côté Passeport. |
| `PasseportReviews::submit` | Contrôle des fichiers/empreintes, copie privée atomique, version identique et même relecteur retournés avec `alreadySubmitted=true` ; conflit 409 si contenu ou relecteur diffère. |
| `serverStorage.repository` | Dépôt, téléchargement et suites Word/PDF existants, sans second moteur de revue. |

L’API de revue existante ne dépose pas directement depuis l’origine Rapport : elle exige l’origine et le CSRF de Passeport. Son entrée CONNECT redirige actuellement vers `/`, et la sélection du bien/rubrique est un état React. La navigation vers une revue précise et le transport entre applications sont donc **à ajouter**, pas des capacités acquises.

### Transport proposé et conditions avant réalisation

Première option proposée : fenêtre Passeport authentifiée et canal navigateur `postMessage`/`MessageChannel`, avec origines exactes configurées et identifiant aléatoire de tentative. Les appels API restent dans l’origine Passeport ; aucun élargissement CORS, cookie ou rôle. Ne pas transmettre de secret CONNECT, jeton CSRF ou données métier dans une URL. Aucun `targetOrigin="*"` pour des données métier.

Le canal doit vérifier origine, fenêtre correspondante, tentative, type/version du message et limites avant de traiter le paquet Blob. Les deux sessions doivent correspondre au **même compte CONNECT frais** : la preuve minimale d’identité à exposer par chaque application reste à définir dans cette tranche, sans assimiler un nom affiché à une identité. Passeport recontrôle lui-même le propriétaire courant, le bien, le destinataire et la révision avant chaque écriture. Aucun message navigateur n’est une permission.

**Points techniques encore à lever avant codage :** métadonnées/origines et entrée CONNECT réellement configurées ; maintien du canal après authentification et politiques d’ouverture des fenêtres ; contrat minimal d’identité fraîche des deux côtés ; intégration de l’ouverture du bien et de la revue dans la navigation actuelle ; mémoire et temporisation sur le cas 61 Mo. Une courte vérification locale doit confirmer cette option ; si les politiques de fenêtre la bloquent, cadrer une autre solution avant de modifier l’authentification. Aucun relais serveur ou stockage temporaire distant créé ici.

### Reçu et reprise

Le reçu proposé contient `bienId`, `review.id`, `seriesId`, `revision`, `status`, `sha256`, `size` et les empreintes des fichiers, issus de la réponse de dépôt puis de sa relecture. Comparer au paquet attendu avant succès. Une tentative ne peut changer silencieusement de bien, compte ou relecteur. L’identifiant de revue et l’empreinte existants servent au rejeu ; un conflit ne déclenche pas un second identifiant automatiquement. Le retour dans Rapport ne vaut jamais approbation Word ni publication.

Un délai dépassé affiche **Réception à vérifier** ; interroger les revues avant nouvelle tentative. Session expirée : reconnexion normale, nouveau canal et recontrôle du contexte. Paquet modifié : refaire une version. Annulation : conserver le brouillon et la récupération manuelle. Une revue déjà publiée n’est pas remplacée implicitement.

### Critères d’acceptation du futur lot

| Critère | Preuve attendue |
| --- | --- |
| LD-01 | Un geste depuis Rapport ouvre le parcours authentifié, sans ZIP obligatoire ; bien/relecteur explicitement confirmés. |
| LD-02 | JSON complet, originaux, plans et deux Word reçus à l’identique ; refus sans écriture en cas d’altération. |
| LD-03 | Origine/fenêtre/tentative/compte erronés et bien étranger ou partagé en lecture seule refusés. |
| LD-04 | Succès après reçu durable ; réponse perdue, interruption et répétition donnent une seule revue identique au bon bien. |
| LD-05 | Ouverture de la revue exacte et conservation des brouillons ; rechargement et connexion fraîche retrouvent l’état serveur. |
| LD-06 | Validation Word exacte, correction/nouvelle version et second expert facultatif conservés ; PDF antérieur à validation interdit et publication toujours distincte. |
| LD-07 | Ancien JSON et paquet manuel restent utilisables ; aucun droit Technique/Projet ou accès collectif du club ajouté. |

## Développement local

Non commencé pour la liaison. Candidat dédié après qualification du transport et des prérequis ci-dessus ; réutiliser les composants et contrats actuels. La demande du responsable autorise la préparation de cette étape ; le correctif d’import ne prétend pas livrer la liaison. Aucun nouveau quatrième profil, organisation ou accès global.

## Préproduction

Non engagée pour cette liaison. Préparer une livraison coordonnée Rapport/Passeport avec versions exactes, sauvegarde fraîche et restauration sur copie, après revue et accord applicables. QualifierLD-01 à07avec deux comptes fictifs et droits autorisés/refusés ; laisser les autres données et la production intactes.

## Mise en production

Non engagée. Accord distinct sur le candidat, les cibles et l’effet, puis contrôles après livraison et préparation de la suite. La capacité du pilote et le fichier réel de Philippe ne sont pas déduits de la réussite locale.

[Règle Word de référence](../../avereo-app-rapport/workflows/relecture-validation-pdf.md) · [Source du complément DEMO26](<C:/Users/examg/Documents local/Habitologue/Opportunité_Connect/docs/rapport-v1-2/cadrage-retours-philippe.md#suite-demo-2026-11-26>) · [Suivi canonique](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>).
