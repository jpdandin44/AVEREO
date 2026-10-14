---
project: avereo-app-passeport-immo
document_type: session-handoff
title: Point de reprise de session
status: active
version: git
created: 2026-10-03
updated: 2026-10-14
owner: jpdandin
tags: [passeport-immo, local, cockpit]
---

# Point de reprise de session

## Session clôturée le 3 octobre 2026 au soir

Le responsable demande de confirmer le rattrapage du suivi puis d'arrêter la
session pour aujourd'hui. L'état canonique est dans [suivi-chantier.json](suivi-chantier.json) :
phases 0 et 1 validées, phase 2 autorisée et démarrée, PR nº74 fusionnée.
Le livrable CONNECT de phase 2 reste à produire ; aucun travail de cette phase
n'est lancé après cette clôture. Les phases ultérieures ne sont pas démarrées.

Le lot cockpit est conservé **localement, sans commit, push ni nouvelle PR** sur
`feat/projet-github-sync`. Il vérifie les PR chaque minute, conserve les cases et
commentaires pendant la revue, propose le chargement explicite des preuves
modifiées et un passage forcé motivé. Ce passage a été testé seulement sur une
démonstration. Les décisions humaines locales et leurs fichiers générés restent
préservés séparément ; ne pas les inclure mécaniquement dans le futur commit du moteur.

Le blocage de phase 0 provenait de la réécriture de la fiche d'itération après
approbation. Ses octets approuvés ont été restaurés depuis la sauvegarde de revue
après contrôle de l'empreinte, sans changer l'accord humain. La fiche est désormais
historique ; les cartes et tableaux du cockpit affichent le suivi actuel.

Contrôles finaux : 157 tests et build Projet, 10 tests Python Passeport Immo,
vues générées et empreintes approuvées conformes. Le guide, le contrat et l'audit
du moteur sont mis à jour ; périmètre documentaire : ces deux sous-projets.

**Reprise uniquement sur demande explicite.** Relire l'état Git et le suivi,
publier le lot cockpit dans une PR de revue, puis reprendre le lot CONNECT de
phase 2 dans son périmètre autorisé. Préproduction : dossier et HTTPS fermés
disponibles, accès privé utilisable et récupération hébergée à qualifier ; aucun
fichier applicatif installé. Les accords d'installation et de publication restent
distincts. Vérifier les ports 5175 et 5193 au prochain lancement.


## Reprise demandée dans AVEREO_2

Le 2026-10-03, le responsable demande explicitement de reprendre le fichier et
de lancer la reprise de Passeport Immo dans ce nouveau chat. Le clone existant
et les modifications de préparation sont relus ; la branche dédiée est conservée.
L'application et le cockpit répondent sur leurs ports locaux. La reprise est
consignée dans `sessionHandoff`, en conservant la date de clôture précédente.

Le lot a été publié dans la [PR nº74](https://github.com/jpdandin44/AVEREO/pull/74),
puis fusionné par le responsable ; la fusion a été vérifiée. Aucune installation
distante de l'application n'a été effectuée. Son
observation GitHub et les preuves de publication sont enregistrées dans
`developmentWorkflow.preproductionPreparation.publication`, puis affichées par
la fiche générée. Le candidat métier, les validations de phase et les accords
restent ceux du suivi existant. L'accès privé de consultation reste à préciser.
Le responsable retient le sous-domaine proposé et privilégie une lune gratuite si
disponible. L'adresse demandée et cette préférence sont dans
`developmentWorkflow.targets.preproduction`, affichées dans la fiche générée.
Après correction de l'URL par le responsable, cPanel est accessible et authentifié.
La lune préparée est constatée active, avec accès à son cPanel. Le diagnostic montre
que Mon Univers Web bloque l'affichage dans un panneau étroit ; le test en largeur
ordinateur fonctionne. Chrome n'est pas accessible aux outils de cette session.
Après vérification de la restriction o2switch entre comptes, le responsable conserve
l'adresse demandée sur le compte qui héberge `avereo.fr`, avec un dossier dédié protégé.
La première session cPanel est invalidée au retour vers le compte parent. Après
reconnexion du responsable, l'accès authentifié au compte parent est vérifié ; dossier
dédié hors `public_html` et sous-domaine sont créés. Le seul fichier présent est le
modèle `.htaccess` fermé, enregistré puis relu. Un certificat gratuit est simulé puis
installé par validation DNS, sans retirer cette fermeture. L'adresse HTTPS affiche
403 dans le navigateur ; Python valide le certificat et reçoit le même refus avec
l'en-tête d'interdiction d'indexation. Aucun fichier applicatif n'est installé.
Accès privé de test, récupération hébergée et lot CONNECT restent à qualifier.
Les observations datées et la prochaine action sont dans
la cible canonique et la [qualification](qualification-preproduction.md).

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
Branche active à cette clôture : `feat/projet-github-sync`, issue de `origin/main`
au commit de fusion nº74. La branche de préparation précédente est conservée.
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
À la clôture actuelle, le suivi canonique porte les validations humaines des
phases 0 et 1 et le démarrage autorisé de la phase 2. Leurs dates, décisions et
preuves sont celles enregistrées par le responsable dans le cockpit. La checklist GitHub humaine et la fusion valident le lot source nº71 ; les phases
formelles et la recette détaillée restent distinctes. Aucun accord de déploiement,
d'accès production ou d'ouverture n'a été acquis.
Préproduction dédiée o2switch choisie ; adresse demandée et stratégie de compte parent
retenues. Sous-domaine et répertoire créés ; HTTPS et fermeture initiale vérifiés.
L'accès privé utilisable par le responsable reste à configurer et vérifier.
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

À cette étape de l'historique, le sous-domaine et le dossier o2switch sont demandés
au responsable et restent inconnus. Leur création ultérieure est décrite au début
de ce point de reprise. Aucun accès privé ni sauvegarde/restauration hébergée n'est qualifié ;
aucune livraison distante n'est réalisée. La V1 statique, les décisions de phase
et les assets du candidat sont conservés. Le lot CONNECT reste à définir et à
autoriser séparément. Le plafond de ressources autorisé reste 20 % de la limite
hebdomadaire ; l'usage du compte n'est pas une mesure attribuable à ce lot.

Le responsable signale l'absence de la PR nº72 dans la vue. Le champ de suivi est
réaligné sur `reviewFollowUps`, attendu par le moteur ; la carte complémentaire
est rattachée à la phase 0. La fiche d'itération est disponible dès cette phase et
indique le travail actuel ainsi que les validations formelles restant à consigner.
La correction est vérifiée par le contrat du moteur et dans le navigateur.

## Reprise documents du 14 octobre 2026

Le responsable reprend le sujet pour mettre en place les documents d’un client
liés à son bien, avec le dossier réel fourni conservé localement. Il demande aussi
la rotation des scans dans le répertoire source et un statut face aux sources ExamIn.
La branche active est `feat/passeport-immo-documents`, basée sur `origin/main`
observé le 14 octobre. Les modifications du cockpit du 3 octobre restent conservées
localement ; elles ne sont pas incluses automatiquement dans le commit du module.

Le module est testé localement : 26 tests frontend et build réussis, contrôle
de parité a/b/c/d/e réussi. Le cas contient cinq PDF et 33 pages. Deux fichiers
(dix pages) sont retournés et le DPE réordonné ; originaux conservés. Les documents
réels, captures et reçus restent hors Git. L’adresse est confirmée par le responsable et vérifiée dans le devis et le DPE ;
la surface retenue est celle du DPE. La réserve initiale venait d’une erreur de lecture
de l’agent et a été retirée.

Le cockpit est regroupé en quatre phases, avec l’ancien suivi entier dans
`legacyTracking` et les décisions/projections explicitement historiques. Cadrage
conserve uniquement l’accord initial D01. Développement local reste en cours ;
la reprise identique anciennement validée ne valide pas le nouveau module.
Préproduction et Mise en production restent non commencées. Le candidat accepté
et les accords distants précédents restent conservés séparément du nouveau lot.

Prochaine action : recette humaine du dossier concret,
puis lot CONNECT et qualification privée avant toute installation distante.
Publication GitHub et recette navigateur finales seront consignées ci-dessous.

### Complément Coupe et recette locale

Le responsable choisit la comparaison avant/après. Deux projets sont chargés
et sauvegardés dans Coupe, puis exportés en SVG. Le PDF comparatif A3 paysage
est inspecté sur ses deux pages et importé dans les documents du bien.
Le lecteur Passeport Immo affiche les pages 1 et 2 ; le téléchargement conserve
l’empreinte du PDF source. Six documents sont actifs et une ancienne copie du
diagnostic reste archivée. Les sources, exports, projets modifiables et captures
sont conservés dans les dossiers privés ; [le guide](coupes-bien.md) précise les
cotes et les mesures manquantes. Le code de Coupe est conservé.

Le nouveau candidat documentaire est distinct du prototype déjà accepté :
les anciens contrôles, PR, préparations et accords restent dans `legacyTracking`.
La recette locale et les coupes ne donnent pas d’accord de phase ou de livraison.

### Publication du lot

[PR nº78](https://github.com/jpdandin44/AVEREO/pull/78) publiée en brouillon,
avec les quatre cases humaines décochées. Le candidat fonctionnel `322ad127`
est construit par la CI et par le poste. Les mêmes sept assets ont d’abord donné
des ZIP différents par l’ordre de deux noms, lié au tri Windows/Linux ; le tri
par chaîne du nom relatif corrige cette différence. Archive et manifeste sont
identiques après correction. Un test de packaging porte la suite Python à onze
cas ; les 26 tests frontend restent réussis. Les révisions GitHub de suivi sont
observées séparément du candidat et de son acceptation.

Les passages de préproduction, production et clôture sont contrôlés et refusés
pour les qualifications, accords et preuves de récupération manquants. Les
documents du cas, exports et captures restent hors Git. Prochaine action :
recette humaine du dossier et des coupes, puis cadrage du lot CONNECT et
qualification de la préproduction privée.
