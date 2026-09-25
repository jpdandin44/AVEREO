---
project: avereo-app-projet
document_type: architecture
title: Architecture du planning Projet
status: active
version: git
created: 2026-09-19
updated: 2026-09-24
owner: jpdandin
tags:
  - projet
  - architecture
  - stockage
---

# Architecture du planning Projet

## Extension locale de revue — 24 septembre 2026

Le wrapper React propose en développement deux espaces. L'iframe du planning
est conservée en mémoire lorsqu'on revient aux revues. Le build hébergé garde
le planning ; le module de revue est exclu par `import.meta.env.DEV`.

`ReviewWorkspace.jsx` lit les phases et présente les livrables avec un rendu
React échappé. `review-plugin.mjs` ajoute les routes locales au serveur Vite ;
`review-http.mjs` borne les requêtes à la boucle locale et à leur origine ;
`review-store.mjs` vérifie les décisions et écrit le suivi choisi par le lanceur.
Le contrat est décrit dans [l'API locale](api/revue-locale.md).

Le JSON du chantier reste la référence. Événement, preuves SHA-256 et nouvel
état sont enregistrés ensemble, avec sauvegarde préalable, verrou exclusif et
contrôle de révision. Le générateur Python du chantier actualise ses vues dérivées.
Cette extension n'utilise pas le stockage navigateur du planning et n'introduit
pas de base ou d'API hébergée. L'identité est déclarative ; le journal local
reste modifiable par le propriétaire des fichiers.

La [procédure](workflows/revue-developpement.md) décrit les limites et la reprise.
Les sections suivantes documentent le sous-système de planning conservé.


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

## Vue de progression de la revue

`review-progress.mjs` calcule une synthèse de présentation à partir du snapshot
existant : phases, actions disponibles, documents accessibles et décisions.
`ReviewProgress.jsx` affiche cette synthèse et sélectionne les phases dans
`ReviewWorkspace.jsx`. Les autorisations restent calculées par le service
existant ; aucun second moteur de transitions ni stockage n'est ajouté.

Le champ optionnel `priorApprovals` est une vue dérivée fournie par le chantier
consommateur. Projet l'affiche avec sa provenance et sa date ; il ne l'importe
pas dans `reviewEvents`, ne la rafraîchit pas depuis une source externe et ne
l'utilise pas pour autoriser une nouvelle phase. Le contrat HTTP reste inchangé.

## Rafraîchissement et preuves de revue

`ReviewWorkspace.jsx` relit le snapshot existant toutes les 25 secondes si la
page est visible, ainsi qu'au retour au focus ou à la visibilité. Le bouton
manuel utilise le même chemin de lecture. Les brouillons restent en mémoire
React ; le rafraîchissement n'écrit ni le suivi ni le journal et n'ajoute aucune
sauvegarde persistante du commentaire.

`review-refresh.mjs` compare, par phase, les documents et empreintes, problèmes
de lecture, critères, livrables attendus, état, autorisation, validation,
actions disponibles et dépendances. Les attestations en cours sont invalidées
sur changement de ces preuves ; les textes saisis et choix encore disponibles
sont préservés. La révision serveur inclut déjà les empreintes documentaires :
un fichier modifié est détecté même sans modification du JSON.

Une seule lecture d'état est gardée en vol. Le démarrage d'une écriture invalide
la lecture précédente et suspend les suivantes ; sa réponse tardive ne peut
pas remplacer celle du POST. Les handlers de minuterie/focus/visibilité sont
retirés au démontage. Cette coordination ne modifie pas le protocole serveur.
Les métadonnées facultatives de livrable sont décrites dans
[le contrat local](api/revue-locale.md#description-des-livrables-prévus).
