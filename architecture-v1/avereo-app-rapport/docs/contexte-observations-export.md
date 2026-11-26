---
project: avereo-app-rapport
document_type: requirements
title: Contexte de visite observations et export
status: active
version: git
created: 2026-11-26
updated: 2026-11-26
owner: jpdandin
tags: [rapport, contexte, observations, export, profils]
---

# Modifications demandées le 26 novembre

Le responsable demande d’appliquer les modifications centralisées dans [le document de demande](<C:/Users/examg/Documents local/France_Travail/France_Travail/Création_Entreprise/AVEREO/Innovation AVEREO/IA/Applications_AVEREO/AVEREO RAPPORT/Amélioration Rapport.docx>). Son original reste intact (SHA-256 `2f78fcf67019e48f91001760b0659af1c05881f805ca0a6ef4d750715dbf1911`). Les six illustrations ont été inspectées ; les exigences durables sont transcrites ici. Le document Word est conservé comme pièce de demande, sans devenir une source concurrente du présent contrat.

Le 26 novembre, le responsable précise : conserver les interventions pour les autres profils ; réserver l’envoi vers Projet aux comptes habilités. Ce choix ne modifie aucun droit CONNECT.

| Référence | Résultat attendu | Vérification et préservation |
| --- | --- | --- |
| AM26-01 | Intérieur : température en °C, humidité relative en %, CO₂ en ppm. | Champs facultatifs ; valeurs manquantes distinctes de zéro ; JSON, aperçu et Word conservent les mesures. |
| AM26-02 | Extérieur : ciel, température, humidité, pluie et vent conservés. Mixte : saisies distinctes et écarts intérieur moins extérieur. | Température en °C, humidité en points ; aucun écart sans les deux mesures valides ; changements de contexte sans effacement. |
| AM26-03 | « Le bâti » est replié par défaut, avec liseré rouge et accès aux quatre phases. | Présentation indépendante des données ; repères T1/T2, numéros du bâti, photos, plans, ordre, accès depuis un plan et traitements en cours conservés. |
| AM26-04 | Terrain : zones terrasse, jardin, annexes, route, trottoir et éléments pied de mur, caniveau, sol, complétés par les suggestions proches. | Saisie libre possible ; valeurs anciennes conservées, sans reclassement automatique ; rapprochement AT25-07/R12-04. |
| AM26-05 | Bâti en zone extérieure : éléments extérieurs cohérents. | Une zone ou un élément déjà saisi ne change pas quand les suggestions changent. |
| AM26-06 | Bouton « Télécharger le dossier complet » sans suffixe JSON. | Le fichier complet reste en JSON, avec textes, médias et champs inconnus ; règles d’export conservées. |
| AM26-07 | Relecture et conservation/partage Passeport mieux visibles. | Deux entrées explicites ; circuit Word expert/client → relecture → validation Word → conversion manuelle client en PDF → contrôle → publication distincte conservé. |
| AM26-08 | Section de copie pour tests retirée de l’écran Export. | Import complet toujours disponible depuis Accueil ; outillage de test et preuves historiques conservés. |
| AM26-09 | Interventions retirées d’Analyse globale, proposées aux profils Architecte et Maître d’œuvre en visite globale ; transfert Projet soumis à l’habilitation. | Actions historiques gardées dans le JSON. Sans Projet, les interventions et l’aperçu restent utilisables ; téléchargement pour Projet refusé, avec nouveau contrôle serveur à chaque tentative. Parcours Technique minimal conservé. |

Le [BQ30 de TROTEC](https://fr.trotec.com/shop/compteur-de-particules-bq30.html) exprime le CO₂ en ppm et relève aussi température et humidité relative. Le lot porte sur la saisie des trois valeurs demandées ; il ne réalise pas de connexion avec l’instrument ni de diagnostic sanitaire automatique.

## Données et compatibilité

`conditions_site.interieur` porte `temperatureC`, `humiditePct`, `co2Ppm` ; `conditions_site.exterieur` porte température et humidité. Ciel, pluie et vent restent dans `meteo`. Les anciens champs température/humidité de `meteo` sont conservés comme historique ; une fois l’extension présente, les champs de `conditions_site` font référence pour ces mesures.

Pour un ancien dossier Intérieur ou Extérieur, la paire de mesures historique est rattachée au contexte enregistré lors de sa première reprise. Un ancien dossier Mixte ne permet pas d’attribuer cette paire à un côté : elle reste visible comme mesure historique non localisée et n’alimente pas un écart. Aucun déplacement ou doublage implicite d’une mesure n’est effectué lors des changements de contexte.

L’état replié du bâti reste une préférence de présentation de session, hors JSON. Les suggestions ne réécrivent ni `piece`, ni `surface`, ni les identifiants des constats. Les interventions devenues invisibles en Analyse globale restent présentes dans le dossier complet ; leur retour sur un profil admissible retrouve les données.

## Déroulement et critères de passage

| Phase | Périmètre du lot |
| --- | --- |
| Cadrage | Demande et illustrations lues ; règle Projet précisée ; compatibilité et critères ci-dessus établis. |
| Développement local | Branche `feat/rapport-contexte-observations-export`, base `fc730178d799c2779a0ab5eca3ff25636f2d6505` ; implémentation, contrôles ciblés, suite existante, construction avec mode serveur et revue locale. |
| Préproduction | À préparer sur le candidat revu et autorisé ; recette native, sauvegarde/réouverture serveur, Word et droits Projet. Aucun accord de PR202 n’est étendu automatiquement à ce lot. |
| Mise en production | Non engagée ; accord et contrôles distincts. |

La livraison PR202, sa demande fictive locale et sa recette humaine restent séparées. Les réserves V1.2/volume, photothèque, Projet, originaux et bout en bout restent ouvertes dans le suivi canonique. Le lot ne traite pas le recadrage des photos, la comptabilité ou les autres demandes de l’atelier Philippe.

Suivi : `rapportV2Technique20261124.improvementsDocument20261126` dans [le cockpit canonique](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>).

## Autorisation Projet

La capacité affichée et le contrôle frais du téléchargement utilisent la projection privée CONNECT existante ; aucun profil ne donne ce droit. [Contrat API et limites du contrôle navigateur](../api/interventions-projet.md#autorisation-du-téléchargement). L’absence de projection explicite Projet refuse le transfert et laisse saisie, estimations et aperçu disponibles pour Architecte/Maître d’œuvre.

## Qualification locale du 26 novembre

- `npm test --prefix architecture-v1/avereo-app-rapport/frontend` : **272 réussis, 0 échec**. Mesures anciennes et nouvelles, zéro/manquant, JSON, suggestions, profils, confidentialité client et autorisation de téléchargement couverts.
- Construction `VITE_ENABLE_ONLINE_SYNC=true npm run build` : réussie, cartes RGA incluses. Avertissement existant de taille de paquet conservé.
- PHP : syntaxe `auth.php`/`project-access.php` ; accès Projet **15 contrôles**, politique CONNECT, accès d’essai **19**, décision **47**, plans **21** : réussis. Aucune intégration MySQL exécutée sur ce poste (pilote PDO indisponible).
- Navigateur sur `http://127.0.0.1:5262/`, origine distincte en mode sans compte : mesures et écarts (20 °C / −20 points, température extérieure zéro), changement de contexte, réouverture, bâti replié, quatre phases, suggestions, valeur ancienne libre et ouverture de la fiche depuis un plan contrôlés. Formulaire étroit sans débordement de page et aucune erreur console observée.
- Dossier fictif importé : trois constats/photos, un plan avec trois repères, signature et champ futur témoin. Réexport JSON : mêmes mesures, météo historique, observations/photos, plans/repères, signature, décision et extension. Deux vrais DOCX téléchargés depuis l’application : unités/valeurs, interventions, médias et filtrage des détails internes du client contrôlés dans les archives Word.
- Analyse globale masque les interventions sans effacer `decision.actions`. Architecte conserve la saisie et l’aperçu informatif sans Projet ; le bouton de transfert reste désactivé. Les tests serveur prouvent aussi l’accord explicite, l’expiration, le retrait et le refus d’une habilitation implicite ; ils ne remplacent pas une recette de compte authentifié.

Les fichiers de preuve et le manifeste du build sont conservés dans [l’archive locale de recette](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-ameliorations-20261126/local/>). Les deux DOCX sont des documents fictifs de test, sans validation métier ou publication.

**Réserves** : pagination dans Microsoft Word à vérifier. Le rendu indépendant a été tenté et son journal conservé ; LibreOffice n’est pas installé sur ce poste. La sauvegarde/réouverture serveur authentifiée et le transfert Projet positif puis retiré restent à vérifier sur le candidat de Préproduction autorisé. Aucun dossier, compte réel, session de recette antérieure ou droit CONNECT n’a été modifié. Les réserves précédentes ne sont pas levées par ces essais.

## Revue locale proposée

1. Ouvrir le service local séparé puis reprendre le dossier fictif `RECETTE-AM26-FICTIF` ; depuis Accueil, l’import complet de l’archive reste également disponible.
2. Dans Site, examiner Intérieur/Extérieur/Mixte et les mesures conservées ; dans Observations, déplier Le bâti et vérifier les suggestions Terrain et zone extérieure, puis un accès depuis le plan.
3. Dans Export, comparer les entrées Passeport, la sauvegarde complète et l’absence du volet de copie de test. Sur Architecte/Maître d’œuvre, vérifier les interventions et l’aperçu ; l’origine sans compte ne permet pas de transférer vers Projet.
4. Relire les deux Word de recette, vérifier leur pagination et le filtrage client. La décision humaine de la PR et la décision métier d’une revue Word restent deux actions séparées.

Après cette revue seulement : décision de merge et autorisation de Préproduction propres au candidat. Aucune case humaine n’est cochée par les contrôles techniques.
