# Tableau de préparation production — CONNECT C7/V2

Date de référence : 19 août 2026

Statut global : CONNECT actif en production, sas applicatifs non qualifiés

| Contrôle | État | Preuve ou action restante |
|---|---|---|
| Sources backend versionnées | Prêt | PHP 8.3, OpenAPI, migrations et tests présents |
| Secrets absents du dépôt | Prêt | Exemples factices uniquement |
| OAuth CONNECT préproduction | Validé | Login Drupal, callback et session CONNECT réussis |
| Rapport préproduction | Validé | Ticket CONNECT accepté, OAuth Rapport réussi et application métier affichée |
| Coupe préproduction | Validé | Ticket CONNECT accepté et application métier affichée |
| Sas CONNECT vers applications | Validé en préproduction | Secrets distincts, ticket signé, cookie sécurisé et stockage anti-rejeu opérationnels ; les tests CI couvrent rejeu, altération et mauvais code d'application |
| Refus des accès directs | Validé en préproduction | Les racines Rapport et Coupe renvoient `303` vers CONNECT ; leurs entrées sans ticket renvoient `403` |
| Compte CONNECT approuvé | Validé en préproduction | L'identité Drupal a été mise en attente puis approuvée explicitement ; l'interface d'administration CONNECT remplace la CLI pour l'exploitation courante |
| Habilitations fines | Validées en préproduction | Le profil AVEREO approuvé affiche et ouvre uniquement Rapport et Coupe |
| Client OAuth Drupal de production | Configuré, à requalifier | `connect-production` redirige vers le callback exact de CONNECT production ; le parcours complet reste à rejouer après activation de la base |
| Émetteur Drupal de production | Configuré, à requalifier | CONNECT production redirige actuellement vers `https://avereo.fr/oauth/authorize` |
| Clé publique de production | Configurée | Conservée hors document root avec la configuration privée |
| Document root CONNECT production | Validé | `connect.avereo.fr` cible le répertoire public dédié du backend |
| Base CONNECT de production | Validée | Le healthcheck public retourne `database: ok` |
| Configuration privée CONNECT | Partielle | OAuth et base sont opérationnels ; les cinq paires URL/secret de lancement restent absentes ou invalides |
| Rapport production | Non conforme au sas CONNECT | `/connect/entry.php` renvoie actuellement le frontend en `200` au lieu d'un refus `403` sans ticket |
| Configuration privée Rapport/Coupe | À faire | Installer un secret commun avec CONNECT et un répertoire anti-rejeu distinct pour chaque application |
| Protection GitHub production | Opérationnelle, à renforcer | Le workflow réutilise l'environnement `connect` et ses secrets existants ; imposer un approbateur et empêcher le contournement administrateur lorsque le plan GitHub le permet |
| Sauvegarde restaurable | Vérifiée pour CONNECT | Sauvegarde horodatée des fichiers et de la configuration avant intervention ; conserver aussi les sauvegardes des applications raccordées |
| Retour arrière | À approuver | Restaurer contenus, document root CONNECT et configurations précédentes |
| Workflows de production | Prêts à relire | Manuels, `main` uniquement, confirmation explicite et sauvegarde FTPS avant transfert |

## Décisions de sécurité

- Authorization Code avec PKCE S256 pour les trois clients OAuth ;
- validation stricte de `state` et transactions OAuth à usage unique ;
- ticket de lancement HMAC limité à 90 secondes ;
- secret différent pour Rapport et Coupe ;
- nonce de lancement consommé une seule fois ;
- cookie de sas `Secure`, `HttpOnly` et `SameSite=Lax` ;
- cookie de sas limité à 30 minutes par défaut ;
- endpoints OAuth et métier Rapport/Coupe refusés sans cookie de sas ;
- aucune donnée personnelle dans le ticket ;
- refus par défaut si un secret, une URL ou le stockage anti-rejeu manque ;
- secrets et clés hors document root.

## Condition de production

La production ne peut être engagée qu'après :

1. déploiement et test du sas complet en préproduction ;
2. test anonyme, utilisateur approuvé, ticket altéré, ticket rejoué et mauvais
   code d'application ;
3. sauvegarde vérifiée des trois applications ;
4. préparation des configurations et clients OAuth de production ;
5. modification contrôlée du document root de `connect.avereo.fr` ;
6. validation humaine explicite du lot et du retour arrière.

La fusion de la PR ne vaut pas autorisation de lancer les trois workflows
manuels de production.
