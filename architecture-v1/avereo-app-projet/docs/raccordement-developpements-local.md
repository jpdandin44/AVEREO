---
project: avereo-app-projet
document_type: procedure-raccordement
title: Raccorder Développements au propriétaire et aux suivis réels — local uniquement
status: proposed
version: git
created: 2026-11-07
updated: 2026-11-07
owner: jpdandin
tags: [developpements, raccordement, administrateur-global, confidentialite, local]
---

# Raccordement local au compte administrateur global et aux vrais suivis

## Reprise ultérieure du 7 novembre — option locale distincte autorisée

La clôture ci-dessous reste historique. Le responsable demande ensuite le portefeuille pour toutes les applications et confirme « Oui, accès privé local et lecture seule ». Le [guide du portefeuille](cockpit-portefeuille.md) décrit cette capacité locale désormais utilisée pour lire les vrais suivis. **Ce n'est pas le raccordement SSO décrit dans cette procédure** : l'autorité du rôle global CONNECT reste non qualifiée, aucune identité ni permission CONNECT n'est modifiée. Les écritures réelles et les déploiements restent interdits.

## Statut et limites impératives

**Procédure préparatoire, non exécutée.** Le responsable a demandé le 7 novembre de documenter puis de clore la session, sans raccorder. Aucun compte réel, registre actif, rôle, secret, source réelle ou environnement hébergé n'est modifié. Les quatre phases restent **Cadrage → Développement local → Préproduction → Mise en production** ; ce travail demeure dans le Développement local, sans accord de phase suivante.

Le résultat futur recherché est : seul **le compte CONNECT exact du responsable**, dont la qualité d'administrateur global est attestée par une autorité serveur qualifiée, peut lire les développements. Ce n'est pas un accès pour « tous les administrateurs ». Un autre administrateur global doit être refusé, comme un owner/admin d'organisation, un membre ou un client.

Cette procédure ne constitue ni un raccordement SSO installé, ni une preuve de refus sur les profils réels. La relecture du code et des tests fictifs permet de vérifier la politique locale existante ; la recette des comptes réels reste à effectuer lors d'un lot expressément autorisé.

## 1. État vérifié dans la copie locale

Référence inspectée : branche `feat/projet-developpements-admin-local`, base Git `a245cdd5dd747b6181a75e691db31a5d31081bd9`. Cette base est datée ; aucun état hébergé ou GitHub plus récent n'est déduit de cette inspection.

| Élément | Constat et conséquence |
| --- | --- |
| `workflows/start-developments.mjs` | `--demo` crée une identité fictive ; `--config` accepte un identifiant et une confirmation locale. Il n'interroge pas CONNECT pour vérifier un rôle. |
| `workflows/development-access.mjs` | La session locale est épinglée à un seul ID. `global_admin` et `local_private_administrator` sont des valeurs du mécanisme local, **pas des droits CONNECT attestés**. |
| [Émetteur du ticket CONNECT](../../avereo-app-connect/backend/src/Security/AppLaunchTicketIssuer.php) | Le ticket contient l'application, la période, le nonce et `identity.provider/id`, pas le rôle global. Décoder le ticket sans vérifier sa signature ne prouve aucune identité. |
| [Contexte de session CONNECT](../../avereo-app-connect/backend/src/Security/AuthContext.php) | Expose identité et date d'authentification, pas une attestation de rôle global. |
| [Administration CONNECT](../../avereo-app-connect/backend/src/Repository/PdoConnectRepository.php) | Les droits consultés sont des rôles par organisation (`owner`, `admin`, `member`, `viewer`). `owner` d'une organisation ne doit jamais être assimilé automatiquement à administrateur global. |
| `workflows/development-http.mjs` | Le garde d'accès précède toutes les ressources du serveur ; liste, détail, preuves et revues sont privés, pas uniquement la navigation. |
| `workflows/development-store.mjs` | Registre de chemins autorisés, lecture par adaptateurs ; écriture seulement avec opt-in explicite du registre et du suivi. |

**Blocage réel :** le rattachement entre le compte du responsable et la notion d'administrateur global n'est pas démontré par les contrats inspectés. Aucune route d'introspection globale opérationnelle n'est revendiquée. La chaîne d'autorité et son mode de consultation restent `TBD — à qualifier` ; le service doit rester fermé aux sources réelles tant que cela manque.

## 2. Qualifier l'identité avant de préparer une ouverture

Lors d'une future reprise autorisée :

1. Identifier la copie CONNECT et l'autorité d'identité réellement utilisées, leur version et le périmètre local. Ne pas réutiliser par défaut une configuration de production ou le secret partagé des applications.
2. Identifier le compte CONNECT exact du responsable et son fournisseur, depuis une preuve serveur authentifiée en lecture seule. Ne pas déduire l'ID d'un nom, d'un e-mail, d'un champ de formulaire ou de la valeur fictive `101`.
3. Établir la source autoritaire de sa qualité d'administrateur global, ses conditions d'activité, d'expiration et de révocation. Faire valider le mapping si cette notion n'existe pas dans le contrat actuel. **Ne pas créer ni attribuer un nouveau rôle pour faire réussir le contrôle.**
4. Définir un vérificateur local d'identité et d'habilitation : fournisseur autorisé, signature/émetteur/destinataire, durée, usage unique/rejeu et ID exact. Pour une réponse de rôle, contrôler sa provenance et sa fraîcheur ; l'absence ou l'indisponibilité doit fermer l'accès, sans repli vers une affirmation du navigateur.
5. Vérifier que ce parcours ne nécessite aucune installation ni modification de service distant. Si un nouveau contrat CONNECT ou un callback autorisé à distance est nécessaire, **arrêter le lot local à cette limite** et proposer un périmètre séparé. Ne pas annoncer un SSO réalisable par la seule édition du registre.

Le navigateur local ne peut ni lire les cookies sécurisés d'un autre domaine ni les transformer en preuve de rôle. Ne pas copier des cookies, mots de passe, clés de signature, bases de comptes ou exports de données personnelles pour contourner cette limite. Une copie locale d'interface CONNECT ne devient pas une autorité fiable sur le compte réel par sa seule présence.

## 3. Contrat d'accès futur à faire appliquer côté serveur

L'accès réel devra exiger **toutes** les conditions suivantes, avant de charger une liste ou un fichier :

```text
session authentifiée par l'autorité qualifiée
ET fournisseur/émetteur/destinataire attendus
ET compte actif, session non expirée et non révoquée
ET identifiant CONNECT égal à l'unique propriétaire configuré
ET qualité d'administrateur global attestée, actuelle et non révoquée
ET origine/transport local et ressource autorisée
```

Tout défaut entraîne un refus. Aucun wildcard, liste de plusieurs administrateurs, partage d'organisation, droit « accès à Projet », rôle fourni par le client ou possession d'un lien ne suffit. Les requêtes de liste, détail, preuve, historique et écriture doivent toutes appliquer la même politique.

Le vérificateur réel et l'actualisation de l'habilitation **ne sont pas implémentés par le lanceur actuel**. Il faudra les réaliser et les tester dans un lot ultérieur. Le retrait du rôle ou la désactivation du compte devront invalider l'accès sans attendre arbitrairement l'heure maximale de la session locale. En attendant, `connectRoleVerified: false` doit rester honnête et aucun raccordement aux données réelles ne doit être déclaré qualifié.

## 4. Inventorier les vrais suivis sans créer une seconde vérité

Pour chaque application/itération, consigner dans un registre privé de références : copie Git réelle, branche/version observée, responsable du suivi, chemin canonique, schéma, racine des preuves et contrat de verrouillage. Ne pas pointer vers un HTML/Markdown généré, un reçu de livraison, une archive ZIP ou un export figé comme s'il était le suivi actif.

| Source identifiée | Utilisation future admissible |
| --- | --- |
| `avereo-pilotage/data/suivi-cockpit-developpements.json` | Source canonique de cette itération ; pilote proposé en **lecture seule**, après qualification d'identité. Les chemins de preuves exigent la racine de l'espace de pilotage. |
| `data/suivi-interface-simple.json` et `data/suivi-sujets-colonnes.json` dans cette copie isolée | Références réelles mais **figées à la base de la copie** ; utiles pour la compatibilité des adaptateurs, pas preuve du dernier état opérationnel. Ne pas les réécrire ou les présenter comme des suivis actualisés en continu. |
| Autres suivis actifs de Projet, Rapport, CONNECT, Coupe, Thermo, Drone, etc. | Chemins canoniques actuels et responsabilités `TBD — à qualifier` avec leur projet. Ne pas scanner ou raccorder automatiquement tous les dépôts. |

La racine doit contenir le JSON et ses seules pièces autorisées. Résoudre les chemins réels Windows, y compris jonctions/liens ; refuser toute sortie de racine, chemin absolu de pièce et type exécutable. L'autorisation de lire un suivi n'autorise pas l'ensemble de son dépôt, ses secrets ou les données clients voisines. Le registre doit rester minimal et privé, hors Git, hors frontend, hors synchronisation ou sauvegarde partagée non qualifiée. Contrôler les ACL Windows effectives du compte propriétaire, du registre, des sources, des sauvegardes et du fichier d'accès temporaire.

Les limites actuelles du [contrat](../api/developpements-local.md) s'appliquent : 50 références, JSON de 2 Mio et pièces de 10 Mio au maximum ; une pièce hors racine reste indisponible plutôt que copiée dans les assets.

## 5. Préparer un registre fermé et une lecture seule

Exemple **documentaire non exécutable**, à ne pas enregistrer comme configuration active ce soir :

```json
{
  "localAdministratorConfirmed": false,
  "globalAdminConnectId": "A_QUALIFIER_NON_EXECUTABLE",
  "entries": [
    {
      "id": "cockpit-pilote",
      "application": "Projet — Développements",
      "root": "CHEMIN_CANONIQUE_A_QUALIFIER",
      "file": "data/suivi-cockpit-developpements.json",
      "writable": false
    }
  ]
}
```

`localAdministratorConfirmed: true` et un ID numérique réel ne suffiraient **toujours pas** à prouver le rôle CONNECT : le lanceur actuel ne fait qu'attribuer une capacité locale. Ne pas présenter `--config` comme une commande SSO. Aucun fichier d'exemple actif n'est fourni et aucune commande de raccordement n'est exécutée par cette documentation.

Après réalisation et qualification du vérificateur réel, une future ouverture locale devra utiliser l'origine exacte `http://127.0.0.1:5196`, sans bind sur `0.0.0.0`, tunnel, proxy ni publication. Les commandes et paramètres du futur vérificateur sont `TBD` ; ne pas inventer une option `--connect` ou un endpoint inexistant. Le [guide actuel](developpements-local.md) décrit seulement le lanceur à capacité privée déjà disponible.

Pour le premier pilote, garder `writable: false` et ne pas ajouter `developmentReviewSchema` aux suivis réels. Relever les empreintes de tous les fichiers du pilote avant lecture, puis comparer après ouverture, changement de phase, consultation de preuves, actualisation, fermeture et rechargement : octets identiques, aucun journal ou verrou créé dans les sources.

## 6. Matrice de confidentialité à recetter avant les données réelles

Le résultat attendu porte sur l'accès direct aux routes et aux ressources, même sans passer par le menu. Il faut aussi vérifier que le corps des refus ne contient ni titre, ni chemin, ni critère, ni pièce, et qu'aucune copie n'apparaît dans les assets, exports ou caches.

| Cas | Résultat attendu | Preuve disponible / contrôle restant |
| --- | --- | --- |
| Propriétaire exact, identité et rôle global réellement attestés | Lecture seule du pilote ; aucune mutation | **À recetter sur le vrai compte**, aucun raccordement réalisé |
| Même propriétaire sans rôle attesté, rôle retiré, compte inactif, autorité indisponible | Refus fermé, aucune donnée | **À implémenter et recetter** avec le vérificateur réel |
| Autre administrateur global authentifié | Refus 403, pas de liste ni preuve | Refus d'un autre ID signé couvert par fixtures ; **profil réel non recetté** |
| Owner/admin d'organisation, membre, lecteur, client, autre organisation | Refus 403, pas de donnée | Rôles fictifs couverts ; **profils réels et rôles combinés non recettés** |
| Anonyme, cookie faux/expiré/révoqué, rôle/ID injectés dans les en-têtes ou le corps | 401/403 sans information privée | Code et scénarios fictifs existants relus ; pas de nouvelle exécution ce jour |
| URL de pièce/détail devinée, route Vite directe, anciennes routes de revue/export | Refus avant chargement des données | Scénarios HTTP fictifs existants ; refaire sur le futur vérificateur |
| Origine tierce, requête intersite, Host/adresse non locaux, CSRF absent | Refus 403 | Contrôles actuels et scénarios fictifs relus |
| Pièce hors racine, jonction sortante, ID inconnu | Pièce inaccessible, aucune fuite | Confinement existant ; jonctions/ACL effectives du pilote **à qualifier** |
| Registre en lecture seule, y compris POST direct de revue | Refus d'écriture, empreintes source identiques | Contrat opt-in existant ; **pilotage réel à recetter** |

Routes actuelles à inclure : `/local-developments/state`, `/iteration`, `/proof`, `/reviews`, `/logout` (toutes sous le même préfixe), les ressources `/src/…` et `/@fs/…`, les anciennes routes `/local-review*` et `/local-planning*`. Les erreurs authentifiées/anon peuvent différer (401/403/404 selon le point de contrôle) ; le critère impératif est l'absence de donnée et d'effet.

Le reçu du 6 novembre conserve **32 tests ciblés et 228 tests au build** sur fixtures. Il ne vaut pas validation du rôle CONNECT réel. À la reprise autorisée, relancer les contrôles concernés sur la version exacte puis compléter cette matrice avec preuves datées et anonymisées. Un succès ne coche aucun critère humain automatiquement.

## 7. Écritures réelles : point d'arrêt supplémentaire

Ne pas confondre qualification de lecture et accord d'écriture. Une future activation de décisions réelles exigerait un accord séparé sur les fichiers, `writable: true` dans le registre, `developmentReviewSchema: 1` dans la source, sauvegarde privée/restauration testée sur copie et coopération des autres écrivains avec le verrou. Tester d'abord les conflits, preuves périmées et récupération sur fixtures.

Conserver les anciens accords, phases, mappings et preuves ; écrire dans l'unique `developmentReviews` canonique. Aucun test ne doit approuver un vrai critère à la place du responsable. La fin de ce pilote reste une revue humaine locale ; aucune modification CONNECT distante, PR, merge, préproduction ou production n'en découle.

## Reprise et clôture documentaire du 7 novembre

Prochaine action **sur nouvelle demande seulement** : lever le blocage d'autorité/identité en lecture seule, confirmer le chemin canonique du pilote, puis présenter le périmètre précis du futur raccordement local. Les identifiants, secrets et chemins privés ne doivent pas être demandés dans le chat ; le responsable renseignera les informations sensibles sur le poste par le mécanisme qualifié.

Session documentaire close à la demande du responsable. Aucun raccordement, fichier de configuration actif, changement de rôle, test applicatif, build ou déploiement n'est effectué le 7 novembre pour cette clôture. Les services et les autres chats restent intacts.
