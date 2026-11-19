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

### Qualification du 19 novembre

La PR175 porte le candidat source `fdbd45908dedd32b5a67009e392e7c5a94d82e2b`. L’archive réellement installée, avec le raccord privé conservé, a pour SHA-256 `d1c2405805d4a63bbc5b054b6f03e1b5bfdf3060f76529cd4bb23345356d3ef9`. Quatorze fichiers ciblés, sauvegardes fraîches et restauration des fichiers/plannings sur copie privée ; huit tables Rapport sauvegardées et relues, sans restauration SQL réelle. Les 253 tests Rapport, 387 tests Projet, 47 contrôles PHP et les onze jobs CI réussissent. PR Policy attend les quatre cases humaines.

L’export réel du dossier fictif complet est importé par **Mes projets → Importer un projet**. Deux interventions, charge totale 3,5 jours-personne, P1–P2 puis P3–P5 ; la troisième intervention non cochée est absente. Une modification place la première en P2–P3 et crée la version serveur 2. Après fermeture des sessions applicatives, déconnexion CONNECT et reconnexion humaine, le nouveau projet est ouvert depuis la liste serveur : périodes et modification conservées. Aucun début de projet, date cible ou démarrage manuel n’est enregistré. Rapport est également rouvert depuis sa liste serveur : son JSON complet est identique à l’export avant déconnexion, et ses périodes initiales restent indépendantes de Projet.

Les 31 dossiers Rapport antérieurs, leurs propriétaires et les fichiers des deux projets préexistants sont exacts. Seul le catalogue reçoit le nouveau projet ; ses anciennes entrées et valeurs de préférences restent identiques. Trois valeurs par défaut déjà appliquées par le lecteur sont matérialisées lors de l’écriture du catalogue. Configurations, protections, autres fichiers publics et production conservés.

Limites distinctes : un premier import a rencontré une erreur réseau sans écriture, puis la reprise unique a réussi ; le téléchargement de sauvegarde depuis l’iframe Projet n’a pas été confirmé par l’outil de navigation. Les échanges JSON et le fichier téléchargé depuis Rapport sont vérifiés. La déconnexion CONNECT seule a laissé une session Projet utilisable : cette session a ensuite été explicitement fermée dans Projet avant la nouvelle connexion ; le comportement global de déconnexion reste à traiter séparément. Le contenu du brouillon Rapport précédent est rétabli par import, ce qui détache son ancien identifiant serveur ; sa copie complète initiale et le dossier serveur demeurent conservés. Aucun de ces constats ne vaut acceptation humaine de la PR.

## Mise en production

Aucune autorisation de production ni fusion automatique. Le responsable examine le candidat et ses preuves ; les quatre cases humaines de la PR restent à sa charge.
