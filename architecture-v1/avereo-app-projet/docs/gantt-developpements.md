---
project: avereo-app-projet
document_type: technical-guide
title: Gantt privé et avancement technique des développements
status: active
version: git
created: 2026-11-16
updated: 2026-11-16
owner: jpdandin
tags: [cockpit, gantt, progression, github, lecture-seule]
---

# Objectif et état réel

Le responsable demande une vue dynamique du réalisé et du reste à faire, sans devoir maintenir lui-même les phases techniques. Le [suivi canonique](../data/suivi-gantt-developpements.json) porte le lot. Le développement local ajoute **Gantt des développements** dans le module privé existant ; aucune installation distante n'est effectuée par ce travail.

Les suivis JSON restent canoniques. L'agent qui conduit un développement doit continuer à y consigner les preuves, candidats et prochaines actions selon le protocole commun. Le Gantt est une projection calculée de ces informations : il ne déplace pas les phases dans les fichiers, ne remplace pas un suivi incomplet et ne crée jamais d'accord humain.

## Les quatre phases

| Phase | Réalisation de ce lot | Suite / condition réelle |
| --- | --- | --- |
| Cadrage | Sources, règles de calcul, droits et demande d'actualisation automatique identifiés. | Ne pas interpréter une phase ancienne comme la réalité actuelle. |
| Développement local | Projection pure, vue repliable/filtrable, lecteurs bornés et collecteur GitHub périodique opt-in. | Tests, compilation et revue locale à consigner dans le reçu. |
| Préproduction | Non commencée pour ce candidat. | PR, CI, accord ciblé, sauvegarde/retour, vraie session CONNECT et synchronisation automatique à qualifier. |
| Mise en production | Non commencée, non autorisée. | Revue humaine et accord de livraison distincts ; contrôles après livraison et suite. |

# Calcul et présentation

- Exactement quatre phases par itération, filtrage par application et recherche ; cartouches repliables et ouverture du suivi/critères existant.
- Un élément technique est soit un critère avec **toutes** ses preuves directes, soit un contrôle technique non déjà rattaché à un critère. Ce nombre n'est ni une durée, ni un pourcentage de projet.
- Une preuve concluante exige `passed`, une fraîcheur `current`, au moins une identité source/artefact commune au candidat, aucune identité contradictoire, une référence disponible ou des métadonnées explicitement vérifiées à l'export, et une date valide non future. Une pièce de contexte ou `reviewable` ne suffit pas.
- Un contrôle hébergé exige en plus le type explicite `preproduction` ou `production` et sa cible. Une CI, une fusion ou un nom de domaine ne crée pas une livraison.
- Les contrôles GitHub peuvent compléter le Développement local uniquement pour la tête exacte du candidat et une observation de moins de 24 h. `PR Policy` reste séparée : elle comporte des attestations humaines. Une fusion seule ne termine pas une phase.
- La dernière phase techniquement étayée et la phase déclarée sont affichées séparément ; leurs écarts sont visibles. Les nombres de critères acceptés/à examiner sont indépendants des résultats techniques.
- Les barres pleines couvrent les dates des preuves concluantes. Elles ne représentent pas le temps passé ; une preuve ponctuelle reste ponctuelle. La ligne rouge marque aujourd'hui.
- Une prévision n'existe que si la phase source contient `plan: {start: "YYYY-MM-DD", end: "YYYY-MM-DD"}` avec un intervalle valide. Elle est en pointillés. Le reste sans date reste à planifier ; aucune date de livraison ni charge n'est inventée.
- Sans critères/contrôles reconnus, afficher « périmètre et dates à préciser », jamais « terminé ». Un critère sans phase reste signalé et non réparti arbitrairement.
- Les contrôles/pièces d'une autre version restent historiques et ne deviennent pas automatiquement du travail à refaire. Un critère actuel relié à une ancienne preuve reste en revanche à qualifier. Les phases sans éléments structurés sont non quantifiées ; les critères sans phase contribuent au nombre de revues restantes.

Les phases historiques nommées dans un objet peuvent être projetées seulement avec un `phaseMap` explicite dans le registre consultatif. Un `checkKindMap` explicite peut rattacher des types de contrôles historiques aux cinq catégories communes ; le type initial est conservé dans `declaredKind`. Aucun statut ni validation de la source n'est modifié.

`followActiveIteration: true`, réservé à une source consultative avec `dataPath`, suit la clé `activeIteration` de son parent canonique. Seul son enfant exact est projeté : candidat, critères et validations du parent ne sont jamais hérités. Une clé absente/invalide rend le suivi indisponible, sans retour silencieux au cadrage initial. Le registre Rapport utilise ce pointeur pour reprendre le lot actif sans modifier manuellement sa phase ; les sous-lots Photos/Terrain gardent leurs propres entrées historiques.

## Dates et limites

La date de lecture, la date d'export, la date d'observation GitHub et la date d'une preuve sont distinctes. Le seuil de 24 h est une règle d'affichage configurable dans la fonction, pas une garantie de fraîcheur de toutes les données métier ni de disponibilité d'un serveur. Les contrôles historiques restent datés de leur exécution ; ils ne sont pas réexécutés par le Gantt.

L'export peut ajouter `sourceAvailability: available` à une pièce vérifiée par l'éditeur mais non copiée. Son empreinte est conservée ; elle reste inaccessible dans l'API de pièces et non validable humainement. Les anciennes publications sans ce champ restent lisibles et plus conservatrices. Aucun fichier privé n'est copié par défaut.

# Actualisation automatique : trois fonctions distinctes

1. **Lecture automatique du module** : la vue existante relit l'état toutes les 25 secondes quand l'onglet est visible. Le Gantt reprend une nouvelle publication sans clic. Ses lectures de détails sont limitées à quatre simultanément ; cache par révision/date GitHub en local ou séquence/date d'export en hébergé. Une publication changée en cours de lecture est rejetée, puis relue au prochain cycle.
2. **Collecte GitHub automatique sur le poste** : `watch-development-github.mjs` réutilise les GET bornés et la session GitHub CLI déjà configurée, toutes les 5 à 60 minutes. Démarrage explicite seulement ; aucun service, tâche Windows ou cron installé. Une erreur conserve l'observation valide antérieure, n'avance pas sa date et sera retentée au cycle suivant. Pas de git pull, revue, écriture métier, test ou déploiement.
3. **Publication automatique en ligne : exigence retenue, raccordement non installé.** Le lecteur PHP reste GET, avec propriétaire exact et rôle global frais. Il n'a ni accès au disque du PC ni jeton GitHub. Relire une publication ancienne ne constitue pas une synchronisation GitHub. Un collecteur/publicateur de confiance devra exporter les sources canoniques, contrôler les empreintes et transmettre une nouvelle séquence par le canal privé signé, avec sauvegarde et anti-rejeu existants.

Commande opérateur, depuis la racine du dépôt :

```powershell
node architecture-v1/avereo-app-projet/workflows/watch-development-github.mjs --start --registry CHEMIN_PRIVE --interval 300
```

`--once` permet un seul cycle. La commande ne publie rien sur l'hébergement. Arrêt par Ctrl+C ; aucune authentification nouvelle ni valeur de secret affichée.

## Raccordement en ligne à terminer avant d'annoncer une synchronisation autonome

Conserver un seul producteur autorisé et les publications signées, sans donner d'écriture aux utilisateurs du cockpit. Qualifier l'emplacement des vrais suivis : plusieurs sources actuelles sont sur le poste et pas dans main ; GitHub seul ne contient donc pas toute la vérité métier.

- Choisir un opérateur de publication privé exécutant collecte → export → contrôle → sauvegarde → publication atomique → reçu. Ne jamais exécuter une commande fournie par le navigateur.
- Pour fonctionner **poste éteint**, déplacer explicitement les seules sources autorisées vers un espace privé accessible au service ou les versionner dans le dépôt privé approprié. Ne pas publier des contenus clients, preuves ou clés dans un dépôt public. Cette migration n'est pas réalisée ici.
- Configurer une identité de service aux droits minimaux, une destination exclusivement de préproduction, un intervalle borné, un verrou et une surveillance des échecs. Aucun jeton dans le navigateur ; pas de permissions de merge ou de production.
- Conserver la dernière publication valide, annoncer sa date et l'échec de collecte ; préserver toutes les validations et preuves historiques. Un retour ne doit pas abaisser le seuil anti-rejeu ni écraser des données clients.
- Recette : nouvelle PR/CI visible, nouveau reçu de préproduction visible, panne/reprise, publication concurrente, refus anonyme/autre compte/autre admin, révocation du rôle, session expirée, absence d'écriture et poste éteint.

TBD : emplacement/identité du publicateur permanent, droit d'accès aux suivis privés et preuve de fonctionnement poste éteint. Leur simple description n'installe aucun service. Le responsable n'a pas à saisir les phases techniques ; la chaîne de preuves doit d'abord être correctement raccordée.

La [qualification de préparation de PR](publicateur-prive.md) précise les garanties locales, le plan désactivé et les blocages opérationnels. L'ancien opérateur de livraison et le workflow de production ne sont pas réutilisés pour automatiser les données. Aucune installation ni écriture serveur autorisée dans cette étape.

# Sécurité et non-régression

Le Gantt utilise seulement `state` et `iteration` des API privées existantes. Aucune nouvelle route, compte ou permission. Au refus 401/403, tous les résultats privés/cache sont supprimés ; les réponses en retard ne les repeuplent pas. Une source en erreur n'est jamais remplacée silencieusement par son ancien résultat. Le Gantt des projets clients et ses imports restent séparés.

Les sources et décisions sont en lecture seule. Le code privé reste absent du build public ; la qualification couvre les lecteurs Node/PHP, la confidentialité des preuves non copiées, les droits existants, la projection et le rendu local. Les alertes de dépendances antérieures restent à traiter dans leur lot, sans mise à jour aveugle.

## Qualification locale initiale du 16 novembre, avant PR

350 tests réussis sur le candidat local, compilation publique et contrôle d'exclusion du module privé réussis, paquet privé séparé construit et syntaxe PHP vérifiée. Revue navigateur sur les vrais suivis du poste : filtrage, recherche, quatre phases, ligne du jour, lien vers la bonne itération et absence de bouton de validation ; après redémarrage, Rapport suit bien son enfant actif et les CI récentes. Cet accès de test est une capacité privée du poste, pas une attestation CONNECT réelle.

Un lancement parallèle des tests a perdu le processus `planning-local.test.mjs` sans détail d'assertion ; les 40 tests de cette suite réussissent isolément, puis la suite intégrale de 350 tests réussit en exécution séquentielle, sans désactiver ni modifier ces tests. L'incident d'exécution est conservé dans le journal privé, sans cause applicative prétendue ni suppression d'échec.

[Reçu technique local initial](../data/qualification-gantt-developpements.json). Les témoins des 35 JSON canoniques et les projections réelles restent dans le pilotage privé hors dépôt, non inclus dans le paquet. Ce premier reçu portait sur un candidat non committé, avant CI distante ; aucune recette hébergée. Quatre alertes de dépendances de développement connues, audit des seules dépendances d'exécution à zéro. La synchronisation/publication permanente en ligne reste le raccordement à terminer.

## Préparation de la PR160

[PR160 en brouillon](https://github.com/jpdandin44/AVEREO/pull/160), revue en **Développement local**, point d'entrée `http://127.0.0.1:5270/?developments` → Gantt des développements. L'onglet intégré utilise la capacité privée du poste ; une session Chrome différente n'est pas CONNECT et ne reprend pas implicitement cette capacité.

Main PR159 intégré sans conflit dans la branche ; source propre `72ea2efa5f93d469b6dee5812004033491c2f4b2` qualifiée par 354 tests, compilation publique et préparation privée contrôlant le SHA exact, 20 fichiers et empreinte Windows `420c52b82621a872a015045d867cc7fe1a40f9bbc100d4530b40287ef3962184`. 41 assertions CONNECT, 15 assertions Drupal sur doubles et 43/43 tests backend CONNECT réussis. [Reçu PR](../data/qualification-gantt-pr.json). La tête finale peut ajouter uniquement la traçabilité ; lire sa CI GitHub séparément, ne pas réattribuer un artefact Linux à celui de Windows.

Le publicateur reste **bloqué opérationnellement**, mais sa [qualification](publicateur-prive.md) peut être revue avec le Gantt. Le contrat est désactivé et non chargé par le runtime ; aucune authentification modifiée, transport activé, clé ajoutée, publication serveur ou production. Les quatre cases de PR et les validations individuelles restent au responsable humain.
