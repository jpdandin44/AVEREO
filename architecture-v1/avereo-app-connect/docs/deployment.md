# Déploiement - AVEREO CONNECT

## État actuel

- Domaine cible : `connect.avereo.fr`
- Hébergeur : O2Switch / cPanel
- Workflow automatique : frontend React/Vite uniquement
- Backend C7/V2 : candidat préparé, non déployé automatiquement
- Base de production : non créée et non migrée par cette PR

Le chemin public O2Switch du backend n'est pas présumé dans le dépôt. Il doit
être confirmé dans cPanel avant toute copie afin que le document root pointe
vers `backend/public/` et que les fichiers privés restent hors accès web.

## Gate C11 préalable

Avant toute mise en production, le responsable humain doit valider :

1. la sauvegarde complète des fichiers et de la base existante ;
2. le document root exact de `connect.avereo.fr` ;
3. le client OAuth Drupal de production et son callback exact ;
4. l'émetteur Drupal exact, slash final compris ;
5. la clé publique et les variables privées hors document root ;
6. une base distincte, ses droits minimaux et la migration testée ;
7. une fenêtre de déploiement et un plan de retour arrière ;
8. les tests fonctionnels et de sécurité après déploiement.

## Préparation reproductible

Le package backend peut être construit localement sans secret :

```powershell
python scripts/package_backend.py backend artifacts/connect-backend.tar.gz
```

Le package ne doit jamais contenir de fichier `.env`, de clé privée, de journal
ou de donnée de production. `backend/.env.example` inventorie les variables
attendues ; leurs valeurs doivent être injectées par l'hébergeur ou placées dans
un `config.php` privé hors document root.

## Ordre d'exécution autorisé en C11

1. sauvegarder et identifier un point de restauration ;
2. déployer dans un nouveau répertoire versionné ;
3. créer la configuration privée à partir de la liste `.env.example` ;
4. exécuter la migration `up` après contrôle de la cible ;
5. basculer le document root ou le lien de version ;
6. tester santé, session anonyme, login, callback et autorisations ;
7. surveiller les erreurs sans afficher de détails au navigateur.

## Retour arrière

En cas d'échec, remettre l'ancien document root ou l'ancienne version, restaurer
la configuration précédente et n'exécuter la migration `down` qu'après avoir
vérifié son impact sur les données. Une restauration de sauvegarde reste la
référence si des données ont été écrites.

Cette procédure documente la future intervention ; elle ne vaut pas
autorisation de déployer.
