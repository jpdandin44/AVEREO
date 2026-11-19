---
project: avereo-app-projet
document_type: integration
title: Actualisation automatique privée du cockpit
status: active
version: git
created: 2026-11-19
updated: 2026-11-19
owner: jpdandin
tags: [cockpit, actualisation, github, preproduction, prive]
---

# Cadrage

La publication ponctuelle et le lecteur de PR172 ne collectaient pas les nouvelles données. Le bouton Actualiser relisait leur photographie signée ; la date du clic ne prouvait aucune nouvelle observation GitHub. Ce lot prépare une tâche privée permanente sur la seule préproduction, sans route navigateur d'écriture, modification de validation ni intervention en production.

Décision du responsable du 19 novembre : **GitHub automatique seulement, aucun relais automatique sur le PC**. Les suivis privés sont admis initialement comme copie datée des sources existantes ; ils ne deviennent pas une nouvelle autorité et leur dernière réception reste distincte du contrôle GitHub. Un travail non transmis ou non committé ne peut pas être découvert par l'hébergement. Le service ne prétend donc pas actualiser automatiquement ces fichiers du poste, les critères métier ou les validations humaines.

# Développement local

`workflows/development-private-publisher.mjs` est un opérateur données seules, activé explicitement par une configuration privée. Il ne lance aucun déploiement et ne possède aucune action de revue. Une exécution :

1. contrôle les chemins privés, les permissions, les zones distinctes, le reçu d'admission et les empreintes des sources consultatives ;
2. collecte les observations GitHub complètes sur les dépôts autorisés, par GET HTTPS uniquement avec jeton finement limité ; toute collecte partielle est refusée ;
3. construit la projection et refuse une source/cache/publication modifiée en parallèle ;
4. préserve les vues et pièces historiques ; lorsque la source est inchangée, conserve sa projection métier qualifiée et ne rafraîchit que l'observation GitHub ;
5. sauvegarde l'index et la copie active avant remplacement, puis publie sous verrou avec signature et séquence croissante ; un échec déclenche seulement un retour gardé sur le candidat exact, jamais l'écrasement d'un tiers ;
6. écrit un état opérateur signé, dépourvu de secret et de chemin privé.

Si le contenu significatif n'a pas changé, il n'y a pas de nouvelle publication : seule la date de contrôle réussi avance. La date des preuves et la réception des sources ne sont pas rajeunies par ce contrôle. L'état opérateur doit correspondre à la publication active ; un ancien état après retour arrière n'est pas présenté comme courant.

Le stockage conserve les copies courante et précédente pour le retour immédiat. À l'approche du quota existant, les copies inactives sont archivées hors du stockage actif : signature vérifiée, copie immuable écrite et relue octet par octet avant retrait du doublon actif. Aucune publication historique n'est perdue, aucun seuil anti-rejeu abaissé. Un échec d'archive conserve l'original et bloque le remplacement.

`development-publisher-status.mjs`, le lecteur PHP et le composant de fraîcheur affichent séparément : contrôle GitHub, réception des suivis, génération de la publication et contrôle du service. Un service arrêté, en échec, d'une autre séquence ou trop ancien déclenche une alerte. Actualiser ne simule plus une nouvelle collecte réussie.

## Configuration et identité

Lorsqu'une source a changé et qu'une pièce précédemment publiée n'est plus rattachable par son empreinte, l'ancienne vue et ses pièces sont conservées dans une archive nommée par la publication d'origine. Elles ne sont pas utilisées pour qualifier les nouveaux critères. Un inventaire du poste déjà publié conserve sa date ; une collecte GitHub ne constitue pas une nouvelle inspection du disque.

Le [modèle désactivé](../workflows/templates/development-private-publisher.example.json) n'est jamais une preuve d'installation. Les chemins réels, registre, sources, cache, pièces et secrets restent hors Git et hors des racines web. Le jeton GitHub est dédié aux seuls dépôts retenus, avec Contents, Pull requests, Actions et Metadata en lecture seule, aucun droit de compte. Il n'est ni copié depuis le navigateur par l'agent, ni placé dans la CI, un argument de commande ou un journal. Son expiration impose un renouvellement ; une erreur d'authentification rend le statut en défaut sans effacer les données.

La tâche utilise le compte d'hébergement existant : les restrictions du programme et les permissions de fichiers ne constituent pas une isolation Unix indépendante entre applications de ce compte. Aucun nouvel utilisateur système, rôle CONNECT ou droit d'autre profil n'est créé. L'accès web reste contrôlé par le compte propriétaire exact et le rôle global frais du pont existant. Aucun service WSGI ou nouveau point d'entrée public n'est nécessaire pour cette tâche planifiée.

# Préproduction

L'installation est autorisée par la demande directe du responsable du 19 novembre, sur Projet préproduction seulement. Elle reste à effectuer et vérifier tant que le reçu privé de livraison ne l'établit pas. Prérequis : tests/CI du candidat exact, configuration privée contrôlée, jeton déposé par le responsable, sauvegarde fraîche, installation et restauration répétées sur copie, puis contrôle du passage.

L'opérateur est installé séparément du paquet web ; seuls le lecteur PHP et les assets privés concernés sont remplacés. Les configurations d'authentification, fichiers clients et autres composants runtime sont préservés. Le cron doit utiliser le chemin réel du moteur installé, pas présumer sa présence dans PATH. La fréquence prévue est cinq minutes ; une exécution concurrente est refusée. Ne pas lancer le workflow de production pour installer ce lot.

Recette nécessaire après installation : collecte réelle et publication relue, contrôle propriétaire via CONNECT, refus anonyme/autre profil et méthode non GET, puis **exécution indépendante par le planificateur** avant de déclarer l'actualisation automatique opérationnelle. Laisser les quatre cases humaines de la PR au responsable.

Retour : arrêter uniquement l'entrée planifiée ajoutée par ce lot, vérifier les empreintes et restaurer le lecteur/assets sauvegardés. Restaurer la projection précédente sous garde en conservant le seuil haut ; ne pas restaurer une base ou des fichiers clients. Préserver les nouvelles données reçues et les autres tâches planifiées.

# Mise en production

Aucune installation, ouverture ou autorisation de production. Les livraisons applicatives déclarées dans les suivis ne sont pas revérifiées par une collecte GitHub. Le [suivi de ce lot](../data/suivi-actualisation-automatique.json) conserve les quatre phases et la portée des preuves.
