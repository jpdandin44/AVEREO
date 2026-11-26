# Brief Codex T-11 — Lot 3A : interface terrain (cotes laser, photos, commentaires)

Lot : 3A — Branche : `vision/lot-3a-terrain` (suite de T-10, déjà commité en `b086aa1`) — Rédigé par Claude Code le 26/11/2026

## Contexte
Lis `architecture-v1/avereo-app-vision/AGENTS.md` (charte, accessibilité, terrain), `docs/exigences.md` (R13, R17, R36, R37, R38), `docs/synchronisation.md` (contrat terrain), puis :
`frontend/src/features/releve/EcranReleve.jsx`, `useReleve.js`, `features/plan2d/Plan2D.jsx` (et `jetons.js`), `features/saisie-cotes/` (`ChampLongueur.jsx`, `Champ.jsx`, `ListeMurs.jsx`, `ListeOuvertures.jsx`, `FormulairePiece.jsx`), `components/` (`Encadre.jsx`, `Icone.jsx`), `styles/tokens.css`, `styles/base.css`, `domain/terrain.js`, `domain/alertes.js`, `domain/modele.js`, `sync/images.js`, `sync/medias.js`, `sync/moteur.js` (`sauverMedia`, `lireMedia`, `telechargerMedia`, `listerMedias`).

T-10 a livré le modèle, la synchronisation et l'API des photos, **sans écran**. Ce brief ajoute l'interface.

## Règle d'intégration (important)
**Photos et commentaires passent par l'état de `useReleve`**, seule source de vérité de l'écran (affichage immédiat, annuler/rétablir, enregistrement automatique R03) :
- ajoute à `useReleve` une action `validerNiveau(nouveauNiveau)` (comme `validerPiece`) ;
- n'utilise **pas** `creerMedias().ajouterPhoto` / `supprimerPhoto` depuis l'écran (ils modifient le stockage derrière `useReleve`, qui ne serait pas prévenu dans le même onglet) : réutilise ses briques (`compresserImage`, `empreinteSha256`, `crypto.randomUUID()`, `moteur.sauverMedia`, `moteur.lireMedia`, `moteur.telechargerMedia`) dans un hook d'écran, par exemple `features/terrain/usePhotos.js` : fichier → compression → empreinte → `moteur.sauverMedia({... etat: "a-envoyer"})` **puis** `validerNiveau` avec la photo ajoutée ; affichage : blob local sinon téléchargement authentifié (URL blob révoquées au démontage). Garde `creerMedias` (testé) tel quel ou fais-le converger, mais l'écran ne doit avoir qu'un chemin d'écriture.
- Suppression d'une photo : objet retiré par `validerNiveau(supprimerCible(...))` ; marque le fichier à supprimer côté serveur comme le fait `supprimerPhoto` (intention durable). Si « annuler » restaure une photo dont le fichier est marqué supprimé, afficher « Photo supprimée » sans erreur.

## Ce que tu fais
### 1. Cotes laser (R17) — dans la carte « Pièce sélectionnée »
- Section « Cotes laser » : **Longueur** (choix du mur + valeur), **Largeur** (choix du mur + valeur), **Contrôle** (type hauteur ou diagonale ; pour la diagonale, choix de deux sommets) + valeur. Saisie en mètres comme `ChampLongueur` (stockage en mm entiers). Effacer une cote possible.
- Résultat sous chaque cote, via `evaluerCotesLaser` : valeur du plan, valeur mesurée, écart, état **ok** ou **hors tolérance** avec libellé et icône (`decrireCoteLaser` / `Encadre`), jamais la couleur seule. Cotes en police de données (JetBrains Mono, voir charte).
- Les murs sont désignés comme dans `ListeMurs` (« Mur 1 », etc.) ; si la pièce change (sommet ajouté/supprimé), `adapterCotesLaser` du modèle s'en charge déjà.

### 2. Photos (R36, R38) — carte « Photos et commentaires » (colonne de gauche) et plan
- Deux boutons : **« Prendre une photo »** (`<input type="file" accept="image/*" capture="environment">`) et **« Choisir une photo »** (même champ sans `capture`), grands boutons (cible ≥ 48 px).
- Placement : au centre de la pièce sélectionnée (avec `pieceId`), sinon au centre du niveau ; ensuite **déplaçable sur le plan** (glisser le repère ; `validerNiveau` à la fin du glissement, pas à chaque pixel).
- Repères sur le plan 2D (Konva) : icône d'appareil photo, taille de cible ≥ 48 px à l'écran, au-dessus des pièces ; un toucher sélectionne la photo et l'ouvre dans une vue (miniature dans la carte, image en grand dans une boîte de dialogue accessible : titre, fermer au clavier, `alt` = légende ou « Photo du <date> »).
- Liste des photos du niveau dans la carte (miniature, date, pièce), avec **Supprimer** (avec le choix pour les commentaires attachés, voir §4).
- États visibles : « en attente d'envoi » / « envoyée » / « erreur d'envoi » (lu dans `moteur.listerMedias`), avec libellé et icône ; erreur de compression ou de stockage → message clair.

### 3. Commentaires (R37)
- Dans la même carte : zone de texte (dictée du clavier acceptée, 500 caractères au plus, compteur), et **à quoi l'attacher** : la pièce sélectionnée, un de ses murs (position = milieu du mur), la photo sélectionnée, ou un point du plan (centre du niveau, puis déplaçable comme une photo).
- Repères sur le plan (bulle), position calculée par `positionCommentaire` (un commentaire de mur suit le mur) ; toucher → affiche le texte, avec **Modifier** et **Supprimer**.
- Liste des commentaires du niveau dans la carte.

### 4. Suppressions avec commentaires attachés
- Supprimer une **pièce**, un **mur/sommet** (dans `ListeMurs`, le plan ou ailleurs : repère tous les chemins de suppression de sommet), ou une **photo** : si `commentairesConcernes` n'est pas vide, une boîte de dialogue propose **« Supprimer aussi les N commentaires »**, **« Les garder sur le plan »** (détacher) ou **« Annuler »** ; puis `supprimerCible`. Sans commentaire concerné : comportement actuel inchangé.
- L'insertion d'un sommet doit passer par `insererSommetTerrain` (commentaires de mur conservés à leur place).

### 5. Terrain (R13)
- Vérifie sur mobile (largeur 375 px) : toutes les nouvelles cibles ≥ 48 × 48 px (`--cible-min`), boutons pleine largeur si besoin, pas de défilement horizontal ; la saisie d'une pièce rectangulaire reste ≤ 6 champs.
- Charte : jetons de `tokens.css`, aucun texte orange sur blanc, aucun dégradé.

### 6. Tests et documentation
- Tests `node:test` de la logique d'écran sans DOM (hook ou fonctions extraites : ajout de photo dans le niveau, ordre « fichier puis objet », choix de suppression, placement par défaut, conversion mètres ↔ mm des cotes laser, détachement).
- Si un test de composant React est nécessaire, reste sur les outils déjà présents (pas de nouvelle dépendance).
- `docs/exigences.md` : R13, R17, R36, R37, R38 mis à jour (fait côté interface ; restent les essais sur 1 Android et 1 iPhone) ; `docs/revue-locale.md` : scénario de recette (photo prise ou choisie, déplacée, commentaire sur un mur qui suit le mur, suppression avec choix, cotes laser ok et hors tolérance, coupure réseau puis envoi).

## Ce que tu ne fais pas
- Pas de vidéo (Lot 3B), pas de changement du serveur, de la synchronisation ni des migrations (sauf correction d'un défaut bloquant, à signaler).
- Pas de déploiement, de connexion au serveur, de secret ni de réglage GitHub ; pas d'autre sous-projet ; pas de nouvelle dépendance.

## Terminé quand
- `npm test` et `npm run build` (ou `--configLoader runner` si l'environnement l'impose) passent ; les tests PHP ne doivent pas régresser (Claude Code les relancera).
- Un commit sur `vision/lot-3a-terrain` (`Co-Authored-By: Codex <noreply@openai.com>`), ou changements laissés dans l'arbre de travail avec un rapport.
- Rapport : fichiers, choix d'interface, captures ou description des écrans, limites, « À VÉRIFIER ».
