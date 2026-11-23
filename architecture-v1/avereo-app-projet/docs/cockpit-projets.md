---
project: avereo-app-projet
document_type: feature-contract
title: Cockpit — fiches de projets et première préproduction
status: active
version: git
created: 2026-11-23
updated: 2026-11-23
owner: jpdandin
tags: [cockpit, projets, catalogue, preproduction, lecture-seule]
---

# Fiches de projets

## Sélection initiale

Le responsable a accepté douze fiches principales, le visuel existant et une recette
humaine différée : CONNECT, Rapport, Passeport Immo, Projet, Coupe, Thermo, Drone,
Recherche web, Saisie unique / dossier Erim, Site AVEREO, TC Longages et Vision.
Cette sélection initiale est conservée indépendamment de la présence d’un reçu de
préproduction. Elle n’atteste aucune installation : Vision reste explicitement en
cadrage et ses badges ne sont pas mis au vert.

Le [catalogue JSON](../data/cockpit-projects.json) est la source de la sélection,
des alias et des périmètres de code. Les cartes, couleurs, badges et styles existants
sont conservés. Le filtre **Historique des prototypes** regroupe `prototype-v1`, son
sous-dossier `v1` et `avereo-v1-base` dans une seule fiche Prototype AVEREO V1.
Ce filtre ne modifie ni les branches Git ni les statuts des suivis.

RGA apparaît dans Rapport, avec ses sources et suivis conservés. Le planning et le
cockpit restent dans Projet. La recherche prend aussi en compte les noms et chemins
des éléments rattachés ; rechercher RGA permet donc de retrouver Rapport.

## Applications ajoutées ultérieurement

Douze est le point de départ, pas une limite de capacité. Une application, un site
ou un prototype d’application reconnu peut être ajouté après son **premier passage
documenté en préproduction**, dès que ce reçu est présent dans les sources publiées
du cockpit. Une application encore en développement reste dans l’inventaire GitHub.

L’admission lit les déclarations existantes et leur qualification de même version
et cible : environnement préproduction, version source ou artefact, cible,
référence et date de livraison, contrôle hébergé documenté avec référence et date.
Une CI verte, une phase cochée, une production seule ou une livraison non contrôlée
ne suffisent pas. Un reçu incomplet reste insuffisant.

Un ancien passage qualifié reste admissible même si un lot plus récent n’est pas
encore qualifié. Pour un lot commun, les applications couvertes doivent être
explicites ; une déclaration sans périmètre applicatif n’admet pas un autre produit.
Un reçu d’itération rattachée à une seule application peut qualifier celle-ci.
Les marqueurs du dépôt et le reçu sont tous deux requis pour une racine de dépôt
autonome. Les composants, intégrations, outils, copies et automatisations ne créent
pas de fiche autonome. Un cas ambigu peut être classé explicitement dans le catalogue.

Les sous-composants d’un nouveau projet admis sont regroupés dans sa fiche. Le reçu
historique qui justifie son admission doit rester conservé dans les sources publiées.
Cette règle ne collecte pas de nouveaux fichiers privés du PC et ne fabrique aucun
reçu depuis GitHub.

## Conservation des données et navigation

`project-portfolio.mjs` calcule seulement une vue : les objets source, identifiants,
phases, critères, pièces et décisions restent inchangés. Les itérations sont
dédupliquées par identifiant avant les comptes existants de qualité. Les historiques
de suivi restent consultables dans les fiches, indépendamment du filtre des anciens
prototypes.

Les sélecteurs de projet et le Gantt utilisent les mêmes rattachements. Ouvrir RGA
depuis l’inventaire mène à Rapport en conservant l’itération RGA demandée. Une source
pas encore admise peut toujours être examinée depuis l’inventaire complet ; cela ne
l’ajoute pas aux cartes principales.

L’API, la projection signée et le publicateur continuent de conserver l’inventaire
complet. L’accès propriétaire/global, la consultation seule et le planning client
ne changent pas. Le [contrat de collecte](../api/inventaire-github.md) reste applicable.

## Vérifications

Les tests couvrent douze fiches à partir d’un inventaire de 58 éléments fictifs,
l’historique regroupé, les sous-composants, RGA et les comptes sans doublon, les
conditions positives et négatives du premier passage, les reçus historiques et le
périmètre des lots communs. Les tests d’interface conservent les contrôles de session
et d’effacement des données lors d’un refus.

Commande depuis `frontend/` : `node --test --test-concurrency=1 ../tests/*.test.mjs`.
415 tests applicatifs réussis lors de la qualification locale. L’aperçu de navigateur
utilise des identités, versions et reçus fictifs ; il ne vaut pas recette hébergée.
Le parcours vérifié couvre la recherche RGA, l’ouverture de son itération dans
Rapport, l’historique regroupé, l’inventaire complet et le passage de douze à treize
fiches après publication d’un premier reçu fictif qualifié. Aucun avertissement ou
erreur de console n’a été relevé sur ce parcours. Le classement appliqué au relevé
hébergé déjà conservé rattache ses 58 éléments : 48 aux fiches principales, trois
à l’historique et sept à l’inventaire technique seul. Ce contrôle sur copie datée
ne constitue pas une nouvelle observation de l’hébergement.
Les résultats exacts et le candidat sont rattachés au suivi opérationnel privé.

## Quatre phases

| Phase | État de ce lot |
| --- | --- |
| Cadrage | Périmètre accepté ; nouvelle admission après première préproduction qualifiée. |
| Développement local | Implémentation et contrôles locaux ; PR de préparation. |
| Préproduction | Nouveau candidat non installé par ce changement de source ; accord et contrôles propres à conserver. Recette humaine différée. |
| Mise en production | Non engagée et non autorisée pour ce lot. |

Les tests et la compilation ne cochent aucune validation humaine. Les reçus du
candidat antérieur ne sont pas réattribués à cette évolution.
