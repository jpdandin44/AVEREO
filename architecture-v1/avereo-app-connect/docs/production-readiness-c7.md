# Tableau de préparation production — CONNECT C7/V2

Date de référence : 29 juillet 2026

Statut global : préproduction partiellement validée, production bloquée

| Contrôle | État | Preuve ou action restante |
|---|---|---|
| Sources backend versionnées | Prêt | PHP 8.3, OpenAPI, migrations et tests présents |
| Secrets absents du dépôt | Prêt | Exemples factices uniquement |
| OAuth CONNECT préproduction | Validé | Login Drupal, callback et session CONNECT réussis |
| Rapport préproduction | Validé après correction | Le routage Apache ne réécrit plus les assets vers `index.html`; OAuth Rapport réussi |
| Coupe préproduction | Validé | Application et OAuth Coupe accessibles |
| Sas CONNECT vers applications | À qualifier | Ticket HMAC, secret distinct, expiration, anti-rejeu et cookie sécurisé préparés dans la branche |
| Refus des accès directs | À qualifier | Rapport et Coupe doivent rediriger vers CONNECT sans cookie de sas |
| Compte CONNECT approuvé | Prêt dans le code | L'identité inconnue est mise en attente ; la CLI d'approbation crée explicitement utilisateur, organisation, adhésion et habilitations |
| Habilitations fines | Prêtes dans le code | Le lancement exige utilisateur, organisation, adhésion et habilitation actifs ; données de production à créer |
| Client OAuth Drupal de production | À faire | Créer ou confirmer client, secret et callback exacts |
| Émetteur Drupal de production | À faire | Reporter la valeur exacte, slash final compris |
| Clé publique de production | À faire | Déposer hors document root avec droits minimaux |
| Document root CONNECT production | Bloquant | cPanel pointe actuellement vers `/Connect.avereo.fr`; la cible backend attend `/Connect.avereo.fr/public` |
| Base CONNECT de production | À confirmer | Base distincte, sauvegarde et migration réversible |
| Configuration privée CONNECT | À faire | OAuth, base et deux credentials applicatifs hors document root |
| Configuration privée Rapport/Coupe | À faire | Secret correspondant et répertoire anti-rejeu distinct pour chaque application |
| Sauvegarde restaurable | Partiellement prête | Les workflows archivent les document roots avant transfert ; les configurations privées et bases doivent être sauvegardées séparément dans cPanel/JetBackup |
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
