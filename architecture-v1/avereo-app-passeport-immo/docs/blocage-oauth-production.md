---
project: avereo-app-passeport-immo
document_type: incident-and-proposal
title: Blocage OAuth de la recette de production et correctif proposé
status: active
version: git
created: 2026-10-16
updated: 2026-10-16
owner: jpdandin
tags: [production, oauth, drupal, maintenance]
---

# Blocage OAuth de la recette de production et correctif proposé

La [préparation actuelle du fournisseur](../api/oauth-provider-preparation-observation.json) distingue les preuves historiques ci-dessous et la progression courante. Les quatre lots de sécurité et les deux fichiers OAuth du site sont livrés en préproduction : audit actif sans alerte, 887 routes comparées, 23 contrôles de rendu natif, trois réponses exactes sous maintenance et six sondes TLS/Basic401. Revoir le site de préproduction et la PR opératoire Drupal nº25 avant la production conditionnelle déjà autorisée, avec nouvelle sauvegarde restaurée. La nouvelle connexion CONNECT préproduction et l’accès aux deux applications sont confirmés dans le chat coordonné. La recette de production CONNECT/dandin/SCI reste à terminer ; activation, neuf documents SCI et sauvegarde Passeport sont conservés. La source OAuth nº22 est déjà fusionnée humainement dans la branche Gin ; cette acceptation est conservée, sans la convertir en revue du site.

Les [opérations du site sont suivies dans la PR nº25](https://github.com/jpdandin44/avereo-site-drupal/pull/25), et la source OAuth unique dans la [PR nº22](https://github.com/jpdandin44/avereo-site-drupal/pull/22). La PR nº21 est fermée comme doublon, avec ses preuves historiques conservées.

## Faits observés le 16 octobre

L’activation privée est exécutée par le responsable à 10:44:23 UTC : compte CONNECT
`dandin`, stockage serveur actif, rôle inchangé, autre compte existant refusé.
Le premier vrai déclenchement cron réussit à 10:45:02 UTC : quatre tables et neuf
documents contrôlés, restauration temporaire réussie. L’entrée de qualification
est retirée à 10:45:51 UTC ; les autres tâches sont conservées.

La recette HTTPS de l’application réussit à 10:52:13 UTC : 57 assertions, deux
sessions signées indépendantes, seize fichiers applicatifs vérifiés, neuf documents
téléchargés et comparés dans chaque session. Refus anonymes, ticket invalide et
rejoué, origine/CSRF manquants, révision périmée et retrait du cookie à la déconnexion
sont vérifiés. Les lignes métier restent identiques. Ces tickets sont émis par la
classe réelle CONNECT pour le compte déjà autorisé ; ce test ne prouve pas OAuth.

Le navigateur atteint CONNECT, puis le fournisseur d’identité AVEREO. La connexion
native de `dandin` à Drupal réussit avec la connexion déjà enregistrée, sans restitution
de secret. Le retour CONNECT échoue ensuite avec `OAUTH_UPSTREAM_REJECTED`.
Le journal applicatif limité à ses champs non sensibles donne `token_exchange`,
statut 503, `transportError: false`. Le service visé est `/oauth/token` sur avereo.fr.
La maintenance publique reste active. Aucun réglage du site n’a été modifié.

Les définitions réellement installées de `/oauth/authorize`, `/oauth/token` et
`/oauth/userinfo` n’ont pas l’option `_maintenance_access`. Le code Drupal installé
confirme que cette option rend une route disponible pendant la maintenance, sans
changer ses propres contrôles d’accès. Cette absence explique le blocage proposé
à corriger ; l’exécution OAuth complète devra confirmer le résultat après installation.

## Correctif concret proposé, sans installation

Deux nouveaux fichiers pour le module existant `avereo_rapport_oauth` :

- [Déclaration du service](../workflows/propositions/oauth-maintenance/modules/custom/avereo_rapport_oauth/avereo_rapport_oauth.services.yml).
- [Abonné aux trois routes](../workflows/propositions/oauth-maintenance/modules/custom/avereo_rapport_oauth/src/Routing/MaintenanceOauthRouteSubscriber.php).

L’abonné ajoute seulement `_maintenance_access: true` aux trois noms de routes
attendus, après vérification de leur chemin exact. Les contrôleurs, méthodes,
permissions, exigences et l’authentification OAuth restent identiques. La page
d’accueil, les routes d’administration et les autres pages ne sont pas ouvertes.
Aucun secret, compte, rôle ou schéma n’est modifié. Aucun fichier contrib n’est édité.

Le [qualificateur privé](../workflows/propositions/oauth-maintenance/qualifier-proposition.php)
est exécuté à 10:59:04 UTC avec les vraies classes Drupal/Symfony installées :
27 assertions réussies, trois routes ciblées, quinze autres routes inchangées,
chemin non conforme refusé. La collection est en mémoire ; aucun démarrage de la
base Drupal, cache reconstruit, route active ou fichier du site modifié.
Cette preuve isolée ne constitue ni un déploiement ni une recette OAuth complète.

Cette proposition est conservée comme source native dans le présent dossier de
reprise. L’intégration est maintenant faite dans la branche propre du site Drupal ;
la proposition examinée reste figée et identique. La
[PR nº21](https://github.com/jpdandin44/avereo-site-drupal/pull/21) porte les sources
et leur test de 66 assertions ; elle n’est pas une preuve de livraison.

## Accord et suite nécessaires

L’accord D06 de Passeport Immo reste acquis. Le correctif touche cependant une
autre application et sa cible d’identité. Les [instructions du site Drupal](<C:/Users/examg/Documents local/avereo-site-drupal/AGENTS.md>)
imposent de « demander validation avant tout élargissement significatif » et une
validation humaine explicite avant déploiement. L’accord sur les seules routes
est maintenant acquis. Le responsable autorise aussi les quatre correctifs de
sécurité en lots distincts, avec sauvegardes restaurées, qualification en
préproduction puis production si les contrôles passent, maintenance conservée.
Le précontrôle daté reste en échec avec six alertes sur quatre composants ;
l’accord reçu ne constitue pas une réussite technique ni un merge.

Après levée de ce contrôle et accords applicables : vérifier les fichiers présents
et l’activation du module,
préserver ses autres services, préparer sauvegarde fraîche et retour arrière,
intégrer la source puis qualifier en préproduction avec maintenance conservée.
Respecter les contrôles de déploiement du site avant production. Vérifier ensuite
le parcours OAuth complet, la carte CONNECT et l’accès SCI, tout en conservant le
refus public et celui des comptes non habilités. La phase humaine et le merge
restent distincts ; aucune nouvelle approbation n’est écrite par l’agent.
