# Tableau de préparation production — CONNECT C7/V2

Date de référence : 27 juillet 2026

Statut global : candidat validé en préproduction, production non autorisée

| Contrôle | État | Preuve ou action restante |
|---|---|---|
| Sources backend versionnées | Prêt | PHP 8.3, OpenAPI, migrations et tests présents dans le dépôt |
| Secrets absents du dépôt | Prêt | Seul `.env.example` est versionné avec des valeurs factices |
| Parcours OAuth de préproduction | Validé | Login 200, callback 303, retour 200, session Drupal authentifiée |
| Tests du candidat | Validé | 13/13 sur copie de validation et 11/11 sur instance active |
| Liaison identité Drupal vers utilisateur CONNECT | Bloqué | Définir le provisioning et tester le rattachement du `subject` |
| Accès aux applications et habilitations | Hors périmètre | Nécessite la liaison utilisateur, le catalogue et des données validées |
| Client OAuth Drupal de production | À faire | Créer ou confirmer le client, le secret et le callback exact |
| Émetteur Drupal de production | À faire | Reporter la valeur exacte, slash final compris |
| Clé publique de production | À faire | Déposer hors document root avec droits minimaux |
| Document root O2Switch | À confirmer | Doit pointer vers `backend/public/` uniquement |
| Base CONNECT de production | À faire | Créer une base distincte, sauvegarder puis tester la migration |
| Configuration privée | À faire | Injecter les variables ou créer `config.php` hors document root |
| Plan de retour arrière | À approuver | Sauvegarde, ancienne version et procédure de restauration |
| Déploiement backend automatique | Bloqué volontairement | À traiter dans une gate C11 séparée |

## Décisions de sécurité conservées

- Authorization Code avec PKCE S256 ;
- validation stricte de `state` ;
- code et transaction à usage unique ;
- transaction privée limitée à cinq minutes et liée au navigateur ;
- comparaison du `nonce` lorsqu'il est émis ;
- cookies de session sécurisés et protections CSRF ;
- autorisations contrôlées côté serveur avec refus par défaut ;
- aucune donnée de production et aucun mot de passe Drupal dans le dépôt.

## Point de vigilance Simple OAuth 6.1.1

La version qualifiée ne renvoie pas le `nonce` dans l'ID token. L'absence est
acceptée uniquement pour cette compatibilité ; si le fournisseur renvoie un
`nonce`, sa valeur doit correspondre à la transaction. Les autres protections
restent obligatoires.

## Condition de passage en C11

La production ne peut être engagée qu'après validation humaine de toutes les
lignes « À faire » ou « À confirmer », vérification d'une sauvegarde restaurable
et autorisation explicite de déployer. La fusion de la PR de préparation ne vaut
pas autorisation de mise en production.
