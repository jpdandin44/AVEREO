---
project: avereo-app-passeport-immo
document_type: current-state-and-handoff
title: Reprise de Passeport Immo et évolution des archives
status: active
version: git
created: 2026-11-12
updated: 2026-11-12
owner: jpdandin
tags: [reprise, etat-des-lieux, documents, archives]
---

# Reprise de Passeport Immo et évolution des archives

## État des lieux au 12 novembre 2026

| Domaine | Fait établi | Limite et suite |
| --- | --- | --- |
| Code courant | Reprise depuis `main` `16338e844912fade2a5e8b315b8313fe6f7e2dbd` ; évolutions de novembre sur identité, logo protégé et navigation. | L’ancien clone était resté au 16 octobre ; les modifications voisines ne sont pas écrasées. |
| GitHub | PR85 Passeport Immo fusionnée le 16 octobre ; PR23 Drupal intégrée dans main, revue acquise. | Le merge ne prouve pas la version installée sur chaque hébergement. Ne pas refaire ces revues. |
| Préproduction | Application observée ouverte dans Chrome sous une session CONNECT, avec quatre documents sur le bien affiché et mention du stockage serveur privé. | Lecture de l’écran existant ; pas de nouvelle connexion ni écriture dans ce dossier, pas de comparaison exhaustive des octets serveur. |
| Accès publics | Racines préproduction et production : redirection 303 vers leur CONNECT ; API workspace : refus 401 sans session. | Vérification HTTPS anonyme, sans cookie ni identifiant ; ne vaut pas recette métier ou nouvelle connexion de production. |
| SCI et sauvegardes | Les reçus du 16 octobre décrivent le bien SCI, neuf documents, stockage privé et sauvegarde quotidienne. | Inventaire et dernier succès de sauvegarde à relire sur le serveur avant intervention ; aucun rejeu de migration, activation ou cron. |
| Types de fichier | Le code courant excluait les archives dans l’interface et dans PHP. | Le nouveau lot ajoute ZIP/7z/RAR/TAR/GZ/TGZ ; limites 25 Mo/fichier et 100 Mo/lot conservées. |
| Fonctionnement local | 49 tests frontend, 40 vérifications PHP, 19 tests Python, parité et build réussis après correction du guidage client/import. | CI isolée du nouveau candidat réussie : 83 contrôles Apache, 68 API, 22 sauvegardes et 35 transferts. Docker local indisponible ; les preuves restent attachées à leurs versions. Aucune recette hébergée de cette évolution déduite. |
| CIL | Le plan d’action structuré et son Word restent une proposition distincte. | L’ajout d’archives n’implémente pas les fonctions réglementaires d’un CIL complet. |

Les observations structurées sont dans la [preuve de reprise](../api/reprise-documents-compresses-observation.json).
Les anciennes mentions de PR85 en brouillon ou de PR21 à examiner sont historiques,
pas les prochaines consignes de travail.

## Itération actuelle et quatre phases

1. **Cadrage** : besoin et conservation d’archives entières confirmés par le responsable ; aucune validation humaine de phase créée.
2. **Développement local** : sélecteur, reconnaissance PHP et locale, message de consultation et tests produits ; candidat soumis à revue locale.
3. **Préproduction** : nouvelle archive à faire accepter puis installer sur une cible requalifiée avec récupération fraîche ; aucune installation de ce lot à ce stade.
4. **Mise en production** : après recette du nouveau candidat et accords applicables, livrer sous contrôle et vérifier les vrais parcours ; les autorisations de l’ancien candidat ne sont pas étendues par défaut.

Le [suivi de ce lot](../data/suivi-documents-compresses.json) est référencé depuis
le suivi historique du cockpit. Il ne remplace pas l’itération de production
antérieure ni ses décisions. La recette locale est décrite dans le
[guide des archives](documents-compresses.md).

## Reprendre et vérifier

- Copie active du lot : `C:/Users/examg/Documents local/passeport-immo-archives`.
- Branche : `feat/passeport-immo-documents-compresses`.
- Revue locale : [5178](http://127.0.0.1:5178/), données fictives et stockage du navigateur.
- Sous-projet : `architecture-v1/avereo-app-passeport-immo` ; démarrer le frontend avec `npm.cmd run dev -- --port 5178 --strictPort`.
- [PR144 — archives du bien](https://github.com/jpdandin44/AVEREO/pull/144), avec sa tête et ses contrôles à relire avant toute livraison. Les portes de préproduction et production restent distinctes.

Les copies du 16 octobre et leurs fichiers non commités sont préservés. Les
documents réels, reçus privés, copies de bases et secrets restent hors Git.

## Candidat après retour d’utilisation

Le retour du responsable sur l’impossibilité apparente de charger/enregistrer
conduit à afficher les deux étapes client/import et la cible d’enregistrement.
L’import reste conditionné à l’association du client. Le parcours fictif du
navigateur confirme l’activation des boutons et l’ajout automatique d’un ZIP.

Cette correction change les fichiers applicatifs : l’ancienne archive CI
`5c425c62`, SHA-256 `6963ebddf00c88f13e50fe49156882364651de4449bca39b3b37b4ed333c147d`,
reste historique. Le candidat courant, son empreinte et sa qualification sont
conservés dans le [suivi canonique](../data/suivi-documents-compresses.json).
Retenir l’archive CI téléchargée et vérifiée, sans lui substituer une construction
Windows dont les fins de ligne peuvent différer. Aucun déploiement de cette
correction n’est réalisé.
