# Audit de la source Rapport

## Source et integrite

- Archive recue : `architecture-v1/avereo-app-rapport.zip` (exclue de Git).
- SHA-256 : `A54889BD6A11E58ADD977034970EA0BD39A591AD96098318D1E517FBDBFF27BF`.
- Contenu : 6 065 entrees, 70 242 196 octets decompressed.
- Chemins absolus, traversants ou hors destination : aucun.
- Source historique : `Rapport_AVEREO_Pro.txt`.
- Extraction d'audit : `.codex-imports/rapport-gemini-source` (exclue de Git).

Le ZIP est un snapshot AVEREO deja prepare, et non un export Google AI Studio brut. Il contient 6 018 fichiers sous `frontend/node_modules/` ainsi qu'un build `frontend/dist/`; ces fichiers ne sont pas importes. Le `frontend/src/App.jsx` du ZIP est identique au frontend de travail au debut de cette mission.

## Architecture initiale

- React 18, Vite 7 et JavaScript JSX apres mise a niveau de la chaine de build.
- Aucun backend Node.js, Firebase, Supabase ou service serverless.
- Stockage des brouillons dans IndexedDB avec repli `localStorage`.
- Appels navigateur directs vers BAN, API Carto IGN et Geoportail.
- Export JSON et document bureautique genere dans le navigateur.
- Aucun hook `preinstall`, `install`, `postinstall` ou `prepare` dans `package.json`.

## Constats

| Niveau | Fichier/zone | Constat et impact | Correction | Statut |
| --- | --- | --- | --- | --- |
| IMPORTANT | ZIP, `frontend/node_modules/` et `frontend/dist/` | Dependances et build fournis dans la source, non reproductibles et trop volumineux pour Git. | Exclusion; installation par `npm ci`; build par Vite. | corrige |
| IMPORTANT | `frontend/src/App.jsx`, stockage des brouillons | Des donnees personnelles, photos et signatures peuvent rester dans le navigateur. | Mode hors ligne conserve et documente; persistance serveur authentifiee ajoutee; aucun jeton n'est persiste par le frontend. | mitige |
| IMPORTANT | `frontend/src/App.jsx`, import JSON | La source ne fixe pas une limite serveur et accepte des donnees utilisateur. | Limites cote frontend et API, controle de taille du corps et validation JSON. | corrige |
| IMPORTANT | `frontend/src/App.jsx`, apercu `srcDoc` | Des URLs d'images importees sont reinserees dans l'apercu; le cadre n'est pas sandboxe. | `iframe` sandboxee sans permission et politique `no-referrer`. | corrige |
| IMPORTANT | `frontend/src/App.jsx`, appels BAN/IGN | Dependances externes appelees directement par le navigateur, avec disponibilite et CORS hors controle. | Conservees pour le fonctionnement; documentees; proxy PHP a envisager si les conditions d'usage l'exigent. | accepte |
| AMELIORATION | `frontend/package.json` | Aucun lint, test unitaire ou controle TypeScript n'est defini. | Build reproductible conserve; ajouter une suite de tests frontend dans un lot suivant. | ouvert |
| INFORMATION | `Rapport_AVEREO_Pro.txt` | La source historique presente un encodage mojibake. | La refonte JSX corrige l'affichage et reste la cible. | corrige |
| INFORMATION | `frontend/package.json` | Vite 5 exposait des alertes de dependances de developpement. | Passage a Vite 7 et plugin React 5; `npm audit` ne remonte plus de vulnerabilite. | corrige |
| IMPORTANT | `frontend/public/api/`, mode local | Une faute de mode aurait pu activer le jeton administrateur hors local. | Modes stricts; `api_token` exige `environment=local` et un hote `.localhost`. | corrige |
| IMPORTANT | `frontend/public/api/`, schema | Le schema ne doit pas etre cree par le compte runtime. | DDL retire de l'API; migration versionnee appliquee separement. | corrige |
| IMPORTANT | `frontend/src/App.jsx`, export | Une source image importee pouvait etre interpolee dans le document HTML. | Seules les images `data:` bitmap conformes sont integrees; les autres valeurs sont echappees ou ignorees. | corrige |

## Controle des secrets

Aucune cle Gemini/Google, cle Firebase/Supabase, cle privee, valeur de mot de passe ou jeton reel n'a ete detecte dans les fichiers applicatifs audites. Les references `secrets.*` des workflows sont des noms de secrets GitHub, pas leurs valeurs.

## Ecart d'instructions resolu

Les anciens `AGENTS.md` applicatif et plateforme imposaient une V1 statique sans backend ni MySQL. Le proprietaire a confirme le 13 juillet 2026 l'evolution d'architecture. Les instructions ont ete adaptees pour autoriser l'API PHP, MySQL, OAuth et le gateway HTTP local tout en conservant l'isolation applicative.
