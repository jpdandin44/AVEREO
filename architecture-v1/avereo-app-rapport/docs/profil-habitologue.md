---
project: avereo-app-rapport
document_type: specification
title: Profil Habitologue et explications des observations
status: active
version: git
created: 2026-11-12
updated: 2026-11-12
owner: jpdandin
tags: [rapport, habitologue, observations, livrables]
---

# Profil Habitologue et explications des observations

## Cadrage

Le responsable autorise le 12 novembre le démarrage local des cinq priorités, avec Claude Code en parallèle. Le premier candidat couvre le parcours Habitologue et la clarté des observations. Les autres priorités sont préparées ci-dessous ; leur réalisation constitue des candidats distincts. Les captures du tableau et de l'export, l'analyse du prompt et les preuves antérieures restent rattachées au [suivi canonique](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>), bloc `rapportV12CadrageProfils20261112`.

Un profil de mission est un choix métier du dossier, distinct des rôles CONNECT, de sa catégorie et du destinataire expert/client. Valeur optionnelle `profil_metier: "habitologue"` ; absence ou valeur inconnue : parcours historique conservé. Aucun ancien dossier n'est converti implicitement. « Parcours actuel » rétablit l'affichage antérieur ; les actions, options et arbitrages restent dans le JSON.

Pour Habitologue, l'export conserve les rubriques 1–3 et masque 4–6, dans le formulaire et dans les deux restitutions Word. Les observations présentent **Constat → Explications → Conseils d’habitologue**. `actions` reste le champ des anciens conseils ; `explications` est un nouveau texte optionnel disponible pour tous les profils. Aucun remplacement des textes libres existants.

Les explications acceptent texte et URL HTTP/HTTPS, avec aperçu cliquable et liens conservés dans Word. Le texte utilisateur est échappé, aucun HTML n'est interprété et aucun document externe n'est chargé. La synthèse client respecte sa sélection de constats ; les explications d'un constat exclu ne doivent pas apparaître dans le livrable. JSON, brouillon et sauvegarde serveur transportent les champs dans le payload existant, sans migration SQL.

Critères : choix explicite et réversible du profil ; absence de perte de données au changement, à l'import/export et à la réouverture locale ; conservation de l'ordre des trois champs ; absence des rubriques 4–6 et de leurs alertes dans Habitologue ; parcours historique inchangé ; liens sûrs et filtrage client ; copie de test sans explications privées. La sauvegarde hébergée du nouveau candidat doit encore être qualifiée séparément.

## Développement local

Copie de travail `C:/Users/examg/Documents local/avereo-rapport-v12-habitologue`, branche `feat/rapport-v12-habitologue`, base `831dda19deb3d5c70d1307b42ac5d8abac22422f`. Codex traite formulaire, profil et intégration ; Claude Code reçoit les fichiers de restitution et le traitement des liens selon le [prompt borné](../prompts/delegation-explications-word.md). Aucun accès serveur ni secret n'est nécessaire à cette délégation. Le responsable a validé le dossier ; mission transmise dans la session « Mission AVEREO Rapport — délégation », lecture des sources observée.

État : candidat local vérifié, prêt à examiner. Les 123 tests Node passent (aucun échec ni saut), dont profils, conservation, liens sûrs, masquage des projections et filtrage client. Lint PHP de `reports.php`, 15 contrôles de décision et 12 contrôles des plans réussissent. Les builds hors ligne et authentifié réussissent. Aucun script de lint JS n'est défini dans le package.

Recette locale sur `http://127.0.0.1:5182/`, synchronisation serveur désactivée et données fictives : ordre des trois champs, aperçu des liens et échappement HTML, réversibilité du profil, conservation des actions/options, import d'un ancien JSON sans profil (six sections conservées), puis sauvegarde explicite du brouillon. Après fermeture de l'onglet et ouverture d'un nouvel onglet, Reprendre retrouve le profil, les explications modifiées et les conseils. Comparaison des 68 valeurs sources présentes : seule l'explication modifiée volontairement diffère ; décision et photo identiques. Cette preuve porte sur le stockage local du même navigateur, sans simuler une nouvelle authentification CONNECT.

Les deux Word générés par l'interface sont ouverts dans Microsoft Word puis rendus en PDF et PNG de contrôle : **9 pages expert et 4 pages client, toutes inspectées**, sans défaut de mise en page relevé sur ces cas. Les liens HTTP/HTTPS sont présents comme hyperliens dans les deux DOCX ; les explications et conseils d'un constat exclu restent absents du client ; les projections sont absentes des deux sorties. Après la délégation, Codex a complété l'ordre Constat → Explications → Conseils dans le client Habitologue, en préservant les sorties historiques sans profil. Le rendu standard `render_docx.py` n'a pas pu fonctionner faute de LibreOffice ; Microsoft Word a fourni le rendu réel de contrôle.

La seconde relecture du code ne relève aucun défaut actionnable restant dans le périmètre. Le défaut d'alertes 1–3 masquées a été corrigé. Les preuves locales, comparaisons et empreintes sont dans le cockpit, archive `archives/rapport-habitologue-20261112/verification-locale.json`. Les Word et leurs rendus restent dans `C:/Users/examg/Documents local/livraisons-avereo/rapport-habitologue-20261112/`. Ils ne sont pas des modèles client réels.

Réserves connues : l'audit npm signale quatre dépendances affectées préexistantes (une modérée, trois élevées : baseline-browser-mapping, browserslist, source-map-js, vite) ; le lockfile reste inchangé. Le build signale la taille du bundle principal. Ces points sont conservés pour un lot de maintenance, sans mise à jour de dépendance incidente. Le serveur de revue reste lié à la boucle locale.

## Préproduction

Non livrée pour ce lot. Point d'entrée existant : [CONNECT préproduction → Rapport](https://connect-preprod.avereo.fr/?app=rapport). La recette entre deux comptes fictifs du 12 novembre concerne la copie de test antérieure ; elle ne prouve pas les champs et restitutions de ce nouveau candidat. Prévoir sauvegarde fraîche, retour arrière et recette authentifiée de sauvegarde/réouverture après accord applicable au candidat exact. Le propriétaire du rapport source et les contrôles d'accès demeurent inchangés par cette évolution.

## Mise en production

Aucune livraison ni ouverture autorisée. Après les validations distinctes, les contrôles après livraison et la préparation de la suite restent attachés au même suivi.

Les prochaines priorités préparées depuis les sources Rapport sont :

| Priorité | Existant vérifié | Prochain lot et décision attendue |
| --- | --- | --- |
| 2 · Organisation des observations | Regroupement E/A/T/F puis À classer dans l'écran ; numéro global dérivé de l'ordre du tableau et repères liés aux identifiants stables. Le Word expert parcourt le tableau. | Harmoniser écran, plans et Word ; déplacement explicite sans changer les identifiants. Arbitrer numérotation continue ou par phase. Le champ général Environnement n'est pas une cinquième phase déduite. |
| 3 · Photos et livrables | Import photo brut en Data URL, Word natif avec images ; aucun générateur PDF de rapport dans le frontend inspecté. | D'abord dimensions/qualité et robustesse des dossiers lourds, puis choix du moteur PDF. Ne pas recomprimer les anciens dossiers à l'ouverture. Vérifier portraits/paysages, images illisibles, légendes, horodatages, client et liens. |
| 4 · Diagnostic et interventions | Actions Correctif/Préventif/Évolutif avec priorité, horizon, préalables et liens aux constats/attentes dans les projections. | Nouvelle rubrique d'interventions sous Recommandations, adaptée au profil, puis transmission explicite vers un planning Projet distinct. Aucun écrasement ni synchronisation silencieuse, aucune date/durée inventée. Vérifier le contrat Projet dans son propre périmètre. Arbitrer Curatif/Correctif. |
| 5 · Identité organisationnelle | Identité AVEREO commune dans les sorties ; droits d'export organisation distincts du branding. | Source serveur administrée, isolement de deux organisations fictives et conservation du propriétaire. Arbitrer identité figée à la remise ou courante à la génération ; vérifier les sources CONNECT avant développement. |

Le préremplissage du métier depuis CONNECT, Architecte/Maître d’œuvre et le transfert de propriété restent des sous-lots séparés. Aucune modification de compte ou de droit n'est incluse dans le premier candidat.
