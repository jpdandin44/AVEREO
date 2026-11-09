---
project: avereo-app-projet
document_type: technical-guide
title: Qualification consultative des preuves et rafraîchissement GitHub
status: active
version: git
created: 2026-11-09
updated: 2026-11-09
owner: jpdandin
tags: [preuves, criteres, github, preproduction, prive]
---

# Qualification des références et rafraîchissement GitHub

## Liens HTTPS et confidentialité de l’export

Le filtre Windows exige une lettre de lecteur qui ne soit pas la fin d’un identifiant/schéma (`A-Za-z0-9+.-`). Il ne masque donc plus le `s:/` final de `https://`. Les liens GitHub PR, commits et CI gardent leurs octets, y compris requête et fragment ; les chemins physiques Windows et `/home/...` restent masqués. Le test `development-snapshot.test.mjs` passe par l’export complet avec des sources consultatives, vérifie aussi les liens imbriqués et la non-copie implicite des preuves. La signature, la séquence croissante, les permissions privées et le contrôle propriétaire/global restent inchangés. Une projection ancienne n’est pas réparée sur place : exporter/publier une nouvelle séquence après tests/CI et accord ciblé, en conservant l’historique pour retour arrière.

## Frontières

Ce complément du [cockpit](coherence-github-locale.md) conserve les quatre phases et les validations d’origine. Les sources réelles restent consultatives ; ni le rapprochement d’un fichier ni une fusion GitHub ne constitue une acceptation humaine. Aucun code n’est installé par ce lot.

Les qualifications et observations réelles restent dans le dossier privé de pilotage, hors du dépôt public et du frontend. Les fixtures et exemples de tests ne contiennent aucun identifiant/secret réel.

## Preuves qualifiées et contexte des critères

Le registre peut déclarer `evidenceQualificationFile`, fichier JSON privé portant `schema: development-evidence-qualification`, `observedAt` et `views` indexées par identifiant de suivi.

Chaque entrée est liée au SHA-256 exact de son JSON source. Chaque résolution de preuve exige l’identifiant de preuve, sa déclaration textuelle d’origine inchangée et, si le fichier est présent, un triplet explicite `resource.root/file/sha256`. Le lecteur refuse traversées, liens symboliques, mauvais type, taille excessive ou empreinte modifiée. Il n’accepte jamais un chemin fourni par le navigateur. L’exception est limitée au fichier précisément qualifié ; elle n’ouvre pas une exploration du dossier voisin.

Si la source a changé, les rapprochements sont ignorés et annoncés à requalifier. Une pièce modifiée reste indisponible ; aucun fichier n’est réparé ou fabriqué. La qualification n’altère pas le statut et le candidat déclarés des anciens contrôles.

Les critères sans `proofIds` peuvent exposer `contextProofs`, explicitement identifiés **contexte documentaire, non concluant**. Les `proofIds`, empreintes de critères, décisions et accords historiques restent inchangés. Le lecteur ne transforme pas un document de phase en preuve d’acceptation ; `canApprove` ne bénéficie pas des liens de contexte. Les critères de recette hébergée restent en attente de contrôles sur la cible réelle.

## Rafraîchir GitHub sur le poste

Deux actions distinctes :

- **Actualiser la vue** relit les fichiers locaux sans collecte distante.
- **Rafraîchir GitHub** déclenche explicitement une collecte GET, uniquement pour les dépôts/périmètres du registre privé. Il ne lance ni git pull, merge, compilation, déploiement, agent ou revue.

La route locale `POST /local-developments/github-refresh` exige session privée, origine exacte, CSRF et corps vide. Aucun paramètre de dépôt/URL/commande fourni par le navigateur n’est accepté. Sans configuration, l’action est désactivée/refusée. Les autres comptes et requêtes anonymes restent refusés avant lecture.

Configuration opérateur : `githubObservationFile` hors frontend et `githubRefresh: {enabled: true, provider: gh_stored, repositories: [...], minimumIntervalMs: 30000}`. Le fournisseur utilise la connexion GitHub CLI déjà stockée pour `github.com`, sans afficher ou copier le jeton. Les variables de jeton héritées sont retirées du seul sous-processus ; aucun identifiant n’est modifié. Une connexion absente/invalide produit une erreur, pas une nouvelle authentification automatique.

Le collecteur actualise main, son arbre de contenu, le dernier commit de chaque application, les PR déclarées, les PR ouvertes et leurs contrôles. Il présente les dernières fusions trouvées parmi les trente dernières PR fermées examinées par dépôt : fenêtre bornée, pas inventaire exhaustif. Les références requises proviennent des suivis raccordés ; les métadonnées historiques non requises sont élaguées, sans toucher aux suivis.

Verrou d’exécution, délai minimal, construction complète puis remplacement atomique évitent les écritures concurrentes ou partielles. Une erreur réseau, un arbre tronqué, un changement de main pendant la collecte ou une observation modifiée en parallèle conserve le fichier précédent et annonce l’échec. La date de lecture ne remplace pas la date de dernière collecte réussie. Aucune synchronisation périodique n’est installée.

Commande depuis le dépôt, en remplaçant le chemin privé :

```powershell
node architecture-v1/avereo-app-projet/workflows/refresh-development-github.mjs --registry CHEMIN_PRIVE_DU_REGISTRE
```

## Préproduction : publication privée, pas de jeton sur l’hôte

Le lecteur PHP reste GET uniquement, propriétaire exact ET rôle global frais, sans écriture de suivi ou collecte GitHub depuis l’hébergement. L’interface en mode hébergé ne présente pas le bouton local actif.

Le poste opérateur peut rafraîchir GitHub, puis exporter/publier une nouvelle projection signée par le canal privé à qualifier. `githubSnapshot`, les observations par suivi, les contextes documentaires et les versions sont transmis dans la projection. Le Node de consultation et le lecteur PHP conservent ces champs. Les pièces sans phase sont sélectionnables explicitement, avec même vérification d’intégrité. Sans sélection opt-in, aucune preuve réelle n’est copiée.

Le module préparé affiche l’observation publiée et sa date ; il ne promet pas une collecte autonome lorsque le poste est éteint. Une collecte serveur/planifiée et son identité de service constitueraient un lot distinct, avec autorisations et secrets dédiés à qualifier.

## Installation future et essais attendus

La [préparation de préproduction](preproduction-developpements.md) reste la procédure de référence. Le paquet de code est séparé, désactivé et sans donnée réelle. Sa préparation/PR ne vaut pas accord d’installation.

Avant recette hébergée : requalifier identité/propriétaire/rôle, chemins privés, canal de publication et horloges ; sauvegarder puis tester la restauration ciblée ; protéger le module du workflow public `--delete` ; choisir les pièces privées et leur publication. Installer seulement après accord exact. Vérifier alors propriétaire réel, refus de tout autre profil et accès direct, deux navigateurs, persistance PC éteint, publication fraîche, panne/retard et conservation du Gantt/projets clients. Aucune de ces vérifications hébergées n’est déduite des tests locaux.

## Tests

`development-evidence-qualification.test.mjs` couvre fichiers exacts, source/fichier modifiés, confinement, contexte non concluant et export sans copie implicite. `development-github-refresh.test.mjs` couvre dernière fusion, périmètres, échec, concurrence, données tronquées et confidentialité du fournisseur CLI. Les tests HTTP couvrent session/origine/CSRF/corps fermé et collecteur absent. Les tests de projection couvrent aussi les fusions et une preuve sans phase sélectionnée, dans les lecteurs Node et PHP.

Les suites existantes d’habilitation, lecture seule, stockage, anti-rejeu, construction privée et exclusion du build public restent obligatoires. Aucun compte ou suivi réel n’est approuvé par ces fixtures.
