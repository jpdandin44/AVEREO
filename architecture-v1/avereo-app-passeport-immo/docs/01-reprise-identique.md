---
project: avereo-app-passeport-immo
document_type: phase-deliverable
title: Reprise identique et recette locale
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [passeport-immo, local]
---

# Reprise identique et recette locale

## Périmètre livré
Prototype autonome dans ce sous-projet, autorisé par la réponse « Phase 0 puis prototype
local dans cette session ». Base monorepo `f4695d6`, phase 0 locale `f1d865b` ; branche
`feat/passeport-immo-phase-1`. Aucune transition de phase ou décision humaine écrite.
Le prototype CONNECT de référence est conservé sans modification.

## Résultats techniques du 2026-10-03
| Contrôle | Résultat réellement observé |
|---|---|
| `npm.cmd ci` dans `frontend/` | Réussi ; installation depuis package-lock |
| `npm.cmd test` | 10 tests réussis, 2 fichiers ; calcul manuel et import CSV fictif |
| `npm.cmd run build` | Réussi ; 398 modules ; bundle principal ~774 kB, avertissement Vite >500 kB |
| `node tests/check-parity.mjs` | Réussi ; transformations inversées et logique/classes identiques |
| `docker compose -f compose.local.yaml config --quiet` | Réussi ; image et conteneur non exécutés |
| Navigateur local | Connexion, création/édition du bien fictif, pièce/intervention, gammes, image, rechargement vérifiés |
| Export PDF | Téléchargé, 2 pages A4 ; page 1 lisible avec montants/image, page 2 blanche |
| Console navigateur | Aucun message error/warn sur le parcours observé |

L'installation a signalé des scripts de dépendances à examiner par npm ; aucune
permission supplémentaire de script accordée. L'installation et le build ont néanmoins
réussi. Le build volumineux est conservé pour respecter le périmètre de reprise.
Le délai de l'événement de téléchargement automatisé a expiré ; le fichier réellement
téléchargé a ensuite été trouvé et inspecté avec pypdf et rendu des deux pages.
Ces constats de l'agent ne remplissent aucune case de recette humaine ci-dessous.

## Décompte et revue du diff a/b/c
| Classe | Décompte | Références locales | Effet |
|---|---|---|---|
| a — renommages | 3 libellés et 10 occurrences de clés | `frontend/src/App.jsx:112`, `:273`, `:587`, `:658` | Nouvelle identité visible et espace de stockage séparé |
| b — chargement | 2 blocs CDN retirés : helper et appels dans useEffect ; 3 globals npm | `frontend/src/main.jsx:3`, `:10`, `frontend/src/App.jsx:1108` | Versions PapaParse/jsPDF/html2canvas inchangées ; hydrate conservé |
| b — styles/outillage | Tailwind, PostCSS, entrypoint et configuration Vite ajoutés | `frontend/tailwind.config.js:1`, `frontend/src/styles.css:1`, `frontend/vite.config.js:1` | Compilation des classes existantes, aucune classe modifiée |
| c — extraction | 2 corps de useMemo déplacés ; 2 appels et 1 import | `frontend/src/App.jsx:3`, `:702`, `:704`, `frontend/src/lib/chiffrage.js:2`, `:39` | Logique et dépendances des useMemo conservées |

La neutralisation BOM/fins de ligne et indentation accompagne la copie/extraction.
Les 32 lignes avec espaces en fin de ligne hérités de la source ont été nettoyées
sans changer leur contenu utile, pour le contrôle Git.
Le contrôle inverse compare chaque ligne hors indentation, en conservant les chaînes
et les classes littérales. Les fichiers nouveaux d'installation, lancement, Docker,
tests et documentation constituent l'enveloppe du sous-projet. Aucun autre changement
de comportement dans `App.jsx`. Matrice P01…P40 mise à jour dans
[l'état des lieux](00-etat-des-lieux.md), toutes les lignes portent un statut et une preuve.

## Montants de référence établis à la main
| Bien source | Calcul | Éco | Standard | Premium |
|---|---|---:|---:|---:|
| Maison | Salon 35 m² + chambre 15 m² = 50 m² de peinture ; prix 36/48/60 | 1 800 € | 2 400 € | 3 000 € |
| Appartement | Remplacement tableau, un forfait 1320/1980/2640 | 1 320 € | 1 980 € | 2 640 € |
| Cas mixte fictif | 12 m² ×20 + 3 unités ×20 + forfait20 ; h/ml0 | 160 € | 320 € | 480 € |

Le navigateur a vérifié un salon fictif de 20 m² : 720/960/1200 €.
Après rechargement, la gamme revient à Standard (historique), le dossier reste présent.

## Choix techniques
Versions React/React DOM/Zustand/Vite reprises des contraintes du package CONNECT ;
lockfile conservé. PapaParse 5.3.2, jsPDF 2.5.1 et html2canvas 1.4.1 sont épinglés aux
versions CDN source. Tailwind 3.4.17 avec PostCSS/autoprefixer respecte les classes
historiques, selon la [documentation officielle Vite](https://v3.tailwindcss.com/docs/guides/vite).
Des globals sont exposés au point d'entrée pour préserver les gardes du prototype.
Vitest/jsdom permettent le test d'import dans l'interface réelle.
Docker suit le modèle Node/Nginx local ; seul son contrat Compose est contrôlé.
Aucun service externe ou stockage futur n'est introduit.

## Recette locale à remplir par le responsable
Installation : `npm.cmd ci` depuis `frontend/`. Lancement : `npm.cmd run dev` dans
ce dossier ou `start-local.cmd`. URL : <http://127.0.0.1:5175/>.
Tests : `npm.cmd test`, construction : `npm.cmd run build`, parité depuis le sous-projet :
`node tests/check-parity.mjs`. Préférer un profil de navigateur de recette distinct.
Le fichier CSV et l'image de recette se trouvent dans `data/`, avec des données fictives.
Tous les résultats, dates et exécutants humains sont volontairement à remplir.

| ID | Étapes | Résultat attendu | Résultat obtenu | Date | Exécutant |
|---|---|---|---|---|---|
| R01 | Installer ; lancer ; ouvrir URL | Écran de connexion, styles visibles, sans CDN | À remplir | À remplir | À remplir |
| R02 | Se connecter ; Accueil/Admin ; déconnexion/reconnexion | Admin Démo/Pro, navigation et retour login | À remplir | À remplir | À remplir |
| R03 | Ouvrir chacun des 2 biens de démonstration | Composition, pièces, estimation présentes | À remplir | À remplir | À remplir |
| R04 | Créer bien fictif ; valider champs ; éditer ; annuler suppression puis supprimer son bien de recette | Données cohérentes, confirmation avant suppression | À remplir | À remplir | À remplir |
| R05 | Ajouter pièce nommée et surface >0 ; tenter champs invalides | Pièce ajoutée ; ajout invalide refusé | À remplir | À remplir | À remplir |
| R06 | Filtrer/rechercher interventions ; sélectionner ; quantité unité ; valider ; changer les 3 gammes | Choix conservés, montants recalculés selon règles historiques | À remplir | À remplir | À remplir |
| R07 | Joindre image fictive et PDF ; retirer une pièce jointe de recette | Nom affiché, vignette image, retrait du dossier | À remplir | À remplir | À remplir |
| R08 | Exporter PDF ; lire toutes les pages ; essayer plusieurs pièces et images | Détail standard, 3 budgets, images et pagination à examiner ; page blanche connue Q09 | À remplir | À remplir | À remplir |
| R09 | Partager ; vérifier copie URL ou Web Share sur navigateur compatible | URL transmise ; absence de transfert dossier explicitement comprise | À remplir | À remplir | À remplir |
| R10 | Admin : ajouter/éditer/supprimer tarif fictif ; sauvegarder | Retour biens et tarifs persistés, limites de fusion connues | À remplir | À remplir | À remplir |
| R11 | Admin : importer CSV fictif ; prix à virgule ; essayer colonnes manquantes ; sauvegarder | Bilan d'import, prix corrects, refus de colonnes manquantes | À remplir | À remplir | À remplir |
| R12 | Examiner abonnement simulé, contrôle PRO et liens du prototype | Pas de paiement réel ; accès simulé documenté | À remplir | À remplir | À remplir |
| R13 | Recharger ; se reconnecter ; retrouver bien/pièce/intervention/image/tarifs ; examiner sur téléphone | Dossier local conservé ; session non persistée ; rendu mobile à accepter | À remplir | À remplir | À remplir |

## Anomalies et points restant à décider
Questions de référence : [suivi JSON](suivi-chantier.json).
- Q09 : deuxième page blanche sur l'export fictif ; pagination source `App.jsx:733–744`
  conservée. Impact : document superflu ; correction à autoriser dans un lot distinct.
- Q08 : création/édition/fermeture de fenêtre n'ont pas reproduit d'erreur de hooks ;
  le placement conditionnel historique demeure, sans correctif hors contrat.
- Q04 : h/ml à zéro et groupement PDF par nom restent inchangés.
- Q05 : recette humaine, suppressions/partage, scénarios PDF volumineux et téléphone
  réel restent à effectuer. Les contrôles de cette session couvrent les parcours listés.
- Q06 : branches et commits locaux ; aucune PR publiée, décision de publication ultérieure.

## Revue et prochaine étape
Double-cliquer sur `start-review.cmd` pour la revue AVEREO Projet (5193), procédure dans
[le guide](acces-suivi-local.md). Dépendances du moteur installées ; serveur non démarré
par l'agent. Lecture native du chantier vérifiée sans mutation ni décision de revue.
La phase 0 est en cours dans le suivi formel ; le prototype est disponible sous accord
de session distinct. Le responsable reste seul à soumettre, valider et autoriser la
suite. Le travail de phase 2 n'a pas commencé.

## Actualisation — itération GitHub/cockpit et correctif d
Le tableau initial ci-dessus est conservé comme preuve du lot `1ceb70a`.
La demande suivante autorise la correction PDF et le raccordement GitHub/cockpit.
Q09 est résolue techniquement : le même PDF court donne une page A4 complète,
et quatre tests couvrent les documents multipages et le dernier pixel de contenu.
Le total actuel est quatorze tests. Les cases humaines restent à remplir ; pour R08,
l'attendu actuel inclut l'absence de page blanche d'arrondi.
Q06 et le lien PR sont actualisés dans le suivi canonique. Les états et contrôles
actuels sont dans la [fiche d'itération](iteration-developpement.md) et les
[preuves du raccordement](raccordement-cockpit.md).
