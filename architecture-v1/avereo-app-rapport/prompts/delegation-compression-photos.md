---
project: avereo-app-rapport
document_type: prompt
title: Délégation du lot de compression des photos
status: active
version: git
created: 2026-11-12
updated: 2026-11-12
owner: jpdandin
tags: [rapport, photos, delegation]
---

# Délégation du lot de compression des photos

## Objectif et contexte

Le responsable demande d'avancer les autres lots avec Claude en parallèle du lot 0. Préparer un candidat local cohérent de compression des nouvelles photos importées dans Rapport, pour alléger les sauvegardes et Word. L'ancien report de compression dans le prompt Philippe ne s'applique pas à cette nouvelle demande. Aucun PDF natif n'est à implémenter dans ce lot ; identifier ses points d'intégration et inconnues dans le compte rendu, comme préparation distincte.

## Dossier imposé

**Travailler exclusivement dans la copie enfant déjà créée** : `C:/Users/examg/Documents local/avereo-rapport-v12-habitologue/.codex-worktrees/rapport-photos-code`.

Branche `feat/rapport-photos-compression`, base `f48a3a9`. Vérifier le dossier Git courant avant toute modification. Ne pas modifier la copie parente : Codex y termine le lot 0. Lire les AGENTS.md propres à la copie enfant. Aucune opération Git de commit, push, changement de branche, merge ou rebase ; Codex gère l'intégration finale.

## Entrées et exigences

- Les photos existantes, réouvertes ou importées par JSON, doivent rester byte-identiques ; aucune recompression automatique à l'ouverture.
- Préparer une compression locale dans le navigateur, sans service externe ni dépendance nouvelle, des nouvelles photos importées. Ne pas toucher aux plans et annexes, ni à la caméra dans ce premier candidat.
- Réglage conservateur proposé pour revue : dimension maximale 2400 px, JPEG qualité 0,88, seulement si original dépasse 1,5 Mio et seulement retenir la version optimisée si elle réduit le poids d'au moins 15 %. Les images plus légères restent intactes. Le fond transparent doit être traité explicitement, sans rendu noir ; si une image ne peut pas être décodée, garder le contenu original ou afficher une erreur claire sans faire disparaître les autres images.
- Conserver identifiant, nom et horodatage ; un format de compression doit être reconnu par le DOCX existant. Ne pas modifier le champ `src` des anciens dossiers.
- Afficher une information simple sur l'optimisation réalisée (nombre d'images ou gain), une erreur si nécessaire et l'état de chargement ; éviter une nouvelle dépendance et une interface de réglages complexe.
- Appliquer la mise à jour finale au bon constat et au dernier état du dossier, même si l'utilisateur navigue pendant le traitement. Une suppression du constat ou un remplacement complet du dossier pendant un traitement ne doit pas injecter des photos dans le nouveau dossier.
- Ne pas changer le consentement photo, la politique de sécurité, l'authentification ou la propriété des rapports.

## Fichiers et sortie autorisés

Dans la copie enfant uniquement : module dédié de compression et tests pertinents dans `frontend/src/`, intégration minimale à `frontend/src/App.jsx` et `styles.css` si nécessaire ; `docs/compression-photos.md`, `docs/source-audit.md`, `docs/migration-matrix.md`, `requirements.md`, `architecture.md`, `roadmap.md`, `changelog.md` et README si leur usage change. Documentation en français avec métadonnées. Une fixture fictive légère ou un script de recette peut être ajouté, aucune image lourde dans Git.

Les dépendances ne sont pas installées dans la copie enfant. Utiliser si nécessaire les outils Node existants du parent sans modifier son code ni son lockfile ; pas de réseau ni installation. Le build et la recette de vraies images seront exécutés par Codex après relecture. Les tests purs utilisent `node:test` ; ne pas créer d'infrastructure de tests.

## Contraintes

Aucun compte, donnée réelle, secret, accès serveur, envoi de message, commit, push, merge ou déploiement. Aucun fichier d'une autre application. Ne pas renuméroter ou réordonner les observations dans cette branche. Les changements du lot 0 seront intégrés séparément par Codex.

## Format de sortie

Candidat local et bilan factuel : fichiers modifiés, comportement, tests réellement exécutés, limites et points à qualifier. Le lot doit rester simple et proportionné au prototype.

## Complément du responsable — originaux privés et Passeport

Cette demande plus récente prévaut sur toute interprétation de la compression : conserver les photos originales pour rouvrir un détail, puis proposer recadrage, commentaires et formes sur une version dérivée réinjectable dans le rapport. Le responsable a choisi un espace privé du dossier en ligne accessible avec CONNECT. Une optimisation ne doit donc jamais supprimer le seul exemplaire de l'original.

Le responsable précise que les 500 Mo évoqués concernent le chargement dans Passeport Immo. Le contrat local vérifié de Passeport (`docs/import-volumineux.md` et `frontend/src/documents/document-store.js`, à consulter sans les modifier) prévoit 500 Mo par fichier ET lot, puis plusieurs lots successifs ; ce n'est pas un quota total du dossier. Ce candidat est distinct de sa qualification hébergée. Rapport garde son propre plafond JSON par défaut de 50 Mio. Ne modifier aucune limite de Passeport ou d'o2switch.

Adapter le candidat préparé avant toute intégration :

1. Ne pas activer une compression destructive. Tant que la conservation durable de l'original dans l'espace privé en ligne n'est pas implémentée et qualifiée, l'import normal doit garder `src` octet-identique. Le module d'optimisation peut rester un candidat isolé testé, mais ne doit pas remplacer l'original dans le parcours courant ni annoncer un gain qui n'est pas conservé.
2. Préparer un cadrage concret dans `docs/photos-originales-et-annotations.md`, avec métadonnées, exactement quatre phases Cadrage, Développement local, Préproduction et Mise en production. Décrire une bibliothèque de photos privée liée au dossier et à son propriétaire, uploads individuels sans gros JSON/base64 d'originaux, accès CONNECT contrôlé côté serveur à chaque lecture/écriture, original immuable, version rapport dérivée, opérations de recadrage/texte/formes réversibles et choix explicite avant export. Distinguer besoin confirmé, proposition, existant et TBD. Aucun nouveau rôle ou accès partagé implicite.
3. Relever les raccordements réels nécessaires : import et caméra, brouillon local, sauvegarde en ligne, réouverture autre session/ordinateur, copie vers un autre propriétaire, export JSON et sauvegarde/restauration (les futurs fichiers privés ne sont pas couverts par une seule sauvegarde SQL), Word et futur PDF/Passeport. Prévoir refus intercomptes, original identique par empreinte, remplacement du dossier pendant traitement, refus de stockage et reprise après échec. Le transfert vers Passeport porte les fichiers choisis ; pas de copie automatique de toute la photothèque.
4. Mettre à jour les documents impactés pour que le statut de la compression et le besoin d'originaux ne se contredisent pas. Garder les résultats passés comme essais du candidat initial, sans les présenter comme ceux d'une conservation originale en ligne existante.

Ce complément prépare le prochain lot fonctionnel ; il n'autorise ni activation serveur, changement de configuration hébergée, accès supplémentaire, installation, migration ou déploiement. Ne pas développer hâtivement une nouvelle API de stockage ou un éditeur complet dans cette délégation de compression.

## Historique des versions

- 2026-11-12 : première délégation de compression à partir de la demande de travail parallèle.
- 2026-11-12 : conservation des originaux en ligne confirmée ; séparation de l'optimisation candidate, cadrage des annotations et clarification des limites de Passeport.
