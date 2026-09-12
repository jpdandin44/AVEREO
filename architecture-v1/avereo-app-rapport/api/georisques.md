---
project: avereo-app-rapport
document_type: api-integration
title: Integration de la synthese Georisques
status: active
version: git
created: 2026-09-12
updated: 2026-09-12
owner: jpdandin
tags:
  - rapport
  - api
  - georisques
  - risques
---

# Integration de la synthese Georisques

## Objectif

Afficher dans l'etape `Site` une synthese informative des risques connus pour
les coordonnees du bien, sans obliger l'utilisateur a quitter l'assistant.
Le rapport officiel reste accessible pour le detail.

## Source et contrat utilises

- documentation officielle : <https://www.georisques.gouv.fr/doc-api> ;
- endpoint public V1 :
  `GET https://www.georisques.gouv.fr/api/v1/resultats_rapport_risque` ;
- parametre utilise : `latlon=<longitude>,<latitude>` ;
- authentification : aucune pour la V1 ;
- reponse : `RapportRisquesJsonDto` avec `risquesNaturels`,
  `risquesTechnologiques`, `adresse`, `commune` et `url`.

Chaque risque expose notamment `present`, `libelle`,
`libelleStatutAdresse` et `libelleStatutCommune`. Le frontend conserve
uniquement les risques marques `present: true` dans la synthese, sans recalcul
de niveau ni interpretation diagnostique.

Le contrat et une reponse d'exemple ont ete verifies le 12 septembre 2026.
L'API V1 annonce des appels sans jeton et renvoie actuellement un en-tete CORS
permettant l'appel direct depuis le navigateur.

## Donnees transmises et conservees

Seules la longitude et la latitude issues du geocodage sont transmises a
Georisques. Le nom du client, son email, les commentaires, les photos et les
autres donnees du dossier ne sont pas envoyees.

Le payload Rapport conserve dans `risques` :

- la source `Georisques API V1` ;
- la date de consultation ;
- le libelle d'adresse et de commune renvoye ;
- les listes normalisees de risques naturels et technologiques ;
- l'URL du rapport officiel.

## Gestion des erreurs

Le geocodage de l'adresse reste necessaire pour obtenir les coordonnees. La
parcelle cadastrale, le zonage et la synthese des risques sont ensuite traites
comme des enrichissements independants. Une parcelle absente ne bloque donc
pas Georisques.

Si Georisques est indisponible, l'interface le signale et ne fabrique aucun
risque. Le bouton de rapport officiel reste propose lorsque les coordonnees
sont valides.

## Limites

Les informations publiees sont informatives et peuvent comporter des erreurs
ou omissions selon les conditions generales du service. L'interface rappelle
de consulter le rapport officiel. Une saisie de confirmation ou de commentaire
manuel reste a definir.
