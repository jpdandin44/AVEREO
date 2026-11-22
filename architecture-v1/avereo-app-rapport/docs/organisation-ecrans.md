---
project: avereo-app-rapport
document_type: design-proposal
title: Organisation progressive des écrans Rapport
status: active
version: git
created: 2026-11-16
updated: 2026-11-16
owner: jpdandin
tags: [rapport, ergonomie, dossier, observations, export, cadrage]
---

# Organisation progressive des écrans Rapport

## Cadrage

Le responsable demande une proposition avant de lancer les modifications. Il
choisit le contenu et la disposition des écrans, avec les questions de l’écoute
dans Dossier, les observations et les interventions d’Export repliables. Les deux
captures fournies illustrent les groupes de questions et le volet existant
« Informations sur la vue ». Elles servent de références visuelles ; elles ne
constituent pas des instructions supplémentaires.

**Organisation et ouvertures par défaut validées par le responsable le 16 novembre.**
Il demande explicitement le développement de Dossier, Observations et Export en
conservant toutes les fonctions existantes. Le candidat local a ensuite été testé
et fusionné par le responsable ; sa demande distincte de livraison préproduction
est exécutée et vérifiée ci-dessous. Aucun accord de production. Source de pilotage :
`rapportV12CadrageProfils20261112.affichageEcrans20261116` dans le
[suivi canonique](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>).

### État observé avant réalisation — PR161

- Dossier rend les trois groupes `LISTENING_SECTIONS` entièrement ouverts.
- Observations possède déjà une vue compacte globale pour réorganiser ; elle
  replie tous les corps de fiche ensemble, sans ouverture individuelle.
- Les titres de groupe Terrain/Bâti et les contrôles de déplacement existent.
- Les informations d’une vue de plan utilisent déjà `details/summary`.
- Export possède déjà des volets pour l’aide à la décision ; les interventions
  restent toutes développées dans `InterventionsPanel.jsx`.

Sources inspectées : `frontend/src/App.jsx`, `InterventionsPanel.jsx` et
`ObservationPlans.jsx`, version PR161 fusionnée `97a902c`. Les sept documents de
livraison/recette déjà modifiés localement sont conservés. Le présent cadrage ne
requalifie ni la recette hébergée ni une future version.

### Principe commun retenu

Afficher une ligne de résumé utile et ouvrir les champs sur demande. Le repli
agit seulement sur la présentation ; il ne retire aucun contenu du dossier ou
des livrables. Le résumé reprend des données déjà saisies et des compteurs
explicites ; aucune synthèse automatique ou appréciation métier n’est inventée.

Les résumés distinguent « renseigné », « à renseigner » et une confirmation
réellement recueillie. Un champ rempli ou une section fermée ne signifie jamais
« validé ». Les erreurs bloquantes, alertes et exclusions client restent visibles
en résumé ; accéder à l’élément concerné ouvre la bonne section.

Les actions de sauvegarde et leurs états réels restent accessibles. Le brouillon
local et la copie serveur gardent leurs libellés et leurs portées distincts.

### Dossier

Organisation proposée :

1. Un résumé de mission : référence, profil, habitation, date et adresse ; ouvrir
   « Mission et coordonnées » pour modifier les champs existants.
2. Les accords photo et dictée, visibles sous une forme compacte et modifiables
   sans changer leur portée ou les fonctions qu’ils autorisent.
3. Écoute client : trois sections ouvrables indépendamment, avec les questions,
   aides et commandes de dictée actuelles dans leur contenu ouvert.
4. Les sujets identifiés ensemble dans un volet distinct, avec les sujets déjà
   cochés en résumé.

Les trois temps de l’écoute restent « Comprendre son histoire », « Explorer le
vécu quotidien » et « Reformuler et prioriser ensemble ». Le dernier conserve
les quatre champs, la confirmation explicite du besoin et son prérequis actuel.
Son résumé signale une confirmation restant à recueillir.

À la première création, ouvrir les informations nécessaires et le premier temps
d’écoute. À la consultation d’un dossier existant, commencer par les résumés.
Plusieurs sections peuvent rester ouvertes pour comparer les réponses ; ouvrir
la suivante ne referme pas automatiquement celle en cours.

### Observations

Conserver les groupes Terrain puis Bâti Eau/Air/Terre/Feu et À classer, ainsi que
les numéros T1/T2… et les numéros indépendants du bâti. Chaque observation devient
une fiche repliable individuellement.

La ligne fermée montre le numéro, le titre, la zone si elle est renseignée, le
nombre de photos, les vues portant un repère et la gravité telle que saisie.
Les fonctions de réorganisation restent utilisables dans la même phase : poignée
de déplacement, numéro et solution accessible Monter/Descendre. Leur présentation
précise sera ajustée lors de l’implémentation sans changer leurs règles.

La fiche ouverte conserve phase/point du protocole, titre, pièce/zone, élément,
gravité, localisation, **Constat → Explications → Conseils habitologue**, liens,
photos, caméra et préparation de la photo. Regrouper les champs courts sur deux
colonnes au plus ; donner la largeur utile aux textes. Les photos restent des
vignettes ouvrables pour consulter/préparer une image.

Présenter « Plans et repérage » dans un volet avec nombre de vues et repères ;
garder l’éditeur actuel et son volet « Informations sur la vue ». Un accès depuis
un repère doit ouvrir la fiche et la vue nécessaires. Aucune nouvelle capture,
transformation du fond cadastral ou renumérotation implicite.

Les fiches existantes sont repliées à l’arrivée ; une nouvelle observation
s’ouvre automatiquement. « Tout replier » et « Tout déplier » agissent sur les
fiches de l’écran, sans masquer les intitulés des phases. Éviter d’empiler des
volets supplémentaires à l’intérieur de chaque fiche.

### Export

Ordre de lecture proposé :

1. Attentes et aide à la décision : réutiliser les rubriques 1–3 existantes,
   l’écoute, les notes, attentes, provenance et liens.
2. Analyse de l’expert et Recommandations, accessibles dans une section ouvrable.
3. Interventions proposées, avec les lignes de résumé visibles et tous leurs
   corps repliés initialement.
4. Contrôle final et signature ; les blocages et alertes restent signalés même
   lorsque les champs détaillés sont fermés.
5. Destinataire, options du livrable, aperçu, génération Word et dossier JSON
   complet : commandes identifiables dans la zone de sortie. Import et copie de
   test restent accessibles comme fonctions secondaires explicitement nommées.

Chaque ligne d’intervention montre intitulé, nature, priorité/horizon renseignés,
numéros des constats et attentes reliés, ainsi que son statut client réel. Une
case d’inclusion cochée ne suffit pas à afficher « retenue » si le filtrage actuel
exclut un de ses constats. L’avertissement correspondant reste visible.

L’ouverture retrouve tous les champs existants : intitulé, nature, références,
priorité, horizon, modalités, préalables, justification, sélection client et
suppression. « Tout replier / Tout déplier » agit sur les interventions ; un ajout
ouvre immédiatement la nouvelle fiche. Ne pas ajouter de date/durée calculée.

Le profil Habitologue conserve le masquage des projections 4–6 ; les autres profils
et leurs contenus historiques restent dans leur périmètre actuel.

### Règles d’interaction et disposition

- Même flèche et même geste d’ouverture sur les trois écrans ; usage au clavier,
  tactile et avec lecteur d’écran, état ouvert/fermé explicite.
- Plusieurs fiches peuvent rester ouvertes. Conserver le choix d’ouverture durant
  la navigation du dossier dans la session ; ne pas ajouter cette présentation
  aux données métier serveur.
- Deux colonnes au maximum pour les champs courts sur ordinateur ; une colonne
  sur petit écran. Ne pas réduire la taille des textes pour gagner de la place.
- Garder le fil conducteur de Protocoles horizontal et la navigation actuelle.
- Ne pas fermer automatiquement une zone de dictée, photo ou édition active.
  Préserver les saisies et le tracé de signature à tout repli/dépli.
- Le repli ne vaut ni sauvegarde ni validation. Ne pas réinitialiser un champ,
  perdre un fichier, changer un lien ou exclure du contenu lors d’un repli.
- Les données et livrables dépendent du dossier, jamais de l’état ouvert/fermé.
  Aucun impact attendu sur les droits, le propriétaire, le schéma JSON ou l’API.

### Périmètre accepté et revue suivante

Premier lot recommandé : Dossier, Observations et Export selon les règles
ci-dessus. Site et Protocoles restent disponibles avec leur organisation actuelle.
Une harmonisation de leurs détails secondaires pourra être cadrée ensuite.

Organisation, ordre dans Export et ouvertures par défaut acceptés explicitement.
Les résumés et la disposition ont été testés localement par le responsable avant
fusion ; la revue de l’affichage hébergé reste distincte. Les nouveaux profils,
Projet/Gantt, originaux privés et PDF direct restent leurs lots propres.

Critères proposés pour la future recette : conservation exacte des champs/liaisons,
ordre et numéros, réorganisation dans une phase, photos/plans/signature et dictée ;
navigation entre onglets avec saisie en cours ; réouverture locale et serveur ;
Word expert/client et JSON indépendants des volets ; états d’erreur accessibles,
clavier et absence de débordement sur écran étroit. Les contrôles compareront les
contenus, pas seulement l’apparence.

## Développement local

Candidat réalisé dans `C:/Users/examg/Documents local/avereo-rapport-affichage`,
branche `feat/rapport-affichage`, base PR161 fusionnée `97a902c`. Huit documents
locaux antérieurs repris à l’identique avant modification ; la copie source et
ses preuves restent conservées. Aucun fichier hors de l’application modifié dans
ce candidat.

### Composants et conservation

`ScreenDisclosure.jsx` fournit des volets avec boutons clavier, résumés, ouverture
individuelle et commandes globales. `ScreenPresentation` conserve uniquement en
mémoire du wizard les états d’ouverture par identifiant stable ; les enfants
restent montés sous `hidden`. Un import réinitialise ce contexte, la création est
explicitement distinguée d’une reprise/import, et un ajout n’entraîne pas le repli
de la fiche précédente. Aucun champ de présentation dans le payload ou le serveur.

`App.jsx` organise mission/écoute, fiches d’observation, plans et Export. Les
contrôles de numéro, Monter/Descendre et poignée restent utilisables repliés ; les
liens plans/fiches ouvrent les zones nécessaires. Les champs courts sont sur deux
colonnes au plus et se replient sur une colonne. `ObservationPlans.jsx` conserve
l’éditeur et sélectionne une vue repérée lors de Localiser. `InterventionsPanel.jsx`
réutilise `clientInterventions` pour son statut client réel, conserve tous ses
champs et ouvre chaque nouvel ajout. Résumés des longs textes abrégés à l’écran,
valeurs intégrales conservées dans les champs et restitutions.

Une dictée active ou un traitement signalé empêche le repli de la section ;
l’utilisateur reçoit un message et peut arrêter l’opération. Les accords et outils
actuels restent en place. Le contrôle simulé a révélé le raccord sans espace de
la dictée Dossier ; `appendDictation`, déjà commun, est désormais utilisé pour
cet ajout sans écraser la saisie. Aucun microphone réel sollicité par la recette.

Le canevas de signature attend une dimension visible et se redessine lors de son
ouverture via `ResizeObserver` ; un volet initialement fermé ne produit pas un
canevas nul. Le tracé reste dans la propriété existante. Alertes toujours visibles,
liens des points bloquants ouvrant la bonne zone ; JSON complet/Aperçu/Word restent
accessibles hors des volets secondaires.

API PHP, stockage, droits/propriété, modèles, ordre et moteurs Word inchangés.
Interventions utilise la même liste et le même filtrage ; aucune réactivation des
projections 4–6 pour Habitologue. Site, Protocoles, fil horizontal et navigation
restent dans leur périmètre actuel.

### Qualification effectuée

216 tests Node ; 29 contrôles PHP décision, 13 plans et téléchargement complet ;
deux builds (hors ligne/authentifié), 150 fichiers chacun. Les 38 contrôles du
script HTTP/PHP/MariaDB local passent : identités fictives, vrais stockage et
migration, nouvelle session, copie indépendante et refus croisés. Ces contrôles
locaux ne prouvent pas le CONNECT hébergé. Aucun script de lint JSX défini.

Navigateur sur dossier fictif complet : replis individuels/globaux et clavier,
choix conservés entre onglets, ajout/suppression sans toucher les lignes restantes,
glisser-déposer Terrain et retour par Monter, repères vers fiches et Localiser,
éditeur photo/rectangle/annulation, erreur de signataire accessible section fermée,
signature existante et nouveau tracé conservés. Nouvelle création : mission,
première écoute et observation initiale ouvertes ; seconde observation ajoutée
ouverte sans fermer la première. Dictée simulée : texte manuel conservé, séparation
corrigée et repli individuel/global refusé pendant l’écoute, puis autorisé à l’arrêt.

Écrans Dossier/Observations/Export inspectés à 390 pixels ; Export également à 320,
sans débordement de page dans ces états. Réglage de largeur rétabli. Cette preuve
ne remplace pas un appareil mobile physique ou un test de caméra/microphone réels.

Le JSON complet est exactement identique après les seuls replis ; les essais
restituent tous les champs métier, avec seulement l’horodatage normal du brouillon
après rechargement de développement. Word expert replié/déplié : XML de contenu
équivalent après résolution des identifiants générés par la bibliothèque, mêmes
cibles de liens et octets des neuf images. Word client : huit images, intervention
retenue présente, chauffage exclu et notes internes absents. URL des modalités
conservée comme texte, sans ajout d’un nouveau mécanisme de lien. Aucune nouvelle
lecture native Word/PDF ; les moteurs de restitution ne changent pas.

Copie indépendante **RECETTE-AFFICHAGE-INTERFACE-20261116**, deux sauvegardes sur le
même identifiant ; déconnexion locale normale, nouvel onglet, connexion fictive A
et Reprendre désactivé. Téléchargement/ouverture serveur : octets bruts exacts et
payload UI entier identique, 14 observations/quatre photos/quatre plans/signature,
trois interventions. Dossier source inchangé. Brouillon initial local restauré
dans les quatre emplacements et relu à l’identique après rechargement.

[Reçu de qualification](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-affichage-20261116/verification-finale-locale.json>) ·
[Replis et Word](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-affichage-20261116/integrite-replis.json>) ·
[Restaurer le brouillon — preuve](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-affichage-20261116/restauration-brouillon.json>).

### Revue locale

Référence de la revue acceptée avant fusion ; la version courante est maintenant
livrée en préproduction dans la section suivante.

[Ouvrir les comptes fictifs](http://127.0.0.1:5197/fixture/) → Compte fictif A →
rechercher **RECETTE-AFFICHAGE-INTERFACE-20261116** dans la liste serveur → Ouvrir
le dossier → Dossier, Observations, Export. Ne pas utiliser Reprendre pour cette
revue : il conserve le brouillon initial restauré. Le service et la base sont
temporaires ; ils doivent rester actifs. Pour relancer depuis la racine application :
`python -X utf8 tests/report-files-http.py --fixture .local/affichage-recette.json --receipt .local/verification-http.json --serve --port 5197`.
PHP, Docker/MariaDB et dépendances Node déjà installés sont requis ; la fixture
fictive de revue reste locale et n’est pas publiée.

La revue locale et les quatre cases PR ont ensuite été validées par le responsable. Réserve préexistante
PHP des objets vides/listes distincte ; aucun nouveau droit, compte, schéma, secret,
activation d’originaux privés, autre lot ou changement hébergé.

## Préproduction

**PR162 livrée et alignée le 16 novembre**, après tests déclarés OK et demande
explicite du responsable. Quatre cases humaines relues cochées, policy stricte et
CI réussies. Fusion f4017bec7ee448e7de71edf0b03d9cdada9e93af et candidat
b04ea2bbfda79f091b3a6685ee6871ee83ee4806 : arbre f36b2e2 identique.
Archive qualifiée de 150 fichiers promue sans reconstruction, SHA-256
f7c8a9734055aedba65bd435f4cc6fc381baf964e81d59ef0e4fdb2928a4a007.

Cible [Rapport préproduction](https://rapport-preprod.avereo.fr/) via CONNECT ;
racine réelle et base isolée vérifiées. Quatre fichiers installés : CSS
index-4HiXtcYQ, JS index-JfJGoweD, module Word reportDocx-B7-bOQwq et index HTML en
dernier. Sauvegarde fraîche application/configuration relue, restauration et
rollback code répétés sur copie indépendante ; sauvegarde privée de la table
relue sans restauration SQL. Les variantes partagées préexistantes et les seules
différences de fins de ligne sont conservées hors de ce périmètre.

208 fichiers préexistants conservés ; **24 dossiers/toutes colonnes/propriétaires
exacts** à l’installation puis après navigation. Configuration, production,
journal et schéma inchangés ; aucun compte/droit, original privé ou dossier
serveur créé/modifié. Trois ressources HTTPS exactes et refus anonymes racine/API
attendus. Connexion normale CONNECT renouvelée sans intervention utilisateur.

Dossier fictif complet importé localement : Dossier, Observations et Export,
replis individuels/globaux, accès Localiser et fiche, signature redessinée sans
perte, trois interventions et statut client réel contrôlés. JSON métier exact :
14 observations, quatre photos (trois d’observations et une de contexte), quatre
plans, signature et trois interventions. Seul le lien serveur source est retiré
normalement par l’import ; ce n’est pas une perte de contenu. Word expert/client
hébergés identiques aux références en textes, cibles de liens et octets des
images : neuf médias expert, huit client. Filtres client inchangés.
Brouillon initial restauré dans les quatre emplacements, relu après rechargement
et comparé à sa sauvegarde privée indépendante.

[Reçu final](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr162-preprod-20261116/verification-finale.json>) ·
[Livraison](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr162-preprod-20261116/delivery.json>) ·
[Récupération](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr162-preprod-20261116/recovery.json>) ·
[Conservation après navigation](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr162-preprod-20261116/verification.json>) ·
[Word](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr162-preprod-20261116/verification-word-preproduction.json>) ·
[Brouillon restauré](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-pr162-preprod-20261116/restauration-brouillon.json>).

Recette dédiée de nouvelle sauvegarde et réouverture serveur dans une nouvelle
session **non effectuée lors de cette livraison** ; les recettes antérieures
gardent leur portée. Revue métier hébergée distincte. Pas de nouvelle lecture
native/pagination Word/PDF, microphone/caméra réels ou appareil mobile physique.
Réserve PHP objet vide/liste préexistante séparée. Aucun obstacle restant dans le
périmètre livré. Les preuves de PR161 et sa recette Interventions sont conservées
dans le [dossier précédent](interventions-proposees.md#recette-complète-du-16-novembre).

## Mise en production

Non engagée et non autorisée. Prochaine action : revue de l’affichage en
préproduction ; tout prochain lot et sa portée restent à confirmer.
