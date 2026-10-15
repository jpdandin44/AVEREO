---
project: avereo-app-passeport-immo
document_type: production-preparation
title: Préparation de la mise en production de Passeport Immo
status: active
version: git
created: 2026-10-15
updated: 2026-10-15
owner: jpdandin
tags: [passeport-immo, production, exploitation]
---

# Préparation de la mise en production de Passeport Immo

Ce dossier prépare la suite demandée après la fusion de la
[PR nº80](https://github.com/jpdandin44/AVEREO/pull/80). Il décrit les opérations
à qualifier avant leur exécution. Les statuts et accords actuels font foi dans
le [suivi canonique](suivi-chantier.json), notamment `developmentWorkflow.productionPreparation`.
La [preuve de préparation](../api/preparation-production-observation.json) conserve
les observations GitHub et les vérifications des archives du 15 octobre.

## Place dans les quatre phases

| Phase | Environnement de revue | Situation lors de la préparation |
|---|---|---|
| 0 — Cadrage | Local | Validée ; preuves conservées |
| 1 — Développement local | Local | Validée ; preuves conservées |
| 2 — Préproduction | Préproduction | PR nº80 fusionnée ; décision formelle de phase encore absente du cockpit |
| 3 — Mise en production | Préproduction pour la revue du candidat | Dossier préparé ; phase non démarrée ; contrôles après livraison sur la production réelle |

Le responsable conserve la décision de phase, l'autorisation de déploiement
sur une cible et une version précises, puis l'éventuelle ouverture aux utilisateurs.
La fusion constatée ne crée aucune de ces décisions dans le suivi.

## Candidat conservé

La PR nº80 a été fusionnée le 15 octobre 2026 à 17 h 11 min 21 s, heure de Paris.
Le commit de fusion `437f2689e8ea5a0f12e055be9e2b8713bf99b1bd` possède le même arbre
que la tête revue `74421367dadcae8de5b57636407bed45a6d74f04`.
Les workflows [CI](https://github.com/jpdandin44/AVEREO/actions/runs/38758111043)
et [Passeport Immo CI](https://github.com/jpdandin44/AVEREO/actions/runs/38758111947)
ont réussi sur ce commit.

L'archive publique téléchargée depuis cette dernière CI contient 16 fichiers,
relus par CRC, taille et SHA-256. Son empreinte est
`c44f397fd03daa433f19e6d4c72127f29e55dbf9fca679e8c7f41cc207a843cf` : elle est identique
à celle du [reçu de stockage en préproduction](../api/storage-observation.json).
Le suivi conserve donc le candidat installé, source `7209bf3334a5f3f98d422b41d177c734970a0750`,
et référence séparément la provenance de `main`. Aucun nouveau build n'est requis
pour cette préparation documentaire. Toute modification des octets exige une
nouvelle qualification.

Copie locale vérifiée : `.local/production-preparation/main-437f268/candidate.zip`
et `candidate.manifest.json`. Ne pas utiliser par défaut l'ancien `.local/candidate.zip`.
L'artefact CI est nommé `passeport-immo-437f2689e8ea5a0f12e055be9e2b8713bf99b1bd`,
identifiant `11984422099` ; la copie locale évite de dépendre de sa rétention GitHub.

Le lot privé de sauvegarde est séparé : `bundle.json` et `bundle.manifest.json`
dans le même dossier local, empreinte
`dd574fb98b8fe770f4c33c2fd2bacf76e17963c58aaa9c056e070d3326798ae1`.
Il contient les trois outils PHP de sauvegarde et `storage.sql`, hors archive publique.
Les quatre contenus sont vérifiés contre leur manifeste et les sources fusionnées.
Ce lot ne contient aucune configuration ni donnée du serveur.

## Qualification de la cible

La cible de production est **TBD — non qualifiée**. L'adresse
`https://passeport-immo.avereo.fr` est une proposition soumise au responsable,
sans création de domaine ni constat de disponibilité. La cible reste non prête
dans le cockpit tant que les éléments suivants n'ont pas leurs preuves.

| Élément à établir | Résultat attendu avant installation |
|---|---|
| Adresse, compte d'hébergement, document root | Cible exacte confirmée ; inventaire en lecture seule ; vacuité ou contenu existant établi |
| DNS, TLS, Apache/PHP | HTTPS valide, réécriture et restrictions actives, extensions MySQL et limites d'envoi compatibles |
| CONNECT de production | URL, version hébergée, lancement signé, catalogue et droits vérifiés sur cette cible |
| Paramètres privés | Fichier hors document root, clé dédiée, cookie distinct, répertoire anti-rejeu privé |
| Données et documents | Base dédiée, compte SQL limité, stockage privé, origine HTTPS exacte |
| Exploitation | Responsable, sauvegarde, restauration, retour arrière et accès de maintenance qualifiés |

La préproduction connue est `https://passeport-immo-preprod.avereo.fr`.
Ses reçus sont datés ; ils ne prouvent ni l'état actuel du serveur ni la préparation
de CONNECT en production. Le lot CONNECT utilisé en préproduction ne doit pas être
rejoué sur un runtime de production sans comparaison des fichiers et de la configuration.

## Paramètres à préparer hors Git

Le chargeur du sas permet de conserver l'archive publique inchangée : il lit
`AVEREO_CONFIG_FILE` si défini, sinon le fichier privé correspondant à l'environnement.
Sur une cible de production, son chemin conventionnel est
`$HOME/.avereo/passeport-immo/config.php`. Qualifier le chemin réellement utilisé
sur l'hébergement avant activation ; ne pas copier les secrets de préproduction.

| Paramètre | Valeur ou exigence à qualifier |
|---|---|
| `environment` | `production` |
| `connect_portal_url` | URL réelle de CONNECT en production, TBD |
| `connect_launch_secret` | Clé dédiée connue seulement du sas et de CONNECT ; valeur absente du dossier |
| `connect_launch_nonce_directory`, `connect_gate_cookie` | Répertoire privé et cookie distincts de la préproduction |
| `connect_gate_session_seconds` | Durée à confirmer ; préproduction actuelle : 1 800 secondes |
| `storage_enabled` | Activer seulement après préparation et vérification de la base et des fichiers |
| `storage_dsn`, `storage_user`, `storage_password` | Base et compte applicatifs dédiés, sans réutiliser la base CONNECT |
| `storage_directory`, `storage_origin` | Fichiers hors document root et origine HTTPS exacte de production |
| `storage_profiles` | Profils d'affichage des identités signées ; les habilitations restent portées par CONNECT |

Le [modèle existant](../api/connect-config.example.php) illustre la préproduction.
Il ne constitue pas une configuration de production prête à déposer.

## Séquence de préparation et de livraison

1. **Terminer la revue formelle de préproduction.** Consigner les résultats du
   [guide de recette](recette-preproduction.md), les réserves éventuelles et la
   décision humaine dans le cockpit. La checklist GitHub de la PR nº80 est observée
   cochée ; elle n'est ni effacée ni transformée en nouvelle décision de phase.
2. **Qualifier la cible en lecture seule.** Établir les éléments du tableau ci-dessus
   et dater les preuves. Toute création ou modification de cible vient ensuite,
   dans le périmètre autorisé. Ne pas réexécuter l'installateur initial sur une cible peuplée.
3. **Décider du contenu initial.** Démarrage vide ou transfert explicitement choisi :
   TBD. L'import SCI autorisé en préproduction n'autorise pas son transfert automatique
   en production. Préparer un inventaire, un contrôle des propriétaires CONNECT,
   une comparaison des octets et une procédure d'import sans doublon si ce transfert est retenu.
4. **Préparer la récupération.** Sauvegarder fichiers, configuration et données
   existants avant écriture. Vérifier leur restauration dans un emplacement isolé.
   Pour une cible réellement vide, conserver la preuve d'isolement et la procédure
   de retrait du candidat. Tester aussi le retour arrière sur le candidat exact.
5. **Établir l'accord précis.** Lier cible, source acceptée, empreinte de l'archive,
   périmètre CONNECT/données et effet attendu. Exécuter le contrôleur `production`.
   Les erreurs doivent être résolues par des preuves, sans retirer de blocages artificiellement.
6. **Installer après accord.** Préparer configuration et récupération privées,
   fermer l'accès pendant l'opération, relire l'archive, installer les 16 fichiers
   publics et le lot privé dans leurs emplacements respectifs. Initialiser le schéma
   seulement dans la base dédiée qualifiée. Comparer les empreintes et permissions
   avant activation du lancement CONNECT. Ne pas inclure configuration, SQL,
   sauvegardes ou documents clients dans le document root.
7. **Contrôler la production réelle.** Vérifier TLS, refus anonyme, fichiers internes
   inaccessibles, tickets invalides/expirés/rejoués, lancement et déconnexion avec
   le compte autorisé, refus d'un autre compte, API/anti-CSRF, création d'un bien fictif,
   import, lecture, archivage, dédoublonnage, PDF et concurrence entre deux sessions.
   Nettoyer uniquement les données de test identifiées ; conserver les reçus sans secrets.
8. **Qualifier l'exploitation et clôturer.** Installer la sauvegarde privée selon
   la politique retenue, observer un déclenchement réel et une restauration isolée,
   puis consigner livraison, contrôles et réserves. Faire décider séparément de
   l'ouverture aux utilisateurs. Préparer la prochaine itération à partir des réserves.

Il n'existe pas de workflow de déploiement Passeport Immo opérationnel dans
`.github/workflows/` : la CI produit le candidat. Ce dossier ne prétend pas fournir
un déploiement automatique. Les opérations privées devront être qualifiées pour
la cible retenue avant leur exécution.

## Sauvegarde et retour arrière

La préproduction utilise une sauvegarde quotidienne à 03 h 20 Europe/Paris,
conserve trente succès et protège le dernier en cas d'échec. Réutiliser cette politique
en production est une proposition à confirmer ; répertoire, configuration et tâche
cron doivent rester distincts. Voir [le fonctionnement existant](sauvegarde-automatique.md).

Les preuves actuelles couvrent une restauration des tables dans un espace temporaire
et les empreintes des documents. Elles ne démontrent pas une restauration complète
de l'hébergement. La copie hors hébergement, les alertes et les objectifs de perte
de données/délai de reprise restent à décider avant de définir un engagement de service.

Un échec de TLS, d'identité, d'isolement des données, d'intégrité ou de sauvegarde
doit interrompre l'activation. Fermer les écritures, conserver les journaux et sauvegarder
l'état après incident avant toute restauration. Si des utilisateurs ont déjà écrit,
ne pas restaurer aveuglément une ancienne base : inventorier les nouvelles données,
choisir une récupération qui les préserve et faire approuver l'effet attendu.

## Incident distinct observé sur `main`

Le workflow [Deploy Prototype To GitHub Pages](https://github.com/jpdandin44/AVEREO/actions/runs/38758110234)
a échoué à l'étape `Setup Pages` : le site Pages n'est pas trouvé/configuré.
Les CI du monorepo et de Passeport Immo ont réussi. Cet échec ne constitue pas
un déploiement de Passeport Immo. Qualifier séparément l'utilité actuelle de ce
workflow avant de proposer sa configuration ou son retrait ; aucun réglage GitHub
Pages n'a été modifié par cette préparation.

## Reprise opérationnelle

Ouvrir [le point de session](point-session.md), puis le suivi du cockpit.
Prochaine action : consigner la revue de phase 2 et confirmer la cible proposée,
puis qualifier en lecture seule la cible, CONNECT, les accès et la récupération.
La phase 3 et le déploiement attendent les décisions et preuves correspondantes.

Le contrôleur de production a été exécuté pendant la préparation ; il refuse le
passage avec huit prérequis manquants, conservés dans la preuve JSON. En particulier,
les reçus techniques de préproduction ne remplacent pas le contrôle de recette
attendu par le protocole ni l'acceptation humaine de l'archive exacte pour promotion.
