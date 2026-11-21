---
project: avereo-app-passeport-immo
document_type: source-audit
title: Annexe de parité des volumes Rapport
status: active
version: git
created: 2026-11-21
updated: 2026-11-21
owner: jpdandin
tags: [parite, volume, rapport, integrite]
---

# Annexe de parité des volumes Rapport

Lot local `RAP-PUBLICATION-VOLUME-SANS-PERTE-20261120`, transmis après la réunion Philippe. Cette annexe complète les matrices et audits historiquement validés sans modifier leurs octets ni leurs décisions. Le [contrat et la qualification du lot](../../avereo-app-rapport/docs/volume-sans-perte.md) portent les limites, résultats et réserves courants. Le suivi opérationnel reste le suivi canonique Rapport qui y est relié.

| Composant | Écart local | Conservation vérifiée |
| --- | --- | --- |
| API publication | JSON jusqu'à 100 000 000 octets, mémoire vérifiée avant lecture, contrôle de la taille reconstituée | ZIP STORE schéma 1, SHA-256 et chemins, propriété, CSRF, transaction et idempotence maintenus |
| Interface documentaire | Limites provenant de la même source ; affichage décimal Mo corrigé | Plafonds fichier/lot/paquet inchangés à 524 288 000 octets ; aucun retrait ou traitement d'image |
| Contrat distribué | Copies JSON/PHP générées depuis le socle, parité vérifiée au test | Aucune logique métier partagée, aucune configuration privée modifiée |
| Livraison future | Liste de fichiers autorisés et ordre des dépendances adaptés | Aucun déploiement lancé ; règles d'accès, autres applications et base conservées |
| Paquet applicatif | Deux noms exacts de contrat autorisés, présence du couple contrôlée ; 42 tests d'outillage et paquet relu | Noms privés/inattendus et contrat partiel refusés ; anciens candidats sans contrat compatibles |

Les 78 tests d'interface et les 185 assertions HTTP locales incluent le paquet complet de 61 Mo, la nouvelle session, la copie privée, le partage/révocation de la restitution et la sauvegarde/restauration temporaire. L'inspecteur PHP accepte 100 000 000 octets, refuse 100 000 001 et refuse lisiblement sous un budget mémoire insuffisant. La pagination Word réelle, la capacité du navigateur et la reconnexion CONNECT hébergée restent à qualifier ; le Word de la recette de transport est fictif. Aucune nouvelle validation humaine ni migration de base.
