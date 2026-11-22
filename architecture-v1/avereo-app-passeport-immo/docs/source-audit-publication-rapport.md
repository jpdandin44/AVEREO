---
project: avereo-app-passeport-immo
document_type: source-audit
title: Annexe de parité — publications Rapport privées
status: active
version: git
created: 2026-11-19
updated: 2026-11-19
owner: jpdandin
tags: [parite, rapport, publication, confidentialite]
---

# Annexe de parité — publications Rapport privées

Le responsable autorise le 19 novembre la publication du rapport final avec une copie complète privée réouvrable dans Rapport et sa qualification en préproduction. Ce nouveau lot complète les audits et matrices approuvés **sans modifier leurs octets historiques ni réutiliser leur validation humaine**. [Contrat du nouveau parcours](../../avereo-app-rapport/docs/publication-passeport-immo.md).

| Composant | Évolution | Conservation ou limite |
| --- | --- | --- |
| Dossier documentaire | Section repliable d’import des versions finalisées, confirmation et téléchargement privé | Application principale et calculs de chiffrage inchangés ; aucune section privée dans la vue d’un destinataire |
| Stockage/API | Paquet complet hors de pi_documents, contrôle propriétaire/bien, CSRF, SHA-256, idempotence et transaction | Les partages existants ne voient que la restitution ; dépôt ordinaire du paquet privé refusé, même renommé |
| Base et sauvegarde | Colonne nullable report_publications, ajout vérifié, copie des blobs privés et restauration temporaire | Quatre tables existantes, données historiques et paramètres d’accès conservés |
| Transfert CLI historique entre environnements | Accepte les champs nullable vides ; refuse un bien ayant une publication avant export partiel | Les transferts des biens sans publication et les anciens manifestes restent valides ; le transfert des copies privées entre environnements reste à qualifier |
| Livraison sélectionnée | Index, bundles et trois fichiers API nécessaires seulement | Menu commun Rapport, carte RGA, règles d’accès, fichiers non concernés et production conservés |

La première préparation de livraison a refusé deux compagnons hors lot différents de l’hébergé ; aucun remplacement public n’a suivi. La livraison est donc un delta du nouveau parcours, appliqué au runtime conservé. La CI a également signalé la modification de l’audit historique source-audit.md : ses octets de référence sont rétablis ; le présent complément porte seul le nouvel écart. Les contrôles d’historique ne sont pas affaiblis.
