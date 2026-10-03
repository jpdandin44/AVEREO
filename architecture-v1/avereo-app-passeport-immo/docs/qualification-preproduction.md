---
project: avereo-app-passeport-immo
document_type: target-qualification
title: Qualification de la préproduction dédiée
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [passeport-immo, o2switch, preproduction]
---

# Qualification de la préproduction dédiée

## Choix acquis
Le responsable choisit « Préproduction dédiée sur o2switch » en conversation.
Ce choix est inscrit dans le suivi canonique. La source de la PR nº71 est fusionnée ;
le candidat local et CI est identifié dans la [fiche générée](iteration-developpement.md).
Aucun déploiement de Passeport Immo n'a été engagé.

Dans le chat de reprise, le responsable retient l'adresse proposée et une lune
gratuite si disponible. `requestedAddress` et `hostingPreference` conservent ce
choix dans la cible canonique ; la [fiche générée](iteration-developpement.md)
l'affiche. Le responsable corrige l'URL et se connecte directement à cPanel.
La session authentifiée est vérifiée ; Mon Univers Web indique huit lunes gratuites
incluses, trois actives et cinq disponibles. Le formulaire de la première libre
est ouvert, sans saisie ni validation du nouveau mot de passe par l'agent.
Le compte dédié, le rattachement du sous-domaine et le dossier restent à qualifier.

L'activation demande un nouveau mot de passe et sa confirmation. Le responsable
effectue cette saisie et clique sur « Continuer » directement dans cPanel ; aucune
valeur de secret n'est conservée. La lune préparée et l'observation datée sont dans
`hostingPreference` du suivi, puis présentées dans la fiche générée.

## Informations à établir
| Élément | État observé | Action nécessaire |
|---|---|---|
| Hébergeur et destination | o2switch ; lune gratuite disponible, activation préparée | Activer la lune puis qualifier son compte dédié |
| URL exacte et certificat | Adresse demandée consignée ; DNS/HTTPS et routage non vérifiés | Créer et qualifier le sous-domaine retenu après vérification de la lune |
| Répertoire cible réel | TBD | Vérifier le document root et sa séparation du site public |
| Compte/mode d'accès | Session cPanel du compte principal vérifiée ; compte dédié non activé | Vérifier ensuite l'accès à la lune et son chemin, sans valeur de secret dans Git |
| Protection de consultation | TBD, sas CONNECT absent | Définir et vérifier accès privé/CONNECT avant une consultation distante |
| Contenu existant / isolation | TBD | Prouver vacuité et isolation, ou sauvegarde restaurée du contenu présent |
| Retour arrière | Non testé | Préparer un retour au candidat précédent puis le répéter sur la cible dédiée |
| Procédure/workflow Passeport Immo | Préparation locale disponible, installation distante non qualifiée | [Préparer le lot privé](../workflows/preparer-preproduction.md), puis adapter l'installation aux accès constatés |
| Accord du candidat précis | Absent | Présenter URL, effet, SHA source et archive avant demander l'accord exact |
| Recette de la cible | Non réalisée | Contrôler accès, navigation, persistance, import et PDF sur la cible réelle |

Les valeurs de secrets doivent rester hors des fichiers et de la conversation.
Les accès/workflows des autres applications ne démontrent pas ceux de cette cible.
Le prototype conserve une connexion simulée et un stockage dans le navigateur :
la protection de la préproduction doit être réellement définie avant publication.

## Suivi et prochaine action
Les champs machine-readable de la cible restent dans `developmentWorkflow.targets`.
Cette fiche décrit leur qualification ; elle ne maintient pas une deuxième liste de
statuts. Prochaine action : le responsable termine l'activation dans le formulaire
ouvert ; vérifier ensuite le compte de la lune, le rattachement du sous-domaine,
le répertoire et la protection.
Préparer ensuite le lot CONNECT et la procédure correspondante. Exécuter le contrôleur du skill sur
les preuves actualisées ; obtenir ensuite l'accord exact avant l'action distante.

Le lot local et sa répétition de restauration sont consignés dans
`developmentWorkflow.preproductionPreparation`. Ils ne qualifient ni vacuité,
ni isolation, ni sauvegarde restaurée de la cible distante.
