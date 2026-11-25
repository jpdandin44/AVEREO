# Environnements locaux de recette et de validation — AVEREO Vision

Mis en place le 25/11/2026 (décision du responsable). Objectif : **voir l'avancement des fonctions dans un navigateur**, sans lire le code, comme pour les autres applications du dépôt (chaque PR donne un service de revue local).

| Environnement | Ce qu'il montre | Adresse | Source |
|---|---|---|---|
| **Recette** | l'application telle qu'elle est **après les merges** (`main`) : l'avancement cumulé | <http://127.0.0.1:5250/revue/> | worktree dédié `…\Documents local\avereo-vision-recette`, détaché sur `origin/main` |
| **Validation** | le **candidat de la PR en cours** (sa branche), avant le merge | <http://127.0.0.1:5251/revue/> | le worktree de la branche de la PR |

Le lien de validation est celui de la case « J'ai testé l'environnement de validation » des PR de Vision. Chaque environnement a **sa propre base** et ses **données de démonstration** ; ils ne touchent ni la pile de développement (`vision-local.ps1`, port 8110) ni les autres applications. Tout est **local** (adresses `127.0.0.1`, rien n'est publié) et **fictif**.

## Entrer dans l'application
1. Ouvrir l'adresse `…/revue/` de l'environnement.
2. Choisir un compte fictif : **Conseiller A** (ses projets de démonstration), **Conseiller B** (un autre conseiller : il ne voit pas les projets de A), **Fondateur F** (voit et modifie tous les projets).
3. La page fabrique un **ticket signé au format CONNECT** et passe par la vraie passerelle de Vision (`/connect/entry.php`) : c'est le parcours de production, sans CONNECT. Cette page n'existe qu'en local, jamais dans l'application livrée.
4. Pour changer de compte : « Se déconnecter » dans l'application, puis revenir sur `/revue/`.

## Commandes (PowerShell, depuis `architecture-v1/avereo-app-vision`)
```powershell
powershell -ExecutionPolicy Bypass -File .\local\vision-revue.ps1 up -Nom recette
powershell -ExecutionPolicy Bypass -File .\local\vision-revue.ps1 up -Nom validation -Source "C:\Users\examg\Documents local\avereo-vision-lot2b"
powershell -ExecutionPolicy Bypass -File .\local\vision-revue.ps1 etat
powershell -ExecutionPolicy Bypass -File .\local\vision-revue.ps1 actualiser -Nom recette
powershell -ExecutionPolicy Bypass -File .\local\vision-revue.ps1 down -Nom validation
```
- `up` construit l'application de la source (`npm run build`), démarre l'environnement, applique les migrations et charge les données de démonstration (sans doublon si on recommence). Docker Desktop doit être lancé. Les environnements ne redémarrent pas seuls après un redémarrage de Windows : relancer `up`.
- `actualiser -Nom recette` met le worktree de recette sur le dernier `main` (après un merge), puis `up -Nom recette` reconstruit.
- Pour la validation, seul `up` demande `-Source` : les autres commandes (`donnees`, `down`, `logs`, `reset`) reprennent la source du dernier `up`.
- `donnees -Nom …` complète les données de démonstration qui manquent (un relevé déjà modifié pendant la recette est conservé, y compris par `up`) ; `donnees -Nom … -Confirmer` remet les relevés de démonstration dans leur état d'origine ; `reset -Nom … -Confirmer` efface la base de l'environnement ; `logs -Nom …` affiche les journaux.
- `down` n'arrête que l'environnement nommé.

## Données de démonstration
- Conseiller A : « Maison Martin (démo) » avec le relevé de référence REF-2 (pièce 4,00 × 3,00 m, hauteur 2,50 m, une porte, une fenêtre : murs nets 31,96 m²) ; « Appartement en L (démo) » (REF-3, séjour en L) ; « Ancien projet (démo, archivé) ».
- Conseiller B : « Studio Durand (démo) ».
- Tant que la synchronisation (Lot 2B) n'est pas mergée, la **recette** ne montre que les projets : les relevés de démonstration n'y sont pas chargés.

## Scénario de recette (Lot 2B : enregistrement automatique et synchronisation)
1. **R01** : Conseiller A voit ses trois projets (filtre « Projets archivés » pour le troisième) ; B ne voit que le sien ; F voit tout.
2. **R03** : ouvrir « Maison Martin », modifier une cote, **recharger la page** : la modification est là ; l'en-tête affiche « Enregistré ».
3. **R04** : la page étant ouverte, arrêter le serveur de l'environnement (`docker stop vision-revue-validation-api-1`), modifier le relevé **sans recharger la page** (ce serveur sert aussi l'application : le rechargement hors ligne viendra avec le service worker du Lot 2C) : rien n'est perdu, l'en-tête affiche « Hors ligne : n modification(s) en attente d'envoi » ; relancer (`docker start vision-revue-validation-api-1`) : « Enregistré » en moins de 30 s.
4. **R05** : deux « appareils » = deux navigateurs différents (ou une fenêtre de navigation privée) avec le même compte : une modification faite dans l'un apparaît dans l'autre en moins de 30 s.
5. **R06** : couper l'API, modifier le **même** élément dans les deux navigateurs, relancer : la modification reçue en dernier est gardée, l'autre figure dans « Journal des modifications remplacées » de l'écran du relevé.
6. **Création hors ligne** : API coupée, créer un projet : il apparaît « En attente d'envoi (création) » ; au retour, il est envoyé sans doublon.

## Limites
- Serveur PHP intégré, pas Apache : les `.htaccess` ne sont pas lus (le routeur reproduit leurs interdictions). C'est un environnement de revue, **pas une préproduction** : la recette hébergée suit `docs/deploiement-mutualise.md`.
- Le navigateur garde des données locales par adresse : recette (5250) et validation (5251) ne se mélangent pas ; effacer les données du site remet l'appareil à zéro (les données du serveur restent).
- Pas de service worker avant le Lot 2C : une page rechargée pendant que le serveur de l'environnement est arrêté ne s'ouvre pas.
- Adresse en `vision.avereo.localhost` via le gateway partagé du dépôt : possible plus tard (modification de `architecture-v1/avereo-platform/`, accord requis).
