---
project: avereo-app-passeport-immo
document_type: feature-and-acceptance-guide
title: Import de rapports et archives volumineux
status: active
version: git
created: 2026-11-12
updated: 2026-11-12
owner: jpdandin
tags: [documents, import, volumes, recette]
---

# Import de rapports et archives volumineux

## Cadrage

Le responsable décrit quatorze archives totalisant 203 Mo et un rapport de 173 Mo
qu’il a dû découper. Il demande de conserver les fichiers entiers et de relever
la limite, avec possibilité de fichiers futurs plus lourds.

La documentation officielle o2switch consultée le 12 novembre indique un plafond
de **512 Mo pour un envoi PHP direct**. Le choix technique préparé est donc
**500 Mo par fichier et par lot**, avec une limite HTTP/PHP de 512 Mo pour laisser
une marge aux champs et en-têtes. Les compteurs de l’application utilisent
`1024 × 1024` octets par « Mo » affiché.

| Version | Fichier | Lot | Situation |
| --- | --- | --- | --- |
| PR144 historique | 25 Mo | 100 Mo, 100 fichiers | Ancienne livraison conservée pour récupération. |
| PR146 | 500 Mo | 500 Mo, 100 fichiers par requête | Livrée et techniquement vérifiée en préproduction privée. |

Sources : [plafond o2switch](https://faq.o2switch.fr/guides/php/comment-augmenter-taille-upload/)
et [configuration PHP par dossier](https://faq.o2switch.fr/guides/php/changer-version-php-et-php-ini/).
Pour dépasser 512 Mo par fichier logique, une autre évolution devra transmettre
des blocs puis reconstituer le fichier côté serveur, avec reprise, intégrité et
nettoyage privés. Aucun tel protocole n’est ajouté à ce candidat.

## Développement local

Le sélecteur conserve les fichiers d’origine. Le rapport de 173 Mo et les quatorze
archives de 203 Mo tiennent dans un lot, sans extraction ou découpe. Les sélections
dépassant 500 Mo ou cent fichiers sont réparties automatiquement en requêtes successives.

Noms, extensions et tailles sont contrôlés avant le premier lot. Les signatures
continuent d’être vérifiées par le dépôt local ou le serveur. L’atomicité reste
garantie **par lot**. Après interruption, les résultats confirmés restent visibles ;
relancer la sélection réutilise le dédoublonnage existant. Aucun succès global
n’est annoncé après erreur. Les listes de résultats API sont converties en nombres
avant affichage, pour éviter les confirmations contenant des objets.

Le mode serveur réutilise FormData et les fichiers natifs. Copie et empreinte
restent faites sans extraction ni lecture de tout le fichier dans une chaîne PHP.
Stockage privé, propriétaires, sessions, CSRF, schéma et sauvegarde sont réutilisés.

## Préproduction

La [livraison à 500 Mo](preproduction-import-volumineux.md) est réalisée après fusion des PR145/146 et accord explicite, avec sauvegarde fraîche et retour arrière sur copie. La réception réelle par PHP et l’inspection complète de ZIP de 173 et 500 Mo réussissent ; 501 Mo est refusé, sans écrire dans les biens. Les treize documents et les quatre tables restent inchangés. Le `.user.ini` proposé ne prouve pas
sa prise en compte : o2switch indique qu’il est ignoré avec le handler `___lsphp`
forcé. Ne pas modifier globalement PHP pour les autres applications.

Réglages proposés : `upload_max_filesize=500M`, `post_max_size=512M`,
`max_file_uploads=100`, `memory_limit=512M`, `max_input_time=600`,
`max_execution_time=300`. L’application conserve sa limite utile de 500 Mo.

| Critère | Vérification | Attendu |
| --- | --- | --- |
| V1 | Ajouter un rapport fictif de 173 Mo. | Un fichier entier, nom et octets conservés. |
| V2 | Sélectionner quatorze archives fictives de 203 Mo au total. | Un lot, quatorze fichiers inchangés, décompte exact. |
| V3 | Sélectionner plus de 500 Mo ou cent fichiers. | Lots successifs bornés, progression visible. |
| V4 | Ajouter un fichier de plus de 500 Mo à la sélection. | Nom et limite signalés avant tout envoi. |
| V5 | Interrompre le deuxième lot. | Premier lot conservé ; suite arrêtée ; reprise dédoublonnée. |
| V6 | Télécharger dans une seconde session puis vérifier une sauvegarde. | Octets exacts, restauration temporaire réussie. |

La [CI isolée qualifiée](https://github.com/jpdandin44/AVEREO/actions/runs/43267900807) réussit 72 assertions API, dont envoi
entier, téléchargement exact et sauvegarde/restauration d’un vrai ZIP de 173 Mo ;
22 assertions de sauvegarde planifiée, 35 de transfert et 83 Apache restent réussies.
Les 60 tests frontend, 41 inspections PHP, 25 tests Python et le build réussissent.
Le navigateur local importe quatorze petites archives fictives et en télécharge
une à l’identique ; les 203 Mo sont couverts par les tests de métadonnées.
Les [PR145](https://github.com/jpdandin44/AVEREO/pull/145) et [PR146](https://github.com/jpdandin44/AVEREO/pull/146) sont fusionnées ; leur checklist humaine est vérifiée. Ces tests ne cochent pas la recette humaine du nouveau candidat hébergé. Le [suivi dédié](../data/suivi-import-volumineux.json) porte les preuves et le candidat ; le [reçu hébergé](preproduction-import-volumineux.md) donne les instructions pour les archives d’origine.

## Mise en production

Aucune livraison de cette évolution n’est réalisée par sa préparation. Revue locale,
qualification hébergée, accords et production restent distincts. Le dossier SCI
n’est ni réimporté ni modifié par les tests fictifs.
