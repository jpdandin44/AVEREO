---
project: avereo-app-projet
document_type: qualification
title: Qualification du publicateur automatique privé de préproduction
status: active
version: git
created: 2026-11-16
updated: 2026-11-16
owner: jpdandin
tags: [publicateur, qualification, prive, preproduction, securite]
---

# Conclusion et portée

**Conception et primitives locales qualifiables ; activation bloquée.** Le lecteur privé, l'export et le stockage signé existent. Le collecteur GitHub périodique du poste existe. Il manque un transport permanent limité aux données, son admission sur l'hôte, une identité de service qualifiée et une recette hébergée actuelle. Cette PR ne les installe pas et ne prétend pas fournir une synchronisation opérationnelle.

[Plan machine désactivé](../workflows/development-publisher-plan.json), [reçu de qualification](../data/qualification-publicateur-prive.json), [suivi du lot](../data/suivi-gantt-developpements.json). Le JSON est un contrat de préparation testé, **pas une configuration chargée par le runtime** ni un ordonnanceur installé.

Demande du responsable : préparer la PR et qualifier le publicateur pour la seule préproduction, propriétaire exact administrateur global et consultation seule ; aucun déploiement ni production. Aucun secret, compte, règle de pare-feu, tâche planifiée ou droit GitHub/CONNECT n'est créé ou modifié.

## Les quatre phases

| Phase | État de ce lot | Condition suivante |
| --- | --- | --- |
| Cadrage | Frontières, sources et dépendances constatées. | Garder les sources privées hors du dépôt public. |
| Développement local | Gantt et contrat de publication préparés ; tests sur fixtures. | PR/CI, revue locale et résolution explicite des prérequis opérationnels. |
| Préproduction | Aucun code ni donnée publié par cette PR. | Transport/admission, identité, sauvegarde/retour et autorisation ciblée, puis recette réelle. |
| Mise en production | Non commencée et non autorisée. | Aucun passage ou accord de production déduit de la PR. |

# Constats vérifiés et limites

| Élément | Constat | Conséquence |
| --- | --- | --- |
| Dépôt GitHub | `jpdandin44/AVEREO` est **public**, relu le 16 novembre via GitHub. | Aucun vrai suivi privé, export, preuve, registre de chemins ou secret dans Git, Actions ou leurs artefacts. La CI n'utilise que les fixtures. |
| Sources canoniques | Le registre privé courant référence 50 vues sur 35 JSON, répartis entre dossiers du poste et OneDrive. | Un runner GitHub n'a pas ces sources. Main seul ne suffit pas ; ne pas remplacer les vrais suivis par leurs anciennes copies Git. |
| Collecte périodique | `watch-development-github.mjs` réutilise des GET et un cache atomique, toutes les 5 à 60 minutes, démarrage explicite. | Aucune tâche installée ; le compte CLI du poste n'est pas une identité de service autonome qualifiée. |
| Export | `development-snapshot-export.mjs` sélectionne explicitement les preuves, masque les chemins et refuse une source changée pendant la lecture. | La publication doit échouer sans remplacement si la collecte/export est incomplet. |
| Stockage/lecture | Signature, séquence croissante, écriture atomique, retour conservant le seuil haut et Node/PHP consultatifs couverts localement. | Ces primitives ne prouvent ni leur installation actuelle ni la sécurité d'un futur transport. |
| Ancien opérateur hébergé | L'opérateur historique de PQ-01 est ponctuel, lié à des SHA/séquences précis et sait écrire runtime/assets/configuration. | **Inadapté à une automatisation de données** ; ne pas le paramétrer ou relancer pour ce lot. |
| Workflow de livraison Projet | Le workflow existant vise la production, comporte `rsync --delete`, une gestion d'exception SSH et `StrictHostKeyChecking=no`. | Il n'est ni appelé ni modifié. Ce n'est pas le canal du publicateur privé ; ne pas y ajouter de secret ou d'exécution périodique. |
| État distant | Dernier reçu de référence : publication 13 du 13 novembre ; aucune nouvelle lecture serveur dans cette qualification. | Séquence, index, configuration, droits, clés et sauvegarde actuels restent **À VÉRIFIER** avant une future écriture. Ne pas coder « prochaine séquence = 14 ». |
| Capacité | Borne actuelle de 50 vues atteinte. | Préserver explicitement l'historique avant de changer une itération active ou ajouter des vues ; ni suppression silencieuse ni hausse de limite sans tests. |

# Chaîne recommandée, non installée

Utiliser un opérateur de confiance **hors de la CI publique**, capable de lire les seules sources privées autorisées. Le prototype peut utiliser le poste existant ; il ne fonctionne alors pas poste éteint. Pour un fonctionnement permanent, il faut d'abord décider où résideront les sources privées et qualifier une identité de service à droits minimaux. Aucune migration de données ni délégation d'accès n'est réalisée ici.

```text
Sources privées consultatives + GET GitHub
  → collecte complète et datée
  → export sans pièce implicite, empreintes et contrôle de l'historique
  → verrou + lecture de l'index/seuil courant de préproduction
  → sauvegarde fraîche + restauration sur copie
  → signature et admission atomique de la seule projection privée
  → reçu (identifiant, empreinte, séquence) + lecture Node/PHP de contrôle
```

Le navigateur ne reçoit jamais une clé de publication et ne choisit ni chemin, dépôt, commande, cible ou séquence. L'API du module reste GET ; seul un canal opérateur séparé pourrait écrire la projection. Les sources métier, décisions humaines, bases clients, runtime, assets et configurations ne font pas partie de cette écriture automatique.

## Identités et droits

- Lecteur : session Projet signée **et** propriétaire exact de sa configuration **et** rôle global frais confirmé par CONNECT/Drupal. Un autre administrateur global reste refusé.
- Publicateur : identité de service séparée à qualifier ; aucun rôle global navigateur accordé à cette identité. GitHub lecture seule sur les dépôts autorisés ; destination de données exclusivement privée de préproduction.
- Transport futur : hôte et empreinte SSH vérifiés, commande d'admission fermée au seul stockage autorisé, aucun shell/chemin choisi par le navigateur, aucune ouverture globale d'IP. L'existence d'une clé ou d'un ancien accès SSH n'atteste pas ces restrictions.
- Clé de signature : hors dépôt, webroot, navigateur et journaux ; les valeurs ne sont pas copiées dans ce dossier de qualification. Sa présence, ses permissions et son détenteur restent à vérifier côté hôte.

## Conservation et idempotence exigées

Avant admission, comparer les événements de revue/accords par **identité d'itération**, pas seulement par identifiant de carte : un changement de `activeIteration` ne doit ni perdre les anciennes décisions ni les transmettre au nouveau lot. Une suppression d'événement ou un remplacement par une ancienne source bloque la publication. Les phases/critères courants peuvent évoluer depuis leur source ; leurs décisions historiques ne sont jamais réécrites par le calcul.

Le publicateur lit le seuil haut et l'empreinte d'index courants sous contrôle de concurrence. Il ne réutilise pas une ancienne observation pour fixer la séquence suivante. Après un délai réseau ou une réponse perdue, rapprocher d'abord identifiant de publication, empreinte et séquence ; ne pas republier aveuglément sous une nouvelle séquence.

Sur échec : ancienne copie valide conservée, date de la dernière collecte réussie intacte, échec visible dans le reçu opérateur. Le Gantt présente déjà l'ancienneté de l'observation ; il ne prétend pas surveiller l'état du futur service. Son reçu de panne et sa remontée dans le module restent à implémenter avec le transport.

Le retour restaure seulement une projection signée antérieure et conserve le seuil anti-rejeu. Il ne restaure jamais une base métier, les fichiers clients ou la configuration d'identité. Une publication concurrente ou plus récente doit empêcher un retour ancien non requalifié.

# Recette requise avant activation

Les tests de la PR prouvent le contrat désactivé et les primitives sur fixtures, pas une recette hébergée. Avant de demander un accord d'activation :

1. Relire le compte propriétaire/global réel et les refus anonyme, autre compte, autre administrateur, rôle retiré et session expirée.
2. Vérifier l'hôte, ses permissions privées et la commande d'admission **données seules**, ainsi que le service de collecte et son accès aux sources.
3. Sauvegarder l'état privé courant, essayer le retour sur copie et contrôler la préservation des données clients/validations.
4. Simuler panne GitHub, source changée, export incomplet, signature invalide, index concurrent, capacité saturée, réponse perdue et reprise après crash.
5. Publier uniquement après accord ciblé ; contrôler le reçu et l'affichage du même lot/version dans le Gantt, puis le refus de toute écriture navigateur.
6. Tester poste éteint uniquement si un opérateur indépendant et les sources correspondantes ont réellement été installés ; sinon annoncer cette limite.

**Décisions/informations manquantes** : emplacement permanent des sources et de l'opérateur, identité de service, transport/admission de données, index/permissions/sauvegarde actuels et politique d'archivage à capacité pleine. Aucune de ces inconnues n'empêche de revoir le Gantt local ; elles empêchent l'activation du publicateur automatique.
