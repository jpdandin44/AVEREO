---
project: avereo-app-projet
document_type: maintenance
title: Lecture des suivis courants et conservation de l’historique
status: active
version: git
created: 2026-11-18
updated: 2026-11-18
owner: jpdandin
tags: [cockpit, suivis, historique, preproduction]
---

# Cadrage

Le portefeuille hébergé lit une projection privée signée ; actualiser l’écran ne collecte pas ses sources. Un suivi peut être un workflow direct ou un conteneur possédant `developmentWorkflow`, y compris après sélection de l’itération active. Le lecteur déroule ce niveau sans hériter des accords, candidats ou phases du parent. Un workflow nul ou sous forme de liste est refusé.

# Développement local

Pour une phase objet sans `id`, le lecteur utilise son `label` uniquement si le registre déclare explicitement ce mapping. Le même identifiant source est utilisé pour états, critères, pièces et prévisions ; un libellé absent/inconnu reste refusé. Les identifiants et mappings historiques existants gardent la priorité. Aucun accord du parent n'est transféré.

La limite des **vues de suivi** passe de 50 à 100 dans le registre local, le stockage signé Node et le lecteur PHP. Les autres limites restent celles du [stockage privé](pont-stockage-local.md) : 50 applications, 32 Mio de projection, 500 pièces sélectionnées et quota de publications sans suppression automatique. Les tests couvrent 100 vues, le refus de 101, les deux lecteurs et le retour à la copie précédente.

Les vrais chemins, suivis et reçus sont privés et restent hors Git/CI. Le registre relie le lot partagé Rapport/CONNECT aux deux applications et qualifie explicitement son environnement de livraison. Les formats de reçus TC distincts du workflow sont projetés par un générateur privé déterministe : chemin et SHA-256 canoniques, empreinte de la copie dérivée, provenance, réserves et portée. Les copies dérivées ne deviennent pas des sources métier et doivent être régénérées puis contrôlées avant publication.

# Préproduction

Une pièce historique dont les octets JPEG étaient étiquetés PNG conserve ses octets, son SHA-256, son identifiant et sa référence historique ; seul le type de transport de la nouvelle copie dérivée est corrigé en JPEG, avec l'ancienne extension consignée. Le validateur strict reste inchangé et refuse toujours une signature d'image incohérente. Cette adaptation ne réécrit ni la pièce canonique ni l'ancienne publication.

Pour une publication ponctuelle, relire l’index signé et son seuil, conserver les fichiers de publication précédents, sauvegarder le stockage et le lecteur, puis tester l’installation et le retour sur une copie. Refuser une modification concurrente. Les anciens suivis restent présents ; lorsqu’un même identifiant représente désormais une autre itération ou une projection métier modifiée, conserver aussi la projection précédente comme vue historique consultable, avec ses critères, accords et pièces. Ne jamais transférer une validation d’une itération à la suivante.

Seuls le lecteur PHP borné et la projection signée sont concernés par cette correction. Les assets existants, l’authentification, les droits, les fichiers clients et les autres applications sont conservés. Les badges gardent la date, la version, la cible et la portée de leurs déclarations. Une installation TC dont la recette est bloquée reste déclarée et ne reçoit pas une preuve de recette réussie. Vérifier la vue d’ensemble et les suivis détaillés dans la session native du propriétaire global.

Cette opération ne met pas en service le publicateur permanent préparé séparément. Aucun état de production n’est déduit d’un merge ou d’une CI.

# Mise en production

Aucune intervention de production incluse. La publication ponctuelle de préproduction, les reçus et la qualification d’un éventuel service permanent restent des résultats distincts.
