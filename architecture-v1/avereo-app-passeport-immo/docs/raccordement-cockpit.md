---
project: avereo-app-passeport-immo
document_type: technical-evidence
title: Preuves du raccordement et du correctif PDF
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [passeport-immo, tests, cockpit]
---

# Preuves du raccordement et du correctif PDF

## Périmètre autorisé et réalisé
Le responsable demande le protocole GitHub/cockpit et choisit « Raccordement et
correction du PDF ». La copie Passeport Immo est isolée ; la source historique
CONNECT et les autres applications restent inchangées. Le workflow CI dédié est
le seul ajout exécutable hors sous-projet. Le socle documentaire racine initial
fait partie de la reprise, sans audit global de toutes les applications.

## PDF : avant et après
Le même dossier fictif `example.test`, de 61 m², contient une pièce de 20 m² avec
peinture et une image SVG fictive. Les budgets restent 720 / 960 / 1200.
Avant : deux pages A4, la seconde blanche. Le canvas de 1587 × 2245 pixels
produit une hauteur calculée de 297,0699 mm, soit un débordement inférieur à un pixel.
Après : une page A4, titre, composition, détail, trois budgets, image et pied de
page complets, vérifiés par rendu de la page téléchargée.

La dernière ligne du canvas est lue seulement pour ce débordement inférieur ou égal
à un pixel. Une ligne blanche/transparente ne crée pas de page ; un pixel coloré
conserve la page. Les véritables débordements conservent la pagination existante.
Les quatre tests intégrés à l'écran reproduisent l'échec avant correctif puis
vérifient ces limites, ainsi que deux et trois pages. Les longs documents sont
contrôlés avec canvas/jsPDF simulés ; recette humaine de documents réels à effectuer.

## Contrôles techniques
- Quatorze tests Vitest réussis : neuf calculs, un import CSV, quatre exports PDF.
- Construction Vite réussie, 398 modules ; avertissement de bundle >500 kB conservé.
- Parité a/b/c+d réussie : après inversion des seuls changements autorisés,
  tous les autres comportements et classes retrouvent la source historique.
- Archive du build relue et vérifiée ; ses empreintes et observations CI sont
  consignées dans la [fiche générée](iteration-developpement.md), source JSON unique.
- Environnement local : Node 24.18.0 ; CI configurée sur Node 22. Une CI réussie
  ne démontre l'identité du candidat que si SHA source et archive sont vérifiés.

Les preuves du poste et PDF fictifs restent dans `.local/`, hors Git.
La CI publie uniquement les assets construits et le manifeste du candidat.

## Sécurité et données
Le dépôt GitHub est public. Les archives documentaires fournies, leurs binaires,
les chemins personnels, les données du navigateur et les preuves locales ne sont
pas publiés. Les tests suivis utilisent uniquement des données fictives.
La connexion, le profil Pro et l'abonnement restent simulés. Le prototype n'a ni
contrôle d'accès serveur ni synchronisation ; CONNECT et son sas restent à intégrer.
Une cible de démonstration distante exige donc qualification de son accès et de son
isolement, avant tout accord de déploiement. Aucun secret requis dans ce lot local.

## Préproduction, production et recette
TBD — aucune URL/cible Passeport Immo, répertoire, accès, vacuité ou isolation,
sauvegarde restaurée et retour arrière testé n'a été qualifié.
Ces champs restent explicitement incomplets dans le suivi ; le contrôleur du skill
refuse les passages concernés. Les workflows des autres applications ne prouvent
pas ces cibles. Prochaine action : définir la cible dédiée, le contrôle d'accès et
le lot CONNECT nécessaire, puis préparer un accord portant sur ce candidat précis.

Les décisions de phase, acceptation GitHub, merge, déploiement et ouverture restent
humaines. Aucune case de recette ni de checklist PR n'est cochée par l'agent.

## CI et lecture du cockpit observées
Le job Passeport Immo et la CI générale ont réussi sur le candidat qualifié.
L’artefact GitHub téléchargé contient archive et manifeste : empreinte du conteneur,
intégrité ZIP, manifeste et octets des cinq fichiers comparés au poste avec succès.
La [fiche générée](iteration-developpement.md) porte les identifiants et dates.
La lecture Projet affiche les six phases et quatre livrables disponibles sans mutation.
La fusion de la PR nº71 et sa checklist humaine sont désormais observées : source
acceptée, sans validation automatique des phases ni accord de déploiement.
Les cibles et les accords manquants empêchent toujours la promotion distante.

## Cible suivante choisie
Le responsable choisit une préproduction dédiée sur o2switch. Les champs restant
à qualifier sont dans [la fiche de cible](qualification-preproduction.md). Ce choix
ne renseigne ni une URL réelle, ni des accès, ni une autorisation de déploiement.
