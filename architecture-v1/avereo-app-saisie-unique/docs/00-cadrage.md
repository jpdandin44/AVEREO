---
project: avereo-app-saisie-unique
document_type: cadrage
title: Cadrage AVEREO Saisie unique
status: draft
version: git
created: 2026-10-21
updated: 2026-10-21
owner: jpdandin
tags: [avereo, cadrage, phase-0]
---

# Cadrage AVEREO Saisie unique

Phase 0 — Cadrage de l'application « AVEREO Saisie unique » (code `saisie-unique`). Ce document consigne les
contrôles d'entrée, le cadrage arrêté par le commanditaire, le relevé des exigences, l'inventaire du pack
documentaire, les mots mal transcrits, la matrice de traçabilité, les écarts, les pistes, les questions ouvertes,
l'ordre proposé des documents de L6 et le plan de la phase 1. Le catalogue des champs est dans
[00-catalogue-champs.md](00-catalogue-champs.md) et l'audit de la maquette dans [source-audit.md](source-audit.md).

**Confidentialité.** Le partenaire est désigné par « le partenaire ». Aucune valeur de dossier réel n'est reprise :
seuls les intitulés, types de champ, listes de choix et formules sont relevés. Les passages de la réunion du
19/10/2026 sont cités par l'horodatage du début de l'énoncé et reformulés ; « développeur » désigne le
commanditaire, « partenaire » l'équipe du partenaire. La transcription est automatique : certains mots sont mal
transcrits (voir §6). Les fichiers du pack se citent par leur intitulé et leur numéro de formulaire, ou par un alias
`SRC-nn` (correspondance dans le compte rendu de fin de phase seulement).

Un horodatage seul désigne la réunion. Les mots « maquette » (PDF de description détaillée, désigné « PDF » dans le
texte, et code HTML) et « pack » (documents transmis par le partenaire) désignent les deux autres sources.

## 1. Résultat des contrôles d'entrée

| Contrôle | Résultat | Constat |
|---|---|---|
| `git remote -v` désigne le dépôt du commanditaire | ✓ avec réserve | `origin` pointe vers `https://github.com/jpdandin44/avereo` ; la casse diffère de celle du prompt (question Q31). |
| Dossier d'import présent et ignoré par git | ✓ | `.codex-imports/saisie-unique` existe ; `git check-ignore -v` renvoie la règle `.gitignore:22` (`/.codex-imports/`) ; `git ls-files .codex-imports/saisie-unique` ne renvoie aucun fichier. |
| Sources présentes | ✓ | `reunions/` : transcript du 19/10/2026 et quatre autres fichiers de compte rendu ; `maquette/` : PDF de description détaillée (17 pages) et HTML (500 lignes) ; `pack-documentaire/` : 19 fichiers. |
| Sous-projet absent avant la mission | ✓ | `architecture-v1/avereo-app-saisie-unique/` n'existait pas. |
| Modèles présents | ✓ | gabarit `architecture-v1/avereo-platform/templates/app-template/`, `architecture-v1/avereo-app-passeport-immo/docs/suivi-chantier.json`, `architecture-v1/avereo-app-projet/workflows/review-store.mjs`, `.github/scripts/check-pr-policy.py`. |
| Branche de phase | ✓ | `feat/saisie-unique-phase-0`, créée depuis `main` (dernier commit de `main` : 78a3684, du 16/10/2026). |

Aucun point en échec : la phase 0 a pu démarrer.

**Conditions d'exécution.** Le prompt vise une session locale sur le poste Windows du commanditaire ; cette phase a
été exécutée dans une session Claude Code ouverte dans le nuage, sans worktree. Les sources ont été copiées depuis le
poste dans le clone du nuage, dans le dossier d'import ignoré par git. Deux conséquences :

- `.local/review-settings.json` (ignoré par git) contient un chemin du nuage vers le générateur de tableau de bord
  mutualisé ; ce chemin n'existe pas sur le poste du commanditaire (question Q02).
- Les commandes propres à Windows (`start-review.cmd`) et le serveur de revue n'ont pas été exécutés ici.

## 2. Variables du kit

Le prompt laisse les variables à renseigner ; les valeurs par défaut du kit ont été appliquées sans confirmation
explicite (question Q01).

| Variable | Valeur appliquée | État |
|---|---|---|
| `{{SLUG}}` | `saisie-unique` | conforme à `^[a-z0-9][a-z0-9_-]{1,63}$`, dossier libre |
| `{{NOM_APPLICATION}}` | « AVEREO Saisie unique » | ne contient pas le nom du partenaire |
| `{{PORT_REVUE}}` | 5191 | absent des `start-review.cmd` existants (Passeport Immo utilise 5193) |
| `{{DOSSIER_IMPORT}}` | `.codex-imports/saisie-unique` | ignoré par git (§1) |
| `{{GENERATEUR_MUTUALISE}}` | chemin du nuage, écrit dans `.local/review-settings.json` | à remplacer par le chemin local (question Q02) |

## 3. Cadrage fourni par le commanditaire

Ces choix sont arrêtés par le commanditaire le 19/10/2026 ; ils sont appliqués sans les rouvrir et consignés ici, jamais
dans `decisions` (que seul AVEREO Projet écrit). Quand un fait du pack ou du transcript en contredit un, l'écart est
consigné au §8 et le choix reste appliqué.

### 3.1 Choix arrêtés

1. **Documents prioritaires**, dans cet ordre : plan de financement ; attestation de travaux sur devis ; attestation
   de travaux sur factures ; demande d'avance ; demande de paiement d'acompte. La synthèse d'analyse du logement de la
   maquette est reprise en plus, en L2 ; le pack ne contient pas de formulaire correspondant (écart, §8). Les autres
   documents du pack viennent ensuite (L6) ; leurs champs entrent dans le catalogue dès la phase 0.
2. **Aides** (Anah, CEE, collectivités, caisses de retraite…) saisies à la main. Le calcul des aides est une piste : le
   classeur du pack contient des tables de taux et de plafonds, non reprises (§9).
3. **Types de dossier.** Énergie : champs communs plus champs de l'onglet Énergie. Adaptation et Insalubrité : champs
   communs plus champs d'adaptation relevés sur les captures. Aucun document propre à un type. Toute affectation que
   cette règle ne tranche pas passe en « à confirmer » et ouvre une question.
4. **« Pré-remplir »** veut dire un aperçu à l'écran dont les intitulés reprennent l'imprimé officiel, comme dans la
   maquette. La production de PDF ou de fichiers Word remplis est une piste.
5. **Onglets** : Administratif, Projet, Financement, Énergie, Travaux, dans cet ordre. Les plans Devis et Factures
   prennent place dans Financement et Énergie.
6. **TVA** : le HT et le TTC de chaque poste sont saisis tous deux ; la TVA est une liste de choix recopiée de la
   capture, sans calcul. Le calcul de la TVA est une piste.
7. **Ratios (E08)** : prix HT et prix TTC au mètre carré, par catégorie de travaux et par matériau, en moyenne simple sur
   les dossiers saisis. Un poste sans surface est exclu du calcul et compté à part, pour éviter une division par zéro.
   La formule exacte est documentée au livrable de la phase 1 et portée par la configuration.

Étaient déjà arrêtés : application de bureau ; V1 sur données fictives stockées dans le navigateur, jusqu'à une
décision distincte d'hébergement et de conformité ; nom du partenaire absent du dépôt public ; outil complémentaire de
l'interface actuelle, qu'il ne remplace pas.

### 3.2 Suivi des dossiers (choix validé le 19/10/2026)

1. **Champs.** Tous les champs de suivi des captures entrent dans le catalogue et dans la configuration, chacun dans
   l'onglet où la capture le montre. Les listes de choix (statuts, origines du contact, types de projet) sont recopiées
   des captures, sous forme générique quand elles nomment un acteur réel (question Q08).
2. **Saisie seulement.** Aucune transition imposée entre statuts, aucune notification, aucun rappel, aucune échéance
   calculée. L'alarme est un indicateur oui ou non saisi.
3. **Trois liens avec le reste de l'outil, pas davantage** : la liste des dossiers affiche statut, programme, année et
   alarme, et se filtre par statut ; le plan de financement Devis se fige par l'action « Figer au dépôt », qui propose
   sans l'imposer de renseigner la date de dépôt et de passer le statut à « Déposé » (question Q10) ; le journal des
   modifications couvre les champs de suivi.
4. **Progression.** Les champs de suivi ne comptent ni dans la progression par onglet ni dans les signalements « À
   compléter », sauf s'ils sont requis par un document.
5. **Hors périmètre, toujours** : gestion des utilisateurs, des permanences, des programmes et des EPCI comme entités
   (un programme est une liste de choix) ; tableau de bord général de l'interface actuelle, hormis les ratios de E08.
6. **Échange.** Aucun import ni export avec l'interface actuelle en V1 ; un export des champs de suivi est une piste.
7. **Sensibilité.** Le champ d'observations en texte libre porte l'indicateur « sensible ».

## 4. Exigences

Relevé définitif, établi en relisant chaque passage de la réunion, le PDF et le code de la maquette et le pack. Chaque
exigence indique qui l'a formulée (origine) et où (source). Les horodatages ont été relus un à un dans le transcript.

### 4.1 Exigences E01 à E12

| Id | Exigence | Origine | Sources | Constat de la relecture |
|---|---|---|---|---|
| E01 | Saisie unique alimentant les imprimés de dossier | partenaire ; reprise par le développeur dans la maquette | transcript : 00:25:39–00:25:49 (brique visée), 00:29:55–00:30:35 (imprimés remplis à la main), 00:33:12–00:33:43 (un seul outil), 00:44:21–00:44:52 (une faute se retrouve partout), 01:10:40–01:10:50 (tous les champs détaillés), 01:50:00–01:50:10 (gain de temps, moins d'erreurs) ; maquette : PDF « Objet et périmètre » | Confirmé. Le nombre d'imprimés diffère selon les sources : écart au §8.1. Le partenaire refuse le remplissage partiel (00:32:44–00:33:12). |
| E02 | Trois types de dossier (Énergie, Adaptation, Insalubrité) avec un plan de financement commun | partenaire | transcript : 00:34:35–00:35:35 (trois types, plan commun), 00:35:38–00:35:49 (rapport de visite finale commun), 00:34:18–00:34:34 et 00:40:03–00:40:16 (particularités) ; pack : captures SRC-08 (types de projet) | Confirmé avec nuances : l'énergie a nettement plus d'imprimés et l'adaptation un rapport propre (écart au §8.2). Contenu fixé par le cadrage, point 3. La liste fine des captures est reprise comme champ de liste (question Q07). |
| E03 | Identifiant stable pour chaque champ, réutilisable quel que soit le formulaire | développeur (le partenaire ne s'y oppose pas) | transcript : 00:38:16–00:38:32 (idée), 00:38:36–00:38:47 (usage attendu : un document édité d'un geste), 00:57:45–00:58:01 (champs indispensables par intervenant), 01:06:41–01:07:15 (versions des formulaires) | Confirmé. 251 identifiants proposés au catalogue. La gestion des versions de formulaires est une piste (question Q21). |
| E04 | Devis et Factures : deux plans de financement, le premier figé au dépôt, le second dupliqué et modifiable ; écart calculé ; même logique pour l'évaluation énergétique | partenaire ; l'écart et le phasage viennent du développeur | transcript : 00:40:23–00:40:59 (plan prévu saisi au dépôt, second plan côté factures), 00:40:59–00:41:03 (écart), 00:41:04–00:41:49 (duplication), 00:42:31–00:43:34 (deux onglets Travaux, deux volets de financement, énergie), 00:59:47–01:00:21 (écart et avances), 01:23:09–01:23:28 (plus- et moins-values), 01:25:55–01:27:26 (figer le départ, second plan en copie), 02:09:50–02:10:13 (reconfirmation pour l'énergie) ; pack : classeur SRC-02, modèles SRC-04 et SRC-05 | Confirmé. L'exemple chiffré de la réunion (un poste à 300 € au devis et à 400 € à la facture, 01:00:00) est une illustration orale du tableur actuel, pas un cas réel. Le développeur décrit une répercussion automatique de toute modification (01:11:56–01:12:21 ; 01:23:32–01:23:49), qui s'oppose au besoin de figer ; il admet le phasage à 01:26:41–01:26:52. |
| E05 | Montants HT et TTC du plan de financement alimentés par l'onglet Travaux | partenaire (comportement actuel à garder) | transcript : 00:41:52–00:42:28 ; pack : plan de financement 13460*03 et attestations SRC-04 et SRC-05 (les deux demandent HT et TTC) | Confirmé. Ambiguïté de la réunion : un montant TTC seul (00:42:10) ou un total HT et TTC (00:42:20). Le cadrage, point 6, tranche (HT et TTC saisis). |
| E06 | Travaux : champs matériau (type, marque, référence, numéro d'identification de l'isolant, résistance thermique, épaisseur, surface) et entreprise (nom, SIRET) | partenaire (matériau et entreprise) ; idée de retrouver les caractéristiques depuis le numéro : développeur | transcript : 00:48:58–00:49:17 (champs manquants, entreprise), 00:51:23–00:52:11 (numéro d'identification, marque, référence, épaisseur, résistance), 00:52:11–00:53:01 (retrouver les caractéristiques), 00:53:18–00:53:35 (factures hétérogènes), 00:57:31–00:58:01 (entreprise, liste de travaux) ; pack : SRC-04 (rubriques Marque, Référence, N° ACERMI, R, Épaisseur) | Confirmé avec nuances : la surface est déjà saisie dans l'outil actuel (00:49:05), ce n'est pas un manque ; le nom et le SIRET de l'entreprise sont dits dans la réunion (00:49:07 ; 00:57:38), la mention « résumé seul » du prompt est levée. Le « numéro d'identification » est le numéro ACERMI (§6). Reste à fournir par le partenaire : les champs indispensables par intervenant (00:57:45). |
| E07 | Énergie : énergies primaire et finale, émissions de gaz à effet de serre, classes avant et après, surface de référence, scénario retenu, gain de classes ; date de visite de fin de travaux | partenaire (technicien énergie) | transcript : 00:44:06–00:44:17 (énergie finale et scénario manquants), 01:38:34–01:39:00 (minimum à récupérer de l'audit), 01:39:49–01:40:00 (numéro ADEME de l'audit à reporter), 01:40:28–01:42:02 (extraction du PDF d'audit malaisée, ressaisie d'environ trois minutes), 00:39:40–00:39:43 (date de visite de fin de travaux), 02:09:50–02:10:13 ; pack : synthèse de l'audit énergétique de SRC-04 et SRC-05, captures SRC-09 | Nuancé. « Surface de référence » et « gain de classes » n'apparaissent pas dans la réunion : ils viennent des modèles SRC-04 et SRC-05. La date de visite de fin de travaux est dite dans la réunion (plus « résumé seul ») comme seul ajout demandé au suivi ; son lien avec le rapport de fin d'accompagnement et le carnet d'information n'est dit que par la note de réunion (question Q23). Le besoin de reprise de l'audit est modulé : étiquette de départ seule pour le financement (01:41:20–01:41:34). |
| E08 | Ratios de coûts par catégorie de travaux et par matériau, calculés sur les dossiers saisis | partenaire (besoin) ; le mot « tableau de bord » est du développeur (00:51:18) | transcript : 00:49:30–00:49:56 (statistiques pour les financeurs), 00:50:01–00:50:34 (estimer le coût global et l'aide dès le premier contact), 00:50:34–00:50:56 (affiner par nature de matériau), 00:51:03–00:51:23 (extraction en cours d'année) | Formule fixée par le cadrage, point 7 ; aucun passage ne la contredit frontalement, mais quatre la nuancent (écart au §8.6). Portée par la configuration. |
| E09 | Onglets en haut, repères visuels familiers, progression indiquée par des couleurs | partenaire (habitude des onglets ; vue d'ensemble d'un dossier) ; le dégradé de couleurs est une idée du développeur | transcript : 01:36:39–01:37:33 (garder les onglets en haut), 01:44:20–01:44:52 (onglets sur une ligne), 01:45:09–01:45:30 (dégradé), 01:45:41–01:46:55 (voir d'un coup d'œil où en est un dossier), 00:38:58–00:40:16 (contenu des onglets Administratif et Projet), 00:39:08–00:39:37 (jalons datés) | Nuancé : le partenaire ne donne pas d'accord net sur les couleurs (passage fragmentaire 01:48:55–01:49:08) ; l'ordre des onglets n'est jamais énoncé, hormis Travaux à droite de Financement (00:41:52). Onglets fixés par le cadrage, point 5. Une couleur seule exclut une partie des utilisateurs : l'avancement se lira aussi par un texte ou un symbole. |
| E10 | Documents générés, dont seule la dernière page (signature) est reprise à la main | partenaire | transcript : 01:06:26–01:06:41 (un clic génère le document), 01:48:30–01:48:38 (dernières pages si besoin), 00:38:36–00:38:47, 01:03:58–01:04:14 (un PDF évite le scan, la signature reste papier) | Confirmé, avec un écart sur la forme : le partenaire attend un document édité (PDF ou Word) alors que le cadrage, point 4, limite la V1 à un aperçu à l'écran (§8.3). La signature sur écran, proposée par le développeur (01:04:56–01:05:34), est freinée par la méfiance des ménages (01:04:31–01:04:55). |
| E11 | Libellés des champs et des documents alignés sur les imprimés officiels | maquette (rubrique « À CONFIRMER ») | maquette : PDF « Objet et périmètre » et « À CONFIRMER et questions pour le partenaire » ; pack : huit formulaires officiels et quatre modèles ; transcript : 01:06:41–01:07:15 (versions des formulaires) | Vérifiable à présent grâce au pack. Cinq formulaires portent des éditions anciennes (question Q21). |
| E12 | Suivi des dossiers intégré à l'outil | commanditaire (19/10/2026, demande postérieure à la réunion, hors transcript) | cadrage §3.2 ; pack : captures SRC-06 à SRC-10 ; transcript, pour le contexte : 00:31:39–00:32:31 (données de suivi servant aux bilans), 00:39:08–00:39:37 (jalons datés) | Appliqué sans le rouvrir. Les champs de suivi sans document représentent 78 des 251 champs du catalogue. |

### 4.2 Autres besoins entendus pendant la réunion

Ces besoins ne sont pas des exigences E01 à E12. Chacun est rattaché à une exigence, signalé comme piste ou écarté.

| Besoin | Origine | Horodatage | Traitement |
|---|---|---|---|
| Le sort de l'interface actuelle n'est pas tranché (remplacer, faire évoluer) ; le partenaire ne veut pas payer deux fois ; outils jugés « assemblables » | partenaire et développeur | 00:28:22–00:29:33 ; 02:20:53 | L'outil complète l'interface actuelle (cadrage) ; aucun échange en V1 (§9). |
| Vigilance sur la consolidation des données avant un export en fichier plat | développeur | 00:43:34 | Piste d'export des champs de suivi (§9). |
| Sortir l'imprimé papier de la demande de subvention (fréquent tant que la plateforme de l'Anah dysfonctionne ; ressaisie d'environ dix minutes) | partenaire | 00:35:49–00:37:17 | Demande d'aide (cerfa 12711*08) traitée en L6, première de l'ordre proposé (§11). |
| Obtenir le dossier complet des modèles ; tous existent en numérique | développeur ; partenaire | 00:37:26–00:38:12 | Pack reçu (19 fichiers). |
| Conserver les données de suivi (statut, identité, type) qui servent aux bilans transmis aux organismes | partenaire | 00:31:39–00:32:31 | E12. |
| Plus-values et moins-values entre devis et factures | partenaire | 01:23:09–01:23:28 | E04 (écart). |
| Règle métier : le dépôt vaut engagement ; limiter les changements de projet ou d'entreprise après le dépôt | partenaire | 01:20:32–01:21:27 | Hors périmètre (règles de changement d'entreprise) ; le gel du plan Devis (E04) en est la traduction côté outil. |
| Mensualité de remboursement du ménage dans le tableur actuel | partenaire | 01:15:58–01:16:05 | Piste (calcul de mensualité exclu). |
| Rapport de fin des travaux calqué sur le décret, servant de carnet d'information du logement | partenaire | 00:45:22–00:48:24 | Rapport de fin d'accompagnement (SRC-03) en L6 ; carnet en piste. |
| Reconnaissance du type de pièce, pré-remplissage par scan, rangement des pièces par dossier | partenaire ; développeur | 00:53:37–00:57:12 | Piste ; le développeur la reporte après le premier jet (00:57:06). |
| Signature sur écran | développeur | 01:04:56–01:05:34 | Piste ; freinée par le partenaire (01:04:31–01:04:55). |
| Fiche des étapes personnalisée pour les ménages | développeur | 01:46:55–01:48:08 | Écartée par le partenaire (dossiers préimprimés). |
| Estimer de tête le coût global et l'aide dès le premier contact | partenaire | 00:50:01–00:50:34 | Piste (calcul d'aide exclu). |
| TVA : taux relevant de l'entreprise ; alerte manuelle du partenaire quand un taux paraît faux | partenaire | 02:01:55–02:06:30 | Piste (calcul et vérification de la TVA exclus). |
| Réflexion sur un mandat administratif rémunéré | partenaire | 01:01:39–01:02:30 | Hors périmètre ; réflexion du partenaire seule. |
| Comptes individuels dans l'outil actuel : chacun saisit | partenaire | 01:35:28–01:35:43 | Multi-utilisateurs non formulé comme besoin ; hors périmètre. |
| Charge de travail : l'administratif pèse entre 60 % et 80 % ; la saisie d'un dossier complet prend environ une demi-journée | partenaire | 00:54:05–00:54:19 ; 01:42:25–01:43:44 | Contexte ; sert de repère pour la recette (aucune mesure promise). |
| Pas d'accès à l'interface actuelle pour l'instant : captures d'écran à la place | partenaire | 01:36:17–01:36:24 | Cohérent avec le prompt (captures seules). |
| Récapitulatif écrit de la journée ; premier jet envoyé pour avis | développeur | 01:58:28–01:58:43 ; 02:25:16 | Contexte. |

### 4.3 Besoins qui n'apparaissent que dans un compte rendu automatique (« résumé seul »)

Aucun n'est retenu comme exigence. Les rubriques « suggestions de l'IA » ne sont pas des demandes du partenaire.

| Compte rendu | Élément | Ce que dit la réunion | Traitement |
|---|---|---|---|
| note de réunion | Documenter pour les propriétaires les règles de changement d'entreprise et une grille des taux de TVA | Seuls des constats métier existent (01:20:32–01:22:51 ; 02:05:07–02:05:24). | Piste. |
| note de réunion | Étudier le statut de mandataire administratif comme tâche du développeur | Réflexion du partenaire seul (01:02:05–01:02:30). | Non retenu. |
| note de réunion | La date de visite de clôture alimente le rapport d'accompagnement final et le carnet | La date est dite (00:39:40), pas le lien. | Question Q23. |
| note de réunion | Marge de 10 % associée au coût moyen d'un type de travaux | Précision personnelle du partenaire pour estimer un projet (00:50:06). | Non retenu comme règle de l'outil. |
| note de réunion | Arborescence documentaire avec attestations, plans de financement et photos par façade ou pièce | La réunion cite audit, devis, factures et photos (00:55:48–00:56:17) ; les photos par façade concernent le logiciel d'audit (01:39:17). | Piste (gestion documentaire exclue). |
| note de réunion | Documents types non personnalisés « au départ » ; transition « progressive » vers la signature électronique | Le partenaire parle seulement de la fiche des étapes (01:47:41–01:48:08) et préfère la signature papier. | Non retenu. |
| note de réunion, « suggestions de l'IA » | Arbitrer refonte ou export CSV ; interopérabilité avec l'Anah ; grille d'audit de conformité des devis ; gouvernance d'hébergement et modèle légal de signature | Aucune n'est une demande du partenaire ; l'arbitrage refonte ou export est resté ouvert (00:28:22–00:29:06). | Pistes seulement. |
| résumé adaptatif, résumé de raisonnement | Données réécrites « jusqu'à sept fois » | La réunion dit dix fois (01:50:03–01:50:10). | Écart (§8.20). |
| résumé adaptatif | Modules du développeur (centralisation documentaire, inspection) présentés comme besoins | Démonstration de ses propres outils (01:28:13–01:31:15). | Non retenus. |
| résumé adaptatif, résumé de raisonnement | Récupération automatique complète des indicateurs de l'audit | Passerelle jugée souhaitable (01:38:34–01:38:43), mais ressaisie d'environ trois minutes (01:41:46–01:42:02). | Piste. |
| fichier nommé « résumé » | Aucun besoin propre | Copie quasi intégrale du transcript avec des corrections ponctuelles (noms de sigles et de logiciels). | Question Q27. |

## 5. Inventaire du pack documentaire

Le pack compte 19 fichiers : huit formulaires officiels, quatre modèles Word du partenaire, un classeur, cinq
captures de l'interface actuelle et une image. Le nombre de champs relevés est le nombre de lignes du catalogue qui
citent le fichier ; un champ présent sur plusieurs fichiers est compté pour chacun et garde un seul identifiant. La
liste des champs d'un fichier s'obtient en filtrant la colonne « sources » du catalogue sur sa référence.
Aucune valeur saisie n'a été relevée.

Codes des documents, utilisés dans le catalogue et dans ce document :

| Code | Document |
|---|---|
| PF | Plan de financement (cerfa 13460*03) |
| ATD | Attestation de travaux sur devis (SRC-04) |
| ATF | Attestation de travaux sur factures (SRC-05) |
| AVA | Demande de versement d'une avance (cerfa 13934*05) et demande d'avance de la maquette |
| ACO | Demande de paiement d'acompte (cerfa 13467*02) |
| SYN | Synthèse d'analyse du logement (maquette, L2) |
| DAP | Demande d'aide, propriétaire occupant (cerfa 12711*08, L6) |
| EXC | Attestation d'exclusivité du professionnel (sans numéro imprimé, L6) |
| PRS | Procuration pour signer les engagements (cerfa 13462*01, L6) |
| PRP | Procuration pour la perception des fonds (cerfa 13463*02, L6) |
| CEE | Engagements complémentaires CEE (sans numéro imprimé, L6) |
| RFA | Rapport de fin d'accompagnement (SRC-03, L6) |
| DPE | Dossier par étape (SRC-01, L6) |

| Référence | Nature | Champs relevés | Document de la maquette correspondant |
|---|---|---|---|
| Plan de financement, formulaire 13460*03 | formulaire officiel (PDF, 1 page) | 41 | « Plan de financement » (PF) |
| Demande d'aide, propriétaire occupant, formulaire 12711*08 | formulaire officiel (PDF, 4 pages) | 43 | aucun ; traité en L6 (DAP) |
| Demande de versement d'une avance pour le commencement des travaux, formulaire 13934*05 | formulaire officiel (PDF à champs, 3 pages) | 11 | « Demande d'avance ou d'acompte » (AVA) |
| Demande de paiement d'acompte, formulaire 13467*02 | formulaire officiel (PDF, 2 pages) | 19 | « Demande d'avance ou d'acompte » (ACO) |
| Attestation d'exclusivité du professionnel (certificats d'économies d'énergie), sans numéro imprimé | formulaire (PDF à champs, 1 page) | 7 | aucun ; traité en L6 (EXC) |
| Procuration pour signer les engagements, formulaire 13462*01 | formulaire officiel (PDF, 2 pages) | 14 | aucun ; traité en L6 (PRS) |
| Procuration pour la perception des fonds, formulaire 13463*02 | formulaire officiel (PDF, 2 pages) | 14 | aucun ; traité en L6 (PRP) |
| Engagements complémentaires (certificats d'économies d'énergie), sans numéro imprimé | formulaire (PDF à champs, 2 pages) | 6 | aucun ; traité en L6 (CEE) |
| SRC-01 | modèle Word du partenaire : dossier par étape, énergie | 21 | aucun ; traité en L6 (DPE) |
| SRC-02 | classeur Excel de plan de financement, 7 feuilles (« PLAN PREVI », « PROG FINAL », « PLAN FINAL », « SURFACES », « TOITURE », « PLANCHERS », « DONNEES ») | 24 | modèle de calcul du plan de financement (E04) ; « Plan de financement » (PF) |
| SRC-03 | modèle Word du partenaire : rapport de fin d'accompagnement | 21 | aucun ; traité en L6 (RFA) |
| SRC-04 | modèle Word du partenaire : attestation de travaux sur devis | 53 | « Attestation de travaux » (ATD) |
| SRC-05 | modèle Word du partenaire : attestation de travaux sur factures | 29 | « Attestation de travaux » (ATF) |
| SRC-06 | capture de l'onglet Financement de l'interface actuelle (PDF, 2 pages) | 30 | « La fiche unique », groupe Financement |
| SRC-07 | capture de l'onglet Administratif (PDF, 3 pages) | 34 | « La fiche unique », groupe Propriétaire |
| SRC-08 | capture de l'onglet Projet (PDF, 2 pages) | 25 | « La fiche unique », groupe Logement |
| SRC-09 | capture de l'onglet Énergie (PDF, 2 pages) | 17 | « La fiche unique », groupe Logement ; synthèse du logement (SYN) |
| SRC-10 | capture de l'onglet Travaux (PDF, 1 page) | 8 | « La fiche unique », groupe Travaux envisagés |
| SRC-11 | image de type QR code | 0 | aucun |

Les captures SRC-06 à SRC-10, le classeur SRC-02 et le rapport SRC-03 contiennent des données réelles de bénéficiaires,
d'entreprises ou de salariés : seule leur structure est relevée. La synthèse d'analyse du logement (SYN) de la maquette
n'a aucun formulaire dans le pack (écart, §8.8).

Synthèse du catalogue : 251 champs ;
147 nouveaux, 18 repris de la maquette,
45 reportés en L6, 41 à confirmer.
120 champs sont utilisés par un document prioritaire et
78 champs de suivi n'ont aucun document.

## 6. Mots mal transcrits

La transcription est automatique. Chaque lecture est donnée avec son degré de certitude et sa preuve.

| Mot transcrit | Lecture retenue | Certitude | Preuve |
|---|---|---|---|
| « Ana », « l'Ana », « Anna », « LAN » | Anah (Agence nationale de l'habitat) | haute | 00:31:02 (attestation de travaux demandée à ce financeur), 00:36:33 (plateforme en panne), 01:01:08, 01:23:32, 01:37:52, 01:43:29, 01:46:50, 01:52:50 ; le fichier nommé « résumé » corrige en Anah ; huit formulaires du pack sont ceux de l'Anah ou des CEE. |
| « CSG » | CSV | moyenne à haute | 00:43:34, à propos de la consolidation des données avant export ; le développeur dit « CSV » à 00:28:51, sur le même sujet. |
| « SRMI », « SERMI », « numéro à Sermi » | numéro ACERMI (certification des isolants) | haute | 00:51:23 : numéro d'identification des matériaux isolants, donnée administrative citée à côté de la marque et de la référence ; 00:52:11 et 00:52:16 : « numéro à Sermi » pour « numéro ACERMI » ; le modèle SRC-04 porte la rubrique « N° ACERMI » à côté de « Marque » et « Référence » ; le fichier nommé « résumé » corrige en ACERMI. Le numéro non nommé de 00:48:58 est le même champ. |
| « C2E », « CEE » | certificats d'économies d'énergie | haute | 00:30:33 ; le pack contient l'attestation d'exclusivité et les engagements complémentaires CEE. |
| « GIR », « groupe ISO ressources » | groupe iso-ressources (grille de perte d'autonomie) | haute pour le sigle | 00:34:29 et 00:40:05–00:40:13 (dossier d'adaptation) ; la glose entendue (un taux d'incapacité) est inexacte, probablement une confusion avec un taux de handicap ; le champ figure sur les captures. |
| « incélévité » | insalubrité | haute | 00:31:57, énumération des trois types de dossier. |
| « imprimant » | imprimé | haute | 00:37:15. |
| « anglet » | onglet | haute | 01:43:59, à propos de l'onglet Travaux ; confirmé par 01:44:03. |
| « imprimes d'écran » | impressions d'écran (captures) | moyenne | 01:44:03–01:44:05, juste après « captures d'écran ». |
| « devises » | devis | haute | 01:10:56 : des données qui partent des devis et de l'audit. |
| « numéro de logis énergétique » | numéro d'audit (numéro ADEME) | faible à moyenne | 00:44:01 ; indices : numéro d'audit ajouté aux formulaires (01:06:45) et numéro ADEME à reporter dans l'attestation (01:39:49). |
| « tickets » | étiquettes (énergétiques) | moyenne | 01:41:26, énumération primaire, finale, GES. |
| « 5x5 », « 5/5 », « taux de TA » | TVA à 5,5 % ; TVA | haute | 02:02:24, 02:02:59, 02:03:30, 02:04:01. |
| « Marama » | MaPrimeRénov' | faible | 02:11:39 ; la forme correcte apparaît à 02:00:38. |
| « mon projet en un » | portail « Mon projet Anah » (migration annoncée vers France Rénov') | moyenne | 01:02:48–01:03:06. |
| « suivi à la parcelle » | suivi du parc de logements ou d'étiquettes | moyenne | 00:47:23–00:47:30, à propos de l'ADEME. |
| « compte de travaux » | poste de travaux | moyenne | 00:43:17. |

Mots non résolus, non retenus : un sigle entendu à 01:43:29 (outil ou module de l'interface de l'Anah ?) et un autre à
02:20:18 (échange sur l'informatique interne). Sigles cherchés dans la réunion et absents : MAR, PO, PIG, EPCI, MDPH,
APA ; ils figurent dans les captures et les modèles du pack.

## 7. Matrice de traçabilité

Statut à l'issue de la phase 0 : aucune exigence n'est encore implémentée. « À implémenter (Ln) » indique le lot de
la phase 1 ; « à confirmer (Qnn) » une question ouverte qui conditionne la reprise ; « piste » un sujet hors
périmètre. Les tests T01 à T26 sont définis au §12. La phase 1 reprend cette matrice avec le statut final de chaque ligne
(implémentée, partielle, non traitée).

| Id | Exigence | Origine | Source | Test prévu | Statut |
|---|---|---|---|---|---|
| E01.1 | Une information saisie une fois alimente tous les documents qui l'utilisent | partenaire | transcript 00:33:12–00:33:43 ; PDF « La fiche unique » | T02, T03, T14 | à implémenter (L2) |
| E01.2 | Documents prioritaires : plan de financement, attestation sur devis, attestation sur factures, demande d'avance, demande d'acompte, plus la synthèse du logement | commanditaire (cadrage, point 1) | cadrage §3.1 ; formulaires 13460*03, 13934*05, 13467*02 ; SRC-04, SRC-05 | T14, T22 | à implémenter (L2) |
| E01.3 | Autres documents du pack : DAP, RFA, CEE, EXC, PRS, PRP, DPE | partenaire | transcript 00:35:49–00:37:17, 01:37:44–01:38:06 ; pack | T14 (par document) | optionnel (L6) |
| E01.4 | Pas de remplissage partiel ; champs manquants signalés « À compléter » | partenaire ; maquette | transcript 00:32:44–00:33:12 ; PDF « Contrôles et signalements » | T07 | à implémenter (L2) |
| E01.5 | Suivi des modifications : surlignage, « Dernière modification », journal daté | maquette | PDF « Le suivi des modifications » ; HTML, fonction `record` | T08 | à implémenter (L2) |
| E01.6 | Message d'équilibre du plan de financement (quatre cas) | maquette | PDF « Plan de financement » | T02, T06 | à implémenter (L2) |
| E01.7 | Scénario de changement d'avis et rétablissement de l'exemple | maquette | PDF « Le changement d'avis du propriétaire » | T03, T04, T05 | à implémenter (L2) |
| E02.1 | Trois types de dossier | partenaire | transcript 00:34:35–00:35:20 | T15 | à implémenter (L3) |
| E02.2 | Plan de financement commun aux trois types, lignes d'adaptation comprises | partenaire ; cadrage point 3 | transcript 00:35:25–00:35:35 ; formulaire 13460*03 ; SRC-06 | T15 | à confirmer (Q05) |
| E02.3 | Liste fine des types de projet reprise comme champ de liste | captures | SRC-08 | T13, T26 | à implémenter (L3) ; à confirmer (Q07) |
| E02.4 | Champs d'adaptation (groupe iso-ressources, invalidité, travaux handicap, subvention de la MDPH) | partenaire ; captures | transcript 00:40:03–00:40:16 ; SRC-07, SRC-06 | T15 | à implémenter (L3) ; à confirmer (Q03) |
| E03.1 | Identifiant stable en ASCII minuscule, jamais déduit du libellé | développeur | transcript 00:38:16–00:38:32 ; catalogue | T12 | à implémenter (L1) |
| E03.2 | Champ retiré marqué obsolète, identifiant jamais réutilisé | développeur ; cadrage | transcript 00:38:16–00:38:32 | T12 | à implémenter (L1) |
| E03.3 | Gestion des versions de formulaires | partenaire | transcript 01:06:41–01:07:15 | — | piste (Q21) |
| E04.1 | Plan Devis saisi au dépôt, figé par « Figer au dépôt » | partenaire ; cadrage suivi point 3 | transcript 00:40:23–00:40:59, 01:25:55–01:27:26 ; SRC-02 | T16, T17 | à implémenter (L4) |
| E04.2 | Plan Factures dupliqué du plan Devis, modifiable | partenaire | transcript 00:41:04–00:41:49 | T17 | à implémenter (L4) |
| E04.3 | Écart devis-factures par poste et au total | développeur ; partenaire | transcript 00:40:59–00:41:03, 00:59:47–01:00:21 ; SRC-02 | T09 | à implémenter (L4) |
| E04.4 | Formules du classeur : total des subventions, reste à charge, solde du projet | commanditaire | feuille « PLAN FINAL » de SRC-02 | T11 | à implémenter (L4) |
| E04.5 | Évaluation énergétique en deux instances (devis, factures) | partenaire | transcript 00:42:48–00:43:34, 02:09:50–02:10:13 | T17 | à confirmer (Q32) |
| E05.1 | Totaux HT et TTC du plan de financement issus de l'onglet Travaux ; HT et TTC saisis par poste | partenaire ; cadrage point 6 | transcript 00:41:52–00:42:28 ; formulaire 13460*03 | T24, T19 | à implémenter (L4) |
| E06.1 | Champs matériau par poste : type, marque, référence, numéro ACERMI, résistance thermique, épaisseur | partenaire | transcript 00:48:58–00:49:05, 00:51:23–00:52:11 ; SRC-04 | T13, T14 | à implémenter (L3) |
| E06.2 | Entreprise : nom et SIRET | partenaire | transcript 00:49:07–00:49:17, 00:57:38–00:57:45 ; SRC-02 | T13 | à implémenter (L3) ; à confirmer (Q12, Q19) |
| E07.1 | Synthèse de l'audit : classes, énergies primaire et finale, GES, surface de référence, scénario, numéro d'audit | partenaire ; modèles | transcript 00:44:06–00:44:17, 01:38:51–01:39:00, 01:39:49–01:40:00 ; SRC-04, SRC-05 | T13, T14 | à implémenter (L3) |
| E07.2 | Date de visite de fin de travaux | partenaire | transcript 00:39:40–00:39:43 ; SRC-03 | T13 | à implémenter (L3) ; à confirmer (Q23) |
| E08.1 | Ratios HT et TTC au m² par catégorie de travaux et par matériau | partenaire ; cadrage point 7 | transcript 00:49:30–00:51:23 | T10, T25 | à implémenter (L5) |
| E09.1 | Cinq onglets en haut, dans l'ordre arrêté | partenaire ; cadrage point 5 | transcript 01:36:39–01:37:33 | T23 | à implémenter (L3) |
| E09.2 | Progression par onglet, lisible par couleur et par texte ou symbole | partenaire ; développeur | transcript 01:45:09–01:46:55 | T23, T16 | à implémenter (L3) |
| E10.1 | Dernière page de chaque document isolée pour la signature | partenaire | transcript 01:06:26–01:06:41, 01:48:30–01:48:38 | T20 | à implémenter (L2) |
| E10.2 | Production de PDF ou de fichiers Word remplis | partenaire | transcript 00:38:36–00:38:47, 01:03:58–01:04:14 | — | piste (cadrage point 4) |
| E11.1 | Intitulés des aperçus alignés sur les imprimés officiels | maquette | PDF « À CONFIRMER » ; pack | T22 | à implémenter (L2, L6) ; à confirmer (Q21) |
| E12.1 | Liste des dossiers : statut, programme, année, alarme ; filtre par statut | commanditaire | cadrage §3.2, point 3 | T16 | à implémenter (L3) |
| E12.2 | Champs de suivi dans l'onglet de leur capture, hors progression et hors signalements | commanditaire | cadrage §3.2, points 1 et 4 ; SRC-06 à SRC-10 | T16, T26 | à implémenter (L3) |
| E12.3 | « Figer au dépôt » propose la date de dépôt et le statut sans les imposer | commanditaire | cadrage §3.2, point 3 | T16 | à implémenter (L4) ; à confirmer (Q10) |
| NF1 | Persistance locale ; aucune donnée envoyée sur le réseau | commanditaire | cadrage §3.1 | T18 | à implémenter (L1) |
| NF2 | Bandeau « Données fictives » permanent ; indicateur « sensible » sur chaque champ | commanditaire | prompt, règles permanentes | T21, T12 | à implémenter (L1) |
| NF3 | Accessibilité de la maquette : onglets au clavier, zones tactiles de 44 px, focus visible, mouvements réduits | maquette | PDF « Données et fonctionnement » | recette locale (clavier, mobile) | à implémenter (L2, L3) |

## 8. Écarts entre la maquette, les besoins et le pack

Quand deux sources divergent, l'écart est consigné avec les deux références ; il n'est pas tranché ici, sauf quand le
cadrage du commanditaire s'applique.

| N° | Sujet | Source A | Source B | Traitement |
|---|---|---|---|---|
| 8.1 | Nombre d'imprimés | prompt et note de réunion : « 4 à 10 » ; la maquette traite 4 documents (PDF « Objet et périmètre ») | réunion : « quatre ou cinq » selon les situations (00:30:23), puis au moins sept (00:30:35), fourchette de sept à dix (00:33:23) ; le développeur reprend sept (01:24:18, 01:34:59) ; énumération de neuf à dix pièces (01:37:44–01:38:03) ; pack : 12 documents (8 formulaires, 4 modèles) et un classeur | Personne ne dit « 4 à 10 » : le chiffre mêle les 4 à 5 par situation, les 7 à 10 de la réunion et les 4 documents de la maquette. À retenir : au moins 7, jusqu'à 10 environ, le pack en fournissant 12. |
| 8.2 | Contenu propre à chaque type de dossier | cadrage, point 3 : aucun document propre à un type | réunion : l'énergie a nettement plus d'imprimés (00:34:18) dont un volet CEE (00:30:33) ; l'adaptation a son propre rapport (00:34:26–00:34:34) ; rien de propre à l'insalubrité | Cadrage appliqué. Le plan de financement et le rapport de visite finale étant communs (00:35:25–00:35:49), la réunion va dans le sens du choix. Questions Q03, Q05, Q06. |
| 8.3 | Sens de « pré-remplir » | cadrage, point 4 : aperçu à l'écran, PDF en piste | réunion : document édité d'un geste (00:38:40–00:38:47), PDF évité au scan (01:03:58–01:04:14), génération au clic avec dernière page reprise (01:06:26–01:06:41 ; 01:48:30–01:48:38) ; le développeur parle d'afficher les documents (01:11:36) et admet l'absence de transfert vers l'organisme (01:23:32–01:23:51) | Cadrage appliqué ; la génération de PDF est en piste. |
| 8.4 | Onglets | cadrage, point 5 : cinq onglets dans l'ordre arrêté ; plans Devis et Factures dans Financement et Énergie | réunion : onglets Travaux et Financement doublés (devis, factures) (00:42:31–00:42:48), onglet Documents proposé (00:55:00 ; 00:55:59), ordre jamais énoncé hormis Travaux à droite de Financement (00:41:52) | Cadrage appliqué ; l'onglet Documents relève de la gestion documentaire (piste). |
| 8.5 | TVA, HT et TTC | cadrage, point 6 : HT et TTC saisis tous deux, TVA en liste sans calcul | réunion : un montant TTC seul (00:42:10) ou un total HT et TTC (00:42:20) ; le développeur demande si le plan est en hors taxe, sans réponse nette (02:03:55–02:04:01) | Cadrage appliqué ; le plan de financement officiel et les attestations demandent les deux montants. |
| 8.6 | Ratios (E08) | cadrage, point 7 : moyenne simple des prix au m² sur les dossiers saisis, poste sans surface exclu | réunion : (1) la population évoquée est celle des dossiers subventionnés (00:50:56) ; (2) l'usage décrit porte sur le coût global du projet et la part d'aide, pas sur un prix au m² (00:50:01–00:50:34) ; (3) la comparaison se fait dans le temps, sur l'année en cours (00:51:03–00:51:23) ; (4) « prix moyen » (00:49:30) est compatible avec une moyenne simple mais sans unité | Aucun passage ne contredit frontalement la formule. Appliquée telle quelle ; population, filtre par période et usage restent à confirmer en revue (piste de filtre par période et par statut de subvention). |
| 8.7 | Calcul d'aide | cadrage, point 2 : aides saisies, calcul en piste | réunion : estimation de tête (00:50:06–00:50:27) ; le tableur actuel calcule une mensualité de remboursement (01:15:58–01:16:05) ; le classeur contient des tables de taux et de plafonds | Aucune contradiction ; calcul d'aide et de mensualité en piste. |
| 8.8 | Synthèse d'analyse du logement | cadrage, point 1 et maquette : document repris en L2 | pack : aucun formulaire correspondant | Écart consigné (demandé par le cadrage) ; les intitulés de ce document ne peuvent pas être alignés sur un imprimé (T22 s'applique aux documents qui en ont un). |
| 8.9 | Taille de la fiche | maquette : 15 champs fixes et une liste de postes, présentés comme un exemple | catalogue : 251 champs issus des captures, des imprimés et des modèles | La fiche de l'application se déduit du catalogue. |
| 8.10 | Aides et prêts | maquette : un total d'aides, un prêt | captures, formulaire 13460*03 et classeur : aides par financeur, plusieurs prêts | Question Q11. |
| 8.11 | Entreprise | maquette : une entreprise par dossier | classeur et formulaire 13467*02 : une entreprise par poste, jusqu'à quatre | Question Q12. |
| 8.12 | Identité et année de construction | maquette : un champ « nom » ; année exacte | captures : « nom et prénom », année en tranche ; formulaires : nom, prénom et civilité séparés | Questions Q16 et Q17. |
| 8.13 | Statut au dépôt | cadrage, suivi point 3 : passage à « Déposé » | capture : la liste propose le verbe « Déposer » | Question Q10. |
| 8.14 | Types de projet | cadrage : trois types de dossier | captures : dix types de projet ; formulaire 12711*08 : nature des travaux souhaités | Champ de liste distinct du type de dossier (question Q07). |
| 8.15 | Surface | prompt (E06) : la surface figure parmi les champs matériau | réunion : la surface est déjà saisie aujourd'hui et n'est pas un manque (00:49:05) ; maquette : surface habitable | Le catalogue porte la surface du poste (SRC-10) et la surface habitable du logement. |
| 8.16 | Mentions « résumé seul » du prompt | prompt : entreprise (nom, SIRET) et date de visite de fin de travaux « résumé seul » | réunion : ces éléments sont dits (00:49:07 ; 00:57:38 ; 00:39:40) | Mentions levées ; le lien de la date avec le rapport final et le carnet reste « résumé seul » (Q23). |
| 8.17 | Éléments de E07 | prompt : surface de référence et gain de classes | réunion : ni l'un ni l'autre n'est cité ; modèles SRC-04 et SRC-05 : les deux figurent dans la synthèse de l'audit | Repris du pack, origine « pack ». |
| 8.18 | Version des formulaires | pack : cinq formulaires portent des éditions de 2008 à 2018 avec le vocabulaire d'un ancien programme ; deux autres (avance, engagements complémentaires) et les modèles d'attestation sont de 2024 et parlent du parcours accompagné | réunion : les formulaires sont stables depuis début 2024, sauf l'ajout du numéro d'audit mi-2025 (01:06:41–01:07:15) | Question Q21. |
| 8.19 | Classeur | modèle E04 : plans Devis et Factures, écart | classeur : trois scénarios, suivi de trésorerie par étapes, calculateurs de surfaces | Non repris (question Q29). |
| 8.20 | Comptes rendus automatiques | note de réunion et résumés : données réécrites « jusqu'à sept fois » ; besoins ajoutés | réunion : dix fois (01:50:03–01:50:10) ; besoins non entendus (§4.3) | Le transcript fait foi. |
| 8.21 | Format du SIRET | modèles d'attestation : « 13 chiffres » | un SIRET compte 14 chiffres ; la maquette ne contrôle aucun format | Question Q19. |
| 8.22 | Détail d'affichage du journal | PDF, « Limites » : un trait de séparation apparaît aussi entre les lignes de détail d'une même entrée | HTML, ligne 136 : la règle `.journal li` s'applique aussi aux éléments de liste imbriqués créés à la ligne 435 | Cause identifiée au code ; à ne pas reproduire en phase 1 (source-audit.md). |
| 8.23 | Répercussion automatique et plan figé | développeur : toute modification se répercute sur l'ensemble des onglets (01:11:56–01:12:21 ; 01:23:32–01:23:49) | partenaire : figer le plan de départ et ne modifier qu'une copie (01:25:55–01:27:26) | Le développeur admet un raisonnement par phases (01:26:41–01:26:52) ; l'action « Figer au dépôt » en est la traduction (E04). |
| 8.24 | Identifiants de compte du dossier par étape | SRC-01 : zones identifiant et mot de passe d'un compte | cadrage : données fictives stockées dans le navigateur | Aucun mot de passe n'est stocké, même fictif (question Q30). |
| 8.25 | Accord sur les couleurs de progression | développeur : dégradé de couleurs (01:45:09–01:45:24) | partenaire : un interlocuteur du partenaire le juge plutôt intéressant (01:45:24–01:45:30) ; réponse inintelligible à 01:48:55–01:49:08 | Pas d'accord net ; le dégradé est repris avec un texte ou un symbole. |
| 8.26 | Navigateurs | PDF, « Données et fonctionnement » : maquette contrôlée sous Chromium seulement | cadrage : application de bureau | Autres navigateurs à confirmer (question Q33 ; source-audit.md). |
| 8.27 | Champs obligatoires des formulaires | prompt : champs requis par document, section « Contrôles et signalements » pour les quatre documents de la maquette | pack : aucun PDF ne marque de champ obligatoire | Proposition au catalogue (colonne « requis par »), question Q14. |

## 9. Pistes hors périmètre

Ces sujets ne sont pas traités en phase 0 ni en phase 1. Quand une demande voisine paraît évidente, une question est
ouverte et le travail continue.

- **Gestion des utilisateurs, des permanences, des programmes et des EPCI** comme entités : elle reste dans l'interface
  actuelle du partenaire (cadrage, suivi point 5). Les comptes individuels de l'interface actuelle (01:35:28–01:35:43)
  sont un besoin de multi-utilisateurs non formulé.
- **Export des champs de suivi** vers l'interface actuelle, pour limiter la double saisie (cadrage, suivi point 6) ;
  aucun format d'échange ni API n'est supposé. La vigilance sur la consolidation des données avant un export en fichier
  plat (00:43:34) s'y rattache.
- **Calcul d'aide, de taux, de plafond ou de mensualité.** Le classeur SRC-02 contient des tables de taux et de plafonds,
  non reprises ; le tableur actuel calcule une mensualité (01:15:58–01:16:05) ; le développeur évoque la valeur verte
  (01:16:07–01:16:24).
- **Production de PDF ou de fichiers Word remplis** à partir des formulaires officiels et des modèles (attendue par le
  partenaire, 00:38:36–00:38:47 ; 01:03:58–01:04:14 ; 01:06:26–01:06:41) ; gestion des versions de formulaires
  (01:06:41–01:07:15).
- **Lecture automatique (OCR, IA)** des devis et factures, reconnaissance du type de pièce, pré-remplissage par scan
  (00:53:37–00:57:06) ; le développeur la reporte après le premier jet (00:57:06) ; double revue humaine évoquée
  (01:11:03–01:11:29).
- **Arborescence de gestion documentaire**, stockage des pièces par dossier (00:55:24–00:56:17), carnet d'information du
  logement (00:46:35–00:48:24) et outil de centralisation documentaire du développeur (01:28:18–01:31:15).
- **Signature électronique** (01:04:56–01:06:22), freinée par la méfiance des ménages (01:04:31–01:04:55).
- **Échange avec la plateforme de l'Anah ou avec l'interface actuelle** : envoi évoqué (01:10:28), puis absence de transfert
  constatée (01:23:32–01:23:51) ; plateforme en panne, migration annoncée, double authentification
  (00:36:33–00:36:48 ; 01:02:48–01:03:35). **Passerelle avec le logiciel d'audit** : souhaitable, mais l'extraction du PDF
  est malaisée (01:38:18–01:41:17).
- **Calcul et vérification de la TVA**, règles de changement d'entreprise (01:20:32–01:21:27 ; 02:01:55–02:06:30).
- **Hébergement, comptes et droits d'accès** : la V1 reste sur données fictives dans le navigateur, jusqu'à une
  décision distincte d'hébergement et de conformité.
- **Scénarios 1 à 3, suivi de trésorerie par étapes et calculateurs de surfaces** du classeur SRC-02 (question Q29).
- **Contrôles de format** (SIRET à 14 chiffres, année, date) : la maquette n'en fait aucun (question Q19).
- **Texte enrichi** pour les observations (question Q20).
- **Filtre des ratios** par période et par statut de subvention (écart 8.6).
- **Mandat administratif rémunéré** (01:01:39–01:02:30), **alerte sur les matériaux inadaptés au bâti ancien**
  (01:19:39–01:20:01) : pratiques du partenaire, pas des demandes à l'outil. Proposer l'outil à d'autres structures
  (02:21:12–02:21:22) : sujet futur.

## 10. Questions ouvertes

Les 33 questions sont aussi des `verificationQuestions` de `suivi-chantier.json` (statut `open`). Le minimum exigé
par le prompt y figure : les affectations de champs aux types laissées « à confirmer » (Q03, Q04, Q15, Q22, et Q07 et
Q11 pour des champs voisins), l'absence de document propre à l'insalubrité (Q06) et les valeurs de listes rendues
génériques (Q08). La correspondance avec les valeurs réelles figure dans le compte rendu de fin de phase seulement.

| Id | Question | Impact | Prochaine action |
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

## 11. Ordre proposé des documents de L6

Critères : valeur exprimée par le partenaire dans la réunion ; part des champs déjà présents dans la configuration après
L2 à L5 (champs partagés avec un document prioritaire) ; poids du document en champs propres. L'ordre est une
proposition, à valider en revue de la phase. Chaque document s'ajoute par des lignes de configuration, un par un.

| Rang | Document | Champs (partagés / propres) | Raison |
|---|---|---|---|
| 1 | Demande d'aide, propriétaire occupant — formulaire 12711*08 (DAP) | 44 (22 / 22) | Imprimé papier fréquent tant que la plateforme de l'Anah dysfonctionne ; ressaisie d'environ dix minutes (00:35:49–00:37:17). Le plus lourd, mais le plus attendu. |
| 2 | Rapport de fin d'accompagnement — SRC-03 (RFA) | 19 (13 / 6) | Rapport de fin des travaux et carnet d'information (00:45:22–00:48:24) ; porte la date de visite de fin de travaux (Q23). |
| 3 | Engagements complémentaires CEE (CEE) | 7 (6 / 1) | Certificats d'économies d'énergie cités dans la réunion (00:30:33) ; presque entièrement couvert. |
| 4 | Attestation d'exclusivité du professionnel (EXC) | 9 (7 / 2) | Même nature que les attestations ; presque entièrement couvert. |
| 5 | Procuration pour signer les engagements — formulaire 13462*01 (PRS) | 15 (10 / 5) | Cités par le partenaire dans la liste des pièces (01:37:44–01:38:06) ; à faire avec le rang 6, qui partage le bloc d'identité du mandant. |
| 6 | Procuration pour la perception des fonds — formulaire 13463*02 (PRP) | 15 (10 / 5) | Voir rang 5. |
| 7 | Dossier par étape — SRC-01 (DPE) | 21 (4 / 17) | Modèle du partenaire hors formulaires officiels ; le moins partagé ; comporte des zones d'identifiant et de mot de passe (Q30). |

Si la demande papier du partenaire n'est pas la priorité, les rangs 3 et 4 (les moins coûteux) peuvent passer devant.
Chaque document non traité reçoit le statut « non traité » dans la matrice de la phase 1.

## 12. Plan de la phase 1

Phase 1 : branche `feat/saisie-unique-phase-1`, démarrée seulement après un événement `start` enregistré par le
commanditaire dans AVEREO Projet. Les lots se suivent dans l'ordre ; chacun s'achève par `npm test` et `npm run build`
réussis avant le suivant ; une seule PR, actualisée à chaque lot. L6 est optionnel : on s'arrête dès qu'un lot échoue
ou que la liste est épuisée.

| Lot | Contenu | Exigences | Tests | Questions à trancher avant le lot |
|---|---|---|---|---|
| L1 Socle | Sous-projet créé depuis le gabarit ; module de configuration alimenté par le catalogue (champs avec identifiants stables, groupes, documents, types de dossier) ; store Zustand ; persistance locale ; bandeau « Données fictives » | E03, NF1, NF2 | T12, T13 (socle), T18, T21 | Q01 |
| L2 Reprise de la maquette | Fiche unique ; cinq documents prioritaires et synthèse du logement en aperçus aux intitulés des imprimés ; suivi des modifications ; signalements ; message d'équilibre ; scénario de changement d'avis et rétablissement ; dernière page de chaque document isolée | E01, E03, E10, E11 | T01 à T08, T14, T19, T20, T22 | Q14, Q17, Q18 |
| L3 Dossiers, types et suivi | Liste de dossiers (créer, ouvrir, supprimer, filtrer par statut ; statut, programme, année, alarme) ; trois types ; cinq onglets en haut ; champs de suivi dans leur onglet ; champs matériau, entreprise et énergie ; progression par onglet hors champs de suivi | E02, E06, E07, E09, E12 | T08, T13, T15, T16, T18, T23, T26 | Q03, Q04, Q05, Q07, Q12, Q16, Q19, Q23 |
| L4 Devis et Factures | Plan figé par « Figer au dépôt » ; duplication vers les factures ; écart par poste et au total ; totaux HT et TTC issus de l'onglet Travaux ; formules de la feuille « PLAN FINAL » | E04, E05, E12 | T09, T11, T16, T17, T24 | Q10, Q11, Q32 |
| L5 Ratios | Tableau de bord calculé sur les dossiers saisis, formule exacte documentée et portée par la configuration | E08 | T10, T25 | — |
| L6 Autres documents | Les documents du §11, un par un, par des lignes de configuration | E01.3, E11 | T13, T14, T22 pour chaque document | Q21 |

Livrable `docs/01-developpement-local.md` : résultat de `npm ci`, `npm test` et `npm run build` ; matrice de traçabilité
mise à jour (statut de chaque exigence et de chaque document du pack : implémentée, partielle, non traitée) ; section
« Choix techniques » ; tableau de recette locale R01… (étapes, résultat attendu, résultat obtenu, date, exécutant) qui
couvre le lancement, la saisie unique vers les documents, le changement d'avis, le devis figé et la facture, les trois
types, les ratios, le rechargement, le clavier et l'affichage mobile, avec commandes et URL locales ; les résultats sont
remplis par le commanditaire.

Critères de sortie de la phase 1 : les trois commandes réussissent ; tous les tests de référence passent ; chaque ligne
de la matrice a un statut ; les contrôles de confidentialité ne renvoient rien ; la description de la PR passe
`check-pr-policy.py --allow-unchecked`.

### Tests de référence de la phase 1

Les valeurs viennent de la maquette, du transcript (01:00:00) et du classeur ; elles sont fictives. Les messages sont
ceux de la maquette. Aucune valeur d'un dossier réel ne sert de cas de test.

| Test | Contenu | Lot |
|---|---|---|
| T01 | Postes de départ : Isolation des combles 3 200 € ; Remplacement des fenêtres 6 800 € ; Ventilation mécanique 2 400 € ; total des travaux 12 400 € | L2 |
| T02 | Financement de départ : apport 2 000 € + aides 4 500 € + prêt 5 900 € = 12 400 € ; message « ✓ Plan équilibré : le total financé couvre le coût des travaux » ; avance demandée 3 000 € | L2 |
| T03 | Changement d'avis : poste 2 « Remplacement des fenêtres (variante bois) » à 8 100 € ; total 13 700 € ; message « ! Reste à financer : 1 300 € » ; demande d'avance à coût total 13 700 € et avance de 3 000 € inchangée | L2 |
| T04 | « Revenir au choix initial » restaure l'état de départ ; le journal note « Retour au choix initial » | L2 |
| T05 | Poste 2 supprimé : le scénario le recrée en deuxième position avant de le modifier | L2 |
| T06 | Autres messages d'équilibre : « ! Le financement dépasse le coût des travaux de X » et « ! Aucun poste chiffré : le plan ne peut pas être équilibré » | L2 |
| T07 | Signalements : surface et observations effacées → « 2 à compléter » sur la synthèse du logement ; les trois autres documents restent « ✓ Complet » | L2 |
| T08 | Journal : frappes successives dans un même champ à moins de 2 500 ms regroupées en une entrée ; 12 entrées affichées, la plus récente en haut ; les champs de suivi y figurent | L2, L3 |
| T09 | Devis et factures : un poste à 300 € au devis et 400 € à la facture donne un écart de +100 € | L4 |
| T10 | Ratios : 1 000 € HT sur 20 m² donne 50 € HT au m² ; avec 3 000 € HT sur 40 m² (75 € HT au m²), la moyenne simple vaut 62,50 € HT au m² ; un poste sans surface n'entre pas dans la moyenne et est compté à part | L5 |
| T11 | Formules de la feuille « PLAN FINAL » : total des subventions = aide de l'Anah + autres primes ; reste à charge = coût des travaux − total des subventions ; solde du projet = reste à charge − (éco-PTZ + autre prêt + apport personnel) ; solde de 0 € au départ de la maquette, de 1 300 € après le changement d'avis | L4 |
| T12 | Intégrité de la configuration : identifiants uniques ; liste des identifiants figée par un test d'instantané ; chaque champ utilisé ou requis par un document existe ; aucun identifiant déduit d'un libellé ; indicateur « sensible » présent sur chaque champ | L1 |
| T13 | Couverture du catalogue : chaque champ « repris de la maquette » ou « nouveau » existe dans la configuration, dans l'onglet du catalogue ; aucun champ « reporté en L6 » n'y figure avant le traitement de son document | L1, L3, L6 |
| T14 | Couverture des documents : pour chaque document traité, chaque champ requis du catalogue existe dans la configuration | L2, L6 |
| T15 | Types : les champs d'un type de dossier sont ceux que le catalogue lui attribue ; les trois types partagent le même plan de financement | L3 |
| T16 | Suivi : la liste se filtre par statut ; « Figer au dépôt » fige le plan Devis sans rien imposer sur le statut ni la date ; modifier un champ de suivi ne change ni la progression d'un onglet ni les signalements | L3, L4 |
| T17 | Devis figé : modifier la facture ne change pas le devis ; l'écart est recalculé | L4 |
| T18 | Persistance : après rechargement, le dossier est identique | L1, L3 |
| T19 | Montants : virgule et espaces acceptés ; arrondi au centime | L2 |
| T20 | Dernière page de chaque document isolée pour la signature | L2 |
| T21 | Bandeau « Données fictives — ne saisir aucune donnée réelle » toujours affiché | L1 |
| T22 | Intitulés des aperçus alignés sur l'imprimé officiel correspondant (d'après le catalogue) | L2, L6 |
| T23 | Onglets dans l'ordre Administratif, Projet, Financement, Énergie, Travaux ; avancement lisible par une couleur et par un texte ou un symbole | L3 |
| T24 | Totaux HT et TTC du plan de financement issus des postes de l'onglet Travaux | L4 |
| T25 | La formule des ratios est portée par la configuration : changer la configuration change le résultat sans toucher au code | L5 |
| T26 | Les champs de suivi sont dans l'onglet de leur capture ; un programme est une simple liste de choix | L3 |

## 13. Choix techniques

Ces choix sont des propositions de la phase 0 ; ils ne sont pas des décisions (que seul AVEREO Projet enregistre) et
s'écartent de la liste du prompt seulement quand une raison est donnée.

- **Pile** : mêmes versions que `architecture-v1/avereo-app-passeport-immo/frontend/package.json`, lu en phase 0 :
  React et React DOM ^18.3.1, Zustand ^5.0.2, Vite ^5.4.11, Vitest ^2.1.9, avec @vitejs/plugin-react ^4.3.4, jsdom ^25.0.1
  et @testing-library/react ^16.1.0. Application statique, sans backend ni base de données. Le script `build` de
  Passeport Immo exécute d'abord `prepare-connect-gate.mjs` (portail CONNECT, hors mission) : le sous-projet n'en
  reprend pas cette étape.
- **Configuration pilotée par les données** : un module unique décrit les champs (identifiant, libellé, onglet, type,
  groupe, liste de choix, types de dossier, caractère sensible), les documents (champs utilisés, champs requis) et les
  types de dossier, d'après le catalogue. Aucun libellé ni aucune liste de champs n'est écrit dans les composants.
  Identifiants en ASCII minuscule, jamais déduits du libellé ni renommés ; un champ retiré est marqué obsolète.
- **Persistance** : `localStorage`, clé `avereo-saisie-unique-dossiers` (dépend de la confirmation du code de
  l'application, question Q01). La maquette n'utilise aucun stockage navigateur (source-audit.md). Aucune donnée n'est
  envoyée sur le réseau.
- **Calculs** : sommes et écarts uniquement (total des postes, total financé, reste à charge, écart devis-facture,
  moyenne des ratios), arrondis au centime ; montants saisis avec virgule et espaces, comme dans la maquette. HT et TTC
  sont deux montants saisis par poste ; la TVA est une liste de choix sans calcul.
- **Polices** : la maquette charge Montserrat et Source Sans 3 depuis Google Fonts (HTML, lignes 4 à 6 : deux
  `preconnect` et une feuille de style). Chaque affichage envoie alors à ce service tiers l'adresse IP et les
  informations du navigateur de l'utilisateur, même si les données du dossier restent locales : cela contredit l'engagement
  « aucune donnée n'est envoyée sur le réseau » dès qu'une page est ouverte sur un poste réel. Proposition : embarquer
  les deux familles dans la construction (fichiers servis par l'application, licence SIL Open Font), avec les polices
  système en secours comme dans la maquette. Conséquence : aucune requête vers un tiers ; le paquet grossit des fichiers de
  police. À valider en revue.
- **Interface** : en français, charte AVEREO V2.0 de la maquette (bleu #002B45, orange #FF6600), accessibilité de la
  maquette conservée (onglets au clavier, zones tactiles de 44 px, focus visible, mouvements réduits sur demande). L'état
  d'avancement d'un onglet se lit par une couleur et par un texte ou un symbole.
- **Documents** : aperçus à l'écran dont les intitulés suivent l'imprimé officiel ; pas de PDF ni de fichier Word.

Écart avec la liste du prompt : aucun à ce stade.

## 14. Contrôles de confidentialité

Contrôles de la règle 3, exécutés le 21/10/2026 en fin de phase 0, avant le commit. Le motif de recherche n'est écrit dans
aucun fichier du dépôt. Résultat attendu : aucune ligne.

| Contrôle | Commande (motif non reproduit) | Résultat |
|---|---|---|
| Contenu | recherche `git grep -n -i -w --untracked` du nom du partenaire | aucune ligne |
| Noms de fichiers | `git ls-files --cached --others --exclude-standard`, filtré sur le nom du partenaire | aucune ligne |
| Historique | `git log --all --format=%B`, puis `git branch -a`, filtrés sur le nom du partenaire | aucune ligne |
| Import | `git ls-files` sur le dossier d'import | aucune ligne ; `git check-ignore` confirme que le dossier est ignoré |

Aucune occurrence antérieure à la mission n'a été trouvée : rien à signaler sur ce point.

Contrôles complémentaires, également sans résultat :

- les noms, adresses, téléphones, courriels, numéros d'identification et codes postaux relevés sur les captures du pack ne
  figurent dans aucun livrable ;
- aucun chemin absolu propre à un poste (Windows, macOS ou Linux) dans un fichier suivi par git : le chemin du générateur
  mutualisé n'existe que dans `.local/review-settings.json`, ignoré par git (`git check-ignore` le confirme, comme pour
  `docs/.review-backups/`) ;
- les citations du transcript sont des reformulations rattachées à un horodatage ; aucune suite de cinq mots consécutifs
  n'est reprise telle quelle ;
- les montants cités sont des valeurs de référence fictives du prompt ;
- les valeurs de listes qui nommaient un acteur réel sont rendues génériques (« le partenaire », « Programme A »,
  « Territoire A », « Espace conseil public ») ; la correspondance figure dans le compte rendu de fin de phase, pas dans le dépôt ;
- les pièces du pack sont désignées par leur alias `SRC-nn` ; la correspondance avec les noms de fichiers figure dans le
  compte rendu de fin de phase, pas dans le dépôt.
