---
project: avereo-app-passeport-immo
document_type: workflow
title: Préparer la livraison privée en préproduction
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [preproduction, o2switch, livraison]
---

# Préparer la livraison privée en préproduction

Ce raccordement prépare les fichiers du candidat identifié dans le suivi.
Le [protocole commun](../../../outillage/protocole-developpement/README.md) reste
la référence pour les passages, preuves et accords.

## Entrées et dépendances

Python 3.10+ et sa bibliothèque standard ; aucun accès réseau nécessaire.
Le candidat provient de `developmentWorkflow.candidate` dans [le suivi canonique](../docs/suivi-chantier.json).
Les entrées sont `.local/candidate.zip`, `.local/candidate.manifest.json` et
la [configuration de fermeture initiale](preproduction.htaccess).

Depuis le sous-projet :

```powershell
python workflows/prepare-preproduction.py
python -m unittest discover -s tests -p test_preproduction.py
```

Les options `--candidate` et `--manifest` permettent d'indiquer une archive conservée
ailleurs. La source et l'empreinte doivent correspondre au candidat canonique.
Le script ne reconstruit pas l'application et n'écrit aucun accord dans le suivi.

## Sorties et contrôles

Les sorties sont `.local/preproduction-preparation/release/preproduction.zip` et
`preproduction.manifest.json`, hors Git. Le manifeste distingue les empreintes du
candidat et du lot de livraison. Le lot contient les mêmes assets plus `.htaccess`,
sans secret ni donnée du navigateur. Version, ZIP, inventaire, empreintes, chemins et
absence de lien symbolique sont vérifiés.

Une répétition lit les octets du lot, les installe dans un dossier temporaire,
altère fictivement un fichier puis le restaure. Elle ne prouve pas la restauration
du contenu de l'hébergement ; ne pas la consigner comme sauvegarde restaurée o2switch.

## Protection et qualification

`Require all denied` ferme les requêtes selon
[le contrat Apache](https://httpd.apache.org/docs/2.4/mod/mod_authz_core.html#reqall).
Il reste à vérifier que la cible lit `.htaccess` : pages et assets doivent répondre
HTTP 403 avec cette fermeture initiale. Une réponse 200 bloque la qualification.
La protection privée de consultation reste à choisir et à vérifier.
La [confidentialité de répertoire o2switch](https://faq.o2switch.fr/cpanel/fichiers/protection-repertoire-web/)
est disponible ; son installation et ses identifiants ne sont pas acquis. Aucun
identifiant dans Git ou la conversation. CONNECT reste un lot distinct à qualifier.

## Avant l'installation distante

Compléter la [qualification de cible](../docs/qualification-preproduction.md) et ses
champs canoniques : URL, document root, accès, séparation et récupération de l'état
existant. Présenter candidat, empreinte du lot, cible et effet pour l'accord applicable.
La procédure distante dépendra des accès constatés. Cette préparation ne transfère
aucun fichier et ne crée ni domaine ni secret. Exécuter les contrôles du skill avec
les preuves de la cible réelle avant tout passage.
