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

Lors du premier retour au compte principal, un jeton de session est invalide, puis cPanel
demande une reconnexion pour cookie invalide. Le formulaire de connexion est laissé
au responsable. Aucun dossier ni sous-domaine n'est créé pendant ce premier contrôle.

## Création et contrôle de fermeture après reconnexion

Après la nouvelle connexion du responsable, le compte parent authentifié est
accessible. Le dossier dédié est créé hors `public_html`, initialement vide, puis
son enfant `public` reçoit uniquement le modèle `workflows/preproduction.htaccess`.
Le fichier est enregistré puis relu après rechargement de l'éditeur. Le sous-domaine
est ensuite créé vers ce dossier ; cPanel affiche la confirmation de création.
Les valeurs exactes et observations datées sont dans la cible canonique, présentées
par la [fiche générée](iteration-developpement.md). Les confirmations visuelles
restent dans `.local/hosting-qualification/`, hors Git et sans jeton de session dans le suivi.

Le contrôle HTTP dirigé explicitement vers l'IP constatée dans cPanel reçoit 403,
avec `X-Robots-Tag: noindex, nofollow, noarchive`. Un certificat Let's Encrypt gratuit
est simulé puis installé par validation `dns-01`, pour le seul nom demandé, sans
wildcard ni ajout des hôtes cPanel. La fermeture du dossier reste en place.

L'adresse HTTPS est ensuite ouverte normalement dans le navigateur : page 403,
sans alerte de sécurité. Un contrôle Python avec `ssl.create_default_context()`
valide le certificat et reçoit aussi 403 avec le même en-tête. Aucune validation
TLS n'est désactivée. La résolution DNS était initialement absente sur le poste et
les requêtes directes vers o2switch/1.1.1.1 expiraient ; l'accès par le nom demandé
est ensuite constaté. Cela ne mesure pas la propagation dans tous les résolveurs.
`curl` avec Schannel conserve une erreur de confiance sur ce poste ; cette limite
de l'outil est distinguée des contrôles HTTPS réussis. Aucun réglage global de
confiance du poste n'est modifié.

Cette fermeture protège l'espace de toute consultation ; elle ne fournit pas
encore un accès privé utilisable par le responsable. Aucun asset du candidat,
compte applicatif ou CONNECT n'est installé.

## Informations à établir
| Élément | État observé | Action nécessaire |
|---|---|---|
| Hébergeur et destination | o2switch ; compte parent authentifié, lune active distincte de la cible | Qualifier les accès et la récupération propres à cette cible |
| URL exacte et certificat | Sous-domaine créé ; certificat installé et HTTPS vérifié par le nom demandé | Recontrôler lors de la future installation et de la recette |
| Répertoire cible réel | Document root dédié créé hors `public_html`, déclaré dans le suivi | Conserver la séparation des chemins lors de l'installation |
| Compte/mode d'accès | Gestionnaire de fichiers et création de sous-domaines accessibles | Qualifier le mode de livraison et les droits, sans valeur de secret dans Git |
| Protection de consultation | Fermeture totale vérifiée en HTTPS ; sas CONNECT absent | Définir l'accès privé de test, faire saisir les nouveaux identifiants par le responsable puis contrôler les refus et accès autorisés |
| Contenu existant / isolation | Dossier initialement vide ; seul `.htaccess` présent après préparation, compte partagé avec le domaine parent | Qualifier l'isolation et la récupération avant accord d'installation |
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
statuts. Prochaine action : définir l'accès privé de test, qualifier la récupération
et le lot CONNECT avant installation de l'application. Le sous-domaine existe et
l'espace est fermé à tous. Exécuter le contrôleur du skill sur
les preuves actualisées ; obtenir ensuite l'accord exact avant l'action distante.

Le lot local et sa répétition de restauration sont consignés dans
`developmentWorkflow.preproductionPreparation`. Ils ne qualifient ni vacuité,
ni isolation, ni sauvegarde restaurée de la cible distante.
