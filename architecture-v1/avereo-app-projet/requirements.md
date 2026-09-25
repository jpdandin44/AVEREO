---
project: avereo-app-projet
document_type: requirements
title: Exigences du planning local Projet
status: active
version: git
created: 2026-09-19
updated: 2026-09-25
owner: jpdandin
tags:
  - projet
  - exigences
---

# Exigences du planning local Projet

## Extension de revue locale

- Lire les livrables du chantier connecté sans créer une seconde référence.
- Exiger décideur, commentaire, confirmation et, pour approuver, lecture de chaque
  livrable et vérification explicite de chaque critère de sortie.
- Distinguer observation, correction, remise, approbation, accord de passage et démarrage.
- Conserver état et preuves sur disque, avec le journal des décisions remplacées.
- Refuser une révision périmée, une phase non autorisée et les chemins hors du dossier.
- Bloquer le passage après modification d'un livrable approuvé depuis l'interface.
- Actualiser les vues dérivées ou signaler leur échec après une sauvegarde réussie.
- Tester sur des données fictives ; ne pas auto-approuver l'audit réel.
- Conserver le planning et exclure service et données de revue du build hébergé.
- Afficher la PR principale et les revues complémentaires de la phase depuis les
  métadonnées locales contrôlées, sans dupliquer une référence ni remplacer les
  preuves acquises. Le constat daté n'est pas une synchronisation GitHub.

Le service de revue est un outil local de développement. L'identité est
déclarative, sans authentification multiutilisateur. Le contrat est dans
[api/revue-locale.md](api/revue-locale.md). Les contraintes de navigateur
ci-dessous concernent le planning ; les décisions de revue sont stockées sur disque.


## Fonctionnel

- Configurer départ, cible et capacité hebdomadaire.
- Conserver les charges décimales ; réserver zéro aux jalons.
- Proposer un modèle séquentiel par défaut et un mode dépendances explicite.
- Valider IDs uniques, références existantes et graphe sans cycle.
- Refuser l'import invalide sans perte et confirmer le remplacement valide.
- Reprendre un brouillon versionné, exporter/importer un JSON complet.
- Conserver l'échange CSV neuf colonnes et l'import XLSX historique.
- Charger le pilote seulement dans le local admissible, sans écraser de brouillon.
- Conserver les données pilote hors du build public.
- Afficher l'objectif, les actions, les critères attendus et les références de chaque fiche.
- Distinguer réalisation et validation d'une étape ; exiger preuve, vérificateur
  et horodatage explicites avant validation, sans modifier automatiquement le lot.
- Conserver les fiches existantes lors de l'enrichissement du pilote et préserver
  durée, progression, paramètres, dates et autres modifications utilisateur.
- Suivre les causes, conséquences, qualification, prévention, réaction et revue
  des risques ; présenter la préqualification du pilote comme indicative et
  conserver le statut À qualifier tant que la revue humaine n'est pas consignée.
- Exiger une qualification, un responsable, une preuve et une date de revue pour
  résoudre ou accepter un risque, sans déduire ces informations de la checklist.
- Garder le JSON comme sauvegarde complète et expliciter ce qui manque au CSV.
- Afficher le document local des étapes comme texte, sans interprétation HTML.

## Contraintes techniques

Le métier reste côté navigateur, sans backend métier, MySQL, compte ni secret.
Validation et calcul doivent être testables sans DOM. Le build doit conserver
les points d'entrée et artefacts du sas CONNECT.

Le stockage navigateur ne constitue pas une sauvegarde serveur. Erreurs
d'import, de version ou de quota ne doivent pas conduire à une confirmation
trompeuse.
Les champs détaillés doivent être bornés et les listes avoir des identifiants
uniques. Le JSON normalisé doit respecter les limites de taille du lecteur de
sauvegarde, caractères et octets UTF-8 compris ; voir [data/README.md](data/README.md).

## Recette et hypothèses

Les scénarios sont dans [tests/README.md](tests/README.md). Le pilote de
29,4 jours-personne doit être cohérent avec le départ proposé au 21 septembre,
la cible au 30 octobre 2026 et la capacité de 5 jours-personne par semaine.

Le calendrier est lundi–vendredi ; absences et fermetures restent à renseigner.
Estimations, affectations et dates sont proposées, sans preuve d'exécution.
Les évolutions métier EV du planning ne sont pas réalisées par ce lot.

Les tests moteur, interactions et contrôleur ainsi que la recette locale du
pilote sont consignés dans [l'audit](docs/source-audit.md). Le téléchargement
effectif d'un export JSON et l'import XLSX dans l'interface restent à qualifier.
Le sas hébergé et la disponibilité publique ne font pas partie de cette
qualification locale.
Les tests et la recette ciblée de l'extension fiches/checklists/risques sont
consignés dans l'audit. Ils ne valent pas validation de tous les parcours UI ;
les échanges de fichiers et autres cas restant ouverts y sont explicités.

## Visibilité de la progression des phases

- Présenter toutes les phases, leurs états, dates connues, prochaine action et blocages renseignés.
- Distinguer nombre de phases validées, livraisons historiques et phases actuellement à valider.
- Calculer la disponibilité depuis les livrables effectivement accessibles, sans la confondre avec leur validation.
- Afficher les accords antérieurs fournis par le chantier avec leur provenance et leur date de relevé.
- Conserver les décisions, commentaires et preuves ; l'affichage ne démarre ni n'approuve aucune phase.
- Ne déduire aucun pourcentage d'effort lorsque les données ne le mesurent pas.

## Livrables prévus et progression actualisée

- Présenter les titres, descriptions et preuves attendues facultatifs de chaque
  livrable, même lorsque son fichier n'existe pas encore.
- Distinguer un livrable prévu, un document de travail accessible et une phase
  remise à la revue ; ne jamais déduire une livraison ou une validation de la
  seule présence d'un fichier.
- Actualiser le snapshot toutes les 25 secondes lorsque la page est visible et
  au retour au focus/à la visibilité, sans mutation automatique du chantier.
- Préserver commentaire, décideur, phase et document sélectionnés s'ils sont
  encore disponibles ; signaler une panne du service sans effacer les brouillons.
- Annuler uniquement les attestations des phases dont les preuves ou le contexte
  de revue pertinent ont changé, y compris par leurs dépendances ; détecter un
  fichier modifié même si le JSON est inchangé.
- Ignorer une ancienne réponse de lecture qui termine après le début d'une
  écriture ; garder les contrôles de concurrence existants côté service.
