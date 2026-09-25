---
project: avereo-app-projet
document_type: verification-report
title: Recette de la revue locale dans Projet
status: active
version: git
created: 2026-09-24
updated: 2026-09-24
owner: jpdandin
tags: [projet, revue, tests, recette]
---

# Recette de la revue locale dans Projet

## Périmètre et sources

Qualification locale du 24 septembre 2026, sur la branche
`feat/projet-revue-phases`, issue du planning `48ae277`.
Le lot concerne l'interface de revue et son outil de développement ; il ne
qualifie ni l'audit V8 lui-même, ni le sas PHP, ni une publication hébergée.

Le service réel utilise le suivi de la copie sœur
`architecture-documentation-avereo/docs/chantier-optimisation/`.
Les mutations de recette utilisent exclusivement des dossiers temporaires :
fixtures synthétiques, démonstration explicite et copie du suivi réel pour
vérifier les dérivés. Aucune approbation D03/D04 n'est enregistrée dans le suivi réel.

## Résultats automatisés

| Vérification | Résultat observé |
|---|---|
| Installation hors réseau `npm.cmd ci --offline --ignore-scripts --no-audit --no-fund` | 62 paquets installés depuis le cache ; aucune dépendance ajoutée |
| `npm.cmd run test:review` | 16 tests réussis, zéro échec |
| `npm.cmd run build` final | 115 tests réussis : 99 existants et 16 nouveaux ; dérivés du planning alignés, compilation Vite réussie |
| `npm.cmd run check:release`, inclus dans le build | 12 fichiers contrôlés ; aucun JSON/CSV/Markdown local, aucune route de revue dans les scripts publiables ; sas PHP et quatre assets historiques conservés |
| `npm.cmd run check` à la racine | Réussi : socle technique du dépôt valide |
| Écriture, réouverture, sauvegarde et concurrence | Décision et événement persistants ; une seule écriture concurrente acceptée ; révision périmée et verrou actifs refusés |
| Preuves et transitions | Critères, lecture, commentaire, décideur et confirmation exigés ; autorisation distincte du démarrage ; correction et nouvelle remise vérifiées |
| Dépendances et capacité | Modification amont bloque aussi une dépendance indirecte ; dépassement de 2 Mo refusé avant écriture |
| Frontière locale | Origines tierces, faux Host, jeton absent/invalide, corps invalide/excessif et chemin hors périmètre refusés ; jonction externe refusée |
| Générateur réel sur copie du chantier | Approbation, autorisation puis correction sur copie temporaire ; après chacune, contrôle Python réussi et JSON embarqué dans le HTML identique au suivi ; source réelle inchangée |
| Panne de génération dérivée | Test réussi : décision conservée et avertissement explicite, sans faux échec de la sauvegarde |
| Documentation du lot | 28 Markdown et 98 liens locaux vérifiés, métadonnées et blocs de code cohérents ; socles racine et Projet présents |

Un premier lancement de démonstration a exposé le passage des arguments du
lanceur au générateur historique. Le lanceur a été corrigé pour exécuter les
scripts préparatoires avec leurs arguments propres. Le démarrage réel et
le démarrage de démonstration ont ensuite réussi.

Un passage intermédiaire du build a également échoué au niveau du fichier
existant `planning-local.test.mjs`, avec le seul message `test failed`
(75 réussites, un échec de fichier). L'exécution isolée avec le reporter TAP a
ensuite réussi à 40/40, puis la suite complète TAP à 115/115 et le dernier build
complet à 115/115. Aucun test ni assertion n'a été modifié ou désactivé.
Les journaux `tests-complets.tap` et `build-local.log` sont conservés dans le
dossier local `outputs/projet-revue-locale` de l'espace de travail parent.

**TBD — cause de l'échec intermittent.** Le runtime de ce poste est Node
24.18.0, tandis que la CI déclare Node 22. Le prochain passage CI devra confirmer
le résultat sous son runtime ; en cas de réapparition locale, conserver le
rapport TAP et le code de sortie avant toute correction. Le succès final ne
démontre pas que cette intermittence est résolue.

## Recette navigateur

Navigateur intégré Codex, application réelle sur `http://127.0.0.1:5190/`
et démonstration sur `http://127.0.0.1:5191/`.

- Affichage inspecté dans une fenêtre étroite puis une fenêtre large : cartes,
  navigation des phases, lecture du document et formulaire de décision.
- Démonstration : confirmation de lecture, critères cochés explicitement,
  décideur de recette, commentaire et confirmation avant approbation.
- Accord de passage enregistré séparément, puis rechargement : l'approbation
  et l'autorisation persistent, la phase suivante reste non commencée.
- Demande de corrections : phase remise en préparation, accords antérieurs
  visibles comme remplacés dans le journal, autorisation suivante retirée.
- Livrable fictif corrigé puis nouvelle remise depuis l'interface : statut
  « À valider », critères et confirmation de lecture à refaire.
- Contenu HTML hostile inséré uniquement dans le livrable fictif : balise
  affichée comme texte, aucune image interprétée, aucune alerte exécutée.
- Deux livrables fictifs de contenu identique : confirmer le premier laisse
  le second non confirmé ; le compteur reste à 1/2. La lecture est liée au
  chemin et à l'empreinte, pas à l'empreinte seule.
- Suivi réel : sept phases, deux livrées, une approuvée ; audit consultable,
  six critères, bouton d'approbation désactivé sans confirmations et commentaire.
- Planning existant accessible : six tâches, 29,4 jours-personne, fin au
  30 octobre 2026 ; registre de 20 risques toujours à qualifier/confirmer.
  Navigation entre planning et revues effectuée sans modifier ces données.
- Aucun message d'erreur console relevé sur la page réelle lors du contrôle final.

## Sécurité, données et reprise

Le serveur écoute sur `127.0.0.1`, vérifie l'origine et le jeton de session
avant les écritures, et borne les chemins aux livrables déclarés du chantier.
La sauvegarde est sur disque ; le JSON reste éditable par le propriétaire.
L'identité déclarée n'est pas une authentification et le journal n'est pas
une signature ou un registre inviolable. Voir
[le contrat](../api/revue-locale.md) et
[le workflow de reprise](../workflows/revue-developpement.md).

Le nouveau port est une autre origine du navigateur : un brouillon planning
sur 5186 ne migre pas implicitement vers 5190. Utiliser son export JSON complet
puis l'import ; les anciennes saisies ne sont pas écrasées par ce lot.

## Limites et suites humaines

- La CI distante de cette branche n'a pas été exécutée : le build local est
  raccordé à la CI existante, sans preuve nouvelle d'exécution GitHub.
- Aucune PR de ce nouveau lot n'est publiée ; aucun merge ou déploiement.
  La publication de branche puis la revue humaine du code restent distinctes
  de la validation métier des phases.
- Le téléchargement effectif du nouvel export par le navigateur n'a pas été
  qualifié ici ; sa réponse HTTP et son JSON sont vérifiés automatiquement.
- Le double-clic Windows du lanceur reste à effectuer par l'utilisateur ; la
  commande Node/npm équivalente a effectivement démarré les deux serveurs.
- Les échanges XLSX/JSON et les parcours tactiles historiques du planning
  gardent leurs limites dans [l'audit source](source-audit.md).
- Les brouillons de commentaire de revue non enregistrés ne survivent pas à
  la fermeture/recharge de page. Les décisions enregistrées survivent.
- Une correction après démarrage d'une phase ultérieure demande un examen
  coordonné : aucun retour en arrière en cascade n'est proposé automatiquement.

La revue humaine de l'interface et celle de l'audit V8 restent à faire. Le lot
livre l'outil pour les réaliser, sans constituer ces accords.

## Complément du 24 septembre — progression et accords antérieurs

La nouvelle présentation consomme le suivi du site sur `127.0.0.1:5192`.
Les résultats de la recette initiale ci-dessus restent historiques ; ils ne
déterminent pas l'état actuel des décisions du chantier global.

- Neuf tests de présentation ajoutés : remises historiques, phases à valider,
  autorisation issue du service, livrables déclarés/dossiers, blocages,
  dates, accords antérieurs et activité. Aucun journal réel utilisé en écriture.
- Build final : **124/124 tests réussis**, dérivés cohérents, compilation Vite
  et contrôle de l'artefact réussis (12 fichiers, données et API de revue exclues).
- `npm.cmd run check` racine et `git diff --check` réussis.
- Navigateur intégré, largeur disponible d'environ 537 px : progression,
  dates, états et disponibilité lisibles ; ouverture du panneau des acquis.
  Quatre validations et quatre autorisations globales affichées avec leurs
  commentaires, origine et distinction des preuves.
- Sélection de la phase 0 depuis la progression puis lecture de **Journal · 2** :
  accords du site de 22:19:11 et 22:19:53 heure de Paris conservés. Retour à
  la phase 1 réussi ; nouvelle livraison accessible. Aucune case de revue
  cochée ni décision soumise pendant cette recette.
- Aucun message d'erreur console relevé lors du contrôle de cette page.

Limites : pas de matrice exhaustive de tailles d'écran ni de nouvelle recette
tactile. Les tests de transition existants couvrent les mutations sur fixtures.
Le relevé `priorApprovals` est daté et rafraîchi par le chantier consommateur ;
il n'est pas une synchronisation automatique entre projets. Cette évolution
reste locale, sans publication ni validation humaine créée par les tests.

## Complément du 24 septembre — livrables attendus et actualisation

Périmètre : présentation des métadonnées facultatives des livrables et lecture
automatique du suivi local. Les résultats à 115 puis 124 tests ci-dessus sont
conservés comme étapes historiques ; le contrôle suivant porte sur le code
complété par dix nouveaux tests.

| Vérification exécutée | Résultat |
|---|---|
| `node --test tests/review-refresh.test.mjs tests/review-progress.test.mjs` depuis la racine applicative | **19 tests réussis**, aucun échec : 12 de présentation et 7 de rafraîchissement |
| `npm.cmd run build` depuis `frontend/` | **134 tests réussis**, dérivés du planning cohérents et compilation Vite réussie |
| Contrôle de l'artefact inclus au build | 12 fichiers vérifiés ; données/API de revue et pilote exclus, sas et planning conservés |
| `git diff --check` sur l'application | Réussi ; avis de normalisation LF/CRLF documentaires uniquement |

Les tests ciblés vérifient les métadonnées de livrables absents puis présents,
les erreurs de sécurité qui doivent rester visibles, les messages selon l'état
et l'autorisation réellement permise, la conservation des brouillons, la
réinitialisation ciblée des attestations et des dépendances, ainsi que la
sélection de document. Une modification du fichier Markdown sans changement
du JSON est exercée sur un dossier temporaire avec le vrai store. Le test de
concurrence retarde un GET jusqu'après un POST pour vérifier que sa réponse
ne remplace pas l'état enregistré.

Les mutations de test restent sur fixtures. Le frontend ajoute seulement des
lectures périodiques : aucune décision réelle, livraison ou validation n'a été
créée par ces contrôles. Le fonctionnement attendu et la cadence sont décrits
dans [le guide](guide-utilisateur.md#voir-la-progression-et-les-validations-acquises).

**Limite de cette preuve :** ces résultats automatisés ne qualifient pas le
rendu navigateur ni les événements réels de focus/visibilité. Une recette
navigateur distincte doit constater les fiches, l'actualisation et la conservation
d'un brouillon sans soumettre de décision sur le chantier réel. Aucune
exécution CI distante, publication ni recette tactile n'est attestée ici.

## Observation navigateur de cette évolution — 24 septembre

Le navigateur intégré sur `http://127.0.0.1:5192/` affiche la phase 2 en cours
avec son dossier Homepage et ses preuves attendues. La phase 4 affiche un
document prévu, sa description et le téléphone/accord obligatoire ; aucun
fichier absent n’est présenté comme une livraison.

Une modification réelle de la prochaine action du suivi a été reçue sans
clic sur Actualiser. Un commentaire temporaire a été saisi dans un champ
préalablement vide : il est resté intact après deux lectures automatiques
(23:56:01 et 23:56:51, heure de Paris), avec la phase sélectionnée conservée.
Le texte a ensuite été retiré ; aucune case ni décision n’a été enregistrée.
Retour sur Homepage réussi, aucun message d’erreur ou d’avertissement console
relevé. La qualification spécifique focus/masquage et une matrice tactile ou
responsive complète restent hors de cette observation.
