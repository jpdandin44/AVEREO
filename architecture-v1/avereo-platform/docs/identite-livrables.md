---
project: avereo-platform
document_type: specification
title: Identité des organisations dans les livrables
status: active
version: git
created: 2026-11-06
updated: 2026-11-06
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

La source [report-identity.js](../shared/report-identity.js) contient uniquement le
nom AVEREO et le logo officiel déjà utilisé par Rapport. Le PNG est conservé
octet pour octet ; il est embarqué, sans téléchargement depuis un service tiers.
Les quatre applications importent la même source lors de leur compilation.

| Application | Livrable existant raccordé | Effet local |
| --- | --- | --- |
| Rapport | Rapport expert et synthèse client HTML/Word natif | Logo commun sur couverture, nom commun dans le pied HTML, le créateur, l’en-tête et le pied Word |
| Thermo | Rapport Word au format HTML `.doc` existant | Logo sur la première page, nom commun dans l’en-tête et le pied ; protocole et mentions métier conservés |
| Drone | Ordre de mission imprimable | Logo et nom communs dans l’en-tête ; mission, scénario et signatures conservés |
| Passeport Immo | Estimation de travaux PDF | Logo, titre et pied communs ; calculs et pagination conservés |

CONNECT est un portail. Projet conserve ses exports de données ; Coupe ses images
SVG/PNG ; RGA sa carte et sa restitution dans Rapport. Aucun rapport commercial
supplémentaire n’est créé dans ces applications par ce lot. Recherche et Saisie
unique, dont les formulaires ont déjà des champs d’entreprise, restent à raccorder
lors du lot de configuration ; leurs formulaires réglementaires ne sont pas réécrits.
Les documents clients déjà téléversés ne sont jamais rebaptisés ou modifiés.

**TBD — fiche AVEREO validée** : raison sociale exacte, adresse, SIREN/SIRET,
assurance et mentions d’entreprise. La recherche ciblée dans le dépôt et les
métadonnées Drive n’a pas fourni de référence validée. Une demande est adressée
au responsable. Aucune valeur de démonstration ni déduction n’est imprimée à leur place.
Les mentions métier préexistantes restent inchangées ; leur validité juridique
n’est pas attestée par cette harmonisation graphique.

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
  inversion de trois modifications de présentation précisément autorisées.
- Aperçu expert de Rapport ouvert depuis l’application sur un dossier fictif ;
  logo et pied AVEREO constatés. Le Word natif n’est pas régénéré dans cette recette.
- PDF Passeport généré depuis le parcours réel de démonstration, relu avec Poppler :
  une page A4 complète, logo et montants 1 800 / 2 400 / 3 000 euros conservés.
- Thermo et Drone : rendu des générateurs réels sur fixtures, puis inspection
  visuelle des HTML. Cette preuve ne vaut pas parcours utilisateur complet ni
  validation de pagination dans Word ou du dialogue d’impression PDF.
- Le navigateur de test ne répond plus après la confirmation d’impression Drone ;
  les clics Thermo ne font ensuite plus avancer le parcours. Les aperçus et le PDF
  restent lisibles. Reprendre ces deux parcours avant qualification hébergée.

Les [preuves locales](../data/identite-livrables/qualification-locale.json)
identifient les fichiers et les limites. Aucun compte hébergé, rapport réel,
stockage métier, droit ou secret n’est modifié. L’harmonisation n’est pas livrée.

## Revue et suite

Entrées locales : [Rapport](http://127.0.0.1:53201/),
[Thermo](http://127.0.0.1:53202/), [Drone](http://127.0.0.1:53203/),
[Passeport](http://127.0.0.1:53204/).
[Modèle Thermo](http://127.0.0.1:53205/thermo-fictif-avereo.html) et
[modèle Drone](http://127.0.0.1:53205/drone-fictif-avereo.html) sont des exemples de
mise en page, sans fonctions de saisie ni dossier réel.

Confirmer la fiche d’entreprise, compléter l’identité AVEREO, terminer la recette
Word/impression, puis présenter le même candidat et ses sauvegardes pour une
livraison de préproduction distincte. Le service de configuration par organisation
fait ensuite l’objet d’un candidat avec tests d’isolement et de refus aux membres.
La production et l’ouverture publique gardent leurs accords propres.
