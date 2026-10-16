---
project: avereo-app-passeport-immo
document_type: regulatory-functional-comparison
title: Passeport Immo et carnet d’information du logement — usage pour AVEREO
status: active
version: git
created: 2026-10-16
updated: 2026-10-16
owner: jpdandin
tags: [cil, comparaison, reglementation, reutilisation, avereo]
---

# Passeport Immo et carnet d’information du logement

Étude documentaire réalisée le **16 octobre 2026**, à la demande du responsable.
Elle compare le guide ministériel fourni, les sources officielles consultées et
le code actuel de Passeport Immo. Elle ne constate pas la conformité d’un dossier
client complet et ne vaut pas décision d’implémentation ou de mise en production.

## Conclusion pour AVEREO

**AVEREO peut développer et commercialiser un service de constitution, de classement
et de suivi du carnet d’information du logement (CIL).** Le guide prévoit lui-même,
page 3, des carnets numériques proposés par des éditeurs, gratuits ou payants.
Le concept est un cadre réglementaire utilisable par plusieurs acteurs ; sa mise
en œuvre peut être propre à AVEREO. L’INPI distingue l’idée ou le concept, non
protégés en tant que tels, de leurs matérialisations protégeables [S1, S8].

Les textes CIL examinés ne prescrivent pas un logiciel unique ni une plateforme
gouvernementale obligatoire. Aucun agrément spécifique d’éditeur de CIL n’y a été
identifié. Cela ne donne pas les qualifications nécessaires pour produire un DPE,
un audit réglementaire, ou exercer une mission agréée Mon Accompagnateur Rénov’.
Ces activités conservent leurs propres règles [S2, S9, S13].

**La version examinée de Passeport Immo constitue une base documentaire utile,
mais sa complétude comme CIL n’est pas démontrée.** Elle conserve les pièces d’un
bien ; il reste notamment à organiser les informations techniques requises,
la vérification du dossier et sa remise complète au propriétaire puis à l’acquéreur.
Un dossier peut déjà constituer un CIL sur papier ou sous forme de fichiers :
les écrans structurés proposés ici facilitent le contrôle, sans être eux-mêmes
un format informatique imposé par la loi.

## 1. Ce que sont le guide, le modèle et le service public

| Élément | Nature constatée | Utilisation possible par AVEREO |
|---|---|---|
| Guide propriétaire fourni | Brochure pédagogique de huit pages, édition 2023 | Référence métier ; reformulation des exigences et lien vers l’original |
| Modèle ministériel de carnet | PDF distinct de quatre pages : chemise et listes de pièces à réunir | Base de travail manuelle pour un client, avec ses pièces annexes ; ce modèle ne garantit pas seul que le dossier est complet |
| CIL | Dossier par logement, papier ou numérique, établi et mis à jour sous la responsabilité du propriétaire | Service AVEREO de collecte, mise en forme, hébergement, accompagnement et remise du dossier |
| France Rénov’ | Service public de conseil et d’orientation ; parcours d’aides distincts | Orienter un client vers le service officiel ; respecter les conditions de chaque parcours et, le cas échéant, le mandat |
| Plateforme CIL privée éventuelle | Aucun opérateur particulier désigné dans les huit pages fournies | Vérifier séparément ses CGU, droits de représentation, export, coûts et contrat/API avant intégration ou revente |

Le fichier fourni est identique octet pour octet au guide téléchargé depuis le
ministère le 16 octobre. Sa page 8 annonce un modèle sur les pages suivantes, mais
celui-ci n’est pas inclus dans ce PDF de huit pages. Le document de quatre pages
est bien proposé séparément sur la page ministérielle [S1, S3].

Il n’a été identifié, dans ces ressources, **aucun service gouvernemental de stockage
de CIL ni contrat d’API CIL à brancher directement à Passeport Immo**. Cela décrit
les sources examinées, sans prétendre inventorier tous les services existants.
France Rénov’ n’est pas une autorisation de distribuer un service en marque blanche.
Ses CGU distinguent propriétaires personnes physiques, personnes morales, syndics
et mandataires ; le parcours d’un particulier ne doit donc pas être appliqué
automatiquement à une SCI [S12].

## 2. Conditions de reprise du concept et des contenus

| Usage envisagé | Conclusion | Conditions et limites |
|---|---|---|
| S’inspirer du classement, des rubriques et des obligations du CIL | Oui | Développer l’interface et les textes AVEREO ; ne pas copier le code ou les créations d’un éditeur privé |
| Facturer la préparation ou l’hébergement du CIL | Oui, sur le principe | Distinguer clairement la prestation AVEREO des documents publics gratuits et du conseil public ; ne pas promettre une homologation inexistante |
| Réutiliser les informations et le modèle publiés par le ministère | Oui, dans le champ de la licence applicable | Mentions légales : Etalab 2.0 hors droits de tiers ; citer source et dernière mise à jour, ne pas induire en erreur ; identifier les adaptations |
| Mettre un lien vers le guide ou le modèle officiel | Oui | Lien direct autorisé ; conserver la distinction avec le site AVEREO, sans imbriquer les pages officielles dans une interface trompeuse |
| Reprendre photographies, illustrations ou marques du guide | À vérifier élément par élément | La licence des informations ne neutralise pas les droits de tiers ni les règles de la marque de l’État ; ne pas extraire un logo pour présenter AVEREO comme service officiel |
| Utiliser le compte ou les services d’un opérateur tiers pour un client | Dépend du service | Autorisation ou mandat adapté, CGU et confidentialité ; pas de réutilisation des accès personnels du client par simple commodité |
| Affirmer « agréé par l’État », « partenaire France Rénov’ » ou « CIL certifié » | Non établi | Aucune de ces qualités n’est démontrée par le guide, la licence ou le prototype |

Les [mentions légales du ministère](https://www.ecologie.gouv.fr/mentions-legales),
mises à jour le 5 octobre 2026, autorisent la réutilisation sous Etalab 2.0, sauf
propriété intellectuelle de tiers. La licence permet l’exploitation commerciale,
avec attribution. Ce droit de réutilisation ne confère aucune caution officielle
et ne permet pas de détourner le bloc Marianne [S4, S5, S7].

Attribution possible pour une adaptation de contenu :

> Source : Ministère de la Transition écologique — Guide propriétaire du carnet
> d’information du logement, édition 2023 ; page source mise à jour le 22 mai 2023,
> consultée le 16 octobre 2026. Présentation adaptée par AVEREO, service indépendant.

L’attribution doit accompagner un lien vers la source et la licence applicable.
Elle n’autorise pas à dénaturer les informations. Une recherche de disponibilité
du nom commercial ou de la marque « Passeport Immo » n’a pas été réalisée ici.

## 3. Exigences du CIL à distinguer des choix d’interface

Les articles L126-35-2 à L126-35-11 du CCH et leurs textes d’application distinguent
construction et rénovation énergétique. Pour les opérations concernées, le point
de départ est notamment le dépôt de l’autorisation à compter du 1er janvier 2023
ou, pour les travaux non soumis à autorisation, l’acceptation du devis ou à défaut
le commencement des travaux à compter de cette date [S2]. La présence de factures
dans un bien ancien ne suffit pas à déterminer son assujettissement.

Le propriétaire établit et met à jour le carnet à partir des éléments remis par
les intervenants. Les éléments sont transmis par défaut dans un format numérique
ouvert ; un autre format est possible à sa demande. Le carnet doit être remis à
l’acquéreur lors de la mutation, au plus tard à l’acte authentique, avec attestation
dans cet acte [S2, S10, S11]. Une remise par AVEREO doit rester traçable et ne
supprime pas les responsabilités respectives du propriétaire et des intervenants.

Le guide détaille, pages 4 et 5, les plans, réseaux, notices et caractéristiques
techniques du neuf. Les pages 6 et 7 décrivent les dates et la nature des travaux,
les isolants et équipements concernés, leurs notices et les documents énergétiques
établis. Les attestations d’entretien constituent des compléments utiles, sans
devenir toutes des pièces obligatoires du CIL. Une pièce non applicable doit être
distinguée d’une pièce manquante [S1].

Le numéro fiscal du local figure dans le modèle ministériel. Il ne faut pas
transformer sa présence dans ce modèle en obligation générale supplémentaire
tirée des articles CIL examinés. Sa collecte éventuelle doit être justifiée.

## 4. Comparatif avec Passeport Immo actuellement examiné

« Présent » indique une capacité constatée dans le code ou dans un reçu daté ;
cela ne valide pas la qualité du document client. « Partiel » signifie que les
pièces peuvent être conservées, mais que le parcours ou leur complétude n’est
pas contrôlé. Aucun pourcentage de conformité n’est déduit de ce tableau.

| Sujet du guide / du CIL | État constaté dans Passeport Immo | Écart ou action utile |
|---|---|---|
| Dossier par logement, associé à son propriétaire | Bien et client associés ; fichiers rattachés au bien : présent | Distinguer le client/propriétaire du compte CONNECT qui conserve les données ; gérer le mandat et la remise au client |
| Identification et contexte de création du CIL | Adresse, type, surface et identifiants internes : présents | Ajouter le motif construction/rénovation, les dates utiles et le statut obligatoire/volontaire ; pas de contrôle juridique automatique constaté |
| Plans de surface et coupes, pour le neuf | PDF et plans stockables ; comparaison de coupes jointe au cas : partiel | Identifier conception/exécution et provenance ; les coupes de principe avant/après ne prouvent pas un relevé d’exécution |
| Réseaux d’eau, d’électricité, de gaz et d’aération, pour le neuf | Pièces jointes possibles : partiel | Prévoir des rubriques et un contrôle des réseaux applicables ; aucune complétude démontrée par une catégorie générique « plans » |
| Date et description des travaux de rénovation réalisés | Chiffrage d’interventions et pièces « Devis et factures » : partiel | Ajouter des opérations réalisées et datées, rattachées aux factures ; une estimation n’est pas une preuve de réalisation |
| Caractéristiques des isolants et menuiseries | Fiches produit stockables ; pas de fiche technique structurée CIL constatée | Rassembler marque/référence, résistance ou conductivité, épaisseur, surface et interfaces selon les travaux concernés ; une saisie structurée est un choix d’aide au contrôle |
| Équipements et notices de fonctionnement, maintenance et entretien | Import de documents possible : partiel | Identifier chauffage, eau chaude, refroidissement et ventilation associés ; rattacher caractéristiques et notices |
| DPE, audit, attestations ou labels lorsqu’ils sont établis | Catégorie diagnostics et lecteur PDF : présents comme support | Vérifier date, provenance et validité ; ne pas confondre dépôt d’un PDF et validation du diagnostic |
| Documents d’entretien complémentaires | Conservation et archives possibles | Prévoir classement et chronologie dédiés ; ne pas les rendre tous obligatoires sans base applicable |
| Vérification du contenu requis | Aucune checklist métier CIL constatée | Ajouter une liste conditionnelle des pièces, les manquants et les réserves ; les cases du cockpit de développement ne remplissent pas ce rôle |
| Remise d’un dossier numérique ouvert | Téléchargement de chaque document : présent ; export PDF de devis : présent | Aucun export complet de CIL avec sommaire, informations et pièces constaté ; prévoir un dossier téléchargeable indépendant de l’application |
| Transmission lors d’une mutation | Aucun parcours de cession de carnet ou d’accès acquéreur constaté | Organiser la remise complète, sa date, son destinataire et la continuité du carnet, sans partage des identifiants de l’ancien compte |
| Confidentialité et conservation | API par compte CONNECT, fichiers privés, empreintes et sauvegardes de préproduction : présents | Cela ne constitue pas un audit RGPD ; cadrer les rôles, la durée, les accès délégués, l’exercice des droits et la sortie du service |

Sources de l’état applicatif : [gestion documentaire](../frontend/src/documents/DocumentsPanel.jsx),
[catégories et stockage](../frontend/src/documents/document-store.js),
[écrans et export de devis](../frontend/src/App.jsx),
[schéma](../database/storage.sql), [lot serveur](stockage-serveur.md) et
[reçu de préproduction](../api/storage-observation.json).
L’observation du serveur est celle des reçus indiqués ; cette étude n’a pas effectué
de nouvelle recette hébergée, de modification de données ou de test d’un compte client.

## 5. Application au dossier concret déjà confié

Le dossier migré offre un exemple de rassemblement des documents : six actifs et
trois archives selon le reçu de préproduction. Ce nombre ne signifie pas que les
exigences du CIL sont remplies. Il faut vérifier les travaux concernés, leurs dates,
les caractéristiques des produits et équipements et les notices réellement reçues.

Deux réserves déjà établies dans les sources du projet doivent rester visibles :

- Le DPE source est daté du **23 février 2012**. Il reste utile comme historique,
  mais ne peut pas être présenté comme un DPE valide pour une vente ou une location
  en 2026. Un CIL ne remplace pas le DDT ni un diagnostic à refaire [S9].
- Les coupes produites sont des **coupes de principe**, avec hypothèses et mesures
  manquantes. La comparaison avant/après et la lecture thermique apportent du
  contexte ; elles ne garantissent pas des plans conformes à l’exécution.

Ces constats proviennent de [la documentation des coupes approuvée](coupes-bien.md).
Cette étude n’altère ni ce document, ni les PDF originaux, ni le dossier client.

## 6. Offre et évolution possibles

Le positionnement proposé est un **service indépendant AVEREO de constitution et
de suivi du dossier du logement**, avec un volet CIL lorsque applicable, complété
par les documents de travaux et les estimations. Le CIL reste distinct d’un DPE,
d’un audit, du dossier de diagnostics et du carnet d’entretien d’une copropriété.

Une première prestation manuelle peut utiliser le modèle ministériel, les documents
remis par les professionnels et un dossier complet remis au client. Elle ne
nécessite pas d’attendre un logiciel CIL entièrement automatisé. Elle exige en
revanche une vérification du contenu et un cadre de prestation adaptés ; elle
n’est pas mise en service par la présente analyse.

Pour faire évoluer l’application, préparer un futur lot, sans le considérer comme
déjà autorisé :

1. Déterminer construction/rénovation/constitution volontaire et les pièces requises.
2. Classer plans et réseaux, distinguer conception/exécution et identifier les sources.
3. Rattacher les travaux réalisés et leurs dates aux fiches d’isolants, équipements et notices.
4. Afficher complétude, pièces manquantes, documents historiques et réserves contrôlées.
5. Produire une remise complète en formats ouverts, avec sommaire et pièces originales.
6. Prévoir propriétaire, mandat, accès professionnels et transmission à l’acquéreur.

Ce lot constitue une proposition. Il ne doit pas retarder la livraison déjà autorisée
du candidat actuel ni permettre de présenter ce candidat comme un CIL complet sans
vérification. La production de la version existante et l’évolution CIL ont des
périmètres et des candidats distincts.

## 7. Points à cadrer avant commercialisation ou raccordement à un tiers

| Point restant | Impact | Prochaine action |
|---|---|---|
| Pièces et opérations réellement concernées pour chaque logement | Impossible de déclarer un dossier complet à partir du nombre de fichiers | Contrôler les dates et pièces avec le propriétaire et les professionnels ; documenter les manquants |
| Service tiers éventuellement visé par « utiliser le service » | Pas d’API, de licence de revente ni de droit de représentation établi pour un opérateur non nommé | Identifier l’opérateur et examiner ses conditions ; pour France Rénov’, respecter le parcours de la personne physique ou morale |
| Rôles RGPD et contrat client/hébergeur | Le professionnel et le propriétaire ne sont pas interchangeables ; la sécurité technique ne règle pas seule les responsabilités | Déterminer finalités et rôles, information des personnes, base juridique, contrats requis, conservation, habilitations et modalités de restitution [S6] |
| Nom commercial et signes de tiers | Cette étude ne certifie pas la disponibilité d’une marque | Vérifier nom et marque avant exploitation commerciale ; conserver une présentation AVEREO distincte de l’État |
| Réutilisation d’un visuel, d’une photo ou d’un logo particulier | Droits spécifiques possibles | Examiner la licence/crédit de l’élément précis ; privilégier les propres visuels AVEREO et les liens officiels |
| Communication proposant aussi des travaux de rénovation énergétique | Une simple reprise de logo peut être inadaptée ; une mention réglementaire peut au contraire être imposée | Vérifier le champ du bandeau/pavé France Rénov’ annoncé applicable au 1er octobre 2026 et appliquer son modèle officiel si le support est concerné [S14] |

Le rôle de responsable ou de sous-traitant doit être déterminé selon les finalités
et moyens réellement décidés. Un contrat conforme à l’article 28 est requis quand
il existe une relation de sous-traitance ; le simple fait de détenir des PDF client
ne suffit pas à fixer automatiquement tous les rôles [S6].

## Sources vérifiées le 16 octobre 2026

- **S1 — Source fournie et guide officiel** : huit pages, guide propriétaire, édition
  2023 ; [page ministérielle](https://www.ecologie.gouv.fr/politiques-publiques/carnet-dinformation-du-logement)
  et [PDF officiel](https://www.ecologie.gouv.fr/sites/default/files/documents/guide_proprietaire_carnet_d_information_du_logement.pdf).
  Les deux fichiers ont le même SHA-256 : `b7049d3cdfec82c0107e147ce1109f7eb25a7960171bbf6265d104b975c72af1`.
- **S2 — Réglementation CIL** : [Service Public](https://www.service-public.gouv.fr/particuliers/vosdroits/F36759),
  fiche vérifiée le 26 mai 2026 ; [CCH, section 5 bis](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006074096/LEGISCTA000043966757/),
  [dispositions réglementaires](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006074096/LEGISCTA000046823567/)
  et [arrêté du 27 décembre 2022](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000046821120).
- **S3 — Modèle officiel** : [présentation Service Public](https://www.service-public.gouv.fr/particuliers/vosdroits/R77073)
  et [PDF de quatre pages](https://www.ecologie.gouv.fr/sites/default/files/documents/carnet_d_information_du_logement.pdf).
- **S4 — Droits de réutilisation** : [mentions légales ecologie.gouv.fr](https://www.ecologie.gouv.fr/mentions-legales),
  mises à jour le 5 octobre 2026 ; [répertoire des informations publiques](https://www.ecologie.gouv.fr/repertoire-informations-publiques).
- **S5 — Licence** : [Licence Ouverte 2.0](https://www.data.gouv.fr/pages/legal/licences/etalab-2.0).
- **S6 — Données personnelles** : [identifier les rôles](https://www.cnil.fr/fr/rgpd-comment-bien-identifier-son-role)
  et [contrats responsable/sous-traitant](https://www.cnil.fr/fr/clauses-contractuelles-types-entre-responsable-de-traitement-et-sous-traitant), CNIL.
- **S7 — Marque de l’État** : [règles d’utilisation du bloc Marianne](https://www.info.gouv.fr/marque-de-letat/les-symboles-de-la-republique-francaise).
- **S8 — Idée et matérialisation** : [protéger ses créations](https://www.inpi.fr/sites/default/files/proteger_ses_creations.pdf), INPI.
- **S9 — DPE** : [règles et validité](https://www.service-public.gouv.fr/particuliers/vosdroits/F16096), Service Public.
- **S10 — Format de transmission** : [article L126-35-9](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043966773/).
- **S11 — Transmission lors de la mutation** : [article L126-35-10](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043966775/).
- **S12 — France Rénov’** : [service public](https://france-renov.gouv.fr/francerenov/qui-somme-nous)
  et [conditions d’utilisation](https://france-renov.gouv.fr/cgu).
- **S13 — Mission agréée distincte** : [devenir Mon Accompagnateur Rénov’](https://france-renov.gouv.fr/mon-accompagnateur-renov/demande-agrement).
- **S14 — Communication des professionnels** : [page France Rénov’ professionnels](https://france-renov.gouv.fr/professionnels).

Limite d’accès : certaines ouvertures directes Légifrance ont renvoyé 403. Les
dispositions détaillées ont été recoupées avec leurs résultats indexés et la fiche
Service Public actuelle ; aucun contrôle d’un dossier complet, avis d’autorité,
recherche de marque ou audit juridique/contractuel exhaustif n’a été effectué.
