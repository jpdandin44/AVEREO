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
La lune préparée est ensuite constatée active et son cPanel est accessible ; aucune
valeur de secret n'est saisie ou conservée par l'agent. L'observation datée du compte,
du répertoire de base et de la disponibilité restante est dans `hostingPreference`
du suivi, puis présentée dans la fiche générée.

## Diagnostic du navigateur et choix de rattachement
Dans le panneau Codex de 817 pixels de large, Mon Univers Web affiche « Pour utiliser
l'application, veuillez passer sur ordinateur ». Le test à 1280 pixels rend la liste
des lunes accessible. Le réglage temporaire est retiré après le contrôle. Chrome
n'est pas exposé aux outils de cette session ; son affichage n'a pas été inspecté.

La lune ne propose que son domaine technique dans l'outil Sous-domaines. La
[règle publiée par o2switch](https://blog.o2switch.fr/creer-un-sous-domaine-o2switch-a-quoi-ca-sert-et-comment-le-configurer/)
impose qu'un sous-domaine reste dans le même compte que son domaine parent.
Le responsable choisit donc de conserver l'adresse demandée dans le compte qui
héberge `avereo.fr`, avec un dossier dédié et protégé. La lune active est conservée ;
elle n'est pas retenue comme cible de cette adresse.

Le retour au compte principal rencontre un jeton de session invalide, puis cPanel
demande une reconnexion pour cookie invalide. Le formulaire de connexion est laissé
au responsable. Aucun dossier ni sous-domaine n'est créé pendant ce contrôle.

## Informations à établir
| Élément | État observé | Action nécessaire |
|---|---|---|
| Hébergeur et destination | o2switch ; compte parent choisi, lune active distincte de la cible | Reconnecter le compte parent puis qualifier le dossier dédié |
| URL exacte et certificat | Adresse demandée consignée ; DNS/HTTPS et routage non vérifiés | Créer et qualifier le sous-domaine dans le compte parent |
| Répertoire cible réel | TBD | Vérifier le document root et sa séparation du site public |
| Compte/mode d'accès | Compte parent identifié ; session à reconnecter | Vérifier l'accès authentifié avant création, sans valeur de secret dans Git |
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
statuts. Prochaine action : reconnecter le compte parent, préparer un dossier dédié
fermé aux visiteurs, puis créer le sous-domaine vers ce dossier. Vérifier le répertoire,
la protection effective, DNS/HTTPS et la récupération avant tout déploiement.
Préparer ensuite le lot CONNECT et la procédure correspondante. Exécuter le contrôleur du skill sur
les preuves actualisées ; obtenir ensuite l'accord exact avant l'action distante.

Le lot local et sa répétition de restauration sont consignés dans
`developmentWorkflow.preproductionPreparation`. Ils ne qualifient ni vacuité,
ni isolation, ni sauvegarde restaurée de la cible distante.
