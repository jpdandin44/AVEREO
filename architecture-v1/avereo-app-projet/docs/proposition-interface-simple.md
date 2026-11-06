---
project: avereo-app-projet
document_type: design-proposal
title: Interface simple, résultats cochables et planning pluriannuel
status: active
version: git
created: 2026-11-06
updated: 2026-11-06
owner: jpdandin
tags: [projet, interface, cadrage, planning]
---

# Interface simple, résultats cochables et planning pluriannuel

## État après accord de poursuite

Le responsable a autorisé le développement local le 6 novembre. Le candidat réalise fiche simplifiée, résultats cochables, préférences, recherche et filtres, affichage allégé et échelles Mois/Années. Le [guide](guide-utilisateur.md) décrit le comportement effectif et le [suivi](../data/suivi-interface-simple.json) porte la version et les contrôles. La PR #114 fusionnée a ensuite été installée en préproduction sur accord explicite. Les preuves et la réserve de positionnement du menu sont dans le suivi. Aucune production de ce lot n’est déclarée.

Choix de réalisation : une entrée existante de checklist reste un résultat, avec possibilité d’ajouter et modifier les résultats. Aucun nouveau schéma ni découpage automatique des textes. Le calendrier agrège les périodes réelles plutôt que de mettre en place une virtualisation journalière ; les vues longues restent bornées par le moteur existant. Durée, début et dépendances deviennent optionnels ; d’autres colonnes proposées comme responsable ne sont pas ajoutées. Les paragraphes de proposition ci-dessous conservent le cadrage initial ; ces choix et le guide décrivent le candidat effectivement réalisé.


## Demande et périmètre

Le responsable a validé les filtres et colonnes de la PR #112 en préproduction, puis demandé une proposition d’amélioration de la lisibilité. Le présent document conserve le cadrage initial ; l’accord de développement et la réalisation locale sont consignés ci-dessus. Il ne vaut pas autorisation de livraison.

Demandes explicites : résultats attendus cochables pour valider la section Actions ; vérification complémentaire activable dans les préférences ; champ « Ne pas démarrer avant » masqué par défaut et activable dans les préférences (champ confirmé par le responsable) ; planning plus lisible avec recherche et filtres actuels ; vues Mois et Années pour plusieurs années.

## Constats initiaux dans la base #112

- L’en-tête garde visibles paramètres du projet, sauvegardes, commandes, filtres et explications avant la première ligne du Gantt. Les étiquettes répétées sous chaque tâche alourdissent la lecture.
- Une étape contient un résultat attendu en texte libre, une case de réalisation, une preuve, un vérificateur et une validation séparée. Les trois conditions sont imposées pour la validation actuelle.
- Les préférences du compte ne contiennent que l’échelle jours/semaines et le repli initial des lots. Leur extension concernera aussi la validation PHP et la rétrocompatibilité.
- Le moteur accepte déjà un horizon borné à 3 660 jours calendaires ; les vues n’offrent que Jours et Semaines. Une nouvelle échelle ne supprime pas cette borne, et il ne faut pas promettre une durée illimitée.

## Proposition recommandée

### Planning centré sur les actions

Un en-tête compact affiche le nom du projet et l’état d’enregistrement. Les paramètres de démarrage/capacité, l’import/export et les copies de secours deviennent des commandes accessibles à la demande. Un échec de sauvegarde doit rester visible, jamais caché dans un menu.

Une barre unique contient la recherche de tâche, Sujet et Statut ; les autres critères et colonnes sont disponibles par un bouton Filtres/Affichage. Les filtres actifs se résument par des pastilles supprimables et un compteur. La recherche porte sur le titre et la description dans le projet courant, sans modifier dates ou données. Une sélection n’entraîne pas de sauvegarde métier.

Colonnes de base : Tâche, Statut et calendrier. Durée, responsable, priorité et détails supplémentaires sont optionnels. Conserver le redimensionnement. Garder les titres sur une ou deux lignes, réduire les quadrillages et badges répétitifs, distinguer les groupes et les jalons. Les alertes utiles restent visibles ; les détails apparaissent à l’ouverture de la fiche. Une option Compact/Confortable adapte la densité sans réduire les caractères à une taille illisible.

### Fiche de tâche progressive

Sur grand écran, proposition d’un panneau latéral large conservant le contexte du planning ; sur petit écran, fiche pleine largeur. En premier : titre, sujet, statut, dates utiles, courte description et résultats attendus. Les notes/pièces, dépendances, dates contraintes et risques sont dans des sections repliables. Un risque actif ou un blocage conserve un repère visible même lorsque la section est repliée.

Le pied de fiche garde Enregistrer et Annuler accessibles, avec état des modifications. Le titre et la description doivent se lire sans texte tronqué. La fermeture d’une fiche modifiée demande de conserver ou abandonner les changements, sans écriture silencieuse.

### Résultats cochables et vérification optionnelle

Mode simple par défaut : une case par résultat attendu et un compteur « 2 / 3 réalisés ». Tous les résultats cochés donnent « Section validée ». Aucune preuve ni identité de vérificateur n’est exigée dans ce mode. Une section sans résultat affiche « Aucun résultat défini », pas une validation automatique.

Préférence « Vérification complémentaire des résultats », désactivée par défaut : expose preuve/référence, vérificateur et confirmation explicite. Tous les résultats réalisés donnent alors « Réalisée — à vérifier », puis « Section vérifiée » après les contrôles requis. Cette option règle le parcours de vérification, sans confondre réalisation et vérification humaine dans les données.

Le statut global de la tâche reste distinct : cocher la section ne marque pas automatiquement la tâche Terminé ou Validé. Un éventuel bouton « Marquer la tâche terminée » reste une action explicite. Ne pas déduire une charge réalisée ou un pourcentage de temps de la seule proportion de cases cochées.

Conservation : les preuves, validations et dates historiques restent stockées si l’option est désactivée. La réactivation ne crée pas de vérification rétroactive. Modifier un résultat déjà vérifié demande une nouvelle vérification ; changer une préférence seule ne réécrit pas les tâches.

Les résultats existants sont des textes libres : proposer initialement une case par bloc de résultat existant, sans découpage automatique en phrases et sans perte du texte. Le responsable pourra ensuite séparer un bloc en plusieurs résultats. Prévoir des identifiants stables, des états individuels et des échanges JSON compatibles ; le CSV demeure partiel. La migration précise est à définir et tester avant toute écriture réelle.

### Préférences simples

- Vérification complémentaire : désactivée par défaut.
- Dates de démarrage contraintes (« Ne pas démarrer avant ») : désactivée par défaut, comme confirmé par le responsable.
- Échelle initiale et densité : réglages de présentation, sans effet sur le calendrier.

Les préférences du compte sont le lieu recommandé, cohérent avec l’existant. Leur portée exacte en mode local devra être qualifiée. Masquer la saisie d’une date contrainte ne supprime pas sa valeur ni son effet. Une contrainte déjà renseignée reste signalée discrètement dans la fiche, avec un accès à l’option permettant de la modifier.

### Mois et Années

Conserver quatre échelles : Jours, Semaines, Mois, Années. Ajouter Aujourd’hui, Aller à une date/période et Adapter au projet. La vue Mois présente les mois avec leurs années ; la vue Années privilégie les groupes et jalons, avec accès au détail par zoom.

Afficher une fenêtre temporelle adaptée au lieu de construire toutes les cellules journalières d’un projet de plusieurs années. Conserver le calcul des dépendances et des dates sur le projet complet ; ne filtrer que le rendu. Respecter la durée réelle des mois et les années bissextiles, sans assimiler un mois à trente jours. En vue très dézoomée, privilégier l’ouverture ou le zoom avant un déplacement précis des dates, pour éviter un glissement involontaire de plusieurs mois.

Maintenir d’abord la borne actuelle d’environ dix ans calendaires ; toute extension sera explicite et accompagnée de tests de performance. Essais attendus : changement d’année, février 2028, jalons, tâches longues, groupes repliés, filtres et navigation clavier.

## Ordre de réalisation proposé

Premier ensemble cohérent : fiche simplifiée, résultats cochables et deux préférences avancées. Deuxième : en-tête compact, recherche, filtres et densité du planning. Troisième : échelles Mois/Années et navigation pluriannuelle. Ces ensembles restent des tâches de la même progression en quatre phases.

| Phase | Travail et résultat attendu |
| --- | --- |
| Cadrage | Présente proposition et aperçu interactif fictif ; recueillir le retour du responsable avant réalisation. |
| Développement local | Réaliser les ensembles retenus, préserver les données historiques et vérifier les parcours simples/avancés et le calendrier. |
| Préproduction | Sauvegarde/restauration, candidat autorisé, recette sur fixtures et lecture des deux projets, puis validation humaine. |
| Mise en production | Autorisation distincte, contrôles après livraison, récupération et préparation de l’itération suivante. |

## Critères de revue

1. Le planning laisse une place dominante aux tâches ; les commandes occasionnelles n’occupent plus plusieurs bandes permanentes.
2. Un utilisateur peut rechercher une action, ouvrir la fiche, cocher un résultat et enregistrer sans lire une procédure.
3. Sans option avancée, preuve, vérificateur et date contrainte ne sont pas demandés. Les valeurs historiques et contraintes actives restent conservées et compréhensibles.
4. Tous les résultats cochés valident la section simple, pas le statut global ni la vérification avancée.
5. Masquer une colonne, filtrer, changer d’échelle ou de préférence ne modifie pas les données de planning.
6. Mois/Années restent lisibles sur plusieurs années, au clavier et sur écran étroit, sans construire une grille journalière démesurée.

## Réserves et décisions à venir

Le modèle de résultats multiples et la reprise sans migration sont définis dans la réalisation locale ci-dessus. La revue humaine du candidat et sa qualification hébergée restent à réaliser. Les échecs de publication automatique observés après #112 sont suivis séparément dans le [suivi du lot livré](../data/suivi-sujets-colonnes.json) ; aucune correction de secrets ou relance de publication n’est incluse ici.
