---
project: avereo-app-passeport-immo
document_type: workflow
title: Activation privée du candidat de production
status: active
version: git
created: 2026-10-16
updated: 2026-10-16
owner: jpdandin
tags: [production, connect, exploitation]
---

# Activation privée du candidat de production

Le [script CLI](activation-production.php) est un outil privé d’exploitation,
hors ZIP public. Il est déposé sur l’hébergement sous le nom
`preparer-activation-privee.php`, dans le dossier privé de préparation du 16 octobre.
Il ne reçoit ni ne restitue de mot de passe. Le [dossier de production](../docs/04-mise-en-production.md)
et le [reçu courant](../api/production-execution-observation.json) conservent les faits
datés ; D06 reste l’accord opérationnel applicable.

## Entrées et dépendances

Cible dédiée `passeport-immo.avereo.fr`, installation fermée de seize fichiers,
base dédiée et reprise SCI déjà vérifiées. Le script attend les trois archives
qualifiées, les outils de reprise/sauvegarde et les reçus privés dans le même
dossier de préparation. PHP 8.3, PDO MySQL, ZipArchive et la commande crontab sont
nécessaires. Il lit les configurations privées existantes de CONNECT et Passeport,
la clé indépendante déjà créée par le responsable, puis vérifie les empreintes
et permissions réelles. Aucune valeur secrète n’est conservée dans Git.

Le compte destinataire doit rester `dandin`, utilisateur 1, propriétaire actif de
l’organisation 1 et inscription terminée. La sélection repose sur la confirmation
humaine et ces contrôles ; l’égalité des identifiants numériques entre environnements
ne prouve pas une identité externe commune.

## Préparation sans activation

Le mode `prepare` refuse une application déjà présente ou des fichiers/configurations
modifiés. Il vérifie le rejeu exact SCI, prépare les deux fichiers CONNECT et la
politique signée du candidat, puis prépare deux configurations privées en 0600.
Les autres valeurs sont préservées et relues sémantiquement. Les configurations
dynamiques sont refusées ; aucune réécriture supposée équivalente n’est tentée.

La répétition hébergée utilise trois tables temporaires qui masquent les noms du
catalogue pour une seule connexion. Elle appelle le dépôt réel de CONNECT :
autorisation du propriétaire sélectionné, refus de l’autre compte existant,
publication des cinq fichiers sur une copie privée et restauration de leurs octets
et permissions. Une connexion indépendante vérifie que le catalogue réel est inchangé.
Le crontab existant est lu et le futur ajout contrôlé sans installation.

Cette préparation a réussi le 16 octobre à 09:44:01 UTC. Elle ne prouve ni un
lancement OAuth/navigateur, ni un déclenchement cron réel, ni une restauration
complète de l’hébergement. Le mode `apply` reste inexécuté à ce constat.

## Action finale préparée

L’exécution humaine de `preparer-activation-privee.php apply` est nécessaire dans
le navigateur : elle raccorde une clé d’authentification existante à une nouvelle
configuration et accorde un accès aux données. Cette intervention résulte de la
règle de sécurité du navigateur ; elle ne constitue pas une seconde demande D06.

Juste avant écriture, le script recontrôle son empreinte, le candidat, les deux
configurations, le catalogue, le crontab et le dossier SCI. Toute divergence bloque
l’exécution ; ne pas forcer ni modifier le reçu pour contourner ce refus.

Il sauvegarde les cinq fichiers affectés, le catalogue et les données/documents,
qualifie la copie des quatre tables et neuf fichiers, crée la seule application
et son habilitation pour l’organisation sélectionnée, puis écrit une autorisation
explicite pour `dandin` et un refus explicite pour les autres membres actuels.
Les comptes, rôles, adhésions et données SCI ne sont pas modifiés.

Le candidat conserve sa fermeture totale pendant la pose des deux fichiers et des
configurations. La clé reste sur le serveur ; aucun nouveau secret n’est généré.
La politique signée du candidat est publiée en dernier. Un visiteur sans ticket
CONNECT valide reste refusé ; aucune ouverture publique n’est prévue.

Le script installe ensuite les outils privés de sauvegarde et un bloc cron propre
à la production, sans remplacer celui de préproduction ni les autres tâches :
03 h 20 Europe/Paris, rattrapage horaire, trente copies vérifiées sur le même
hébergement. Une entrée de qualification temporaire doit être retirée avec le mode
`--finalize --environment=production` du travailleur cron après constat d’un vrai
succès cron. Une copie manuelle ne vaut pas ce constat.

## Échec, retour arrière et suites

En cas d’échec après début des changements, le script rétablit la politique de
fermeture totale et annule la transaction si elle est encore ouverte. Les sauvegardes,
fichiers et données sont conservés pour inspection. Il ne supprime pas les nouvelles
données ni ne rejoue automatiquement une restauration ancienne sur un état plus récent.
Une issue de commit incertaine impose une inspection ; ne pas relancer à l’aveugle.

Pour revenir en arrière, fermer d’abord le lancement, restaurer les seuls fichiers
affectés depuis la copie fraîche et les seules lignes de cette application depuis
le relevé ciblé. Préserver les données du bien et toutes les évolutions d’autres
applications. La répétition isolée est une preuve technique, pas une recette réelle.

Après activation, vérifier CONNECT avec le compte habituel, le bien SCI, les six
actifs/trois archives, consultation et téléchargement, persistance, refus des autres
comptes et déconnexion ; vérifier aussi le vrai déclenchement de sauvegarde.
Toute création future de membre requiert de revoir ses accès : le backend historique
permet l’héritage d’une habilitation d’organisation lorsqu’aucun refus individuel
n’existe. Le contrôle des membres actuels ne vaut donc pas une garantie sur de
futurs comptes. La copie hors hébergement et les alertes restent à qualifier.

La phase 3, les critères humains, le merge et l’ouverture restent des décisions
distinctes. Aucun de ces états n’est déduit de la préparation réussie.
