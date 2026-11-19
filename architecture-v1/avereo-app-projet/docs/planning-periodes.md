---
project: avereo-app-projet
document_type: functional-contract
title: Planning indicatif par périodes sans dates
status: active
version: git
created: 2026-11-19
updated: 2026-11-19
owner: jpdandin
tags: [planning, periodes, rapport, import, preproduction]
---

# Planning par périodes

## Cadrage

Le responsable demande de terminer la recette Rapport vers Projet en préproduction avec un Gantt simplifié **non daté**, exprimé en périodes, importé comme nouveau projet, puis sauvegardé et réouvert après reconnexion. Les repères P1, P2… sont des unités relatives sans équivalence imposée en jour, semaine ou mois. Les positions sont renseignées, jamais déduites d’un horizon libre ou d’une charge en jours-personne.

Le parcours conserve le mode calendaire des anciens projets. Le planning privé reste réservé à son propriétaire CONNECT configuré. Aucun compte ou droit nouveau, aucun dossier réel ni production ne relève de ce lot.

## Développement local

### Contrat du fichier Projet

Le format existant `schemaVersion: 1` accepte le champ optionnel `timelineMode: "periods"`. Son absence conserve le calendrier historique. En mode périodes :

- `startDate`, `targetDate` et les `manualStart` des tâches sont nuls ; aucune date de substitution n’est créée.
- Chaque tâche porte `periodStart` entier de 1 à 120 et `periodDuration` entier positif, ou zéro pour un jalon. La fin doit rester dans P120.
- `duration` conserve la charge éventuelle en jours-personne, indépendamment des périodes. Une charge nulle avec une durée en périodes positive reste une intervention, pas un jalon.
- Les dépendances doivent être compatibles avec le positionnement explicite. Aucun décalage automatique ne réécrit les périodes.
- `capacityPerWeek` reste une propriété de compatibilité du format historique, sans intervention dans le positionnement relatif.

Les validations JavaScript et PHP contrôlent le mode, les bornes, les dates incompatibles et les dépendances avant persistance. Le JSON conserve périodes, fiches, risques et résultats. Le CSV historique ne porte pas ces coordonnées : l’interface oriente le mode périodes vers l’export JSON complet.

### Interface et compatibilité

Le fichier s’importe depuis **Mes projets → Importer un projet**, sans date exigée dans la confirmation. La création reste indépendante des projets déjà présents. Le Gantt présente les colonnes P1… et deux barres par exemple sur le dossier fictif. Cliquer une intervention ouvre la fiche pour modifier début et durée en périodes. La première tranche ne propose pas de déplacement des barres à la souris.

Les commandes calendaires et l’indicateur de retard n’agissent pas dans cette vue. Les fonctions de notes, résultats, risques et avancement conservent leur sens ; un planning indicatif ne constitue pas une validation des travaux.

La comparaison hébergée a relevé deux écarts préexistants : un lien du module privé dans `legacy-app.html`, et un mot-clé de classement historique dans le moteur. Le mot-clé est conservé avec ceux de main ; le raccord privé est conservé au conditionnement hébergé, sans modifier son code ni ses droits. Les empreintes du paquet réellement livré restent distinctes du seul SHA source.

## Préproduction

Recette autorisée sur un nouveau dossier fictif Rapport et un nouveau projet privé : exporter les seules interventions choisies, vérifier P1–P2 et P3–P5, contrôler le JSON sans dates, sauvegarder une modification de période et rouvrir depuis la liste serveur après déconnexion/reconnexion. Relever identifiant, révision et empreinte, puis vérifier les projets préexistants et le dossier source.

Avant installation, conserver les fichiers remplacés, les protections et configurations privées, l’inventaire de planning et les documents Rapport. Restaurer les copies dans un répertoire privé et vérifier leurs empreintes. Installer la validation avant les clients ; conserver les anciens fichiers référencés par les onglets ouverts. Si le code ancien refuse les projets par périodes, un retour arrière de code ne doit jamais supprimer ces nouvelles données : conserver le JSON et les sauvegardes privées.

Les résultats hébergés et l’état du candidat sont consignés dans le suivi privé canonique `rapportV12CadrageProfils20261112.recetteProjetPeriodes20261119`, et non déduits des contrôles locaux.

## Mise en production

Aucune autorisation de production ni fusion automatique. Le responsable examine le candidat et ses preuves ; les quatre cases humaines de la PR restent à sa charge.
