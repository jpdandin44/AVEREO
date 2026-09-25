---
project: avereo-app-projet
document_type: data-index
title: Données du planning pilote
status: active
version: git
created: 2026-09-19
updated: 2026-09-19
owner: jpdandin
tags:
  - projet
  - donnees
---

# Données du planning pilote

## Référence et dérivés

`data/planning-pilote.json` est la projection structurée maintenue du pilote.
Ses références de périmètre sont l'audit utilisateur et le planning d'exécution,
identifiés dans `provenance.detailSources`. Le générateur produit
`data/generated/planning-pilote.csv`, `data/generated/planning-pilote.json`
et [docs/pilotage-etapes.md](../docs/pilotage-etapes.md).
Le document Markdown expose les mêmes actions et risques pour lecture humaine ;
il est dérivé du JSON et n'est pas une seconde liste maintenue à la main.
Ne pas corriger ces trois dérivés manuellement.
La procédure est dans [workflows/README.md](../workflows/README.md).

Les six lignes couvrent les lots, la réserve et les essais/pilote :
5 ; 5,75 ; 5,25 ; 7 ; 4,9 ; 1,5 jours-personne, soit 29,4 jours-personne.
Départ proposé au 21 septembre, cible au 30 octobre 2026 et capacité de
5 jours-personne par semaine. Ces données ne prouvent ni un démarrage effectif,
ni un avancement, ni une décision humaine déjà approuvée.

## Formats

Le CSV contient neuf colonnes : `ID`, `Nom`, `Lot`,
`Durée (jours ouvrés)`, `Dépendances`, `Responsable`, `Statut`,
`Avancement (%)`, `Criticité`. Les dépendances utilisent les IDs séparés par
virgules. Ce format ne conserve pas les paramètres du projet (dont les dates
début/cible), les dates fixées manuellement sur les tâches (`manualStart`), ni
l'état global de leurs risques (`riskStatus`), les descriptions, les checklists,
les preuves et les registres de risques détaillés. Le JSON de reprise est la
seule sauvegarde complète de ces champs.

Les colonnes `ID`, `Nom` et `Durée` sont obligatoires. Les IDs doivent être
uniques et les références existantes ; un cycle est refusé. Les fractions sont
conservées et l'avancement est exprimé de 0 à 100 : `1` signifie désormais
1 %, contrairement à l'ancien mapper. L'import accepte virgule, point-virgule
ou tabulation comme séparateur CSV ; le générateur utilise point-virgule avec
champs entre guillemets, BOM UTF-8 et fins de ligne CRLF, préservés par le
`.gitattributes` applicatif. Le JSON généré reste en LF. L'export CSV protège les cellules pouvant
être interprétées comme formules par un tableur.

L'import CSV/XLSX conserve les paramètres courants. Le JSON de sauvegarde
porte `schemaVersion: 1`, `name`, `startDate`, `targetDate`, `capacityPerWeek`,
`schedulingMode` et `tasks`. Il conserve les champs normalisés du planning,
pas les informations de provenance propres au fichier source du pilote.
Le manifeste généré du pilote contient ses paramètres, les références de sources
et `taskDetails`, indexé par ID de tâche, avec `description`, `checklist` et
`risks`. Les neuf champs tabulaires viennent du CSV ; les fiches sont ajoutées
depuis ce manifeste puis l'ensemble est normalisé par le moteur.

Lors d'un réimport CSV/XLSX, `description`, `checklist` et `risks` déjà présents
sont conservés seulement si **ID, nom et lot sont tous identiques**. Une tâche
renommée ou déplacée dans un autre lot n'hérite pas de ces détails. Cette reprise
utilise le projet courant : un CSV ouvert dans un navigateur vierge ne restaure
pas les fiches. Les autres champs absents du fichier, notamment `manualStart`
et `riskStatus`, ne bénéficient pas de cette conservation.

Une copie de travail exportée ne modifie pas la référence Git du pilote.
Tout changement durable de ce dernier commence dans sa source avant génération.

## Description, checklist et risques

Les champs restent compatibles avec `schemaVersion: 1`. Leur absence dans un
ancien JSON produit `description: ''`, `checklist: []` et `risks: []`.
Le contrat exécutable est la normalisation de
[`planning-core.js`](../frontend/public/planning-core.js).

| Donnée | Contenu conservé |
|---|---|
| Description | Objectif et contenu de la tâche |
| Étape de checklist | `id`, `title`, `action`, `expected`, `sourceRefs`, `completed`, `validated`, `evidence`, `validatedBy`, `validatedAt` |
| Risque | `id`, `title`, `cause`, `consequence`, `probability`, `impact`, `prevention`, `contingency`, `owner`, `status`, `followUp`, `evidence`, `reviewDate`, `sourceRefs` |

Les étapes initiales ne sont ni réalisées ni validées. Une validation exige
`completed: true`, une preuve et un vérificateur non vides, ainsi qu'un
horodatage ISO avec fuseau, normalisé en UTC. Une étape non validée a une date
de validation nulle. Dans la fiche, modifier réalisation, preuve ou vérificateur
retire la validation précédente et exige une nouvelle action explicite.
Ces informations restent des saisies humaines locales, sans signature ou
vérification externe d'identité. Elles ne modifient pas automatiquement le
statut ou le pourcentage du lot.

Le pilote fournit des probabilités et impacts **proposés**, argumentés dans le
suivi du risque. Cette préqualification est une hypothèse de pilotage, pas une
probabilité mesurée. Le statut reste **À qualifier**, le responsable à confirmer,
la preuve vide et la revue à réaliser. Le score est présenté comme proposé tant
que ce statut demeure ; un score calculable ne confirme pas une revue humaine.
La qualification applique la matrice
`probabilité × impact` : Faible/Moyenne/Élevée valent 1/2/3 et
Mineur/Majeur/Critique valent 1/2/3. Sans qualification d'un axe, le score est
`null` et le niveau reste À qualifier. Les scores 1–2 donnent Mineur, 3–4
Majeur et 6–9 Critique. Ce classement aide au suivi ; il n'atteste aucune
survenance ni traitement.
Le compteur des risques à qualifier comprend également ceux qui disposent
d'un score proposé mais dont le statut reste À qualifier.

Les états du registre sont À qualifier, Ouvert, Sous surveillance, Actif,
Résolu et Accepté. Résolu/Accepté exige les deux axes qualifiés, un responsable,
une preuve et une date de revue réelle au format `AAAA-MM-JJ`. Le moteur
contrôle la présence de ces champs ; il ne confirme pas leur véracité et ne
devine pas une affectation. Les anciens `riskWeight` et `riskStatus` du lot
restent distincts et ne sont pas recalculés à partir du registre.

Les bornes principales sont 100 étapes et 60 risques par tâche ; chaque liste
a des IDs uniques. Description, action, résultat attendu, cause, conséquence,
prévention et réaction sont limités à 12 000 caractères ; preuves et suivi à
6 000 ; chaque élément accepte 20 références de 500 caractères au maximum.
Le JSON exporté doit tenir à la fois dans 5 millions de caractères et 5 Mio
UTF-8, afin de rester réimportable. Les limites antérieures de 1 000 tâches
et de 3 660 jours calendaires/ouvrés restent applicables.

## Enrichissement d'un brouillon existant

Le pilote est reconnu par son nom de projet et la présence de tous ses couples
ID/lot. À la reprise locale ou via **Compléter les fiches documentées**, seules
les tâches correspondantes sont enrichies : description et checklist si toutes
deux sont vides ; registre de risques s'il est vide. Une fiche déjà saisie est
conservée, ainsi que paramètres, charges, noms personnalisés, statuts,
progressions et dates manuelles.

Un risque existant correspondant au même ID peut recevoir **uniquement**
`probability`, `impact` et `followUp` proposés lorsque toutes ces conditions
restent réunies : ses deux axes et son statut sont À qualifier, sa preuve est
vide, sa date de revue est nulle, son responsable est vide ou À confirmer, et
son suivi est vide ou strictement égal au message initial de qualification.
Le texte exact de ce message et ce contrôle sont conservés dans
`mergeDocumentedTaskDetails` de `planning-local.js`. Toute autre qualification,
preuve, revue, affectation ou note de suivi empêche ce complément. Les causes,
conséquences et autres champs du risque existant ne sont pas écrasés.

Si une fiche est ouverte avant la fin de l'enrichissement, sa sauvegarde
conserve les nouvelles étapes et les nouveaux risques arrivés entre-temps.
Une description reçue pendant ce délai est également conservée si l'utilisateur
n'a pas changé celle de la fiche. Les saisies effectuées dans le formulaire
restent prioritaires pour les champs qu'il édite.

La copie précédente est sauvegardée avant remplacement lorsque le stockage le
permet. Une erreur de source conserve le planning ; une modification dans un
autre onglet bloque l'écriture. Cet enrichissement n'est pas une actualisation
forcée des fiches déjà remplies ni une fusion des saisies concurrentes.

## Conservation

Le middleware Vite sert les dérivés sous `/local-planning/` en développement
seulement. Ils sont hors de `frontend/public/` et ne doivent pas être distribués
par le build statique. Le préchargement local n'écrase pas un brouillon existant.

Ne pas versionner de brouillon utilisateur, donnée personnelle sensible ou secret.
