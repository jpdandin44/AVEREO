---
project: avereo-app-passeport-immo
document_type: requirements
title: Exigences Passeport Immo
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [avereo, documentation, local]
---

# Exigences Passeport Immo

## Fonctionnelles
- E01 : conserver création, édition, suppression et consultation des biens.
- E02 : conserver composition, pièces, interventions et trois gammes de chiffrage.
- E03 : conserver pièces jointes, PDF et partage avec leurs limites historiques.
- E04 : conserver édition du catalogue et import CSV.
- E05 : conserver connexion/abonnement simulés et persistance locale.

## Techniques et contraintes
Parité selon [la matrice](docs/00-etat-des-lieux.md). Les changements initiaux de
reprise V4 sont renommage/clés, remplacement CDN/Tailwind et extraction des calculs.
Tout correctif supplémentaire requiert une justification et une autorisation.
Pas de donnée personnelle réelle dans les tests ; domaine `example.test`.
Le lot initial était local. La demande suivante autorise son raccordement GitHub/cockpit
et la correction de pagination PDF, sans intégrer CONNECT ni déployer.

## Inconnues
TBD : stockage futur des documents clients, limites de volumétrie, identité CONNECT
et suppression future du frontend historique. Questions Q01… dans le suivi.

## Exigences de l'itération autorisée
- E06 : supprimer la page blanche finale du PDF court sans perdre un pixel de contenu
  et conserver les documents de deux ou trois pages ; quatre tests de régression.
- E07 : rattacher PR, candidat, preuves, blocages et prochaine action au suivi existant.
- E08 : appliquer le contrôleur du skill installé ; conserver les décisions antérieures.
- E09 : qualifier la cible réelle et l'accord exact avant un passage distant.
La correction PDF d est le seul nouvel écart fonctionnel autorisé dans cette itération.
