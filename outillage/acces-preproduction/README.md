---
project: avereo
document_type: runbook
title: Acces par identifiants aux preproductions AVEREO
status: active
version: git
created: 2026-10-06
updated: 2026-10-06
owner: jpdandin
tags: [preproduction, securite, exploitation]
---

# Accès aux préproductions par identifiants

## Statut du lot

Pour tester la connexion et les applications, utiliser les
[accès de recette](releve-heberge.md#accès-pour-la-recette). Le cockpit local
sert à consulter les phases, preuves et décisions. Il ne constitue pas
l’environnement de recette de CONNECT ni du fournisseur d’identité.
Ce lot fournit des tests locaux automatisés de réparation ; aucune interface
locale du fournisseur d’identité n’est fournie.

Dans la PR #77, le lien de la première case de test ouvre directement CONNECT
préproduction. Le libellé obligatoire du modèle « en local » est conservé ; la
cible de recette de ce lot est hébergée. La procédure des tests automatisés est
un lien distinct. Le relevé indique le contrôle de navigation et ses limites.

**Pilote CONNECT et réparation de l’identité appliqués ; recette avec le compte du responsable à faire.** L'accord du responsable
porte sur le remplacement du filtrage IP de consultation par une protection HTTP
par identifiants, CONNECT d'abord, puis les autres préproductions. Il autorise une
PR dédiée, pas un merge ni une modification de production.

La reprise du 6 octobre permet de piloter la session cPanel. Les onze racines
réelles sont relevées dans le [relevé hébergé](releve-heberge.md), dérivé du suivi
canonique. Après accord direct « Oui, appliquer le pilote CONNECT », le seul bloc
IP de consultation de CONNECT a été remplacé atomiquement par le candidat préparé.
Le compte de consultation existant du site a été réutilisé sans modification.
Les reçus et contrôles hébergés sont conservés dans le suivi : HTTPS anonyme ou
identifiants incorrects renvoie 401 avec Basic ; HTTP renvoie 403 sans challenge.
La sauvegarde privée reste disponible. Les autres cibles ne sont pas basculées.
Aucun mot de passe, cookie, lien de session cPanel ou hachage de compte n'est versionné.

La PR #76 est maintenant fusionnée, comme l’indique le suivi. Le responsable signale
que le filtrage IP est débloqué, puis une erreur lors de la connexion. Le diagnostic
initial du serveur d’identité a confirmé une installation Simple OAuth
incomplète. La réparation autorisée rétablit l’écran OAuth de connexion : la racine
répond 200 et la demande anonyme redirige vers le formulaire Drupal, qui répond 200.
La cause, le candidat appliqué et la recette technique figurent dans
le [relevé dérivé](releve-heberge.md#incident-dauthentification). La connexion avec
le compte du responsable et le lancement des applications restent à recetter.

Le [suivi du lot](suivi-chantier.json) est la source canonique de cette itération.
Il porte les quatre phases du cockpit Projet. Le suivi initial est archivé sans
perte ni nouvelle validation. Protocole applicable :
[quatre phases](../protocole-developpement/skills/developpement-github-cockpit/references/protocole.md).

## Objectif et frontières

La qualification couvre aussi la cohérence des huit applications du monorepo.
Le [relevé dérivé](releve-heberge.md#alignement-des-applications) présente les
candidats d’une même référence, les contrôles réalisés et les limites hébergées.
Le bloc `application_alignment` du suivi reste la source canonique ; son reçu JSON
conserve l’inventaire des fichiers et les observations datées. Un sas qui renvoie
vers CONNECT ne prouve ni la version de l’interface ni le fonctionnement du stockage.

### Préparer un ensemble de versions vérifiables

Construire les frontends dans un checkout propre de la référence retenue, avec
les commandes et les modes documentés par chaque application. Conserver les
preuves de compilation et de test avant de préparer les archives. Le script
ci-dessous inventorie des builds **déjà construits** : il ne certifie pas à lui
seul leur provenance ni leurs variables de compilation. Il contrôle la référence
Git, la propreté des fichiers suivis, les fichiers privés/liens symboliques et
l’intégrité des archives ; il n’accède à aucun compte et ne déploie rien.

```powershell
python prepare_application_candidates.py --source CHEMIN_CHECKOUT_PROPRE `
  --expected-sha SHA_GIT_COMPLET --output .local/alignement --observe-http
```

L’option HTTP observe uniquement les huit adresses de recette attendues, sans
identifiant, cookie ni suivi de redirection. Une adresse attendue n’est pas une
preuve de domaine déclaré. Les configurations et empreintes hébergées doivent
être relevées dans la session d’exploitation avant toute qualification complète.
Les archives de référence ne remplacent pas les règles d’accès hébergées : préparer
la surcouche de protection, la sauvegarde et la restauration de chaque cible.
Passeport Immo reçoit toujours son fragment `Require all denied` ; aucune entrée
CONNECT ou habilitation n’est créée par l’outillage.

### Inventaire hébergé et livraison de recette

La lecture cPanel a repris le 6 octobre. Le suivi et son relevé dérivé renvoient
au reçu `archives/audit-applications-hebergees.json` : huit cibles examinées,
empreintes comparées après normalisation LF, métadonnées dédiées de lancement,
catalogue actif et schémas lus sans données applicatives. Les bundles de cinq
applications et sept fichiers de CONNECT diffèrent des candidats. Une empreinte
frontend différente prouve un écart d’artefact ; le caractère ancien de Rapport
est aussi établi par l’absence de Visite Globale et les quatre choix observés.

Les sept cibles existantes ont une sauvegarde et une copie restaurée en privé,
identiques par empreintes et modes, avec vérification que les fichiers actifs
n’ont pas changé pendant la copie. Cette preuve concerne les **fichiers** ; elle
ne constitue pas une sauvegarde ni une recette de restauration des bases.

Un lot exact Rapport/Coupe/Projet/Thermo/Drone est préparé. Le suivi en conserve
le plan, l’archive, les empreintes et le workflow distinct de l’ensemble des huit
applications. Les règles hébergées identiques sont conservées. Coupe reprend la
redirection auth du candidat main ; son sas historique reste protégé, sa base
non configurée et son mode privé inchangés. Les configurations privées, droits
et données restent hors de l’archive. Aucun candidat applicatif n’est installé.

CONNECT ne peut pas recevoir son backend main sans la migration ajoutant
`onboarding_status` et `activation_email_sent_at`, absents de `users`. Sa base
de recette est distincte ; préparer sa récupération avant toute migration.
Recherche n’a ni domaine de recette déclaré, ni configuration de lancement,
ni entrée catalogue. Passeport Immo ne contient que la fermeture `.htaccess`,
sans frontend ni contrat de lancement CONNECT. Ces trois travaux restent
distincts du lot préparé et ne sont pas déduits d’un merge.

Le test `test_launch_contract.php` utilise le véritable émetteur de CONNECT et
les sas récepteurs avec un compte fictif, un secret synthétique et des nonces
éphémères. Il contrôle l’échange, l’identité lorsqu’elle est utilisée, l’anti-rejeu,
la signature, l’application, l’expiration et le refus anonyme. La suite Python
l’exécute pour les six applications disposant d’un lancement CONNECT. La CI
installe explicitement PHP et Apache ; aucun serveur distant n’est sollicité.

### Périmètre de consultation

Autoriser un testeur depuis ses différents réseaux, sans liste de son IP publique,
en conservant la connexion Drupal/CONNECT et les droits métier. Comptes de
consultation individuels et distincts des comptes cPanel, Drupal et SQL. Même
méthode partout ne signifie ni SSO ni fichier de comptes universel : ne réutiliser
une liste de comptes que si tous ses membres sont autorisés sur la cible.

Le fichier `basic-auth.htaccess.example` est un **fragment**, pas un remplacement
complet de `.htaccess`. Il ne supprime ni filtrage hérité, ni règle applicative.
`check_access.py` est un contrôle HTTPS en lecture seule. Aucun des deux ne déploie.
Les workflows de publication existants ne sont pas modifiés par ce lot.

## Préconditions à relever dans cPanel

Dans Domaines, inventorier les seuls sous-domaines de préproduction réellement
présents ; noter leurs racines réelles et tous leurs alias. Les candidats dans
`suivi-chantier.json` ne prouvent pas leur existence ni leur disponibilité. Ajouter un autre
candidat dans la source uniquement après identification, jamais par wildcard.

Pour chaque cible, en session d'exploitation autorisée :

1. Résoudre le chemin réel et vérifier qu'il n'est ni celui d'une production,
   ni son parent, ni partagé avec un autre site. Inspecter les liens symboliques.
2. Lire les règles de la cible, de ses parents et des `.htaccess` descendants :
   `Require`, `Allow/Deny`, `Satisfy`, `AuthMerging`, `<Files>`, `<If>`, réécritures
   et pages d'erreur. Consulter les logs du 403 sans publier de données privées.
3. Vérifier HTTPS, redirection/refus HTTP et certificats AVANT de saisir un
   identifiant réel. Contrôler également les alias et le renouvellement AutoSSL.
   `robots.txt` ou `noindex` ne remplacent pas une protection d'accès.
4. Vérifier les échanges sortants/entrants décrits plus bas ; aucun changement
   sur un fournisseur d'identité tant que sa compatibilité n'est pas qualifiée.
5. Sauvegarder hors de tout document root, avec permissions restrictives, les
   seuls fichiers à modifier et leurs empreintes. Préparer le retour arrière
   ciblé et tester la copie de restauration dans un emplacement privé.

Ne pas publier les fichiers d'exploitation dans Git. Ne pas effacer une protection
parentale globale pour corriger un seul site. Si l'isolation n'est pas démontrée,
la cible reste bloquée et sa protection actuelle est conservée.

## Bascule pilote CONNECT

La cible est `connect-preprod.avereo.fr`. Sa racine réelle a été confirmée dans
cPanel et figure dans le suivi canonique ; la requalifier avant une nouvelle action.
Ne pas appliquer cette procédure à `connect.avereo.fr`.

Dans Confidentialité du répertoire (Directory Privacy), sélectionner cette racine
exacte. Activer la protection par mot de passe avec le libellé `AVEREO Preproduction`.
Créer un compte de consultation ou rattacher un fichier de comptes autorisés
existant et lisible par Apache, **hors de toute racine web**. Le mot de passe est
saisi directement dans cPanel ou dans une invite masquée, jamais dans Git/chat.
Ne pas utiliser `htpasswd -c` sur un fichier existant : cela l'écraserait.

Conserver la protection actuelle pendant la préparation. Comparer le bloc produit
par cPanel au [modèle](basic-auth.htaccess.example), puis remplacer **uniquement**
la restriction IP de consultation identifiée comme obsolète. Une simple addition
de `Require valid-user` à des règles existantes peut combiner les autorisations
autrement qu'attendu. Inspecter les regroupements et l'héritage ; aucun retrait
par expression régulière globale ou `sed` récursif n'est autorisé par ce lot.
Ne jamais introduire `Require all granted`, `Satisfy any` ou une exception globale
`/api` pour débloquer la recette. Préserver les refus des fichiers sensibles et les
réécritures du contrôleur PHP. Ne pas toucher aux droits métier ou aux clés HMAC.

La transition doit rester fermée aux visiteurs anonymes : préparer les fichiers
hors racine publique, puis appliquer la modification ciblée avec remplacement
atomique si l'outil le permet. Si cPanel impose plusieurs étapes, tester le refus
anonyme entre elles ; ne jamais passer par une étape volontairement ouverte.

### Contrôles HTTP après bascule

Depuis un terminal disposant du code et du réseau, sans désactiver TLS :

```bash
python3 outillage/acces-preproduction/check_access.py --domain connect-preprod.avereo.fr
python3 outillage/acces-preproduction/check_access.py --domain connect-preprod.avereo.fr --authenticated
```

Le deuxième contrôle demande les identifiants localement. Il ne conserve pas le
corps des réponses, les cookies ni les destinations de redirection. Un 401 doit
porter un challenge Basic ; un 403 générique ou un 500 n'est pas accepté comme
preuve de protection correcte. Après bons identifiants, un 200/302/303 est seulement
un contrôle HTTP préliminaire : aucune redirection n'est suivie par le script.

Ensuite, depuis une fenêtre privée : ouvrir CONNECT, s'identifier via Drupal,
lancer Rapport, vérifier un dossier synthétique, sauvegarder, recharger et se
déconnecter. Tester un compte sans habilitation et un second réseau. Pour une
application à ticket, une longue saisie des identifiants HTTP peut faire expirer
le ticket : relancer depuis CONNECT, sans allonger artificiellement sa durée ni
désactiver son anti-rejeu. Tester aussi l'expiration normale et la révocation.

L'état final reste « à recetter » tant que ces contrôles ne sont pas réussis.
Un échec impose le retour arrière ciblé et la conservation du 403 comme incident
ouvert ; ne pas prétendre que toute la préproduction est opérationnelle.

## Généralisation et échanges techniques

Passer à Rapport, Coupe, Projet, Thermo et Drone uniquement sur les cibles réellement
inventoriées et isolées. Préserver le site de préproduction qui fonctionne déjà.
Traiter les éventuelles autres préproductions par la même qualification explicite.
Chaque cible a sa sauvegarde, ses comptes autorisés, sa recette et son reçu daté.
Ne pas copier le `.htaccess` Drupal du site vers les applications.

**Les serveurs d'identité ne sont pas des pages de consultation ordinaires.**
Au commit de référence `fbf395b31917ad46565896ae46317e11db0b611e`,
[OAuthFlow.php](../../architecture-v1/avereo-app-connect/backend/src/Identity/OAuthFlow.php)
envoie un POST de formulaire pour l'échange de code et utilise
`Authorization: Bearer` pour `userinfo`. Une protection Basic indifférenciée devant
ce dernier échange entre en conflit avec l'usage de ce même en-tête. La session HTTP
du navigateur n'authentifie pas automatiquement les appels du backend.

Inventorier les URL effectives d'autorisation, token, userinfo, clés publiques,
activation et callbacks signés dans les configurations privées, sans en recopier
les secrets. Vérifier aussi les callbacks reçus par CONNECT. Avant bascule,
prouver le parcours des comptes existants ET la création/activation d'un compte.
La présente PR n'adapte pas ces clients et ne crée aucune exemption technique.
`auth-preprod` et `auth-next-preprod` restent donc bloqués jusqu'à qualification.

Toute solution pour les appels machine doit conserver leur contrôle d'accès
propre (Bearer/HMAC et validation serveur) et être documentée par route exacte.
Ne pas désactiver globalement Basic sur `/api`, ni mettre des identifiants Basic
dans les URL, JavaScript ou paramètres OAuth. Un complément de code éventuellement
nécessaire devra être testé dans une PR ciblée avant application à l'identité.

## Pérennité au prochain déploiement

La protection d'hébergement ne doit pas disparaître lors d'une publication.
Pour chaque cible, inspecter le mécanisme réel : transfert FTPS, `rsync --delete`,
réécritures du build et `.htaccess` descendants. Préférer une couche d'exploitation
non écrasée par la publication lorsque le document root et l'héritage le permettent.
Sinon, composer explicitement le fichier final à partir de la source applicative
et de la protection privée, puis qualifier l'artefact résultant avant transfert.
Ne pas ignorer tout `.htaccess` au risque de bloquer ses mises à jour applicatives.

La décision précise dépend du relevé réel ; la pérennité n'est pas implémentée par
cette PR. Rejouer les tests HTTP et métier après un déploiement de recette avant de
déclarer la généralisation durable. Le pilote a été appliqué en exploitation avec
un accord propre ; la fusion de cette PR seule ne change aucun serveur.

## Validation locale

```bash
python3 -m unittest discover -s outillage/acces-preproduction -p 'test_*.py' -v
```

Les tests de contrat refusent les hôtes de production et les URL susceptibles de
transporter un secret. Les tests Apache utilisent une instance éphémère sur
`127.0.0.1` et un mot de passe synthétique aléatoire : refus anonyme/incorrect,
accès autorisé, sous-route API protégée, fichier sensible interdit, autre dossier
inchangé et redirection non suivie. HTTP n'est utilisé que pour cette fixture
locale ; ce test ne valide ni le TLS hébergé ni les flux réels Drupal/CONNECT.
Si Apache est absent, la suite signale des tests sautés ; cela n'est pas une recette
complète. Le workflow CI installe explicitement Apache pour éviter cette réserve.

## Sécurité et données

Aucune migration SQL, changement de compte applicatif, secret de production,
réduction des droits métier ni ouverture anonyme. Ne pas stocker de preuves
contenant des données client, des en-têtes d'authentification, un ticket ou une URL
cPanel de session. Masquer les captures avant partage. Les hachages de mots de
passe restent privés. Le répertoire de sauvegarde n'est jamais sous une racine web.

Les tests du vérificateur ne prouvent pas l'absence de contournement par un alias,
une autre racine, un chemin descendant ou une configuration WAF. Ces contrôles
font partie de la recette d'exploitation. La déconnexion applicative ne supprime
pas forcément les identifiants HTTP conservés par le navigateur ; vérifier la
sortie sur poste partagé et utiliser des comptes de consultation révocables.

## Références

- [Architecture transversale historique](../../architecture.md) : document daté,
  pas une preuve de l'environnement courant.
- [Bascule Rapport/CONNECT](../../architecture-v1/avereo-app-rapport/docs/preproduction-connect-cutover.md).
- [cPanel — Directory Privacy](https://docs.cpanel.net/cpanel/files/directory-privacy/).
- [Apache — Authentication and Authorization](https://httpd.apache.org/docs/2.4/howto/auth.html).
- [Apache — AuthMerging](https://httpd.apache.org/docs/2.4/mod/mod_authz_core.html#authmerging).

Les documentations externes décrivent les mécanismes. Les états hébergés doivent
être établis par les reçus d'exploitation du responsable, pas par ces références.

## Préparation et application du pilote lors de la reprise

`prepare_connect.py` prépare uniquement le candidat CONNECT dans un répertoire privé.
Il vérifie le bloc IP exact, conserve les autres octets, copie la sauvegarde et
contrôle sa restauration dans un fichier privé. Il ne modifie aucune cible web,
aucun compte ni aucune production. La bascule reste une action distincte.

Le candidat utilise le fichier de comptes existant du site et ajoute
`SSLRequireSSL` : le HTTP est refusé avant le challenge Basic. Le refus HTTP ne
prouve pas le fonctionnement HTTPS. Le candidat est maintenant actif sur le seul
pilote : les contrôles HTTPS sans identifiants et avec de mauvais identifiants sont
réussis. Le bon compte et les parcours métier restent à vérifier ; revenir au
fichier original si la recette révèle un échec.

Le navigateur intégré a signalé `ERR_INVALID_AUTH_CREDENTIALS` au lieu de proposer
l’invite HTTP Basic. Le responsable doit vérifier l’accès dans son navigateur
habituel, puis le parcours décrit ci-dessus. Cette limite n’est pas assimilée à
un échec du compte ; aucun mot de passe n’est demandé dans le chat.

Pour revenir en arrière, utiliser exclusivement le dossier de sauvegarde du reçu
CONNECT : vérifier l’empreinte du fichier actif et celle de `original.htaccess`,
préparer une copie privée avec les permissions d’origine, puis remplacer
atomiquement le seul `.htaccess` du pilote. Vérifier l’empreinte originale après
restauration et inscrire l’incident dans le suivi. Ne pas recopier un fichier
depuis une autre cible et ne pas écraser un fichier qui a changé depuis le reçu.

Le site demande actuellement aussi le mot de passe sur HTTP. Sa protection reste
en place ; ce point doit être corrigé pendant son harmonisation. Le périmètre
CV et Passeport est inventorié mais reste fermé. Les fournisseurs d’identité
restent à qualifier ; `auth-next-preprod` répond actuellement 500.

## Réparation des dépendances du fournisseur d’identité

Le responsable a demandé le 6 octobre de réaliser la réparation diagnostiquée.
La seule cible de cette réparation est `auth-next-preprod.avereo.fr`, Drupal
11.4.6 avec Simple OAuth 6.1.1. Le [script ciblé](repair_identity.py) prépare dans
un dossier privé une copie des fichiers Composer et de `vendor`, puis ajoute
les deux dépendances exactes déclarées par le module. Il refuse un changement
de package déjà verrouillé ou d’un autre champ du manifeste.

Le premier candidat a été restauré après un conflit de chargement dû au déplacement
du cœur par Composer. Le suivi conserve cet échec et le reçu du retour arrière
réel, vérifié par empreinte. Le second candidat conserve la disposition Drupal et
passe la recette technique. La sauvegarde privée demeure disponible.

Les scripts Composer sont désactivés. Seul le plugin `composer/installers`, déjà
verrouillé sur l’instance, est actif pendant la préparation pour conserver
l’emplacement `core/` de Drupal ; tous les autres plugins sont désactivés.
Le cœur est copié en privé, jamais lié à la cible active, et son empreinte reste
identique. Un cœur déplacé dans `vendor/drupal/core` est refusé ; son chargement
commun est également testé pour détecter une double déclaration. Aucun bootstrap Drupal,
commande de base, compte, clé ou configuration privée n’est inclus dans la
préparation. Le candidat vérifie les exigences PHP et l’autoload des interfaces
OAuth, OpenID Connect, Drupal et du fournisseur Simple OAuth réellement installé.
La sauvegarde privée est comparée au contenu actif avant toute application.

L’application exige le dossier et l’empreinte du reçu ; elle refuse un état actif
modifié depuis la préparation. Elle conserve l’ancien `vendor` et restaure les
fichiers d’origine en cas d’échec du transfert. Le retour arrière explicite refuse
d’écraser un nouvel état divergent. Contrôler ensuite HTTPS, l’écran de connexion
OAuth sans identifiant, les protections CONNECT et les journaux d’erreurs, puis
recetter le parcours avec le compte du responsable. Une absence d’erreur 500 ne
constitue pas une validation humaine du parcours métier.

Le [contrat Composer candidat](identite/README.md) est conservé dans le dépôt après extraction du
paquet de sources sans paramètres privés. La source de référence de la réparation
est ce lot du monorepo AVEREO ; le dépôt éventuel du reste de l’instance Drupal
reste à identifier et aucun de ses thèmes ou contenus n’est repris ici.

Référence du mécanisme : [Composer — require et install](https://getcomposer.org/doc/03-cli.md#require).

## Consultation dans le cockpit

La source est `suivi-chantier.json`. Depuis un checkout du moteur Projet déjà
qualifié, lancer le cockpit avec `AVEREO_REVIEW_ROOT` égal au présent dossier.
Le [générateur](actualiser-tableau-de-bord.py) actualise seulement les vues dérivées
et protège les documents approuvés. Le relevé hébergé et la PR apparaissent dans
les quatre phases ; aucun bouton ne déploie et aucune décision n’est automatique.
