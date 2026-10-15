---
project: avereo-app-passeport-immo
document_type: decisions
title: Décisions Passeport Immo
status: active
version: git
created: 2026-10-03
updated: 2026-10-15
owner: jpdandin
tags: [avereo, documentation, local]
---

# Décisions Passeport Immo

## 2026-10-15 — Session CONNECT pour toutes les ressources de l'application

Contexte : le parcours réel ouvre l'application mais exige une seconde porte
visiteur sur son origine. Décision technique : vérifier la session HMAC existante
pour le HTML et tous les assets, puis retirer la configuration Basic redondante
de Passeport Immo après qualification. La porte Basic de CONNECT reste en place.
Raison : permettre le lancement selon les droits CONNECT sans nouvelle saisie
et conserver une préproduction privée. Conséquences : seuls les assets construits
CSS/JS/MJS sont servis sous contrôle PHP, sans cache partagé ; aucun cookie de
domaine parent, partage de mot de passe ou changement des droits n'est ajouté.
Les ressources et le dossier sont vérifiés dans le navigateur intégré ; le retour
Chrome, l'identité métier et le stockage partagé gardent leurs limites dans le
[rapport courant](docs/03-preproduction.md).

## 2026-10-15 — Politique d'environnement et transfert privé

Contexte : installation privée autorisée sur le compte parent, après choix du
compte de recette et récupération vérifiée. Décision technique : compléter la
politique Apache du candidat par la protection visiteur existante, avec une
empreinte d'environnement séparée ; conserver les configurations en dehors du
document root. Les répertoires publics exigent un chmod explicite en 0755 même
quand l'installateur applique un masque privé ; les répertoires et fichiers
privés restent en 0700/0600.
Raisons : maintenir deux portes distinctes, rendre les ressources servables et
conserver exactement les assets du candidat contrôlé.
Conséquences : la copie privée du dossier réel ne constitue pas un backend
documentaire et ne peuple pas le navigateur. L'import et la recette réels restent
ouverts ; aucune acceptation de phase ou de production n'est déduite des tests.

## 2026-10-14 — Réutilisation du sas CONNECT

Contexte : préparer la préproduction après l'approbation du dossier documentaire.
Décision technique : utiliser le sas commun et deux clés dédiées côté CONNECT,
sans backend de documents ni migration Passeport Immo.
Raison : conserver les tickets HMAC courts, le refus par défaut et l'anti-rejeu
des applications existantes ; éviter une seconde source du sas.
Conséquences : le build contient PHP/règles Apache et exige une configuration
privée distincte. La recette authentifiée et l'installation restent à qualifier.

## Source des décisions de chantier
Les décisions de validation sont enregistrées par le responsable dans AVEREO Projet,
au sein du [suivi JSON](docs/suivi-chantier.json). Aucune décision n'est dupliquée ici.

## Cadre de reprise, 2026-10-03
Contexte : demande de lancement du développement avec le workflow V4 fourni.
Le responsable a explicitement choisi « Phase 0 puis prototype local dans cette session ».
Conséquence : préparer le frontend local après l'audit, sans fabriquer de transition
ou d'approbation dans le moteur. Cet accord de périmètre ne vaut pas validation
de phase, publication, merge, déploiement ou choix du stockage futur.
Les choix techniques du lot sont consignés dans son livrable, comme demandé en V4.

## Raccordement et correctif PDF, 2026-10-03
Contexte : invocation du skill de développement et choix du responsable
« Raccordement et correction du PDF ».
Décision technique : compléter le JSON existant par `developmentWorkflow`, appeler
le contrôleur du skill installé et générer ses vues dans le cockpit Projet existant.
Raison : conserver une seule source de pilotage et l'historique de validation.
Conséquence : les cibles, accords et récupérations restent non qualifiés jusqu'à preuve.

Le débordement blanc de moins d'un pixel A4 est ignoré uniquement après lecture
de la dernière ligne du canvas. Un pixel de contenu conserve la page.
Quatre tests PDF bornent cet écart d ; le contrôle inverse isole ce changement
et vérifie que les autres comportements et classes restent identiques.

## Orientation de préproduction, 2026-10-03
Le responsable choisit une préproduction dédiée sur o2switch. Cette orientation
rattache la préparation à cet hébergeur ; elle ne qualifie aucune adresse,
aucun accès ni aucune permission de déploiement. Les valeurs observées restent
dans le suivi canonique, les champs à établir dans la fiche de qualification.

Dans le chat de reprise, le responsable retient l'adresse de test proposée et
privilégie une lune gratuite si disponible, pour disposer d'un espace séparé.
Cette préférence conditionnelle reste dans la cible canonique ; son observation
et la qualification de la cible sont décrites dans la fiche dédiée.

Après vérification de la restriction o2switch imposant le même compte au domaine
parent et à ses sous-domaines, le responsable retient le compte qui héberge
`avereo.fr`, avec un dossier dédié et protégé. Raison : conserver l'adresse demandée.
Conséquence : la lune active n'est pas la cible de cette adresse ; la séparation
des répertoires et la protection effective doivent être qualifiées sur le compte parent.

## 2026-10-14 — Première gestion documentaire locale

Contexte : démarrer un cas concret client/bien avec les fichiers fournis, conservés
sur ce PC. Décision : stocker les Blob et métadonnées dans IndexedDB, conserver les
biens/calculs existants, proposer l’archivage réversible et la détection des doublons.
Raison : gérer les PDF sans le quota restreint des pièces jointes base64 historiques.
Conséquence : même profil et même origine du navigateur nécessaires ; conserver le
dossier source. Le serveur partagé, les droits réels et la sauvegarde centralisée
restent un lot ultérieur. Aucun accord de déploiement n’est déduit de la recette.
