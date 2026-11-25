---
project: avereo-app-rapport
document_type: migration-matrix
title: Matrice de migration fonctionnelle
status: active
version: git
created: 2026-07-13
updated: 2026-11-25
owner: jpdandin
tags:
  - rapport
  - migration
  - fonctionnalites
---

## 25 novembre — Relecture et PDF, évolution locale

Écart explicite au parcours de finalisation historique : demande privée avec les deux PDF, nomination par version, refus/validation et publication client séparée. Les anciennes sources et partages sont conservés. Nouvelle colonne nullable Passeport, archives de revue incluses dans la sauvegarde et transfert historique refusé avant export partiel. [Contrat, droits, migration et limites](../workflows/relecture-validation-pdf.md). Aucun déploiement.


## 24 novembre — Nouvelle source de droit, sans migration de dossier

Le droit par compte de CONNECT remplace la liste technique privée du premier candidat. Ancien catalogue sans carte de droits accepté et lu sans réécriture ; aucun dossier, profil, propriétaire ou champ métier migré. Les nouvelles créations exigent une attribution explicite après livraison coordonnée. [Contrat de compatibilité](../../avereo-app-connect/docs/profils-et-droits.md#droit-de-création-rapport-technique--complément-du-24-novembre).

## 24 novembre — Choix explicites sans conversion des dossiers

Les spécialités réutilisent les valeurs sous_categorie existantes ; les libellés accentués sont d’affichage. Le titre reste dans titre. Le Terrain global dépend du type global, y compris ancien, sans imposer un profil et sans créer/supprimer de constat. Aucun changement SQL ou quota. [Compatibilité et recette](rapport-technique.md#correction-après-retour-utilisateur--choix-des-types-et-terrain).

## 24 novembre — Champs techniques facultatifs, sans migration SQL

[Contrat de compatibilité](rapport-technique.md#contrat-de-la-première-tranche-locale). mission_technique et quatre textes techniques par constat sont embarqués dans le JSON complet existant ; champs absents acceptés, données inconnues et catégories historiques conservées. Le sous-type vide est conservé pour une nouvelle mission technique explicite. Aucun classement Eau/Air/Terre/Feu imposé ni remplacement d’identifiants. Les anciens Word conservent leur présentation ; les nouveaux Word techniques reprennent périmètre et limites, et gardent les détails internes hors client.

## 22 novembre — Livraison du contrat de volume sans migration

PR178 fusionnée et installée en préproduction, source `15f537a05b06a0ba589885b0945109c978afbc24`. Le plafond JSON est appliqué à **100 000 000 octets (100 Mo)** dans Rapport et Passeport, sans réduire les médias ni changer les 524 288 000 octets autorisés par paquet. Sauvegardes et restauration temporaire réussies ; 32 dossiers Rapport et leurs propriétaires, quatre tables Passeport et 30 fichiers privés exacts après livraison. [Reçu de conservation](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-volume-sans-perte-20261120/preproduction-20261122/final-verification.json>).

Aucune réécriture des anciens JSON et aucune nouvelle colonne. Le plafond privé Rapport est seul aligné ; les comparaisons après livraison portent sur les lignes brutes et les propriétaires, ainsi que sur les blobs privés Passeport. La recette authentifiée du gros dossier et le rendu Microsoft Word restent distincts. [Contrat](volume-sans-perte.md#préproduction).

## 21 novembre — Capacité et fidélité JSON, sans migration

La chaîne navigateur complète est désormais contrôlée : l'ouverture source ajoute seulement son identifiant serveur dans le navigateur ; la copie réimportée le retire, puis reçoit celui de sa nouvelle ligne au compte B. Champs métier, 37 médias décodés, plans et repères exacts après nouvelle session. Source et lignes antérieures conservées. [Reçu et limites du rendu Word](volume-sans-perte.md#reprise-du-21-novembre-et-parcours-réel-dans-le-navigateur-local).

Aucune migration SQL ni conversion des dossiers existants. Le candidat [volume sans perte](volume-sans-perte.md) accepte les anciens JSON/paquets, garde STORE schéma 1 et retire seulement les liens techniques de la copie indépendante. Les sauvegardes nouvelles conservent les types objet/liste natifs au lieu de normaliser les objets vides. La première qualification HTTP est complétée par la recette navigateur et génération Word décrite ci-dessus ; le rendu Microsoft Word et la recette hébergée restent distincts.


## 19 novembre — Publication et réimport sans mutation de la source

Aucune migration Rapport. Le paquet conserve tous les champs du JSON et les originaux référencés. Le réimport retire seulement le rattachement `onlineReportId` et remplace les anciennes références privées photo par leurs octets intégrés ; versions annotées et repères conservés. Les JSON historiques continuent d’être importables. Les exports ordinaires gardent le statut de travail. La finalisation s’applique à un instantané explicitement confirmé. [Contrat](publication-passeport-immo.md).
## 17 novembre — Libellé Analyse globale sans migration

La valeur profil_metier=habitologue, les catégories historiques dont Rapport Habitologue et les préférences de compte restent exactes. Seuls les intitulés de prestation et de conseils changent ; aucun remplacement dans les textes utilisateurs, champs actions/conseils ou médias. Profils absent/inconnu et règles des parcours Architecte/Maître d’œuvre conservés. [Contrat](profils-professionnels.md#libellé-de-prestation--17-novembre).

## 17 novembre — Plans multiples sans migration SQL

Les huit valeurs de plans[].kind sont acceptées par le client et la validation PHP ; anciennes valeurs niveau/coupe/cadastre inchangées. cadrage.mode est facultatif et borné aux trois fonds. Vues figées, IDs et coordonnées conservés ; aucune migration, copie d’identité ou modification de droit. [Règles de conservation](reperage-observations.md).

## 17 novembre — Profils administrés, compatibilité

Pas de migration des dossiers ou comptes, pas de changement d'identifiant ou
propriétaire. Sans affectation administrative : fonctionnement historique.
Profil affecté : applications et actions bornées par la politique existante.
Un parcours administré reconnu peut servir de défaut à une création seulement.
La réserve historique {} / [] des quatre contrôles vides est documentée ; aucune
assertion de contenu complet retirée. [Compatibilité et récupération](../../avereo-app-connect/docs/profils-et-droits.md).
## 16 novembre — Profils professionnels et défaut CONNECT

Pas de migration SQL ni nouveau champ Rapport : `profil_metier` existant conserve les codes reconnus, les autres valeurs restent stockées. Même `decision`, actions/options/liens/IDs, nouveaux libellés communs UI/Word. Défaut CONNECT personnel dans un fichier compagnon privé indépendant du médaillon, aucun identifiant de compte ajouté au dossier. Terrain/contexte et médias accessibles aux parcours professionnels reconnus de Visite Globale ; filtres client et masquage Habitologue conservés. [Compatibilité, tests et limites](profils-professionnels.md).

## 16 novembre — PR163 déployée sans migration

Seuls les champs facultatifs de planning existants dans le candidat qualifié sont pris en charge par la nouvelle validation PHP. Aucune table, configuration, identité ou propriété changée ; 24 dossiers et toutes leurs colonnes sont exacts après livraison et navigation, aucun enregistrement serveur effectué. Import de la fixture : seule normalisation attendue des quatre contrôles de protocole vides [] vers {}, déjà documentée ; toutes les autres données métier exactes. Le fichier Projet entier correspond à la projection canonique de la fixture importée. [Reçus](interventions-projet.md#préproduction).

## 16 novembre — Paramètres facultatifs de planning Projet

decision.schema_version=1 conservée ; ajout facultatif de decision.planning_projet et decision.actions[].planning_projet, sans seconde liste, modification d’ID source ou migration SQL. Aucun défaut ajouté à la lecture ; modifications conservant les clés inconnues. API reports.php, téléchargement, autorisations et schéma inchangés ; validation optionnelle dans decision-validation.php. Export dérivé schemaVersion=1 natif Projet, nouveau projet sous son contrôle existant ; aucune synchronisation/écriture directe. [Champs et compatibilité](../api/interventions-projet.md). Réserve antérieure des contrôles de protocole vides distincte.

## 16 novembre — Livraison PR162 sans migration

Fusion f4017be identique au candidat b04ea2b ; promotion du même artefact de présentation. Aucun schéma/table, champ JSON, API, rôle/propriétaire ou moteur de restitution changé. Sauvegarde privée de la table relue ; 24 dossiers/colonnes/propriétaires exacts après navigation, aucune restauration SQL ou écriture. Import complet fictif conservant les champs métier, lien serveur source retiré normalement ; choix expert/client et filtres conservés. [Reçus et limites](organisation-ecrans.md#préproduction).

## 16 novembre — Compatibilité des ouvertures de fiches

Les ouvertures ne créent aucun champ dans le dossier, aucun schéma ou nouvelle migration. Champs, identifiants, numéros, photos/plans/signature et données inconnues restent dans le payload courant. Replis seuls : JSON exact et contenu Word équivalent ; copie indépendante puis nouvelle session : payload UI entier exact. Les projections des autres profils gardent leurs données et règles. [Preuves et accès de revue](organisation-ecrans.md#revue-locale). La réserve PHP objet/liste reste séparée.


## 16 novembre — Persistance Interventions qualifiée sur la cible

Trois interventions retrouvent nature, priorité/horizon, modalités/préalables/justification, sélections client et références T1/9/T2 et attentes après deux sauvegardes puis ouverture serveur dans une nouvelle session normale sans brouillon. Identifiants préexistants conservés et JSON identique octet pour octet ; attentes/notes/liens et contenus du dossier préservés. Les 23 lignes historiques restent exactes. [Reçus et limites](interventions-proposees.md#recette-complète-du-16-novembre). Aucun changement de version ou schéma ; la normalisation PHP préexistante des objets vides reste distincte.


## 16 novembre — Compatibilité Interventions confirmée sur la cible

Interface et validation PHP facultative promues ensemble. Types realisation et inclure_client contrôlés sur la cible par deux refus sans écriture. Les 23 dossiers existants, colonnes/propriétaires et schéma sont inchangés ; variantes communes et fins de ligne déjà revues conservées hors des quatre fichiers, autres octets exacts hors ligne de refus prévue. Aucun changement de droit, compte ou activation privée. [Périmètre et preuves](interventions-proposees.md#préproduction). La normalisation PHP préexistante des objets vides reste distincte.

## 16 novembre — Compatibilité des interventions Habitologue

decision.actions et ses identifiants restent la source unique ; realisation (texte) et inclure_client (booléen) sont facultatifs et validés côté PHP. Absence de sélection client = exclusion. Les anciennes actions deviennent consultables dans le panneau Habitologue ; les options/références historiques restent en mémoire et dans le JSON. Les autres profils conservent leurs projections ; ces nouveaux champs n’y ont pas encore d’éditeur dédié. Version future non prise en charge : panneau et rendu refusent une interprétation silencieuse. [Contrat et limites](interventions-proposees.md#données-et-compatibilité). Aucun changement SQL, droit ou migration ; interface/validation à promouvoir ensemble si autorisées.

## 16 novembre — Persistance Attentes qualifiée sur la cible

La recette hébergée retrouve les trois attentes, notes, provenance et deux liens après sauvegardes puis ouverture serveur en nouvelle session sans brouillon. Une correction du libellé reste associée au même lien ; le changement de l’écoute conserve le verbatim initial. Les dossiers historiques et la source Terrain restent exacts. [Reçus et limites](attentes-ecoute-client.md#recette-complète-du-16-novembre). Aucun changement de schéma ou de version ; la normalisation PHP préexistante objet/liste des contrôles vides reste distincte.

## 16 novembre — Compatibilité confirmée sur la cible de préproduction

Interface et validation PHP facultative livrées ensemble. Nouvelles validations réellement actives via deux refus HTTP sans écriture ; 22 dossiers existants, colonnes, propriétaires et schéma préservés. Variantes communes et octets préexistants hors des cinq fichiers retenus conservés, seul le journal de refus reçoit sa ligne attendue. Aucun changement d’authentification, de droit, de table ou d’activation privée. [Recette de livraison et limites](attentes-ecoute-client.md#préproduction). La normalisation préexistante des objets vides reste un suivi distinct, non corrigé ici.

## 16 novembre — Compatibilité des attentes et notes

decision.notes_attentes et attentes[].provenance_ecoute sont facultatifs ; schema_version 1 maintenu. Anciennes attentes et liens ne sont ni réidentifiés ni reclassés. Aucun nouveau schéma SQL. Une ancienne interface qui conserve les propriétés inconnues peut garder ces valeurs sans les afficher ; qualifier la version avant d’annoncer leur édition/restauration. Type objet/liste des contrôles de protocole vides : normalisation PHP préexistante, distincte de ce lot. [Contrat, limites et recette](attentes-ecoute-client.md).


## 2026-11-14 — Terrain horizontal : compatibilité et retour arrière

Constats terrain dans observations avec phase_habitologie=terrain ; Tn dérivés séparément des numéros du bâti. Anciens objets, plans, signature, photos et références conservés ; copie complète indépendante et source/propriétaire inchangés vérifiés. Ancien contexte facultatif repris dans un volet d’Observations, sans conversion. Nouveau kind=cadastre et métadonnées cadrage/localisation dans plans ; validation PHP et frontend à livrer ensemble. Aucun changement SQL.

Une ancienne interface peut classer les constats terrain dans À classer et produire une numérotation différente ; un ancien PHP refuse le type cadastre. Ne pas utiliser un ancien client pour éditer/exporter ces nouveaux dossiers. Un retour arrière du code ne retire pas les champs JSON ; conserver la sauvegarde complète et qualifier les versions ensemble avant livraison. Aucun déploiement effectué. [Contrat et recette actuelle](environnement-terrain.md). Les résultats Site ci-dessous décrivent le premier candidat.

## 2026-11-14 — Contexte extérieur facultatif, sans migration SQL

`contexte_exterieur` étend le payload brut existant ; son absence n'ajoute aucun contenu aux anciens dossiers. Ses champs inconnus compatibles, son identifiant et ses octets photo sont conservés par le JSON complet et l'import indépendant. Le compteur `photos` ajoute la photo du contexte si elle existe. La copie expurgée l'omet entièrement. L'édition/suppression ne réécrit ni observations, ni terrain mesuré, ni sélection client ou repères. Changement de profil : données conservées, section masquée hors Habitologue.

La vue associée reste une référence vers un fond existant, sans nouveau numéro ; référence absente signalée. Le stockage SQL et les permissions ne changent pas. Une ancienne interface conserve ce champ inconnu mais ne l'édite ni ne l'exporte en Word. Pas de migration ni restauration de base à prévoir pour le code de ce lot ; aucun déploiement effectué. [Contrat et qualification locale](environnement-terrain.md).


## 2026-11-13 — Copie photo préparée et comptage conservateur

Le payload conserve les anciennes photos telles quelles et ajoute facultativement `reportVersion` et `reportPhotoChoice`. Les champs inconnus et références existantes sont préservés. L’éditeur ne remplace pas l’original ; une copie dont la version ou les opérations sont invalides n’est pas choisie pour l’export. Le serveur continue à stocker le JSON existant ; aucune migration ni nouvelle table pour les annotations.

Le quota d’originaux utilise la table 003 existante plus l’inventaire privé du propriétaire sous verrou : réservations SQL, résidus orphelins/temporaires et surplus physique, sans double comptage des octets enregistrés ni suppression automatique. Le périmètre d’identité reste inchangé. [Contrat et réserves](photos-rapport-edition.md).

## 2026-11-13 — Pagination Word, préproduction vérifiée

Regroupement explicite de chaque constat client et de la conclusion de décision ; conversion en propriétés Word `keepNext`/`keepLines`, sans nouvelle rupture obligatoire entre constats. Les marges verticales des cellules sont resserrées uniquement dans l’aide à la décision. Les deux réserves sont résolues sur les 26 pages contrôlées en préproduction (expert 20 pages, synthèse 6 pages). Données, identifiants, médias, propriétaires, API et schéma inchangés. [Critères de recette et état](partage-tests-et-stockage.md#correction-de-pagination--13-novembre).


## 2026-11-13 — Fidélité des exports, pagination à améliorer

Le rapport expert reprend les 12 constats, deux placements photo, plan et signature ; la synthèse reprend les deux constats sélectionnés, une photo et un plan, sans signature dans son format actuel. Conversion PDF native Word vérifiée, aucun bouton PDF direct. Deux réserves de pagination sont ouvertes lors de ce contrôle initial, puis résolues par le correctif ci-dessus ; aucune migration effectuée. [Résultats et limites](partage-tests-et-stockage.md#contrôle-des-exports-word-et-pdf--13-novembre).


## 2026-11-13 — Recette du stockage existant après PR152

Le stockage actuel est qualifié par sauvegarde, copie sous un autre compte fictif et nouvelle session sans brouillon local. Les 18 lignes existantes et le propriétaire source restent inchangés ; deux nouvelles lignes fictives sont conservées. Collections de contrôles vides normalisées de `[]` à `{}` au rechargement, sans perte de saisie. Comptes et navigateur restaurés. [Portée et preuves](partage-tests-et-stockage.md#recette-complète-entre-deux-comptes-fictifs--13-novembre). Aucune migration, activation des originaux ou production effectuée.


## 2026-11-13 — Livraison préproduction PR152

Les huit fichiers applicatifs sont installés depuis le paquet qualifié, sans migration SQL. Les routes d’originaux privés sont présentes mais la capacité reste désactivée : aucune configuration ou table 003 activée par cette livraison. Tous les dossiers, propriétaires, colonnes et la configuration privée sont conservés. Les composants communs déjà hébergés et les variantes LF/CRLF restent inchangés.

Le retour arrière des fichiers a été répété sur une copie privée ; il ne réécrit pas la base et ne restaure pas des dossiers par-dessus des saisies récentes. Sauvegarde JSON lue et vérifiée, sans restauration SQL sur cible. [Reçus et portée des contrôles](partage-tests-et-stockage.md#préproduction).


## 2026-11-13 — Dossier complet, sans migration SQL

| Élément | Effet |
| --- | --- |
| `reports.php` GET `download=1` | Octets exacts du payload sous les mêmes droits de lecture, pièce jointe et SHA-256. |
| POST existant | Même stockage ; relecture du contenu écrit puis accusé avec compteurs. |
| JSON complet importé | Champs conservés et seul `onlineReportId` retiré ; prochaine sauvegarde indépendante du source. |
| Structure de test | Nouveau marqueur facultatif `copie_test: true` ; ancienne forme reçue reconnue sans convertir son contenu fictif en contenu réel. |
| Anciennes sauvegardes | Ouvrables si contenu valide ; résumé seul refusé, brouillon préservé. |
| Retour applicatif | Ancienne interface ignore le marqueur ; aucun schéma à supprimer. Déployer interface et API cohérentes. |

Les exports organisationnels et leurs grants restent inchangés. [Procédure et limites](partage-tests-et-stockage.md).

## 2026-11-13 — Originaux privés, migration additive locale

| Élément | Compatibilité / état |
| --- | --- |
| Migration `003_photo_originals.sql` | Ajoute uniquement `rapport_photo_originals`, exécutée sur MariaDB temporaire ; aucun schéma hébergé modifié. |
| Photos historiques | `id`, `name`, `src`, `horodatageISO` et autres champs conservés ; `original` facultatif, aucun transfert automatique. |
| Export/import et Word | Image complète toujours conservée ; référence facultative ne confère aucun droit. Aucun allègement annoncé. |
| Propriété | Celle du rapport et celle de l’original doivent correspondre ; aucun changement du propriétaire source. |
| Suppression / réattribution | Aucune suppression automatique d’original ; accès refusé lorsque le rapport disparaît ou change de propriétaire. Politique future à définir. |
| Retour applicatif | Désactiver la fonction, conserver table et fichiers privés ; les anciennes interfaces ignorent la référence. Retour avec données à préparer avant livraison. |

[Contrat, configuration et restauration](photos-originales-et-annotations.md), [API](../api/photos-originales.json).

## 2026-11-13 — Promotion PR149 sans migration

Quatre fichiers statiques installés ; aucune route, table, clé de stockage, règle d'accès ou configuration privée remplacée. Les 17 lignes de dossiers, leurs propriétaires et leurs payloads sont identiques avant/après installation. La sauvegarde privée des données est relue ; le retour arrière testé concerne les fichiers et ne réécrit pas la base. [Livraison et vérifications](lot-0-observations.md#livraison-du-13-novembre-2026).

## 2026-11-12 — Lot 0 Observations, sans migration

Tri de présentation non destructif, déplacement explicite limité à la même phase et numéros dérivés ; les références restent les identifiants existants. Les anciens types techniques restent lisibles malgré leur masquage à la création. Aucun champ de numéro, table ou route ajouté. [Compatibilité et recette](lot-0-observations.md).

## 2026-11-12 — Profil et explications, sans SQL

Champs optionnels `profil_metier` et `observations[].explications` dans le payload existant. Ancien `actions` inchangé, profil absent conservant le parcours historique ; données des projections non supprimées. [Contrat et qualification](profil-habitologue.md).


## 2026-11-06 — Correction de navigation RGA déployée

Le fichier de navigation PR #122 est installé, sans migration SQL, changement de clé de stockage ni écriture de projet. La liste vide du navigateur de recette reste vide ; seul son déclenchement est testé. [Livraison et recette](../../avereo-platform/docs/livraison-mon-espace.md).


## 2026-11-06 — Navigation RGA sans migration

Le correctif préparé ne concerne que `frontend/public/rga/workspace.js`. Aucun schéma, clé de stockage, projet, résultat Géorisques ou contrôle d’identité ne change. Les données déjà enregistrées restent utilisables ; seul le déclenchement de la liste depuis la carte intégrée est corrigé. [Livraison et réserves](../../avereo-platform/docs/livraison-mon-espace.md).


## 2026-11-04 — Candidat d’archivage CONNECT

Changement du sas Rapport, réutilisé par le build RGA, et de l’entrée d’écriture des dossiers. Aucun changement SQL Rapport. Installer avant d’activer les actions d’administration CONNECT. [Contrat de projection](essais-temporaires.md).


## Essais temporaires — candidat local

Aucun changement SQL ni payload métier. La politique configurée exige une identité dans le cookie ; les anciens cookies RGA anonymes nécessitent une relance depuis CONNECT. Sans politique, compatibilité conservée. [Contrat](essais-temporaires.md).


## Repérage des observations

Les champs optionnels `plans` et `observations[].reperes` restent dans le payload existant : aucune migration SQL ni conversion destructive. Les anciens dossiers ne reçoivent aucun plan par défaut. Les cinq vues privées du Cricq sont ajoutées seulement à une copie locale de son dossier. [Contrat et état de qualification](reperage-observations.md).


## Saisie de Validation et export — préproduction du 2 novembre

Ajout de contrôles vocaux et d'un enregistrement explicite du brouillon d'attente. Les champs, identifiants, liens, accords, médias et contrats JSON restent ceux du dossier existant ; aucune migration. Anciens contenus longs conservés, aucun choix ou accord déduit d'une dictée ou d'un enregistrement. Les deux exports de recette gardent l'attente modifiée ; les quatre Word de présentation restent distincts. [Critères et limites](aide-decision-demo.md#saisie-vocale-et-enregistrement-explicite-des-attentes).



Candidat fonctionnel `63ec279` installé sur [Rapport préproduction via CONNECT](https://connect-preprod.avereo.fr/?app=rapport), après accord explicite. Sauvegarde fraîche des 148 fichiers et de la configuration privée ; installation/restauration répétée sur copie privée, puis trois fichiers livrés et 147 fichiers préexistants conservés. Configuration inchangée, aucune migration ni écriture SQL de livraison. Les reçus sont rattachés à `finalisation20261102.exportInput20261102` dans le suivi canonique.

Tilleuls et Cricq : confirmation « Enregistrer cette attente », reprise après rechargement, sauvegarde/réouverture serveur et conservation de toutes les données métier contrôlées (seul `updatedAt` évolue). Quatre DOCX hébergés valides ; textes et médias des deux Tilleuls identiques à la présentation, synthèse client Cricq identique. L'expert Cricq reflète des modifications antérieures de localisation, risques, cadastre, terrain et urbanisme ; ses notes détaillées terrain/urbanisme ont été remplacées ou vidées avant cette installation. Copie récente préservée, arbitrage de contenu demandé au responsable. Les quatre fichiers de présentation restent inchangés. Brouillon initial du navigateur restauré exactement avant nouvel enregistrement local.

Microphone et service vocal réels à essayer avec le responsable ; les essais vocaux antérieurs sont simulés. Contrôles micro présents et cohérents avec l'accord enregistré, sans nouvel accord ni permission micro accordée par l'agent. Revue métier et validation humaine restent distinctes ; aucun merge ni production.

## Lot RGA du 2 novembre

Le complément de superposition est purement visuel : mêmes coordonnées,
confirmation et données enregistrées ; ajout d'une couche dans la carte du
lieu et d'une vue cadastrale dans la carte autonome. Aucun champ ni migration.

Anciennes cartes conservées ; nouvelle carte et résultat `rga_cartographie` optionnel. Les anciens dossiers sans ce champ restent lisibles. Les autres données métier ne changent pas lors d’une reprise de lecture au même point. JSON et restitution utilisent le même bloc validé. [Critères et état de recette](../api/rga.md).

## Reprise Géorisques — candidat local du 2 novembre

Complément local Géorisques du 2 novembre : les champs `risques` et leur date
restent identiques. Seule la récupération évolue, avec reprises limitées et
conservation au même point en cas d'échec. Aucun changement de schéma, import,
export ou API PHP ; aucune migration. [Qualification et limites](../api/georisques.md).

## Corrections du 1er novembre

| Fonction | Contrôle réalisé | Qualification restante |
| --- | --- | --- |
| Complétude de saisie | Rappel visible à 100 % sur les deux copies hébergées ; calcul conservé | Revue métier indépendante du pourcentage |
| Message photo et dictée | Quatre états contrôlés localement ; états Tilleuls et Cricq vérifiés en préproduction, boutons cohérents | Essai matériel micro/caméra non réalisé |
| Compléments des deux maisons | JSON serveur exactement préparés, identifiants et médias conservés ; quatre Word hébergés, 56 pages contrôlées | Revue métier des fiches et des hypothèses |
| Session de démonstration | Durée de 1 800 secondes relevée ; renouvellement par CONNECT contrôlé | Prévoir une relance avant chaque maison pendant la répétition de 90 minutes |

Le candidat `9ce22fd` est livré et contrôlé le 1er novembre ; sauvegarde/restauration et reçus propres à ce lot. [Détail et limites](aide-decision-demo.md#corrections-du-1er-novembre).

## État du lot aide à la décision du 30 octobre

| Fonction | État local | Qualification restante |
| --- | --- | --- |
| Attentes et projet séparés | Rubriques optionnelles à Export ; deux cas modifiés, sauvés en ligne et rouverts sur `9a4f414` | Revue métier |
| Bilan et actions liés | Références et données conservées dans le JSON serveur ; alerte d’omission vérifiée puis sélection restaurée | Qualification métier des incontournables |
| Deux options et comparaison | Même grille ; Word expert Tilleuls/Cricq 17/26 pages et client 5/7 pages contrôlés | Revue des deux restitutions par le responsable |
| Dossiers antérieurs | Compatibilité contrôlée ; création de deux copies distinctes sans remplacement des rapports précédents | Isolation entre deux comptes non couverte par cette recette |

Le candidat `5d70e41` reste l’état antérieur sauvegardé. Les preuves de la recette du nouveau `9a4f414` sont propres à ce lot. [Spécification](aide-decision-demo.md).


# Matrice de migration fonctionnelle

## État du lot démo au 24 octobre

L’interface de réouverture depuis la liste serveur est implémentée et livrée en préproduction, en réutilisant les opérations API existantes. Le RGA dispose d’un affichage explicite et les cartes d’origine sont empaquetées derrière CONNECT. Le lien de déconnexion flottant a été remplacé par une action d’en-tête, contrôlée sur écran large et étroit ; le brouillon le plus récent est repris entre les deux stockages. Ces écarts et leurs sources sont décrits dans le [point de reprise](reprise-demo-philippe.md) et l’[architecture](architecture.md). Le build authentifié et les 60 tests réussissent ; les empreintes livrées, la restauration et les refus anonymes sont vérifiés ; la recette authentifiée et la revue native Word restent à effectuer.

Les états du 16 octobre ci-dessous sont historiques ; la production du 23 octobre est enregistrée dans le suivi opérationnel. Aucune preuve antérieure n’est réattribuée au nouveau code.


## Passage en production après fusion de la PR #84

La [préparation du 16 octobre](../../../outillage/acces-preproduction/preparation-production-rapport-passeport.md)
confirme l'identité des sources exécutables avec `main`, l'ancienne version encore
servie en production et le plan ciblé de cinq écritures. Le point OAuth répond 503 ;
la récupération et le retour arrière Rapport restent à qualifier. Aucun comportement
applicatif ni statut de qualification fonctionnelle n'est changé par ce dossier.

## Préproduction du 16 octobre 2026

Les deux types de rapport, leur sauvegarde/relecture en ligne, reprise du brouillon, aperçus et exports JSON/Word sont contrôlés sur le candidat livré. Les données métier existantes et le brouillon initial sont conservés. Le [compte rendu transverse](../../../outillage/acces-preproduction/livraison-rapport-passeport.md) fournit les empreintes et limites exactes. Cette recette ciblée ne requalifie pas les services géographiques, photos, dictée ni le rendu natif Word ; les limites spécifiques de la matrice restent valables.


| Fonctionnalite | Source | Donnees/services | Cible AVEREO et test | Statut |
| --- | --- | --- | --- | --- |
| Valeurs libres importées dans les observations | exemple Cricq du 24 octobre | `piece`, `surface`, `gravite` | Afficher la valeur conservée ; vérifier import, sauvegarde et export, voir [audit](source-audit.md#exemple-importé-et-modèles-éditoriaux-du-24-octobre) | corrigé et contrôlé localement ; deux sorties intégrées, recette hébergée à consigner |
| Relief sur cadastre | demande utilisateur | `terrain.analysis.samples`, tuiles IGN existantes | Neuf valeurs geolocalisees, extremes relatifs, emprise et tableau ; voir `../api/contexte-du-bien.md` | valide localement, qualification hebergee/tactile restante |
| Correction du repere | demande utilisateur | `cadastre.lon/lat`, `localisation.point_manuel` | Ajustement explicite, annulation, donnees derivees invalidees, notes conservees, reprise locale ; voir `../api/contexte-du-bien.md` | valide localement, qualification hebergee restante |
| Ressources du batiment (evolution 2) | demande utilisateur | `ressources_batiment`, liens manuels GoRenove/Pro'Reno | Sources/date/notes, URL validees, ancien brouillon compatible, rattachement caduc sans perte | prototype implemente, qualification hebergee restante ; voir `../api/ressources-batiment.md` |
| Phases activables (evolution 1) | demande utilisateur | `habitologie_protocoles[phase].enabled`, controles conserves | Sans indicateur : phase active ; desactivation/retablissement sans perte ; reprise et exports controles, 44 tests | valide localement, revue humaine et qualification hebergee restantes |
| Vues du contexte du bien | retour utilisateur du 14 septembre | Georisques, attributs GPU, neuf altitudes IGN, orientation manuelle | Synthese dans Site, relance, notes et exports ; 39 tests et build ; vues, reprise et apercu verifies | valide localement, qualification hebergee restante |
| Assistant multi-etapes | `Rapport_AVEREO_Pro.txt`, `frontend/src/App.jsx` | Donnees du rapport | Frontend Vite; navigation et reprise manuelles | conservee |
| Brouillon hors ligne | `App.jsx` | IndexedDB, `localStorage` | Mode local conserve; test de rechargement | conservee |
| Photos et camera | `App.jsx` | Fichiers, MediaDevices, data URLs | Frontend; taille bornee avant sauvegarde serveur | adaptee |
| Originaux prives des photos et versions annotees | demande du 12 novembre | Espace prive du dossier en ligne, acces CONNECT | Aucune implementation ; [cadrage en quatre phases](photos-originales-et-annotations.md) | prevue, a decider |
| Compression des nouvelles photos importees | demande du 12 novembre | Canvas du navigateur, data URLs JPEG | `photoCompression.js` isole et teste, non branche ; import inchange tant que les originaux prives ne sont pas conserves ; [regles et essais](compression-photos.md) | candidat isole, non active |
| Dictee vocale | `App.jsx` | Web Speech API | Frontend avec degradation gracieuse | conservee |
| Adresse et cadastre | `App.jsx` | BAN, API Carto IGN | Appels publics conserves; erreurs reseau gerees | conservee |
| Urbanisme et Geoportail | `App.jsx` | API Carto, Geoportail | Frontend; verification des liens | conservee |
| Rapport officiel des risques | `App.jsx` historique | Georisques, longitude et latitude | Bouton dans `Site`; URL validee par tests; ouverture du PDF officiel sans autre donnee du dossier | restauree |
| Synthese des risques | besoin Habitologie | Georisques V1 `resultats_rapport_risque`, longitude et latitude | Affichage dans `Site`; risques presents et statuts officiels; source, date et lien conserves dans le payload | integree, validee localement |
| Observations et protocoles | `App.jsx` | Donnees metier | Payload JSON du rapport; tests CRUD API | adaptee |
| Protocole Habitologie | besoin metier | Eau, Air, Terre, Feu et points de controle | Quatre phases dans `Protocoles`; observations groupees et rattachees; anciennes observations conservees dans `A classer` | integree, validee localement |
| Signature | `App.jsx` | Canvas/data URL | Frontend puis payload prive authentifie | adaptee |
| Apercu | `App.jsx` | HTML `srcDoc` | Iframe sandboxee sans permission et sans referrer | conservee |
| Export JSON | `App.jsx` | Blob | Frontend; import/export manuel | conservee |
| Export document | `reportDelivery.js`, `reportDocx.js` | DOCX avec images incorporées | Expert complet / client sélectionné ; Word natif et PDF contrôlés | intégré ; état hébergé dans le point de reprise |
| Sauvegarde en ligne | absente | PHP, PDO, MySQL | `/api/reports.php`, propriete utilisateur, CRUD | adaptee |
| Reouverture depuis la liste serveur | absente | PHP, MySQL | API existante et interface OnlineReports | livree en preproduction le 24 octobre, recette authentifiee restante |
| Authentification | absente | AVEREO CONNECT adosse a Drupal | ticket signe, cookie de sas, roles `utilisateur_rapport`/`administrateur_rapport` | adaptee |
| Mode technique local | absente | Jeton genere localement | `api_token`, ignore de Git, admin local temporaire | adaptee |
| Parcours CONNECT local reel | absent | CONNECT Docker, ticket HMAC, cookie de sas, MySQL Rapport | `gateway-up`, secret local ignore, vraie interface Rapport sur `127.0.0.1:8100` | adaptee |
| Catalogue de rapports simplifie | plusieurs categories visibles | `categorie`, `sous_categorie`, charge JSON existante | Deux categories visibles; type d'habitation pour Visite Globale; parcours d'analyse commun Eau, Air, Terre, Feu; modules complementaires masques | adapte, a valider |
| Ecoute client de Visite Globale | proposition de workflow | Objet `ecoute` dans le payload JSON existant | Section conditionnelle dans `Dossier`; saisie et dictee texte; accords photo/dictee; apercu et export Word | adaptee, validee localement |
| Entretien enrichi et suggestions | retour utilisateur | Champs ecoute, sujets explicites et choix manuels | Histoire du bien, travaux, besoin reformule et criteres de reussite ; aucun controle par defaut ; anciens choix preserves | implemente, a valider par l'utilisateur |
| Confirmation du lieu | retour utilisateur | Tuiles IGN WMTS / Leaflet, objet `localisation` | Cadastre sur plan ou vue aerienne ; confirmation datee, annulation et correction d'adresse ; aucune migration SQL | rendu et transitions valides localement, a qualifier en preproduction |
| Backend Node.js | absent | aucun | Aucun runtime Node.js en production | non integree |

Aucune fonctionnalite source n'est volontairement supprimee. La persistance serveur et l'authentification sont ajoutees sans retirer le brouillon hors ligne. La preversion reste utilisable sans OAuth avec les brouillons navigateur; la nouvelle interface de reouverture d’une copie serveur reste a qualifier en preproduction.

Le lien vers le rapport officiel Georisques conserve la fonction historique de
consultation. La synthese structuree, son horodatage et sa source sont
maintenant integres au dossier ; la confirmation ou le commentaire manuel des
risques reste a definir.

## 6 novembre 2026 — Navigation de compte

Mon espace remplace le bouton de déconnexion de l’en-tête ; le gestionnaire de sauvegarde est conservé. RGA garde son isolation et son cookie propre. [Règle et qualification](../../avereo-platform/docs/fonctionnalites-communes.md).

## 2026-11-06 — Identité des restitutions

Le PNG AVEREO est déplacé sans modification vers le socle partagé. Aucun changement
du schéma JSON, de la base ou des archives ; seuls les nouveaux exports utilisent
la source commune. [Contrat](../../avereo-platform/docs/identite-livrables.md).

## 2026-11-07 — Entreprise en formation

Les couvertures expert/client ajoutent le bloc commun d’entreprise ; le Word
natif conserve ces lignes groupées à 9 points. Aucun changement de schéma du
dossier. [Source et recette](../../avereo-platform/docs/identite-livrables.md).

## 7 novembre 2026 — Compatibilité des dossiers de mission

La génération décrite dans cette section concerne le dossier Rapport. Le candidat du 8 novembre retire cette action des surfaces RGA. Les points RGA, leurs préférences et le lien vers Rapport restent utilisables. [Périmètre des missions](../../avereo-platform/docs/protocole-missions.md#applications-qui-génèrent-des-missions).

Les champs client, adresse du logement, référence et date restent ceux du dossier. Les coordonnées complémentaires sont optionnelles et les anciens JSON restent lisibles. Aucun changement de table serveur. [Protocole](../../avereo-platform/docs/protocole-missions.md).

## 2026-11-08 — Présentation commune

Les actions communes réutilisent les handlers du rapport. Le point RGA reste distinct du dossier Rapport. [Matrice des actions](../../avereo-platform/docs/modele-affichage.md).

Dans l’éditeur, **Accueil** et **Mon compte → Mes projets** utilisent le même retour avec sauvegarde préalable du brouillon.

## 9 novembre 2026 — Liste en ligne

La liste et la recherche utilisent les mêmes règles de propriété que la lecture d’un dossier. La sélection conserve la confirmation avant remplacement du brouillon. [Parcours de recherche](../README.md#retrouver-un-rapport-en-ligne).

Le pied de page regroupe le menu du compte et les commandes entre étapes. La sauvegarde automatique du brouillon, l’export JSON et la sauvegarde en ligne conservent leurs parcours.

## Habilitations par organisation — candidat local

La migration des exports crée des tables de rattachement, de permission et de journal. Les dossiers existants conservent leur propriétaire. [Recette et retour arrière](../../../docs/administration-acces-exports.md).

Le correctif local du message d’interruption concerne le panneau React. Les dossiers, les droits et le journal existants restent compatibles. [Vérification](source-audit.md#interruption-du-téléchargement-délégué).

## 18 novembre — Correction de pagination des interventions

Correction ciblée livrée et qualifiée en préproduction : voir [le périmètre et la qualification](interventions-proposees.md#18-novembre--correction-de-pagination-des-interventions). Réserve levée après lecture native des deux Word et des 51 pages PDF ; textes, médias et propriétaire conservés. Revue humaine de la PR169 et production restent distinctes.

## 18 novembre — Fermeture de l’aperçu

Le [candidat local de fermeture](source-audit.md#fermeture-de-laperçu--candidat-local-du-18-novembre) utilise un dialogue natif au-dessus du bandeau commun. Aucun changement de données, sauvegarde, API ou restitution ; huit parcours expert/client et 246 tests réussis. Livraison hébergée distincte et non effectuée.


## 19 novembre — Planning par périodes

Mode optionnel sans dates, sans migration SQL, avec coordonnées explicites et import comme nouveau projet privé. Le calendrier existant, les droits et les données antérieures sont conservés. [Contrat, compatibilité, limites et recette](interventions-projet.md). Le contrôle hébergé reste distinct des tests locaux ; son résultat est enregistré dans le suivi canonique.
