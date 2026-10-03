---
project: avereo-app-passeport-immo
document_type: session-handoff
title: Point de reprise de session
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [passeport-immo, local, cockpit]
---

# Point de reprise de session

## Reprise demandée dans AVEREO_2

Le 2026-10-03, le responsable demande explicitement de reprendre le fichier et
de lancer la reprise de Passeport Immo dans ce nouveau chat. Le clone existant
et les modifications de préparation sont relus ; la branche dédiée est conservée.
L'application et le cockpit répondent sur leurs ports locaux. La reprise est
consignée dans `sessionHandoff`, en conservant la date de clôture précédente.

Le lot prépare la publication d'une PR en brouillon après contrôles locaux. Son
observation GitHub et les preuves de publication sont enregistrées dans
`developmentWorkflow.preproductionPreparation.publication`, puis affichées par
la fiche générée. Le candidat métier, les validations de phase et les accords
restent ceux du suivi existant. Cible o2switch et accès privés restent à préciser.

## Historique de clôture avant cette reprise

Le 2026-10-03, le responsable demande de documenter l'état puis de reprendre dans
un nouveau chat du projet **AVEREO_2**, afin de séparer les contextes. Ce point est
le relais du clone source ; le document de reprise du projet AVEREO_2 renvoie ici.
La clôture précédente est conservée dans `sessionHandoff` du suivi canonique.
La demande explicite du nouveau chat autorise la présente reprise ; elle ne
constitue pas une validation de phase.

À cette clôture, les modifications du lot étaient conservées localement sur
`feat/passeport-immo-preproduction`, à partir de la fusion nº72. Aucun nouveau commit,
push ou PR n'avait été créé pour ce lot. Une description de PR était seulement préparée dans
`.local/preproduction-preparation/pr-body.md` et sa forme est contrôlée en mode
prépublication, toutes les cases humaines décochées. Aucune CI distante de ce lot
n'avait été observée. Les serveurs locaux de l'application et du cockpit restaient actifs
à la clôture ; vérifier leur disponibilité lors de la reprise.

Contrôles du lot : six tests de préparation, raccordement au contrat du cockpit,
parité a/b/c+d, relecture du lot fermé, restauration locale, vues dérivées et
cohérence documentaire réussis. Le contrôleur de passage refuse la préproduction
pour les prérequis absents ; ce refus est attendu. La carte de la PR nº72 fusionnée
est vérifiée à l'écran en phase 0. Les 33 documents et 98 liens locaux du sous-projet
et des index racine sont vérifiés ; décisions, événements humains, statuts/dates de
phase, candidat, cibles, accords et livraison restent conservés. Audit des autres
applications et installation distante : non effectués.

## Disponible
Prototype local React/Tailwind après phase 0, puis raccordement demandé au protocole
GitHub/cockpit et correction PDF autorisée. Quatorze tests, build et parité a/b/c+d
réussis ; le même export court réel donne une page A4 complète.
La [fiche générée](iteration-developpement.md), issue du seul suivi JSON, identifie
le candidat, la PR nº71, les observations CI et les blocages. Ne pas la modifier à la main.
La CI et le candidat local sont identiques octet par octet, manifeste et cinq assets
vérifiés. Consulter cette fiche pour les SHA et dates ; ils ne sont pas dupliqués ici.

## Git et périmètre
Branche active : `feat/passeport-immo-preproduction`, préparation locale de préproduction.
PR nº71 fusionnée par le responsable, observation vérifiée sur GitHub et dans main.
Base du prototype : `f4695d662546fe7277bf3a50c8c975ce97e8b9a0`.
Fusion observée dans main : `6399524cc0f92a90ab9c53c1990f07016e827775`.
La publication par connecteur GitHub a conservé exactement l'arbre local après
échec d'authentification du Git habituel. Les branches locales phase-0, phase-1
et `feat/passeport-immo-cockpit-local` conservent les étapes précédentes.
Le clone Collector original et la source CONNECT historique sont préservés.
Les chemins du poste, imports, données navigateur et preuves locales sont hors Git.

## Autorisation et état
Accords de périmètre : « Phase 0 puis prototype local dans cette session », puis
invocation du skill et « Raccordement et correction du PDF ».
Les six statuts formels, décisions et événements de revue restent inchangés :
phase 0 en cours, phase 1 formellement non commencée ; la copie locale reste
disponible sous l'accord de session. La checklist GitHub humaine et la fusion valident le lot source nº71 ; les phases
formelles et la recette détaillée restent distinctes. Aucun accord de déploiement,
d'accès production ou d'ouverture n'a été acquis.
Préproduction dédiée o2switch choisie ; adresse/répertoire et accès non déterminés.
Préproduction et production : isolement/vacuité ou sauvegarde
restaurée, intégration CONNECT et retour arrière à qualifier.

## Ouvrir et reprendre
Application : `../start-local.cmd`, <http://127.0.0.1:5175/>, « Se connecter ».
Cockpit Projet : `../start-review.cmd`, <http://127.0.0.1:5193/>.
Dans phase 0 ou 1, sélectionner le document « Itération GitHub et cockpit ».
Les deux services ont été lancés sur ce poste ; leurs instances peuvent être arrêtées
par Ctrl+C dans leur terminal. Ne pas arrêter un service inconnu occupant le port.

Tests et build depuis `frontend/` ; parité depuis le sous-projet.
Lire le [mapping du protocole](../workflows/developpement-github-cockpit.md)
pour packaging et contrôles de passage. Les paramètres locaux du skill et du rendu
sont dans `.local/review-settings.json` ignoré.
Avant chaque écriture du suivi, vérifier l'absence de `.projet-review.lock`,
puis régénérer les vues et utiliser `--check`.

## Suite et limites
Recette humaine R01…R13 et téléphone réel ouverts. Q09 est résolue techniquement ;
h/ml à zéro, partage d'URL et groupement PDF par nom restent inchangés.
Docker : configuration vérifiée, image non exécutée. Avertissement de bundle conservé.
Qualifier la cible dédiée o2switch et le lot CONNECT, puis préparer un accord
portant sur le candidat exact. Les contrôles de passage refusent les preuves absentes.
Claude n'a pas été consulté : interface accessible à l'écran de connexion dans
le lot initial ; le prompt fourni reste une ressource, sans session ouverte à sa place.

## Vérification documentaire
Socles du sous-projet et de la racine présents. Contrôle des métadonnées simples,
liens locaux, matrice, JSON, vues dérivées et lecture native du cockpit effectué.
Les détails et preuves sont dans [raccordement-cockpit.md](raccordement-cockpit.md).
Le périmètre vérifié est ce lot ; audit global des autres applications : TBD.

## Rebase de la PR nº72 après fusion du socle commun

Le responsable demande le rebase après avoir fusionné la PR nº73. Les deux commits
de suivi ont été rejoués sans conflit sur cette fusion. La comparaison des commits
avant et après confirme le même contenu ; aucun changement du frontend ni du
candidat accepté de la PR nº71. Le suivi conserve les phases et décisions humaines.

Le protocole commun est désormais présent dans cette branche. Le paramètre du poste
qui appelle son contrôleur est réaligné vers le skill utilisateur installé ; aucune
copie supplémentaire de la procédure n'est créée. Les informations GitHub du rebase
sont datées dans le suivi ; vérifier la tête de PR avant une décision.

## Reprise après fusion de la PR nº72

La fusion est vérifiée sur GitHub et dans `main`. La demande « continuer le
développement » lance un lot de préparation locale de la préproduction dédiée.
La [procédure de préparation](../workflows/preparer-preproduction.md) contrôle le
candidat déjà identifié, crée une archive avec fermeture initiale de l'accès,
relit ses fichiers et répète leur restauration dans un répertoire temporaire.
Six tests couvrent les contrôles d'intégrité, les chemins et les liens symboliques.
Les preuves et empreintes sont dans la fiche d'itération générée depuis le suivi.

Le sous-domaine et le dossier o2switch sont demandés au responsable et restent
inconnus. Aucun accès privé ni sauvegarde/restauration hébergée n'est qualifié ;
aucune livraison distante n'est réalisée. La V1 statique, les décisions de phase
et les assets du candidat sont conservés. Le lot CONNECT reste à définir et à
autoriser séparément. Le plafond de ressources autorisé reste 20 % de la limite
hebdomadaire ; l'usage du compte n'est pas une mesure attribuable à ce lot.

Le responsable signale l'absence de la PR nº72 dans la vue. Le champ de suivi est
réaligné sur `reviewFollowUps`, attendu par le moteur ; la carte complémentaire
est rattachée à la phase 0. La fiche d'itération est disponible dès cette phase et
indique le travail actuel ainsi que les validations formelles restant à consigner.
La correction est vérifiée par le contrat du moteur et dans le navigateur.
