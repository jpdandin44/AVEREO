---
project: avereo-app-rapport
document_type: decisions
title: Decisions structurantes de Rapport AVEREO
status: active
version: git
created: 2026-09-10
updated: 2026-09-12
owner: jpdandin
tags:
  - rapport
  - decisions
  - architecture
---

# Decisions structurantes de Rapport AVEREO

## 2026-09-12 - Porter le fil Habitologie dans le protocole et les observations

### Contexte

Le fil `Eau -> Air -> Terre -> Feu` etait annonce dans le dossier mais ne
guidait pas encore les controles de l'etape `Protocoles` ni la saisie des
observations. La consultation des risques restait limitee a l'ouverture d'un
rapport externe.

### Decision

Conserver les cinq etapes de l'assistant et adapter uniquement `Visite Globale` :

- detailler dans `Protocoles` les controles successifs Eau, Air, Terre et Feu ;
- regrouper `Observations` dans le meme ordre et rattacher chaque constat a une
  phase et, facultativement, a un point de controle ;
- conserver toute observation historique non rattachee dans une zone
  `A classer` ;
- appeler directement l'endpoint public Georisques V1
  `resultats_rapport_risque` avec les seules coordonnees et afficher une
  synthese sourcee dans `Site` ;
- ne pas bloquer la synthese des risques lorsque la parcelle cadastrale n'est
  pas retournee par l'API Carto.

### Raisons principales

- faire du fil metier le guide concret de la visite ;
- reutiliser les fonctions de photos, dictee, brouillon et export deja en
  place ;
- eviter un jeton Georisques pendant le prototype ;
- ne pas inventer de classement lors de la lecture d'anciens dossiers.

### Consequences

Le payload JSON est enrichi sans rupture : nouveaux protocoles par phase,
phase et point de controle des observations, puis synthese Georisques
horodatee. L'indisponibilite d'une source externe reste explicite. Les
rapports techniques conservent leur protocole et leurs observations actuels.

## 2026-09-11 - Distinguer le type d'habitation du parcours d'analyse

### Contexte

La premiere modelisation de `Visite Globale` presentait `Eau`, `Air`, `Terre`
et `Feu` comme quatre sous-categories au choix. Cette representation contredit
le sens metier : ces quatre dimensions forment les etapes successives d'une
analyse globale coherente.

### Decision

Pour `Visite Globale`, utiliser le choix complementaire comme type
d'habitation : `Maison`, `Appartement`, `Immeuble collectif` ou
`Autre habitation`. Conserver `A preciser` tant que ce choix n'est pas fait.

Faire de `Eau -> Air -> Terre -> Feu` un parcours ordonne commun a chaque
visite globale. Conserver techniquement le champ `sous_categorie` pour le type
d'habitation pendant le prototype afin de ne pas modifier le schema de
sauvegarde.

### Raisons principales

- representer correctement le raisonnement Habitologie ;
- eviter qu'un dossier soit artificiellement limite a un seul element ;
- qualifier le bien avec une information utile au contexte de visite ;
- preserver la compatibilite du payload et de la base existants.

### Consequences

Les anciennes valeurs `Eau`, `Air`, `Terre` ou `Feu` utilisees comme
sous-categories sont normalisees vers `A preciser`, sans inventer un type
d'habitation. L'interface affiche le fil conducteur complet et l'export nomme
explicitement le type d'habitation. La decision de catalogue ci-dessous reste
historique mais sa consequence attribuant un seul element a une visite est
remplacee par la presente decision.

## 2026-09-11 - Integrer Ecoute dans l'etape Dossier existante

### Contexte

Le prototype doit rendre le workflow `Visite Globale` progressivement
utilisable sans dupliquer l'assistant Rapport ni figer des transitions encore
a arbitrer.

### Decision

Ajouter la premiere tranche `Ecoute client` dans l'etape `Dossier`, uniquement
pour la categorie `Visite Globale`. Conserver ses champs et accords dans un
objet JSON `ecoute` du payload existant. Reutiliser la dictee texte, le
brouillon, la sauvegarde serveur, l'import/export JSON et l'export Word.

Conditionner les commandes photo et dictee par leurs accords respectifs. Ne
pas conserver d'audio brut et ne pas ajouter de nouvelle table ou API.

### Raisons principales

- livrer rapidement un parcours observable et testable sur le terrain ;
- conserver un seul moteur et la compatibilite des anciens brouillons ;
- rendre les accords operationnels, et pas seulement informatifs ;
- eviter une migration MySQL pour des champs encore en phase de prototype.

### Consequences

Le rapport technique reste inchangé. Un dossier `Visite Globale` peut saisir
et exporter l'ecoute client ; l'absence de motif ou d'attentes produit une
alerte non bloquante. Les phases suivantes seront ajoutees progressivement
dans l'assistant existant.

## 2026-09-11 - Privilegier le prototype fonctionnel avant le TDD

### Contexte

Le produit doit d'abord permettre de valider rapidement les parcours metier et
l'utilite des fonctions Rapport. La strategie de tests destinee a un produit
commercialisable n'est pas encore definie.

### Decision

Pendant la phase de prototype, prioriser les evolutions fonctionnelles courtes
et demonstrables. Ne pas imposer le TDD comme condition de demarrage. Continuer
les controles existants et les validations manuelles proportionnees au risque.

Etudier le TDD, la couverture automatisee et les controles d'industrialisation
au moment de preparer la commercialisation.

### Raisons principales

- valider l'usage et le besoin avant d'investir dans un dispositif complet ;
- eviter de ralentir les iterations fonctionnelles du prototype ;
- ne pas figer trop tot une strategie ou un outillage de test ;
- conserver un niveau de verification coherent avec les risques actuels.

### Consequences

Les prochaines tranches sont pilotees par un resultat fonctionnel observable.
Les tests deja presents ne sont ni supprimes ni contournes. La strategie TDD
reste un sujet explicite de la future phase d'industrialisation.

## 2026-09-11 - Limiter le catalogue visible a deux parcours

> Statut : partiellement remplacee par la decision ci-dessus concernant le
> sens de la classification de `Visite Globale`.

### Contexte

La coexistence de plusieurs categories rend le demarrage du rapport moins
lisible alors que les travaux portent maintenant sur l'expertise technique et
la visite globale d'habitologie.

### Decision

Afficher uniquement `Expertise & Visite technique` et `Visite Globale` pour
une nouvelle creation. Conserver les autres definitions dans le catalogue du
code avec `selectable: false`, afin qu'elles restent compatibles avec les
anciens dossiers et reactivables comme modules complementaires.

La denomination `Visite Globale` remplace la denomination visible
`Rapport Habitologue`. Son futur workflow est documente comme proposition en
etude ; il n'est pas presente comme implemente.

### Raisons principales

- reduire les choix au perimetre fonctionnel actuellement prioritaire ;
- conserver un seul moteur de rapport et une seule structure de donnees ;
- ne pas supprimer les modules ni casser les brouillons historiques ;
- separer clairement l'interface actuelle du workflow encore a valider.

### Consequences

Les nouveaux rapports techniques utilisent quatre sous-categories. La
classification initiale des visites globales par element a ensuite ete
remplacee par un type d'habitation et un parcours ordonne couvrant les quatre
elements. Les anciennes classifications sont normalisees de maniere defensive.
La decision du 10 septembre ci-dessous est conservee comme historique et
remplacee uniquement sur la denomination et le catalogue visible.

## 2026-09-10 - Ajouter Rapport Habitologue comme type de dossier

### Contexte

Le demonstrateur technique doit rester utilisable tandis qu'un parcours client
plus simple est developpe progressivement.

### Decision

Conserver une seule application et un seul assistant. Remplacer la tuile
`Reception de travaux` par `Rapport Habitologue` pour les nouvelles creations.
Identifier ces dossiers avec le champ `categorie` deja sauvegarde dans la
charge JSON afin de pouvoir conditionner progressivement le workflow.

### Raisons principales

- eviter une nouvelle application, une nouvelle authentification et une nouvelle base ;
- reutiliser directement la navigation, le brouillon, les photos, la dictee,
  la sauvegarde et l'export existants ;
- eviter la duplication d'un second moteur de formulaire ;
- permettre des lots fonctionnels courts et reversibles.

### Consequences

Les brouillons historiques restent compatibles. `Reception de travaux` reste
reconnu en lecture mais disparait des choix de creation. Les prototypes
Habitologie precedents sont normalises vers `Rapport Habitologue`. Les
adaptations Habitologie sont ajoutees progressivement dans les etapes
existantes en fonction de la categorie.
