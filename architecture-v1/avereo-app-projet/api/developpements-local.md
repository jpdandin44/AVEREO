---
project: avereo-app-projet
document_type: contrat-api
title: Contrat local privé du module Développements
status: active
version: git
created: 2026-11-06
updated: 2026-11-07
owner: jpdandin
tags: [api, local, autorisation, preuves, source-canonique]
---

## Reprise — session Projet et préparation de préproduction

Un [contrat PHP de préparation](../docs/preproduction-developpements.md) complète maintenant les routes Node locales : `/developpements/api.php?route=...`, GET exclusivement, vraie session native et pont global exigés, endpoints non installés. Le build normal conserve ses exclusions. Ce contrat local précédent reste celui de la capacité privée du poste, pas du futur service PHP.

## 7 novembre — pont et stockage, état local courant

Les routes locales restent `/local-developments/`. Le [guide](../docs/pont-stockage-local.md) définit la copie persistante et le contrôle d'habilitation optionnel avant toutes les ressources. Cette copie refuse toute décision par `POST /local-developments/reviews` (403) ; aucun endpoint navigateur de publication/restauration. [Contrat CONNECT/Drupal](../../avereo-app-connect/api/developments-authorization.md) local opt-in, pas de SSO navigateur ni service PHP Projet installé.

# Contrat local privé du module Développements

## Extension portefeuille — reprise autorisée du 7 novembre

**Raccordement Recherche/RGA et fraîcheur :** le registre peut déclarer `dataPath` (chemin de propriétés propres, par exemple `correctiveDeployment`) pour lire un sous-suivi sans copier les statuts. Les noms de prototype sont refusés ; une propriété absente rend la source indisponible, sans retour silencieux au parent. Toute projection est strictement consultative, même si un contrat d'écriture est présent ailleurs. Ses accords et son journal ne sont jamais hérités de l'itération parente.

Le champ source `phase` accepte exactement l'un des quatre libellés français, sans déduction d'approbation. Un champ `evidence` unique devient une référence documentaire à examiner, sans attribuer un résultat de test ni un candidat. Les `openItems` sont des réserves déclarées. L'API expose `sourceHash`, `sourceModifiedAt`, `readAt` et `dataPath` pour la traçabilité. `dashboard()` projette une même liste pour le tableau et les itérations. La dernière date déclarée est comparée en temps absolu ; l'heure de lecture ne la remplace pas.

`GET /local-developments/state` inclut `portfolio` : catalogue applicatif, observation Git locale, références d'itérations et derniers lots déclarés par environnement. Les entrées portent `applicationIds`, `deliveryEnvironment` explicite et `evidenceBase` optionnel, confiné à la même racine. Les pièces et listes restent derrière le garde d'accès. Aucun endpoint public de versions n'est ajouté.

L'accès privé local sans SSO est autorisé séparément par le responsable ; le lanceur de portefeuille exige `--local-private-owner`, refuse les sources non explicitement `writable: false` et protège ses dossiers temporaires par ACL Windows. `connectRoleVerified: false` reste inchangé. La qualification du rôle global ci-dessous demeure nécessaire pour un futur **SSO réel**, pas pour présenter la capacité privée locale comme si elle était CONNECT. [Usage et frontières](../docs/cockpit-portefeuille.md).

## Portée et autorisation

Service Node du lanceur `workflows/start-developments.mjs`, sur `http://127.0.0.1:5196` par défaut. Pas un endpoint PHP livré, ni une extension des droits CONNECT. L'authentification locale est une capacité privée à usage unique transformée en cookie signé HMAC, `HttpOnly`, `SameSite=Strict`, durée maximale d'une heure. Le secret de signature est renouvelé au lancement, conservé en mémoire. Le bootstrap reste dans un fichier temporaire hors Git ; il ne passe jamais dans l'URL.

Toutes les ressources du serveur Vite sont derrière le garde d'accès. L'identifiant unique configuré, le fournisseur local et le rôle attendu sont vérifiés côté serveur. Un autre identifiant, même signé avec le rôle `global_admin` dans un test, est refusé. Aucun rôle, nom ou identifiant fourni par le navigateur ne confère un droit. L'absence de configuration ferme le service. Transport : boucle locale uniquement, Host exact, origine exacte pour l'écriture, refus Fetch Metadata intersites ; pas de CORS permissif.

**TBD avant hébergement :** identité réelle du propriétaire et rôle CONNECT attesté. L'inspection du ticket CONNECT constate une identité sans rôle global. `connectRoleVerified` vaut donc toujours `false` ici. Les autres profils CONNECT n'ont aucun raccordement actif à ce module.

Ce préalable vaut aussi **avant tout raccordement local aux suivis réels**. La [procédure préparatoire du 7 novembre](../docs/raccordement-developpements-local.md) distingue les rôles d'organisation de la qualité d'administrateur global, exige l'ID propriétaire unique et décrit les refus à qualifier. Aucun endpoint d'introspection globale ni vérificateur réel n'est ajouté par cette documentation ; le champ de confirmation locale du registre n'est pas une preuve CONNECT.

## Endpoints

| Méthode et chemin | Contrôle et réponse |
| --- | --- |
| `GET /` | Sans session : page minimale de connexion, HTTP 401, sans source ni liste. Avec session : application locale. |
| `POST /local-developments/session` | JSON contenant seulement `token`, origine exacte, bootstrap à usage unique ; cookie en retour. |
| `GET /local-developments/state` | Session unique ; liste des itérations, identité du mode et jeton CSRF de session. |
| `GET /local-developments/iteration?iteration=ID` | Projection d'une entrée déclarée : quatre phases, critères, pièces, historique, source et révision. |
| `GET /local-developments/proof?iteration=ID&proof=ID` | Pièce locale déjà déclarée dans cette source ; jamais un chemin fourni par le client. |
| `POST /local-developments/reviews?iteration=ID` | Session, origine, `X-Development-Token`, contrat d'écriture et révision courante. |
| `POST /local-developments/logout` | Session, origine, CSRF ; révocation et suppression du cookie. |

Les anciennes routes `/local-review*` et `/local-planning*` renvoient 404 dans cet espace. Requêtes JSON limitées à 64 Kio. Réponses `Cache-Control: no-store, private`, `nosniff`, `Referrer-Policy: no-referrer`.

Erreurs : 401 session absente/invalide/expirée, 403 identité/origine/CSRF/écriture refusée, 404 référence inconnue, 409 révision ou verrou concurrent, 413 taille excessive, 415 type refusé, 422 contrat/décision invalide, 503 indisponibilité interne sans détails privés. Aucun export des sources n'est accessible anonymement.

## Registre et adaptateurs

`entries` comporte 1 à 50 références uniques : `id` alphanumérique minuscule/tiret/underscore (80 caractères maximum), `application`, `root`, `file`, `writable` optionnel, `phaseMap` optionnel. Racine et fichier sont résolus physiquement ; le JSON source doit rester dans cette racine, avec une limite de 2 Mio. Les chemins n'entrent pas dans les assets publics.

Deux familles sont lues : objet `developmentWorkflow` ou fiche directe (`stage`, `iterationId`, `candidate`, `checks`), et suivi historique avec `phases` structurées (`criteria`/`exitCriteria`, `deliverables`). Les valeurs historiques restent dans leur source. Un découpage non conforme exige `phaseMap` vers les indices 0 à 3. Les états absents restent `not_reported`. Une phase historique approuvée n'approuve pas ses critères par déduction.

Les critères viennent de `developmentCriteria`, sinon `criteria`, sinon `requirements`. Champs : `id` stable, `phaseId` explicite de 0 à 3, `title`/`text`, `expected`, `required`, `proofIds`. Sans phase déclarée, le critère reste non affecté. Les anciens critères textuels reçoivent une identité dérivée du texte et de la phase d'origine ; changer le texte impose une nouvelle revue.

Les pièces viennent de `proofs`, `checks` et des livrables historiques. Champs : `id`, `phaseId` ou `kind`, `status`, `evidence`/`path`, `sourceSha`, `artifactSha256`, `target`, `observedAt`, `sha256` optionnel du fichier. Les types de contrôle locaux, CI et documentation sont rattachés au développement local ; préproduction et production restent distinctes.

## Pièces et fraîcheur

Fichiers relatifs explicitement déclarés et physiquement confinés à la racine, 10 Mio maximum : Markdown, TXT, LOG, JSON, PNG, JPEG, PDF. Aucun HTML/SVG exécutable. Texte rendu sans interprétation HTML ; signature minimale des images contrôlée ; PDF en téléchargement. Le service des pièces ajoute une CSP `sandbox; default-src 'none'`. Les URLs HTTPS sans identifiants intégrés sont de simples références, sans appel réseau serveur et sans preuve d'accessibilité distante.

La comparaison des SHA de source ou d'artefact lie la preuve au candidat. Une empreinte d'artefact SHA-256 complète peut identifier un candidat local non commité : ne pas inventer de SHA Git. Les documents historiques sont revus sur leur contenu lu. Une empreinte de fichier déclarée divergente ou une ancienne version donne `stale`. Une absence de rattachement exploitable donne `unverified`, pas une preuve courante par défaut.

`canApprove` exige toutes les références connues, des pièces disponibles/référencées, un état `passed` ou `reviewable` et une correspondance courante. La confirmation de lecture reste une déclaration humaine, pas une mesure automatique de lecture ou d'accessibilité d'un lien externe.

## Écriture et reprise

Le corps de revue contient uniquement `revision`, `criterionId`, `action` (`approve`, `request_changes`, `comment`), `comment` (5 à 8 000 caractères) et `reviewedProofs` (liste exacte des identifiants/empreintes examinés pour approuver). Aucun acteur n'est accepté dans ce corps. Le fournisseur et l'acteur du journal sont issus de la session serveur.

Écriture uniquement si le registre déclare `writable: true`, la source opte pour `developmentReviewSchema: 1` et le propriétaire local est configuré. L'événement est ajouté à `developmentReviews` dans le **même JSON canonique** : UUID, critère, phase, action, acteur/fournisseur, date, commentaire, candidat, empreintes du critère/des pièces et révision précédente.

La révision englobe les octets source et les empreintes des pièces. Un verrou exclusif `.development.lock`, une sauvegarde exacte dans `<source>.development-backups/`, un fichier temporaire synchronisé puis un remplacement atomique protègent la décision. Une seconde vérification précède le remplacement. Ces garanties concernent les écrivains qui respectent le protocole ; un autre outil modifiant directement le fichier doit respecter le verrou ou être suspendu pendant une revue. Une panne laissant un verrou exige une inspection manuelle avant sa suppression.

Les sauvegardes gardent les octets d'origine (BOM, indentation et fins de lignes compris). Restaurer se fait service arrêté, après conservation de la version courante, en recopiant la sauvegarde vérifiée. Le test de restauration porte sur fixtures, pas sur un suivi métier réel. Aucune purge automatique de l'historique ou des sauvegardes n'est implémentée ; surveiller la taille de la source.

Une revue ne change jamais `stage`, `candidate`, les anciens `approvals`, ni une autorisation de phase, de merge ou de livraison. Une modification ultérieure du candidat, du critère ou d'une preuve conserve l'événement et rend sa décision périmée. Le planning, son schéma, ses exports et son stockage restent indépendants.

## Vérifications

`npm.cmd run test:developments` couvre les refus d'identités, d'origine, de session, de chemin, de CSRF, les deux adaptateurs, les décisions fictives, conflits, versions et sauvegardes. `npm.cmd run build` exécute également les régressions du Gantt et vérifie qu'aucun code/API privé de développement n'entre dans le build hébergé. Voir le [guide](../docs/developpements-local.md). Cela ne constitue ni CI distante, ni recette hébergée, ni acceptation métier.
