---
project: avereo-app-projet
document_type: guide-utilisateur
title: Développements — espace local privé
status: active
version: git
created: 2026-11-06
updated: 2026-11-09
owner: jpdandin
tags: [developpements, local, administrateur-global, criteres, preuves]
---

# Développements — espace local privé

## Ouverture dans Chrome ou depuis un lien extérieur

Le refus JSON « Origine refusée » pouvait apparaître lors d'un clic depuis une autre application/site : le filtre intersite bloquait la navigation avant la page de connexion. La correction ne rend pas les données publiques. Seule une navigation utilisateur GET vers `/` ou `/index.html`, en document principal, sur le Host et la boucle locale attendus, sans Origin tiers, reçoit un sas HTML public sans données ni cookie. **Continuer dans ce navigateur** ouvre ensuite l'entrée locale canonique ; les API, pièces, assets, iframes, requêtes programmatiques et POST intersites restent refusés.

Pour tester :

1. Ouvrir l'adresse exacte donnée par le lanceur (`127.0.0.1`, même port). Si le sas est affiché, cliquer **Continuer dans ce navigateur**. Coller directement l'adresse dans la barre de Chrome fonctionne aussi.
2. Sans session dans ce navigateur, sélectionner le fichier `acces-administrateur.json` dont le lanceur indique le chemin local privé. Ne pas le joindre au chat ni copier son contenu.
3. Vérifier la vue d'ensemble, puis les quatre phases d'un suivi. Le portefeuille réel reste consultatif.

Une connexion dans le navigateur intégré ne connecte pas Chrome. Le bootstrap sert une seule fois au total, pas une fois par navigateur. Pour changer de navigateur quand ce fichier a déjà servi, relancer explicitement le lecteur concerné afin d'obtenir un nouveau fichier ; cela invalide aussi la précédente session. L'expiration reste d'une heure maximum. Cette correction n'installe ni SSO CONNECT, ni accès distant, ni nouveau profil autorisé. Le contexte courant du portefeuille est documenté dans le [guide](cockpit-portefeuille.md) ; les anciens ports et constats ci-dessous restent datés.

## Reprise du 7 novembre — vrais suivis en consultation privée

Après la clôture documentaire, le responsable a autorisé un [portefeuille privé local en lecture seule](cockpit-portefeuille.md), sans connexion automatique à CONNECT. Il est utilisable sur le port 5197. Cette option est distincte du SSO envisagé ci-dessous et ne qualifie aucun rôle CONNECT. Le registre réel reste consultatif ; aucun critère ou fichier métier n'est écrit.

## Périmètre réalisé

Le module **Développements** est distinct du planning et des dossiers clients. Il consulte plusieurs suivis canoniques, affiche exactement **Cadrage, Développement local, Préproduction, Mise en production**, et permet d'examiner les critères, leurs preuves et les décisions individuelles. Il ne déduit pas un pourcentage de travail d'un compteur de critères.

La réalisation du 6 novembre est **locale uniquement**. Aucun module ni aucune pièce de développement n'est ajouté au build hébergé. Aucun compte, droit CONNECT, planning client ou suivi opérationnel existant n'est modifié. Le navigateur de recette utilise exclusivement des données fictives.

## Confidentialité et limite d'identité

La politique cible est l'accès au **seul propriétaire administrateur global**, pas à tous les administrateurs globaux, administrateurs d'organisation, membres ou clients. Le serveur contrôle l'identifiant exact à chaque requête ; masquer un menu ne constitue pas la protection. Sans session autorisée, ni liste, ni critère, ni preuve, ni ressource Vite de cet espace n'est accessible.

Le ticket CONNECT inspecté ne transporte pas le rôle global. **Le rôle réel CONNECT n'est donc pas qualifié par cette version.** Le lanceur crée une capacité privée locale temporaire, attribuée au seul identifiant configuré. Cela ne vérifie ni n'accorde un rôle CONNECT. Le mode démonstration utilise l'identifiant fictif `101`.

La frontière locale suppose un poste et un compte Windows de confiance : une personne pouvant lire le fichier d'accès privé peut l'utiliser avant son titulaire. Les modes de fichiers POSIX ne prouvent pas à eux seuls les ACL Windows. Ne pas partager ce fichier, le dossier temporaire ou le poste avec un utilisateur non autorisé. Ce mécanisme local n'est pas présenté comme l'authentification hébergée définitive.

## Ouvrir la démonstration

Depuis `architecture-v1/avereo-app-projet/frontend`, avec les dépendances du projet déjà disponibles :

```powershell
npm.cmd run dev:developments -- --demo --port 5196
```

1. Ouvrir `http://127.0.0.1:5196/?developments` sur ce poste.
2. Le lanceur indique le **chemin** du fichier `acces-administrateur.json`, créé hors Git dans un dossier temporaire privé. Sa valeur secrète n'est pas affichée.
3. Sélectionner ce fichier dans **Fichier d'accès local privé**. Il sert une seule fois à ouvrir une session d'une heure au plus.
4. Choisir une application/itération, puis l'une des quatre phases.

Une fermeture de session la révoque. Un redémarrage du lanceur invalide également l'ancienne session et produit un nouveau fichier. Il faut relancer l'espace après expiration ou déconnexion. Un redémarrage en `--demo` crée de nouvelles fixtures : les décisions de démonstration précédentes ne sont pas réimportées. Les dossiers temporaires peuvent conserver des preuves de recette ; leur suppression n'est pas automatique.

L'adresse doit rester `127.0.0.1`, pas `localhost`, et le serveur ne doit pas être exposé au réseau ni placé derrière un relais. Le planning existant reste accessible par son lancement habituel ; les anciennes API locales de revue/planning sont refusées dans cet espace privé.

## Lire les preuves et décider

Chaque critère distingue résultat technique, disponibilité de la pièce, correspondance avec le candidat et décision humaine. **Ouvrir la pièce** affiche du texte ou une image autorisée ; les PDF se téléchargent. Une référence HTTPS s'ouvre séparément, sans récupération par le serveur et sans attester son accessibilité.

**Examiner** prépare une revue : commentaire obligatoire, confirmation explicite des pièces examinées, puis **Valider ce critère**, **Demander des corrections** ou **Enregistrer une observation**. Une validation est refusée si une preuve est absente, en échec, non reliée ou d'une ancienne version. Le serveur revérifie cette règle, même si le bouton est contourné.

Une décision est enregistrée dans la source canonique, avec identité locale, date et empreintes du candidat, du critère et des preuves. Elle ne valide pas la phase et n'autorise ni phase suivante, ni merge, ni livraison. Une preuve ou un candidat modifié rend l'ancienne décision « à réexaminer » sans effacer l'historique. Les approbations de phase historiques ne deviennent pas des validations individuelles.

Une modification concurrente est refusée. Le commentaire saisi reste en mémoire pour réexamen ; ne pas fermer l'onglet avant de l'avoir conservé. L'actualisation périodique est une lecture toutes les 25 secondes lorsque la page est visible et au retour de focus, pas une synchronisation GitHub continue.

## Raccorder une source privée locale

**Préparation du 7 novembre, non exécutée :** la [procédure de raccordement au seul administrateur global et aux vrais suivis](raccordement-developpements-local.md) précise l'autorité d'identité manquante, le registre fermé, le pilote en lecture seule et la matrice de refus. Le mode `--config` décrit ci-dessous reste une capacité privée locale, pas un raccordement SSO ni une preuve du rôle CONNECT réel. Ne pas l'activer sur les sources réelles avant cette qualification et une nouvelle demande du responsable.

Cette étape reste à qualifier pour les suivis réels. Le lanceur accepte `--config C:\chemin-prive\registre.json` à la place de `--demo`. Le fichier doit rester hors Git et hors frontend ; il contient `localAdministratorConfirmed: true`, `globalAdminConnectId` (chaîne de l'identifiant exact, sans valeur par défaut) et `entries`.

Chaque entrée déclare `id`, `application`, `root`, `file` et éventuellement `phaseMap`. `file` et toutes les pièces doivent rester dans `root`. Mettre `writable: false` au départ. Le registre conserve des références, pas une copie des statuts. Un schéma inconnu reste indisponible. Un ancien découpage autre que quatre phases exige un mapping explicite, sans altération de l'original.

Pour écrire, il faut **à la fois** `writable: true` dans l'entrée et `developmentReviewSchema: 1` dans la source, ainsi qu'un administrateur local configuré. Le journal `developmentReviews` est conservé dans le même JSON. Ne pas activer cela sur un suivi réel sans qualifier son contrat, les sauvegardes et les responsabilités d'écriture. Le [contrat détaillé](../api/developpements-local.md) décrit les champs et les refus.

## Vérifications et prochaines limites

```powershell
npm.cmd run test:developments
npm.cmd run build
```

Les tests incluent les refus d'accès, les deux schémas, les conflits, la fraîcheur des preuves, les écritures fictives et la sauvegarde/restauration octet pour octet. Le build vérifie l'absence du module privé et de ses API dans l'artefact public.

Avant toute préproduction : qualifier l'identité réelle du propriétaire et son rôle côté serveur, le refus de tous les autres profils, le pont vers les sources privées, les écritures et la récupération. **Aucune préproduction ni production n'est autorisée par la réalisation locale.** La recette mobile et le raccordement réel CONNECT restent à faire. Les quatre phases et les accords humains restent distincts.
