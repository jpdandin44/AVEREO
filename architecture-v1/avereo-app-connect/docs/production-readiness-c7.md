# Tableau de préparation production — CONNECT C7/V2

Date de référence : 30 juillet 2026

Statut global : préproduction validée, production bloquée par sa configuration dédiée

| Contrôle | État | Preuve ou action restante |
|---|---|---|
| Sources backend versionnées | Prêt | PHP 8.3, OpenAPI, migrations et tests présents |
| Secrets absents du dépôt | Prêt | Exemples factices uniquement |
| OAuth CONNECT préproduction | Validé | Login Drupal, callback et session CONNECT réussis |
| Rapport préproduction | Validé | Ticket CONNECT accepté, OAuth Rapport réussi et application métier affichée |
| Coupe préproduction | Validé | Ticket CONNECT accepté et application métier affichée |
| Sas CONNECT vers applications | Validé en préproduction | Secrets distincts, ticket signé, cookie sécurisé et stockage anti-rejeu opérationnels ; les tests CI couvrent rejeu, altération et mauvais code d'application |
| Refus des accès directs | Validé en préproduction | Les racines Rapport et Coupe renvoient `303` vers CONNECT ; leurs entrées sans ticket renvoient `403` |
| Compte CONNECT approuvé | Validé en préproduction | L'identité Drupal a été mise en attente puis approuvée explicitement par la CLI |
| Habilitations fines | Validées en préproduction | Le profil AVEREO approuvé affiche et ouvre uniquement Rapport et Coupe |
| Client OAuth Drupal de production | Configuré, à requalifier | `connect-production` redirige vers le callback exact de CONNECT production ; le parcours complet reste à rejouer après activation de la base |
| Émetteur Drupal de production | Configuré, à requalifier | CONNECT production redirige actuellement vers `https://avereo.fr/oauth/authorize` |
| Clé publique de production | À faire | Déposer hors document root avec droits minimaux |
| Document root CONNECT production | Bloquant | cPanel pointe actuellement vers `/Connect.avereo.fr`; la cible backend attend `/Connect.avereo.fr/public` |
| Base CONNECT de production | Bloquant | Le healthcheck public indique actuellement `database: not_configured` |
| Configuration privée CONNECT | Partielle | OAuth est présent ; base et deux credentials applicatifs restent à préparer hors document root |
| Configuration privée Rapport/Coupe | À faire | Secret correspondant et répertoire anti-rejeu distinct pour chaque application |
| Sauvegarde restaurable | Préproduction vérifiée | Archive horodatée des trois applications et configurations privées créée ; la sauvegarde de production doit encore inclure bases et configurations privées |
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
