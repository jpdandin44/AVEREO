---
project: avereo-platform
document_type: specification
title: Identité des organisations dans les livrables
status: active
version: git
created: 2026-11-06
updated: 2026-11-07
owner: jpdandin
tags: [avereo, livrables, organisation]
---

# Identité des organisations dans les livrables

## Demande et état

Le responsable demande le 6 novembre de généraliser les livrables à partir du logo,
des informations d’entreprise et des mentions de l’organisation. **Seul
l’administrateur de cette organisation peut configurer cette partie.** La priorité
explicite est de présenter les rapports existants au nom d’AVEREO.

Cycle : **Cadrage → Développement local → Préproduction → Mise en production**.
Le [suivi canonique](../data/suivi-identite-livrables.json) distingue les deux lots :
présentation AVEREO locale puis configuration par organisation. Aucun déploiement
de cette nouvelle identité n’est encore réalisé ou autorisé par une fusion antérieure.

## Première réalisation locale : AVEREO

La source structurée [report-organization.json](../data/report-organization.json)
porte le nom AVEREO et les informations provisoires fournies par le responsable
le 7 novembre : forme sociale, capital, siège social et société en formation.
[report-identity.js](../shared/report-identity.js) associe ce profil au logo officiel
déjà utilisé par Rapport et produit les lignes à imprimer. Le PNG est conservé
octet pour octet ; il est embarqué, sans téléchargement depuis un service tiers.
Les quatre applications importent cette même identité lors de leur compilation.

| Application | Livrable existant raccordé | Effet local |
| --- | --- | --- |
| Rapport | Rapport expert et synthèse client HTML/Word natif | Logo et quatre lignes d’entreprise sur la couverture ; nom commun dans les pieds et métadonnées Word |
| Thermo | Rapport Word au format HTML `.doc` existant | Logo et quatre lignes sur la première page ; protocole et mentions métier conservés |
| Drone | Ordre de mission imprimable | Logo, quatre lignes et nom communs dans l’en-tête ; mission, scénario et signatures conservés |
| Passeport Immo | Estimation de travaux PDF | Logo et quatre lignes avant le titre ; calculs et algorithme de pagination conservés |

CONNECT est un portail. Projet conserve ses exports de données ; Coupe ses images
SVG/PNG ; RGA sa carte et sa restitution dans Rapport. Aucun rapport commercial
supplémentaire n’est créé dans ces applications par ce lot. Recherche et Saisie
unique, dont les formulaires ont déjà des champs d’entreprise, restent à raccorder
lors du lot de configuration ; leurs formulaires réglementaires ne sont pas réécrits.
Les documents clients déjà téléversés ne sont jamais rebaptisés ou modifiés.

Le responsable autorise explicitement ces informations provisoires et reporte
l’immatriculation. La recherche initiale de fiche complète n’est donc plus un
blocage pour cette présentation. Les textes fournis figurent uniquement dans le
profil JSON de référence, sans copie documentaire concurrente.

La zone d’immatriculation est préparée dans ce profil : `siren`, `siret`, `rcs`,
`vatNumber`, `insurance`, `additionalMentions`. Ces champs sont vides ; une valeur
vide ou composée d’espaces n’imprime ni ligne ni libellé. Les futurs champs
renseignés suivront les informations d’entreprise dans les quatre livrables.
**TBD volontaire — immatriculation, TVA, assurance et mentions complémentaires** :
à renseigner quand le responsable fournira les références. Aucun identifiant de
démonstration n’est utilisé. Le retrait de la mention de formation devra être
explicite lors de cette mise à jour.

Cette zone est une préparation du modèle de données et des documents, pas encore
un formulaire de préférences. Les mentions métier préexistantes restent inchangées.

## Règle durable pour la configuration par organisation — à implémenter

- L’identité d’entreprise appartient à l’organisation, et non au navigateur ou à
  un projet individuel. Un membre utilise les valeurs publiées par son organisation.
- Nom, logo, coordonnées et informations légales sont communs. Les mentions métier
  et options de restitution propres à une application complètent cette identité.
- Les préférences personnelles de tri, d’affichage et de travail restent propres
  à chaque application ; elles n’accordent aucun droit d’administration.
- L’interface présente la section « Organisation et livrables » dans les préférences.
  Seuls les administrateurs de l’organisation peuvent la modifier. Les autres
  membres disposent d’une consultation de l’identité utilisée dans leurs livrables.
- Le serveur doit contrôler l’utilisateur, l’organisation active et son rôle à
  chaque écriture. CONNECT vérifie déjà `owner`/`admin` pour son administration
  d’organisation ; ce contrôle doit être réutilisé, avec protection CSRF et refus
  d’une organisation différente. Masquer un bouton ne constitue pas un contrôle.
- Une seule source persistante est requise, desservant toutes les applications.
  Ni le rôle simulé de Passeport en démonstration ni `localStorage` ne peuvent
  autoriser ou stocker les réglages d’entreprise faisant foi.
- Les logos doivent être validés et limités ; textes et mentions doivent être
  échappés dans chaque format. Une erreur d’enregistrement doit être visible et
  conserver la dernière version valide. Aucune identité d’une autre organisation
  ne doit servir de remplacement silencieux.
- Une modification s’applique aux nouveaux exports ; les documents déjà émis et
  archivés restent conservés. L’instantané de l’identité utilisée et son numéro de
  révision devront accompagner chaque nouveau document archivé.

**Non implémenté dans ce candidat** : formulaire d’organisation, API de réglages,
persistance partagée, rôle sur cette nouvelle API, révisions et reprise des exports
dans les applications encore non raccordées. Le code local n’offre aucun réglage
de logo libre aux membres ; il utilise l’identité AVEREO fixe demandée en priorité.

## Vérification locale et limites

- Quatre compilations réussies ; avertissements Vite sur la taille des bundles
  conservés, sans désactivation. Le logo PNG embarqué représente 303 132 octets.
- Suite Rapport : 101 tests réussis, dont les restitutions expert/client.
- Passeport : quatre tests de pagination réussis ; contrôle de parité complet avec
  inversion des trois raccordements de l’écart i puis des deux ajouts de l’écart j.
  Le témoin de modification étrangère au lot reste refusé.
- Rapport : aperçus expert/client et deux Word natifs téléchargés depuis
  l’application sur un dossier fictif. Rendu Microsoft Word puis inspection des
  couvertures et des pages : six pages expert, trois pages client ; bloc d’identité
  lisible, complet et non coupé. Ces nombres sont ceux de cette fixture minimale.
- PDF Passeport généré depuis le parcours réel de démonstration, relu avec Poppler :
  une page A4 complète, logo et montants 1 800 / 2 400 / 3 000 euros conservés.
- Thermo : générateur HTML sur fixture puis parcours complet jusqu’au téléchargement
  du `.doc`. Les images témoins sont des logos, explicitement décrits comme test et
  non exploitables. Le refus d’export sans les deux images a aussi été constaté.
  Rendu Word sur sept pages ; la nouvelle identité tient sur la couverture.
- Drone : composant d’impression réel rendu sur fixture et HTML inspecté.
  Le dialogue d’impression complet reste à qualifier après le blocage observé
  le 6 novembre. Les autres parcours ont pu être repris le 7 novembre.
- Le moteur LibreOffice du script de rendu n’est pas installé sur ce PC. Microsoft
  Word a rendu les documents en lecture seule ; Poppler a produit les images de
  contrôle. Le sommaire Thermo existant reste à actualiser dans Word ; la signature
  textuelle de test est rendue comme une image invalide. Ces deux parties historiques
  ne sont pas modifiées ici ; le rendu de signature est à traiter dans un lot Thermo.
- Profil contrôlé : quatre lignes actuelles, six champs futurs vides et omis,
  affichage conditionnel d’un champ renseigné vérifié sur une valeur fictive isolée.

Les [preuves du 7 novembre](../data/identite-livrables/formation-20261107/qualification-locale.json)
identifient les fichiers, leurs empreintes et les limites. Les preuves du 6 novembre
restent conservées pour leur ancien candidat. Aucun compte hébergé, rapport réel,
stockage métier, droit ou secret n’est modifié. L’harmonisation n’est pas livrée.

## Revue et suite

Entrées locales : [Rapport](http://127.0.0.1:53201/),
[Thermo](http://127.0.0.1:53202/), [Drone](http://127.0.0.1:53203/),
[Passeport](http://127.0.0.1:53204/).
[Modèle Thermo](http://127.0.0.1:53205/formation-20261107/thermo-fictif-avereo.html) et
[modèle Drone](http://127.0.0.1:53205/formation-20261107/drone-fictif-avereo.html) sont des exemples de
mise en page, sans fonctions de saisie ni dossier réel.

Terminer le parcours d’impression Drone, puis présenter le même candidat et ses sauvegardes pour une
livraison de préproduction distincte. Le service de configuration par organisation
fait ensuite l’objet d’un candidat avec tests d’isolement et de refus aux membres.
La production et l’ouverture publique gardent leurs accords propres.

## 7 novembre 2026 — Suite après la fusion de #124

La fusion dans main du 7 novembre conserve les preuves historiques ci-dessus. La nouvelle itération a éprouvé les cinq types de fiche Drone dans le moteur PDF du navigateur et corrigé le sommaire et la signature texte Thermo. Les coordonnées provisoires AVEREO sont utilisées dans les quatre lettres. [Recette et limites actuelles](preparation-missions.md).
