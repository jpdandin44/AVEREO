---
project: avereo-app-passeport-immo
document_type: operations-runbook
title: Sauvegarde automatique de Passeport Immo
status: active
version: git
created: 2026-10-15
updated: 2026-10-16
owner: jpdandin
tags: [sauvegarde, preproduction, production, cron, restauration]
---

# Sauvegarde automatique de Passeport Immo

## Cadrage

Le responsable demande explicitement la sauvegarde automatique de la base et des
documents de Passeport Immo en préproduction. Ce complément d'exploitation utilise
la base dédiée et le compte de service existants ; il n'étend aucun accès CONNECT.
Le [suivi canonique](suivi-chantier.json) porte l'état de l'installation et ses preuves.

Politique retenue : copie complète quotidienne à **03 h 20, Europe/Paris**, puis
conservation des **30 dernières copies réussies**. Les sauvegardes manuelles
historiques restent hors du répertoire géré par cette rotation. Les fichiers
originaux et les lignes actives ne sont ni supprimés ni modifiés par la sauvegarde.

## Développement local

Le [travailleur CLI](../workflows/scheduled-backup.php) réutilise
[backup-storage.php](../workflows/backup-storage.php). Il copie les quatre tables
applicatives, tous les Blob référencés (archives et biens retirés inclus) et le
[schéma SQL](../database/storage.sql), dans un nouveau dossier privé. Les secrets
et la base CONNECT ne sont pas copiés. Les paramètres de connexion sont lus dans
la configuration privée existante, sans valeur secrète dans la commande planifiée.
Toute évolution du schéma nécessite de mettre à jour ensemble la liste des tables,
le schéma livré avec les scripts et les tests de récupération avant réinstallation.

Chaque exécution vérifie l'instantané JSON, les tailles et SHA-256 des fichiers,
le schéma copié et le retour des lignes dans des tables temporaires. La copie
devient complète après ces contrôles seulement. `latest.json` pointe sur cette
copie ; une erreur ne le remplace pas par un résultat incomplet.

Un verrou empêche les chevauchements. Une répétition planifiée le même jour ne
crée pas de copie supplémentaire. La rotation vise seulement les dossiers
automatiques achevés et identifiés, après création de la nouvelle copie vérifiée.
Les liens symboliques et les chemins pouvant atteindre les documents actifs
sont refusés. Les dossiers incomplets de l'essai courant sont nettoyés en cas
d'échec ; le dernier succès et un diagnostic privé sont conservés.

La recette initiale PHP/MariaDB fictive vérifie treize cas : copie complète, rotation,
pointeur, répétition quotidienne, concurrence, échec conservant le dernier succès,
diagnostic, reprise, protection des liens, séparation des sources, préservation
des tâches existantes et refus d'un doublon ou d'un bloc modifié. Elle est
exécutée par `python tests/check-storage-http.py`, déjà présent dans la CI.

## Préproduction

État vérifié le 15 octobre : installation active et premier déclenchement réel
par cron réussi. Le [reçu structuré](../api/automatic-backup-observation.json) conserve
la source, les empreintes du lot, la tâche définitive et les contrôles.
La commande reste entièrement hors du document root. Destination installée :
`/home/daje3540/private/passeport-immo-backups/preprod`. Dossiers en 0700, fichiers
en 0600. L'interpréteur constaté est `/opt/alt/php83/usr/bin/php` (PHP 8.3.35).

Le serveur est contrôlé toutes les heures à la minute 20 ; le travailleur utilise
explicitement Europe/Paris pour l'échéance quotidienne et mémorise la date du
dernier succès. Cela gère le changement d'heure et permet un rattrapage à la
prochaine heure après une indisponibilité. Aucun processus sur le PC n'est requis.
L’exécution initiale a été qualifiée par une entrée temporaire, retirée après
constat de la première sauvegarde réellement déclenchée par cron.

Avant installation : conserver la crontab existante dans un fichier privé,
contrôler l'absence de tâche équivalente, vérifier les fichiers livrés et leurs
empreintes. Ajouter un bloc identifié sans changer les autres tâches, ni leurs
variables ou préférences de courrier. Les sorties de cette tâche sont dirigées
vers un journal privé ; aucune notification ou transmission de données externe
n'est ajoutée. Le bloc et les autres lignes sont relus après installation.

### Recette réalisée

Source des scripts : `652ef6d63cddea3e343c39a616be9cf1f9500ecd`, lot privé
`dd574fb98b8fe770f4c33c2fd2bacf76e17963c58aaa9c056e070d3326798ae1`.
La [CI](https://github.com/jpdandin44/AVEREO/actions/runs/38743249295) réussit,
dont les treize cas de sauvegarde. Les quatre fichiers d’exploitation livrés sont
relus à l’identique ; les seize fichiers publics et les paramètres privés de
l’application ne sont pas modifiés.

Le serveur a réellement exécuté la tâche le **15 octobre à 13:34:02 UTC**
(15:34:02 à Paris), sans lancement manuel du travailleur. La copie contient
les quatre tables et neuf documents. Chaque fichier est relu et sa taille/SHA-256
comparée ; les lignes sont restituées dans des tables temporaires. Les permissions
privées sont vérifiées sur le dossier, les scripts, les copies, le statut et le journal.

La crontab finale ne contient plus l’entrée d’essai. Les autres lignes sont
identiques à la sauvegarde de crontab préalable. La prochaine échéance calculée
après cette recette est le **16 octobre à 03:20 Europe/Paris**. La rotation n’a
encore expiré aucune copie réelle : elle a été exercée sur les données fictives
en CI. Le reçu Git décrit ce constat ; `status.json` et `latest.json` sur le serveur
portent les résultats ultérieurs, sans synchronisation continue de ces fichiers vers Git.

### Exécution nocturne observée le 16 octobre

La copie `20261016T012002Z-049ffb203acd` est terminée à **03 h 20 min 02 s,
Europe/Paris** (01:20:02 UTC), avec un déclenchement `cron`. Le
[reçu de lecture daté](../api/nightly-backup-observation.json) constate la cohérence
du statut, du pointeur, du marqueur de fin et de la dernière ligne du journal :
quatre tables, neuf documents, contrôles de fichiers et restitution temporaire
déclarés réussis, aucune ligne active modifiée selon le travailleur.
Deux copies réussies sont conservées ; aucune copie réelle n'a encore expiré.

Le dossier contient `snapshot.json`, `schema.sql`, `complete.json` et neuf fichiers
dans `documents/`. Les permissions affichées sont 0600 pour les fichiers et 0700
pour le sous-dossier documentaire. Le contrôle de cette session est en lecture seule :
aucun recalcul indépendant des empreintes, téléchargement des documents ou nouvel
essai de restauration n'a été effectué. Le critère 07 reste à la validation humaine.

### Retrouver les copies et diagnostiquer un échec

Dans le gestionnaire de fichiers cPanel, saisir le chemin **relatif au dossier
personnel** `private/passeport-immo-backups/preprod`, puis utiliser « Aller ».
Le champ de navigation n'attend pas le préfixe `/home/daje3540/`.
Pour la copie du 16 octobre, ouvrir
`runs/20261016T012002Z-049ffb203acd` ; sélectionner `complete.json`, puis « Voir »
pour lire son compte rendu. Éviter le double-clic sur le nom de fichier, qui peut
ouvrir le renommage. Aucun partage public n'est nécessaire pour cet accès privé.

Le dossier de sauvegarde contient :

- `runs/` contient chaque copie complète : `snapshot.json`, `schema.sql`,
  `complete.json` et le sous-dossier `documents/`.
- `latest.json` identifie le dernier succès vérifié.
- `status.json` contient le résultat et les nombres de tables/documents ;
  il conserve un diagnostic sans secret en cas d'échec.
- `scheduler.log` conserve les résultats d'exécution, sans noms de documents.

Les erreurs ne déclenchent pas de courriel automatique. La vérification d'un
statut trop ancien s'effectue depuis ces fichiers privés. Les copies restent
sur le même hébergement o2switch ; ce lot n'installe pas de copie hors hébergeur.

### Restauration

Fermer les écritures, conserver l'état incident, puis reprendre la procédure du
[stockage serveur](stockage-serveur.md) avec une copie complète choisie dans
`runs/`. Restaurer les quatre tables dans une base neuve et les Blob dans un
répertoire privé neuf ; vérifier les empreintes avant de pointer l'application
vers cette récupération. La restauration temporaire automatique ne remplace pas
un exercice de reprise de l'ensemble de l'hébergement.

### Retour arrière de la planification

Retirer uniquement le bloc identifié de cette tâche et vérifier que les autres
lignes de la crontab restent identiques. Conserver les copies, le journal et les
scripts privés. Ne pas réimporter une ancienne crontab complète si d'autres
tâches ont changé entre-temps.

## Mise en production

Le lot suivant est préparé et testé localement après la PR nº81 ; seule la version
historique de préproduction décrite ci-dessus est installée. Les quatre phases
et leurs décisions humaines restent inchangées.

Le travailleur accepte `local`, `preprod` ou `production` dans la configuration
privée. Les contrôles de stockage actif, chemins privés, séparation des sources,
verrou, rotation et relecture restent applicables. L'installateur cron accepte
`--environment=preprod` (défaut historique) ou `--environment=production` ; il exige
que la configuration privée porte le même environnement avant toute écriture.

| Élément | Préproduction | Production proposée |
|---|---|---|
| Configuration | `/home/daje3540/.avereo/passeport-immo-preprod/config.php` | `/home/daje3540/.avereo/passeport-immo/config.php` |
| Scripts | Sous-dossier `backups/bin` de la configuration | Sous-dossier `backups/bin` de la configuration |
| Copies et journaux | `/home/daje3540/private/passeport-immo-backups/preprod` | `/home/daje3540/private/passeport-immo-backups/production` |
| Bloc cron | `AVEREO PASSEPORT IMMO PREPROD BACKUP` | `AVEREO PASSEPORT IMMO PRODUCTION BACKUP` |

Le compte et les chemins correspondent à l'inventaire o2switch du dossier de production.
Les dossiers de production n'existent pas encore. L'installation doit requalifier
ces emplacements et l'interpréteur avant exécution. Une tâche complète de l'autre
environnement est conservée octet pour octet. Un doublon, une tâche non identifiée
ou un bloc incomplet fait refuser l'ajout. La finalisation retire uniquement l'entrée
de qualification du bloc choisi, après constat d'un succès réel déclenché par cron.

Les neuf nouveaux cas portent la recette de sauvegarde à **22 assertions** : copie
avec configuration production, indépendance des pointeurs, refus d'un chemin public,
coexistence et finalisation des deux blocs, doublon de production, environnement inconnu,
tâche non identifiée et bloc incomplet. Les 30 contrôles API/stockage passent également
sur données fictives. Aucune crontab ou sauvegarde de production n'est créée par ces tests.

La cadence de production et la rétention restent à confirmer. Le dossier SCI de
préproduction est choisi pour les données initiales ; son transfert reste à préparer
et autoriser selon [le dossier de mise en production](04-mise-en-production.md). Une fois l'accord
obtenu, installer le nouveau lot privé, vérifier les empreintes, puis lancer
`backup-cron.php --environment=production` depuis son dossier privé ; après contrôle
du premier succès et des autres lignes, utiliser le même argument avec `--finalize`.
Ne pas utiliser l'ancien lot préproduction pour cette opération.
