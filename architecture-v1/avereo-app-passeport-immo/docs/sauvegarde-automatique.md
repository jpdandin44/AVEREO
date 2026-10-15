---
project: avereo-app-passeport-immo
document_type: operations-runbook
title: Sauvegarde automatique de préproduction
status: active
version: git
created: 2026-10-15
updated: 2026-10-15
owner: jpdandin
tags: [sauvegarde, preproduction, cron, restauration]
---

# Sauvegarde automatique de préproduction

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

La recette PHP/MariaDB fictive vérifie treize cas : copie complète, rotation,
pointeur, répétition quotidienne, concurrence, échec conservant le dernier succès,
diagnostic, reprise, protection des liens, séparation des sources, préservation
des tâches existantes et refus d'un doublon ou d'un bloc modifié. Elle est
exécutée par `python tests/check-storage-http.py`, déjà présent dans la CI.

## Préproduction

État de préparation : installation et premier déclenchement serveur à vérifier.
La commande reste entièrement hors du document root. Destination prévue :
`/home/daje3540/private/passeport-immo-backups/preprod`. Dossiers en 0700, fichiers
en 0600. L'interpréteur constaté est `/opt/alt/php83/usr/bin/php` (PHP 8.3.35).

Le serveur est contrôlé toutes les heures à la minute 20 ; le travailleur utilise
explicitement Europe/Paris pour l'échéance quotidienne et mémorise la date du
dernier succès. Cela gère le changement d'heure et permet un rattrapage à la
prochaine heure après une indisponibilité. Aucun processus sur le PC n'est requis.
L'exécution initiale est qualifiée par une entrée temporaire, retirée après
constat de la première sauvegarde réellement déclenchée par cron.

Avant installation : conserver la crontab existante dans un fichier privé,
contrôler l'absence de tâche équivalente, vérifier les fichiers livrés et leurs
empreintes. Ajouter un bloc identifié sans changer les autres tâches, ni leurs
variables ou préférences de courrier. Les sorties de cette tâche sont dirigées
vers un journal privé ; aucune notification ou transmission de données externe
n'est ajoutée. Le bloc et les autres lignes sont relus après installation.

### Retrouver les copies et diagnostiquer un échec

Dans le gestionnaire de fichiers cPanel, ouvrir le dossier privé ci-dessus :

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

Cette tâche couvre uniquement la préproduction privée. Elle ne modifie pas les
quatre phases, leurs décisions humaines ni la version publique de l'application.
