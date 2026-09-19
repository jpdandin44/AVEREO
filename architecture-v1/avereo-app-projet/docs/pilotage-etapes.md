---
project: avereo-app-projet
document_type: pilotage-derive
title: Étapes et risques du pilote AVEREO
status: active
version: git
created: 2026-09-19
updated: 2026-09-19
owner: jpdandin
tags:
  - projet
  - pilote
  - recette
  - risques
---

# Étapes et risques du pilote AVEREO

Document généré depuis [data/planning-pilote.json](../data/planning-pilote.json) par
[le générateur](../workflows/generer-planning-pilote.mjs). Ne pas le modifier manuellement.
Depuis `frontend/`, exécuter `npm.cmd run generate:planning` pour régénérer les dérivés
et `npm.cmd run check:planning` pour vérifier leur concordance.

## Sources et règles de suivi

Le Markdown utilisateur de l’audit et la référence humaine du planning demeurent
les références de périmètre. Le JSON applicatif est leur projection maintenue pour
les six lots ; ce document et les fichiers sous `data/generated/` sont dérivés.
Les documents utilisateur sont identifiés ci-dessous et ne sont pas embarqués dans l’application.

- **AUDIT** — `AVEREO_Audit_Evolutions_Synchro_Philippe_2026-09-17_V1.0.md` : Source documentaire utilisateur ; spécifications §6–11, EV §13, recette §16, pilote §17, DA §18, références §19–20.
  Empreinte SHA-256 : `e0680859081b04741a186d82093e8b5a0bba0ac32b989b6fc443d34839c0ecd6`.
- **PLAN** — `architecture-documentation-avereo/docs/planning-execution.md` : Référence humaine de la proposition séquencée ; périmètre §2, capacité/réserve §3, EV §4, DA §5, AT et GO §6.
- **PLAN-JSON** — `architecture-documentation-avereo/data/planning-execution.json` : Source structurée du scénario : 21 tâches, 12 décisions, 12 recettes et backlog d’origine.

Les références T/A/H/G/W se résolvent dans les annexes §19–20 de l’audit.
Les étapes EV détaillent les enveloppes existantes ; les décisions DA et les recettes AT
n’ajoutent ni charge ni nouvelles dates au calendrier. Chaque AT possède une seule
fiche de résultat, même lorsqu’il est cité par plusieurs EV. EV-14-B rassemble les
preuves et demande de rejouer les cas affectés sur la version candidate.

EV-14, EV-16 et EV-18 restent chacune découpées en A/B sans double comptage.
Les deux essais EV-18-A suivent le Markdown de l’audit §17 et le planning §2 ;
la fiche historique du registre n’en mentionnait qu’un. Ce choix reste à confirmer
dans l’acceptation du périmètre. La capacité de cinq jours par semaine est confirmée ;
DA-09 demeure ouverte sur les autres paramètres. Les décisions DA-03/04/05 sont
placées en L1 pour leur échéance proposée du 2 octobre avant les actions L2.

Une case réalisée ne vaut pas validation : conserver résultat, preuve, auteur et date.
Une non-applicabilité se motive explicitement ; elle n’est pas un test réussi fictif.
Les étapes proposées ne prouvent aucune EV implémentée ni recette exécutée. Les tests
de l’application Projet sont distincts des recettes AT du pilote CONNECT → Rapport.
Chaque risque porte une probabilité et un impact **proposés, à confirmer**, avec
une justification dans son suivi. Le statut reste « À qualifier », le responsable
« À confirmer », et aucune preuve ni date de revue n’est préremplie.
Ces appréciations sont qualitatives, sans fréquence mesurée ni probabilité statistique.
« Moyenne » signale ici un scénario plausible identifié dont l’exposition ou la
fréquence reste inconnue ; « Élevée » est proposée quand la cause est déjà constatée
ou que la marge du calendrier est très faible. Ce sont des conventions de lecture
proposées pour ce registre, à confirmer avec le responsable.
L’impact « Critique » correspond à une conséquence pouvant bloquer le GO, toucher
les accès, perdre des données ou fausser une conclusion essentielle ; « Majeur »
signale une dégradation de mission, de livrable ou de délai nécessitant un arbitrage.
La justification propre à chaque risque précise l’incertitude et le prochain contrôle.
Ni cette préqualification ni l’avancement ne constituent une validation ou une clôture.
Un changement durable de périmètre doit être décidé et reporté dans les sources
avant de réaligner cette projection. Aucun déploiement n’est autorisé par une case.

## Couverture de la projection

21 tâches EV, 12 décisions DA, 12 recettes AT et 1 réserve : **46 étapes uniques et 20 risques**.

| Lot | Charge (j-p) | Étapes | Risques |
|---|---:|---:|---:|
| L0 — Cadrer et sécuriser | 5 | 12 | 5 |
| L1 — Qualifier et sauvegarder | 5,75 | 11 | 3 |
| L2 — Structurer les preuves | 5,25 | 7 | 4 |
| L3 — Valider et produire | 7 | 11 | 4 |
| RES — Réserve avant pilote | 4,9 | 2 | 2 |
| L4 — Essais et pilote terrain | 1,5 | 3 | 2 |

Total : **29,4 jours-personne**, du 2026-09-21 au 2026-10-30 (dates proposées, capacité 5 j-p/semaine).
Les disponibilités, attentes et décisions peuvent déplacer la réalisation effective.
Les fiches de décision conservent leurs échéances proposées dans leur texte ;
elles ne constituent pas des rendez-vous confirmés ni des jalons recalculés par le moteur.

## L0 — Cadrer et sécuriser

Établir le référentiel et le cadre de mission, préparer les témoins, qualifier les accès et la restauration, puis traiter l’exposition du sas et cadrer la révocation.
Les preuves d’accès et de restauration sont exigées sur l’environnement visé ; une fonctionnalité présente dans le dépôt ne suffit pas. La provision EV-15 reste incluse tant que sa non-applicabilité ou son confinement ne sont pas prouvés et décidés.
Les étapes détaillent l’enveloppe existante de 5 jours-personne ; elles ne constituent pas de nouvelles charges.

### Étapes

#### DA-01 — Périmètre du pilote

**Actions à mener**

Échéance proposée : 2026-09-21 ; elle n’atteste aucune décision prise.
1. Faire accepter le périmètre AVEREO opérateur, CONNECT → Rapport, sans nouveau portail contributif ni ouverture libre.
2. Confirmer le maintien du parcours Expertise et des anciens dossiers, ainsi que les deux essais à blanc retenus malgré la divergence de la fiche EV-18.
3. Consigner décision, auteur, date, raisons et exclusions avant EV-01.

**Résultat attendu**

Périmètre écrit accepté ou refus motivé avant engagement. Aucun arbitrage implicite ; validation des deux essais explicite.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / decisions/DA-01
- PLAN §5 / DA-01
- AUDIT §18 / DA-01 ; références T10; A01

#### DA-09 — Capacité

**Actions à mener**

Échéance proposée : 2026-09-21 ; elle n’atteste aucune décision prise.
1. Conserver le fait confirmé le 19/09 : capacité de cinq jours productifs par semaine.
2. Faire confirmer démarrage, affectations/disponibilités, budget/TJM et réserve de 4,9 j-p ; comparer le central 29,4 à la capacité 30 et à la borne haute 39.
3. Consigner les absences/attentes connues et réarbitrer si la capacité disponible diminue.

**Résultat attendu**

Décision complète datée sur ressources, démarrage, budget et réserve. La capacité seule n’acquitte pas cette décision ; marge centrale de 0,6 j-p explicite et borne haute non couverte.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / decisions/DA-09
- PLAN §5 / DA-09
- AUDIT §18 / DA-09 ; références Hypothèse audit

#### EV-01 — Référentiel et delta du dépôt

**Actions à mener**

Décisions à obtenir avant l’étape : DA-01, DA-09.
1. Comparer PRD, AGENTS, architecture et code au commit retenu pour le lancement ; consigner le delta depuis c6319b9.
2. Dater les décisions historiques remplacées, conserver les principes encore valides et nommer les sources de vérité.
3. Écrire le périmètre CONNECT → Rapport / Visite Globale ; conserver Expertise & Visite technique et les anciens JSON.

**Résultat attendu**

PRD courant et instructions applicables alignés avec la stack réellement retenue ; aucune instruction contradictoire sur le lot. Toute migration Supabase/NestJS reste un arbitrage distinct. Référentiel daté et décision de périmètre retrouvables.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / tasks/EV-01 et backlog/EV-01
- PLAN §4 et §6 / EV-01
- AUDIT §3, 5, 10, 13 / EV-01 ; références A01; H01; G01

#### DA-02 — Mission et limites

**Actions à mener**

Échéance proposée : 2026-09-21 ; elle n’atteste aucune décision prise.
1. Faire arrêter l’objet, les zones incluses/exclues, les limites et les destinataires de la mission.
2. Associer une personne compétente pour vérifier assurance et cadre de confidentialité.
3. Tracer l’arbitrage avant EV-17 et avant toute donnée client réelle.

**Résultat attendu**

Cadre écrit avec décision datée/auteur et limites approuvées. Assurance examinée selon la prestation réelle ; consentement existant non assimilé à une conformité globale.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / decisions/DA-02
- PLAN §5 / DA-02
- AUDIT §18 / DA-02 ; références T04; T05

#### EV-17 — Mission et cadre de confidentialité

**Actions à mener**

Préalables : EV-01.
Décisions à obtenir avant l’étape : DA-02.
1. Rédiger l’objet de mission, les inclusions/exclusions et les destinataires des livrables.
2. Faire examiner le périmètre assuré par la personne compétente ; ne pas déduire une couverture d’un statut ou d’une case de consentement.
3. Définir finalités, accès, conservation active/archivage, suppression, droits des images et conditions de réutilisation/IA avant des données client réelles.

**Résultat attendu**

Mission et politique de confidentialité approuvées avec auteur, date et preuve. Chaque cas pilote dispose d’une information appropriée ; durées justifiées par finalité, droits de réutilisation explicites, limites d’assurance examinées. Aucun accord inventé.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / tasks/EV-17 et backlog/EV-17
- PLAN §4 et §6 / EV-17
- AUDIT §11, 13, 17 / EV-17 ; références T04; T05; A01 §11; W03

#### EV-14-A — Préparer les dossiers témoins et la non-régression

**Actions à mener**

Préalables : EV-01.
1. Sélectionner des dossiers témoins couvrant ancien JSON, Visite Globale et Expertise & Visite technique ; relever les données avant modification.
2. Préparer un cas Air avec choix, observations et photos pour suspension/réactivation, ainsi que les scénarios consentements et source externe indisponible.
3. Réutiliser fixtures et tests existants et préparer la matrice environnement/commit/cas/résultat, incluant téléphone/tablette.
Recette associée : AT-01, AT-02. Les résultats intermédiaires ne valent pas recette finale.

**Résultat attendu**

Jeu de témoins et état de référence identifiés, reproductibles et sans secret. AT-01/AT-02 sont prêts à exécuter ; cette étape de préparation ne déclare ni leur réussite finale ni celle des douze AT.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / tasks/EV-14-A et backlog/EV-14
- PLAN §4 et §6 / EV-14-A
- AUDIT §5, 13, 16 / EV-14 ; références A01 §5/12; G04

#### EV-02 — Qualifier les accès et restaurer un dossier témoin

**Actions à mener**

Préalables : EV-01.
1. Identifier l’environnement et son commit ; parcourir identité hébergée, lancement CONNECT, sauvegarde et reprise Rapport avec deux comptes distincts.
2. Examiner le corps des healthchecks, les limites PHP et la taille réelle des dossiers/pièces ; vérifier les correspondances Drupal/CONNECT sans rapprocher des identifiants numériques seuls.
3. Préparer puis restaurer SQL et fichiers privés d’un dossier témoin dans un environnement isolé ; documenter les commandes et résultats sans secret.
Recette associée : AT-07, AT-12. Les résultats intermédiaires ne valent pas recette finale.

**Résultat attendu**

Procès-verbal daté avec environnement/commit. AT-07 refuse les accès croisés et AT-12 restitue le dossier complet avec médias. Les limites de volume sont mesurées ; si elles sont dépassées, EV-22 doit être réarbitré avant terrain.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / tasks/EV-02 et backlog/EV-02
- PLAN §4 et §6 / EV-02
- AUDIT §10, 11, 13, 16 / EV-02 ; références A01 §10–12; W02

#### AT-07 — Deux utilisateurs et mauvais identifiant

**Actions à mener**

Avant validation, identifier environnement, commit/version, date et cas ; joindre la preuve et le résultat réel.
1. Utiliser deux comptes distincts autorisés pour la recette et des dossiers de propriétaires distincts.
2. Tester lecture et écriture normales, puis requêtes API avec un identifiant de dossier indu ou celui de l’autre compte.
3. Vérifier le refus côté API et les correspondances d’identité sur copie, sans rapprochement par simple égalité numérique d’UID.

**Résultat attendu**

Accès non autorisés refusés dans tous les cas testés ; aucun contenu de l’autre compte révélé ou modifié. Preuve d’environnement/commit et résultats sans identifiants sensibles ni secret.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / acceptance_tests/AT-07
- PLAN §6 / AT-07
- AUDIT §16 / AT-07

#### AT-12 — Restauration indépendante

**Actions à mener**

Avant validation, identifier environnement, commit/version, date et cas ; joindre la preuve et le résultat réel.
1. Sauvegarder un dossier témoin complet avec ses médias et références de propriété.
2. Restaurer SQL et fichiers privés dans un environnement isolé indépendant, puis ouvrir le dossier et chaque pièce.
3. Comparer contenu, liens et médias à la référence ; documenter une procédure reproductible sans secret.

**Résultat attendu**

Dossier témoin complet, médias compris, intacts après restauration. Procédure et preuve datées avec environnement/commit ; copie réellement restaurable avant GO.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / acceptance_tests/AT-12
- PLAN §6 / AT-12
- AUDIT §16 / AT-12

#### EV-15 — Qualifier et fermer les entrées exposées du sas

**Actions à mener**

Préalables : EV-01, EV-02.
1. Inventorier les applications et routes réellement exposées, dont les entrées HTML directes ; tester l’accès anonyme et authentifié.
2. Si un contournement existe, corriger la garde et sa propagation aux consommateurs ou confiner effectivement la route, puis vérifier le refus d’accès direct.
3. Documenter les preuves par environnement. Un retrait de carte CONNECT ne constitue pas un confinement ; une non-applicabilité doit être motivée et décidée.
Recette associée : AT-08. Les résultats intermédiaires ne valent pas recette finale.

**Résultat attendu**

Aucune entrée métier exposée ne contourne le sas sur les cas testés. Les changements de garde atteignent les consommateurs concernés. Correction/confinement prouvé, ou non-applicabilité explicitement justifiée ; jamais de « test réussi » fictif ni retrait automatique de la provision.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / tasks/EV-15 et backlog/EV-15
- PLAN §4 et §6 / EV-15
- AUDIT §11, 13, 16 / EV-15 ; références A01 §6/10/13; W01

#### DA-07 — Révocation

**Actions à mener**

Échéance proposée : 2026-09-25 ; elle n’atteste aucune décision prise.
1. Partir des observations EV-02 et arrêter le délai maximal de révocation acceptable pour le pilote interne.
2. Définir expiration, renouvellement et procédure de coupure urgente avant EV-16-A ; prévoir la preuve finale EV-16-B/AT-08.
3. Si immédiateté ou tiers sont exigés, décider du contrôle central et des droits avec réestimation du périmètre.

**Résultat attendu**

Délai chiffré explicitement accepté avec auteur/date et procédure d’urgence. Sans acceptation ou si délai réel supérieur, pas de GO sur ce périmètre.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / decisions/DA-07
- PLAN §5 / DA-07
- AUDIT §18 / DA-07 ; références A01 §4; W01

#### EV-16-A — Cadrer et tester la révocation selon le délai approuvé

**Actions à mener**

Préalables : EV-02.
Décisions à obtenir avant l’étape : DA-07.
1. Observer durée du cookie métier, expiration, renouvellement et comportement après révocation d’un lancement CONNECT.
2. Faire fixer dans DA-07 le délai maximal accepté pour le pilote interne et la procédure d’urgence.
3. Identifier les corrections à appliquer en EV-16-B. Si une révocation immédiate ou une ouverture à des tiers est exigée, faire réarbitrer le contrôle central et les droits avant de poursuivre ce périmètre.
Recette associée : AT-08. Les résultats intermédiaires ne valent pas recette finale.

**Résultat attendu**

Politique datée comportant délai maximal chiffré, modalités de renouvellement et procédure d’urgence ; observation initiale tracée. Aucune promesse de révocation immédiate. La preuve complète AT-08 reste à obtenir après EV-16-B.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / tasks/EV-16-A et backlog/EV-16
- PLAN §4 et §6 / EV-16-A
- AUDIT §11, 13, 18 / EV-16 ; références A01 §4; W01

### Registre des risques

#### R-L0-01 — Référentiel historique contradictoire

**Cause :** Le PRD historique décrit Supabase/RLS alors que le dépôt audité porte PHP/MySQL/Drupal ; le code peut évoluer avant le lancement.

**Conséquence :** Travail hors périmètre, réécriture inutile ou consignes incompatibles avec les applications existantes.

**Préqualification proposée (à confirmer) :** probabilité Élevée ; impact Majeur ; statut À qualifier.

**Responsable :** À confirmer.

**Prévention**

Comparer PRD/AGENTS/code au commit de lancement dans EV-01 ; dater les décisions remplacées et faire accepter DA-01.

**Réaction si le risque survient**

Suspendre la consigne contradictoire, faire trancher la source applicable et réévaluer l’effort avant implémentation.

**Suivi :** Préqualification proposée, à confirmer : probabilité Élevée car la divergence PRD Supabase/RLS versus PHP/MySQL/Drupal est déjà constatée dans AUDIT §3/5 ; impact Majeur car des consignes contradictoires peuvent engager une réécriture et déplacer tout le lot. L’état au lancement reste à comparer au commit audité. À la revue EV-01, identifier les instructions encore actives, attribuer le responsable et réviser la cotation après réalignement.

**Preuve :** Non renseigné.
**Date de revue :** Non renseigné.

**Sources**

- AUDIT §3, §5, §10, §13 / EV-01 ; A01, H01, G01
- PLAN §1 et §4 / delta de dépôt et EV-01

#### R-L0-02 — Entrée métier exposée contournant le sas

**Cause :** Une entrée HTML directe de Projet et des limites de propagation du garde sont signalées ; l’exposition réelle reste à vérifier.

**Conséquence :** Accès à une application en contournant l’accès attendu et fausse impression de confinement.

**Préqualification proposée (à confirmer) :** probabilité Moyenne ; impact Critique ; statut À qualifier.

**Responsable :** À confirmer.

**Prévention**

Inventorier les routes exposées en EV-15 ; tester accès direct anonyme/authentifié et propagation du garde par environnement.

**Réaction si le risque survient**

Corriger puis retester, ou retirer effectivement la route de l’exposition. Maintenir le NO-GO du périmètre concerné ; masquer une carte CONNECT ne suffit pas.

**Suivi :** Préqualification proposée, à confirmer : probabilité Moyenne car une entrée directe et une propagation imparfaite sont signalées dans AUDIT §11/EV-15, mais leur exposition réelle n’est pas établie ; impact Critique si une route exposée permet effectivement de contourner le sas. Aucun incident d’accès n’est affirmé. Qualifier les routes en L0 et joindre les refus d’accès d’AT-08 ; confirmer la cotation ou documenter le confinement/non-applicabilité.

**Preuve :** Non renseigné.
**Date de revue :** Non renseigné.

**Sources**

- AUDIT §11 et §13 / EV-15 ; A01 §6/10/13, W01
- PLAN §4 / condition EV-15 ; §6 / AT-08

#### R-L0-03 — Accès croisé ou mauvaise correspondance de propriétaire

**Cause :** Identités historiques Drupal et CONNECT à rapprocher sur copie ; une égalité d’UID numérique ne démontre pas un même propriétaire.

**Conséquence :** Lecture ou modification d’un dossier d’un autre compte, ou attribution erronée de données historiques.

**Préqualification proposée (à confirmer) :** probabilité Moyenne ; impact Critique ; statut À qualifier.

**Responsable :** À confirmer.

**Prévention**

Tester deux comptes, mauvais identifiant et contrôles API dans EV-02/AT-07 ; documenter les correspondances avant toute migration.

**Réaction si le risque survient**

Bloquer accès/migration concernés, préserver les preuves et corriger le contrôle ou mapping ; rejouer AT-07 avant GO.

**Suivi :** Préqualification proposée, à confirmer : probabilité Moyenne car les correspondances Drupal/CONNECT doivent être vérifiées sur copie selon AUDIT §11, sans preuve actuelle d’erreur ; impact Critique car un accès croisé ou une attribution à un autre compte constitue un NO-GO selon PLAN §6. Exécuter AT-07 avec deux comptes, relever chaque refus côté API et revoir la cotation après preuve du mapping et des droits.

**Preuve :** Non renseigné.
**Date de revue :** Non renseigné.

**Sources**

- AUDIT §10–11, §16 / propriété historique et AT-07 ; G02
- PLAN §4 et §6 / EV-02, AT-07

#### R-L0-04 — Restauration incomplète ou volume de pièces non supporté

**Cause :** Activation/restauration hébergées non prouvées et médias potentiellement volumineux dans le JSON ; limites PHP à mesurer.

**Conséquence :** Collecte non récupérable, dossier restauré sans médias ou impossibilité de sauvegarder le cas terrain.

**Préqualification proposée (à confirmer) :** probabilité Moyenne ; impact Critique ; statut À qualifier.

**Responsable :** À confirmer.

**Prévention**

Mesurer les dossiers réels et limites dans EV-02 ; sauvegarder SQL et fichiers privés de façon cohérente puis exécuter AT-12 en environnement isolé.

**Réaction si le risque survient**

Maintenir le NO-GO sans copie restaurable ; corriger la procédure. Si le volume dépasse les limites, réarbitrer EV-22 avant terrain avec charge/délai explicites.

**Suivi :** Préqualification proposée, à confirmer : probabilité Moyenne car restauration et limites réelles de volume ne sont pas qualifiées dans AUDIT §11 et PLAN §4 ; impact Critique en cas de dossier ou médias non récupérables, condition bloquante du GO. Aucune fréquence de panne n’est connue. Mesurer la volumétrie et réaliser AT-12 ; revoir la cotation avec la preuve de restauration et décider si EV-22 devient nécessaire.

**Preuve :** Non renseigné.
**Date de revue :** Non renseigné.

**Sources**

- AUDIT §11, §13, §16 / EV-02, EV-22, AT-12
- PLAN §4 / déclencheur volumétrie ; §6 / restauration

#### R-L0-05 — Mission, confidentialité ou droits non approuvés

**Cause :** Consentements photo/dictée existants insuffisants pour établir finalités, conservation, réutilisation et périmètre assuré.

**Conséquence :** Données client ou images utilisées hors du cadre convenu et mission présentée avec des garanties non établies.

**Préqualification proposée (à confirmer) :** probabilité Moyenne ; impact Majeur ; statut À qualifier.

**Responsable :** À confirmer.

**Prévention**

Faire arrêter DA-02 puis EV-17 avec les personnes compétentes ; documenter mission, destinataires, droits et durées par finalité.

**Réaction si le risque survient**

Ne pas utiliser de données client réelles tant que le cadre manque ; restreindre au jeu synthétique et faire approuver les points ouverts avant terrain.

**Suivi :** Préqualification proposée, à confirmer : probabilité Moyenne car les consentements existants ne couvrent pas à eux seuls les points encore ouverts de mission, conservation et réutilisation (AUDIT §11/EV-17) ; impact Majeur car ces lacunes peuvent interdire l’usage de données client et invalider la portée annoncée de la prestation. Aucune non-conformité juridique particulière n’est déclarée. Faire examiner DA-02/EV-17 par les personnes compétentes, identifier le responsable et conserver l’approbation ou les restrictions avant de réévaluer.

**Preuve :** Non renseigné.
**Date de revue :** Non renseigné.

**Sources**

- AUDIT §11, §13, §17–18 / EV-17, DA-02
- PLAN §5–6 / mission et cadre avant GO


## L1 — Qualifier et sauvegarder

Qualifier demande et délégation sans remplacer l’écoute existante ; formaliser les zones couvertes et les limites, puis fiabiliser sauvegarde et révisions concurrentes.
DA-03, DA-04 et DA-05 figurent ici pour leurs échéances proposées du 2 octobre, avant les EV du lot L2. DA-06 doit précéder EV-04 et reste la référence pour EV-11.
Les décisions et recettes sont des contrôles de l’enveloppe de 5,75 jours-personne, pas des tâches de charge supplémentaires.

### Étapes

#### EV-05 — Qualification de la demande et délégation

**Actions à mener**

Préalables : EV-01.
1. Enrichir l’écoute existante avec nature de demande : pathologie/projet/mixte/à préciser ; et délégation : aucune/partielle/totale/à préciser.
2. Recueillir zones concernées, horizon et résultat attendu, puis permettre confirmation sur place et correction explicite.
3. Conserver les champs historiques et ne déduire ni profil ni droits d’accès depuis le texte libre ou la délégation.

**Résultat attendu**

Deux axes indépendants et révisables. Chaque pilote est qualifié ou explicitement « à préciser » ; ancien dossier lisible sans classification inventée. Une modification reste traçable dans la restitution.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / tasks/EV-05 et backlog/EV-05
- PLAN §4 et §6 / EV-05
- AUDIT §6, 13 / EV-05 ; références T01; T05; G06

#### EV-06 — Périmètre de visite et zones exclues

**Actions à mener**

Préalables : EV-05, EV-17.
1. Saisir objet, zones incluses/exclues, limites d’accès et vérifications ultérieures.
2. Distinguer observé, déclaré, non observé, non accessible et hors mission ; conserver les observations d’une phase non retenue.
3. Tracer tout changement de périmètre et réouvrir la revue du livrable ; vérifier une mission cave et un cas mixte projet/pathologie.
Recette associée : AT-03. Les résultats intermédiaires ne valent pas recette finale.

**Résultat attendu**

Dans AT-03, seules les zones couvertes sont présentées comme contrôlées. Les exports indiquent mission, exclusions et inconnues ; aucune observation existante effacée. Tous les rapports pilotes explicitent leur couverture.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / tasks/EV-06 et backlog/EV-06
- PLAN §4 et §6 / EV-06
- AUDIT §6, 13, 16 / EV-06 ; références T04; A01 §5

#### AT-03 — Mission cave uniquement

**Actions à mener**

Avant validation, identifier environnement, commit/version, date et cas ; joindre la preuve et le résultat réel.
1. Créer une mission limitée à une cave, avec autres pièces/toit hors mission et une zone non accessible.
2. Parcourir saisie, analyse et restitution disponibles ; vérifier les états observé/déclaré/non vu/hors mission.
3. Rejouer la vérification sur les exports finaux lors d’EV-14-B.

**Résultat attendu**

La cave seule est couverte ; aucune zone non vue n’est présentée comme contrôlée. Les limites restent visibles dans rapport et synthèse ; observations anciennes conservées.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / acceptance_tests/AT-03
- PLAN §6 / AT-03
- AUDIT §16 / AT-03

#### EV-03 — Afficher les états de sauvegarde et de reprise

**Actions à mener**

Préalables : EV-02.
1. Afficher états local, en attente, enregistré serveur et échec, avec date du dernier succès réel.
2. Conserver le brouillon pendant coupure réseau, expiration de session et rechargement ; proposer une reprise contrôlée.
3. Faire distinguer sauvegarde navigateur et serveur par les deux testeurs, sans simuler un succès distant.
Recette associée : AT-05. Les résultats intermédiaires ne valent pas recette finale.

**Résultat attendu**

AT-05 conserve la collecte sur tous les cas du jeu de coupures. Aucune confirmation serveur sans succès réel ; dernier succès daté et erreur visible. Les deux testeurs comprennent l’état et le moyen de reprise.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / tasks/EV-03 et backlog/EV-03
- PLAN §4 et §6 / EV-03
- AUDIT §11, 13, 16 / EV-03 ; références A01 §5; G03

#### AT-05 — Perte réseau et expiration session

**Actions à mener**

Avant validation, identifier environnement, commit/version, date et cas ; joindre la preuve et le résultat réel.
1. Saisir des observations puis couper le réseau avant sauvegarde et vérifier l’état affiché.
2. Refaire avec session expirée, puis recharger et reprendre de manière contrôlée.
3. Comparer brouillon initial, contenu récupéré et dernier succès réellement enregistré côté serveur.

**Résultat attendu**

Saisie récupérable dans chaque cas et zéro perte sur le jeu de coupures. Aucune confirmation serveur simulée ; erreur et dernière réussite réelles visibles.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / acceptance_tests/AT-05
- PLAN §6 / AT-05
- AUDIT §16 / AT-05

#### DA-06 — Révisions

**Actions à mener**

Échéance proposée : 2026-09-30 ; elle n’atteste aucune décision prise.
1. Arrêter le contrat de révision attendue et de refus de conflit avant EV-04.
2. Faire confirmer le snapshot validé immuable, les droits/transitions serveur et la nouvelle revue après correction avant EV-11.
3. Consigner le compromis avec développement et le responsable d’émission.

**Résultat attendu**

Une décision couvre concurrence et validation sans écrasement ni modification de version émise ; responsabilité et preuve de validation définies.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / decisions/DA-06
- PLAN §5 / DA-06
- AUDIT §18 / DA-06 ; références T03; G02

#### EV-04 — Révisions serveur et refus des écrasements

**Actions à mener**

Préalables : EV-02.
Décisions à obtenir avant l’étape : DA-06.
1. Ajouter une révision serveur et une écriture conditionnelle sur la version attendue ; faire valider le contrat utilisable par EV-11.
2. Signaler un conflit explicite lorsqu’une version est périmée, conserver une copie récupérable des deux contenus et proposer la résolution sans fusion silencieuse.
3. Tester deux onglets partant du même dossier et écrire successivement leurs modifications.
Recette associée : AT-06. Les résultats intermédiaires ne valent pas recette finale.

**Résultat attendu**

AT-06 détecte tous les conflits du jeu de recette : seconde écriture refusée comme conflit, deux contenus récupérables, aucun écrasement silencieux. Révision contrôlée côté serveur et contrat documenté pour les snapshots.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / tasks/EV-04 et backlog/EV-04
- PLAN §4 et §6 / EV-04
- AUDIT §10, 11, 13, 16 / EV-04 ; références G02; G03

#### AT-06 — Écriture concurrente depuis deux onglets

**Actions à mener**

Avant validation, identifier environnement, commit/version, date et cas ; joindre la preuve et le résultat réel.
1. Ouvrir la même révision dans deux onglets et effectuer deux modifications différentes.
2. Enregistrer le premier, puis tenter l’écriture du second avec sa révision périmée.
3. Récupérer les deux contenus et documenter la résolution proposée.

**Résultat attendu**

Second enregistrement signalé comme conflit ; première version non écrasée et copie du second contenu récupérable. Aucun abandon ni fusion silencieuse.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / acceptance_tests/AT-06
- PLAN §6 / AT-06
- AUDIT §16 / AT-06

#### DA-03 — Trois grilles

**Actions à mener**

Échéance proposée : 2026-10-02 ; elle n’atteste aucune décision prise.
1. Soumettre à Philippe les grilles pérennité, salubrité et performance/évolution et un exemple de multi-affectation.
2. Faire confirmer leur séparation avec Eau/Air/Terre/Feu, nature d’action, gravité et urgence.
3. Consigner les cas limites et l’accord avant EV-07.

**Résultat attendu**

Décision explicite sur les trois grilles et une alerte urgente indépendante ; exemple validé sans doublon ni effacement.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / decisions/DA-03
- PLAN §5 / DA-03
- AUDIT §18 / DA-03 ; références T08

#### DA-04 — Plan / localisation

**Actions à mener**

Échéance proposée : 2026-10-02 ; elle n’atteste aucune décision prise.
1. Faire approuver le minimum : niveaux/zones textuels et croquis ou plan joint annoté.
2. Confirmer le report de l’éditeur interactif, CAO et 3D pour tenir le scénario, sans supprimer les liens aux preuves.
3. Tracer l’arbitrage avant EV-09.

**Résultat attendu**

Minimum fonctionnel accepté ; utilisation sans plan prévue. Toute extension interactive exige un réarbitrage de capacité, sans engagement implicite.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / decisions/DA-04
- PLAN §5 / DA-04
- AUDIT §18 / DA-04 ; références T02; T04

#### DA-05 — Mesures

**Actions à mener**

Échéance proposée : 2026-10-02 ; elle n’atteste aucune décision prise.
1. Faire valider avec Philippe les protocoles T°/HR manuels, unités, instruments/méthodes et conditions d’interprétation.
2. Distinguer air, matériau et indice d’humidimètre, ainsi que mesuré/déclaré/importé et valeurs inconnues.
3. Tracer l’accord avant EV-08 ; ne créer ni connexion capteur ni seuil physique non validé.

**Résultat attendu**

Vocabulaire et protocole approuvés par le référent identifié. Grandeur/unité/lieu/heure/provenance exigés pour chaque mesure interprétée.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / decisions/DA-05
- PLAN §5 / DA-05
- AUDIT §18 / DA-05 ; références T02; T06

### Registre des risques

#### R-L1-01 — Perte de saisie ou fausse confirmation de sauvegarde

**Cause :** Brouillon navigateur et sauvegarde serveur ne protègent pas contre les mêmes pannes ; réseau/session peuvent interrompre l’écriture.

**Conséquence :** Collecte perdue ou utilisateur convaincu à tort qu’une copie serveur existe.

**Préqualification proposée (à confirmer) :** probabilité Moyenne ; impact Critique ; statut À qualifier.

**Responsable :** À confirmer.

**Prévention**

Implémenter les états explicites EV-03 avec dernier succès réel ; tester coupure, expiration et rechargement dans AT-05.

**Réaction si le risque survient**

Conserver/exporter le brouillon récupérable, signaler l’échec et reprendre de façon contrôlée ; corriger puis rejouer les cas avant GO.

**Suivi :** Préqualification proposée, à confirmer : probabilité Moyenne car coupure réseau, expiration et différences entre copie locale et serveur sont des scénarios identifiés mais non mesurés sur le terrain (AUDIT §11/AT-05) ; impact Critique si la saisie devient non récupérable, cas de NO-GO PLAN §6. Exécuter le jeu de coupures AT-05, consigner récupération et dernier succès réel, puis réviser la cotation selon les résultats.

**Preuve :** Non renseigné.
**Date de revue :** Non renseigné.

**Sources**

- AUDIT §11, §13, §16 / EV-03, AT-05
- PLAN §4 et §6 / sauvegarde/reprise

#### R-L1-02 — Écrasement concurrent d’un dossier

**Cause :** L’API auditée remplace le payload complet sans révision attendue dans les chemins relus.

**Conséquence :** Une saisie valide remplace silencieusement celle d’un autre onglet et détruit le travail concurrent.

**Préqualification proposée (à confirmer) :** probabilité Moyenne ; impact Critique ; statut À qualifier.

**Responsable :** À confirmer.

**Prévention**

Faire arrêter DA-06 ; ajouter révision serveur/écriture conditionnelle EV-04 et test deux onglets AT-06.

**Réaction si le risque survient**

Refuser l’écriture périmée, conserver les deux contenus et résoudre explicitement ; bloquer le GO si une perte demeure.

**Suivi :** Préqualification proposée, à confirmer : probabilité Moyenne car le remplacement complet sans révision est établi dans les chemins audités G02/G03, mais sa matérialisation dépend d’écritures concurrentes ; impact Critique si l’un des contenus est perdu silencieusement selon AT-06/PLAN §6. Le nombre d’onglets concurrents en usage réel reste inconnu. Éprouver EV-04 avec deux onglets, joindre la récupération des deux contenus et réévaluer après preuve du refus d’écriture périmée.

**Preuve :** Non renseigné.
**Date de revue :** Non renseigné.

**Sources**

- AUDIT §10–11, §13, §16 / EV-04, AT-06 ; G02/G03
- PLAN §4–6 / DA-06 et contrat de révision

#### R-L1-03 — Mission partielle présentée comme inspection complète

**Cause :** Une phase non retenue ou une zone non vue peut être assimilée à tort à une zone contrôlée ; qualification et délégation sont des axes distincts.

**Conséquence :** Conclusion rassurante non justifiée ou mauvaise compréhension de la prestation par le client.

**Préqualification proposée (à confirmer) :** probabilité Moyenne ; impact Majeur ; statut À qualifier.

**Responsable :** À confirmer.

**Prévention**

Mettre en œuvre EV-05/06, conserver « à préciser » et les états observé/déclaré/non vu/hors mission ; tester la mission cave AT-03.

**Réaction si le risque survient**

Corriger le périmètre et la restitution, réouvrir la revue du livrable et refaire AT-03 ; ne pas émettre une conclusion couvrant les zones non visitées.

**Suivi :** Préqualification proposée, à confirmer : probabilité Moyenne car les phases activables ne définissent pas encore à elles seules les états de couverture requis (AUDIT §6/EV-06) ; impact Majeur car une mission partielle pourrait être présentée au client comme un contrôle complet. Aucun rapport erroné réel n’est identifié ici. Faire relire le cas cave AT-03 par le référent métier, vérifier les exports et confirmer la cotation avec les limites effectivement restituées.

**Preuve :** Non renseigné.
**Date de revue :** Non renseigné.

**Sources**

- AUDIT §6, §13, §16 / EV-05, EV-06, AT-03
- PLAN §2 et §6 / limites explicites


## L2 — Structurer les preuves

Structurer des mesures manuelles interprétables et retrouvables, les relier aux zones/croquis, puis aux trois grilles et aux actions sans confondre hypothèse, constat et urgence.
Le minimum reste textuel avec un plan/croquis joint ; éditeur interactif, capteurs et 3D ne sont pas inclus. DA-11 ne déclenche aucune nouvelle intégration : il encadre ou reporte explicitement toute extension.
Les étapes et recettes détaillent les 5,25 jours-personne déjà prévues.

### Étapes

#### DA-11 — Données externes

**Actions à mener**

Échéance : avant toute extension concernée ; date à déterminer.
1. Avant toute extension des sources externes, identifier le service exact, son contrat d’accès, les droits et l’API ; « Go Rénove » reste une correspondance à confirmer.
2. Distinguer données documentaires/simulées et mesures terrain ; ne prévoir aucun import massif sans droits établis.
3. Consigner soit l’arbitrage complet, soit un report explicite hors du pilote sans activer l’extension.

**Résultat attendu**

Fournisseur et droits/API vérifiés avant extension, ou décision explicite de report. Aucune source supposée ni résultat inventé ; la robustesse à l’indisponibilité reste testée par AT-11.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / decisions/DA-11
- PLAN §5 / DA-11
- AUDIT §18 / DA-11 ; références T07; W04

#### EV-08 — Mesures manuelles avec unités et conditions

**Actions à mener**

Préalables : EV-05, EV-06.
Décisions à obtenir avant l’étape : DA-05.
1. Saisir manuellement température et humidité relative intérieur/extérieur avec identifiants stables, valeur, grandeur, unité et horodatage.
2. Associer zone/support, méthode ou instrument, provenance mesurée/déclarée/importée et conditions utiles ; laisser les inconnues explicites.
3. Distinguer HR de l’air, mesure de matériau et indice d’humidimètre ; conserver les champs à l’import/export sans seuil physique inventé.
Recette associée : AT-04. Les résultats intermédiaires ne valent pas recette finale.

**Résultat attendu**

Toute mesure utilisée dans l’analyse porte unité, lieu, moment et provenance. Valeurs/unités inchangées à la reprise ; aucune confusion air/matériau. La localisation complète AT-04 se vérifie après EV-09.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / tasks/EV-08 et backlog/EV-08
- PLAN §4 et §6 / EV-08
- AUDIT §7, 13, 16 / EV-08 ; références T02; T06

#### EV-09 — Zones et croquis joint avec repères

**Actions à mener**

Préalables : EV-08.
Décisions à obtenir avant l’étape : DA-04.
1. Définir niveaux et zones textuelles, joindre un croquis ou plan fourni et numéroter les emplacements.
2. Relier les repères aux observations, photos et mesures ; identifier page/version du support lorsque nécessaire.
3. Vérifier la lecture après redimensionnement et l’usage sans plan. Le scénario minimal conserve le croquis annoté ; l’éditeur interactif, CAO et 3D restent reportés.
Recette associée : AT-04. Les résultats intermédiaires ne valent pas recette finale.

**Résultat attendu**

AT-04 retrouve chaque point sans explication orale ; repères, mesures et photos restent liés et exportables. Sans plan, la localisation textuelle reste suffisante. Aucune surface/longueur déduite d’un plan non étalonné.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / tasks/EV-09 et backlog/EV-09
- PLAN §4 et §6 / EV-09
- AUDIT §7, 13, 16 / EV-09 ; références T02; T04

#### AT-04 — Mesures localisées et unités

**Actions à mener**

Avant validation, identifier environnement, commit/version, date et cas ; joindre la preuve et le résultat réel.
1. Saisir température et HR avec grandeur/unité, horodatage, zone, provenance et méthode ; ajouter un cas d’indice de matériau distinct.
2. Relier le point à un repère/croquis ou à une localisation textuelle complète et à sa photo ; redimensionner le support puis exporter/reprendre.
3. Faire retrouver le point à partir du dossier sans explication orale.

**Résultat attendu**

Valeur, grandeur, unité, moment, lieu et provenance inchangés ; point retrouvable. Aucune confusion HR/indice matériau ni grandeur déduite d’un plan non étalonné.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / acceptance_tests/AT-04
- PLAN §6 / AT-04
- AUDIT §16 / AT-04

#### EV-07 — Trois grilles et catégories d’action

**Actions à mener**

Préalables : EV-05, EV-06.
Décisions à obtenir avant l’étape : DA-03.
1. Conserver Eau/Air/Terre/Feu et ajouter pérennité, salubrité et performance/évolution comme lectures multiples d’un même constat.
2. Qualifier séparément l’action curative/préventive/évolutive ; garder le choix humain et rendre toute règle de suggestion explicable.
3. Tester un constat Eau pertinent pour deux grilles, sans le dupliquer ni effacer la sélection manuelle ou historique.

**Résultat attendu**

Un constat peut contribuer à deux grilles sans doublon. Chaque recommandation renvoie à un constat ou une limite explicite ; nature d’action, priorité et urgence restent distinctes. Données et choix historiques conservés.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / tasks/EV-07 et backlog/EV-07
- PLAN §4 et §6 / EV-07
- AUDIT §8, 13, 18 / EV-07 ; références T01; T08; A01 §5

#### EV-10 — Relier preuves, hypothèses, urgences et actions

**Actions à mener**

Préalables : EV-06, EV-07, EV-08.
1. Séparer observation, déclaration client attribuée, donnée externe datée/sourcée, hypothèse, recommandation et alerte.
2. Relier chaque action à ses preuves, incertitudes, prérequis et responsable proposé ; rendre urgence, priorité et confiance indépendantes.
3. Tester une alerte hors de sa grille habituelle et une source externe indisponible, sans inventer une cause ni conclure à l’absence de risque.
Recette associée : AT-11. Les résultats intermédiaires ne valent pas recette finale.

**Résultat attendu**

Aucune hypothèse présentée comme constat. Toute alerte urgente reste visible quelle que soit sa grille ; 100 % des actions émises sont reliées à un constat ou une incertitude explicite. AT-11 conserve les saisies et signale les résultats externes absents.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / tasks/EV-10 et backlog/EV-10
- PLAN §4 et §6 / EV-10
- AUDIT §8, 13, 16 / EV-10 ; références T08; G04

#### AT-11 — Source externe indisponible

**Actions à mener**

Avant validation, identifier environnement, commit/version, date et cas ; joindre la preuve et le résultat réel.
1. Préparer un dossier avec saisies manuelles puis rendre une source externe indisponible sur l’environnement de recette.
2. Déclencher l’appel et observer le message, les champs et la restitution.
3. Comparer les saisies avant/après et vérifier qu’aucun résultat absent ne devient une conclusion rassurante.

**Résultat attendu**

Indisponibilité explicitement signalée, aucune saisie manuelle effacée et aucun résultat inventé. Source/date/objet et caractère documentaire ou simulé restent distingués lorsque disponibles.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / acceptance_tests/AT-11
- PLAN §6 / AT-11
- AUDIT §16 / AT-11

### Registre des risques

#### R-L2-01 — Mesure non interprétable ou unité confondue

**Cause :** Mesures sans conditions/provenance suffisantes ou confusion entre humidité relative de l’air et indice d’humidimètre.

**Conséquence :** Analyse fondée sur une grandeur incorrecte ou impossible à justifier et comparer.

**Préqualification proposée (à confirmer) :** probabilité Moyenne ; impact Critique ; statut À qualifier.

**Responsable :** À confirmer.

**Prévention**

Faire valider DA-05 puis saisir grandeur, unité, lieu, moment, provenance et méthode via EV-08 ; exécuter AT-04.

**Réaction si le risque survient**

Marquer la mesure à confirmer/non interprétable, compléter ou refaire la mesure selon le protocole validé ; suspendre toute conclusion dépendante.

**Suivi :** Préqualification proposée, à confirmer : probabilité Moyenne car modèle de mesure, protocole et unités restent à structurer/valider (AUDIT §7, DA-05), sans taux d’erreur observé ; impact Critique car une mauvaise grandeur ou unité utilisée dans l’analyse fait partie des critères NO-GO du PLAN §6. Faire valider le protocole et exécuter AT-04, notamment air versus matériau ; revoir la cotation sur les mesures et reprises réellement testées.

**Preuve :** Non renseigné.
**Date de revue :** Non renseigné.

**Sources**

- AUDIT §7, §13, §16 / EV-08, AT-04
- PLAN §2, §5–6 / DA-05

#### R-L2-02 — Preuve impossible à retrouver sur le terrain

**Cause :** Photos et champs pièce seuls ne démontrent pas un repère stable ; plan absent/non étalonné ou liens perdus à l’export.

**Conséquence :** Mesure ou observation non localisable et recommandation difficile à vérifier.

**Préqualification proposée (à confirmer) :** probabilité Moyenne ; impact Majeur ; statut À qualifier.

**Responsable :** À confirmer.

**Prévention**

Appliquer le minimum DA-04/EV-09 : zones textuelles, croquis joint et repères numérotés ; tester liens et redimensionnement dans AT-04.

**Réaction si le risque survient**

Compléter la localisation textuelle et le support, rétablir les liens, puis faire retrouver le point ; ne pas calculer surface/longueur depuis un plan non étalonné.

**Suivi :** Préqualification proposée, à confirmer : probabilité Moyenne car les repères structurés ne sont pas démontrés et un plan peut manquer (AUDIT §7/EV-09) ; impact Majeur car un point non retrouvable affaiblit la preuve et impose une reprise. Aucune fréquence de perte de lien n’est disponible. Faire retrouver chaque point témoin sans explication orale après export/reprise et redimensionnement, puis réviser la cotation avec AT-04.

**Preuve :** Non renseigné.
**Date de revue :** Non renseigné.

**Sources**

- AUDIT §7 et §13 / EV-09
- PLAN §2, §5–6 / DA-04, AT-04

#### R-L2-03 — Hypothèse prise pour un constat ou urgence masquée

**Cause :** Un score ou une grille peut mêler preuve, confiance, priorité et gravité ; donnée absente ou zone non vue parfois interprétée comme absence de risque.

**Conséquence :** Conseil injustifié, alerte urgente invisible ou fausse assurance dans la synthèse.

**Préqualification proposée (à confirmer) :** probabilité Moyenne ; impact Critique ; statut À qualifier.

**Responsable :** À confirmer.

**Prévention**

Conserver des types d’information distincts EV-10 ; faire choisir les grilles EV-07 et garder l’urgence indépendante selon DA-03.

**Réaction si le risque survient**

Rendre l’alerte explicite, rétablir la source/incertitude et réexaminer les actions dépendantes ; refaire la revue avant émission.

**Suivi :** Préqualification proposée, à confirmer : probabilité Moyenne car la chaîne constat/hypothèse/action et l’urgence indépendante restent à renforcer (AUDIT §8/EV-10) ; impact Critique si une hypothèse ou une donnée absente conduit à une conclusion rassurante ou masque une alerte. Cette qualification porte sur la conséquence possible, sans incident métier affirmé. Soumettre les cas limites à Philippe, vérifier les sources et alertes, puis confirmer la cotation lors de la revue des recommandations.

**Preuve :** Non renseigné.
**Date de revue :** Non renseigné.

**Sources**

- AUDIT §8, §13 / EV-07, EV-10 ; invariant
- PLAN §2 et §5 / DA-03

#### R-L2-04 — Source externe indisponible, mal identifiée ou sans droit d’usage établi

**Cause :** Disponibilité des sources non garantie ; service « Go Rénove » probable mais fournisseur/droits/API à confirmer avant extension.

**Conséquence :** Effacement manuel, résultat inventé ou réutilisation d’une donnée simulée comme mesure terrain.

**Préqualification proposée (à confirmer) :** probabilité Moyenne ; impact Majeur ; statut À qualifier.

**Responsable :** À confirmer.

**Prévention**

Conserver les saisies, signaler l’absence et exécuter AT-11 ; arrêter DA-11 avant toute extension et tracer source/date/caractère documentaire.

**Réaction si le risque survient**

Maintenir le résultat absent et utiliser seulement les données autorisées disponibles ; reporter l’extension jusqu’à l’arbitrage des droits.

**Suivi :** Préqualification proposée, à confirmer : probabilité Moyenne car disponibilité des services et identité/droits/API de l’extension restent inconnus (AUDIT §18/DA-11), sans mesure de disponibilité ; impact Majeur car une absence masquée ou un droit non établi peut fausser ou bloquer l’enrichissement du dossier. L’extension demeure conditionnelle. Documenter le report ou l’accord DA-11 et exécuter AT-11 ; réviser après preuve de conservation des saisies et d’absence explicitement signalée.

**Preuve :** Non renseigné.
**Date de revue :** Non renseigné.

**Sources**

- AUDIT §8, §16, §18, §20 / AT-11, DA-11, W04
- PLAN §5–6 / décision conditionnelle et indisponibilité


## L3 — Valider et produire

Appliquer la révocation acceptée, protéger la revue humaine et les versions émises, puis produire DOCX natif, synthèse et PDF cohérents.
EV-14-B consolide les douze recettes, chacune suivie dans une seule étape AT ; toute correction impose la requalification des cas affectés. Les preuves intermédiaires doivent être complétées sur la version candidate.
Ce détail reste dans l’enveloppe de 7 jours-personne ; aucun GO ni livrable approuvé n’est présumé.

### Étapes

#### EV-16-B — Appliquer et éprouver la politique de révocation

**Actions à mener**

Préalables : EV-16-A.
Décisions à obtenir avant l’étape : DA-07.
1. Appliquer les corrections d’expiration et de renouvellement définies après EV-16-A et DA-07.
2. Éprouver révocation, cookie expiré et procédure d’urgence sur les routes réellement exposées ; mesurer le délai effectif.
3. Si le délai dépasse celui accepté, corriger ou maintenir le NO-GO ; requalifier le périmètre si un contrôle central devient nécessaire.
Recette associée : AT-08. Les résultats intermédiaires ne valent pas recette finale.

**Résultat attendu**

AT-08 couvre l’accès direct et la révocation sur le périmètre visé. Délai observé inférieur ou égal au maximum explicitement autorisé ; preuves datées et procédure d’urgence utilisable. Aucune prétention d’immédiateté non prouvée.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / tasks/EV-16-B et backlog/EV-16
- PLAN §4 et §6 / EV-16-B
- AUDIT §11, 13, 16, 18 / EV-16 ; références A01 §4; W01

#### AT-08 — Accès direct / cookie / révocation

**Actions à mener**

Avant validation, identifier environnement, commit/version, date et cas ; joindre la preuve et le résultat réel.
1. Sur chaque application/route exposée du périmètre, tester accès direct anonyme, session valide, cookie expiré et révocation.
2. Mesurer expiration/renouvellement et délai maximal après révocation ; appliquer le scénario d’urgence défini dans DA-07.
3. Comparer à la politique approuvée et conserver les traces après EV-15 et EV-16-B.

**Résultat attendu**

Sas imposé sur les routes exposées et délai observé ≤ maximum accepté. Confinement effectif prouvé si retenu. Tout écart ou besoin d’immédiateté non satisfait bloque le GO ; aucune preuve partielle assimilée au scénario complet.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / acceptance_tests/AT-08
- PLAN §6 / AT-08
- AUDIT §16 / AT-08

#### EV-11 — Revue humaine et révision validée immuable

**Actions à mener**

Préalables : EV-04, EV-06, EV-07, EV-10.
Décisions à obtenir avant l’étape : DA-06.
1. Implémenter les états brouillon → à revoir → validé → publié avec transitions et droits contrôlés par l’API.
2. Vérifier la complétude selon la mission et permettre une réouverture explicite de collecte ; associer validateur, date et révision.
3. Figer la révision validée ; toute modification produit une nouvelle révision à revoir, sans modifier celle déjà émise.
Recette associée : AT-09. Les résultats intermédiaires ne valent pas recette finale.

**Résultat attendu**

AT-09 refuse une publication directe de brouillon et conserve l’ancienne révision validée après correction. Chaque livrable client référence une validation humaine identifiable ; aucun état de validation fiable ne repose uniquement sur un JSON modifiable côté navigateur.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / tasks/EV-11 et backlog/EV-11
- PLAN §4 et §6 / EV-11
- AUDIT §9, 10, 13, 16 / EV-11 ; références T03; G02; G04

#### AT-09 — Publication sans revue / correction

**Actions à mener**

Avant validation, identifier environnement, commit/version, date et cas ; joindre la preuve et le résultat réel.
1. Tenter la publication d’un brouillon par appel direct de l’API en contournant l’interface.
2. Faire valider une révision, produire son document puis corriger le dossier.
3. Comparer l’ancienne révision/document avec la nouvelle et contrôler état, auteur/date et droits des transitions.

**Résultat attendu**

Publication du brouillon refusée côté serveur. Ancienne version validée inchangée ; nouvelle correction non validée et à revoir. Journal et références de validation cohérents.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / acceptance_tests/AT-09
- PLAN §6 / AT-09
- AUDIT §16 / AT-09

#### DA-08 — Formats

**Actions à mener**

Échéance proposée : 2026-10-15 ; elle n’atteste aucune décision prise.
1. Faire accepter DOCX natif comme rapport de référence et conversion PDF contrôlée pour le pilote.
2. Confirmer version de gabarit, traçabilité de révision et relecture de toutes les pages.
3. Reporter explicitement la génération PDF serveur industrielle hors du pilote avant EV-12.

**Résultat attendu**

Formats et contrôle qualité approuvés ; aucune extension HTML renommée DOCX. Même révision requise pour rapport, synthèse et PDF.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / decisions/DA-08
- PLAN §5 / DA-08
- AUDIT §18 / DA-08 ; références A01 §5; T03

#### EV-12 — DOCX natif et conversion PDF contrôlée

**Actions à mener**

Préalables : EV-11.
Décisions à obtenir avant l’étape : DA-08.
1. Produire un vrai DOCX Office Open XML depuis la révision validée, avec mission/limites, contexte, écoute, couverture, preuves, sources, analyse et actions.
2. Tracer révision, version du gabarit, date et validateur ; utiliser les contenus du modèle, sans reconstruction par capture d’écran.
3. Ouvrir le DOCX dans Word et effectuer une conversion PDF contrôlée ; relire toutes les pages et comparer mesures, textes, plans et photos.
Recette associée : AT-10. Les résultats intermédiaires ne valent pas recette finale.

**Résultat attendu**

Ouverture Word sans alerte de format ; aucune divergence sur les témoins et toutes les pages contrôlées. Révision et gabarit identifiables. La concordance complète avec la synthèse AT-10 se vérifie après EV-13 ; automatisation PDF serveur hors lot.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / tasks/EV-12 et backlog/EV-12
- PLAN §4 et §6 / EV-12
- AUDIT §9, 13, 16, 18 / EV-12 ; références A01 §5; T03

#### EV-13 — Synthèse client liée à la même révision

**Actions à mener**

Préalables : EV-10, EV-11, EV-12.
1. Rédiger depuis la même révision validée une synthèse courte : demande, trois décisions principales, agir/vérifier/surveiller, limites et prochaine étape.
2. Relier chaque conseil au rapport et conserver les inconnues ; utiliser seulement les photos/repères du dossier ou des illustrations aux droits établis.
3. Comparer synthèse, DOCX et PDF puis faire reformuler les trois décisions au test de compréhension ; rédaction humaine avant toute assistance IA.
Recette associée : AT-10. Les résultats intermédiaires ne valent pas recette finale.

**Résultat attendu**

AT-10 atteste une même révision et des contenus concordants. Aucun fait absent du rapport validé ni image sans droit établi. Le testeur/client restitue les trois décisions principales sans confondre réserve et diagnostic.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / tasks/EV-13 et backlog/EV-13
- PLAN §4 et §6 / EV-13
- AUDIT §9, 13, 16, 17 / EV-13 ; références T03; T08

#### AT-10 — DOCX, synthèse et PDF

**Actions à mener**

Avant validation, identifier environnement, commit/version, date et cas ; joindre la preuve et le résultat réel.
1. Produire DOCX natif, synthèse et PDF contrôlé depuis la même révision validée.
2. Ouvrir le DOCX dans Word sans alerte et vérifier identifiant de révision, gabarit, mesures, sources, mission et limites dans les trois fichiers.
3. Inspecter toutes les pages et consigner le contrôle de contenu/pagination ; vérifier droits des illustrations.

**Résultat attendu**

Même révision, aucune erreur de format ni divergence de contenu sur les témoins. Toutes les pages relues ; synthèse sans fait absent du rapport. Preuve de contrôle et validateur identifiés.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / acceptance_tests/AT-10
- PLAN §6 / AT-10
- AUDIT §16 / AT-10

#### AT-01 — Anciens JSON et parcours expertise

**Actions à mener**

Avant validation, identifier environnement, commit/version, date et cas ; joindre la preuve et le résultat réel.
1. Charger les JSON témoins antérieurs à l’incrément et parcourir Visite Globale puis Expertise & Visite technique.
2. Comparer tous les champs/observations/photos de référence et exporter/reprendre les dossiers.
3. Inscrire environnement, commit, date, cas et différences ; rejouer après toute correction affectant la compatibilité.

**Résultat attendu**

Aucune perte de donnée ni altération du parcours Expertise sur les témoins ; inconnues non reclassées implicitement. Comparaison avant/après jointe à la preuve.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / acceptance_tests/AT-01
- PLAN §6 / AT-01
- AUDIT §16 / AT-01

#### AT-02 — Suspendre/réactiver une phase

**Actions à mener**

Avant validation, identifier environnement, commit/version, date et cas ; joindre la preuve et le résultat réel.
1. Ouvrir le dossier témoin avec choix, constats et photos de la phase Air.
2. Suspendre Air, vérifier l’absence de conclusion de sécurité, puis réactiver la phase et comparer à l’état initial.
3. Recharger/reprendre le dossier et vérifier qu’aucune autre phase n’a été réactivée implicitement.

**Résultat attendu**

Choix, observations et photos strictement conservés avant/après ; aucune phase réactivée sans action. Captures ou comparaison structurée datées.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / acceptance_tests/AT-02
- PLAN §6 / AT-02
- AUDIT §16 / AT-02

#### EV-14-B — Recette finale et preuves du GO pilote

**Actions à mener**

Préalables : EV-14-A, EV-03, EV-04, EV-09, EV-13, EV-15, EV-16-B.
1. Rassembler les preuves des douze AT dans leurs étapes uniques ci-dessous ; rejouer les scénarios affectés sur le commit candidat et documenter environnement, date et résultat.
2. Vérifier anciens JSON, parcours Expertise, consentements et téléphone/tablette ; signaler explicitement les scénarios non exécutés ou non applicables avec justification.
3. Préparer la décision GO/NO-GO : critères critiques applicables réussis, mission/cadre acceptés, copie restaurable et version client approuvée. Toute correction consommant la réserve sera requalifiée avant EV-18-A.
Recette associée : AT-01, AT-02, AT-03, AT-04, AT-05, AT-06, AT-07, AT-08, AT-09, AT-10, AT-11, AT-12. Les résultats intermédiaires ne valent pas recette finale.

**Résultat attendu**

Toutes les recettes critiques applicables ont une preuve sur la version candidate, sans compter une ancienne CI comme recette actuelle. Une perte, un accès croisé, une publication non autorisée, une mauvaise unité, une source inventée ou une panne sans reprise bloque le GO jusqu’au nouveau test.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / tasks/EV-14-B et backlog/EV-14
- PLAN §4 et §6 / EV-14-B
- AUDIT §5, 13, 16 / EV-14 ; références A01 §5/12; G04

### Registre des risques

#### R-L3-01 — Publication sans revue ou modification d’une version émise

**Cause :** État validé et snapshot immuable non établis dans l’API auditée ; un bouton d’interface ne protège pas une publication directe.

**Conséquence :** Client recevant un document non approuvé ou ancienne preuve modifiée après transmission.

**Préqualification proposée (à confirmer) :** probabilité Moyenne ; impact Critique ; statut À qualifier.

**Responsable :** À confirmer.

**Prévention**

Appliquer DA-06/EV-11 avec droits/transitions serveur, auteur/date/révision et snapshot ; exécuter AT-09.

**Réaction si le risque survient**

Refuser la publication, conserver l’ancienne révision et créer une nouvelle revue ; corriger les contrôles puis retester avant émission.

**Suivi :** Préqualification proposée, à confirmer : probabilité Moyenne car l’état validé et le snapshot ne sont pas établis dans l’API auditée, mais le contournement dépend d’un appel de publication ou d’une correction (AUDIT §9/EV-11) ; impact Critique car publication non autorisée et altération de version émise sont des cas NO-GO. Exécuter les appels directs AT-09, comparer les deux révisions et revoir la cotation après preuve des contrôles serveur.

**Preuve :** Non renseigné.
**Date de revue :** Non renseigné.

**Sources**

- AUDIT §9–10, §13, §16 / EV-11, AT-09
- PLAN §4–6 / validation et immutabilité

#### R-L3-02 — DOCX, synthèse et PDF incohérents

**Cause :** Export historique HTML .doc et restitutions distinctes pouvant diverger sur révision, mesures, limites ou pagination.

**Conséquence :** Livrable non ouvrable proprement, conseil absent du rapport ou contenu/pagination trompeurs.

**Préqualification proposée (à confirmer) :** probabilité Élevée ; impact Majeur ; statut À qualifier.

**Responsable :** À confirmer.

**Prévention**

Produire EV-12/13 depuis la même révision validée, tracer le gabarit et inspecter toutes les pages dans AT-10.

**Réaction si le risque survient**

Corriger le modèle/gabarit, régénérer les trois restitutions et refaire l’inspection ; garder l’état brouillon tant que le contrôle échoue.

**Suivi :** Préqualification proposée, à confirmer : probabilité Élevée avant EV-12 car l’export historique est un HTML .doc et non le DOCX natif attendu (AUDIT §5/9) ; impact Majeur car format, révision ou pagination incorrects empêchent une restitution fiable. Cette proposition ne préjuge pas de la qualité du futur générateur. Ouvrir les fichiers témoins, comparer DOCX/synthèse/PDF et relire toutes les pages dans AT-10 ; diminuer ou confirmer la cotation seulement après résultats.

**Preuve :** Non renseigné.
**Date de revue :** Non renseigné.

**Sources**

- AUDIT §9, §13, §16 / EV-12, EV-13, AT-10
- PLAN §2, §5–6 / DA-08

#### R-L3-03 — Régression d’un acquis ou ancien dossier altéré

**Cause :** Ajout de champs et changements d’interface pouvant affecter anciens JSON, phases activables, consentements ou usage téléphone/tablette.

**Conséquence :** Perte de choix/photos ou dégradation du parcours Expertise qui devait être conservé.

**Préqualification proposée (à confirmer) :** probabilité Moyenne ; impact Critique ; statut À qualifier.

**Responsable :** À confirmer.

**Prévention**

Préparer EV-14-A, comparer les témoins et exécuter AT-01/02 sur le candidat ; inclure téléphone/tablette dans EV-14-B.

**Réaction si le risque survient**

Préserver la version et le dossier de référence, corriger ou retirer le changement en cause puis rejouer les scénarios affectés avant GO.

**Suivi :** Préqualification proposée, à confirmer : probabilité Moyenne car l’incrément modifie champs et interfaces, tandis que les tests historiques n’ont pas été requalifiés par l’audit (EV-14) ; impact Critique si un ancien dossier ou ses photos est détruit, critère NO-GO PLAN §6. Aucune régression actuelle n’est affirmée. Comparer les témoins AT-01/02 et les usages téléphone/tablette sur le commit candidat ; revoir le risque après preuves de non-régression.

**Preuve :** Non renseigné.
**Date de revue :** Non renseigné.

**Sources**

- AUDIT §5, §10, §13, §16 / EV-14, AT-01, AT-02
- PLAN §4 et §6 / non-régression

#### R-L3-04 — Révocation plus lente que le délai accepté

**Cause :** Cookies métier autonomes et renouvellement possible après révocation du lancement CONNECT ; politique réelle à mesurer.

**Conséquence :** Maintien d’un accès au-delà du délai autorisé ou promesse d’immédiateté non tenue.

**Préqualification proposée (à confirmer) :** probabilité Moyenne ; impact Critique ; statut À qualifier.

**Responsable :** À confirmer.

**Prévention**

Faire fixer DA-07, mesurer EV-16-A puis appliquer/éprouver EV-16-B et AT-08 avec procédure d’urgence.

**Réaction si le risque survient**

Appliquer la coupure prévue, maintenir le NO-GO si le délai est dépassé ; réarbitrer contrôle central et droits si immédiateté ou tiers requis.

**Suivi :** Préqualification proposée, à confirmer : probabilité Moyenne car les cookies autonomes sont documentés, mais le délai maximal accepté et le renouvellement réel restent à mesurer (AUDIT §11/EV-16, DA-07) ; impact Critique si un accès persiste au-delà de la politique approuvée. Aucun besoin d’immédiateté n’est présumé. Obtenir DA-07 puis mesurer AT-08 et éprouver la coupure d’urgence ; confirmer la cotation selon délai observé, périmètre et exigences acceptées.

**Preuve :** Non renseigné.
**Date de revue :** Non renseigné.

**Sources**

- AUDIT §11, §13, §16, §18 / EV-16, AT-08, DA-07
- PLAN §4–6 / révocation et déclencheur


## RES — Réserve avant pilote

Conserver 4,9 jours-personne de réserve (20 % de 24,5 incluant EV-15) avant les deux essais à blanc. Chaque consommation est motivée et reliée à une EV ; elle ne remplace aucune recette.
Préparer la confirmation du créneau terrain DA-10 à l’échéance proposée du 23 octobre, sous condition de GO. Après corrections, retester les cas concernés et reconfirmer l’aptitude au pilote.
Le scénario central laisse 0,6 jour de marge sur 30 ; les attentes externes peuvent néanmoins déplacer les dates.

### Étapes

#### DA-10 — Date terrain

**Actions à mener**

Échéance proposée : 2026-10-23 ; elle n’atteste aucune décision prise.
1. Préparer le créneau avec Philippe et le client ; leur disponibilité n’est pas confirmée par la date calculée.
2. Enregistrer la proposition puis la confirmation humaine, conditionnée à EV-14-B, à la requalification de la réserve et aux essais.
3. Décaler la visite si le GO ou une personne manque ; ne pas transformer l’intention d’octobre en réservation.

**Résultat attendu**

Créneau et participants explicitement confirmés, avec preuve datée et condition de GO rappelée. Sans confirmation, EV-18-B reste bloquée.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / decisions/DA-10
- PLAN §5 / DA-10
- AUDIT §18 / DA-10 ; références T10

#### BUF-01 — Consommer la réserve et requalifier avant pilote

**Actions à mener**

1. Maintenir les 4,9 jours-personne avant EV-18-A : cette réserve vaut 20 % des 24,5 jours incluant EV-15, sans évolution supplémentaire.
2. Pour chaque consommation, relier la correction à son EV, noter motif, charge réelle et reste ; ne pas considérer une réserve disponible comme un test réussi.
3. Rejouer les AT affectés sur la version corrigée, mettre à jour les preuves d’EV-14-B et reconfirmer le GO avant les essais. En cas de dépassement, réarbitrer date/capacité/périmètre.

**Résultat attendu**

Consommation justifiée et traçable, corrections requalifiées et décision GO/NO-GO actualisée avant EV-18-A. Enveloppe initiale 4,9 j-p conservée ; toute modification du scénario est décidée et reportée dans ses sources.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN §3 / réserve de 20 % ; §4 / BUF-01 ; §6 / requalification
- PLAN-JSON / parameters/reserve_rate et parameters/include_ev15
- AUDIT §15–16 / capacité et GO/NO-GO

### Registre des risques

#### R-RES-01 — Enveloppe haute incompatible avec la capacité

**Cause :** Scénario central 29,4 j-p pour 30 disponibles, marge de 0,6 après réserve ; borne haute provisionnée 39 j-p.

**Conséquence :** Dépassement du 30 octobre ou réduction non maîtrisée des garanties du pilote.

**Préqualification proposée (à confirmer) :** probabilité Élevée ; impact Majeur ; statut À qualifier.

**Responsable :** À confirmer.

**Prévention**

Suivre les consommations par EV dans BUF-01, confirmer DA-09 et recalculer capacité/absences ; garder les corrections avant EV-18-A.

**Réaction si le risque survient**

Faire réarbitrer date, ressources ou fonctions réversibles ; ne pas supprimer accès, restauration, compatibilité ou validation pour tenir le calendrier.

**Suivi :** Préqualification proposée, à confirmer : probabilité Élevée proposée car le scénario central consomme 29,4 des 30 j-p disponibles et la borne haute atteint 39, avec seulement 0,6 j-p de marge après réserve (PLAN §3) ; impact Majeur car la date ou le périmètre devront être réarbitrés. Cette appréciation qualitative ne transforme pas les fourchettes en loi statistique. Actualiser les charges réelles et la consommation BUF-01 à chaque lot ; réviser la projection et la cotation dès qu’un écart réduit la marge.

**Preuve :** Non renseigné.
**Date de revue :** Non renseigné.

**Sources**

- PLAN §3 / enveloppes 29,4–39, réserve 4,9 et marge 0,6 ; §4 / BUF-01
- AUDIT §15 / capacité et réduction maîtrisée

#### R-RES-02 — Attente de décision ou indisponibilité métier

**Cause :** Disponibilité de Philippe et affectation exploitation non confirmées ; calendrier de charge ne représente pas les temps d’attente.

**Conséquence :** Blocage d’EV dépendantes et report du pilote malgré une charge théorique inférieure à 30 j-p.

**Préqualification proposée (à confirmer) :** probabilité Moyenne ; impact Majeur ; statut À qualifier.

**Responsable :** À confirmer.

**Prévention**

Planifier les DA aux échéances proposées, identifier le décideur et demander une preuve de réponse ; suivre disponibilité et prérequis avant chaque lot.

**Réaction si le risque survient**

Maintenir l’étape bloquée, reprogrammer la revue et recalculer les dates ; aucun passage automatique parce qu’une date est atteinte.

**Suivi :** Préqualification proposée, à confirmer : probabilité Moyenne car affectations, disponibilités et plusieurs décisions sont encore ouvertes (PLAN §5/9), sans calendrier d’engagement confirmé ; impact Majeur car l’attente bloque des dépendances malgré une charge théorique compatible. Attribuer les décideurs, confirmer les créneaux et suivre chaque DA en retard ; réévaluer à chaque revue de lot selon les réponses et disponibilités réelles.

**Preuve :** Non renseigné.
**Date de revue :** Non renseigné.

**Sources**

- PLAN §3, §5, §9 / attente externe et affectations
- AUDIT §17–18 / gouvernance et arbitrages


## L4 — Essais et pilote terrain

Après recette et requalification de la réserve, conduire deux essais à blanc puis un dossier terrain accompagné au créneau réellement confirmé.
Mesurer la qualité et le temps de reprise, la traçabilité, les irritants et la compréhension des trois décisions ; établir un bilan contradictoire avant de décider les suites DA-12.
Les 1,5 jours-personne restent l’enveloppe existante. Le petit échantillon ne démontre ni performance statistique, ni revenu, ni autorisation de déploiement élargi.

### Étapes

#### EV-18-A — Deux essais à blanc après recette

**Actions à mener**

Préalables : EV-14-B, EV-17.
1. Vérifier EV-14-B, mission acceptée et requalification des corrections de la réserve avant les essais.
2. Exécuter deux scénarios à blanc, conformément au Markdown de l’audit §17 et au planning §2, puis consigner mécanique, inconnues et irritants.
3. Chronométrer préparation/reprise à périmètre comparable et contrôler complétude des mesures, traçabilité des actions et fiabilité ; reconfirmer l’aptitude au terrain.

**Résultat attendu**

Deux comptes rendus d’essais distincts, avec environnement/version et résultats. Écarts bloquants corrigés et retestés avant visite. Le choix de deux essais, malgré la fiche historique n’en citant qu’un, reste tracé dans l’acceptation du périmètre.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / tasks/EV-18-A et backlog/EV-18
- PLAN §4 et §6 / EV-18-A
- AUDIT §16, 17 / EV-18 ; références T10

#### EV-18-B — Visite accompagnée et bilan de valeur

**Actions à mener**

Préalables : EV-18-A.
Décisions à obtenir avant l’étape : DA-10.
1. Après GO et DA-10, réaliser un dossier terrain accompagné avec Philippe et le client au créneau confirmé ; aucun rendez-vous n’est déduit du calendrier calculé.
2. Mesurer temps de préparation/reprise, complétude utile, traçabilité des actions, erreurs et irritants ; faire reformuler les trois décisions principales.
3. Rédiger un bilan contradictoire métier et prioriser les corrections/suites. Ne pas déduire un déploiement élargi, une performance statistique ou un revenu de ce seul dossier.

**Résultat attendu**

Un dossier accompagné et un bilan daté : mesures interprétées complètes, actions traçables, trois décisions comprises, temps comparés et irritants consignés. Corrections priorisées et acceptation humaine avant tout élargissement ; aucune disponibilité présumée.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / tasks/EV-18-B et backlog/EV-18
- PLAN §4 et §6 / EV-18-B
- AUDIT §16, 17, 18 / EV-18 ; références T10

#### DA-12 — Options ultérieures

**Actions à mener**

Échéance proposée : 2026-10-30 ; elle n’atteste aucune décision prise.
1. Au bilan, utiliser les résultats du pilote pour prioriser études IA, aides/DELTA, paiements/finance et 3D/capteurs.
2. Documenter besoin, question d’étude et conditions de poursuite ; séparer étude de développement industriel.
3. Faire décider les suites sans transformer une idée ni un seul dossier en engagement commercial ou technique.

**Résultat attendu**

Décision de priorité/report datée avec raisons et décideur. Aucun budget, fournisseur, revenu ou développement complet considéré comme approuvé sans arbitrage distinct.

**Suivi de l’étape**

- [ ] Réalisée
- [ ] Validée

Preuve : Non renseigné.
Validation : Non renseigné ; date : Non renseigné.

**Sources**

- PLAN-JSON / decisions/DA-12
- PLAN §5 / DA-12
- AUDIT §18 / DA-12 ; références T11; H01

### Registre des risques

#### R-L4-01 — Terrain engagé sans créneau confirmé ou sans GO

**Cause :** Visite en deuxième quinzaine d’octobre seulement envisagée ; présence des personnes et acceptation des scénarios non établies.

**Conséquence :** Visite annulée ou collecte réelle avec défaut bloquant non résolu.

**Préqualification proposée (à confirmer) :** probabilité Moyenne ; impact Critique ; statut À qualifier.

**Responsable :** À confirmer.

**Prévention**

Confirmer DA-10 et vérifier EV-14-B, cadre, restauration, requalification de réserve et deux essais EV-18-A avant EV-18-B.

**Réaction si le risque survient**

Reporter la visite réelle et rester sur données synthétiques ; corriger/retester les bloquants et obtenir la confirmation des participants.

**Suivi :** Préqualification proposée, à confirmer : probabilité Moyenne car créneau et personnes ne sont pas confirmés et le GO reste conditionnel (PLAN §5–6, DA-10) ; impact Critique pour l’engagement de données réelles sans garanties, tandis qu’une simple indisponibilité provoque un report. Aucun rendez-vous pris ni défaut de recette réel n’est supposé. Séparer confirmation du créneau et décision GO, vérifier les preuves avant EV-18-B et revoir la cotation après accord des participants et requalification.

**Preuve :** Non renseigné.
**Date de revue :** Non renseigné.

**Sources**

- AUDIT §16–18 / GO, EV-18, DA-10 ; T10
- PLAN §5–6 / créneau et GO terrain

#### R-L4-02 — Valeur du pilote surestimée ou suites engagées trop tôt

**Cause :** Deux essais et un dossier accompagné constituent un échantillon exploratoire ; aucune performance statistique ni recette commerciale démontrée.

**Conséquence :** Industrialisation, budget ou promesse partenaire fondés sur un résultat non mesuré.

**Préqualification proposée (à confirmer) :** probabilité Moyenne ; impact Majeur ; statut À qualifier.

**Responsable :** À confirmer.

**Prévention**

Mesurer temps, complétude, traçabilité, compréhension des trois décisions et irritants ; établir un bilan contradictoire EV-18-B et arbitrer DA-12.

**Réaction si le risque survient**

Limiter les conclusions aux observations, compléter l’étude ou corriger le prototype ; laisser les suites au statut à arbitrer sans revenu supposé.

**Suivi :** Préqualification proposée, à confirmer : probabilité Moyenne proposée car le bilan s’appuie sur deux essais et un seul dossier exploratoire (AUDIT §17), sans preuve d’une tendance à la surinterprétation ; impact Majeur si des engagements de budget ou de déploiement sont décidés sur une valeur non démontrée. Faire relire le bilan contradictoire, expliciter la portée de l’échantillon et tracer DA-12 ; réévaluer lorsque les suites et leurs preuves sont examinées.

**Preuve :** Non renseigné.
**Date de revue :** Non renseigné.

**Sources**

- AUDIT §17–18 / indicateurs et DA-12
- PLAN §6–7 / bilan et suite hors calendrier
