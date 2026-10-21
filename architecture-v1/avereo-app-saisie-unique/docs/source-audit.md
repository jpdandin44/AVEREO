---
project: avereo-app-saisie-unique
document_type: source-audit
title: Audit source de la maquette Saisie unique
status: draft
version: git
created: 2026-10-21
updated: 2026-10-21
owner: jpdandin
tags: [avereo, audit, phase-0]
---

# Audit source de la maquette Saisie unique

Phase 0 — Cadrage. Cet audit relève ce que la maquette utilise (dépendances externes, API du navigateur), ce qu'elle ne
fait pas et ce que son code fait autrement que sa description. Il suit le gabarit officiel (`docs/source-audit.md`
de `architecture-v1/avereo-platform/templates/app-template/`, qui ne contient qu'un titre) et renvoie au cadrage
([00-cadrage.md](00-cadrage.md)) pour les écarts et les questions. Les constats citent le numéro de ligne du fichier HTML
de la maquette ou la section de son PDF de description. Les lignes sont celles du fichier lu en phase 0 (500 lignes) ;
aucun code de la maquette n'est recopié dans le dépôt.

## 1. Sources auditées

| Source | Nature | Lecture |
|---|---|---|
| Maquette, fichier HTML | page unique, 500 lignes, styles et script en ligne (script : lignes 176 à 498) | lue en entier |
| Maquette, PDF de description détaillée | 17 pages, version du 17/10/2026, données fictives | lu en entier |

## 2. Structure du code à reprendre

La maquette est pilotée par des données. La phase 1 en reprend la structure et la logique, pas le style.

| Élément | Ligne | Rôle |
|---|---|---|
| `GROUPS` | 181 | six groupes de la fiche : cinq avec des champs fixes (15 au total), un avec la liste des postes |
| `LABELS`, `MONEY` | 204-205 | libellés abrégés des champs et marquage des champs monétaires, déduits de `GROUPS` |
| `base()` | 209 | exemple fictif de départ (valeurs de référence du cadrage) |
| état `S`, `journal`, `lastEntry`, `changed`, `variant`, `nextId` | 222 | état en mémoire de la page |
| `esc`, `num`, `eur`, `now` | 226-231 | échappement HTML, lecture des montants, formatage en euros, heure du journal |
| `record` | 280-290 | écriture au journal et regroupement des frappes |
| `ctx`, `dd`, `kv`, `computed` | 293-306 | repérage des champs manquants (« À compléter ») |
| `dAttestation`, `dFinancement`, `dAvance`, `dSynthese` | 326-376 | un générateur par document |
| `DOCS` | 377 | quatre documents, chacun avec sa liste `uses` de champs |
| `renderJournal` | 430-440 | journal replié, 12 entrées |
| écouteurs d'événements | 443-493 | saisie, ajout et suppression d'un poste, scénario, rétablissement, onglets au clavier |

## 3. Dépendances externes

Une seule : les polices.

| Dépendance | Lignes | Détail |
|---|---|---|
| Google Fonts | 4 à 6 | deux `preconnect` (domaines de la feuille de style et des fichiers de polices) et une feuille de style pour Montserrat (graisses 500 à 800) et Source Sans 3 (graisses 400 à 700) |

Constats :

- Aucune bibliothèque de script, image externe, cadre incorporé (`iframe`), URI `data:` ni appel réseau applicatif :
  le seul script est celui de la page (ligne 176).
- Les polices système servent de secours (lignes 17 et 18) : la page reste lisible si le service tiers est injoignable.
- Chaque affichage de la page envoie à ce service tiers l'adresse IP et les informations du navigateur de l'utilisateur.
  Les données du dossier restent dans la page, mais l'affirmation « aucune donnée n'est envoyée sur le réseau » ne vaut
  que si les polices sont embarquées. Le PDF indique lui-même que seules les polices sont chargées depuis Google Fonts
  (section « Données et fonctionnement »). Proposition en phase 1 : embarquer les deux familles (cadrage, §13).

## 4. API du navigateur utilisées

| API | Lignes | Usage |
|---|---|---|
| `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })`, 0 à 2 décimales | 228 | affichage des montants à la française |
| `Date#toLocaleDateString('fr-FR')` | 208 | date du jour pré-remplie (JJ/MM/AAAA) |
| `Date#toLocaleTimeString('fr-FR', ...)` | 231 | heure du journal (HH:MM:SS) |
| `Date.now()` | 281 | horodatage du regroupement des frappes |
| `Set` | 222, 288, 480 | ensemble des clés modifiées |
| `Array#findIndex`, `Array#filter`, `Array#splice`, `Array#slice` | 461 et suivantes | gestion de la liste des postes et du journal |
| `Element#closest` | 485 | clic sur un onglet |
| `addEventListener` (`input`, `click`, `keydown`) | 443 à 488 | événements délégués |
| `Element#focus` | 459, 492 | focus sur l'intitulé du nouveau poste, sur l'onglet actif |
| `<details>` | 169, 439 | journal repliable, état ouvert conservé au rendu |
| ARIA : `aria-live="polite"`, rôles `tablist`, `tab`, `tabpanel`, `aria-selected` | 166-168, 394, 406 | annonce vocale de la dernière modification, onglets des documents |
| `inputmode` | 242-243 | clavier numérique ou décimal sur mobile |
| CSS : `prefers-color-scheme` | 20 | thème sombre automatique |
| CSS : `prefers-reduced-motion` | 140 | animations réduites sur demande |
| CSS : `position: sticky`, grille, `text-wrap: balance`, `font-variant-numeric` | 45, 97, 136 | colonne de droite fixe, titres équilibrés (propriété ignorée par un navigateur plus ancien) |
| Requêtes de média de largeur (560, 640, 1000 px) | 71, 81, 90, 97, 103, 117 | empilement des colonnes, onglets sur deux lignes |

Non utilisées : `localStorage`, `sessionStorage`, IndexedDB, cookies, `fetch`, `XMLHttpRequest`, WebSocket, `navigator`,
presse-papiers, impression, `window.open`, `eval`, `document.write`, gestionnaires `onclick` en ligne.

## 5. Insertion de HTML

Le code construit le HTML par concaténation de chaînes et l'assigne à `innerHTML` (lignes 257, 274, 394, 408, 413, 421,
425 et 439). Les valeurs saisies passent par `esc` (ligne 226), qui remplace `&`, `<`, `>`, `"` et `'` : relevé par lecture
des huit affectations et des quatorze appels à `esc(` des générateurs de documents, sans test automatique. En phase 1,
React échappe par défaut ; aucun `dangerouslySetInnerHTML` n'est à reprendre.

## 6. Comportements du code qui diffèrent de la description

| Sujet | PDF | Code | Conséquence en phase 1 |
|---|---|---|---|
| Poste visé par le scénario | « le poste n° 2 de la liste » (section « Comportement du scénario ») | le poste dont l'identifiant vaut 2 (ligne 467), pas celui qui occupe la deuxième position ; s'il n'existe pas, il est recréé avec l'identifiant 2 à la deuxième position (ligne 468, juste après) | le scénario de référence reste celui du poste 2 de l'exemple ; l'écart est testé (T03, T05) |
| Retour au choix initial | « remet l'intitulé et le montant d'origine » | réaffecte les valeurs d'origine de l'exemple (ligne 469), pas l'état précédant le clic : une saisie faite entre-temps sur ce poste est perdue | conforme à la description ; ce n'est pas une fonction « annuler » |
| Valeurs du scénario inchangées | « seules les valeurs qui diffèrent sont modifiées et inscrites au journal » | aucune entrée de journal quand rien ne diffère, mais le bouton change de libellé (lignes 474 et 475) | à garder (T04) |
| Taille du journal | « 12 dernières entrées » | le tableau `journal` n'est pas borné ; seul l'affichage prend 12 entrées (ligne 434) | borne à décider en phase 1 (le journal doit survivre au rechargement avec le dossier) |
| Regroupement des frappes | « moins de 2,5 secondes » | seuil de 2 500 ms, même champ, source manuelle, entrée à un seul élément (ligne 282) ; les ajouts et suppressions de poste ne se regroupent pas | conforme (T08) |
| Total des postes | « se recalcule à chaque frappe » | somme des montants lus par `num` (ligne 227) | voir ci-dessous |

Lecture des montants (`num`, ligne 227) : espaces (simples, insécables, fines) retirés, première virgule remplacée par un
point, `parseFloat`, valeur non finie ramenée à 0. Cas relevés en exécutant la fonction :

- `12 400,50` est lu 12 400,50 : conforme à la description ;
- `12.400,50` est lu 12,4 (le point est pris pour une virgule décimale) : erreur silencieuse ;
- `-500` est accepté ; `1e3` est lu 1 000 ; un texte quelconque est lu 0, sans signalement ;
- `12 400 €` est lu 12 400 (la lecture s'arrête au symbole).

L'écart d'équilibre est arrondi au centime (`Math.round((total - financement) * 100) / 100`, ligne 335).

Formatage (`eur`, ligne 229) : en exécutant `Intl.NumberFormat`, 12 400 € est rendu avec une espace fine insécable (U+202F)
entre « 12 » et « 400 » et une espace insécable (U+00A0) avant « € ». Les messages de référence du prompt
(`! Reste à financer : 1 300 €`) s'écrivent avec des espaces ordinaires : les tests de la phase 1 normalisent les espaces
avant de comparer.

Clavier des onglets (lignes 488 à 493) : flèches gauche et droite seulement, avec retour circulaire ; ni `Début`, ni
`Fin`, et aucun `tabindex` itinérant (tous les onglets restent atteignables par `Tab`).

## 7. Limites connues

| Limite | Source | Traitement en phase 1 |
|---|---|---|
| Un seul dossier à la fois, aucune persistance : fermer ou recharger la page efface tout | PDF, « Données et fonctionnement » | liste de dossiers et `localStorage` (L1, L3) |
| Aucun calcul d'aide, de taux ni de plafond ; aucun contrôle du format (année, surface, date), ni de l'avance par rapport au coût | PDF, « Contrôles et signalements » | inchangé ; contrôles de format en piste (question Q19) |
| Les dates des documents sont du texte libre pré-rempli avec la date du jour | PDF, « La fiche unique » ; ligne 208 | champ de type date dans la configuration |
| Pas d'export, pas d'impression, pas de lien avec un service en ligne ni avec les autres outils AVEREO | PDF, « Limites » | inchangé ; production de PDF en piste |
| Observations du conseiller recopiées telles quelles (texte libre non généré) | PDF, « Limites » | inchangé ; texte enrichi en piste (question Q20) |
| Contrôlée sous Chromium seulement, en largeur d'ordinateur et de mobile ; autres navigateurs « à confirmer » | PDF, « Données et fonctionnement » | question Q33 |
| Thème sombre automatique non testé sur les documents | ligne 20 | à vérifier en recette locale |
| Polices chargées depuis un service tiers | lignes 4 à 6 | proposition d'embarquement (cadrage, §13) |
| Aucun test automatique | fichier unique, sans fichier de test | Vitest en phase 1 (T01 à T26) |
| La description signale des champs, intitulés, base HT ou TTC, signature et plafond d'avance « à confirmer » | PDF, « À CONFIRMER » | intitulés alignés sur les imprimés du pack (T22) ; HT et TTC saisis (cadrage, point 6) ; signature et plafond hors périmètre |
| Les quatre documents sont illustratifs : leurs champs et intitulés ne reprennent pas les imprimés officiels ; la synthèse du logement n'a pas d'imprimé | PDF, « Les quatre documents pré-remplis » | cadrage §8.8 |

## 8. Détail d'affichage du journal

Le PDF (section « Limites : ce que la maquette n'est pas ») signale que, dans le journal, un trait de séparation apparaît
aussi entre les lignes de détail d'une même entrée, sans conséquence pour la démonstration, à corriger si la maquette
est conservée.

Cause relevée au code :

- la feuille de style pose un filet supérieur sur chaque `li` du journal (ligne 136, règle `.journal li`) ;
- le gabarit d'une entrée (lignes 435 à 437) imbrique une liste `ul` de lignes de détail, elle-même composée de `li`, dans le
  `li` de l'entrée ;
- la règle s'applique donc aussi aux `li` imbriqués, d'où le trait entre les lignes de détail.

À ne pas reproduire en phase 1 : le filet ne doit s'appliquer qu'aux entrées du journal. Le point est repris dans la
recette locale (affichage du journal après un changement d'avis).

## 9. Ce que la phase 1 reprend et ce qu'elle ne reprend pas

Reprise : la structure pilotée par les données (champs, documents et leurs listes `uses`), les règles de signalement
par document, le regroupement des frappes, les quatre messages d'équilibre, le scénario de changement d'avis et le
retour à l'exemple, les messages et valeurs de référence, les formats à la française, l'accessibilité (onglets au
clavier, zones tactiles de 44 px, focus visible, mouvements réduits, annonce de la dernière modification).

Non reprise : le chargement des polices depuis un service tiers, la concaténation de HTML, la lecture permissive des
montants (la lecture reste tolérante à la virgule et aux espaces, mais un format ambigu comme `12.400,50` doit être
signalé), le journal non borné.

## 10. Inconnues

- La version exacte des navigateurs de la recette (question Q33).
- Le comportement du thème sombre sur les documents (non vérifié).
- Les mots de passe, aucun n'est stocké : la maquette n'en demande pas (question Q30 pour le dossier par étape du pack).
