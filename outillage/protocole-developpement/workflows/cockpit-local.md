---
project: protocole-developpement
document_type: workflow
title: Raccordement du protocole au cockpit local
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [developpement, github, cockpit]
---

# Raccordement local

La configuration publiée pointe vers le moteur Projet du monorepo. Sur un poste déjà
qualifié, `.local/cockpit-local.json` peut préciser le checkout du moteur, ses dépendances
et le port ; ce fichier privé est ignoré par Git. Le lanceur et le test de raccordement
résolvent les chemins relatifs depuis la racine du socle.

Ce socle réutilise le moteur de revue Projet existant pour afficher les trois phases de [son suivi](../docs/pilotage/suivi-chantier.json). La cible définitive du cockpit reste à préciser par le responsable. Les suivis des sites et applications restent inchangés.

La [configuration](../data/cockpit-local.json) indique le chemin local du moteur et le port explicite 5194. Vérifier ce chemin sur une autre machine. Le moteur doit disposer de ses dépendances Node.js existantes.

```powershell
python docs/pilotage/actualiser-tableau-de-bord.py
node scripts/start-cockpit.mjs --background
```

Adresse : [cockpit local du protocole](http://127.0.0.1:5194/). Le lanceur écoute uniquement sur la boucle locale, refuse un port occupé par un autre chantier et ne remplace aucun service. Ses journaux sont locaux dans `.local/cockpit.log`.

Le cockpit permet de lire les documents, critères, observations et de prendre des décisions humaines, avec les protections existantes de révision et de verrou. Une décision de revue ne déploie pas, ne fusionne pas de PR et ne crée pas de secret. Les contrôles de passage du skill restent requis pour les actions distantes.

Pour un nouveau projet, utiliser le même contrat d'itération et mapper son suivi existant ; ne pas recopier ici son journal. Les métadonnées GitHub et recettes se rafraîchissent aux passages ; aucune synchronisation continue n'est installée.
