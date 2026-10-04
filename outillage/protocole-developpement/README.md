---
project: protocole-developpement
document_type: readme
title: Protocole commun de développement
status: active
version: git
created: 2026-10-03
updated: 2026-10-04
owner: jpdandin
tags: [developpement, github, cockpit]
---

# Protocole commun de développement

Un cycle pour les sites, applications et agents : **Cadrage → Développement local → Préproduction → Mise en production**.

La source du processus est le [protocole du skill](skills/developpement-github-cockpit/references/protocole.md). Le [skill](skills/developpement-github-cockpit/SKILL.md) rend ce processus réutilisable par Codex. Les consignes globales le référencent ; aucune installation de workflow distant ni autorisation de production n'en découle.

## Utiliser

Prérequis : Git et Python 3.10+ pour le contrôleur local. Le cockpit de revue AVEREO nécessite son runtime Node.js et ses dépendances existantes. Les commandes de tests et de livraison restent propres à chaque dépôt.

1. Invoquer `$developpement-github-cockpit` dans le projet concerné.
2. Relier l'itération au suivi canonique et au cockpit existants ; compléter les cibles et les commandes réellement vérifiées.
3. Contrôler les preuves avant chaque passage, puis conserver les reçus et décisions humaines.

## Installation commune aux dépôts

La source est versionnée dans `jpdandin44/AVEREO`, sous `outillage/protocole-developpement`.
Cela ne limite pas le protocole aux applications AVEREO. Installer les deux skills une fois
au niveau utilisateur, puis les appeler depuis n'importe quel dépôt du responsable.

Sous Windows avec PowerShell 7, depuis ce dossier :

```powershell
./scripts/install-skills.ps1
```

Les jonctions dans `~/.agents/skills` et `~/.codex/skills` pointent vers la même source.
L'installateur préserve les dossiers ordinaires. Pour réaligner des jonctions connues après
un déplacement du checkout, utiliser `-ReplaceExistingLinks`. Sur un autre système,
créer dans `~/.agents/skills` les deux liens vers `skills/dev` et `skills/developpement-github-cockpit`.

Sur un autre poste, récupérer ce socle depuis GitHub puis l'installer pour son utilisateur.
Dans chaque dépôt, appeler `$dev` avec l'objectif ; les cibles, commandes et suivis restent
propres au projet. La règle globale du responsable reconnaît également `DEV :`.
Les sources évoluent par PR ; actualiser le checkout du socle après la validation et le merge.

L'appel court est **`$dev`**, fourni par le [skill DEV](skills/dev/SKILL.md). On peut aussi commencer une demande par **`DEV :`**, sans distinction de casse. Le nom long reste utilisable. Le mot-clé active le protocole ; il n'ajoute pas d'autorisation de livraison.

Exemples : « $dev Ajouter cette fonctionnalité à mon application. » ou « DEV : reprendre le développement du site AVEREO.fr. » Ajouter l'objectif et le périmètre au mot-clé. Les accès, cibles et commandes du projet sont ensuite qualifiés avant toute action distante.

Le [cockpit local de revue](http://127.0.0.1:5194/) présente le lot de création. Pour le relancer après l'arrêt de la machine :

```powershell
node scripts/start-cockpit.mjs --background
```

```powershell
python skills/developpement-github-cockpit/scripts/check-gate.py --state CHEMIN_JSON --gate preproduction
python skills/developpement-github-cockpit/scripts/check-gate.py --state CHEMIN_JSON --gate production
python skills/developpement-github-cockpit/scripts/check-gate.py --state CHEMIN_JSON --gate close
python -m unittest discover -s tests
python -m pip install PyYAML==6.0.3
python scripts/check-docs.py
```

Le contrôleur lit la fiche et refuse les informations absentes ou incompatibles avec le candidat. La fraîcheur et l'authenticité des preuves originales restent à vérifier. Il ne déploie pas et n'accorde aucun droit.

PyYAML sert uniquement à la validation documentaire. La CI `Developpement commun`
exécute ces tests sur les modifications du socle ; aucun de ses jobs ne déploie.

## Sources et structure

- [Architecture](architecture.md), [exigences](requirements.md), [décisions](decisions.md), [roadmap](roadmap.md), [changelog](changelog.md).
- [Contrat du cockpit](skills/developpement-github-cockpit/references/cockpit.md) et [fiche d'itération](skills/developpement-github-cockpit/assets/iteration.json).
- [Raccordement local](workflows/cockpit-local.md), [consigne réutilisable](prompts/nouvelle-iteration.md), [API locale](api/README.md).
- [État du lot de création](docs/pilotage/suivi-chantier.json) : les quatre phases sont visibles dans le moteur de revue existant ; aucune phase n'est approuvée par l'agent.

## État et limites

Socle et skills créés, installés et vérifiés localement. Les [preuves de vérification](data/verification.json) distinguent les essais locaux des décisions humaines et des livraisons. La [PR #73](https://github.com/jpdandin44/AVEREO/pull/73) de création a été fusionnée le 3 octobre, état relu sur GitHub le 4 octobre. La règle à quatre phases constitue un nouveau lot local à revoir ; le merge de création n’en vaut pas approbation. Les contrôles GitHub de création restent ceux de la révision consignée dans les preuves. Le cockpit commun définitif reste à confirmer. Les workflows opérationnels existants restent propres à leurs projets. Le skill et le contrat ne constituent pas une surveillance GitHub continue ni un pilote de déploiement automatique.
