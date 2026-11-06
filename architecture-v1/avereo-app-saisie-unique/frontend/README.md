# AVEREO UNI — application

AVEREO UNI sert à saisir une seule fois les données d'un dossier de rénovation. Les documents du dossier se
pré-remplissent ensuite : plan de financement, attestations de travaux, demandes d'avance et d'acompte, demande d'aide,
procurations, rapport de fin d'accompagnement… L'outil suit aussi les dossiers et calcule des ratios de coûts. La
version 1 fonctionne sur des données fictives, stockées dans le navigateur ; elle n'envoie rien sur le réseau. Les
dossiers s'exportent dans un fichier de sauvegarde, et s'importent sans remplacer ceux présents.

Il faut Node.js 20 ou plus récent. Depuis ce dossier :

```
npm install
npm test
npm run build
```

`npm run build` produit `dist/index.html`, un fichier unique à ouvrir d'un double-clic. `npm run build -- --livrer` le
copie aussi sous `../AVEREO UNI.html`. Pour les tests d'écran : `npx playwright install chromium`, puis
`npm run test:e2e`.

Les listes de choix qui nomment un acteur réel, et les paramètres de l'organisation, se lisent dans
`valeurs-locales.json`. Ce fichier propre au poste n'est jamais versé (`.gitignore`) ; son modèle est
`valeurs-locales.exemple.json`. Sans lui, l'application prend les valeurs génériques.

| Dossier | Contenu |
|---|---|
| `src/config/` | configuration pilotée par les données : 251 champs aux identifiants stables, 13 documents, listes, ratios |
| `src/lib/` | modèle, calculs, signalements, journal, progression, ratios, état et persistance |
| `src/ui/` | interface React |
| `tests/unit/`, `tests/e2e/` | tests unitaires (testeur de Node) et tests d'écran (Playwright) |

Choix techniques, matrice de traçabilité et recette : [../docs/01-developpement-local.md](../docs/01-developpement-local.md).
