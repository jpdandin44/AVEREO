## Summary
- What problem does this PR solve?

## Changes
- List the main changes in this PR.

## Validation
- Nommer la phase et son environnement de revue : local pour 0 Cadrage et 1 Développement local ; préproduction pour 2 Préproduction et 3 Mise en production.
- En phase 3, les contrôles après livraison portent sur la production réelle et restent distincts de la revue du candidat en préproduction.
- Pour une revue de préproduction, relier la cible hébergée et la version installée ; les essais locaux restent des preuves distinctes.
- Describe how you tested the changes.
- Include command output or screenshots when relevant.

## Risks
- List known risks, regressions, or follow-up tasks.

## Checklist

<!-- Seul le responsable humain du projet valide et coche cette checklist. -->
<!-- Remplacer les emplacements ci-dessous par les liens directs de l'environnement déclaré dans Validation et de la pull request concernée. -->
<!-- URL_LOCALE_APPLICATION est l'identifiant historique du champ ; le remplacer par la cible de revue de la phase, locale ou préproduction. -->
- [ ] J'ai testé [l'environnement de validation](URL_LOCALE_APPLICATION).
- [ ] J'ai contrôlé [les fichiers modifiés](URL_DIFF_PULL_REQUEST) et [les impacts sécurité/données documentés](URL_VALIDATION_SECURITE_DONNEES).
- [ ] J'ai consulté et validé [la documentation](URL_DOCUMENTATION).
- [ ] J'autorise le merge de cette PR.
