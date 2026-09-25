---
project: avereo-app-projet
document_type: architecture
title: Architecture du planning Projet
status: active
version: git
created: 2026-09-19
updated: 2026-09-19
owner: jpdandin
tags:
  - projet
  - architecture
  - stockage
---

# Architecture du planning Projet

## Vue d'ensemble

Projet appartient au monorepo AVEREO. React 18/Vite 5 portent le point d'entrée ;
`frontend/src/App.jsx` affiche `frontend/public/legacy-app.html` dans une iframe.
Le métier s'exécute dans le navigateur. Le sas PHP CONNECT concerne
l'hébergement ; Vite ne l'exécute pas.

Le lot décrit ci-dessous est implémenté localement. Les preuves et les limites
de sa qualification sont centralisées dans [l'audit](docs/source-audit.md).

## Composants et flux

| Composant | Responsabilité |
|---|---|
| Interface HTML | Saisie, tableau/Gantt, risques et commandes de fichiers |
| `planning-core.js` | Validation, normalisation, import/export et calendrier |
| `planning-local.js` | Coordination interface, fichiers et stockage local |
| `task-details.js` | Fiches d'actions, états de checklist, registre et édition des risques |
| Stockage navigateur versionné | Brouillon propre à l'origine |
| JSON exporté | Reprise complète, y compris paramètres |
| CSV neuf colonnes | Échange des tâches |
| Source JSON du pilote | Référence versionnée des tâches et paramètres |
| Générateur | CSV et manifeste contenant les fiches sous `data/generated/`, document des étapes dérivé dans `docs/` |
| Middleware Vite de développement | Routes `/local-planning/`, absentes du build publié |
| Document des étapes | `docs/pilotage-etapes.md`, dérivé lisible servi en texte brut |

L'import est lu et validé avant de remplacer le planning. Une erreur conserve
l'état courant. Un remplacement valide reste soumis à confirmation lorsqu'un
planning existe déjà. L'état accepté alimente le calcul, les vues puis la
sauvegarde navigateur. Une erreur de quota laisse la modification en mémoire
et affiche explicitement que la sauvegarde a échoué.

Le schéma JSON porte `schemaVersion: 1`. Le brouillon utilise la clé
`avereo.projet.planning.v1` ; la copie précédente utilise
`avereo.projet.planning.previous.v1` lors d'un remplacement. Un brouillon
illisible reste exportable en brut. Le contrôleur refuse une écriture si un
autre onglet a changé le stockage : exporter puis recharger avant de poursuivre.
Il n'effectue aucune fusion entre les éditions concurrentes des onglets.
La copie précédente n'est pas un historique de toutes les modifications.

Un enrichissement distinct complète un pilote reconnu : nom de projet identique
et présence des six couples ID/lot. Pour chaque tâche correspondante, description
et checklist sont ajoutées uniquement si les deux sont vides ; les risques sont
ajoutés si leur registre est vide. Dans un registre existant, seuls probabilité,
impact et suivi proposés peuvent compléter un risque demeuré dans l'état initial
non qualifié, sans preuve ni revue ; les conditions précises sont dans l'index
des données. Les autres champs et les fiches déjà remplies restent conservés.
Le contrôleur relit l'état courant après la
réponse réseau, valide le résultat et garde le brouillon précédent avant écriture.
Une source de fiches indisponible n'invalide pas le brouillon restauré.
L'éditeur mémorise aussi l'état des détails à l'ouverture d'une fiche pour
préserver les entrées arrivées pendant un enrichissement asynchrone lors de sa
sauvegarde, tout en conservant les saisies de l'utilisateur.

Le pilote est chargé uniquement sur les hôtes locaux autorisés, en l'absence
d'un brouillon. Les fichiers se trouvent hors de `frontend/public/` :
le contrôle du hostname est complété par l'absence de ces données dans
`frontend/dist/`. Le middleware de développement ne crée aucune API métier
hébergée.

Le lien documentaire charge `/local-planning/pilotage-etapes.md`. Vite renvoie
`text/plain; charset=utf-8` et `task-details.js` utilise `textContent` dans un
bloc de texte : aucun interpréteur HTML/Markdown n'est ajouté. Le fichier métier
reste hors des assets publics, comme les données du pilote.

## Calendrier et données

Dates de début/cible et capacité sont configurables. Les durées sont des
jours-personne décimaux. Le calendrier utilise lundi–vendredi sans absence
ni jour férié renseigné par défaut. La cible est comparée à la fin calculée ;
elle ne compresse pas artificiellement la charge.

Le mode séquentiel représente une capacité commune, sans parallélisme supposé.
Les prédécesseurs doivent apparaître avant leurs successeurs dans sa liste.
Le mode dépendances autorise les chevauchements du graphe ; il n'effectue
pas de nivellement des ressources. Un jalon garde une durée nulle. Une date
fixée manuellement est une borne minimale, sans contourner les dépendances.

Le schéma reste en version 1 avec champs optionnels `description`, `checklist`
et `risks`. Les anciennes tâches reçoivent une description vide et deux listes
vides. Validation d'étape, état de risque et avancement du lot sont des états
distincts ; aucun ne certifie ou complète automatiquement les autres. Les
preuves, identités saisies et dates sont des déclarations locales, sans contrôle
externe d'identité ou de réalisation. Le contrat et la matrice de criticité sont
décrits dans [l'index des données](data/README.md).
Une préqualification du pilote peut proposer probabilité, impact et score avec
une justification de suivi ; le statut À qualifier distingue cette proposition
de la revue humaine. Le score connu ne vaut pas qualification confirmée.

Le JSON de reprise conserve l'ensemble des champs normalisés. Le CSV neuf
colonnes n'est pas une sauvegarde complète. À sa réimportation, le contrôleur
peut conserver les détails déjà présents seulement pour un ID, un nom et un lot
identiques ; ce mécanisme utilise l'état courant, pas un contenu caché du CSV.

La source du pilote reste le JSON documenté dans [data/](data/README.md).
Les fichiers générés ne sont pas corrigés manuellement. Aucun schéma SQL,
stockage serveur, compte supplémentaire ou secret nouveau n'est introduit.

## Dépendances et limites

Le HTML historique utilise Tailwind, SheetJS, Lucide et une police depuis des
services externes. Leur disponibilité réseau est distincte du stockage local.
La V1 ne fournit ni collaboration, ni synchronisation serveur, ni gestion
multiutilisateur des conflits.

Le build conserve les fichiers publics, les points d'entrée PHP et la garde
CONNECT copiée depuis la plateforme. Configuration réelle et état public
n'ont pas été qualifiés dans ce lot. Voir [publication](docs/deployment.md).
