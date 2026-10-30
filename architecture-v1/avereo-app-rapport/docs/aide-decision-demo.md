---
project: avereo-app-rapport
document_type: functional-specification
title: Aide à la décision pour la démonstration du 3 novembre
status: active
version: git
created: 2026-10-30
updated: 2026-10-30
owner: jpdandin
tags: [rapport, demonstration, habitants, decision]
---

# Aide à la décision pour la démonstration du 3 novembre

## Objectif et périmètre

Relier les constats aux attentes des habitants, organiser les actions puis comparer
deux options dans le même dossier. Maison des Tilleuls et Maison Côte du Cricq
occupent des durées égales pendant la séance de 90 minutes du 3 novembre 2026.
L'horaire de cette nouvelle date reste à confirmer ; celui du 27 octobre n'est
pas reconduit implicitement.

Le [plan opérationnel](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/priorites-demo-philippe.md>) porte les dix attentes, les priorités et le calendrier.
Le suivi canonique est son voisin `suivi-chantier.json`, sous
`demo_v1_preparation_20261023.decisionSupport20261030`.

## Lot local

La Visite Globale reçoit une rubrique dans la dernière étape de l'assistant :

- contexte permanent des habitants, sensibilités, non négociables et tolérances déclarées ;
- attentes identifiées avec priorité et source ;
- projet distinct : objectif, budget déclaré, calendrier, délégation et DIY ;
- bilan reliant un constat existant à une ou plusieurs attentes, son effet et les vérifications ;
- actions identifiées, classées correctif / préventif / évolutif, avec liens, incontournables, préalables et explicatifs ;
- deux options sélectionnant les actions et décrivant leurs conséquences selon les mêmes critères ;
- arbitrage proposé, motif et prochaine étape, sans validation humaine implicite.

Critères communs : énergie (type et quantité si connus), matériaux, coût et
qualité d'usage, aides à vérifier, DIY/délégation, budget, calendrier, occupation
et incertitudes. Les cellules sont rédigées par le professionnel. Une valeur
absente reste « À évaluer » ; aucun score, prix, gain, aide ou diagnostic n'est
calculé. DELTA demeure à définir avec Philippe.

Le bloc structuré `decision` est conservé avec le JSON du rapport ; les notes
d'écoute existantes restent le verbatim de l'entretien. Aucune extraction
automatique du texte, nouvelle base ou intégration IA n'est nécessaire.

## Critères d'acceptation

1. Un ancien dossier reste lisible, sans fausses attentes ou options préremplies.
2. Une attente peut être reliée à un constat et une action ; les mêmes liens
   apparaissent dans l'aperçu et le Word expert.
3. Deux options présentent exactement les mêmes critères. Les inconnues sont
   visibles et une action incontournable omise est signalée.
4. Un identifiant devenu introuvable après suppression est signalé ; aucune
   référence n'est silencieusement assimilée à une autre.
5. Sauvegarde locale, rechargement et JSON conservent ces données sans altérer
   observations, photos, annexes ou les deux restitutions.
6. Le client reçoit une comparaison lisible ; le rapport expert conserve le
   raisonnement détaillé. Le DOCX est produit par le générateur existant.
7. Les entrées structurées sont contrôlées par l'API et échappées dans le HTML.
8. La sauvegarde/réouverture authentifiée est vérifiée sur le candidat `9a4f414`
   livré en préproduction le 30 octobre. Les preuves de l'ancien candidat
   `5d70e41` restent distinctes.

## Livraison et recette du 30 octobre

Le [point de reprise](reprise-demo-philippe.md) référence l’accord, la sauvegarde
fraîche des 28 fichiers et de la configuration privée, le retour arrière répété
sur copie privée et le reçu des six fichiers livrés. Aucun changement de base
ou de configuration pendant la livraison.

Les copies serveur `DEMO TILLEULS DECISION` et `DEMO CRICQ DECISION` sont créées
sans remplacer les rapports précédents. Une conséquence est modifiée à l’écran,
sauvegardée en ligne, retrouvée après réouverture depuis la liste puis dans le
JSON et les deux Word. Toutes les données importées restent identiques, sauf
cette modification volontaire. Quatre observations/trois images pour Tilleuls,
cinq/quatre et trois annexes pour Cricq. Les Word expert comptent 17/26 pages,
les synthèses client 5/7 pages. Pages modifiées et clients inspectés ; corps
inchangés des experts comparés pixel à pixel aux rendus déjà inspectés.

L’alerte d’incontournable omis est contrôlée puis la sélection restaurée. Les
protections anonymes restent actives et AVEREO conserve sa maintenance. La recette
porte sur le compte présenté, pas sur l’isolation entre deux comptes ni sur une
validation métier. [Preuve de recette](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/demo-decision-20261030/hosted-decision-recipe.json>).

## Contrôles locaux du 30 octobre

75 tests Node et 15 contrôles PHP réussis ; syntaxe API et build authentifié réussis.
Les deux cas ont été importés, modifiés, sauvegardés localement, rechargés et
exportés en JSON. Une omission d’action incontournable déclenche bien l’alerte.
Les Word expert sortent directement du générateur : Tilleuls 17 pages, Cricq
26 pages. Les 43 pages sont inspectées ; 66 et 74 textes du bloc structuré sont
retrouvés sans omission. Le HTML client est couvert par les tests ; son export
Word natif a depuis été relu pendant la recette ci-dessus. Le bundle conserve son avertissement de taille connu.

Preuves privées et empreintes : [reçu du contrôle](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/demo-decision-20261030/local-checks.json>).

## Deux cas et limites documentaires

Tilleuls : cas entièrement fictif. Le budget de scénario de 35 000 euros n'est
ni un devis ni un budget du Cricq. Cricq : reprise documentaire du dossier
existant ; budget, calendrier, délégation et tolérances non connus restent
explicitement non renseignés. Les propositions ne sont pas des choix validés
par les habitants. Les copies préparées restent privées et hors du dépôt.

## Quatre phases

| Phase | Travail et limite |
| --- | --- |
| Cadrage | Dix attentes réévaluées ; deux cas à parts égales ; critères ci-dessus. |
| Développement local | Rubriques, liens, actions, comparaison, JSON et Word ; contrôles existants et essais des deux cas. |
| Préproduction | `9a4f414` livré et recette des deux cas réalisée ; revue métier à recueillir. Le candidat précédent reste distinct. |
| Mise en production | Aucun accord ajouté par cette reprise ; maintenance et données conservées. |

Les fiches complètes de composants et de fin de vie, l'analyse hydrologique, le
calcul d'aides, le moteur énergétique et la transmission de mises en relation
restent hors de ce lot. Les points correspondants de la démo utilisent des
sources et compléments manuels explicitement identifiés.
