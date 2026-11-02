---
project: avereo-app-rapport
document_type: api-integration
title: Integration de la synthese Georisques
status: active
version: git
created: 2026-09-12
updated: 2026-11-02
owner: jpdandin
tags:
  - rapport
  - api
  - georisques
  - risques
---

# Integration de la synthese Georisques

## RGA — évolution locale du 24 octobre

Le champ facultatif `risques.rga` conserve les libellés d’adresse et de commune de l’objet dont la clé ou le libellé mentionne RGA, argiles ou retrait-gonflement. Contrairement aux listes génériques filtrées sur `present: true`, cet objet reste conservé si le fournisseur le retourne avec `present: false` : seuls ses libellés explicites sont affichés. Sans libellé, afficher « Information non disponible ». Les anciens rapports sont relus depuis `naturels`.

L’encadré de l’écran et l’export Word reprennent ces statuts avec la source/date existantes. Le lien `/rga/` ouvre une carte territoriale distincte, protégée par CONNECT, sans coordonnées ni données client transmises. Il ne prétend pas que la réponse API utilise la version cartographique 2026. La disponibilité actuelle de l’API et le rendu hébergé restent à vérifier ; les sondes de cette session n’ont pas fourni de réponse exploitable.


## Objectif

Afficher dans l'etape `Site` une synthese informative des risques connus pour
les coordonnees du bien, sans obliger l'utilisateur a quitter l'assistant.
Le rapport officiel reste accessible pour le detail.

La vue `Rapport des risques` affiche cette synthese dans Site, sans nouvel
onglet ; `Voir le rapport complet` conserve le lien externe. La recherche
generale precharge les donnees. Si elles manquent, ouvrir la vue relance la
consultation sans refaire le cadastre ni annuler la confirmation du logement.
`Actualiser la synthese` permet une nouvelle tentative.

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

Le contrat V1 et l'ordre longitude,latitude ont été revérifiés dans l'OpenAPI
officielle le 2 novembre 2026. La V1 reste accessible sans jeton. Un en-tête
CORS `*` est observé sur une réponse réussie depuis l'hébergement ; cela ne
garantit pas la disponibilité du trajet réseau depuis le navigateur.

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

Une reponse sans les deux objets de risques attendus est rejetee et ne devient
pas une synthese artificielle de zero risque. Chargement, erreur et absence de
resultat sont visibles. Une actualisation echouee conserve la derniere
consultation datee. Les requetes de cette vue sont annulees a sa fermeture ;
aucune reponse tardive ne doit changer un autre lieu.

## Limites

Les informations publiees sont informatives et peuvent comporter des erreurs
ou omissions selon les conditions generales du service. L'interface rappelle
de consulter le rapport officiel. Une saisie de confirmation ou de commentaire
manuel reste a definir.

## Diagnostic de disponibilité — 2 novembre 2026

Le message d'indisponibilité est un message de repli : le code intercepte
indifféremment un échec réseau, un délai dépassé, une erreur HTTP ou une réponse
incomplète. Il ne démontre pas à lui seul une panne générale du fournisseur.

Constats sur la version de préproduction `59a38c9` :

- Le navigateur hébergé interrompt l'appel direct avant toute réponse HTTP,
  avec `net::ERR_HTTP2_PROTOCOL_ERROR`, sur Toulouse puis le point de Longages.
- Depuis o2switch, un appel Python vers le point public de Toulouse réussit
  (HTTP 200, 4,86 s, JSON comportant les deux groupes de risques), puis les
  essais suivants vers Toulouse et Longages subissent des connexions réinitialisées.
  PHP cURL subit également une réinitialisation, avec deux agents HTTP différents.
- Depuis le poste local, un appel à Longages réussit (HTTP 200, 2,62 s, 3 261
  octets) entre plusieurs interruptions sans réponse. Un contrôle successif
  avec virgule encodée puis littérale échoue dans les deux cas : l'encodage
  n'est pas établi comme cause.
- L'endpoint et ses paramètres correspondent au contrat officiel actuel.
  Aucune erreur d'authentification Géorisques ni de normalisation d'une réponse
  valide n'est observée ; les échecs constatés précèdent la réponse exploitable.

Conclusion limitée aux observations : la liaison à l'API est intermittente.
TBD — cause de la réinitialisation côté réseau ou infrastructure du fournisseur,
non déterminable sans journaux complémentaires. Ne pas attribuer ces échecs
aux droits CONNECT ou à l'absence de risques sur le bien.

Un relais PHP a été préparé puis écarté de la livraison, car les échecs se
reproduisent aussi depuis l'hébergement. Le code applicatif reste identique à
`59a38c9` ; aucun nouveau déploiement, paramétrage privé ou dossier modifié.
La synthèse reste à requalifier. L'action existante Site → Rapport des risques →
Actualiser la synthèse permet une nouvelle tentative ; le lien au rapport
complet dépend lui aussi du service externe et n'est pas garanti disponible.
Les preuves datées et la prochaine action figurent dans le [suivi RGA](rga.md).
