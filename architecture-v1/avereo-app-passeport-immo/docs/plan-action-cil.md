---
project: avereo-app-passeport-immo
document_type: action-plan
title: Plan de développement du CIL dans Passeport Immo
status: active
version: git
created: 2026-10-16
updated: 2026-10-16
owner: jpdandin
tags: [cil, plan-action, produit, documents, production]
---

# Plan de développement du CIL dans Passeport Immo

Évolutions fonctionnelles et poursuite de la version actuelle

**AVEREO | Document de travail proposé au responsable du projet | 16 octobre 2026**

## Objectif et décision proposée

Faire évoluer Passeport Immo en un service permettant de constituer, vérifier,
mettre à jour et remettre un carnet d’information du logement complet pour les
éléments applicables à chaque bien. La mise en production de la version actuelle
se poursuit avec son candidat déjà examiné. Les nouvelles fonctions CIL auront
leur propre périmètre, leur recette et leur décision de livraison.

Le présent document prépare les actions et les arbitrages. Il ne valide pas un
dossier client, ne certifie pas une performance énergétique et n’autorise pas à
présenter AVEREO comme service agréé par l’État. Les sources officielles et le
comparatif de départ figurent en fin de document.

## Situation de départ

La version examinée dispose de biens et clients associés, du stockage privé des
documents, de leur consultation et téléchargement, de catégories, du dédoublonnage,
des archives et de sauvegardes automatiques en préproduction. Le cas SCI sert de
premier dossier concret. Les estimations et le PDF de devis restent disponibles.

Les principaux écarts CIL sont le guidage selon les travaux concernés, les
caractéristiques techniques et leurs justificatifs, la vérification des pièces,
l’export complet et la transmission du carnet. Le nombre de PDF conservés ne
permet pas, à lui seul, de déclarer un dossier complet.

## Deux travaux coordonnés

| Travail | Résultat attendu | Règle de conduite |
|---|---|---|
| Version actuelle | Livraison du candidat autorisé, reprise SCI et fonctionnement vérifiés sur la cible réelle | Conserver les octets du candidat examiné et satisfaire les prérequis techniques de production |
| Évolution CIL | Carnet guidé, vérifiable et transmissible, avec une recette représentative | Concevoir et développer dans un lot distinct ; aucune modification CIL ajoutée à la livraison courante |

Le cycle reste **Cadrage → Développement local → Préproduction → Mise en production**.
La préproduction est l’environnement de revue des phases Préproduction et Mise en
production ; les contrôles après livraison portent sur la production réelle.

<!-- pagebreak -->

## Programme des actions

Les priorités désignent le périmètre proposé. **P0** est nécessaire pour proposer
le service CIL visé. **P1** améliore l’usage après le premier périmètre maîtrisé.
Une pièce obligatoire dans un cas donné reste nécessaire, même si sa présentation
est simple ; une pièce non applicable n’est pas artificiellement exigée.

| Code | Action | Priorité | Prérequis principaux |
|---|---|---|---|
| CIL01 | Déterminer le contenu applicable et le cadre de prestation | P0 | Comparatif et sources officielles |
| CIL02 | Définir les données et le cycle de vie du carnet | P0 | CIL01 |
| CIL03 | Organiser les documents et leur provenance | P0 | CIL02 et stockage actuel |
| CIL04 | Suivre les travaux réalisés et leurs preuves | P0 | CIL02 et CIL03 |
| CIL05 | Décrire isolants et menuiseries concernés | P0 | CIL04 |
| CIL06 | Décrire équipements et notices | P0 | CIL04 |
| CIL07 | Gérer les documents de performance énergétique | P0 | CIL03 |
| CIL08 | Qualifier plans et réseaux | P0 selon le cas | CIL01 et CIL03 |
| CIL09 | Vérifier la complétude et les réserves | P0 | CIL04 à CIL08 |
| CIL10 | Exporter un dossier complet et portable | P0 | CIL03 et CIL09 |
| CIL11 | Organiser les accès et la transmission | P0 | CIL02 et CIL10 |
| CIL12 | Cadrer confidentialité et conservation | P0 | CIL01 et CIL02 |
| CIL13 | Recetter les parcours et la récupération | P0 | Tous les parcours retenus |
| CIL14 | Préparer la prestation et les documents AVEREO | P0 | CIL01 et CIL09 à CIL13 |

Les rappels d’entretien, l’OCR assisté, les imports automatiques depuis des tiers
et les statistiques avancées relèvent de **P1**. L’absence d’OCR ou de connexion à
un opérateur externe ne doit pas empêcher de constituer le carnet avec des pièces
déposées manuellement. Les accès à un tiers feront l’objet d’un examen séparé.

## Ordre de réalisation

Commencer par CIL01 et CIL02, puis établir le dossier documentaire commun avec
CIL03. Les fiches travaux, matériaux, équipements, performance et plans peuvent
ensuite avancer en parallèle sur le même modèle. La vérification CIL09 alimente
l’export CIL10 ; les accès et la transmission CIL11 se construisent autour de
cette remise. Confidentialité et tests accompagnent ces travaux dès le début.

Le budget, la capacité disponible et les dates ne sont pas établis. Ils seront
estimés après validation du cadrage et découpage du premier lot. Ce plan fixe
des dépendances et des critères observables ; il ne crée pas un calendrier ferme.

<!-- pagebreak -->

## Cadre et données

### CIL01 Déterminer le contenu applicable

**Travail.** Distinguer construction neuve, rénovation énergétique et constitution
volontaire. Recueillir les dates utiles d’autorisation, d’acceptation du devis et
de début des travaux, ainsi que les catégories d’intervention concernées. Définir
une liste conditionnelle des informations et pièces attendues. Le propriétaire
ou l’intervenant compétent confirme les faits ; l’outil indique une règle et sa
source, sans conclure à partir de données absentes.

**Livrable.** Matrice des cas et règles documentées, avec les justificatifs utiles
et le traitement des situations incertaines. Le numéro fiscal suggéré par le
modèle ministériel ne devient pas une obligation générale inventée par l’application.

**Acceptation.** Un cas neuf, un cas de rénovation et un cas volontaire conduisent
aux pièces adaptées ; une date inconnue ou une situation ambiguë reste à examiner.

### CIL02 Définir les données du carnet

**Travail.** Relier un carnet à un logement stable, à ses propriétaires et aux
personnes mandatées. Séparer le propriétaire juridique du bien du compte CONNECT
qui travaille sur son dossier. Modéliser les opérations, pièces, produits,
équipements, versions et remises ; conserver les dates et les sources.

**Livrable.** Modèle de données, règles d’accès et contrat d’API. Prévoir une
migration additive qui conserve les identifiants et documents existants, les
archives et le fonctionnement des estimations. La structure proposée est une
aide d’organisation ; la réglementation n’impose pas cette architecture technique.

**Acceptation.** Les dossiers actuels s’ouvrent après migration ; aucun rattachement
de client, document ou compte ne change sans correspondance explicite. Une
récupération de l’état antérieur est testée sur une copie isolée.

### CIL03 Organiser les documents

**Travail.** Conserver les catégories actuelles et ajouter les types CIL, la date
du document, son auteur ou organisme émetteur, son lien aux travaux et sa portée.
Distinguer original reçu, copie lisible, version remplacée et document historique.
Pour un scan retourné ou remis en ordre, garder l’original et tracer le dérivé.

**Livrable.** Classement, métadonnées et recherche par opération ou type de pièce.
Les fichiers restent privés ; limites de taille, intégrité et dédoublonnage sont
préservés. Le changement d’une métadonnée ne modifie pas les octets d’un original.

**Acceptation.** Import, classement, recherche, lecture, téléchargement, doublon,
archivage et restauration réussissent. Les liens et empreintes d’origine restent
cohérents après un remplacement de pièce ou une correction d’affichage.

<!-- pagebreak -->

## Travaux et caractéristiques techniques

### CIL04 Suivre les travaux réalisés

**Travail.** Séparer estimation, projet, travaux réalisés et réception. Saisir
dates, description, lots concernés, professionnel et justificatifs reçus. Relier
factures et fiches techniques à l’opération correspondante ; conserver les réserves.

**Livrable.** Fiche d’opération et chronologie du logement, avec preuves liées.
**Acceptation.** Un devis seul ne devient pas automatiquement un travail réalisé ;
une opération achevée expose sa date et ses pièces, ou signale ce qui manque.

### CIL05 Décrire les matériaux concernés

**Travail.** Pour les interventions applicables, renseigner isolants, menuiseries
et éléments concernés : marque, référence, caractéristiques thermiques, épaisseur,
surface et traitement des interfaces selon le cas. Relier chaque donnée à une
fiche produit, un document de pose ou un justificatif du professionnel.

**Livrable.** Fiches matériaux associées aux travaux et aux parois. **Acceptation.**
Les valeurs inconnues restent inconnues ; aucune performance n’est déduite d’une
photographie ou d’un nom commercial imprécis. Les données saisies et leurs unités
restent visibles dans la remise du carnet.

### CIL06 Décrire les équipements et notices

**Travail.** Identifier chauffage, eau chaude sanitaire, refroidissement et
ventilation concernés. Rassembler marque, modèle, énergie, caractéristiques utiles
et notices de fonctionnement, maintenance et entretien. Conserver les pièces
d’entretien complémentaires sans les déclarer toutes obligatoires au titre du CIL.

**Livrable.** Fiche équipement et pièces associées. **Acceptation.** L’utilisateur
retrouve une notice depuis l’équipement ; un système absent ou non concerné ne
génère pas une pièce manquante. Les rappels automatiques constituent un complément P1.

### CIL07 Qualifier les documents énergétiques

**Travail.** Classer DPE, audit, attestations réglementaires et labels lorsqu’ils
sont établis. Conserver date, émetteur, périmètre et durée de validité applicable.
Identifier séparément les références historiques et les documents utilisables.

**Livrable.** Registre des documents énergétiques et signalement des réserves.
**Acceptation.** Le DPE source du dossier concret, daté de 2012, reste historique
et n’est pas présenté comme valide en 2026. Passeport Immo n’invente ni diagnostic,
ni label, ni qualification professionnelle à partir des pièces déposées.

<!-- pagebreak -->

## Plans vérification et export

### CIL08 Qualifier les plans et réseaux

**Travail.** Prévoir plans de surface, coupes et documents des réseaux d’eau,
d’électricité, de gaz et d’aération lorsque requis, notamment dans le neuf.
Indiquer conception ou exécution pour les documents concernés. Conserver auteur,
date, révision, échelle connue et statut des mesures ou hypothèses.

**Livrable.** Registre des plans avec couverture des réseaux applicables. Les
exports de Coupe peuvent être joints avec leur provenance. Une coupe de principe
avant et après travaux reste distincte d’un relevé ou d’un plan d’exécution.

**Acceptation.** Un plan manquant n’est pas remplacé silencieusement par une
esquisse. Les informations inconnues sur les volumes voisins, le chauffage, les
épaisseurs ou l’altimétrie restent signalées tant qu’elles ne sont pas vérifiées.

### CIL09 Vérifier la complétude

**Travail.** Afficher les exigences applicables et quatre états lisibles : présent
à vérifier, vérifié, manquant, non applicable avec motif. Conserver les réserves
sur les pièces historiques, incomplètes ou contradictoires et l’auteur du contrôle.
Un fichier présent et une donnée techniquement plausible ne valent pas validation.

**Livrable.** Écran de vérification et compte rendu daté. **Acceptation.** Le carnet
n’est pas annoncé complet si une pièce requise manque ou si une réserve bloquante
subsiste. Une nouvelle version de pièce demande de réexaminer seulement les points
concernés ; les commentaires et attestations inchangées restent conservés.

### CIL10 Remettre un dossier portable

**Travail.** Produire un dossier téléchargeable avec synthèse lisible, sommaire,
informations du bien, travaux et pièces originales pertinentes. Ajouter un index
ouvert et un manifeste d’intégrité ; préciser la place des versions historiques.
Le destinataire doit pouvoir consulter ce dossier hors de Passeport Immo.

**Livrable.** Remise complète, par exemple synthèse PDF, index CSV ou JSON et
pièces dans une archive ZIP. Ce choix technique est proposé ; le PDF de devis
existant reste un livrable séparé.

**Acceptation.** Aucun document requis n’est omis ; titres, dates et liens sont
cohérents. Les octets des originaux sont identiques aux sources. Aucun secret,
compte, tarif interne ou document d’un autre bien n’est exporté. La version remise
est figée et datée ; les évolutions ultérieures du carnet restent distinctes.

<!-- pagebreak -->

## Accès conservation et prestation

### CIL11 Organiser les droits et la transmission

**Travail.** Définir les accès du propriétaire, d’AVEREO, des professionnels
mandatés et du destinataire d’une remise. Prévoir invitations, révocation et
journal des accès utiles. Le changement de propriétaire transfère le carnet
pertinent, sans transmettre les identifiants de l’ancien compte.

**Livrable.** Parcours de partage autorisé et de remise, avec destinataire, version,
date et preuve de réception. **Acceptation.** Un autre compte ne lit ni ne modifie
le dossier sans droit. Une invitation expirée ou révoquée est refusée. La preuve
applicative de remise ne remplace pas l’attestation prévue dans l’acte authentique.

### CIL12 Cadrer confidentialité et conservation

**Travail.** Déterminer les rôles RGPD selon le service réellement fourni, les
finalités, les informations nécessaires, les habilitations et les sous-traitants.
Documenter conservation, restitution, suppression et traitement des incidents.
La rétention des sauvegardes reste distincte de la conservation du carnet vivant.

**Livrable.** Règles de conservation, registre des traitements concerné et clauses
contractuelles adaptées. **Acceptation.** Restauration, exercice des droits et
sortie du service sont testables. La politique de trente copies de préproduction
n’est pas présentée comme une politique complète d’archivage longue durée du CIL.

### CIL14 Préparer le service AVEREO

**Travail.** Définir ce qui est facturé : collecte, organisation, contrôle des
pièces, hébergement et remise. Préciser les responsabilités du propriétaire et
des intervenants, les réserves, la sortie du service et la portée de la vérification.
Préparer guide client, exemple fictif et conditions de prestation.

**Livrable.** Offre et documents contractuels relus, mentions d’attribution des
contenus publics, règles de marque et documentation d’assistance. **Acceptation.**
La communication ne revendique pas d’agrément non établi ; elle distingue CIL,
DPE, audit et carnet d’entretien de copropriété. Le nom commercial, les conditions
du service et les droits sur d’éventuels contenus tiers restent à vérifier avant
commercialisation. Les mentions France Rénov’ sont examinées si des supports
proposent aussi des travaux de rénovation énergétique.

## Fonctions ultérieures

OCR avec confirmation humaine, rappels, import depuis un tiers ou enrichissement
automatique peuvent être ajoutés après qualification. Une extraction automatique
conserve sa source, son incertitude et la validation humaine ; elle ne complète
pas fictivement une information manquante.

<!-- pagebreak -->

## Jalons dans les quatre phases

### Cadrage

Valider le premier périmètre CIL01, le modèle CIL02, les responsabilités et les
cas pilotes. Arrêter la liste P0, les données nécessaires et le contrat de remise.
Estimer ensuite charges et budget ; les dates restent à convenir.

**Livrables.** Exigences, règles applicables, scénarios, modèle, backlog et critères
de sortie rattachés au cockpit de l’itération CIL. **Passage.** Accord sur ce
périmètre et les inconnues ; aucune réutilisation de D06 comme approbation du CIL.

### Développement local

Implémenter CIL03 à CIL12 par lots cohérents, avec jeux fictifs et tests dès la
première migration. Conserver les API et parcours de la version courante ; éviter
une refonte générale des calculs, de CONNECT ou de Coupe. Préparer CIL14 en parallèle.

**Livrables.** Code, migrations, sauvegarde et récupération, tests, documentation
et PR liée au candidat. **Passage.** Tests et contrôles documentaires réussis,
fusion sans conflit vérifiée sur la cible actuelle, candidat et plan de récupération
identifiés, accord applicable pour la préproduction.

### Préproduction

Exécuter la recette CIL13 sur le candidat installé : cas SCI avec ses réserves,
neuf fictif et cas de rénovation. Tester les comptes, les versions de pièces,
l’export hors application, la transmission et la récupération isolée. Toute
correction de code produit un candidat à requalifier.

**Livrables.** Reçu d’installation, résultats de recette, anomalies, réserves et
décision du responsable. **Passage.** P0 vérifiés, limites connues, revue humaine
et acceptation GitHub établies, récupération et retour arrière qualifiés, accord
exact pour la livraison du candidat CIL.

### Mise en production

Livrer le même artefact autorisé, conserver les données et vérifier connexion,
dossiers, dépôt, lecture, export et sauvegarde sur la production réelle. Surveiller
les erreurs après livraison et disposer d’une fermeture ou d’un retour arrière
préservant les nouvelles données.

**Livrables.** Reçu de livraison, contrôles réels, documentation d’exploitation et
suite. **Clôture.** Vérifications réussies ou incidents pris en charge, décision
de clôture et prochaine itération préparée. L’ouverture aux utilisateurs reste
une décision distincte de la livraison technique.

<!-- pagebreak -->

## CIL13 Recette et critères mesurables

Les critères ci-dessous sont proposés pour la future itération CIL. Ils ne sont
pas cochés et ne remplacent pas les checklists du protocole ou des PR.

| Essai | Scénario | Résultat attendu |
|---|---|---|
| R01 | Cas neuf puis rénovation puis constitution volontaire | Pièces conditionnelles adaptées ; motif et règles identifiables |
| R02 | Reprise du dossier SCI existant | Client, bien, actifs, archives et octets préservés ; réserves historiques visibles |
| R03 | Travaux seulement chiffrés puis réalisés | Aucun passage automatique de devis à réalisation ; dates et preuves conservées |
| R04 | Matériau ou équipement incomplet | Valeur inconnue signalée ; pas de caractéristique fabriquée |
| R05 | Plan de principe puis plan d’exécution | Statuts et auteurs distincts ; aucun remplacement implicite |
| R06 | DPE ancien et diagnostic actuel fictif | Historique et document utilisable distingués ; provenance accessible |
| R07 | Version nouvelle ou document contradictoire | Ancienne pièce conservée ; contrôles concernés à refaire, commentaires maintenus |
| R08 | Export du carnet et ouverture hors application | Synthèse, index et pièces complets ; empreintes identiques ; aucun secret |
| R09 | Compte non autorisé et invitation expirée | Accès refusés ; absence de lecture croisée ou de droit implicite |
| R10 | Remise puis changement de propriétaire | Destinataire et version datés ; aucun mot de passe transmis |
| R11 | Deux fenêtres et écriture périmée | Conflit expliqué et refus d’écrasement silencieux |
| R12 | Sauvegarde puis récupération isolée | Données, liens et fichiers cohérents ; nouvelles écritures actives préservées |

## Jeux de recette

Utiliser des données fictives pour les tests automatisés et le neuf. Le dossier
SCI réel est utilisé seulement dans le périmètre privé autorisé, sans documents
client dans Git ou dans les captures de démonstration publique. Les règles se
testent aussi avec des pièces absentes, non applicables, expirées et contradictoires.

## Résultat métier attendu

Le responsable retrouve les informations utiles, comprend les manquants et peut
remettre un dossier lisible et indépendant de l’application. L’intégrité numérique
prouve la conservation des octets ; elle ne certifie pas l’exactitude technique
du contenu ni la validité d’un diagnostic émis par un tiers.

<!-- pagebreak -->

## Poursuite de la mise en production actuelle

La Préproduction est validée par D06 le 16 octobre 2026. Son commentaire autorise
le passage en production pour le périmètre examiné. La livraison courante porte
sur la cible convenue et le dossier SCI, avec le candidat déjà contrôlé ; le plan
CIL ne modifie pas ces octets et ne crée pas une nouvelle condition fonctionnelle
pour cette livraison.

Le domaine fermé, le certificat et la base dédiée sont créés. Le compte cible
est confirmé et les neuf fichiers SCI sont contrôlés ; le stockage de production
reste à initialiser avant toute reprise réelle.

| Prérequis actuel | Action à terminer | Preuve attendue |
|---|---|---|
| Cible fermée | Initialiser le compte SQL, le schéma et les espaces privés ; conserver le refus d’accès pendant les contrôles | Inventaire réel, schéma isolé et constat de vacuité ou sauvegarde de l’état présent |
| Compte et dossier SCI | Stabiliser l’export final puis appliquer et rejouer la reprise ciblée pour le compte confirmé | Correspondance des comptes et inventaire du seul bien ; contrôle des actifs, archives et empreintes |
| Récupération | Préserver les seuls éléments CONNECT touchés puis sauvegarder les données et fichiers repris | Restauration isolée vérifiée et copie fraîche avant écriture |
| Retour arrière | Qualifier fermeture, restauration des éléments concernés et préservation des nouvelles données | Répétition isolée et contrôle de passage fondé sur les preuves réelles |

Les contrôles locaux des archives et contrats sont disponibles dans le point de
reprise technique. L’outillage de reprise ciblée passe 35 contrôles sur des données
fictives ; son application sur le dossier réel reste à effectuer. La préparation
de cette livraison continue pendant le cadrage CIL.

## Contrôles après livraison

Vérifier le lancement depuis CONNECT de production, le bien SCI et ses documents,
leur consultation et téléchargement, la persistance et les refus d’accès. Vérifier
la sauvegarde propre à la production et son indépendance de celle de préproduction.
Conserver le reçu, les empreintes installées, les erreurs et le retour arrière.

Le même candidat, la même cible et le même effet ne nécessitent pas une répétition
de l’accord D06. Une modification de ce périmètre demande une nouvelle appréciation.
L’ouverture publique ou à d’autres utilisateurs n’est pas déduite de D06.

## Référence du candidat conservé

Archive applicative : `c44f397fd03daa433f19e6d4c72127f29e55dbf9fca679e8c7f41cc207a843cf`.
La cible est `https://passeport-immo.avereo.fr`. Les configurations, secrets et
documents privés ne figurent pas dans le candidat public. Les composants de
préparation, notamment la reprise et la sauvegarde, ont leurs propres contrôles.

<!-- pagebreak -->

## Responsabilités et décisions à préparer

Les responsabilités suivantes sont proposées pour le futur lot CIL. Le responsable
du projet arbitre les affectations et la capacité ; aucun recrutement, contrat ou
engagement de délai n’est déduit de ce plan.

| Domaine | Responsable proposé | Décision ou preuve attendue |
|---|---|---|
| Périmètre et acceptation | Responsable AVEREO | Cas servis, liste P0, budget et décisions de passage |
| Faits et pièces du logement | Propriétaire et intervenants compétents | Sources, notices, dates et réserves confirmées |
| Développement et exploitation | Équipe technique ou agent mandaté | Code, tests, migrations, contrôles et récupération |
| Données et contrat | AVEREO avec conseil adapté si nécessaire | Rôles, information, clauses, conservation et sortie du service |
| Diagnostics et plans vérifiés | Professionnels compétents selon la pièce | Documents émis sous leur responsabilité et qualifications requises |

## Premières actions à engager

1. Achever les prérequis de la livraison actuelle et conserver ses contrôles réels.
2. Examiner et arbitrer le périmètre CIL01 et la définition du résultat attendu.
3. Définir CIL02 et les jeux de recette avant de modifier la base.
4. Découper le premier lot local autour du dossier documentaire et des opérations.
5. Affecter responsables, capacité et budget, puis estimer les échéances.

Les dates de travaux et pièces réellement disponibles dans le cas SCI, les moyens
de l’équipe, les modalités de remise au propriétaire et les contrats restent à
préciser. Leur absence empêche de promettre une date de service CIL complet ; elle
n’empêche pas de préparer les règles et scénarios ni de livrer la version actuelle.

## Sources et documents de référence

- [Comparatif AVEREO et guide gouvernemental](comparatif-carnet-information-logement.md), étude du 16 octobre 2026.
- [Guide propriétaire officiel](https://www.ecologie.gouv.fr/sites/default/files/documents/guide_proprietaire_carnet_d_information_du_logement.pdf), édition 2023, notamment pages 3 à 7.
- [Réglementation CIL expliquée par Service Public](https://www.service-public.gouv.fr/particuliers/vosdroits/F36759), consultée le 16 octobre 2026.
- [Modèle ministériel du carnet](https://www.ecologie.gouv.fr/sites/default/files/documents/carnet_d_information_du_logement.pdf), support de classement distinct du guide.
- [CCH section relative au CIL](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006074096/LEGISCTA000043966757/) et [arrêté du 27 décembre 2022](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000046821120), sources réglementaires du comparatif.
- [Réutilisation des contenus du ministère](https://www.ecologie.gouv.fr/mentions-legales) et [Licence Ouverte 2.0](https://www.data.gouv.fr/pages/legal/licences/etalab-2.0), attribution et droits de tiers.
- [Déterminer les rôles RGPD](https://www.cnil.fr/fr/rgpd-comment-bien-identifier-son-role), CNIL.
- [Point de reprise de production](reprise-protocole-20261016.md), [dossier opérationnel](04-mise-en-production.md) et [suivi canonique](suivi-chantier.json), pour la version actuelle.

Le Markdown est la source du présent plan. Le Word est généré à partir de cette
source ; toute évolution durable est d’abord reportée dans le Markdown. Les choix
de développement proposés restent soumis au cadrage, à la recette et aux décisions
du responsable. Les qualifications professionnelles et la validité des pièces
sont appréciées selon leur nature, indépendamment du logiciel de classement.
