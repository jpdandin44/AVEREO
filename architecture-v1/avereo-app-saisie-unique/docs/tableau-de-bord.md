---
project: avereo-app-saisie-unique
document_type: tableau-de-bord
title: AVEREO – Saisie unique
status: active
version: git
created: 2026-10-21
updated: 2026-10-21
owner: jpdandin
tags: [suivi, saisie-unique, genere]
---

# AVEREO – Saisie unique

Vue générée depuis `suivi-chantier.json`. Ne pas modifier manuellement.
La revue et les décisions se font dans [Projet local](http://127.0.0.1:5191/).

<!-- BEGIN GENERATED: suivi-chantier.json -->
Mise à jour : **2026-10-21**. **0 phase livrée sur 4 ; 0 phase validée par le responsable.**

| Phase | Statut | Livrables | Livraison | Validation humaine |
|---|---|---|---|---|
| 0 — Cadrage | En cours | [00-cadrage.md](00-cadrage.md)<br>[00-catalogue-champs.md](00-catalogue-champs.md)<br>[source-audit.md](source-audit.md)<br>[acces-suivi-local.md](acces-suivi-local.md) | — | Non acquise |
| 1 — Développement local | Non commencée | `01-developpement-local.md` (prévu) | — | Non acquise |
| 2 — Préproduction | Non commencée | `02-preproduction.md` (prévu) | — | Non acquise |
| 3 — Mise en production | Non commencée | `03-mise-en-production.md` (prévu) | — | Non acquise |

### Décisions attendues

Aucune décision en attente.

### Décisions enregistrées

| ID | Décision | Date | Référence de preuve |
|---|---|---|---|

### Questions de vérification

| ID | Question | Impact | Prochaine action |
|---|---|---|---|
| Q01 | Le responsable confirme-t-il les cinq variables du kit (slug « saisie-unique », nom « AVEREO Saisie unique », port de revue 5191, dossier d'import « .codex-imports/saisie-unique ») ? Elles ont été appliquées par défaut, sans confirmation explicite. | Nom du sous-projet, port du lanceur de revue et clé de stockage navigateur de la phase 1 (« avereo-saisie-unique-dossiers ») en dépendent ; un changement après la revue oblige à renommer le sous-projet. | Confirmer ou corriger lors de la revue de la phase 0. |
| Q02 | Quel est le chemin absolu du générateur de tableau de bord mutualisé sur le poste du responsable ? Le fichier ignoré par Git « .local/review-settings.json » a été créé dans la session en nuage avec un chemin qui n'existe pas sur ce poste. | Sans ce chemin local, « actualiser-tableau-de-bord.py » s'arrête sur le poste du responsable et les vues générées ne peuvent pas y être regénérées ni contrôlées. | Écrire « .local/review-settings.json » sur le poste avec le chemin local du générateur (modèle dans docs/acces-suivi-local.md), puis lancer le script et son option --check. |
| Q03 | Les champs de logement saisis dans l'onglet Énergie de l'interface actuelle (surface habitable, année de construction, numéro d'identification fiscale, numéro AE) et les champs de la maquette sans équivalent sur les captures (énergie de chauffage, lettre énergie actuelle) sont-ils communs aux trois types de dossier, ou propres au type Énergie ? De même, le bénéficiaire distinct du propriétaire relève-t-il de l'adaptation ? | La règle arrêtée (Énergie = champs communs + onglet Énergie ; Adaptation et Insalubrité = champs communs + champs d'adaptation) ne tranche pas ces champs : leur colonne « types » reste « à confirmer » et le test « les champs d'un type sont ceux du catalogue » ne peut pas les couvrir. | Trancher champ par champ dans la revue ; la phase 1 applique l'affectation retenue. |
| Q04 | À quels types de dossier appartiennent les lignes du plan de financement et du suivi dont le sens ou le rattachement n'est pas fixé par la règle des types : travaux énergie, travaux d'habitat indigne, autres travaux, ligne « énergie primaire », ligne « subventions » au libellé incomplet, subventions FAP et SLA, subvention de caisse de retraite (une seule ligne sur la capture, deux sur l'imprimé officiel) ? | Ces champs restent « à confirmer » dans le catalogue ; ils ne sont pas repris en phase 1 tant que leur type et leur sens ne sont pas connus. | Demander au partenaire la signification de ces lignes et leur type de dossier ; mettre à jour le catalogue. |
| Q05 | Le plan de financement vaut pour les trois types de dossier, mais deux lignes sont des lignes d'adaptation d'après la règle arrêtée (travaux handicap, subvention de la MDPH). Ces lignes sont-elles visibles seulement pour Adaptation et Insalubrité, tout en gardant un plan identique pour le reste ? | Le test « les trois types partagent le même plan de financement » ne peut s'écrire qu'une fois ce point tranché : sinon il contredirait l'affectation des lignes d'adaptation. | Confirmer la lecture retenue : même plan, avec lignes d'adaptation affichées pour Adaptation et Insalubrité seulement. |
| Q06 | Le pack ne contient aucun formulaire propre à l'insalubrité. Que doit produire l'outil pour un dossier de type Insalubrité : les documents communs seulement, comme le prévoit le cadrage arrêté ? | Aucun document propre à ce type ne sera produit en phase 1 ; si le partenaire utilise un imprimé spécifique, il doit être fourni pour entrer dans le catalogue. | Confirmer qu'aucun imprimé propre à l'insalubrité n'est attendu, ou demander l'imprimé au partenaire. |
| Q07 | Les captures proposent dix types de projet (petite et grande lutte contre l'habitat indigne, énergie, handicap, mixtes, décence, traitement d'urgence, fonds de solidarité, règlement sanitaire) alors que le cadrage retient trois types de dossier. Comment relier la liste fine de la capture aux trois types, et la nature des travaux souhaités de l'imprimé de demande d'aide ? | Le champ « type de projet » est repris comme liste de choix sans lien avec les trois types ; sans règle de correspondance, le type de dossier et le type de projet peuvent se contredire dans un même dossier. | Décider si une correspondance est nécessaire ; sinon garder deux champs indépendants (c'est le défaut retenu). |
| Q08 | Les valeurs de listes qui désignent le partenaire, un programme, une collectivité ou un dispositif réel ont été remplacées par des valeurs génériques : « le partenaire », « Espace conseil public », « Programme A », « Territoire A ». Ces valeurs génériques conviennent-elles pour la V1 ? La correspondance avec les valeurs réelles figure uniquement dans le compte rendu de fin de phase. | La V1 est publique et sur données fictives : seules des valeurs génériques peuvent y figurer ; une valeur réelle exigerait une décision d'hébergement et de conformité. | Valider les valeurs génériques ou en proposer d'autres. |
| Q09 | Les options de plusieurs listes ne sont pas visibles sur les captures (cause d'abandon, programme, niveau de ressources, origine socio-économique, EPCI, types de prêt, travail, localisation, TVA, matériau) : quelles sont leurs valeurs ? | Ces listes entrent dans la configuration avec une seule valeur connue ou vides ; l'ajout des options se fera par lignes de configuration, sans changement de code. | Fournir des captures avec chaque liste déroulée, ou une liste des valeurs sous forme générique. |
| Q10 | La liste des statuts de la capture propose « Déposer » (verbe), alors que le cadrage arrêté parle d'un passage à « Déposé ». Quel libellé retenir pour l'action « Figer au dépôt » ? | Le libellé recopié de la capture est « Déposer » ; l'action « Figer au dépôt » proposera ce statut tant que le choix n'est pas confirmé. | Confirmer « Déposer » (libellé de la capture) ou demander « Déposé ». |
| Q11 | La maquette saisit un seul total d'aides et un seul prêt, alors que la capture, l'imprimé officiel et le classeur détaillent les aides par financeur et les prêts (éco-PTZ, autre prêt, trois prêts typés). La fiche garde-t-elle un total saisi, le détail, ou le détail avec un total qui s'y substitue ? | Les valeurs de référence de la maquette (aides 4 500 €, prêt 5 900 €) ne portent que sur les totaux ; sans règle, une saisie détaillée et un total saisi peuvent se compter deux fois dans le total financé. | Retenir une règle (proposition : le total saisi sert tant qu'aucune ligne de détail n'est renseignée, puis la somme des lignes) et la tester en L4. |
| Q12 | Une entreprise par dossier (maquette) ou une entreprise par poste (classeur, tableau de l'imprimé de demande d'acompte jusqu'à quatre entreprises) ? | Les champs entreprise, devis et SIRET sont catalogués au niveau du poste et du dossier ; la demande d'avance et la demande d'acompte ne se pré-remplissent pas de la même façon dans les deux cas. | Confirmer le niveau retenu avant le lot L3. |
| Q13 | Quelles sont les formules des champs calculés des captures et des imprimés (gains en pourcentage, pourcentage de travaux exécutés, totaux et reste à charge de l'interface actuelle, travaux éligibles) ? Le cadrage limite les calculs aux sommes, écarts et moyennes ; un pourcentage est un quotient. | Les champs concernés (gain énergétique en %, gain GES en %, pourcentage de travaux exécutés, totaux des captures) restent « à confirmer » ; seuls les écarts, les sommes et les ratios de E08 sont calculés en phase 1. | Décider quels quotients entrent en V1 ou les reporter comme pistes. |
| Q14 | Quels champs sont requis par chaque imprimé officiel prioritaire ? Les PDF ne marquent aucun champ obligatoire. La proposition retenue étend les règles de la maquette aux imprimés officiels et laisse le montant TTC des postes non requis, pour que les valeurs de référence de la maquette (un montant par poste) restent des cas de test valides. | Le test de couverture des documents s'appuie sur la colonne « requis par » du catalogue ; une exigence plus large obligerait à compléter les données d'exemple. | Valider la colonne « requis par » du catalogue ou la corriger. |
| Q15 | Plusieurs libellés ou comportements des captures sont ambigus : « Taper » (type ?), « Fiançailles », « LOC1 à LOC3 » et « Détails LOC », première date des lignes Avance et Comptes, « Projet communal » (commune du projet ou projet porté par la commune), « FAP », « SLA », « Énergie primaire », « N° AE », « CD de subvention », « Prime CR », libellé « subventions » incomplet, lettres « C » affichées avec un degré, tranches d'année qui se chevauchent, unités des valeurs d'énergie et de GES non affichées, identité possible entre la date de dépôt du dossier et la date de la demande de subvention. Quel est le sens de chacun ? | Ces champs sont catalogués « à confirmer » ou avec un libellé provisoire ; une mauvaise lecture fausserait les imprimés qu'ils alimentent. | Obtenir le sens de chaque libellé auprès du partenaire. |
| Q16 | L'année de construction est-elle saisie comme année exacte (maquette, imprimé de demande d'aide) ou comme tranche (capture de l'onglet Énergie) ? | Le catalogue prévoit deux champs (année exacte et période de construction) tant que ce point n'est pas tranché ; la synthèse du logement exige l'année exacte. | Choisir un seul champ ou garder les deux. |
| Q17 | Le nom et le prénom du propriétaire sont-ils saisis séparément ? La maquette n'a qu'un champ « nom », la capture un champ « nom et prénom », les imprimés officiels deux champs séparés et une civilité. | Le catalogue sépare civilité, nom et prénom (champs pour les imprimés) ; un champ unique obligerait à découper le texte pour les imprimés. | Confirmer la séparation proposée. |
| Q18 | Où saisir la raison sociale et le SIRET de l'organisation accompagnatrice, pré-imprimés dans les modèles d'attestation ? Ces valeurs sont communes à tous les dossiers et ne peuvent pas figurer dans le dépôt public. | Ces deux champs sont catalogués hors dossier (paramètres) ; sans décision, les attestations affichent « À compléter » pour ces lignes. | Décider si ces paramètres se saisissent une fois dans l'interface (stockage navigateur) ou dans chaque dossier. |
| Q19 | Faut-il contrôler le format du SIRET ? Les modèles d'attestation demandent « 13 chiffres », alors qu'un SIRET en compte 14 ; la maquette ne contrôle aucun format. | Un contrôle de format est un écart avec la maquette (qui signale seulement les champs vides) ; sans décision, aucun contrôle de format n'est ajouté. | Décider si un signalement de format (14 chiffres) est souhaité. |
| Q20 | Les observations sont-elles du texte simple multiligne (maquette) ou du texte mis en forme (capture : gras, listes) ? | La V1 reprend le texte simple multiligne de la maquette ; le texte enrichi est une piste. | Confirmer le texte simple pour la V1. |
| Q21 | Les imprimés officiels du pack sont-ils les versions en vigueur ? Cinq d'entre eux portent des éditions de 2008 à 2018 avec le vocabulaire d'un ancien programme, deux (avance, engagements complémentaires) et les modèles d'attestation de 2024 parlent du parcours accompagné. Quel est le numéro de l'attestation d'exclusivité du professionnel, qui n'en porte pas d'imprimé ? | Les intitulés repris dans les aperçus s'alignent sur les imprimés du pack ; un imprimé périmé alignerait l'outil sur un modèle qui n'est plus attendu par l'Anah. | Faire confirmer par le partenaire les versions à reprendre et le numéro de l'attestation d'exclusivité. |
| Q22 | Que contient la liste des intervenants du champ « Alliances » (affectation multiple) alors que la gestion des utilisateurs est hors périmètre ? | Le champ reste « à confirmer » et ne sera pas repris en phase 1 sans liste de choix ou saisie libre définie. | Choisir entre liste générique de choix et texte libre, ou reporter le champ. |
| Q23 | La date de visite de fin de travaux a été demandée en réunion comme seul ajout au suivi administratif (transcript, 00:39:40). Quel document ou quelle sortie doit-elle alimenter ? Le rapport de fin d'accompagnement du pack la comporte ; le lien avec ce rapport et avec le carnet d'information du logement n'est dit que par la note de réunion automatique, pas dans le transcript. | Le champ est repris en phase 1 comme date du suivi (onglet Projet) ; l'alimentation du rapport de fin d'accompagnement (L6) reste à confirmer. | Confirmer auprès du partenaire quels documents utilisent cette date. |
| Q24 | Combien de dates la ligne « Permanence » comporte-t-elle et combien de champs ont les lignes Avance et Comptes ? Quels sont les contrôles non rendus à l'impression (questions oui/non) ? Les captures sont tronquées à droite et certains contrôles ne sont pas rendus. | Le nombre de dates de permanence et le type des questions oui/non sont inférés ; une erreur modifierait la configuration de ces champs. | Obtenir des captures plus larges ou l'écran en mode complet. |
| Q25 | L'intitulé de la PR de la phase 0 (« feat(saisie-unique): cadrage de la phase 0 ») et son ouverture vers main conviennent-ils au responsable ? | La PR est ouverte, cases décochées, sans fusion ; son constat daté est enregistré dans le suivi. Un autre intitulé se corrige par une édition de la PR, sans effet sur les livrables. | Confirmer ou demander un autre intitulé lors de la revue de la phase 0 ; la fusion reste une décision du responsable. |
| Q26 | Les vues générées de Passeport Immo dans le dépôt (tableau-de-bord.md et .html) sont-elles périmées ? Le contrôle --check du générateur mutualisé signale des vues à actualiser pour ce sous-projet, indépendamment de cette mission. | Constat antérieur à la mission, signalé sans modification : ce sous-projet est en lecture seule. | Décider d'une régénération dans une mission distincte. |
| Q27 | Quel fichier du 19/10/2026 fait office de « compte rendu automatique » au sens du prompt ? Cinq fichiers de la réunion sont fournis : le transcript, un fichier nommé « résumé » qui reproduit presque intégralement le transcript avec des corrections ponctuelles, une note de réunion, un résumé adaptatif et un résumé de raisonnement. | Les besoins qui n'apparaissent que dans un résumé sont marqués « résumé seul » ; le fichier retenu change ce marquage. | Confirmer le fichier de référence ; en attendant, la note de réunion, le résumé adaptatif et le résumé de raisonnement sont traités comme comptes rendus automatiques. |
| Q28 | L'indicateur « sensible » du catalogue couvre-t-il uniquement la santé et l'autonomie, la situation sociale ou familiale, les revenus et ressources, la naissance, l'identifiant fiscal et les textes libres ? Les données d'identité et de contact (nom, adresse, téléphone, courriel) sont marquées « non sensible » mais restent des données personnelles. | Les décisions d'hébergement et de conformité à venir s'appuient sur cet indicateur ; un périmètre plus large changerait des lignes du catalogue sans changer le code. | Valider le périmètre retenu (en cas de doute, un champ est marqué sensible). |
| Q29 | Le classeur contient trois scénarios de travaux, un suivi de trésorerie par étapes (acomptes et soldes des artisans) et des calculateurs de surfaces ; le modèle E04 ne retient que les plans Devis et Factures. Ces éléments sont-ils hors périmètre de la V1 ? | Ces éléments sont consignés comme écarts et pistes ; aucun champ de scénario ni de trésorerie n'est repris. | Confirmer que les scénarios, la trésorerie et les calculateurs de surfaces restent des pistes. |
| Q30 | Le dossier par étape du pack comporte des zones « identifiant » et « mot de passe » d'un compte. L'outil doit-il les stocker ? La proposition est de ne jamais stocker de mot de passe, même fictif. | Le champ est catalogué « à confirmer » ; il n'est pas repris en phase 1 tant que ce point n'est pas tranché. | Confirmer qu'aucun mot de passe n'est stocké. |
| Q31 | Quelle est la casse du nom du dépôt : « AVEREO » (prompt) ou « avereo » (remote Git) ? | Aucun effet sur le contenu ; sert à vérifier le contrôle d'entrée « git remote -v ». | Aucune, sauf si le responsable constate une erreur de dépôt. |
| Q32 | Quels champs de l'onglet Énergie se dédoublent entre le plan Devis et le plan Factures ? La réunion demande de reproduire l'évaluation de l'énergie avec ses résultats, et de refaire l'audit s'il diffère (transcript, 00:42:48 et 02:09:50). Les deux modèles d'attestation demandent les mêmes rubriques de synthèse de l'audit. Le catalogue garde un seul identifiant par champ ; l'instance (devis ou factures) est portée par le plan, comme pour les postes. | Le test du devis figé s'écrit d'abord sur les postes ; les champs Énergie suivent la même règle une fois la question tranchée, sans changer les identifiants. | Confirmer que tous les champs de la synthèse de l'audit (classes, énergies primaire et finale, GES, surface de référence, scénario) se dédoublent, ou lister ceux qui restent uniques. |
| Q33 | Quels navigateurs la V1 doit-elle prendre en charge ? La maquette n'a été contrôlée que sous Chromium (PDF, section « Données et fonctionnement »), les autres navigateurs étant « à confirmer » ; le cadrage parle d'une application de bureau sans nommer de navigateur. | La recette locale de la phase 1 se limite à Chromium (Chrome, Edge) tant que la liste n'est pas arrêtée ; les tests Vitest tournent dans jsdom et ne valent pas recette de navigateur. | Indiquer les navigateurs de la recette (par exemple Chrome et Edge sous Windows). |
<!-- END GENERATED: suivi-chantier.json -->

## Livrables attendus par phase

Description issue du suivi JSON ; disponibilité vérifiée lors de la génération.

### Phase 0 — Cadrage

**Cadrage et traçabilité** — Document disponible (`00-cadrage.md`).

Contrôles d'entrée, cadrage du commanditaire, exigences E01 à E12, inventaire du pack, mots mal transcrits, matrice de traçabilité, écarts, pistes, questions ouvertes, ordre de L6 et plan de la phase 1.

- Chaque exigence porte une origine et une source.
- Chaque fichier du pack figure sous son nom officiel ou son alias.

**Catalogue des champs** — Document disponible (`00-catalogue-champs.md`).

Tous les champs relevés sur les captures, les imprimés officiels, les modèles et la maquette, chacun avec un identifiant proposé, un onglet, un statut et ses types de dossier.

- Chaque champ porte un onglet, un statut, ses types de dossier et l'indicateur « sensible ».
- Aucune valeur de dossier réel.

**Audit des sources** — Document disponible (`source-audit.md`).

Dépendances externes et API navigateur de la maquette, limites connues, y compris le détail d'affichage du journal.

- Dépendances externes et API navigateur listées avec leur ligne de code.
- Limites connues et écarts consignés.

**Accès au suivi local** — Document disponible (`acces-suivi-local.md`).

Ouverture du chantier dans AVEREO Projet avec start-review.cmd, réglages locaux et commandes du générateur.

- Procédure d'ouverture, réglages locaux et commandes de génération décrits.

### Phase 1 — Développement local

**Développement local** — Prévu — document non produit (`01-developpement-local.md`).

Résultat de npm ci, npm test et npm run build, matrice de traçabilité mise à jour, choix techniques et tableau de recette locale R01….

- Les trois commandes réussissent.
- Chaque ligne de la matrice a un statut.
- Tableau de recette locale prêt pour le responsable.

### Phase 2 — Préproduction

**Préproduction** — Prévu — document non produit (`02-preproduction.md`).

Hors mission ; livrable à définir avant toute autorisation.

- À définir par le responsable.

### Phase 3 — Mise en production

**Mise en production** — Prévu — document non produit (`03-mise-en-production.md`).

Hors mission ; livrable à définir avant toute autorisation.

- À définir par le responsable.
