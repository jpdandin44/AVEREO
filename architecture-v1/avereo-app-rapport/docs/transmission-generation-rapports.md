---
project: avereo-app-rapport
document_type: handover-procedure
title: Transmission de la génération des rapports AVEREO
status: active
version: git
created: 2026-10-24
updated: 2026-10-24
owner: jpdandin
tags: [rapport, transmission, preproduction, word, demo]
---

# Transmission de la génération des rapports AVEREO

## Périmètre et état réel

Un dossier Rapport produit deux livrables AVEREO : **rapport expert détaillé** et
**synthèse client illustrée**. Le choix du destinataire est indépendant de la
catégorie de visite : les deux livrables sont disponibles pour les deux catégories.
Le lot du 24 octobre est autorisé en préproduction. La production et l'ouverture
publique sont exclues ; AVEREO doit rester en maintenance et les accès protégés.

Le [point de reprise](reprise-demo-philippe.md) porte la version effectivement
livrée, la recette et ses réserves. Le suivi canonique est le bloc
`demo_v1_preparation_20261023.reportDeliveryMigration20261024` dans
`C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json`.
La PR est [AVEREO #89](https://github.com/jpdandin44/AVEREO/pull/89).
Ne pas déduire une livraison d'un build, d'un commit ou d'une PR.

## Reprendre le travail

1. Lire `AGENTS.md` du monorepo, celui de Rapport, ce document et le point de reprise.
2. Ouvrir la copie `C:/Users/examg/Documents local/avereo-preprod-rapport-passeport`,
   branche `feat/rapport-demo-rga-20261024`. Vérifier branche, HEAD, changements
   locaux et état de la PR avant toute modification. Préserver les travaux en cours.
3. Lire le suivi canonique et le dernier reçu de livraison. Distinguer le commit de
   documentation du candidat exécutable réellement installé.
4. Vérifier les accès : cPanel authentifié pour la livraison ;
   [CONNECT préproduction → Rapport](https://connect-preprod.avereo.fr/?app=rapport)
   pour la recette. La protection d'accès précède la connexion Drupal OAuth.
   Ne jamais transmettre de mots de passe ou extraire des cookies.
5. Réutiliser les accords de ce périmètre. Merge, production et ouverture publique
   restent distincts et ne sont pas autorisés par ce document.

## Utilisation métier

Dans **Export → Livrable AVEREO**, choisir le destinataire puis les illustrations.
L'aperçu correspond au contenu du Word ; la pagination exacte appartient à Word.

| Livrable | Contenu | Intervention du professionnel |
| --- | --- | --- |
| Expert | Toutes les informations existantes, écoute, contexte, risques disponibles, protocoles, observations et photos, analyses, recommandations, réserves, signature et annexes | Revoir les faits, hypothèses, sources et limites avant validation |
| Client | Synthèse courte, jusqu'à trois constats choisis et leur première photo, illustrations pédagogiques adaptées, priorités, prochaine étape et limites | Rédiger les quatre champs client et sélectionner les constats ; aucune synthèse IA ni hiérarchisation automatique |

Les champs client vides sont signalés dans le document. Les limites complètes du
dossier restent utilisées si aucune formulation courte n'est renseignée. Toujours
relire le client avant remise : le choix de trois constats ne prouve pas que les
autres sont négligeables. L'export ne constitue ni une validation métier ni une
signature électronique. Le document garde le statut « Document de travail ».

L'export JSON conserve le dossier complet, les photos, les choix et les pièces.
La sauvegarde en ligne utilise l'API et les droits existants. Avant de remplacer
un brouillon par un import ou une réouverture, exporter sa copie JSON.

## Sources de vérité et code

| Source | Responsabilité |
| --- | --- |
| `frontend/src/App.jsx` | Formulaire, import/export JSON, brouillon et sauvegarde ; téléchargement Word |
| `frontend/src/ReportDeliveryOptions.jsx` | Choix du livrable, textes client, sélection des constats et des illustrations, pièces du dossier |
| `frontend/src/reportDelivery.js` | Normalisation de `livrable`, couverture et composition expert/client, branding |
| `frontend/src/reportHtml.js` | Contenu expert historique extrait sans supprimer les champs ; tableaux structurés issus des notes importées |
| `frontend/src/reportVisuals.js` | Catalogue pédagogique et logo incorporés, légendes et crédits ; aucune donnée d'un client |
| `frontend/src/reportDocx.js` | Génération réelle Office Open XML avec `docx`, images intégrées, A4, en-tête et pagination |
| `frontend/src/reportDelivery.test.js` | Conservation, filtrage client, sécurité des images et valeurs libres importées |
| `frontend/public/api/reports.php` | Stockage JSON existant et contrôle de propriété ; inchangé par ce lot |

`livrable` est un objet optionnel du payload existant :

```json
{
  "audience": "expert",
  "synthese": "",
  "priorites": "",
  "suite": "",
  "limites_client": "",
  "observations": [],
  "visuels": [],
  "annexes": []
}
```

`observations` contient au plus trois identifiants existants. `visuels` contient
les clés `origines`, `transferts`, `vmc`, `mollier`. Le client ne montre que
`origines` et `vmc` parmi les clés sélectionnées. Une annexe contient `title`,
`caption`, `source` et `src` (image bitmap en data URI). Les annexes restent dans
le dossier et sont réservées à la restitution expert. Un ancien dossier sans
`livrable` s'ouvre en expert sans ajouter automatiquement d'illustration.
Aucune migration SQL, aucun nouveau service ou compte n'est nécessaire.

L'ancien fichier HTML nommé `.doc` est remplacé par un vrai `.docx`. Le module
Word se charge à la demande. Il ne récupère aucune image distante et n'envoie pas
les données à un service documentaire externe. Voir la [documentation docx](https://docx.js.org/).

## Visuels : provenance et conditions d'utilisation

| Clé / pièce | Source | Limite à conserver |
| --- | --- | --- |
| Logo AVEREO | Logo officiel fourni localement | Couleurs `#002B45` et `#FF6600` ; Calibri est une police de restitution |
| Origines d'humidité | AQC, *Maîtriser la migration de vapeur d'eau dans les parois — En rénovation*, 2018 ; image45 du dossier | Schéma générique, pas une coupe mesurée du logement |
| Transferts d'humidité | ADEME, *Comment améliorer la qualité de l'air chez soi ?*, 2025 ; image46 | Explication pédagogique, aucune cause automatiquement déduite |
| VMC | [Conseils Thermiques](https://conseils-thermiques.org/contenu/vmc-hygroreglable.php), image47 du dossier | Schéma générique ; aucun débit ou équipement dimensionné |
| Mollier | Création AVEREO, équations ASHRAE via [PsychroLib](https://psychrometrics.github.io/psychrolib/api_docs.html) | h-x rectangulaire à 101 325 Pa ; 20 °C / 60 % HR est un exemple, pas une mesure Cricq |
| Tableau Géorisques Cricq | image16 du dossier d'origine | Historique, non actualisé ; RGA modéré à l'adresse / important sur la commune ; divergence avec la synthèse source signalée |
| Ubakus Cricq | `Fil_Rouge_DANDIN_4.pdf`, p. 40, annexe 13 | Capture historique ; 4,2 kg/m² et 101 jours sont des calculs avec hypothèses à requalifier, pas des mesures |
| Proposition de ventilation Cricq | image48 du dossier | Proposition propre au bien, non validée ni dimensionnée |

Les trois dernières pièces et les photographies ne sont pas embarquées dans le
code public : elles restent dans l'exemple JSON privé. Ne jamais les réutiliser
automatiquement pour une autre maison. Les crédits des illustrations tiers sont
conservés ; les conditions d'une diffusion commerciale plus large restent à
établir. Aucun téléchargement externe automatique d'illustrations n'est installé.

Le paquet source et les modèles éditoriaux locaux restent dans
`C:/Users/examg/Documents local/Habitologue/Opportunité_Connect/modeles-avereo-cricq`.
`sources/registre-visuels.md` décrit les originaux ; le DOCX source n'est pas modifié.
La copie enrichie pour la recette est `frontend/.local/cricq-demo.json` (ignorée par
Git). Elle conserve cinq observations, quatre photos et trois annexes ; aucun
identifiant serveur, consentement, nouvelle visite ou budget n'y est inventé.

## Vérifier une évolution

Depuis `architecture-v1/avereo-app-rapport/frontend` :

```powershell
npm.cmd ci
npm.cmd test
$env:VITE_ENABLE_ONLINE_SYNC='true'
npm.cmd run build
```

Exécuter aussi le contrôle racine `npm.cmd run check`, la vérification de diff et
les contrôles CI de la PR. Une modification des visuels exige une revue de leur
provenance et de leur légende. Une modification d'export exige un nouveau Word
expert et client, leur ouverture dans Word, un rendu PDF et l'inspection de toutes
les pages (images, tableaux, sauts, lisibilité et réserves).

Recette avec un dossier de démonstration et un compte autorisé :

1. Exporter le brouillon courant si nécessaire ; importer l'exemple puis contrôler
   cinq observations, quatre photos, trois pièces et les valeurs « Non qualifiée ».
2. Sauvegarder en ligne, revenir à l'accueil, rouvrir la copie serveur, vérifier
   les choix client, textes, images, identifiant serveur et dernière modification.
3. Exporter JSON, le comparer aux données sauvegardées ; exporter les deux Word
   et vérifier contenu, images intégrées et distinction expert/client.
4. Ouvrir les cartes RGA France et Haute-Garonne depuis les liens protégés.
5. Vérifier séparément les réponses anonymes : préproduction protégée, accès
   Rapport via CONNECT, AVEREO en maintenance, connexion Drupal disponible.

Les essais locaux ou une API simulée ne valent pas recette authentifiée hébergée.

## Livrer en préproduction et revenir en arrière

Le point de reprise donne le répertoire privé du lot, son manifeste et les reçus.
Utiliser uniquement l'archive construite et empreintée sur le candidat testé,
jamais le workflow de production pour une livraison de préproduction.

1. Rafraîchir GitHub et vérifier le candidat, la CI et l'accord exact. Actualiser
   le cockpit et exécuter le contrôle `check-gate.py --gate preproduction` du skill
   commun sur sa fiche ; contrôler les preuves, pas seulement les booléens.
2. Sur cPanel, vérifier la racine `/home/daje3540/rapport-preprod.avereo.fr` et la
   configuration privée existante, sans afficher les secrets.
3. Déposer le lot dans un nouveau répertoire privé sous
   `/home/daje3540/.avereo/rapport-preprod/`. Vérifier son SHA-256.
4. Exécuter le `deliver.py prepare` propre à ce lot : sauvegarde des fichiers et
   configuration, vérification des empreintes, essai installation/restauration
   sur copie privée. L'absence de sauvegarde restaurable bloque la suite.
5. Exécuter `deliver.py deploy`, puis `deliver.py verify`. Le script refuse un
   état modifié depuis la sauvegarde et ne touche ni base, ni OAuth, ni CONNECT.
6. Enregistrer reçu et contrôles ; réaliser la recette ci-dessus. En cas de
   régression de code, `deliver.py rollback` du même lot restaure les seuls fichiers
   livrés si leur état n'a pas changé. Ne pas restaurer une base par commodité.

Les commandes sont exécutées dans le répertoire du lot exact, jamais dans celui
d'une ancienne livraison. Toute divergence d'empreinte demande une inspection.
Documenter la source, la cible et le résultat après une correction.

## Limites et prochaine décision

- Validation métier et autorité de remise : **TBD**, à convenir avec le responsable.
- Réutilisation commerciale des illustrations tiers : **TBD**, hors de cette recette protégée.
- Une illustration Ubakus n'est pas un moteur de simulation ; aucun recalcul automatique.
- Les textes client sont saisis et relus par un humain ; aucune synthèse IA cachée.
- Le volume de page dépend des champs et images ; les deux modèles éditoriaux
  locaux 26/6 pages ne constituent pas une pagination imposée au générateur.
- La qualification hébergée et la version livrée sont consignées dans le point
  de reprise ; ne pas les annoncer réalisées sur la seule base de ce guide.
