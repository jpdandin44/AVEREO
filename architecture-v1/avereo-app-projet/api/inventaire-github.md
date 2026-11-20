---
project: avereo-app-projet
document_type: integration-contract
title: Contrat de l’inventaire GitHub
status: active
version: git
created: 2026-11-20
updated: 2026-11-20
owner: jpdandin
tags: [github, inventaire, contrat, prive]
---

# Contrat de l’inventaire GitHub

## Configuration et intégration

Le registre privé peut activer `githubRefresh.discovery` avec
`{"enabled":true,"owner":"proprietaire"}`. Le publicateur permanent accepte le
même objet sous `githubDiscovery` ; son modèle reste désactivé par défaut. Le
mode existant de dépôts inscrits est conservé si cette option est absente ou
inactive. Seuls des GET sur `api.github.com` sont utilisés. L'accès existant est
réutilisé, sans nouvelle clé ni permission ; aucune valeur secrète n'est envoyée
au navigateur ou conservée dans ce dépôt public.

Entrées : registre d'applications et de suivis existants, ancien cache GitHub,
propriétaire, transport de lecture. Sorties : cache privé daté et catalogue
GitHub dans la projection signée. Les listes publiques du propriétaire et les
dépôts privés accessibles à l'identité sont réunis ; les résultats d'un autre
propriétaire sont exclus. Les dépôts privés non autorisés restent invisibles.

Le collecteur lit la branche par défaut réelle, toutes les branches et toutes
les PR retournées. Pour une PR ouverte, les fichiers modifiés servent seulement
au rattachement technique des périmètres ; une PR, son état ou sa CI ne crée
aucun accord. Les dépendances et sous-modules ne sont pas exécutés.

## Détection et conservation

Le détecteur examine les conteneurs de composants, manifestes, points d'entrée
et README associés à du code. Il conserve la racine du dépôt et les périmètres
inscrits encore présents. Dépendances, sorties générées, tests, exemples et modèles
sont exclus. Une catégorie dérivée des chemins reste une classification technique,
pas une qualification d'application active. Les composants d'autres branches et
les chemins historiques sont signalés. L'absence d'un ancien périmètre avec les
accès actuels ne supprime pas ses suivis.

L'identifiant connu du couple dépôt/chemin est conservé. Un nouveau périmètre
reçoit un identifiant stable dérivé de ce couple ; il apparaît sans suivi métier,
sans livraison déclarée et sans validation. Les caches d'arbres sont réutilisés par
dépôt, SHA immuable et version du détecteur. Un arbre récursif tronqué est reparcouru
par sous-arbres ou provoque un refus ; aucune réussite partielle n'est publiée.

## Projection consultable

Champ optionnel `githubSnapshot.inventory`, schéma `avereo-github-inventory`,
version 1. Les anciennes projections sans ce champ restent lisibles.

| Champ | Contenu |
| --- | --- |
| `owner`, `observedAt`, `coverage`, `limitations` | Propriétaire, date et portée explicite du relevé |
| `repositories` | Nom complet, visibilité, archive, branche par défaut, SHA, branches et liens des PR |
| `projects` | Identifiant, dépôt, chemin, catégorie, marqueurs, branches, présence dans la branche par défaut, SHA et lien épinglé |
| `pullRequests` | Numéro, titre, état ouvert/fermé/fusionné, brouillon, versions source/cible et lien GitHub |

Les lecteurs Node et PHP contrôlent types, bornes, identifiants, liens canoniques,
unicité et références croisées. Le cache d'arbres et le contenu des dépôts ne sont
pas exportés. Le navigateur propose les quatre listes, la recherche, un filtre
de dépôt, un filtre d'état des PR et une pagination de cinquante lignes.

## Limites et échecs

| Objet | Borne de refus |
| --- | --- |
| Dépôts visibles | 1 000 |
| Liste de branches ou de PR d'un dépôt | 100 pages de 100 ; l'absence de page terminale est refusée |
| Composants et cartes de catalogue | 5 000 |
| Métadonnées de PR exportées au total | 10 000 |
| Fichiers d'une PR ouverte | 3 000, concordance avec le total GitHub exigée |
| Exécutions de CI pour une tête ouverte | 1 000 avec page terminale exigée |
| Arbre Git | 100 000 entrées ; 2 000 sous-arbres au maximum en repli |
| Cache GitHub privé | 16 Mio |
| Projection signée | 32 Mio, limite existante |

Une borne atteinte sans preuve de liste terminée, un défaut réseau, une réponse
invalide ou une modification concurrente de la branche par défaut ou d’une PR ouverte provoque un
échec. L'ancien cache et la dernière projection valide sont préservés. Le
publicateur enregistre son état d'échec signé ; les dates des preuves et suivis
ne sont pas rajeunies. Un cycle sans changement sémantique n'ajoute pas de
publication. Aucun relais PC n'est activé.

[Qualification et quatre phases](../docs/inventaire-github.md).
