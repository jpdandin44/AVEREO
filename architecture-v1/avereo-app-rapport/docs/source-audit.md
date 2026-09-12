---
project: avereo-app-rapport
document_type: source-audit
title: Audit de la source Rapport
status: active
version: git
created: 2026-07-13
updated: 2026-09-12
owner: jpdandin
tags:
  - rapport
  - audit
  - securite
---

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
| IMPORTANT | `frontend/src/App.jsx`, rapport Georisques | Le bouton de rapport des risques de la source historique avait ete omis pendant la migration statique de juillet 2026. | Lien officiel retabli apres validation des coordonnees; seuls longitude et latitude sont transmis; tests unitaires ajoutes. | corrige |
| IMPORTANT | `frontend/src/App.jsx`, synthese Georisques | La consultation externe ne presentait pas les risques dans l'assistant et la recherche echouait entierement lorsqu'aucune parcelle n'etait retournee. | Endpoint JSON V1 public appele avec les seules coordonnees; synthese sourcee et horodatee; cadastre rendu non bloquant; indisponibilite explicite. | valide localement, a qualifier en environnement heberge |
| AMELIORATION | `frontend/src/reportClassification.js`, catalogue | Les categories historiques surchargeaient le choix de creation et Eau, Air, Terre, Feu avaient ete modelises a tort comme sous-categories exclusives. | Deux categories restent selectionnables; Visite Globale utilise le type d'habitation et affiche les quatre dimensions comme parcours ordonne commun; les modules historiques restent masques sans suppression. | a valider |
| AMELIORATION | `frontend/src/App.jsx`, `Visite Globale` | La phase `Ecoute` et ses accords etaient documentes mais absents du parcours fonctionnel. | Section conditionnelle ajoutee dans `Dossier`; donnees incluses dans le payload et le Word; photos et dictee bloquees sans leur accord. | valide localement, a qualifier via CONNECT |
| AMELIORATION | `frontend/src/App.jsx`, protocole Habitologie | Le fil Eau, Air, Terre, Feu etait informatif mais ne guidait ni les controles ni le classement des observations. | Points de controle par phase, observations rattachees et anciennes observations preservees dans `A classer`; export Word aligne. | valide localement, a qualifier via CONNECT |
| AMELIORATION | `frontend/package.json` | La source ne definissait aucun test unitaire frontend. | La suite `node:test` couvre notamment le catalogue visible, les modules masques, la preservation de Reception, la normalisation et les migrations des prototypes; le lint et les tests de composants restent a definir dans la strategie globale. | mitige |
| INFORMATION | `Rapport_AVEREO_Pro.txt` | La source historique presente un encodage mojibake. | La refonte JSX corrige l'affichage et reste la cible. | corrige |
| INFORMATION | `frontend/package.json` | Vite 5 exposait des alertes de dependances de developpement. | Passage a Vite 7 et plugin React 5. Au 11 septembre 2026, `npm audit --omit=dev` est sans alerte; l'audit complet signale `browserslist` et `baseline-browser-mapping`, a traiter en dette non bloquante. | mitige |
| IMPORTANT | `frontend/public/api/`, mode local | Une faute de mode aurait pu activer le jeton administrateur hors local. | Modes stricts; `api_token` exige `environment=local` et un hote `.localhost`. | corrige |
| IMPORTANT | `frontend/public/api/`, schema | Le schema ne doit pas etre cree par le compte runtime. | DDL retire de l'API; migration versionnee appliquee separement. | corrige |
| IMPORTANT | `frontend/src/App.jsx`, export | Une source image importee pouvait etre interpolee dans le document HTML. | Seules les images `data:` bitmap conformes sont integrees; les autres valeurs sont echappees ou ignorees. | corrige |
| IMPORTANT | Entree publique Rapport | L'OAuth Rapport seul permettait de contourner le portail CONNECT. | `index.php`, l'OAuth applicatif et l'API metier exigent un cookie issu d'un ticket CONNECT HMAC court et a usage unique; seul le healthcheck reste public. | a qualifier en preproduction |
| IMPORTANT | Routage Apache des assets | O2Switch reecrivait les fichiers JS/CSS vers `index.html`, produisant une page blanche avec `nosniff`. | Exclusion explicite de `assets`, `api`, `auth` et `connect` avant le fallback SPA. | valide en preproduction |
| IMPORTANT | Qualification locale CONNECT | Le catalogue Docker ouvrait une page Rapport simulee et ne qualifiait donc ni le vrai sas, ni le frontend, ni l'API Rapport. | Mode `gateway-up` propre a Rapport, secret local ignore, surcharge Compose limitee a Rapport et restauration explicite du placeholder. | corrige |
| IMPORTANT | Cookie du sas local | Le cookie et la redirection imposaient HTTPS meme sur `127.0.0.1`, rendant la vraie application inaccessible depuis CONNECT Docker. | HTTP local et cookie non-`Secure` autorises uniquement avec `environment=local`; HTTPS et `Secure` restent obligatoires hors local. | corrige |

## Controle des secrets

### Qualification du lot ecoute et localisation du 12 septembre

- Les nouveaux choix de protocole sont vides ; les sujets explicites de
  l'ecoute suggerent des controles, les choix manuels restant prioritaires.
  Les anciens booleens sont preserves. Aucun texte client n'est transmis a
  un modele IA ni utilise pour une inference automatique.
- Le plan IGN ne recoit que des coordonnees et des parametres cartographiques.
  Iframe externe avec sandbox et `no-referrer` ; ni nom, ni email, ni notes.
  Le service externe recoit cependant la requete reseau du navigateur.
- Les confirmations besoin/lieu sont des mentions de travail, pas des
  signatures electroniques. Leur modification invalide la confirmation liee.
- Limite restante : les commandes de l'iframe IGN chargent, mais son fond
  reste noir dans le navigateur integre ; aucun controle visuel positif du
  fond et du repere n'est revendique. Verifier dans Chrome et corriger la
  dependance si necessaire avant deploiement.
- Aucun changement d'authentification, de secret, de base ou de workflow de
  deploiement dans ce lot.

Aucune cle Gemini/Google, cle Firebase/Supabase, cle privee, valeur de mot de passe ou jeton reel n'a ete detecte dans les fichiers applicatifs audites. Les references `secrets.*` des workflows sont des noms de secrets GitHub, pas leurs valeurs.

## Ecart d'instructions resolu

Les anciens `AGENTS.md` applicatif et plateforme imposaient une V1 statique sans backend ni MySQL. Le proprietaire a confirme le 13 juillet 2026 l'evolution d'architecture. Les instructions ont ete adaptees pour autoriser l'API PHP, MySQL, OAuth et le gateway HTTP local tout en conservant l'isolation applicative.
