# Recette locale et validation en préproduction — AVEREO Vision

Mis en place le 25/11/2026 (décision du responsable, précisée le même jour). Objectif : **voir l'avancement des fonctions dans un navigateur**, sans lire le code.

| Environnement | Rôle | Adresse | Phase du protocole |
|---|---|---|---|
| **Recette** (locale) | essayer le **candidat de la PR en cours** sur ce poste, avec des comptes et des données fictifs | <http://127.0.0.1:5250/revue/> | 1 — Développement local |
| **Validation** (préproduction) | valider le candidat retenu **sur l'hébergement réel**, avec le vrai CONNECT de préproduction | `https://vision-preprod.avereo.fr/` (lancement depuis `https://connect-preprod.avereo.fr/`) | 2 — Préproduction |

Lien dans les PR (case « J'ai testé l'environnement de validation ») : en phase 1, l'adresse de la **recette locale** ; en phase 2, l'adresse de **préproduction**, avec la version installée (règle du modèle de PR du dépôt).

## Recette locale

### Entrer dans l'application
1. Ouvrir <http://127.0.0.1:5250/revue/>.
2. Choisir un compte fictif : **Conseiller A** (ses projets de démonstration), **Conseiller B** (un autre conseiller : il ne voit pas les projets de A), **Fondateur F** (voit et modifie tous les projets).
3. La page fabrique un **ticket signé au format CONNECT** et passe par la vraie passerelle de Vision (`/connect/entry.php`) : c'est le parcours de production, sans CONNECT. Cette page n'existe qu'en local, jamais dans l'application livrée.
4. Pour changer de compte : « Se déconnecter » dans l'application, puis revenir sur `/revue/`.

### Commandes (PowerShell, depuis `architecture-v1/avereo-app-vision`)
```powershell
powershell -ExecutionPolicy Bypass -File .\local\vision-revue.ps1 up -Source "C:\Users\examg\Documents local\avereo-vision-lot2b"
powershell -ExecutionPolicy Bypass -File .\local\vision-revue.ps1 etat
powershell -ExecutionPolicy Bypass -File .\local\vision-revue.ps1 down
```
- `up -Source <worktree de la PR>` construit l'application de cette source (`npm run build`), démarre la recette, applique les migrations et charge les données de démonstration. La source est **mémorisée** : ensuite, `up`, `donnees`, `logs`, `etat`, `down` s'utilisent sans `-Source`. Pour passer à la PR suivante, refaire `up -Source <son worktree>`.
- Pour revoir l'état intégré (`main`) : `actualiser` met le worktree `…\Documents local\avereo-vision-recette` sur le dernier `main`, puis `up -Source "C:\Users\examg\Documents local\avereo-vision-recette"`.
- `donnees` complète les données de démonstration qui manquent (un relevé modifié pendant la recette est conservé, y compris par `up`) ; `donnees -Confirmer` remet les relevés de démonstration dans leur état d'origine ; `reset -Confirmer` efface la base de la recette ; `logs` affiche les journaux.
- Docker Desktop doit être lancé (son moteur peut mettre quelques minutes à démarrer). La recette ne redémarre pas seule après un redémarrage de Windows : relancer `up`.
- Elle ne touche ni la pile de développement (`vision-local.ps1`, port 8110) ni les autres applications.

### Données de démonstration
- Conseiller A : « Maison Martin (démo) » avec le relevé de référence REF-2 (pièce 4,00 × 3,00 m, hauteur 2,50 m, une porte, une fenêtre : murs nets 31,96 m²) ; « Appartement en L (démo) » (REF-3, séjour en L) ; « Ancien projet (démo, archivé) ».
- Conseiller B : « Studio Durand (démo) ».
- Si la source n'a pas encore la synchronisation (version antérieure au Lot 2B), seuls les projets sont chargés.

### Scénario de recette (Lot 2B : enregistrement automatique et synchronisation)
1. **R01** : Conseiller A voit ses trois projets (filtre « Projets archivés » pour le troisième) ; B ne voit que le sien ; F voit tout.
2. **R03** : ouvrir « Maison Martin », modifier une cote, **recharger la page** : la modification est là ; l'en-tête affiche « Enregistré ».
3. **R04** : la page étant ouverte, arrêter le serveur de la recette (`docker stop vision-revue-recette-api-1`), modifier le relevé **sans recharger la page** (ce serveur sert aussi l'application : le rechargement hors ligne viendra avec le service worker du Lot 2C) : rien n'est perdu, l'en-tête affiche « Hors ligne : n modification(s) en attente d'envoi » ; relancer (`docker start vision-revue-recette-api-1`) : « Enregistré » en moins de 30 s.
4. **R05** : deux « appareils » = deux navigateurs différents (ou une fenêtre de navigation privée) avec le même compte : une modification faite dans l'un apparaît dans l'autre en moins de 30 s.
5. **R06** : couper le serveur, modifier le **même** élément dans les deux navigateurs, relancer : la modification reçue en dernier est gardée, l'autre figure dans « Journal des modifications remplacées » de l'écran du relevé.
6. **Création hors ligne** : serveur coupé, créer un projet : il apparaît « En attente d'envoi (création) » ; au retour, il est envoyé sans doublon.

### Limites de la recette locale
- Serveur PHP intégré, pas Apache : les `.htaccess` ne sont pas lus (le routeur reproduit leurs interdictions). Ce n'est **pas** une préproduction.
- Le navigateur garde des données locales par adresse : effacer les données du site remet l'appareil à zéro (les données du serveur restent).
- Pas de service worker avant le Lot 2C : une page rechargée pendant que le serveur de la recette est arrêté ne s'ouvre pas.
- Adresse en `vision.avereo.localhost` via le gateway partagé du dépôt : possible plus tard (modification de `architecture-v1/avereo-platform/`, accord requis).

## Validation en préproduction
- Cible : `https://vision-preprod.avereo.fr/` (sous-domaine confirmé le 24/11/2026), hébergement mutualisé O2Switch comme Rapport, ouverte depuis le catalogue de **CONNECT préproduction** avec un compte de recette habilité (accès réservé compte par compte).
- **État au 25/11/2026 : pas encore installée.** Procédure : `docs/deploiement-mutualise.md` (sous-domaine, base à deux comptes, configuration privée, migrations 001 et 002, dépôt de `dist/`, livraison préalable du code CONNECT de la PR #196 en préproduction, catalogue et habilitations). Chaque étape sur l'hébergement et sur CONNECT demande l'accord explicite du responsable.
- Le passage en validation suit le protocole : contrôles locaux et recette réussis sur le candidat, cible isolée prête, accord de préproduction ; la version installée (commit, empreinte de l'archive) est reliée dans la PR.
