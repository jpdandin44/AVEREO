---
project: avereo-app-rapport
document_type: functional-specification
title: Aide à la décision pour la démonstration du 3 novembre
status: active
version: git
created: 2026-10-30
updated: 2026-11-02
owner: jpdandin
tags: [rapport, demonstration, habitants, decision]
---

## Saisie vocale et enregistrement explicite des attentes

Demande du 2 novembre à partir de deux captures de la rubrique 1 : accès à la dictée dans les champs de Validation et export, plus un bouton d'enregistrement de chaque attente. Candidat local fondé sur `59a38c9` pour conserver la carte RGA/cadastre installée ; branche `feat/rapport-dictee-attentes-20261102`. Le suivi canonique porte `finalisation20261102.exportInput20261102`. Aucun déploiement n'est attesté pour cet ajout.

### Comportement

- Les champs de texte des six rubriques d'aide à la décision reçoivent un bouton micro. Les notes de synthèse client, les titres/légendes/sources des pièces et le nom du signataire disposent du même accès. Analyse et recommandations conservent la dictée existante.
- La dictée de Visite Globale requiert l'accord déjà prévu dans Dossier ; aucun accord n'est coché par cette évolution. Le retrait de l'accord ou la sortie d'un champ arrête son écoute. Un accès au microphone encore en attente ne peut pas relancer l'écoute après démontage ou retrait de l'accord.
- Le texte final reconnu est ajouté au contenu courant, sans écraser la saisie manuelle. Les limites de longueur restent applicables ; un ancien texte importé déjà plus long est conservé intégralement.
- Une liste, un choix d'action ou une case reste une commande structurée : aucun texte vocal ne modifie automatiquement un choix ou un consentement. La signature graphique reste distincte du nom dicté.
- « Enregistrer cette attente » utilise le stockage du brouillon existant : le dossier courant entier est enregistré, avec les attentes et leurs références. Il ne crée pas de catalogue d'attentes réutilisables ni de nouvelle validation métier.
- La confirmation précise « dans le brouillon de ce navigateur ». La copie serveur reste l'action distincte « Sauver en ligne ». Les saisies continuent aussi d'alimenter le brouillon automatique.
- Une erreur de stockage affiche un message d'échec et conserve la saisie à l'écran ; aucun succès n'est annoncé sur rejet. Une modification saisie pendant la fin d'un enregistrement n'est pas remplacée par une ancienne copie.

### Qualification locale et limites

Essais des copies locales Tilleuls et Cricq, sans écriture serveur. Ajouts vocaux simulés dans attentes, projet, liens, actions, options, arbitrage, synthèse client et légende de pièce ; accord absent puis présent, et retrait pendant l'écoute contrôlés. Sauvegarde explicite puis rechargement/reprise des attentes retrouvés sur les deux cas. Échec de sauvegarde simulé : message d'erreur, texte conservé, aucune fausse confirmation. La simulation n'utilise aucun microphone ou service de transcription réel.

Deux DOCX de recette Cricq sont produits par le générateur local : archives ZIP/XML valides, attente modifiée présente dans les deux restitutions et complément vocal présent dans l'expert. Cela ne constitue pas une nouvelle inspection visuelle de leurs pages. Les quatre Word de présentation privés ne sont pas remplacés.

Restent à qualifier : microphone réel et disponibilité du service vocal dans le navigateur de démonstration, puis installation autorisée et recette authentifiée en préproduction. Une simulation de voix ne constitue pas une validation matérielle. Si le navigateur ne prend pas en charge la dictée, la saisie manuelle reste disponible et le message existant oriente vers Chrome, Edge ou Windows + H.

| Phase | État de cet ajout |
| --- | --- |
| Cadrage | Demande, portée et distinction brouillon/serveur établies. |
| Développement local | Implémentation et contrôles locaux ; candidat et PR à relire dans le suivi canonique. |
| Préproduction | Installation et recette du nouveau candidat en attente d'accord exact, sauvegarde/restauration et vérifications sur les deux maisons. |
| Mise en production | Non engagée ; aucun accord de production ni merge ajouté. |



# Aide à la décision pour la démonstration du 3 novembre

## Objectif et périmètre

Relier les constats aux attentes des habitants, organiser les actions puis comparer
deux options dans le même dossier. Maison des Tilleuls et Maison Côte du Cricq
occupent des durées égales pendant la séance de 90 minutes du 3 novembre 2026.
Le créneau est confirmé le 2 novembre : 9 h 30 à 11 h, heure de Paris.

Le [plan opérationnel](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/priorites-demo-philippe.md>) porte les dix attentes, les priorités et le calendrier.
Le suivi canonique est son voisin `suivi-chantier.json`, sous
`demo_v1_preparation_20261023.decisionSupport20261030`.

## Corrections du 1er novembre

La reprise autorisée traite les trois priorités issues de la recette du jour et le message photo/dictée :

- **A01** : retirer les mentions de contrôle du 30 octobre et d'essai utilisateur des calendriers de présentation. Les archives de recette restent intactes.
- **A02** : enrichir les deux profils privés avec une lecture du végétal et des eaux, six fiches de composants et une demande manuelle de mise en relation. Chaque fiche décrit nature, âge ou époque connue, état apparent, inconnues, vérifications et source. Aucune durée résiduelle calculée.
- **A03** : renommer l'indicateur « Complétude de saisie » et expliquer ses limites, y compris à 100 %. La revue métier et l'accord des habitants ne sont jamais déduits du pourcentage.
- **A04** : distinguer photo/caméra et dictée dans le message selon les accords existants. Aucun accord n'est ajouté pour activer une capacité.

Tilleuls reste fictif, sans rattachement réglementaire ou géographique réel. Cricq reste une reprise du dossier du 27 août, sans nouvelle visite : les pages publiques GPU et mairie sont consultées le 1er novembre ; le PLU présenté comme actuel est distingué du projet arrêté en 2026. Les exemples sur les eaux et plantations sont conditionnels à la confirmation de la zone et de la version applicable. La zone parcellaire, le périmètre patrimonial et les risques actuels ne sont pas certifiés par cette préparation.

Sources de référence privées : `Habitologue/Opportunité_Connect/data/decision-demo/*-decision.json` ; registre daté `sources/preparation-demo-20261101/sources.json`. Les fichiers de présentation conservent les identifiants des deux copies serveur, observations, photos, annexes et écoute. Toute application doit partir d'une nouvelle exportation serveur pour éviter d'écraser une modification intervenue depuis la recette.

75 tests Node, build authentifié et CI réussis ; matrice locale des quatre accords et rappel à 100 % contrôlés. Le candidat `9ce22fd` est livré en préproduction après sauvegarde de 31 fichiers et de la configuration, puis installation/restauration répétée sur copie privée. Deux fichiers frontend sont livrés, 30 autres conservés ; l'arbre de 32 fichiers, la configuration et les trois ressources publiques sont vérifiés. Aucun changement d'API ou de schéma.

Après export serveur frais, les deux copies DEMO reçoivent les seuls compléments prévus, puis sont sauvées et rouvertes depuis la liste. Leurs JSON sont exactement ceux préparés, écoute, accords, observations, photos et annexes compris. Les quatre Word sont téléchargés directement du générateur hébergé : 17/5 pages Tilleuls et 27/7 Cricq. Leurs 56 pages sont rendues et identiques pixel à pixel aux préparations déjà relues ; les fichiers restent sans retouche DOCX. [Registre et livrables](<C:/Users/examg/Documents local/Habitologue/Opportunité_Connect/cas-demonstration-maisons.md>) · [Recette du candidat](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/demo-corrections-20261101/hosted-recipe.json>).

La session applicative dure 30 minutes. Une relance depuis CONNECT est contrôlée pendant les essais ; la prévoir avant chaque maison pour la séance de 90 minutes. Aucun réglage d'authentification n'est modifié. La revue métier, DELTA, l'horaire et l'isolation entre deux comptes restent à qualifier.

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
calculé. La fiche DELTA fournie le 2 novembre définit T = D / E et L > T ; les données des maisons restent à instruire et aucun calculateur natif n’est ajouté.

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
8. La sauvegarde/réouverture authentifiée est vérifiée sur `9ce22fd`, livré
   le 1er novembre. Les preuves de `9a4f414` du 30 octobre et de `5d70e41`
   restent distinctes.

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
