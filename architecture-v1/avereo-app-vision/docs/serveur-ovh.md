# Serveur OVH d'AVEREO — caractéristiques relevées

Relevé du 24/11/2026, en lecture seule, dans le manager OVHcloud (session du responsable), par Claude Code. Rien n'a été modifié ni commandé. Aucune adresse IP ni identifiant de compte n'est reproduit ici.

## Ce qui a été observé
Un seul service dans les offres Bare Metal Cloud : un serveur privé virtuel. Aucun serveur dédié (« Aucun résultat trouvé »). Les services Public Cloud et Web Cloud n'ont pas été consultés.

| Élément | Valeur |
|---|---|
| Modèle | VPS-1 2027 |
| Processeur | 2 vCores |
| Mémoire | 4 Go |
| Disque | 40 Go ; disque additionnel désactivé |
| GPU | aucun |
| Système | Ubuntu 24.04 |
| Localisation | Gravelines (France) |
| Sauvegarde | automatisée « Standard » (dernière observée : 23/11/2026 11:00) ; snapshot désactivé |
| Contrat | sans engagement ; renouvellement automatique ; prochaine échéance le 1er décembre 2026 |

## Écart avec le besoin de l'ADR 0001
| Besoin | Hypothèse de l'ADR (§5) | Observé | Verdict |
|---|---|---|---|
| Processeur | 8 cœurs | 2 vCores | insuffisant pour la reconstruction |
| Mémoire | 16 Go | 4 Go | insuffisant ; risque de manque de mémoire avec COLMAP |
| Disque | 50 Go de travail, hors vidéos | 40 Go au total | insuffisant dès les premières vidéos |
| GPU | aucun (décision D2 : CPU seul) | aucun | conforme à D2 |

Les valeurs de l'ADR sont des hypothèses non sourcées ; seule la mesure de l'essai du lot 7 donnera le besoin réel. Constat : ce serveur ne convient ni pour l'essai de précision, ni pour la reconstruction.

## Pistes (aucune n'est décidée ni commandée)
- Faire l'essai du lot 7 en conteneur local, puis choisir une offre OVH avec des mesures.
- Passer à une gamme supérieure de VPS ou à un serveur dédié avant le lot 7 : achat soumis à l'accord du responsable (AGENTS.md : service payant et infrastructure).
- Garder ce VPS pour l'application et le stockage ; ajouter un disque additionnel avant les vidéos (lot 3).
- Pour le PDF (lot 4), essayer WeasyPrint avant d'envisager Gotenberg sur 4 Go de mémoire.

## À VÉRIFIER (non visible dans le manager)
- Ce qui s'exécute aujourd'hui sur ce VPS.
- Docker, accès SSH et droits root, versions de PHP et de MySQL.
- Bande passante.
- Services éventuels dans Public Cloud et Web Cloud.
