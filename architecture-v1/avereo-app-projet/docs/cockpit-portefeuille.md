---
project: avereo-app-projet
document_type: guide-utilisateur
title: Cockpit des versions et développements de toutes les applications
status: active
version: git
created: 2026-11-07
updated: 2026-11-09
owner: jpdandin
tags: [cockpit, portefeuille, versions, lecture-seule, local]
---

## Badges des environnements

Les colonnes Préproduction et Production conservent version, intitulé et date. Les badges ajoutent une forme et un libellé explicites ; la couleur seule ne porte jamais le sens.

| Aspect | Signification |
| --- | --- |
| Pastille verte — Préprod disponible | Livraison déclarée avec contrôle hébergé réussi documenté pour la même version et cible ; recette humaine distincte. |
| Pastille bleue — Production en service | Même qualification documentaire en production ; pas une surveillance actuelle de disponibilité. |
| Triangle orange — Production à préparer / examiner / autoriser | Itération active de phase 3 respectivement `in_progress`, `awaiting_review` ou `awaiting_approval`, sans livraison connue. Aucun accord déduit. |
| Pastille rouge — Bloqué — suivi | Suivi actif de la phase concernée marqué `blocked`, sans livraison connue ; ne signifie pas panne d’un service existant. |
| Pastille grise — À qualifier / environnement déclaré | Information absente ou simple déclaration sans contrôle documenté de même version/cible. |

Un contrôle admissible est `checks.kind` égal à l’environnement, `status:passed`, preuve non vide, date valide, correspondance de chaque SHA/empreinte déclarée et cible exacte. L’environnement doit déjà être qualifié par le registre ; aucune URL ou CI ne l’invente. `versions.declarations[].verification` conserve le statut documentaire et la référence/date du contrôle, sans lecture réseau ou nouvel accord. Les anciennes projections sans ce champ restent grises. Les contrôles ou dates dans les suivis restent des déclarations datées ; les pièces non publiées gardent leur accès privé existant. Les critères, validations, comptes et quatre phases restent inchangés.

## 9 novembre — complément courant

Le [guide de qualification et rafraîchissement](preuves-et-actualisation-github.md) complète l’étape initiale ci-dessous. **Rafraîchir GitHub** est maintenant une action locale explicite ; elle ne modifie pas le code ou les sources métier. Les observations publiées restent consultatives en préproduction ; aucune collecte serveur, synchronisation continue ou livraison n’est installée.

## 9 novembre — raccordement et cohérence GitHub locale

Le [guide technique courant](coherence-github-locale.md) décrit la nouvelle colonne GitHub, les observations séparées, le raccordement des tableaux d’itérations et les reçus. Le registre privé porte maintenant les sources réelles et les observations datées ; les sections ci-dessous décrivent les étapes antérieures. Les sources métier et leurs validations ne sont pas modifiées ; le candidat est distinct de la PR #134, local seulement et consultatif.

# Versions et développements — portefeuille local privé

## Cible future en ligne — exigence du 7 novembre

Après la recette locale, le responsable demande une consultation en ligne pour suivre les développements dans la durée, et propose un module spécifique dans Projet. La cible préparée est **Projet → Développements**, distinct des dossiers clients et réservé au seul compte propriétaire administrateur global exact ; le premier lot hébergé reste consultatif. L'état réalisé demeure local privé, sans SSO réel ni publication.

La source fonctionnelle de cette nouvelle exigence est le cahier `avereo-pilotage/docs/cockpit-developpements.md`, section « Exigence de mise en ligne — 7 novembre » ; sa référence structurée est `hostingRequirement` dans `avereo-pilotage/data/suivi-cockpit-developpements.json`, avec CCK-12 et CCK-19 à CCK-21. Ces sources décrivent les protections serveur de toutes les ressources, la projection persistante accessible PC éteint, les sources/preuves autorisées, la fraîcheur et la suite dans les quatre phases. Elles ne sont pas un contrat d'API déjà implémenté. La cible exacte, l'identité/rôle réel, la publication privée et la récupération restent à qualifier ; ne pas exposer le lanceur local sur Internet. Aucun code ou hébergement n'est activé par cette mise à jour documentaire.

## Utilisation et périmètre

Le responsable a autorisé le 7 novembre l'accès privé sur son poste, **en lecture seule et sans connexion automatique à CONNECT**. Le portefeuille réel est ouvert sur `http://127.0.0.1:5197/?developments`. Aucun autre profil applicatif, accès distant, merge ou déploiement n'est activé. Cette autorisation locale ne prouve ni ne modifie un rôle CONNECT.

La vue d'ensemble référence **12 applications et sites**, toutes rattachées à un suivi lisible : CONNECT, Rapport, Passeport Immo, Coupe, Projet, Thermo, Drone, Recherche, Saisie unique/dossier Erim, RGA, Site AVEREO et TC Longages. Douze entrées de suivi/projection lisent onze fichiers JSON distincts ; les chantiers communs sont visibles dans plusieurs applications, sans copie de leur journal.

1. Rechercher une application ou un intitulé de développement.
2. Lire le commit local, la branche et la présence de changements non commitées.
3. Comparer les derniers lots déclarés en préproduction et production ; une cellule inconnue reste « Non renseignée ».
4. **Voir le suivi de…** ouvre les itérations de l'application. Choisir le chantier à gauche.
5. Consulter **Cadrage, Développement local, Préproduction, Mise en production**, les critères, pièces, réserves et PR déclarées. Les critères sans phase restent visibles à part, sans rattachement inventé.
6. **Vue d'ensemble** revient au portefeuille. **Actualiser** relit les fichiers et Git locaux ; la page visible se rafraîchit aussi toutes les 25 secondes et au retour de focus.

La revue est consultative : les boutons de décision des suivis réels sont désactivés et les POST directs de revue sont refusés. Aucun critère, accord, phase ou planning n'est modifié.

## Bien interpréter les versions

| Information | Source et limite |
| --- | --- |
| Code local | Dernier commit touchant le dossier applicatif, tête Git, branche et changements locaux observés par des commandes Git de lecture. Le SHA ne décrit pas les modifications non commitées. |
| Candidat | `candidate.sourceSha` ou `candidate.codeSourceSha`, empreinte d'artefact si déclarée. Un SHA de PR n'est pas supposé être un candidat qualifié. |
| Préproduction / production | Dernier **lot livré déclaré** avec environnement explicitement mappé dans le registre et date de sa source. Ce n'est pas une mesure en ligne, ni une version complète garantie de toute l'application. |
| PR et CI | Déclarations du suivi et date d'observation d'origine. Le rafraîchissement du cockpit ne contacte pas GitHub et ne relance aucune CI. |
| Critères validés | Décisions individuelles réellement conservées dans le contrat canonique ; un accord global ancien n'est pas converti en validations individuelles. |

Les copies de code peuvent avancer pendant que le cockpit est ouvert : ce sont alors de nouvelles observations locales, pas une livraison. Certaines sources sont anciennes ou moins détaillées que les travaux actifs ; leur date et les absences restent affichées. Les preuves sans rattachement de version restent « Version à vérifier » même si leur fichier est disponible.

## Sources et limites connues

Le registre `avereo-pilotage/data/cockpit-portefeuille-sources.json` est la référence des **chemins et mappings**, pas des statuts. Il désigne les suivis communs de la copie active `avereo-espace-commun`, les suivis dédiés de Projet/CONNECT/Saisie unique, le suivi Passeport dédié historique, le cockpit de pilotage et les suivis Site AVEREO/TC Longages. Tous sont `writable: false`.

- **Recherche** : le lot commun `avereo-platform/data/suivi-missions.json` référence les recettes Recherche et la classe explicitement en usage local. Sa phase déclarée « Développement local » est lue telle quelle, sa PR #125 et son dossier de qualification sont consultables. Aucun faux suivi autonome ni livraison Recherche n'est créé ; les colonnes hébergées restent inconnues.
- **RGA intégrée à Rapport/CONNECT** : la projection `data/suivi-fonctions-communes.json # correctiveDeployment` désigne le sous-suivi canonique du correctif PR #122, avec son candidat, ses preuves, son accord historique et sa livraison déclarée en préproduction. Elle ne reprend pas le candidat global des sept applications. Le chantier Missions du 7 novembre est également visible, séparément. Ce raccordement ne concerne pas le tableau territorial autonome « RGA 2026 ».
- **Passeport Immo** : le suivi dédié comporte des déclarations historiques de production. Les nouveaux travaux de livrables sont dans le chantier commun, distinct. Aucun état hébergé actuel n'est déduit de ces anciennes preuves.
- **TC Longages** : l'ancien découpage à huit phases est projeté explicitement `0→0`, `1/2/3→1`, `4→2`, `5/6/7→3`, en conservant les identifiants et décisions d'origine. Aucun suivi source n'est réécrit.
- Des preuves sont relatives au dossier `data/` plutôt qu'à la racine applicative. `evidenceBase` permet ce raccordement déclaré, sans sortir de la racine privée autorisée.
- Aucun accès aux dossiers clients ou aux secrets n'est accordé par le choix d'une application. Seules les pièces déclarées et confinées sont servies.

Les lacunes sont des prochaines actions documentaires à traiter avec les projets concernés, pas des statuts à mettre au vert dans le cockpit.

## Vérifier la fraîcheur sans fabriquer une actualité

Le tableau et la liste utilisent les mêmes projections pour chaque réponse. Les suivis sont triés selon leur dernière donnée explicitement datée, en comparant les fuseaux horaires. La date retenue vient des champs source (`updatedAt`, observation, candidat, contrôles, livraison), jamais de l'heure de lecture. « Dernière donnée datée » ne signifie pas qu'un ancien lot vient d'être recetté.

Dans le détail, l'heure de lecture, la date de modification sur disque, l'empreinte du fichier et le sélecteur de sous-suivi rendent la provenance contrôlable. Les fichiers sont relus sans cache de statut ; une modification de source est reflétée au prochain rafraîchissement. Les observations restent ponctuelles : plusieurs dépôts modifiés en parallèle ne forment pas une transaction globale atomique.

Une vérification locale compare les projections aux JSON relus, leurs empreintes avant/après, les références de versions et Git local. Elle ne vérifie ni GitHub distant ni le contenu actuel des hôtes. Les sources anciennes restent datées comme telles, les candidats absents restent inconnus et les critères manquants restent à définir. Le commit déclaré dans un suivi de PR est affiché séparément d'un candidat qualifié.

## Accès privé et relance

Depuis `architecture-v1/avereo-app-projet/frontend`, après avoir confirmé le même usage privé local :

```powershell
npm.cmd run dev:portfolio -- --local-private-owner --registry "C:/Users/examg/Documents/Codex/2026-07-16/avereo-pilotage/data/cockpit-portefeuille-sources.json" --port 5197
```

Arrêter auparavant **uniquement le précédent lanceur de ce cockpit** s'il utilise déjà le port. Le lanceur crée un registre et un fichier d'accès temporaires hors Git, protégés sous Windows par une ACL sans héritage n'autorisant que le compte Windows courant et SYSTEM. En cas d'échec de qualification de l'identité Windows ou de restriction des droits, il ne démarre pas. Le navigateur sélectionne le fichier dont le **chemin** est indiqué au lancement ; ne pas transmettre son contenu.

L'ID interne `1` de ce mode est celui de la capacité locale, **pas un ID CONNECT**. Les étiquettes internes historiques de rôle ne constituent pas une attestation CONNECT. La session est signée, HttpOnly, SameSite Strict, limitée à une heure et révocable. Le fichier est à usage unique. Après expiration, déconnexion, redémarrage ou pour changer de navigateur, relancer le cockpit puis sélectionner le nouveau fichier ; l'ancienne session n'est plus valable.

Le poste et ses processus privilégiés restent une frontière de confiance : un administrateur Windows peut reprendre la maîtrise du poste. Aucun compte CONNECT, collègue, client ou utilisateur distant ne reçoit de droit. Ne pas exposer le port via réseau, tunnel ou proxy ; conserver `127.0.0.1` et ne pas modifier les droits des autres projets.

## Vérifications et suite

Les tests couvrent le catalogue, les chantiers communs, les versions locales, les livraisons inconnues, les racines de preuves, les refus d'accès et d'écriture, le premier chargement React et la protection du dossier privé. Le build hébergé exclut toujours le module privé et les données du registre.

Recette locale sur vrais suivis : douze entrées affichées, recherche Rapport, quatre phases, pièce ouverte, décision réelle désactivée et retour après rechargement. Aucun test ne valide un critère à la place du responsable. Le raccordement SSO réel, l'actualisation GitHub, la mesure des versions hébergées et les écritures sur les vrais suivis restent des lots distincts à autoriser.

[Contrat local](../api/developpements-local.md) · [Historique du raccordement envisagé](raccordement-developpements-local.md).
