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

## 2026-10-15 — Données initiales de production choisies

Le responsable choisit la reprise du dossier SCI de préproduction. Le suivi
canonique enregistre cette sélection et le dossier de production décrit la
préparation : inventaire à actualiser, propriétaire CONNECT à qualifier,
documents actifs et archivés, intégrité, absence de doublons et récupération.
Point de reprise, exigences, roadmap et tableaux dérivés alignés. Ce choix
n'autorise ni transfert, ni déploiement, ni changement de phase.

## 2026-10-15 — Qualification de production après fusion de la PR nº81

Fusion et CI vérifiées ; DNS et inventaire cPanel lus sans modification hébergée.
Domaine, dossier et raccordement Passeport Immo absents en production. Archive fermée
et delta CONNECT préparés contre les deux fichiers réellement observés. L'outillage
privé de sauvegarde accepte la production, isole ses chemins et son bloc cron, tout
en conservant les tâches existantes. Neuf cas supplémentaires portent la recette
sauvegarde à 22 assertions, toutes réussies avec les 30 contrôles API/stockage.
Dossier, exigences, point de reprise et suivi actualisés. Aucun déploiement,
changement de droits, transfert de données ni validation de phase effectué.

## 2026-10-15 — Adresse de production confirmée

Le responsable retient `https://passeport-immo.avereo.fr`. Suivi canonique, dossier
de production, point de reprise et tableaux actualisés. Ce choix d'adresse laisse
la qualification technique et l'accord de déploiement à traiter séparément.

## 2026-10-15 — Préparation de production après fusion de la PR nº80

Fusion et CI de `main` observées ; archive publique identique au candidat de
préproduction, seize fichiers relus et lot privé de sauvegarde vérifié. Dossier
de production ajouté, suivi et point de reprise actualisés, ancienne référence
circulaire au numéro de phase corrigée dans les critères non approuvés de phase 3.
Les quatre phases, décisions et neuf documents approuvés sont conservés.
Le tableau dérivé signale la revue de phase attendue même lorsqu'aucune demande
distincte n'a encore été créée dans la liste des décisions.
Cible, récupération et accords de production restent à qualifier. L'échec distinct
du workflow prototype GitHub Pages est consigné sans modification de son paramétrage.

## 2026-10-15 — Recette humaine et revue PR nº80 préparées

Guide de recette, fichier d'essai sans donnée client, six livrables décrits et
huit critères observables dans le cockpit. La Préproduction passe en revue
technique « À valider », en cohérence avec l'installation déjà autorisée et
réalisée ; aucune approbation, autorisation de production ou case humaine ajoutée.
Les preuves approuvées des phases précédentes restent inchangées.

## 2026-10-15 — Sauvegarde automatique installée et exécutée

Travailleur CLI quotidien, conservation de trente copies complètes réussies, verrou, diagnostic
privé et protection du dernier succès. Treize contrôles de rotation/échec/récupération
sont intégrés à la recette MariaDB et à la CI. Tâche privée installée, premier
succès cron constaté le 15 octobre à 13:34 UTC : quatre tables, neuf documents,
empreintes et restitution temporaire vérifiées. Les autres tâches sont conservées
et l’entrée de qualification est retirée ; rythme définitif 03 h 20 Europe/Paris.
Les seize fichiers publics de l’application restent identiques.

## 2026-10-15 — Stockage serveur installé et cas SCI migré

API PHP et schéma MySQL dédiés, fichiers privés, identité CONNECT conservée,
anti-CSRF, accès par propriétaire, imports atomiques et contrôle de révision.
Le mode hébergé charge l’API et affiche les erreurs ; le mode local est conservé.
Sauvegarde et restauration temporaire des lignes ajoutées ; recette MariaDB isolée.
Seize fichiers publics relus, neuf documents migrés, 34 assertions HTTPS avec deux
sessions indépendantes. Import dédoublonné, métadonnées, PDF deux pages, téléchargement
exact et rechargement vérifiés dans l’interface. Répertoire API corrigé en 0755 ;
fichiers et répertoire documentaires privés restent en 0600/0700. Quatre tables
et neuf fichiers sauvegardés, retour des lignes et empreintes vérifiés.
Voir [le lot serveur](docs/stockage-serveur.md) ; aucune production ou fusion.

## 2026-10-15 — Correction hébergée et import du dossier de recette

Le sas protège aussi les assets, la porte Basic redondante de Passeport Immo est
retirée ; CONNECT conserve sa porte et ses droits. Une page 403 héritée est
reproduite sous Apache puis remplacée par le refus standard. Douze fichiers
installés vérifiés, neuf contrôles CI réussis et douze contrôles HTTPS conformes.
Le ticket du compte autorisé ouvre l'application sans nouvelle saisie dans le
navigateur intégré ; styles, scripts, worker PDF et deux pages des coupes chargés.
Le bien de la SCI est importé dans ce navigateur, six actifs et trois archives,
persistance et neuf restitutions identiques aux sources vérifiées. Stockage non
partagé avec Chrome, bouton interne de démonstration conservé ; disparition de
la troisième fenêtre ensuite confirmée dans Chrome par le responsable.
Aucun merge ni livraison de production.

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
