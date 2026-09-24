# AVEREO Collector Recherche

- Slug : `recherche`
- Domaine cible : `recherche.avereo.fr`
- Accès : carte du catalogue AVEREO CONNECT, via le sas signé (voir `avereo-app-connect/docs/application-gateway.md`)
- Type : React SPA (Vite), statique, avec le sas PHP partagé
- Source : application nouvelle, sans source historique. Spécification : `04_Proposition_Collector_Recherche-v1.md` (dossier AVEREO COLLECTOR)
- API éventuelle : `GET /search` de la GED AVEREO

## Ce que fait l'application

- **Rechercher** dans le corpus : plein texte sans accents, par préfixe, tolérante aux fautes légères. Filtres par origine, type, domaine et usage client. Les textes officiels et les sources institutionnelles passent devant pour les questions de seuil ou de réglementation.
- **Citer** : copie de la citation ou de l'extrait avec sa source ; panier exportable en 3 formats internes et 3 styles client (simple, classe, pédagogique).
- **Réemployer sans risque** : en style client, un contenu non validé est remplacé par un emplacement « à reformuler », et sa référence est conservée.
- **Ajouter** : saisie manuelle ; import de fiches Markdown Collector, de fichiers `.txt` et de sauvegardes `.json`.
- **Valider** : circuit `ELIGIBLE_FOR_REVIEW` → validé ou refusé, tracé (par, le, justification, preuve des droits).
- **Registre des sources** : Légifrance, AQC, ADEME, France Rénov', CSTB, Cerema, AFNOR, AVEREO, avec leurs règles de réemploi par défaut.
- **Amélioration** : recherches sans résultat, contenus les plus copiés, résultats « pas utiles », idées ; sauvegarde et restauration.

## Données

Aucune donnée n'est envoyée sur un serveur : le corpus est enregistré dans le navigateur (IndexedDB), et l'artefact publié n'en contient aucune.
- Sauvegarder régulièrement (page Amélioration) et ranger le fichier `.json` dans `GED_AVEREO`.
- Pour changer de navigateur ou de poste : exporter, puis restaurer.

## Commandes locales

```bash
cd frontend
npm ci
npm run dev      # http://127.0.0.1:5174 (Vite sert index.html directement, sans le sas)
npm test         # règles métier : citations, import, recherche
npm run build    # copie le sas partagé, puis construit dist/
```

`npm run dev` et `npm run build` copient d'abord `avereo-platform/shared/connect-gate.php` dans `public/connect/gate.php`, par `.github/scripts/prepare-connect-gate.mjs recherche`, comme pour Projet, Thermo et Drone.

## Déploiement

Voir `docs/deployment.md`. Le workflow `.github/workflows/deploy-recherche-o2switch.yml` est manuel.
