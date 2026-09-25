---
project: avereo-app-projet
document_type: api-contract
title: Contrat du service local de revue
status: active
version: git
created: 2026-09-24
updated: 2026-09-25
owner: jpdandin
tags: [projet, revue, local]
---

# Contrat du service local de revue

Service de développement Vite uniquement, configuré par
`AVEREO_REVIEW_ROOT`. Aucun endpoint n'est compilé dans le site hébergé.
Implémentations :
[stockage](../workflows/review-store.mjs),
[HTTP](../workflows/review-http.mjs),
[plugin](../workflows/review-plugin.mjs).

| Méthode et chemin | Contrat |
|---|---|
| GET /local-review/state | Suivi, empreinte de révision, inventaire des livrables, indisponibilités, actions permises, chemin connecté et jeton de session |
| GET /local-review/document?path=… | Contenu Markdown et empreinte d'un livrable déclaré, limité à 2 Mo |
| GET /local-review/export | JSON canonique téléchargé, sans le jeton de session |
| POST /local-review/actions | Décision explicite et nouveau suivi, résultat de génération des vues |

Les réponses sont JSON UTF-8 sans cache. L'écoute et les requêtes sont limitées
à la boucle locale. Host, Origin et Fetch Metadata sont contrôlés. Une écriture
exige le jeton de session `X-Review-Token`, `Content-Type: application/json`
et un corps de 64 Kio maximum. Le jeton n'est ni une identité ni un secret
persistant. Aucun CORS autorisant une origine tierce n'est émis.

Une décision contient `revision`, `phaseId`, `action`, `reviewer`
(1–100 caractères), `comment` (5–8 000 caractères), `confirm: true`.
Une approbation exige en plus tous les indices `checkedCriteria` et
`reviewedArtifacts` : liste exacte des chemins et empreintes courants.
Les actions sont `comment`, `request_changes`, `submit`, `approve`,
`authorize_next`, `start`. Le serveur calcule les transitions possibles.

| Code | Signification |
|---|---|
| 400 | Corps JSON invalide |
| 403 | Accès, origine, jeton ou chemin refusé |
| 404 | Route ou livrable non déclaré |
| 409 | Révision périmée, transition interdite ou verrou actif |
| 413 / 415 | Volume excessif / format non autorisé |
| 422 | Champs ou preuves incomplets |
| 503 | Chantier non configuré |
| 500 | Erreur de lecture/écriture non qualifiée |

Les chemins de livrables sont bornés au dossier réel, y compris après résolution
des liens et jonctions. Les dossiers déclarés exposent uniquement leurs fichiers
Markdown directs (100 maximum). Le rendu utilise les nœuds React échappés ;
le HTML brut, les URL exécutables et les médias embarqués ne sont pas interprétés.

La décision et l'événement sont conservés dans le même JSON. Une sauvegarde
précède chaque remplacement, un verrou exclusif évite deux écrivains locaux,
et une seconde lecture contrôle la révision avant écriture. Les éditeurs
externes n'utilisent pas ce verrou : ne pas modifier manuellement le suivi
pendant un enregistrement. Le journal reste modifiable par le propriétaire
des fichiers ; il ne constitue pas une signature cryptographique.

Après sauvegarde, une génération dérivée en échec est renvoyée dans
`derivedViews.status: failed`, avec succès de la décision conservé.
Le protocole de reprise est dans [le workflow](../workflows/revue-developpement.md).

## Présentation de la progression

Le frontend réutilise le snapshot `GET /local-review/state`. Aucun endpoint ni
corps de décision n'est modifié. `data.priorApprovals`, lorsqu'il est fourni
par le chantier, contient `sourceProject`, `observedAt`, `sourcePath`,
`sourceSha256` et `entries`. Chaque entrée expose identifiant, phase, type
`approval`/`authorization`, décideur, date, commentaire et nature de preuve.
Ce champ est affiché en lecture seule, sans alimenter les transitions. Son
producteur doit conserver la provenance et distinguer les références de
messages (`message_reference`) des revues vérifiées (`verified`). Le service
n'authentifie pas ces déclarations locales et ne contacte pas leur source.

## Description des livrables prévus

Chaque entrée existante de `data.phases[].deliverables` peut fournir ces
métadonnées facultatives de présentation :

| Champ | Type | Utilisation |
|---|---|---|
| `title` | chaîne | Titre lisible ; le chemin sert de repli si le titre est absent ou vide |
| `description` | chaîne | Objectif du document prévu |
| `expectedEvidence` | tableau de chaînes | Contenus et preuves attendus ; seules les chaînes non vides sont affichées |

Ces champs sont fournis par le chantier dans son JSON canonique. Le service
continue de calculer la disponibilité depuis les fichiers déclarés par `path`
et `kind`. `availability: planned` et un fichier encore absent donnent une
présentation « Prévu » ; une erreur de sécurité ou de lecture différente reste
signalée comme indisponibilité. Aucun contenu fictif n'est créé.

Le client relit `GET /local-review/state` selon la cadence documentée dans
[l'architecture](../architecture.md#rafraîchissement-et-preuves-de-revue).
`revision` prend en compte les octets du JSON, l'inventaire et les empreintes
des documents ainsi que les problèmes de lecture. Les routes et les corps de
décision sont inchangés ; l'actualisation n'émet pas de POST.

## Pull request de phase

`data.phases[].pullRequest` est un objet facultatif de présentation, fourni
par le chantier. La carte apparaît dans la revue de la phase sélectionnée.
Sans objet ou avec des champs essentiels invalides, elle n’est pas affichée.
Les anciens suivis restent compatibles et aucun endpoint supplémentaire
n’est ajouté.

| Champ | Type et contrôle |
|---|---|
| `url` | URL HTTPS `github.com/propriétaire/dépôt/pull/numéro`, sans identifiants, port spécifique, paramètres ni fragment |
| `repository` | Chaîne `propriétaire/dépôt` correspondant à l’URL |
| `number` | Entier positif sûr correspondant au numéro dans l’URL |
| `state` | `open`, `merged` ou `closed`, affichés Ouverte, Fusionnée ou Fermée sans fusion |
| `headSha` | Empreinte Git hexadécimale complète, 40 ou 64 caractères |
| `observedAt` | Horodatage ISO avec heure et fuseau, date réelle obligatoire |
| `mergedAt` | Facultatif : horodatage de fusion, affiché seulement pour `merged` |
| `mergeCommitSha` | Facultatif : empreinte complète du commit de fusion, affichée seulement pour `merged` |
| `mergedBy` | Facultatif : nom ou identifiant, 100 caractères maximum, affiché comme texte seulement pour `merged` |

Les champs facultatifs invalides sont omis ; aucune date, identité ou empreinte
n’est inventée. Le lien validé ouvre GitHub dans un nouvel onglet avec
`noopener noreferrer`. Les URL exécutables, autres hôtes ou chemins et les
références contradictoires sont refusés par le normaliseur de présentation.

Il s’agit d’un **constat daté enregistré localement**, sans OAuth, appel à
l’API GitHub ou synchronisation d’état. Le producteur du suivi reste
responsable de l’observation et de sa provenance ; l’interface ne prouve pas
que la PR est toujours dans cet état. La fusion enregistrée n’approuve pas
automatiquement la phase et ne change ni les transitions ni les décisions.

### Revues complémentaires rattachées à la phase

Le frontend lit aussi `data.reviewFollowUps[].documentationPullRequest` pour
les observations dont `phaseId` est le même entier non négatif que celui de
la phase sélectionnée. Chaque objet PR passe les mêmes contrôles que
`phase.pullRequest`. Une entrée malformée, une phase sous forme de chaîne ou
une PR dont les champs essentiels sont invalides ne produit aucune carte.

Ces cartes portent le libellé **Revue complémentaire** et restent distinctes
de la PR principale. Le champ facultatif `documentationPullRequest.scope`
décrit la portée du complément sous forme de texte ; à défaut de chaîne non
vide, le texte `reviewFollowUps[].result` sert de contexte. Sans ces textes,
le libellé générique « Complément rattaché à cette phase » est utilisé.

Les références sont dédoublonnées par dépôt insensible à la casse et numéro :
la PR principale reste prioritaire, puis la première référence complémentaire
valide est conservée. L'ordre des observations est préservé. Cette présentation
ne modifie ni les données sources, ni les preuves, ni les événements, ni les
actions permises. La fusion d'un complément n'enregistre aucune approbation
et ne remplace pas la preuve de validation de la PR principale.
