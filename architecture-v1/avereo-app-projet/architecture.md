---
project: avereo-app-projet
document_type: architecture
title: Architecture du planning Projet
status: active
version: git
created: 2026-09-19
updated: 2026-11-06
owner: jpdandin
tags:
  - projet
  - architecture
  - stockage
---

# Architecture du planning Projet

## Interface simple — architecture livrée en préproduction

Les résultats réutilisent `checklist[]` : `expected` est le texte à cocher, `completed` sa réalisation et `validated/evidence/validatedBy/validatedAt` sa vérification distincte. Une entrée existante reste une entrée : pas de migration, découpage automatique ni changement de schéma. Les nouveaux résultats reçoivent un ID stable.

Les préférences du catalogue sont étendues selon le [contrat](api/planning-prive.md). La lecture complète les anciennes préférences en mémoire sans réécrire le catalogue ou le planning. Les préférences du mode local utilisent une clé indépendante du document projet.

Le calendrier conserve le moteur de calcul et ses bornes. Le rendu regroupe les cellules par semaine, mois ou année, à largeur proportionnelle au nombre réel de jours ; il ne crée pas de grille journalière en Mois/Années. Les filtres et colonnes restent des états de vue. La hauteur de ligne est partagée entre tableau, barres et flèches. Sur mobile, la colonne des tâches cesse d’être figée horizontalement afin de laisser le calendrier accessible.


## Classement et préférences de vue — 6 novembre 2026

Les tâches peuvent porter deux champs optionnels, `subject` et `priority`, validés par le moteur et PHP. Le contrat précis est dans [l’API privée](api/planning-prive.md). Les tâches anciennes conservent l’absence de ces champs ; une suggestion calculée pour l’affichage ne modifie pas le document.

Les filtres interviennent après le calcul global des dates. Les identifiants de groupes restent ceux du planning complet ; les dépendances masquées restent calculées. Réordonner ou déplacer un lot entier exige la vue complète pour éviter un geste ambigu. Les largeurs utilisent des variables CSS communes au tableau et à l’origine du calendrier ; elles sont mémorisées uniquement dans `localStorage`, clé `avereo.projet.columns.v1`. Les filtres restent en mémoire. Aucun de ces réglages n’entre dans le JSON du projet ou les préférences du compte.


## Menu de compte et page englobante

`index.php` vérifie toujours la session CONNECT avant de rendre le même artefact HTML, mais n’ajoute plus de lien flottant au-dessus de l’iframe. Le menu natif `details/summary` vit dans la barre latérale du Gantt. Le lien de déconnexion vise la route existante `/connect/logout.php` avec `target="_top"` ; aucune logique d’identité ou de cookie ne change.


## Préparation locale des données privées

Le [préparateur d’import](workflows/import-prive.md) utilise le moteur du frontend pour valider un export complet, puis en conserve les octets et l’empreinte dans un dossier privé hors Git et hors assets. Il ne modifie ni le frontend, ni le contrat API, ni le stockage serveur. L’import ultérieur passe par la création de projet existante de Mon espace.


## Espace privé multi-projet — lot suivant du 5 novembre 2026

`project-workspace.js` affiche le catalogue, les archives et les préférences.
`api/workspace.php` et `api/planning.php` réutilisent `planning-auth.php` : même
propriétaire autorisé, session CONNECT, période d’accès, origine et CSRF.
Aucun changement des identités, secrets ou droits CONNECT.

`workspace.json` conserve révision, références clients facultatives, dates
 d’archivage et préférences. Les noms, dates de sauvegarde et nombres de tâches
sont lus dans les documents ; le catalogue ne maintient pas de deuxième titre.
`principal` désigne le stockage existant, sans déplacement ni découpage des lots.
Les nouveaux dossiers utilisent `projects/p-<identifiant aléatoire>/` avec les
mêmes documents complets, révisions et copies de récupération par projet.

Un verrou partagé du catalogue protège les sauvegardes de planning ; les
changements du catalogue prennent le verrou exclusif, puis le verrou du projet.
L’archivage interdit les écritures, y compris depuis un ancien onglet. Les
révisions du catalogue et des documents refusent les modifications périmées.
Les copies locales en attente sont séparées par propriétaire et projet ; une
bascule est refusée tant que le travail actuel reste à enregistrer. Le catalogue
est limité à 100 entrées, archives comprises. La référence client reste du texte,
sans registre de personnes ni accès client. Aucun MySQL ajouté.


## Stockage privé du Gantt — lot V2 du 5 novembre 2026

`frontend/public/api/planning.php` contrôle à chaque requête le cookie signé
CONNECT, sa période d'accès et l'identité du propriétaire configuré hors web.
Le sas partagé livré par la PR #106 conserve maintenant cette identité ; le
constat du 28 octobre ci-dessous est historique.

PHP conserve le document JSON complet, sa révision et sa date dans un répertoire
privé hors racine publique. Le verrou couvre lecture de révision, copies de
récupération et remplacement atomique. La précédente version et vingt versions
tournantes sont conservées. Aucun compte de base ni nouveau secret n'est requis.
`planning-online.js` garde une copie locale en attente avant envoi et sérialise
les requêtes. Une révision périmée est refusée ; aucune fusion automatique.
Le cookie signé, l'origine autorisée et un jeton CSRF protègent l'écriture.
Les requêtes et assets du planning ne sont pas mis en cache ; le wrapper et
les scripts portent un nouveau repère de chargement.

Le service reste réservé à un seul propriétaire et à son Gantt courant.
Le développement Vite conserve son mode local ; `?online` permet la recette
sur un serveur PHP local configuré avec des identités fictives.


## Évolution clients/projets — proposition à cadrer, non installée

Le besoin d'enregistrement serveur et de projets clients parallèles est décrit
dans [les exigences](requirements.md#projets-clients-et-enregistrement-serveur--besoin-demandé-non-implémenté).
La V1 actuelle reste inchangée. Une piste de V2 est un registre clients/projets
et un service PHP de persistance, avec stockage MySQL dédié à qualifier sur
l'hébergement existant. Ni schéma, ni endpoint, ni compte de base n'est créé.

Le contenu JSON complet du planning peut rester un document versionné attaché
à un identifiant de projet ; les métadonnées du registre et les révisions sont
distinctes. Le serveur devient la référence après confirmation d'écriture ;
un brouillon navigateur reste un secours explicitement non synchronisé, jamais
une preuve de sauvegarde distante. Le modèle exact et les migrations restent à décider.

Le code partagé `avereo-platform/shared/connect-gate.php` émet un cookie signé
avec application et expiration, sans identifiant de personne ou de projet.
Il n'est donc pas un contrôle suffisant d'appartenance d'un dossier client.
Avant toute API métier, qualifier une identité serveur et les droits par projet,
sans faire confiance à un propriétaire déclaré par le navigateur. Conserver
le sas existant et ne pas exposer des documents clients comme assets publics.

Cette proposition n'active ni backend V1 ni modification de CONNECT. Le choix
des utilisateurs et le raccordement d'identité conditionnent le cadrage de la V2.

## Affichage et manipulation du Gantt — 28 octobre 2026

Une grille commune porte tableau, calendrier et en-têtes adhérents. Le repli est
un état de vue en mémoire ; la synthèse reste visible et les flèches masquées sont
omises du rendu. Le repère rouge du jour partage l'origine du calendrier, ignore
les pointeurs et se rafraîchit au changement de jour hors édition active.

`movePlanningDates` et `reorderPlanning` retournent des candidats validés sans
modifier leur entrée. Les gestes changent les bornes `manualStart` ou l'ordre de
`tasks`, pas le schéma JSON, les statuts ou les preuves. L'interface prévisualise
le calcul global avant d'enregistrer, refuse une proposition périmée et conserve
une seule annulation en mémoire. Les dépendances, week-ends et début du planning
peuvent modifier l'espacement ; aucun nivellement de ressources n'est ajouté.

La livraison ciblée remplace/crée quatre fichiers statiques ; l'index, le sas,
la configuration privée et les bases hébergées restent conservés.

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
