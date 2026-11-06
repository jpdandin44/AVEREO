---
project: avereo-app-saisie-unique
document_type: phase-report
title: AVEREO UNI — développement local (lots L1 à L6)
status: draft
version: git
created: 2026-11-02
updated: 2026-11-06
owner: jpdandin
tags: [avereo, uni, phase-1, developpement-local]
---

# AVEREO UNI — développement local (lots L1 à L6)

## 1. Résultat

AVEREO UNI est l'application de saisie unique cadrée en phase 0 (docs/00-cadrage.md). Le dossier est renseigné une fois,
dans cinq onglets. Treize documents se pré-remplissent : le plan de financement, les attestations de travaux sur devis
et sur factures, les demandes d'avance et d'acompte, la synthèse du logement, la demande d'aide du propriétaire
occupant, le rapport de fin d'accompagnement, les engagements CEE, l'attestation d'exclusivité, les deux procurations et
le dossier par étape. L'outil gère aussi le suivi des dossiers, les plans Devis et Factures avec leurs écarts, et les
ratios de coûts.

Le développement s'est fait hors du dépôt, à la demande du responsable (02/11/2026), dans un dossier autonome du
poste. Il a été versé dans `frontend/` le 06/11/2026, sur son feu vert explicite. Les lots L1 à L6 du plan du cadrage
(§12) sont tous réalisés.

**Écart avec le circuit de revue.** Le suivi (`docs/suivi-chantier.json`) n'enregistre aucun événement de revue : la
phase 0 y reste « en cours » et la phase 1 « non démarrée ». Le responsable a autorisé ce versement sans l'événement
« start » de la phase 1. Les événements de revue restent à enregistrer par lui dans AVEREO Projet, avant la fusion.

L'application tient en un seul fichier HTML autonome. Elle s'ouvre d'un double-clic, sans installation ni serveur.
`npm run build` produit `frontend/dist/index.html` ; `npm run build -- --livrer` le copie aussi sous
`AVEREO UNI.html`, à la racine du sous-projet. Ces deux fichiers sont ignorés par git.

## 2. Commandes et résultats

Depuis le dossier `frontend/` :

| Commande | Rôle | Résultat du 06/11/2026 |
|---|---|---|
| `npm install` | installe React, esbuild et Playwright (versions exactes) | non exécutée ici : le registre npm n'était pas accessible depuis la session ; les mêmes versions étaient déjà installées |
| `npm test` | tests unitaires (testeur intégré de Node) | 39 tests, 39 réussis |
| `npm run build` | assemble `dist/index.html` (fichier unique, environ 380 Ko) | réussi |
| `npm run build -- --livrer` | assemble puis copie le fichier sous `../AVEREO UNI.html` | réussi |
| `npm run test:e2e` | assemble puis lance les tests d'écran dans Chromium (`npx playwright install chromium` au préalable) | 9 tests, 9 réussis |

`npm ci` n'a pas pu tourner : aucun fichier `package-lock.json` n'a été produit sans accès au registre. La première
commande `npm install` sur un poste connecté le crée ; il est à conserver ensuite.

Sur GitHub, le workflow `.github/workflows/ci-saisie-unique.yml` installe les dépendances et lance les tests
unitaires, l'assemblage et les tests d'écran. Il se déclenche à chaque modification du sous-projet.

## 3. Choix techniques

Les écarts avec les choix proposés au cadrage (§13) sont motivés ci-dessous.

- **Pile.** React 19.2.8 et esbuild 0.28.2. Les tests utilisent le testeur intégré de Node et Playwright 1.56. Le
  cadrage proposait les versions de Passeport Immo (React 18, Vite, Vitest, Zustand). Le registre npm étant
  inaccessible, seules les versions déjà installées sur le poste de travail étaient utilisables. Le passage à la pile du
  dépôt reste possible au versement : la logique (`src/lib`, `src/config`) ne dépend d'aucune de ces bibliothèques.
- **État.** Un magasin simple (`src/lib/store.js`, lu par `useSyncExternalStore`) remplace Zustand, sans dépendance.
- **Fichier unique.** L'assemblage injecte le CSS et le JavaScript dans `dist/index.html`. Une politique de sécurité
  interdit toute connexion réseau (`connect-src 'none'`) et tout chargement externe. Aucune donnée ne sort du poste.
- **Persistance.** Stockage local du navigateur, clé `avereo-uni-dossiers`. Le nom AVEREO UNI répond à la question
  Q01. Si des données enregistrées sont illisibles, elles sont mises de côté sous `avereo-uni-dossiers.illisible`, et
  l'outil le signale. Vider les données du navigateur efface les dossiers.
- **Sauvegarde.** « Exporter les dossiers », dans la liste, enregistre tous les dossiers dans un fichier JSON du poste
  (format `avereo-uni-sauvegarde`, version 1). « Importer une sauvegarde… » ajoute les dossiers du fichier sous de nouveaux
  identifiants, sans remplacer ni modifier ceux présents. Les paramètres du fichier ne sont pas appliqués. Un fichier
  illisible est refusé en entier. Aucun échange réseau : téléchargement et lecture de fichier restent locaux.
- **Polices.** Aucune police n'est chargée depuis un service tiers ; l'application utilise les polices du système,
  comme le repli prévu par la maquette. Les fichiers Montserrat et Source Sans 3 n'étaient pas disponibles sans réseau ;
  ils peuvent être embarqués ensuite (licence SIL Open Font).
- **Valeurs propres au poste.** Les listes qui nomment un acteur réel (origine du contact, programme, EPCI) et les
  paramètres de l'organisation sont lus dans `frontend/valeurs-locales.json`. Ce fichier est injecté à l'assemblage et
  exclu du dépôt par `.gitignore`. Sans lui, l'application prend les valeurs génériques du cadrage. Le modèle est
  `valeurs-locales.exemple.json`.
- **Configuration pilotée par les données.**
  - `src/config/champs.js` décrit 251 champs. Il est dérivé du catalogue de la phase 0, avec ses identifiants
    stables, figés par un instantané de test.
  - `src/config/documents.js` décrit les 13 aperçus : rubriques et intitulés de l'imprimé, plan lu, page de signature.
  - `src/config/ratios.js` porte la formule des ratios.
  - Aucun libellé de champ n'est écrit dans les composants.
- **Champs « à confirmer ».** Ils sont affichés avec un repère « à confirmer » et le numéro de leur question, pour que
  le partenaire les tranche en essayant l'outil. Ils ne comptent ni dans la progression ni dans les signalements.
  C'est un écart avec le cadrage, qui prévoyait de ne pas les reprendre avant la réponse.
- **Champ non repris.** L'identifiant et le mot de passe du dossier par étape ne sont jamais stockés (Q30).
- **Photos.** Les 21 emplacements d'images du rapport de fin ne sont pas enregistrés en V1 : l'aperçu le signale.
- **Plans Devis et Factures (E04).**
  - Les postes, la section Énergie et les montants du plan de financement sont portés par chaque plan (Q32).
  - « Figer au dépôt » demande une confirmation, fige le devis et crée le plan Factures par duplication.
  - Il propose ensuite, sans l'imposer, de renseigner la date de dépôt et le statut « Déposer » (valeur de la capture,
    Q10).
  - Les écarts se calculent par poste, appariés par identifiant, et au total.
- **Calculs.** Seulement des sommes, des écarts, des moyennes et des rapports simples, arrondis au centime. Le HT et
  le TTC sont saisis ; la TVA n'est pas calculée.
  - Prêts : éco-PTZ, autre prêt et prêts 1 à 3.
  - Subventions : toutes les aides et primes saisies.
  - Reste à charge : coût moins subventions.
  - Solde du projet : reste à charge moins prêts et apport.
  - La base du coût est le montant HT des dépenses, comme dans la maquette. Un paramètre permet de passer au TTC (Q13).
  - Le rapport de fin présente son plan final en TTC, comme le modèle.
- **Lignes du plan de financement officiel.**
  - La commune ou l'EPCI, le département et la région additionnent l'aide et la prime saisies.
  - Les lignes de la capture sans équivalent sur l'imprimé (MDPH, FAP, SLA, caisse de retraite, subventions sans nom,
    énergie primaire) sont comptées en « autre aide publique ».
  - Les primes CEE et les autres primes sont comptées en « autres aides » (Q04, Q11).
- **Progression (E09).** Elle compte les champs utilisés par au moins un document. Pour les postes, seuls l'intitulé et
  le montant HT comptent. Ne comptent pas les champs de suivi, les champs calculés, les champs « à confirmer » et ceux
  d'un autre type de dossier. L'état se lit par une couleur, un symbole et un texte.
- **Champs requis.** Pour les six documents prioritaires, ce sont ceux du catalogue. Pour les autres documents, la
  proposition est le nom du propriétaire et l'adresse du logement. S'y ajoutent la date pour les documents datés
  (demande d'aide, rapport de fin, engagements CEE, attestation d'exclusivité), l'entreprise pour l'attestation
  d'exclusivité et le mandataire pour les procurations (Q14).
- **Impression.** Le bouton « Imprimer » n'imprime que l'aperçu actif. La dernière page, celle de la signature,
  commence une nouvelle page (E10). La production de PDF ou de Word reste une piste.

## 4. Formule des ratios (E08)

Pour chaque poste dont la surface est renseignée et positive : prix au m² = montant du poste ÷ surface, pour le HT et
pour le TTC. La valeur affichée est la moyenne simple de ces prix, sur les postes du regroupement, tous dossiers
confondus. Les regroupements sont la catégorie de travaux et le matériau. Un poste sans surface est exclu de la moyenne
et compté à part. Le plan lu dans chaque dossier est le plan Factures quand le devis est figé, le plan Devis sinon.

## 5. Matrice de traçabilité

| Exigence | Statut | Réalisation | Tests |
|---|---|---|---|
| E01 Saisie unique alimentant les imprimés | implémentée | 13 aperçus pilotés par la configuration ; documents mis à jour signalés après chaque modification | T01 à T07, T14 |
| E02 Trois types de dossier, plan de financement commun | implémentée | type choisi par dossier ; champs filtrés par type ; plan commun | T15 |
| E03 Identifiant stable pour chaque champ | implémentée | identifiants du catalogue, liste figée par instantané | T12, T13 |
| E04 Plans Devis et Factures, gel au dépôt, duplication, écart, énergie | implémentée | « Figer au dépôt », plan Factures, écarts par poste et au total, section Énergie par plan | T09, T16, T17 |
| E05 HT et TTC du plan alimentés par l'onglet Travaux | implémentée | totaux calculés depuis les postes | T24 |
| E06 Matériau et entreprise dans Travaux | partielle | caractéristiques complètes par poste ; une entreprise par dossier (Q12) | T13, T14 |
| E07 Indicateurs énergétiques, gain de classes, date de fin de travaux | implémentée | section Énergie avant et après, gains calculés, date dans Projet | T13, T14 |
| E08 Ratios de coûts | implémentée | vue Ratios, formule en configuration | T10, T25 |
| E09 Onglets en haut, progression par couleurs | implémentée | cinq onglets, progression en couleur, symbole et texte | T23 |
| E10 Documents générés, dernière page signée à la main | partielle | aperçus imprimables, page de signature isolée ; pas de PDF ni de Word | T20 |
| E11 Libellés alignés sur les imprimés | partielle | rubriques et intitulés repris ; textes juridiques résumés ; éditions à confirmer (Q21) | T22 |
| E12 Suivi des dossiers | implémentée | liste filtrable, champs de suivi dans leur onglet, journal | T08, T16, T26 |
| Bandeau « Données fictives » permanent | implémentée | bandeau fixe sur toutes les vues | T21 |
| Persistance et montants saisis | implémentée | stockage local, sauvegarde dans un fichier, virgule et espaces acceptés | T18, T19 |

| Pièce du pack | Statut |
|---|---|
| Plan de financement (cerfa 13460*03) | implémentée (aperçu PF) |
| Demande d'aide propriétaire occupant (cerfa 12711*08) | implémentée (aperçu DAP) |
| Demande d'avance (cerfa 13934*05) | implémentée (aperçu AVA) |
| Demande de paiement d'acompte (cerfa 13467*02) | implémentée (aperçu ACO) |
| Procurations (cerfa 13462*01 et 13463*02) | implémentées (aperçus PRS et PRP) |
| Attestation d'exclusivité, engagements CEE | implémentées (aperçus EXC et CEE) |
| SRC-01 dossier par étape | implémentée (aperçu DPE), sans identifiant ni mot de passe (Q30) |
| SRC-02 classeur | partielle : formules de la feuille « PLAN FINAL » (T11) ; calculateurs de surfaces, scénarios et trésorerie non traités (Q29) |
| SRC-03 rapport de fin d'accompagnement | implémentée (aperçu RFA), photos non enregistrées |
| SRC-04 et SRC-05 attestations de travaux | implémentées (aperçus ATD et ATF) |
| SRC-06 à SRC-10 captures de l'interface actuelle | implémentées : champs de suivi dans leur onglet, listes recopiées |
| SRC-11 image | sans objet (aucun champ) |

## 6. Tests de référence

Les 26 tests de référence du cadrage (§12) sont couverts et réussis : 39 tests unitaires et 9 tests d'écran.

| Tests | Où |
|---|---|
| T01, T05, T06, T09 à T15, T17, T19, T22, T24 à T26 | `tests/unit/` |
| T02, T03, T04, T07, T08, T16, T18 | `tests/unit/` et `tests/e2e/` |
| T20, T21, T23 | `tests/e2e/` |

Les tests d'écran vérifient aussi la navigation des onglets au clavier, l'affichage mobile sans défilement horizontal,
l'absence de requête réseau et l'absence d'erreur dans la console.

## 7. Hypothèses à valider avec le partenaire

- Plusieurs libellés des captures ressemblent à la traduction automatique d'une interface en anglais :
  - « Taper » pour Type ;
  - « Fiançailles » pour Engagement ;
  - « Déposer », « S'engager » et « Abandonner » pour des statuts ;
  - « Alliances » pour les affectations.
  
  La valeur de programme visible sur la capture semble traduite de la même façon : le fichier local retient la forme
  d'origine supposée. Les libellés de la fiche gardent la capture entre guillemets ; le partenaire peut donner les
  termes d'origine (Q10, Q15).
- Les listes dont la capture ne montre pas les options restent en saisie libre, avec les valeurs connues proposées
  (Q09). Pour le niveau de ressources, ce sont les quatre catégories de l'Anah. Pour la TVA, les taux de 5,5, 10 et
  20 % et « Mixte ».
- Le nom, le prénom et la civilité du propriétaire sont séparés, comme sur les imprimés (Q17).
- L'application est contrôlée sous Chromium. Edge, qui utilise le même moteur, est à vérifier en recette, comme
  Firefox et Safari (Q33).

## 8. Recette locale

Assembler l'application (`npm run build -- --livrer` dans `frontend/`), puis ouvrir `AVEREO UNI.html` d'un
double-clic, dans Edge ou Chrome. Les colonnes « résultat obtenu », « date » et
« exécutant » sont remplies par le responsable.

| Id | Étapes | Résultat attendu | Résultat obtenu | Date | Exécutant |
|---|---|---|---|---|---|
| R01 | Ouvrir le fichier | Bandeau « Données fictives » ; liste avec le dossier d'exemple | | | |
| R02 | Ouvrir le dossier d'exemple ; modifier le nom du propriétaire | Les documents qui l'utilisent sont signalés « mis à jour » ; la valeur est surlignée dans l'aperçu | | | |
| R03 | « Simuler un changement d'avis du propriétaire » | Poste 2 à 8 100 € ; plan de financement : « Reste à financer : 1 300 € » ; avance inchangée à 3 000 € | | | |
| R04 | « Revenir au choix initial » | Plan équilibré ; le journal note « Retour au choix initial » | | | |
| R05 | Effacer la surface habitable (Énergie) et les observations (Administratif) | Synthèse du logement : « 2 à compléter » ; les autres documents prioritaires restent complets | | | |
| R06 | Financement : « Figer au dépôt… », confirmer | Plan Factures créé ; devis consultable sans modification ; proposition facultative de date et de statut | | | |
| R07 | Travaux, plan Factures : passer un poste de 6 800 € à 7 000 € | Écart du poste : + 200 € HT ; attestation sur factures mise à jour ; devis inchangé | | | |
| R08 | Créer un dossier de type Adaptation | Les champs propres au type Énergie (audit, indicateurs avant et après) disparaissent ; ceux de l'adaptation (niveau APA, invalidité, travaux handicap) apparaissent ; mêmes documents et même plan de financement | | | |
| R09 | Liste : filtrer par statut | Seuls les dossiers du statut choisi s'affichent | | | |
| R10 | Vue Ratios après saisie de surfaces | Prix moyens au m² par catégorie et par matériau ; postes sans surface comptés à part | | | |
| R11 | Fermer puis rouvrir le fichier | Dossiers et valeurs identiques | | | |
| R12 | « Imprimer » sur le plan de financement | Seul l'aperçu est imprimé ; la page de signature est isolée | | | |
| R13 | Naviguer dans les onglets avec Tab et les flèches | Focus visible ; les flèches changent d'onglet | | | |
| R14 | Affichage sur téléphone ou fenêtre étroite | Une colonne, sans défilement horizontal | | | |
| R15 | Liste : « Exporter les dossiers », puis « Importer une sauvegarde… » avec ce fichier dans un autre navigateur | Un fichier `avereo-uni-sauvegarde-AAAA-MM-JJ.json` est enregistré ; l'import ajoute ses dossiers en tête de liste sans remplacer ceux présents | | | |

## 9. Limites et validations humaines restantes

- La V1 fonctionne sur données fictives (bandeau permanent). L'usage de données réelles demande une décision
  d'hébergement et de conformité distincte.
- Les dossiers vivent dans le navigateur du poste. Vider ses données les efface : la sauvegarde dans un fichier, à faire
  régulièrement, est le seul moyen de les conserver ou de les transférer.
- Les événements de revue (phase 0 approuvée, phase 1 démarrée puis soumise) sont à enregistrer par le responsable
  dans AVEREO Projet. La fusion de la PR reste sa décision.
- Le fichier `frontend/valeurs-locales.json`, avec les valeurs propres au poste, n'est jamais versé (`.gitignore`).
  Sans lui, l'application prend les valeurs génériques du cadrage.
- Les 33 questions ouvertes du cadrage restent ouvertes ; cette phase n'en tranche aucune.
