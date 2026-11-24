---
project: avereo-app-projet
document_type: corrective-contract
title: Cockpit — accès aux développements et environnements des sites
status: active
version: git
created: 2026-11-24
updated: 2026-11-24
owner: jpdandin
tags: [cockpit, acces, sites, preproduction]
---

# Accès aux développements et références des sites

## Constat et correction locale

Le 24 novembre, le responsable signale la perte d’accès aux développements et
l’absence d’adresses explicites pour Site AVEREO et TC Longages. Le cockpit privé
répond HTTP 403 après un retour CONNECT réussi vers Projet. Le planning reste
accessible. Ce constat ne permet pas à lui seul d’identifier la cause serveur.

Le registre anti-rejeu CONNECT comporte une limite 4096 sans récupération des
fichiers expirés dans la version antérieure. Ce mécanisme reproduit localement un
refus durable à saturation. Le diagnostic de son contenu hébergé reste à faire
dans cPanel : aucune saturation réelle n’est affirmée avant ce contrôle.

Le correctif `NonceStore` récupère seulement les fichiers réguliers de nom et
contenu valides expirés depuis plus de cinq secondes, sous verrou. Il maintient
la limite 4096, la création exclusive et les permissions privées. Les jetons
actifs, entrées malformées et liens sont conservés. Le propriétaire exact, les
signatures, le contrôle frais du rôle Drupal et le refus des autres profils sont
inchangés. [Contrat du pont](../../avereo-app-connect/api/developments-authorization.md).

## Références visibles des sites

Le [catalogue JSON](../data/cockpit-projects.json) devient aussi la source des
références HTTPS et de leur dernier constat HTTP ponctuel. Les adresses et les
badges sont visibles sans ouvrir les détails des deux fiches. Les constats du
24 novembre à 09:04 heure de Paris indiquent : accueil AVEREO en maintenance
(503), accueil TC Longages en ligne (200), deux préproductions protégées par
authentification HTTP (401). TLS vérifié, aucune redirection suivie ni aucun
identifiant envoyé. Les sites eux-mêmes ne sont pas modifiés.

Chaque état est daté et présenté comme un dernier constat. Aucun contrôle
continu n’est installé. Une réponse HTTP ne prouve ni la version installée,
ni les parcours authentifiés, ni une recette humaine. Une actualisation ultérieure
doit vérifier les adresses et mettre à jour les observations du catalogue.
Les reçus de livraison précédents restent dans « Versions, preuves et sources ».

Les autres fiches, le nombre initial de douze projets, l’historique des prototypes,
l’inventaire complet et l’admission après première préproduction sont conservés.
Le stockage signé, ses lecteurs et le publicateur ne changent pas.

## Vérifications et limites

Tests : saturation avec 4096 empreintes expirées, conservation de 4096 empreintes
actives, refus du rejeu, marge d’expiration, contenu invalide, concurrence, liens
symboliques sur POSIX ; contrôles broker/Drupal sur fixtures. Tests de projection :
quatre références visibles sans inventer de reçu ni modifier les sources ; états
HTTP incohérents et adresses contenant des secrets refusés.

Qualification locale : 418 tests Projet réussis, dont les contrôles de paquet privé et de refus anonyme ; 20 assertions du registre anti-rejeu sous Windows, 41 du broker et 15 du contrôleur Drupal sur doubles ; régression CONNECT 44/44. Le build public et le contrôle de son contenu réussissent. Sur la copie fictive, ouverture du suivi Site AVEREO puis passage à TC Longages vérifiés ; quatre phases et consultation seule conservées.

Les essais utilisent uniquement des identités fictives. Les résultats exacts,
le candidat et les preuves de navigateur sont dans le suivi opérationnel privé.
TBD — confirmer la cause hébergée, puis contrôler la réparation et les parcours
des vrais suivis en préproduction. Aucun succès local ne vaut accord humain.

## Quatre phases

| Phase | État du correctif |
| --- | --- |
| Cadrage | Correction demandée par le responsable. |
| Développement local | Correctif et tests préparés ; revue locale à présenter. |
| Préproduction | Diagnostic, sauvegarde et restauration sur copie à terminer ; nouveau candidat non installé. |
| Mise en production | Non engagée pour ce lot. |
