---
project: avereo-app-projet
document_type: feature-guide
title: Patrimoine et qualité — inventaire privé PQ-01
status: active
version: git
created: 2026-11-12
updated: 2026-11-12
owner: jpdandin
tags: [cockpit, patrimoine, inventaire, local, lecture-seule]
---

# État réalisé

PQ-01 est développé localement sur une branche dédiée ; aucune installation en préproduction ou production. Les lots suivants (rapprochement de versions/preuves, récupération, résultats de tests, bugs/améliorations, qualité documentaire) restent distincts.

Dans Développements, **Patrimoine & qualité** ouvre quatre rubriques : Synthèse, Par application, Dossiers & ressources, Sources & limites. Les cartes ouvrent leur liste justificative, avec source, date et signification. Les applications peuvent revenir vers leurs développements et les quatre phases existantes. Vue d'ensemble conserve le parcours antérieur.

Le module existant conserve toutes ses barrières d'accès. En hébergement préparé, le propriétaire exact et le rôle global sont contrôlés avant API/assets ; consultation seule. En revue locale via le lanceur privé du poste, la capacité Windows ne constitue pas une attestation CONNECT : le bandeau le précise. Ne pas exposer ce serveur sur le réseau ou un tunnel.

Le détail applicatif compte également les noms de fichiers admissibles suivis dans l'index Git du clone (`git ls-files --stage`), avec sous-comptes Markdown/fichiers sous tests/prompts. Ce n'est pas un parcours récursif du disque, ni un accès au contenu des blobs, ni une preuve d'existence/intégrité/livraison du fichier. Les liens, fichiers non suivis, dépendances et noms sensibles sont exclus. Les sites extérieurs au clone restent explicitement non inventoriés, pas à zéro ; RGA et Rapport peuvent partager un fichier sans doubler le total global. Un index indisponible ou partiel ne produit pas de total applicatif garanti.

## Sources et comptages

Le collecteur lit explicitement : registre consultatif, catalogue des références, inventaire des copies/sources canoniques et inventaire des emplacements de sauvegarde. Les applications sont dédupliquées par identifiant ; chemins privés des copies/sources/sauvegardes dédupliqués sans distinction de casse ou séparateur Windows, puis pseudonymisés. Les listes ne lisent jamais le contenu des copies ou archives externes.

Un scan de **métadonnées** couvre seulement les dossiers du parent autorisés par le code : `api`, `data`, `docs`, `prompts`, `scripts`, `tests`, `workflows`. Les noms relatifs admissibles sont listables ; aucun contenu de fichier n'est ouvert par ce scan. Pas de parcours récursif de `depot`, `versions`, `developpements`, `sauvegardes`, dépendances ou sorties générées. Liens et jonctions ne sont pas suivis ; la profondeur et le nombre de fichiers sont bornés. Les noms sensibles/dotfiles et extensions non admises sont exclus. Une branche tronquée produit un inventaire partiel, pas un total garanti.

Les cartes « tests exécutés », « bugs » et « améliorations livrées » sont explicitement non raccordées, valeur `null`. Les fichiers sous `tests` ne sont jamais convertis en cas de tests réussis. Les sauvegardes indiquent uniquement des emplacements repérés, pas leur intégrité ou restaurabilité.

## Collecte et lecture explicites

Depuis la racine applicative, avec un dossier de sortie privé préparé hors Git et hors frontend :

```powershell
node workflows/collect-development-patrimony.mjs --root "C:/Users/examg/Documents local/AVEREO-reference" --registry "CHEMIN_REGISTRE_PRIVE" --output "DOSSIER_PRIVE/inventaire-neuf.json"
```

La sortie doit être neuve : aucun écrasement silencieux. Sous Windows utiliser un dossier privé protégé selon `workflows/development-private-directory.mjs`, déjà employé par les lanceurs. Ne pas placer la projection sous `frontend`, même en local. Le collecteur n'installe rien, ne fetch/pull pas Git, n'exécute pas de test et ne restaure rien.

La copie privée du registre configure `patrimonyObservationFile` avec ce chemin. `start-portfolio` transmet cette option au magasin consultatif. Actualiser lit ce fichier, sans nouvelle collecte. En cas d'absence, format invalide ou lien non canonique, le patrimoine est indisponible sans faire disparaître les autres suivis. Une ancienne copie saine n'est pas inventée ; la collecte ratée n'écrase pas la dernière sortie.

## Projection signée et compatibilité

L'export privé peut transporter le champ optionnel `patrimony`. Le validateur Node et le lecteur PHP le bornent et refusent champs annexes, chemins privés, valeurs négatives, incohérences liste/total et doublons. Les anciennes projections sans ce champ restent lisibles. Le champ utilise le même endpoint `state` et les mêmes contrôles de session/rôle ; aucune nouvelle route publique ou lecture du disque PC par PHP.

Les phases, critères, preuves et validations ne sont pas calculés depuis l'inventaire et ne sont pas modifiés. Aucune fonction d'écriture, suppression, restauration ou déploiement dans cette vue.

## Vérifications et réserves

Le 12 novembre 2026 : **326 tests Projet réussis**, dont dix nouveaux tests ciblés, compilation et contrôle de séparation des 23 fichiers publics réussis, syntaxe PHP vérifiée. Recette visuelle locale : synthèse, filtre Rapport et fichiers suivis, retour vers Rapport V1.2 et ses quatre phases, listes de dossiers/recherche et sources/limites. Pas de débordement horizontal observé à 1265 pixels. [Reçu de qualification](../data/qualification-patrimoine-pq01.json) et [capture locale](illustrations/patrimoine-pq01-local.png). Ces résultats ne valent ni CI distante, ni qualification CONNECT réelle, ni validation humaine.

Le registre local contient 47 suivis avec PQ-01 ; les 46 vues de la publication 12 en préproduction ne sont pas modifiées. Le candidat et son paquet sont locaux et non committés ; `sourceSha` reste nul, base main `831dda19deb3d5c70d1307b42ac5d8abac22422f`. Un manifeste de paquet n'est pas une preuve d'installation.

Tests : déduplication, source absente/malformée, zéro distinct d'inconnu, exclusions/liens/quota, contrat fermé, aller-retour Node/PHP, projection historique et refus anonyme/autre compte/rôle perdu/POST avant lecture. Tests d'interface : cartes, listes justificatives, recherche, inventaire absent et partialité ; suite Projet et séparation du build public.

La date de collecte n'est pas une nouvelle qualification des données anciennes : chaque indicateur conserve sa date de source. Les chemins pseudonymisés doivent être rapprochés des inventaires locaux par leur identifiant/empreinte ; ils ne permettent pas d'ouvrir le disque à distance. Une classification exhaustive des documents/prompts/données et les preuves de récupération relèvent des lots suivants.

L'installation des dépendances verrouillées a remonté quatre alertes existantes (une modérée, trois hautes : esbuild, nanoid, source-map-js et Vite). Aucune nouvelle dépendance ni modification du lockfile dans PQ-01 ; pas de `audit fix --force`. Qualification de la correction nécessaire avant toute nouvelle exposition/livraison ; une réussite des tests ne lève pas cette réserve de sécurité.

[Contrat des métadonnées](../api/patrimoine.md) · [Suivi canonique du lot](../data/suivi-patrimoine-pq01.json).
