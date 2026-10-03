---
project: avereo-app-passeport-immo
document_type: decisions
title: Décisions Passeport Immo
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [avereo, documentation, local]
---

# Décisions Passeport Immo

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
