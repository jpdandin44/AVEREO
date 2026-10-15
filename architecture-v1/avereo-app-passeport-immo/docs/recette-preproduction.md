---
project: avereo-app-passeport-immo
document_type: acceptance-guide
title: Recette humaine de préproduction — PR nº80
status: active
version: git
created: 2026-10-15
updated: 2026-10-15
owner: jpdandin
tags: [recette, preproduction, cockpit, documents]
---

# Recette humaine de préproduction — PR nº80

Ce guide prépare la vérification du raccordement CONNECT, du dossier SCI, du
stockage partagé et des sauvegardes. Les résultats humains restent à renseigner
dans le [cockpit local](http://127.0.0.1:5193/), phase **02 · Préproduction**.
Prévoir environ 25 à 35 minutes selon les vérifications. Les cases du cockpit et
de la [PR nº80](https://github.com/jpdandin44/AVEREO/pull/80) restent au responsable.

## Environnement et version à examiner

Ouvrir [CONNECT préproduction](https://connect-preprod.avereo.fr/) dans Chrome,
passer la protection visiteur puis utiliser le compte CONNECT habituel retenu
pour cette recette. Ouvrir la carte **Passeport Immo**. Le domaine applicatif est
[Passeport Immo préproduction](https://passeport-immo-preprod.avereo.fr/). Le prototype sur le port local 5175
conserve ses données navigateur : il ne permet pas de recetter la base hébergée.

Le [reçu de stockage](https://github.com/jpdandin44/AVEREO/blob/feat/passeport-immo-connect-preprod/architecture-v1/avereo-app-passeport-immo/api/storage-observation.json) identifie le candidat
installé : source `7209bf3334a5f3f98d422b41d177c734970a0750`, archive
`c44f397fd03daa433f19e6d4c72127f29e55dbf9fca679e8c7f41cc207a843cf`, seize fichiers
publics relus. Les sauvegardes utilisent le lot CLI privé source
`652ef6d63cddea3e343c39a616be9cf1f9500ecd`, empreinte
`dd574fb98b8fe770f4c33c2fd2bacf76e17963c58aaa9c056e070d3326798ae1`.
La tête de PR peut avancer pour la documentation ; ces deux reçus identifient
les composants effectivement installés. Une modification de leur code exige
une nouvelle qualification du candidat concerné.

La mise « À valider » correspond à la remise technique des livrables demandée
le 15 octobre. Elle ne crée aucune approbation de phase ou autorisation de production.
Les phases Cadrage et Développement local, leurs décisions et leurs preuves restent
conservées. La séquence est **Cadrage → Développement local → Préproduction → Mise en production**.

## Livrables à lire dans le cockpit

Dans l'onglet **Livrables**, choisir successivement les six documents et cocher
« J’ai examiné cette version du livrable » après lecture :

1. **Guide de recette et revue PR nº80** : ce parcours et la correspondance des critères.
2. **Raccordement CONNECT** : entrée signée, catalogue, droits et fin de la troisième identification.
3. **Installation privée et constats datés** : chronologie des installations ; ses anciennes limites de stockage sont historiques.
4. **Installation et retour arrière** : procédure et distinction préproduction/production.
5. **Stockage privé des documents** : base, fichiers privés, contrôle des écritures, migration et preuves HTTPS.
6. **Sauvegarde automatique** : fréquence, conservation, premier succès réel, récupération et limites.

Les preuves JSON sont consultables dans [le reçu de stockage](https://github.com/jpdandin44/AVEREO/blob/feat/passeport-immo-connect-preprod/architecture-v1/avereo-app-passeport-immo/api/storage-observation.json) et [le reçu de sauvegarde](https://github.com/jpdandin44/AVEREO/blob/feat/passeport-immo-connect-preprod/architecture-v1/avereo-app-passeport-immo/api/automatic-backup-observation.json). Une preuve technique
peut être examinée sans rejouer une restauration sur les données du client.

## Critères 01 et 02 — raccordement et protections

Les deux libellés historiques CONNECT restent conservés dans le cockpit. Lire
[le raccordement](02-integration-connect.md), [le lot serveur](stockage-serveur.md)
et les reçus associés : catalogue réservé au compte choisi, deux autres comptes
refusés, session signée et ressources protégées. Sans ticket, le HTML redirige
vers CONNECT ; les assets et l'API sont refusés. Les essais de ticket invalide,
rejeu, expiration, autre propriétaire et écriture sans protection ont été réalisés
techniquement ; aucune manipulation de jeton n'est demandée au responsable.

Attendu : comprendre les preuves, vérifier leur cible et leur portée. Le contrôle
local historique ne remplace pas les essais hébergés des critères suivants.

## Critère 03 — parcours du compte habituel et déconnexion

Depuis CONNECT, vérifier que la carte ouvre l'application et que l'identité
affichée correspond au compte habituel. Aucune troisième fenêtre du navigateur
ne doit demander les identifiants visiteurs sur Passeport Immo. La protection
visiteur et l'identification CONNECT peuvent chacune être demandées si leur session
est absente ; une session encore valide peut éviter ces demandes.

À la fin des autres essais, utiliser **Déconnexion** dans Passeport Immo, puis
revenir à son adresse : le dossier ne doit plus être directement accessible.
Relancer la carte CONNECT pour revenir au dossier. CONNECT peut conserver sa
propre session ; cette déconnexion applicative n'est pas une déconnexion globale.
Au-delà de trente minutes, relancer depuis CONNECT si la session applicative expire.

## Critère 04 — dossier SCI et coupes

Retrouver le client et le bien déjà migrés. Comparer les références du bien avec
le dossier source privé. Dans **Documents**, retrouver **six documents actifs**
et **trois archives** avant les essais, avec leurs titres et catégories.
Consulter plusieurs PDF, télécharger une pièce et ouvrir le document des coupes :
ses deux pages avant/après doivent être lisibles, orientées correctement et
présenter leurs hypothèses thermiques. Les mesures et informations encore inconnues
restent signalées ; ces coupes de principe ne deviennent pas des relevés certifiés.

Ne pas renommer ni archiver les pièces du dossier réel pendant cette recette.
Une différence par rapport au dossier attendu se consigne dans le commentaire.

## Critère 05 — import, classement, doublon et archives

Créer un bien fictif avec **Créer un bien**, renseigner « RECETTE PR80 — TEST »
dans **Adresse**, puis une surface d'essai. Utiliser uniquement ce bien
pour les écritures. Le [fichier texte d'essai](../data/document-recette.test.txt)
est sans donnée client : le récupérer depuis [sa page GitHub](https://github.com/jpdandin44/AVEREO/blob/feat/passeport-immo-connect-preprod/architecture-v1/avereo-app-passeport-immo/data/document-recette.test.txt) ou le copier depuis le dépôt,
puis l'ajouter avec **Ajouter des fichiers**.

Vérifier sa consultation ou son téléchargement. Avec **Renommer ou classer**,
modifier son titre et sa catégorie, puis **Enregistrer**. Importer une seconde fois
le même fichier : un doublon doit être signalé sans deuxième document actif.
Utiliser **Archiver**, ouvrir **Archives**, puis **Restaurer**. Attendu : un document
actif au terme de cet aller-retour, avec son contenu inchangé. Conserver le bien
fictif identifié pour la trace de recette ; aucune suppression réelle n'est requise.

## Critère 06 — persistance et fenêtres concurrentes

Après chaque écriture terminée, recharger l'application : le bien fictif, son titre
documentaire et sa catégorie doivent être conservés. Ouvrir le compte habituel via
CONNECT dans une autre fenêtre privée ou un autre navigateur, puis retrouver le
dossier SCI et le bien fictif sans nouvel import. Un second onglet ordinaire
vérifie la lecture partagée, mais ne prouve pas à lui seul une session indépendante.

Pour la concurrence, ouvrir le bien fictif dans deux onglets A et B. Modifier
un champ du bien en A et attendre la fin de l'écriture. Modifier un autre champ
du même bien en B sans l'avoir rechargé : l'application doit annoncer que les
données ont changé et demander un rechargement ; elle ne doit pas écraser
silencieusement A. Recharger B et vérifier la valeur enregistrée par A.
Ce rejet est un résultat attendu. Ne faire cet essai que sur le bien fictif.

## Critère 07 — sauvegarde et récupération

Lire [le runbook de sauvegarde](sauvegarde-automatique.md) et son reçu daté.
Attendu : sauvegarde complète chaque jour à **03 h 20, heure de Paris**, conservation
des **trente dernières copies réussies**, copies privées. Le premier déclenchement
réel du 15 octobre a copié **quatre tables et neuf fichiers** ; empreintes relues
et restitution des lignes en tables temporaires vérifiées sans modifier les actifs.
Le nombre de fichiers des prochaines copies peut augmenter avec les essais.

Ce critère porte sur l'examen de ces preuves et des limites : copies sur le même
hébergement, absence de copie externe et d'alerte mail, restauration complète de
l'hébergement non qualifiée. Le reçu Git ne surveille pas les nuits suivantes ;
`latest.json` et `status.json` privés donnent le dernier résultat. Leur lecture
est décrite dans le runbook et ne nécessite aucune restauration du dossier client.

## Critère 08 — installation, limites et revue GitHub

Lire [la procédure d'installation](deployment.md), vérifier la cible privée et
les deux composants installés identifiés plus haut. Examiner
[les fichiers de la PR nº80](https://github.com/jpdandin44/AVEREO/pull/80/files) et les contrôles CI de sa
tête actuelle. Les tests de stockage, de droits et de sauvegarde sont techniques ;
la présente recette et la checklist PR sont des actes humains distincts.

Noter les réserves acceptées et les anomalies éventuelles dans le cockpit.
Si une étape échoue, ne pas cocher son critère : choisir **Demander des corrections**
et indiquer étape, résultat attendu/observé, navigateur et heure, sans secret ni
document client dans GitHub. Les captures avec données réelles restent privées.

## Enregistrer la décision

Dans **Critères**, cocher uniquement les huit critères effectivement vérifiés.
Dans **Ta décision**, choisir **Approuver la phase**, renseigner nom et commentaire,
puis confirmer et enregistrer. Le bouton exige les six lectures et les huit critères.
Le cockpit actualise les observations GitHub sans recharger la page ni effacer les
saisies. Si « Charger les nouvelles preuves » apparaît, le faire puis réexaminer
les attestations concernées avant la décision.

La PR reste à revoir et ses quatre cases restent à cocher par le responsable.
L'approbation du cockpit ne fusionne pas la PR. La phase **Mise en production**
reste non commencée ; son autorisation et toute ouverture publique restent séparées.
