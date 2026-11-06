---
project: avereo-app-rapport
document_type: source-audit
title: Audit de la source Rapport
status: active
version: git
created: 2026-07-13
updated: 2026-11-06
owner: jpdandin
tags:
  - rapport
  - audit
  - securite
---

## 2026-11-06 — Correctif RGA livré

Le seul fichier `rga/workspace.js` est remplacé après fusion de PR #122 et accord explicite. L’ouverture depuis la carte intégrée, la fermeture, la réouverture et le nouvel essai après rechargement complet sont vérifiés sur la préproduction. Les contrôles complets de conservation réussissent. [Livraison et recette](../../avereo-platform/docs/livraison-mon-espace.md).


## 2026-11-06 — Recette hébergée du menu et correction RGA locale

PR #121 est déployée. Le lien Mes projets de la page RGA ne réagit pas au fragment reçu après chargement de la carte intégrée. Le correctif local traite `hashchange`, conserve les autres paramètres et n’écrit aucune donnée de projet. Reproduction en échec puis 22 contrôles du menu réussis, compilation et revue du navigateur local effectuées. Il attend sa propre autorisation de livraison. [Livraison et réserves](../../avereo-platform/docs/livraison-mon-espace.md).


## 2026-11-04 — Révocation des comptes CONNECT

Le sas vérifie la date de révocation de la projection privée. Les écritures de dossiers utilisent le verrou partagé. Le contrôle d’identité et de propriété des dossiers est conservé. Aucun changement de payload ou de schéma Rapport.


## 2026-11-02 — Qualification locale des essais temporaires

La suspension CONNECT ne réévalue pas les cookies déjà délivrés aux applications. Un contrôle de politique privée est préparé dans les sas ; RGA doit conserver l’identité signée. Les essais HTTP isolés et leurs limites sont décrits dans le [contrat](essais-temporaires.md). Aucune preuve hébergée créée par ces essais.


## Plans et repères — candidat local du 2 novembre

Après fusion des PR #93 et #95 par le responsable, la branche de la PR #94 est
réalignée sur `main` (`a7fa3cb`). Le seul conflit porte sur `decisions.md` :
les décisions relatives aux repères et à l'application RGA distincte sont
toutes deux conservées. Les ajouts/retraits des onze fichiers de code de la
PR #94 sont identiques à ceux de son candidat initial `cee43b7` ; le code
de dictée, les droits RGA et les reprises Géorisques de `main` sont conservés.
Les 98 tests Node, 12 contrôles PHP des plans, 8 contrôles du sas RGA,
la syntaxe PHP, le build authentifié et le contrôle du socle passent.
Les recettes visuelles antérieures restent attachées au candidat initial ;
ce réalignement n'est pas une nouvelle recette hébergée ni un déploiement.

Images PNG/JPEG incorporées au dossier, sans URL distante, SVG actif ni publication des plans du Cricq dans les assets. Types, tailles, dimensions, identifiants et coordonnées sont bornés ; les références orphelines et doublons sont refusés explicitement. Le serveur vérifie aussi les octets et dimensions réels. Les contrôles de rôle et de propriété de `reports.php` restent inchangés. Le Word incorpore les repères au rendu dérivé ; la synthèse client filtre aussi les légendes. Les originaux et les dossiers hébergés ne sont pas modifiés. [Contrat et critères](reperage-observations.md).


## Saisie vocale et sauvegarde explicite — préproduction du 2 novembre

Après fusion de la PR RGA #92, la branche de la PR #93 est réalignée sur
`main` (`069e2c5`). Les trois conflits portent uniquement sur le changelog,
les exigences et cet audit ; les sections des deux lots sont conservées.
Les 86 tests Rapport, les 8 contrôles du sas RGA et les 17 contrôles HTTP
passent. Le build authentifié reproduit exactement le HTML et le JavaScript
du paquet RGA/dictée déjà livré ; quatre fichiers PHP ne diffèrent que par
les fins de ligne. Cette résolution ne remplace pas les preuves hébergées
du paquet installé et ne déclenche aucune nouvelle livraison.

Extraction du mécanisme SpeechRecognition existant vers `VoiceField.jsx` afin de le réutiliser dans la décision et les livrables. Aucune nouvelle bibliothèque, clé, intégration IA, permission accordée automatiquement ou configuration serveur. Les autorisations du navigateur et l'accord métier restent nécessaires. Seul le texte rejoint les champs du dossier ; aucun fichier audio n'est ajouté au rapport.

Le bouton d'attente appelle le stockage de brouillon existant, sans appel réseau de sauvegarde. Erreur de stockage simulée contrôlée sans fausse confirmation ; retrait de l'accord et démontage arrêtent le contrôleur. Un accès au microphone résolu tardivement ne relance pas un ancien contrôleur. Voix testée par simulation locale seulement ; matériel et service réel non qualifiés. Les essais hébergés du candidat conservent le contenu des deux maisons, hors horodatage de sauvegarde. [Spécification et réserves](aide-decision-demo.md#saisie-vocale-et-enregistrement-explicite-des-attentes).



Candidat fonctionnel `63ec279` installé sur [Rapport préproduction via CONNECT](https://connect-preprod.avereo.fr/?app=rapport), après accord explicite. Sauvegarde fraîche des 148 fichiers et de la configuration privée ; installation/restauration répétée sur copie privée, puis trois fichiers livrés et 147 fichiers préexistants conservés. Configuration inchangée, aucune migration ni écriture SQL de livraison. Les reçus sont rattachés à `finalisation20261102.exportInput20261102` dans le suivi canonique.

Tilleuls et Cricq : confirmation « Enregistrer cette attente », reprise après rechargement, sauvegarde/réouverture serveur et conservation de toutes les données métier contrôlées (seul `updatedAt` évolue). Quatre DOCX hébergés valides ; textes et médias des deux Tilleuls identiques à la présentation, synthèse client Cricq identique. L'expert Cricq reflète des modifications antérieures de localisation, risques, cadastre, terrain et urbanisme ; ses notes détaillées terrain/urbanisme ont été remplacées ou vidées avant cette installation. Copie récente préservée, arbitrage de contenu demandé au responsable. Les quatre fichiers de présentation restent inchangés. Brouillon initial du navigateur restauré exactement avant nouvel enregistrement local.

Microphone et service vocal réels à essayer avec le responsable ; les essais vocaux antérieurs sont simulés. Contrôles micro présents et cohérents avec l'accord enregistré, sans nouvel accord ni permission micro accordée par l'agent. Revue métier et validation humaine restent distinctes ; aucun merge ni production.

## 2026-11-02 — Candidat de droits RGA distincts

Sas RGA indépendant du sas Rapport, contrôles sur les composants cartographiques et tests HTTP réels avec données fictives. Le diagnostic Géorisques ci-dessous reste valable et ne décrit aucune correction API livrée. Les essais de ce candidat et la version hébergée sont distingués dans le [contrat RGA](../api/rga.md) et le suivi canonique.


## Diagnostic Géorisques du 2 novembre

Le contrôle réseau constate une coupure avant réponse dans le navigateur et
des résultats intermittents depuis le poste et o2switch. Le relais préparé
n'est pas retenu ni livré : son efficacité n'est pas établie. Aucun changement
d'authentification, de configuration, de données ou de code applicatif.
[Constats, limites et reprise](../api/georisques.md#diagnostic-de-disponibilité--2-novembre-2026).

Le complément local suivant ajoute des reprises bornées dans le client commun
et conserve les risques datés lors d'un échec au même point. Aucun relais PHP,
secret, permission, stockage ou flux de données externe supplémentaire. Les
tests distinguent interruption suivie d'un succès, échec persistant, réponse
invalide, quota, annulation et déplacement du bien. Les essais réels restent en
échec intermittent ; ne pas confondre ces contrôles simulés avec une correction
du fournisseur ou une livraison hébergée. [État actuel](../api/georisques.md#correctif-local-du-2-novembre--récupération-et-conservation).

## Lot RGA du 2 novembre

La correction de superposition réutilise les mêmes 97 fichiers, sans modifier
leurs géométries. Inverse Lambert-93 comparé à PROJ sur cinq points ; décodage
des anneaux et absence de mutation contrôlés. Leaflet est servi localement.
Les nouvelles tuiles de données ne transportent aucun contenu de dossier ; les
requêtes IGN portent seulement le secteur visible. La livraison incrémentale
vérifie le manifeste de la version précédemment installée avant sauvegarde.

100 fichiers source inventoriés, dont 97 données géographiques avec SHA-256 vérifié au build. Seules les pages PHP passent par le sas ; aucun dossier client dans les assets. Le résultat géométrique simplifié est distinct de Géorisques et du diagnostic. Transfert même origine/fenêtre/point, dates contrôlées et brouillon protégé par confirmation. `connect/gate.php` hébergé diffère du dépôt et reste hors du lot. [Contrat, sources et limites](../api/rga.md).

## Corrections du 1er novembre

Deux changements de présentation dans `App.jsx` : libellé de complétude avec rappel de revue métier et message conditionnel des deux accords. Les booléens d'autorisation, le calcul, la persistance, l'API et la génération Word restent identiques. Les sources privées des maisons conservent observations, images, annexes et écoute ; seuls l'analyse, les recommandations, le contexte urbanisme du Cricq et les marqueurs de calendrier sont préparés pour mise à jour. Aucun dossier privé ou renseignement personnel dans Git.

Après rétablissement des accès, la matrice locale des quatre accords et le rappel à 100 % réussissent. `9ce22fd` est livré après sauvegarde des 31 fichiers et de la configuration privée, avec installation/restauration répétée sur copie. Deux fichiers remplacés ou ajoutés, 30 conservés ; arbre de 32 fichiers et configuration vérifiés avant puis après les essais. Les trois ressources publiques correspondent aux empreintes attendues, les refus anonymes sont conservés et AVEREO reste en maintenance.

Les deux copies DEMO sont mises à jour par l'API existante après export serveur frais : seuls les quatre chemins Tilleuls et sept chemins Cricq prévus diffèrent. Réouverture serveur et JSON exactement attendus ; identifiants, écoute, accords, observations, photos et annexes conservés. Quatre DOCX téléchargés du générateur hébergé, 56 pages rendues et identiques aux préparations relues ; médias identiques. Aucun changement de schéma ou de configuration. La session de 30 minutes nécessite une relance CONNECT, contrôlée sans changement de droits ou de réglage. Les preuves du 30 octobre ci-dessous restent rattachées à `9a4f414`. [Reprise et limites](reprise-demo-philippe.md).

## Audit du lot aide à la décision du 30 octobre

Les données `decision` sont saisies par le professionnel ; aucun appel IA, nouvelle dépendance ni accès externe. Les valeurs sont échappées dans les deux restitutions. L’API accepte le bloc optionnel après contrôle de forme et de volume ; ses contrôles de propriétaire/organisation sont conservés. Les références absentes/ambiguës et incontournables omis sont signalés, sans supprimer les identifiants ni fabriquer un accord. Le JSON intégral garde les données même lorsque la catégorie technique masque la rubrique. Les cas privés et leurs photos restent hors Git. Voir les [critères de compatibilité](aide-decision-demo.md).

Contrôles du lot : 75 tests Node, 15 tests PHP, syntaxe API, build authentifié et CI réussis. Deux imports privés, modification puis conservation locale et JSON ; alerte d’omission constatée à l’écran. Le candidat `9a4f414` est ensuite livré en préproduction : sauvegarde de 28 fichiers et configuration privée, restauration répétée sur copie, six fichiers contrôlés. Deux nouvelles copies de démonstration sont sauvées et rouvertes par la liste serveur ; toutes les données importées sont conservées après la modification volontaire de calendrier. Word expert 17/26 pages, client 5/7 pages rendus et contrôlés. La livraison n’écrit pas en base ; la recette crée les deux copies attendues. Le script privé de livraison est adapté à Python 3.6 avant toute installation. Configuration, OAuth et production restent inchangés. La recette avec un second compte et la revue métier restent distinctes.


## Intégration des livrables du 24 octobre

L'écart d'affichage des listes importées est corrigé : la valeur conservée est
ajoutée aux options, sans reclassement. Les deux restitutions consomment le même
payload. Les images externes et schémas inconnus sont rejetés à l'export ; seules
les images bitmap data URI sont incorporées. Aucun appel IA ou document externe.
Les photographies/risques/Ubakus du Cricq restent dans le JSON privé, pas dans le
bundle commun. API, configuration privée et droits inchangés. Le catalogue
pédagogique tiers conserve les crédits ; diffusion commerciale plus large à vérifier.
Les réserves de recette hébergée restent dans le point de reprise.

# Audit de la source Rapport

## Exemple importé et modèles éditoriaux du 24 octobre

Deux modèles locaux ont été préparés pour revue, sans changement du code ni
intégration au générateur. La recette locale Cricq révèle un écart de présentation :
les listes `piece`, `surface` et `gravite` ne représentent pas les valeurs libres
importées. « Non qualifiée » est conservé en JSON et dans le Word natif, mais
le sélecteur affiche « Mineure ». La correction doit préserver la donnée et
ne pas déduire une sévérité. Voir les preuves et la suite dans le
[point de reprise](reprise-demo-philippe.md#prochaine-action-exacte).

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


## Source et integrite

- Archive recue : `architecture-v1/avereo-app-rapport.zip` (exclue de Git).
- SHA-256 : `A54889BD6A11E58ADD977034970EA0BD39A591AD96098318D1E517FBDBFF27BF`.
- Contenu : 6 065 entrees, 70 242 196 octets decompressed.
- Chemins absolus, traversants ou hors destination : aucun.
- Source historique : `Rapport_AVEREO_Pro.txt`.
- Extraction d'audit : `.codex-imports/rapport-gemini-source` (exclue de Git).

Le ZIP est un snapshot AVEREO deja prepare, et non un export Google AI Studio brut. Il contient 6 018 fichiers sous `frontend/node_modules/` ainsi qu'un build `frontend/dist/`; ces fichiers ne sont pas importes. Le `frontend/src/App.jsx` du ZIP est identique au frontend de travail au debut de cette mission.

## Architecture initiale

- React 18, Vite 7 et JavaScript JSX apres mise a niveau de la chaine de build.
- Aucun backend Node.js, Firebase, Supabase ou service serverless.
- Stockage des brouillons dans IndexedDB avec repli `localStorage`.
- Appels navigateur directs vers BAN, API Carto IGN et Geoportail.
- Export JSON et document bureautique genere dans le navigateur.
- Aucun hook `preinstall`, `install`, `postinstall` ou `prepare` dans `package.json`.

## Constats

### Relief visuel sur fond cadastral

Les altitudes auparavant affichees seulement en grille sont maintenant
placees sur la carte aux coordonnees mesurees. Valeurs validees et libelles
de grille controles avant insertion dans les etiquettes ; ancien lieu et
donnees incompletes refuses. Pas de nouveau fournisseur, schema, secret,
dependance ou estimation hydraulique. Calcul et exports existants inchanges.
Recette et limites : [contexte du bien](../api/contexte-du-bien.md#altitudes-sur-le-fond-cadastral).

### Correction du point de visite

Le repere fixe ne permettait pas de corriger un geocodage decale. Le frontend
propose maintenant un ajustement explicite, sans modification implicite de
l'adresse ni perte des notes/photos. Les donnees de l'ancien point sont
invalidees ; un compteur de recherche ignore les retours obsoletes. Aucun
changement d'authentification, secret, base, fournisseur ou deploiement.
La procedure, les controles realises et limites sont centralises dans
[le contexte du bien](../api/contexte-du-bien.md#correction-manuelle-du-point-de-visite).

### Evolution 2 — ressources du batiment

Demande complementaire du 15 septembre : ouverture directe du bien, puis
report explicite par l'utilisateur qui confirme l'absence d'accord GoRenove.
Les acces actuels sont conserves. Aucun changement du code ni appel au
service de redirection RNB. Constat et conditions de reprise centralises dans
[`../api/ressources-batiment.md`](../api/ressources-batiment.md).

Perimetre : frontend Rapport uniquement, aucune modification de secret,
authentification, base ou deploiement. Liens ouverts sur action, routes HTTPS
et domaines autorises, parametres inutiles retires, notes echappees dans le
document. Aucun ID de batiment ou choix typologique automatique. Les anciennes
associations sont marquees a verifier apres modification du lieu sans perte
des notes. Donnees, risques, rollback et limites :
[`../api/ressources-batiment.md`](../api/ressources-batiment.md).

### Evolutions precedentes

Evolution 1 du 15 septembre : etat reversible par phase, conservation des
choix et de toutes les observations/photos, sans nouvel appel reseau ni
secret. Perimetre limite au frontend Rapport et a sa documentation. Le payload
conserve `enabled` et les controles ; aucune migration ni modification API.
Les exclusions sont affichees dans l'apercu et l'export. Une ancienne version
anterieure a ce lot ne comprend pas `enabled` : ne pas y reexporter un dossier
en supposant ses exclusions respectees. Conserver son JSON avant un retour
arriere. La recette et ses limites sont centralisees dans le
[workflow](../workflows/workflow-habitologie.md#recette-de-levolution-1).

Lot du 14 septembre : correction du bouton de risques qui ouvrait uniquement
le rapport externe et de la disparition silencieuse du bloc sans resultat.
Ajout des vues urbanisme et relief/orientation, erreurs explicites, reprise
JSON defensive et liens documentaires limites a HTTPS sans identifiants.
39 tests et build final passent ; vues, reprise du brouillon et apercu
verifies localement. Le controle a aussi corrige deux commandes de dictee
de l'etape Export non verrouillees sans accord pour Visite Globale.
Ni interpretation juridique automatique ni simulation des eaux pluviales.
Limites de qualification : voir [le bilan du lot](../api/contexte-du-bien.md).

| Niveau | Fichier/zone | Constat et impact | Correction | Statut |
| --- | --- | --- | --- | --- |
| IMPORTANT | ZIP, `frontend/node_modules/` et `frontend/dist/` | Dependances et build fournis dans la source, non reproductibles et trop volumineux pour Git. | Exclusion; installation par `npm ci`; build par Vite. | corrige |
| IMPORTANT | `frontend/src/App.jsx`, stockage des brouillons | Des donnees personnelles, photos et signatures peuvent rester dans le navigateur. | Mode hors ligne conserve et documente; persistance serveur authentifiee ajoutee; aucun jeton n'est persiste par le frontend. | mitige |
| IMPORTANT | `frontend/src/App.jsx`, import JSON | La source ne fixe pas une limite serveur et accepte des donnees utilisateur. | Limites cote frontend et API, controle de taille du corps et validation JSON. | corrige |
| IMPORTANT | `frontend/src/App.jsx`, apercu `srcDoc` | Des URLs d'images importees sont reinserees dans l'apercu; le cadre n'est pas sandboxe. | `iframe` sandboxee sans permission et politique `no-referrer`. | corrige |
| IMPORTANT | `frontend/src/App.jsx`, appels BAN/IGN | Dependances externes appelees directement par le navigateur, avec disponibilite et CORS hors controle. | Conservees pour le fonctionnement; documentees; proxy PHP a envisager si les conditions d'usage l'exigent. | accepte |
| IMPORTANT | `frontend/src/App.jsx`, rapport Georisques | Le bouton de rapport des risques de la source historique avait ete omis pendant la migration statique de juillet 2026. | Lien officiel retabli apres validation des coordonnees; seuls longitude et latitude sont transmis; tests unitaires ajoutes. | corrige |
| IMPORTANT | `frontend/src/App.jsx`, synthese Georisques | La consultation externe ne presentait pas les risques dans l'assistant et la recherche echouait entierement lorsqu'aucune parcelle n'etait retournee. | Endpoint JSON V1 public appele avec les seules coordonnees; synthese sourcee et horodatee; cadastre rendu non bloquant; indisponibilite explicite. | valide localement, a qualifier en environnement heberge |
| AMELIORATION | `frontend/src/reportClassification.js`, catalogue | Les categories historiques surchargeaient le choix de creation et Eau, Air, Terre, Feu avaient ete modelises a tort comme sous-categories exclusives. | Deux categories restent selectionnables; Visite Globale utilise le type d'habitation et affiche les quatre dimensions comme parcours ordonne commun; les modules historiques restent masques sans suppression. | a valider |
| AMELIORATION | `frontend/src/App.jsx`, `Visite Globale` | La phase `Ecoute` et ses accords etaient documentes mais absents du parcours fonctionnel. | Section conditionnelle ajoutee dans `Dossier`; donnees incluses dans le payload et le Word; photos et dictee bloquees sans leur accord. | valide localement, a qualifier via CONNECT |
| AMELIORATION | `frontend/src/App.jsx`, protocole Habitologie | Le fil Eau, Air, Terre, Feu etait informatif mais ne guidait ni les controles ni le classement des observations. | Points de controle par phase, observations rattachees et anciennes observations preservees dans `A classer`; export Word aligne. | valide localement, a qualifier via CONNECT |
| AMELIORATION | `frontend/package.json` | La source ne definissait aucun test unitaire frontend. | La suite `node:test` couvre notamment le catalogue visible, les modules masques, la preservation de Reception, la normalisation et les migrations des prototypes; le lint et les tests de composants restent a definir dans la strategie globale. | mitige |
| INFORMATION | `Rapport_AVEREO_Pro.txt` | La source historique presente un encodage mojibake. | La refonte JSX corrige l'affichage et reste la cible. | corrige |
| INFORMATION | `frontend/package.json` | Vite 5 exposait des alertes de dependances de developpement. | Passage a Vite 7 et plugin React 5. Au 11 septembre 2026, `npm audit --omit=dev` est sans alerte; l'audit complet signale `browserslist` et `baseline-browser-mapping`, a traiter en dette non bloquante. | mitige |
| IMPORTANT | `frontend/public/api/`, mode local | Une faute de mode aurait pu activer le jeton administrateur hors local. | Modes stricts; `api_token` exige `environment=local` et un hote `.localhost`. | corrige |
| IMPORTANT | `frontend/public/api/`, schema | Le schema ne doit pas etre cree par le compte runtime. | DDL retire de l'API; migration versionnee appliquee separement. | corrige |
| IMPORTANT | `frontend/src/App.jsx`, export | Une source image importee pouvait etre interpolee dans le document HTML. | Seules les images `data:` bitmap conformes sont integrees; les autres valeurs sont echappees ou ignorees. | corrige |
| IMPORTANT | Entree publique Rapport | L'OAuth Rapport seul permettait de contourner le portail CONNECT. | `index.php`, l'OAuth applicatif et l'API metier exigent un cookie issu d'un ticket CONNECT HMAC court et a usage unique; seul le healthcheck reste public. | a qualifier en preproduction |
| IMPORTANT | Routage Apache des assets | O2Switch reecrivait les fichiers JS/CSS vers `index.html`, produisant une page blanche avec `nosniff`. | Exclusion explicite de `assets`, `api`, `auth` et `connect` avant le fallback SPA. | valide en preproduction |
| IMPORTANT | Qualification locale CONNECT | Le catalogue Docker ouvrait une page Rapport simulee et ne qualifiait donc ni le vrai sas, ni le frontend, ni l'API Rapport. | Mode `gateway-up` propre a Rapport, secret local ignore, surcharge Compose limitee a Rapport et restauration explicite du placeholder. | corrige |
| IMPORTANT | Cookie du sas local | Le cookie et la redirection imposaient HTTPS meme sur `127.0.0.1`, rendant la vraie application inaccessible depuis CONNECT Docker. | HTTP local et cookie non-`Secure` autorises uniquement avec `environment=local`; HTTPS et `Secure` restent obligatoires hors local. | corrige |

## Controle des secrets

### Qualification du lot ecoute et localisation des 12 et 13 septembre

- Les nouveaux choix de protocole sont vides ; les sujets explicites de
  l'ecoute suggerent des controles, les choix manuels restant prioritaires.
  Les anciens booleens sont preserves. Aucun texte client n'est transmis a
  un modele IA ni utilise pour une inference automatique.
- La carte IGN charge uniquement les tuiles du secteur consulte, avec
  `referrerPolicy: no-referrer` : ni nom, ni email, ni notes. Le service
  externe recoit la requete reseau du navigateur et peut en deduire le secteur.
  Leaflet est livre localement, sans script tiers charge depuis un CDN.
- Les confirmations besoin/lieu sont des mentions de travail, pas des
  signatures electroniques. Leur modification invalide la confirmation liee.
- L'ancien fond noir est resolu dans l'integration directe : plan, parcelles
  et photographies aeriennes observes dans le navigateur integre sur un lieu
  public nantais. La parcelle peut rester absente du resultat API Carto meme
  lorsque les tuiles cadastrales sont visibles : aucune reference n'est inventee.
  Restent a qualifier : hebergement et coupure reseau pendant une visite.
- Audit npm : aucune vulnerabilite de production ; les deux alertes de
  developpement deja referencees dans DT-RAP-09 restent hors perimetre.
- Aucun changement d'authentification, de secret, de base ou de workflow de
  deploiement dans ce lot.

Aucune cle Gemini/Google, cle Firebase/Supabase, cle privee, valeur de mot de passe ou jeton reel n'a ete detecte dans les fichiers applicatifs audites. Les references `secrets.*` des workflows sont des noms de secrets GitHub, pas leurs valeurs.

## Ecart d'instructions resolu

Les anciens `AGENTS.md` applicatif et plateforme imposaient une V1 statique sans backend ni MySQL. Le proprietaire a confirme le 13 juillet 2026 l'evolution d'architecture. Les instructions ont ete adaptees pour autoriser l'API PHP, MySQL, OAuth et le gateway HTTP local tout en conservant l'isolation applicative.

## 6 novembre 2026 — Menu de compte commun

L’en-tête Rapport réutilise le menu et conserve la sauvegarde avant déconnexion. RGA autonome reçoit le même menu et une sortie qui expire seulement le cookie RGA ; la carte intégrée masque le menu redondant.

Le périmètre transverse est demandé explicitement par le responsable. [Contrat commun](../../avereo-platform/docs/fonctionnalites-communes.md) et [preuve du lot](../../avereo-platform/docs/qualification-mon-espace.md). Aucune migration, modification de secret ou de droit ; tests sur données fictives.

## 6 novembre 2026 — Extension de PR #121

Mes projets revient à la liste native avec sauvegarde du brouillon avant sortie. Les préférences proposent le format expert/client pour les nouveaux rapports uniquement. RGA conserve ses points repérés et ses réglages dans des espaces de stockage locaux distincts de Rapport ; les résultats de risque sont consultés à nouveau à l’ouverture.

Les contrôles actualisés sont dans la [qualification transversale](../../avereo-platform/docs/qualification-mon-espace.md). Les preuves précédentes restent attachées à leur candidat.

## 2026-11-06 — Identité du livrable

Raccordement au nom et au logo officiels partagés, demandé transversalement par le
responsable. Les contenus, protocoles, calculs, dossiers et accès restent inchangés.
[Contrat et preuves locales](../../avereo-platform/docs/identite-livrables.md).
