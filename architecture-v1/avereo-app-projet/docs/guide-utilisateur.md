---
project: avereo-app-projet
document_type: user-guide
title: Guide utilisateur de l'outil de suivi AVEREO Projet
status: active
version: git
created: 2026-09-24
updated: 2026-09-25
owner: jpdandin
tags: [projet, suivi, guide, local]
---

# Guide utilisateur de l'outil de suivi AVEREO Projet

## À quoi sert l'outil ?

AVEREO Projet réunit deux espaces accessibles dans le menu du haut :

| Espace | Utilisation | Enregistrement |
|---|---|---|
| **Revues & approbations** | Consulter les phases et leurs livrables, vérifier les critères, consigner les observations et décisions | Fichiers du chantier connecté, sur le disque du PC |
| **Planning & risques** | Organiser les tâches, les dates et les charges ; renseigner leurs fiches, checklists, preuves et risques | Stockage du navigateur ; export JSON pour une copie indépendante |

Les deux espaces ont des données distinctes. Modifier l'avancement d'une tâche
dans le planning ne valide pas une phase de revue. Le planning pilote préchargé
ne se transforme pas automatiquement en planning du chantier connecté.

## Ouvrir et fermer l'application

Si un chantier dispose d'un raccourci et d'une fiche d'accès, utiliser ce
raccourci : il sélectionne le bon dossier et le bon port.

Pour le chantier documentaire AVEREO configuré par défaut avec l'application,
double-cliquer sur [start-local.cmd](../start-local.cmd), puis ouvrir
[http://127.0.0.1:5190/](http://127.0.0.1:5190/). Conserver la fenêtre de
lancement ouverte. L'installation et le choix d'un autre chantier sont décrits
dans [le workflow technique](../workflows/revue-developpement.md).

Dans **Revues & approbations**, vérifier le titre du chantier sous
« Suivre les phases du chantier » et le chemin **Source connectée**, au bas
de la page. Une instance affiche un seul chantier ; l'écran ne propose pas
de catalogue permettant d'en changer.

**Ctrl+C** dans la fenêtre du lanceur arrête le serveur qu'elle a démarré.
Fermer le navigateur laisse le serveur fonctionner. Au redémarrage du PC,
relancer l'outil. Les décisions enregistrées restent sur disque.
Le service écoute sur le PC local ; l'accès depuis un autre appareil n'est
pas configuré. Aucun compte supplémentaire n'est requis.

## Examiner une phase et enregistrer une décision

1. Dans **Revues & approbations**, sélectionner la phase dans la colonne de
   gauche. Les compteurs distinguent notamment les livrables remis et les phases
   approuvées : une livraison reste à examiner.
2. Dans **Livrables**, consulter les titres, descriptions et preuves attendues,
   puis sélectionner chaque document disponible. Lire son contenu ;
   **Voir la source** affiche le Markdown complet. Confirmer la version lue
   pour chacun des livrables de la phase.
3. Dans **Critères**, cocher uniquement les critères effectivement vérifiés.
   Pour une approbation, tous les critères et tous les livrables sont requis.
4. Dans le panneau de décision, choisir l'action, vérifier le **Décideur** et
   saisir un **Commentaire de revue** explicite, d'au moins cinq caractères.
5. Cocher **Je confirme cette décision pour la phase…**, puis cliquer sur le
   bouton portant le nom de l'action. Attendre le retour de l'application.
6. Consulter **Journal** pour retrouver l'événement et son commentaire.
   **Preuve de revue** indique les versions des documents associées.

| Action | Effet |
|---|---|
| **Ajouter une observation** | Enregistre une note sans changer le statut de la phase |
| **Approuver la phase** | Enregistre l'acceptation des livrables et critères examinés |
| **Demander des corrections** | Replace la phase en préparation et conserve les attentes dans le journal ; les accords devenus caducs restent dans l'historique comme remplacés |
| **Soumettre à la revue** | Remet les livrables préparés à l'examen humain |
| **Autoriser la phase suivante** | Enregistre l'accord de passage après approbation ; la phase suivante reste à démarrer |
| **Démarrer la phase** | Enregistre le démarrage autorisé ; les travaux sont ensuite à réaliser |

Les actions disponibles dépendent de l'état de la phase et de ses dépendances.
Le bouton d'approbation reste désactivé si une lecture, un critère, le décideur,
le commentaire ou la confirmation manque. Un livrable manquant doit d'abord
être produit ou remis à disposition.

Après correction des fichiers, cliquer **Actualiser**, puis remettre la phase
à la revue. Une nouvelle approbation exige de relire les versions corrigées.
Si une phase ultérieure a déjà démarré, le retour en correction est bloqué :
le responsable doit organiser la reprise du chantier.

Le décideur est un nom déclaré localement, sans authentification personnelle.
Les validations de chantier ne créent pas de commit ou de PR, ne fusionnent
pas de code, ne publient pas de site et ne démarrent pas automatiquement Codex.
Le responsable reprend les travaux à partir de la décision enregistrée.

### Retrouver les PR de la phase

Lorsqu'elles sont renseignées dans le suivi, les PR apparaissent sous le titre
de la phase. La carte principale conserve la référence de sa revue. Une carte
**Revue complémentaire** présente une correction ou un recadrage rattaché à
cette même phase, avec son contexte et un lien **Ouvrir la PR**. Elle peut donc
apparaître dans une phase déjà validée, sans remplacer la validation acquise.

La date **Dernier constat** indique quand l'état GitHub a été consigné dans le
suivi. L'actualisation de l'outil relit ce suivi local ; elle ne consulte pas
GitHub. Ouvrir la PR pour connaître son état actuel et effectuer sa revue.
Une PR complémentaire ne modifie automatiquement ni le statut de la phase,
ni son journal, ni l'autorisation de passer à la suivante.

## Utiliser le planning et les risques

Dans **Planning & risques**, ouvrir une tâche pour consulter sa fiche :
description, étapes, résultats attendus, preuves, validations et risques.
Enregistrer la fiche après saisie. Les cases de checklist ne changent pas
automatiquement le statut ou le pourcentage d'avancement du lot.

Le planning initial est un pilote proposé. Les risques marqués **À qualifier**
doivent être examinés : une préqualification indicative n'est pas une décision
d'acceptation ou de clôture. Le bouton **Compléter les fiches documentées**
enrichit les données pilotes selon les règles de conservation décrites dans
[la documentation des données](../data/README.md).

**Exporter JSON** produit la sauvegarde complète du planning, avec fiches,
checklists, preuves et risques. **Importer un planning** permet de reprendre
ce fichier. Relire le résultat avant de poursuivre les saisies. **Exporter CSV**
sert aux échanges tabulaires ; il ne remplace pas cette sauvegarde complète.
Les limites de recette des imports XLSX et des téléchargements navigateur
sont conservées dans [l'audit du planning](source-audit.md).

Utiliser le même navigateur, le même profil et la même adresse. `localhost`,
`127.0.0.1` et des ports différents constituent des origines différentes :
le brouillon planning n'est pas partagé entre elles. Avant de changer de profil,
de PC ou de port, exporter le JSON depuis l'ancienne adresse, puis l'importer
à la nouvelle. Effacer les données du navigateur peut supprimer ce brouillon.

## Sauvegarder et reprendre une revue

**Exporter le suivi**, dans l'espace des revues, télécharge le JSON du chantier
avec les phases et le journal. C'est un export différent de **Exporter JSON**
dans le planning. Il ne contient pas le texte des livrables.

La source de vérité des revues est `suivi-chantier.json`, dans le chemin affiché
sous **Source connectée**. Chaque décision crée au préalable une copie dans
`.review-backups/` du chantier. Conserver aussi les livrables et leur révision
Git pour pouvoir retrouver les documents examinés. Les tableaux HTML et
Markdown sont des vues générées à partir du JSON.

Les décisions enregistrées survivent à la fermeture du navigateur et à l'arrêt
du serveur. Les commentaires encore dans le formulaire ne sont pas sauvegardés
après fermeture ou rechargement de la page. Le journal est un historique local
éditable par le propriétaire des fichiers ; il ne constitue pas une signature.

La restauration n'a pas de bouton d'import dans l'espace des revues. La
procédure technique prévoit l'arrêt du serveur, la conservation de l'état
courant, l'examen de la sauvegarde choisie et la régénération des vues : voir
[Sources, sauvegarde et confiance](../workflows/revue-developpement.md#sources-sauvegarde-et-confiance).

## Résoudre les difficultés courantes

| Situation | Action à effectuer |
|---|---|
| Le navigateur indique que le site est inaccessible | Relancer le raccourci du chantier ou son fichier `.cmd`, conserver sa fenêtre ouverte, puis ouvrir son adresse exacte |
| Le titre ne correspond pas au chantier attendu | Vérifier le raccourci, le port et **Source connectée** avant de saisir une décision |
| L'application demande de connecter le chantier local | Lire le message du lanceur ; vérifier les chemins et prérequis dans le workflow technique |
| Une décision est refusée car la révision a changé | Cliquer **Actualiser**, relire les livrables et reconfirmer les critères ; le commentaire est conservé pendant cette actualisation |
| « Décision enregistrée, vues à actualiser » | Vérifier le journal puis faire régénérer les vues ; ne pas répéter la décision déjà enregistrée |
| Le planning paraît vide après un changement d'adresse | Revenir à l'ancienne origine et au même profil pour exporter le JSON, puis l'importer dans la nouvelle |
| Un verrou ou un port occupé empêche la reprise | Suivre le diagnostic du workflow ; ne pas supprimer les données du chantier pour résoudre ce problème |

La revue fonctionne avec le serveur local. Le planning historique utilise
encore certaines ressources externes : le fonctionnement intégral hors
connexion n'est pas qualifié. Les résultats de recette et les limites restantes
figurent dans [la recette de la revue](recette-revue-locale.md) et l'audit du
planning cité plus haut.

## Voir la progression et les validations acquises

Dans **Revues & approbations**, la vue de progression résume le chantier connecté :
phases validées, phases déjà livrées, phases actuellement à valider et phase
courante. Les barres comptent des phases ; elles ne mesurent ni les heures,
ni le pourcentage de travail effectué, ni la part publiée en production.
Une phase remise puis renvoyée en correction reste une livraison historique,
mais ne compte plus parmi les phases actuellement à valider.

Sélectionner une phase dans la progression pour retrouver ses livrables,
critères et journal. Les jalons indiquent les dates connues d'autorisation,
de démarrage, de livraison et de validation. La disponibilité des livrables
est calculée depuis les documents accessibles : elle ne vaut pas approbation.
Les prochaines actions et blocages reprennent les informations du suivi.
L'outil ne déduit pas qu'une phase est prête du seul numéro de phase courante.

Si le chantier fournit `priorApprovals`, **Validations déjà acquises** présente
les accords retrouvés dans un autre chantier avec leur origine, date,
commentaire et nature de preuve. Cette vue datée ne modifie pas les journaux
d'origine et ne transforme pas l'approbation d'un ancien livrable en validation
d'un nouveau. Une référence de message demeure distincte d'une revue dont les
empreintes ont été vérifiées. Consulter la date de relevé avant de l'utiliser.

Le suivi se relit automatiquement **toutes les 25 secondes lorsque l'onglet
est visible**, ainsi qu'au retour dans la fenêtre ou l'onglet. **Actualiser**
reste disponible pour demander une lecture immédiate. L'heure de la dernière
lecture est affichée ; une panne du service signale que les données peuvent
être anciennes. Aucune décision n'est envoyée par cette actualisation.

Le commentaire, le décideur, la phase sélectionnée et le document choisi sont
conservés tant que cette phase et ce document existent encore. Si un document
disparaît, le premier document encore disponible est proposé. Les lectures,
critères cochés et confirmation sont annulés seulement pour les phases dont
les preuves, critères, contenu attendu, état de revue ou autorisation ont changé,
ou dont une dépendance présente un tel changement. Relire alors les nouvelles
preuves avant de décider. Une simple observation ajoutée au journal ne
réinitialise pas ces attestations. Les décisions déjà enregistrées restent
dans leur journal ; ces remises à zéro concernent seulement le formulaire
de revue en cours. Un rechargement complet du navigateur ou sa fermeture peut
toujours perdre une saisie non enregistrée.

## Comprendre les livrables prévus et disponibles

Chaque phase peut décrire à l'avance le titre du livrable, son objectif et les
**contenus et preuves attendus**. Ces informations proviennent du suivi du
chantier et restent visibles même si le fichier n'est pas encore produit.

| Indication | Signification |
|---|---|
| **Prévu · document à produire** | Le livrable est défini dans le suivi, mais son document n'est pas encore disponible |
| **Document de travail disponible** | Un document peut être lu pendant la préparation ; sa présence ne constitue pas une remise à la revue |
| **Disponible pour revue** | Le document est accessible dans une phase remise à la revue ou déjà validée ; consulter le statut et le journal pour connaître l'accord enregistré |
| **Incomplet / Indisponible** | Un document annoncé présent ou une partie d'un dossier ne peut pas être lu ; le problème reste affiché |

Une description de livrable ne fabrique aucun fichier. L'apparition d'un fichier
n'enregistre automatiquement ni livraison, ni validation, ni autorisation.
Les textes de préparation et dates de la phase se mettent à jour depuis le
suivi connecté. En l'absence de livrables définis, l'outil l'indique explicitement.
