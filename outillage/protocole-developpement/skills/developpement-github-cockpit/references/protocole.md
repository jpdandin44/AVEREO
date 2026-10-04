---
project: protocole-developpement
document_type: workflow
title: Protocole commun en quatre phases
status: active
version: git
created: 2026-10-03
updated: 2026-10-04
owner: jpdandin
tags: [developpement, github, cockpit]
---

# Protocole commun

**Une itération = un objectif, un périmètre, un candidat vérifié et un suivi dans le cockpit.** Le cycle reste le même pour un site, une application ou un agent. Les contrôles techniques s'adaptent au projet.

## Les quatre phases

| Étape | Travail | Condition de passage | Mise à jour du cockpit |
| --- | --- | --- | --- |
| 0. Cadrage | Examiner l’existant, fixer l’objectif, le périmètre, les critères, les responsables et les ressources. | Sources et limites identifiées ; inconnues et accords nécessaires consignés. | Objectif, exigences, décisions existantes, risques et tâches du lot. |
| 1. Développement local | Développer, essayer, ajuster, corriger et documenter. | Contrôles locaux et CI pertinents réussis ; PR et candidat identifiés ; cible de préproduction prête et accord applicable. | Objectif, branche, PR, candidat, tests, réserves et prochaine action. |
| 2. Préproduction | Installer le candidat sur une cible isolée, tester le comportement réel et corriger. | Recette réelle réussie sur la version retenue ; validation humaine, version acceptée pour livraison et préparation de production complète. | URL/cible, candidat installé, preuves de recette, corrections, validation et sauvegarde/retour arrière. |
| 3. Mise en production | Livrer la version autorisée, contrôler le résultat et traiter les incidents. | Contrôles de production réussis ou incident explicitement pris en charge ; bilan et suite conservés. | Version effectivement livrée, reçu, contrôles réels, retour arrière, réserves et prochaine itération. |

Un échec revient à la correction de l'étape concernée. Une correction du code en préproduction est enregistrée dans la branche, contrôlée localement, poussée dans la PR puis réinstallée ; éviter les correctifs serveur sans source et sans trace.

## Avant de commencer

1. Lire les instructions et documents du dépôt ; inspecter les changements existants et la dernière observation GitHub.
2. Fixer l'objectif, les critères observables, le périmètre, le responsable et le budget. Réutiliser les accords déjà acquis ; demander les inconnues qui conditionnent réellement une action.
3. Rattacher le lot au cockpit canonique. Réutiliser son journal ; conserver les phases et preuves antérieures. Une absence de cockpit ou de cible se consigne comme inconnue, pas comme réussite.
4. Identifier les commandes réellement disponibles pour tester, construire et livrer. Préparer les trois cibles et le plan de récupération avant les écritures distantes.

## 0 — Cadrage

Appliquer les vérifications ci-dessus. Le [modèle des quatre phases](../assets/phase-model.json) donne leurs identifiants communs. Un ancien découpage est conservé dans un instantané avec son mapping. Ses décisions et preuves restent attachées à leur périmètre original ; le regroupement ne les étend pas. Conserver les libellés obligatoires des checklists et les brouillons personnels.

Le suivi Passeport consulté le 4 octobre comporte encore six phases spécifiques. Il constitue une référence de fonctionnement ; il n’établit pas que les quatre libellés communs étaient déjà installés dans cette application. La règle nouvelle regroupe reprise, réalisation et intégration dans Cadrage ou Développement local selon leur effet ; recette hébergée dans Préproduction ; livraison, observation et transfert dans Mise en production.

## 1 — Développement local

Travailler sur une branche dédiée au lot, à partir de l'état Git pertinent. Préserver les autres applications et les travaux de l'utilisateur. Faire les corrections dans la source, exécuter les contrôles proportionnés et actualiser la documentation.

Créer ou actualiser une seule PR du même périmètre avec le template du dépôt. Y relier l'environnement de validation, le diff, les preuves et les risques. Une PR en brouillon porte une préparation incomplète ; elle devient prête à examiner quand le lot et ses preuves sont prêts. Les cases et approbations humaines restent au responsable.

Conserver le SHA source, l'empreinte de l'artefact et les liens des exécutions CI. GitHub vérifie le code ; une CI verte ne prouve pas l'état hébergé.

**Passage vers préproduction :** contrôles locaux/CI/documentaires réussis sur ce candidat, cible exacte isolée et prête, accord de préproduction applicable, récupération prévue. Si la cible contient un état à conserver, sauvegarder et tester la restauration avant remplacement. Pour une cible neuve, vérifier qu'elle est vide et isolée.

## 2 — Préproduction

Installer le candidat identifié, contrôler son empreinte et enregistrer le reçu. Conserver l'isolement, les transports de messages de test et les données adaptées au contexte. Ne pas importer les comptes, secrets ou données sensibles de production par commodité.

Tester le résultat réel : chargement, parcours utiles, droits, données et interactions avec les services nécessaires. Les captures et le rendu navigateur portent sur cette cible, en précisant bureau/mobile si utile. Pour un agent, vérifier les évaluations, outils, effets externes et plafonds ; une simulation d'outil reste une preuve distincte d'une action réelle.

Lors d'une correction, retourner à la source locale, mettre à jour la PR et recommencer la recette concernée. Conserver les anciens reçus comme historiques.

Le responsable examine le candidat final et ses réserves. Vérifier la PR et la validation réellement enregistrées. Le merge reste humain selon les règles du dépôt et peut intervenir avant ou après la recette, selon son modèle de déploiement. Si son résultat change le contenu ou l'artefact, qualifier le nouveau candidat ; ne pas réutiliser les preuves d'une ancienne version.

**Passage vers production :** recette du candidat retenu réussie, revue humaine et acceptation GitHub établies, accord explicite pour sa cible et son effet, sauvegarde fraîche et restauration contrôlée, retour arrière qualifié et contrôles après livraison prêts. Livraison en maintenance et ouverture publique sont deux effets distincts.

## 3 — Mise en production

Préparer d'abord un résultat concret à examiner : version, contenu livré, cible, effet public, risques connus, sauvegarde, restauration et retour arrière. Demander l'accord qui manque seulement à ce point ; un accord déjà acquis pour ces mêmes paramètres n'est pas redemandé par routine.

Relire les prérequis à l'exécution, notamment les modifications ou données reçues depuis la qualification. Livrer l'artefact contrôlé avec l'outil du dépôt. Conserver le reçu et vérifier le comportement réel de production : disponibilité attendue, version, parcours critiques, données et erreurs. Pour un agent, vérifier aussi son exécution et ses effets réellement autorisés.

En cas d'incident, suspendre l'action en cause, préserver les données récentes et appliquer le retour arrière autorisé. Un retour arrière de code ne justifie pas l'écrasement d'une base complète. Enregistrer le résultat, les limites et la suite nécessaire.

Clore l'itération avec les preuves, réserves, documentation et décision de clôture prévues dans le projet. Créer le backlog de la prochaine itération sans transformer des idées en engagements. Son nouveau périmètre et son candidat ont leur propre revue.

## GitHub et cockpit

GitHub porte les branches, PR, SHA, contrôles CI et reçus de workflows. Le cockpit porte le pilotage : étape réelle, responsable, prochaine action, blocages, décisions et liens de preuve. Le [contrat du cockpit](cockpit.md) précise les informations communes.

Les règles d'environnement GitHub doivent être vérifiées sur chaque dépôt : leur simple mention dans un YAML n'établit pas qu'un approbateur ou une protection est configuré. La disponibilité de certaines protections dépend du dépôt et de l'offre GitHub. Un déploiement de production ne doit pas partir de tout push sans son mécanisme d'accord prévu ; qualifier la configuration réelle avant usage.

Aucun service de surveillance n'est installé par ce protocole. Rafraîchir GitHub aux passages et indiquer la date de dernière observation ; une synchronisation continue nécessite une réalisation et une autorisation distinctes.

## Contrôles adaptés

| Type | Contrôles usuels à adapter au risque |
| --- | --- |
| Site | Pages et formulaires, images/styles, bureau/mobile, administration, conservation des contenus et sauvegarde/restauration. |
| Application | Tests métier, build, droits, stockage/migrations, parcours critiques, version de l'artefact et services réels. |
| Agent | Évaluations reproductibles, outils et permissions, données, effets externes, limites d'exécution, version prompts/configuration/modèle et retour à la version précédente. |

Ces exemples ne remplacent pas les règles locales. Un champ non applicable doit être motivé ; un contrôle manquant reste un blocage du passage qui en dépend.

## Références de mise en œuvre

- [Contrat et contrôleur du cockpit](cockpit.md).
- [Documentation officielle — skills](https://learn.chatgpt.com/docs/build-skills), [instructions globales](https://learn.chatgpt.com/docs/agent-configuration/agents-md).
- [GitHub — environnements de déploiement](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).

Les choix de cycle et d'accords ci-dessus proviennent du responsable ; ces documentations expliquent les mécanismes des outils.
