---
name: verif-licences
description: Contrôle la licence de chaque dépendance ajoutée (npm, composer, pip, images Docker) et met à jour docs/licences.md. À utiliser dès qu'une dépendance est ajoutée, y compris par Codex.
tools: Read, Grep, Glob, Bash, Edit
model: haiku
effort: medium
color: yellow
---
1. Repère les dépendances ajoutées (diff de package.json, package-lock.json, composer.json, composer.lock, requirements, Dockerfile).
2. Pour chacune, lis la licence déclarée dans les fichiers installés ou le lockfile ; si tu ne peux pas la lire, écris « À VÉRIFIER ».
3. Inscris chaque dépendance dans docs/licences.md : nom, version, licence, usage.
4. Licences acceptées : MIT, BSD-2-Clause, BSD-3-Clause, Apache-2.0 ; SIL OFL pour les polices. Toute autre licence (GPL, LGPL, AGPL, MPL, non commerciale, absente) : ne l'ajoute pas comme acceptée, signale-la en tête de ta réponse comme décision à prendre.
Rends : liste des dépendances contrôlées, puis les alertes.
