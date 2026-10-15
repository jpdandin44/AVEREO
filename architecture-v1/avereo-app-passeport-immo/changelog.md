---
project: avereo-app-passeport-immo
document_type: changelog
title: Changelog Passeport Immo
status: active
version: git
created: 2026-10-03
updated: 2026-10-15
owner: jpdandin
tags: [passeport-immo, local]
---

# Changelog Passeport Immo

## 2026-10-15 — Correction locale du lancement sans troisième identification

Retour humain : Passeport Immo s'ouvre depuis CONNECT, mais la porte Basic de
son sous-domaine redemande le compte visiteur. L'entrée PHP et le routage Apache
protègent désormais aussi les assets par cookie signé. Lecture anonyme, cookie
altéré, fichiers interdits et accès aux internes sont refusés ; 67 assertions
HTTP locales réussies. Aucun changement du sas commun, des droits ou du frontend.
Réinstallation privée préparée, recette hébergée et import du dossier encore ouverts.

## 2026-10-15 — Installation privée et sauvegarde du cas reçue

Installation des douze fichiers applicatifs et du delta CONNECT compatible de
deux fichiers, après récupération des fichiers et restauration ciblée des données
de catalogue/droits. Paramètres privés et clé dédiée sur serveur ; habilitation
du compte choisi, refus des deux autres comptes existants et autres droits conservés.
Protection visiteur maintenue en configuration d'environnement ; correction des
deux sous-dossiers publics en 0755 après détection des refus 403 dus au masque privé.
Six contrôles HTTPS anonymes reçoivent ensuite 401 Basic ; tickets réels de
l'émetteur installés, refus et rejeu contrôlés sur le serveur. Copie privée du cas
reçue ; recette navigateur et import effectif du bien restent à terminer.

## 2026-10-15 — Transfert préparé et diagnostic d'accès

Après demande d'installation privée, export local du dossier de recette : six
documents actifs, trois archivés et métadonnées conservés hors Git. Archive et
manifeste vérifiés par tailles, SHA-256, octets et CRC. Le transfert vers la
préproduction reste non réalisé. Diagnostic d'accès : TLS valide, porte visiteur
Basic active et échec d'identification dans le navigateur intégré avant CONNECT.
Reconnexion cPanel et identification du compte habituel nécessaires ; aucun
nouveau droit ni secret créé. Application et cockpit locaux relancés.

## 2026-10-15 — Contrôle hébergé et delta compatible

Catalogue et configuration CONNECT contrôlés en lecture seule ; cible Passeport
Immo déclarée et fermée, raccordement absent. Reçu structuré sans secrets et
relecture de la sauvegarde/restauration existante du fichier de fermeture, puis
nouvelle sauvegarde et restauration hébergées en dossier privé : arbre Passeport
Immo, deux fichiers CONNECT et configuration privée, permissions et actifs vérifiés.
Les secrets restent sur le serveur ; aucune base n'est incluse.
Préparateur du delta étendu pour ne modifier que trois lignes sur le runtime
historique exact, avec refus d'une empreinte ou d'un contexte différent.
19 tests Python, 32 tests du backend historique et 15 assertions du sas réussis.
Aucune installation ni création de droits ou de secrets hébergés.

## 2026-10-14 — Sas CONNECT et préparation privée

Sas commun copié au build ; entrypoint PHP, contrôle du HTML/routes et déconnexion.
Configuration CONNECT étendue à Passeport Immo, sans droits automatiques.
Contrat d'inventaire public commun aux deux packagers ; fichiers privés et sas
incomplet refusés, ZIP initialement fermé avec politique runtime identifiée.
Tests de contrat et recette Apache isolée, procédure de catalogue/installation
et socle CONNECT documentés. Aucune installation hébergée effectuée.

## 2026-10-14 — Documents et cas de coupes

Gestion locale de documents associés au client et au bien, lecteur PDF intégré,
classement, recherche, téléchargement et archives. Comparatif sourcé des
exigences ExamIn ; suivi regroupé en quatre phases avec conservation des
validations et preuves historiques. Deux scènes CAO avant/après préparées dans
Coupe, SVG natifs exportés, PDF comparatif de deux pages intégré au cas local.
Les données du cas restent privées ; le code de Coupe est inchangé. Les dix
pages inversées de deux PDF source sont corrigées et le DPE remis dans l’ordre,
avec originaux conservés. Le nouveau candidat reste soumis à recette humaine.

Complément des coupes : zones thermiques natives, interfaces et support bas
renseignés depuis les sources historiques et les précisions du responsable.
PDF comparatif enrichi avec légende et réserves, projets modifiables et archives
conservés ; le pas de 5 cm du tableau de repérage est signalé et les cotes CAO
lues sur les plans sont préservées.

Reprise du suivi après arrêt du serveur : fusion de la PR nº78 constatée et
publication actualisée. Sur clarification du responsable, le lot documents/coupes
est remis à revue avec cinq livrables et trois critères ; CONNECT et ses preuves
attendues restent un prérequis non livré de Préproduction. Historique et accords
existants conservés, aucune approbation de phase ajoutée.

## 2026-10-03
Socle documentaire et suivi initialisés ; audit des sources et matrice de 40 fonctions.
Reprise locale autorisée en conversation : renommage et clés distinctes, bibliothèques
npm/Tailwind, extraction des calculs. Lanceur local, modèle Docker et fixtures fictives.
Dix tests, construction Vite, contrôle de parité et configuration Compose réussis.
Parcours navigateur et PDF inspectés ; page blanche finale consignée pour décision.
Recette humaine préparée, statuts et validations formels préservés.

## Suite du 2026-10-03 — GitHub/cockpit et PDF
Raccordement du protocole commun au suivi, projection des trois étapes et contrôleur
de passage installé. Packaging vérifié et workflow CI Passeport Immo ajouté.
Correction autorisée de la page blanche finale ; régression reproduite avant correctif,
quatorze tests réussis après correctif. Même export fictif téléchargé : une page A4,
contenu complet inspecté. Préproduction et production restent à qualifier.

Fusion PR nº71 vérifiée après confirmation du responsable ; checklist GitHub humaine
observée. Préproduction dédiée o2switch choisie, informations de cible encore TBD.
Complément de pilotage préparé séparément après fusion, sans nouveau changement métier.

Enveloppe du contrôleur corrigée pour produire du JSON UTF-8 lors des appels
successifs sous Windows. Les trois contrôles de passage sont exécutés et consignés ;
leurs refus correspondent aux cibles, accords et preuves de récupération manquants.

PR nº72 rebasée sans conflit après fusion du protocole commun nº73. Contenu des deux
commits de suivi préservé ; documentation et paramètre local raccordés à la source
commune. Le candidat nº71, les statuts formels et les accords humains sont conservés.

Après signalement du responsable, champ de revues complémentaires corrigé selon
le contrat réel du cockpit : PR nº72 fusionnée visible en phase 0, fiche d'itération
proposée dès cette phase et état réel de préparation de préproduction explicite.
Contrôle automatique de raccordement ajouté ; aucun accord de phase déduit du merge.

Préparation privée après fusion nº72 : archive vérifiée du même candidat avec
fermeture initiale, restauration sur fichiers locaux et six tests d'intégrité/version/
chemins, exécutés par la CI Passeport Immo. Cible et accès distants restent non qualifiés.

Reprise explicitement demandée dans le nouveau chat AVEREO_2 : clone et changements
conservés, disponibilité locale contrôlée, tests de préparation et parité réussis.
Le suivi garde la clôture antérieure et affiche la reprise ; la publication du lot
est tracée séparément du candidat métier et des décisions humaines.

Préférence d'hébergement retenue par le responsable : sous-domaine de test proposé
et lune gratuite si disponible. Choix enregistré dans le suivi ; l'accès o2switch
reste sur l'écran de connexion, sans création ni installation distante.

Après correction de l'URL et connexion du responsable : session cPanel vérifiée,
cinq lunes gratuites libres constatées et formulaire d'activation préparé. La saisie
et la validation du nouveau mot de passe sont laissées au responsable ; aucun
compte, sous-domaine ou déploiement déclaré comme créé.

Diagnostic du navigateur : affichage Mon Univers Web bloqué à 817 pixels, utilisable
à 1280 pixels ; Chrome non exposé aux outils. Lune préparée constatée active, accès
à son cPanel vérifié. Restriction des sous-domaines entre comptes confirmée chez
o2switch ; le responsable conserve l'adresse demandée sur le compte parent, avec
un dossier dédié protégé. Suivi et vues actualisés ; reconnexion cPanel requise avant
création du dossier et du sous-domaine.

Après reconnexion du responsable : sous-domaine demandé et dossier dédié hors
`public_html` créés dans le compte parent. Modèle `.htaccess` fermé enregistré puis
relu ; certificat gratuit simulé puis installé par validation DNS. Adresse HTTPS
contrôlée dans le navigateur et avec le contexte SSL par défaut de Python : accès
refusé 403, en-tête d'interdiction d'indexation présent. L'application n'est pas
installée ; accès privé de test et récupération restent à qualifier. Observations,
documentation et vues actualisées, candidat et décisions humaines conservés.

## Clôture du 2026-10-03 — Cockpit et preuves

Conservation des vues approuvées lors de la génération, avec quatre tests de
protection supplémentaires exécutés par la CI. Le moteur Projet de cette copie
actualise les PR, conserve la revue en cours et permet un passage forcé motivé.
Le responsable a validé les phases 0 et 1 et démarré la phase 2 dans le cockpit.
Ces événements restent dans le suivi canonique ; aucune installation applicative
distante. Nouveau lot cockpit conservé localement, non publié à la clôture.

## 2026-10-14 — Documents par client et bien

Module documentaire local : client, import multiple/dossier, Blob persistants,
titres/catégories, lecteur PDF/image, téléchargement, recherche et archive réversible.
Contrôles de volume, de doublons et de séparation des biens. Douze nouveaux tests
portent le frontend à 26 tests ; chiffrage et export conservés par le contrôle a/b/c/d/e.
Comparatif des sources ExamIn et regroupement du cockpit en quatre phases avec
conservation de l’instantané, des décisions et preuves historiques.

## 2026-10-14 — Vérification des prérequis de préproduction

Archive du candidat documentaire contrôlée et préparation fermée créée séparément ;
option de destination de préparation ajoutée. Rapport et preuves du suivi actualisés,
avec prérequis CONNECT et limites d’origine navigateur explicites. Les décisions
humaines et assets sont conservés ; aucune installation hébergée.
