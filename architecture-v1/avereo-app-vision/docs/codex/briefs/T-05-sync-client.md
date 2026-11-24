# Brief Codex T-05 — modules purs de synchronisation du client (R03, R05, R06) et leurs tests

Lot : 2B — Branche : vision/lot-2b-synchronisation — Rédigé par Claude Code le 24/11/2026

## Contexte
Lis `architecture-v1/avereo-app-vision/AGENTS.md` (règles permanentes), puis uniquement les fichiers listés ci-dessous.
Le relevé (bâtiment → niveaux → pièces → ouvertures) doit être enregistré automatiquement et synchronisé objet par objet entre téléphone et PC. Le contrat complet est `docs/synchronisation.md` : **lis-le en entier d'abord, il fait foi**. Tu écris la **logique pure** du client (aucun DOM, aucun React, aucun Dexie, aucun réseau, aucune horloge ni aléa non injectés) en JavaScript + JSDoc, ES modules, **sans aucune dépendance**. Le style est celui de `frontend/src/domain/historique.js` et `domain/modele.js` : fonctions pures, objets immuables (rien n'est modifié en place), commentaires en français.

## Ce que tu fais
Crée, dans `frontend/src/sync/`, les modules ci-dessous. Types (à déclarer en JSDoc dans `objets.js`) :
```js
/** État local d'un objet : {id, kind, parentId, data, rev, deleted}  (rev = dernier rev connu du serveur, 0 si jamais envoyé) */
/** Changement : {objectId, kind, parentId, data: object|null, deleted: boolean} */
/** Entrée de la file d'envoi : Changement + {baseRev: number, version: number} */
/** Objet reçu du serveur : {object_id, kind, parent_id, data, deleted, rev, seq, updated_by, device_id} */
```
`kind` ∈ `batiment | niveau | piece | ouverture`. Les formes de `data` sont celles du tableau du §2 de `docs/synchronisation.md` (clés exactes, rien d'autre).

### `objets.js`
- `aplatirBatiment(batiment)` → tableau `{id, kind, parentId, data}` : le bâtiment (`data: {nom}`, `parentId: null`), ses niveaux (`{nom, ordre}`, `ordre` = index dans `batiment.niveaux`), leurs pièces (`{nom, hauteurMm, ordre, sommets}` ; `ordre` = index dans le niveau ; sommets copiés en `{x, y}`), leurs ouvertures (`{type, murIndex, positionMm, largeurMm, hauteurMm, alleMm}`). Parents avant enfants. Les objets du domaine (voir `src/domain/modele.js`) ont : bâtiment `{id, nom, niveaux}`, niveau `{id, nom, pieces}`, pièce `{id, nom, hauteurMm, sommets, ouvertures}`, ouverture `{id, type, murIndex, positionMm, largeurMm, hauteurMm, alleMm}`.
- `memeContenu(a, b)` → `true` si deux `{parentId, deleted, data}` sont égaux en profondeur (ordre des clés indifférent).

### `diff.js`
- `diffBatiment(avant, apres)` → `Changement[]`. `avant` peut être `null` (tout est créé). Compare les objets aplatis par `id` : objet absent avant → création ; présent des deux côtés avec `parentId` ou `data` différents → mise à jour (un changement de `parentId` seul, par exemple une pièce déplacée d'un niveau à l'autre, est une mise à jour) ; présent avant, absent après → suppression (`deleted: true`, `data: null`). **Supprimer un objet supprime aussi tous ses descendants** (ils sont absents de `apres` ; ils doivent figurer chacun dans le résultat). Ordre du résultat : créations et mises à jour (parents avant enfants), puis suppressions (enfants avant parents). Deux bâtiments identiques → `[]`. Un `avant` et un `apres` ayant des ids de bâtiment différents sont acceptés (l'ancien est supprimé, le nouveau créé).

### `assembler.js`
- `assemblerBatiment(objets, idBatimentPrefere = "batiment-1")` → `{batiment, avertissements, orphelins}`. `objets` : `ObjetLocal[]` (voir plus haut). Ignore `deleted: true`. Le bâtiment est l'objet de `kind` `batiment` d'id `idBatimentPrefere`, sinon le premier par ordre d'id ; aucun → `batiment: null`. Reconstruit niveaux, pièces et ouvertures selon `parentId`, triés par `data.ordre` puis `id` (ouvertures : par `id`). Un objet dont le parent est absent ou supprimé est **conservé dans `orphelins`** (liste d'ids), jamais perdu, et n'apparaît pas dans le bâtiment. Pour chaque ouverture, appelle `validerOuverture(piece, ouverture)` de `src/domain/modele.js` : si elle renvoie un message, **l'ouverture reste dans la pièce** et un avertissement `{type: "ouverture-incoherente", ouvertureId, pieceId, message}` est ajouté. Invariant testé : `assemblerBatiment(aplatirBatiment(b).map(o => ({...o, rev: 1, deleted: false}))).batiment` est égal en profondeur à `b`.

### `file-envoi.js`
- `fileVide()` → `[]`.
- `empiler(file, changements, revConnue)` → nouvelle file. `revConnue(objectId)` renvoie le dernier `rev` connu (0 si inconnu). Pour chaque changement dans l'ordre : pas d'entrée pour cet objet → ajoute `{...changement, baseRev: revConnue(objectId), version: 1}` ; entrée existante → **remplace** son contenu par le nouveau changement, **garde son `baseRev`** et fait `version + 1`. Cas particulier : une entrée de création (`baseRev` 0) que suit une suppression du même objet est **retirée de la file** (le serveur n'a jamais vu l'objet). L'ordre de la file est celui de la première apparition de chaque objet.
- `prendreLot(file, max = 100)` → les `max` premières entrées.
- `acquitter(file, envoyes, appliques)` → nouvelle file. `envoyes` : les entrées envoyées (telles que prises par `prendreLot`) ; `appliques` : `[{object_id, rev}]` renvoyés par le serveur. Pour chaque `envoye` présent dans `appliques` : si l'entrée courante de la file a la même `version` → la retire ; si sa `version` a augmenté entre-temps (le relevé a encore changé pendant l'envoi) → la garde avec `baseRev` = `rev` renvoyé et la même `version`. Les entrées absentes de `appliques` ne bougent pas.
- `retirer(file, objectIds)` → file sans ces objets.

### `fusion.js`
- `appliquerReception(objets, file, recus)` → `{objets, enAttente}`. `objets` : `Map<id, ObjetLocal>` ; `recus` : `ObjetRecu[]` (déjà dans l'ordre des `seq`). Renvoie une **nouvelle** Map. Pour chaque reçu : objet local connu avec `rev >= recu.rev` → ignoré ; objet absent de la file d'envoi → remplacé par `{id: object_id, kind, parentId: parent_id, data, rev, deleted}` ; objet **ayant une entrée dans `file`** → **on garde son contenu local** (`data`, `parentId`, `deleted`) mais son `rev` passe à `max(local.rev, recu.rev)`, et l'`id` est ajouté à `enAttente` (sans doublon). **Ne jamais toucher à la `file`** : le `baseRev` des entrées reste l'ancien, c'est ce qui fait détecter l'écrasement par le serveur (R06).

### `journal.js`
- `ecrasementsSubis(entrees, deviceId)` → les entrées du journal (§4 du contrat) dont `lost.device_id === deviceId`, par `id` croissant.
- `libelleEcrasement(entree, formaterDate)` → phrase française, par exemple « Votre modification de la pièce « Salon » a été remplacée par une modification plus récente le 24/11/2026 à 20:01. » `formaterDate(isoString)` est injectée ; le nom vient de `lost.data.nom` s'il existe, sinon l'identifiant ; le genre du nom de type : bâtiment (le), niveau (le), pièce (la), ouverture (l'). Si `lost.deleted` est vrai : « La suppression de … a été remplacée … ».

## Tests (`frontend/tests/sync-*.test.mjs`, `node:test` + `node:assert/strict`, comme `tests/historique.test.mjs`)
Jeux de référence à construire avec les fonctions du domaine (`creerBatiment`, `creerNiveau`, `creerPieceRectangulaire`, `creerPiece`, `creerOuverture`, `ajouterOuverture`, `ajouterPiece`, `ajouterNiveau`, `remplacerNiveau`, `remplacerPiece`) :
- **REF-1** : une pièce 4 000 × 3 000 mm, hauteur 2 500 mm. **REF-2** : la même avec une porte 900 × 2 040 mm et une fenêtre 1 200 × 1 000 mm (allège 900 mm). **REF-3** : pièce en L (sommets (0,0), (4000,0), (4000,2000), (2000,2000), (2000,4000), (0,4000)). Utilise des `id` fixes pour des résultats déterministes.
Cas à couvrir au minimum (un `test(...)` par ligne, nom en français) :
1. `aplatirBatiment` : REF-1 donne 4 objets (bâtiment, niveau, pièce, rien d'autre) — compte exactement les objets attendus pour REF-2 (1 + 1 + 1 + 2) ; formes de `data` exactes ; parents avant enfants.
2. Aller-retour : `assemblerBatiment(aplatir(b))` égal à `b` pour REF-1, REF-2, REF-3 et un bâtiment à deux niveaux et plusieurs pièces (ordre conservé).
3. `diffBatiment(null, b)` crée tout ; `diffBatiment(b, b)` vaut `[]` ; renommer une pièce → 1 mise à jour ; modifier une longueur de mur (déplacer un sommet) → 1 mise à jour de la pièce seule ; ajouter une ouverture → 1 création ; supprimer une pièce de REF-2 → suppression de la pièce **et** de ses 2 ouvertures (enfants avant parent) ; déplacer une pièce d'un niveau à l'autre → 1 mise à jour de `parentId` ; le diff ne modifie pas ses arguments (compare des copies profondes avant/après).
4. Assembleur : objets supprimés ignorés ; orphelins listés et absents du bâtiment ; ouverture sur un mur qui n'existe plus (pièce passée de 4 à 3 sommets) conservée avec un avertissement ; deux pièces d'`ordre` égal triées par id ; pas de bâtiment → `batiment: null`.
5. File : deux changements du même objet → une entrée, `version` 2, premier `baseRev` conservé ; création puis suppression → file vide ; `prendreLot` respecte `max` ; `acquitter` retire l'entrée de même version, garde (avec `baseRev` relevé) celle dont la version a changé, ne touche pas aux absents.
6. Fusion : reçu plus récent sans modification locale → remplace ; reçu de `rev` inférieur ou égal → ignoré ; modification locale en attente + reçu plus récent → contenu local gardé, `rev` relevé, `enAttente` contient l'id, **la file est strictement inchangée** ; la Map d'entrée n'est pas modifiée.
7. Scénario complet « deux appareils » **sans serveur** : appareil A et B partent de REF-1 (rev 1) ; A renomme la pièce, B change sa hauteur ; chacun fait `diffBatiment` puis `empiler` ; vérifie que les deux entrées ont `baseRev` 1 et des `data` différents (le conflit sera détecté par le serveur).
8. Journal : `ecrasementsSubis` filtre sur l'appareil ; `libelleEcrasement` pour une pièce, une ouverture supprimée, et un nom absent.

## Périmètre
- Fichiers à créer : `frontend/src/sync/objets.js`, `diff.js`, `assembler.js`, `file-envoi.js`, `fusion.js`, `journal.js` ; `frontend/tests/sync-objets.test.mjs`, `sync-diff.test.mjs`, `sync-assembler.test.mjs`, `sync-file.test.mjs`, `sync-fusion.test.mjs`, `sync-journal.test.mjs`.
- Fichiers à lire : `docs/synchronisation.md`, `frontend/src/domain/modele.js`, `frontend/src/domain/historique.js`, `frontend/tests/historique.test.mjs`, `frontend/tests/modele.test.mjs`.
- Tu ne touches à aucun autre fichier (ni `package.json`, ni le domaine, ni le serveur PHP), et jamais à `data/suivi-vision.json` ni à `docs/plan-lots.md`. D'autres fichiers du même dossier `frontend/src/sync/` (stockage, moteur) sont écrits en parallèle par Claude Code : ne les crée pas, ne les modifie pas.
- Aucune nouvelle dépendance. Aucun appel réseau, aucun `Date`, aucun `Math.random` dans les modules.

## Terminé quand
- `npm test` dans `architecture-v1/avereo-app-vision/frontend` passe en entier (les 132 tests existants + les tiens).
- Tous les cas ci-dessus sont couverts ; l'invariant d'aller-retour tient pour les quatre bâtiments de référence.
- Les modules n'importent que `./…` et `../domain/…` ; tu as relu ton diff.

## Ce que tu rends
- Liste des fichiers créés ; commandes lancées et leur résultat ; « À VÉRIFIER » éventuels et questions (en particulier si le contrat te semble ambigu : ne devine pas, dis-le).
Tu ne commites pas, tu ne pousses pas, tu ne merges pas : Claude Code vérifie puis commite.
