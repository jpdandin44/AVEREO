# Matrice de migration fonctionnelle

| Fonctionnalite | Source | Donnees/services | Cible AVEREO et test | Statut |
| --- | --- | --- | --- | --- |
| Assistant multi-etapes | `Rapport_AVEREO_Pro.txt`, `frontend/src/App.jsx` | Donnees du rapport | Frontend Vite; navigation et reprise manuelles | conservee |
| Brouillon hors ligne | `App.jsx` | IndexedDB, `localStorage` | Mode local conserve; test de rechargement | conservee |
| Photos et camera | `App.jsx` | Fichiers, MediaDevices, data URLs | Frontend; taille bornee avant sauvegarde serveur | adaptee |
| Dictee vocale | `App.jsx` | Web Speech API | Frontend avec degradation gracieuse | conservee |
| Adresse et cadastre | `App.jsx` | BAN, API Carto IGN | Appels publics conserves; erreurs reseau gerees | conservee |
| Urbanisme et Geoportail | `App.jsx` | API Carto, Geoportail | Frontend; verification des liens | conservee |
| Observations et protocoles | `App.jsx` | Donnees metier | Payload JSON du rapport; tests CRUD API | adaptee |
| Signature | `App.jsx` | Canvas/data URL | Frontend puis payload prive authentifie | adaptee |
| Apercu | `App.jsx` | HTML `srcDoc` | Iframe sandboxee sans permission et sans referrer | conservee |
| Export JSON | `App.jsx` | Blob | Frontend; import/export manuel | conservee |
| Export document | `App.jsx` | Blob HTML/Word | Frontend; controle du fichier produit | conservee |
| Sauvegarde en ligne | absente | PHP, PDO, MySQL | `/api/reports.php`, propriete utilisateur, CRUD | adaptee |
| Reouverture depuis la liste serveur | absente | PHP, MySQL | API disponible; interface differee au lot de consolidation OAuth | non integree |
| Authentification | absente | Drupal OAuth/OIDC | `/api/auth.php`, PKCE, roles `utilisateur_rapport`/`administrateur_rapport` | adaptee |
| Mode technique local | absente | Jeton genere localement | `api_token`, ignore de Git, admin local temporaire | adaptee |
| Backend Node.js | absent | aucun | Aucun runtime Node.js en production | non integree |

Aucune fonctionnalite source n'est volontairement supprimee. La persistance serveur et l'authentification sont ajoutees sans retirer le brouillon hors ligne. La preversion reste utilisable sans OAuth avec les brouillons navigateur; la reouverture d'une copie serveur sera finalisee avec le parcours d'authentification de production.
