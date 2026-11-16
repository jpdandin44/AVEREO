---
project: avereo-app-rapport
document_type: integration-contract
title: Contrat du fichier Interventions vers Projet
status: active
version: git
created: 2026-11-16
updated: 2026-11-16
owner: jpdandin
tags: [rapport, projet, contrat, confidentialite]
---

# Contrat du fichier Interventions vers Projet

## Portée

Projection volontaire, locale au navigateur, de decision.actions pour
Habitologue en Visite Globale. Aucun POST interapplications, nouveau point
d’entrée, jeton ou transfert de propriété. Le fichier est importé par le
propriétaire autorisé dans **Mes projets → Importer un projet** ; le contrôle
Projet existant reste l’autorité. Ne pas utiliser Importer un planning dans le
Gantt courant, qui remplace son contenu.

Le moteur canonique est
[planning-core.js](../../avereo-app-projet/frontend/public/planning-core.js) :
validation, normalisation, encode/decode et calendrier. Rapport l’importe dans
son paquet ; aucune copie manuelle ou modification du moteur, de Projet ou de
ses autorisations. Hors ligne, l’aperçu et le téléchargement fonctionnent ; la
création d’un projet privé utilise la connexion Projet habituelle.

## Paramètres sauvegardés dans Rapport

Aucune migration ni propriété ajoutée à la lecture d’un ancien dossier.
decision.schema_version reste 1. Deux blocs optionnels :

| Emplacement | Propriétés |
| --- | --- |
| decision.planning_projet | titre, date_debut, date_cible, capacite_semaine |
| decision.actions[].planning_projet | inclure, charge, debut_minimal, responsable |

inclure est un booléen strict, absent = non sélectionné. Les autres propriétés
sont des chaînes ; valeurs vides autorisées pour une estimation encore incomplète.
titre/responsable : 200 caractères côté saisie, 800 octets côté PHP ; autres
valeurs : 20 caractères/octets au maximum. Dates non vides au format AAAA-MM-JJ,
réelles, années 0001–9999. date_cible ne précède pas date_debut. Charges/capacité
non vides : nombres décimaux explicites positifs au plus 3650, point ou virgule,
sans notation exponentielle. Les objets nouveaux doivent porter au moins une
propriété nommée ; null, liste ou bloc vide refusés. L’absence du bloc est valide.

Les propriétés inconnues des objets existants sont conservées à l’édition.
Sélection client, modalités, horizons, constats et attentes restent dans leur
liste unique ; la sélection Projet ne les remplace pas. Un nombre intermédiaire
invalide reste modifiable dans l’écran, mais bloque l’export et la sauvegarde
serveur jusqu’à correction. Une structure incompatible reste conservée dans le
JSON et est signalée, sans tentative de réécriture.

## Projection native Projet

Le téléchargement exige au moins une intervention sélectionnée, intitulé/nature
renseignés, identifiant source unique, références de constats/attentes non vides
et uniques, date de départ/capacité/charges explicites. Horizon, priorité et
modalités libres ne deviennent jamais une date ou un nombre.

Le document est normalisé et encodé par Projet : schemaVersion=1, nom choisi,
début/cible/capacité, schedulingMode=sequential et tasks. Les tâches suivent l’ordre
de la liste source. IDs I001… issus de la position de l’intervention dans ce
fichier indépendant ; IDs Rapport intacts. Leurs noms/natures, descriptions
référencées, charges, responsables pressentis et débuts minimaux sont recopiés.
Statut initial À faire, avancement 0, aucune checklist ou risque qualifié ajouté ;
résumés de risque aux valeurs initiales du moteur Projet, sans diagnostic déduit.

La description conserve référence du dossier, numéro source d’intervention,
nature/priorité/horizon, numéros et titres des constats, libellés des attentes,
modalités et préalables. Il s’agit d’une référence lisible pour retrouver le
dossier dans Rapport, sans URL prétendant ouvrir automatiquement un dossier.
Justification interne, notes d’écoute, champs d’identité/adresse, photos, plans,
signature, liens de compte et droits ne sont pas exportés. Un texte libre peut
naturellement contenir ce que son auteur y a saisi ; relire la sélection avant
de transmettre le fichier.

Pas de troncature silencieuse : bornes natives Projet, dont noms de tâche
1000 caractères, descriptions 12000, fichier 5 Mio et cinq millions de caractères,
horizon de 3660 jours ouvrés/calendaires. Un dépassement est signalé et le
téléchargement refusé. Le JSON complet Rapport reste la sauvegarde du dossier.

## Calendrier et limites

Charge en jours-personne, capacité hebdomadaire explicitement saisie ; calendrier
lundi–vendredi. Interventions successives, sans parallélisme ni ressources
simultanées supposés. Début minimal = borne, éventuellement décalée au jour ouvré
suivant ; date cible comparée à la fin calculée, sans compression des charges.
Week-ends écartés, jours fériés/absences non configurés dans ce lot.

Aperçu informatif dans Rapport, Gantt éditable dans Projet après import. Aucun
planning/Gantt ajouté aux Word expert/client ; ces restitutions sont conservées.
Aucune synchronisation après téléchargement : les modifications de Rapport et
du projet créé sont indépendantes. La création directe via CONNECT, un lien
automatique vers une ligne serveur et un planning dans le rapport Word/PDF
constitueraient des compléments à cadrer séparément.

