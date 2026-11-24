---
project: avereo-app-passeport-immo
document_type: ux-ui-proposal
title: Proposition UX/UI Passeport Immo
status: draft
version: git
created: 2026-11-24
updated: 2026-11-24
owner: jpdandin
tags: [ux, ui, documents, cil, proposition]
---

## Passage au développement local — 24 novembre 2026

La piste Bibliothèque est retenue pour le premier lot demandé dans le chat. Cette proposition conserve le cadrage initial ; le [guide et la recette du candidat local](ux-ui-bibliotheque.md) décrivent maintenant l’implémentation. Le [suivi UX/UI](../data/suivi-ux-ui.json) est canonique pour ce nouveau lot. Les contrôles de maquette ci-dessous restent des preuves de conception, distinctes des essais de l’application réelle.


# Proposition UX/UI Passeport Immo

## Périmètre et recommandation

Demande du 24 novembre : proposer une amélioration de l’UX/UI avec priorité au bleu
AVEREO, à l’ardoise, au graphite et au blanc. **Cadrage seulement** : deux maquettes
de principe sur six documents fictifs. Aucun code de l’application, accès, document
client ou hébergement n’est modifié par cette étude. Pas de PR ni d’autorisation
de livraison déduite de la demande.

**Recommandation : retenir la piste « Bibliothèque »**, adaptée aux nombreux
documents, archives lourdes et usages répétés. La piste « Fiche du bien » privilégie
le contexte client/bien et les catégories dépliables ; elle convient à une
consultation plus occasionnelle. Le menu de compte commun AVEREO doit être réutilisé,
avec ses gestionnaires existants, plutôt que recréé dans l’application.

Le [suivi du cadrage](../data/suivi-ux-ui.json) est raccordé au cockpit. La maquette
interactive est une représentation dérivée de cette proposition, conservée dans le
dossier de visualisation du chat ; elle ne sauvegarde et ne transmet aucun fichier réel.

## Sources examinées et limites

- Source applicative plus récente consultée en lecture seule :
  `C:/Users/examg/Documents local/avereo-rapport-volume-preprod`, commit
  `a045a09e23219965af79c1aa05582d72e5a876ed`. Composants `App.jsx`,
  `DocumentsPanel.jsx`, `DocumentOrganisation.jsx`, `Sharing.jsx`,
  `ReportPublications.jsx`, styles documentaires et menu commun.
- [Charte AVEREO V2 — document de cadrage du 22 août](<C:/Users/examg/Documents local/France_Travail/France_Travail/Création_Entreprise/AVEREO/Identité_Visuelle_AVEREO/Charte_graphique_AVEREO_V2.0_Cadrage_2026-08-22.docx>) :
  références de couleurs, typographie Inter et rayon modéré. Son statut de document
  de travail n’est pas transformé en adoption globale de toutes ses propositions.
- [Contraste minimal W3C](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
  et [taille des cibles W3C](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html),
  consultés le 24 novembre.

L’installation réellement hébergée n’a pas été auditée pendant cette étude. Les
observations de l’interface reposent sur les sources ci-dessus et les retours du chat.
Le résultat du renvoi CONNECT prévu le 15 novembre n’est pas requalifié ici : aucun
renvoi, compte ou modification de partage ne fait partie de ce cadrage UX/UI.

## Direction visuelle

| Rôle | Référence | Usage proposé |
| --- | --- | --- |
| Bleu AVEREO | `#002B45` | Navigation, titres, action principale et sélection |
| Graphite | `#263238` | Texte principal, noms et valeurs |
| Blanc | `#FFFFFF` | Surfaces de travail et lecture |
| Ardoise | `#64748B` | Métadonnées et informations secondaires sur blanc |
| Bleu ardoise | `#345469` | Navigation secondaire, aplats ou pictogrammes |
| Brume | `#EEF3F6` | Séparation légère et fond d’aperçu |

La charte distingue bien l’ardoise des métadonnées et le bleu ardoise corporate.
Le blanc doit rester majoritaire. L’orange reste principalement dans le logo et
éventuellement un accent ponctuel ; le vert actuel ne structure plus l’ensemble
de l’espace documentaire. Les couleurs fonctionnelles peuvent signaler une erreur
ou une action irréversible, toujours accompagnées d’un texte et d’un pictogramme.
Les couleurs de catégories personnalisées par le propriétaire sont conservées.

Inter, corps cible 16 px et métadonnées 13–14 px ; titres hiérarchisés, labels
visibles, interlignage confortable. Arrondis sobres autour de 8 px, séparateurs
discrets, ombres réservées aux éléments flottants. Logo officiel réutilisé sans
recoloration ni recomposition. Le dessin de la maquette n’est pas un nouveau logo.

## Améliorations prioritaires

| Priorité | Amélioration | Résultat recherché |
| --- | --- | --- |
| P1 | Navigation centrée sur le bien | Garder le nom du bien et un fil « Mes biens / Bien / Documents » ; séparer documents, rapports et estimation |
| P1 | Bibliothèque documentaire | Catégories visibles, liste compacte, nom lisible et aperçu ; réduire la répétition des boutons sous chaque fichier |
| P1 | Ajout et association client explicites | Un bouton principal toujours repérable ; si le client manque, expliquer l’étape et proposer de l’associer au même endroit |
| P1 | Réception et enregistrement compréhensibles | Distinguer transfert, vérification et confirmation serveur ; indiquer les fichiers réussis et ceux à reprendre |
| P1 | Partage lisible | Expliquer qui voit quels documents, le mode lecture seule, la révocation et l’activation CONNECT en attente |
| P1 | Lecture et navigation accessibles | Contrastes, focus, clavier, libellés, zones tactiles et affichage adapté aux petites largeurs |
| P2 | Gestion de plusieurs documents | Sélection multiple, classement et déplacement ; évolution fonctionnelle à qualifier avant implémentation |
| P2 | Rapports et carnet CIL | Distinguer les versions privées de Rapport ; préparer les rubriques CIL sans annoncer une conformité ou une complétude inexistante |

### UX01 — Mes biens et fiche du bien

À l’accueil : noms cohérents « Mes biens » et « Documents partagés avec moi »,
recherche simple et accès direct au dossier. Dans un bien : contexte client discret,
navigation persistante et une rubrique par intention. L’estimation et les pièces
du logement ne doivent pas allonger systématiquement la page de documents.
L’intitulé local doit clarifier le bien sans détourner le menu de compte commun.

### UX02 — Liste et dossiers

Afficher un nom principal, format, date et poids utiles ; le nom de fichier original
reste consultable dans les détails. Une action « Consulter » reste immédiatement
repérable ; renommer, classer, archiver et déplacer dans la corbeille sont regroupés
dans un menu secondaire. Les dossiers parents, icônes, couleurs et ordre déjà
personnalisés sont repris. Conserver les flèches ou commandes clavier même si un
glisser-déposer est proposé ultérieurement.

Préserver recherche, dossier ouvert, sélection, saisie et position de défilement
lors des rafraîchissements ciblés. Éviter un rechargement complet de page ou une
reconstruction de formulaire qui fait perdre le travail en cours.

### UX03 — Import et sauvegarde

Proposer « Ajouter des documents » puis fichiers/dossier, avec association client
expliquée si nécessaire. Les archives restent entières et non extraites. Les limites
existantes sont reprises depuis la source commune ; une refonte graphique ne les
augmente pas. Pour les lots lourds, montrer les phases « Transfert », « Vérification »
et « Enregistré », avec progression par lot et bilan par fichier. Un transfert
commencé ou terminé n’est pas, à lui seul, un succès d’enregistrement.

Les fichiers se sauvegardent après réception confirmée ; la modification de la fiche
du bien et l’export d’une copie locale sont des actions distinctes. Préférer des
libellés indiquant l’objet enregistré et la cible, sans créer une nouvelle promesse
d’autosauvegarde globale. Une erreur conserve la saisie et indique l’action utile.

### UX04 — Accès, archives et corbeille

Dans la fiche : « Privé » ou « Partagé avec… ». Dans le dialogue : compte CONNECT
reconnu, activation éventuelle en attente, lecture seule, documents actifs actuels
et futurs de ce seul bien, révocation. L’écran destinataire montre seulement les
documents autorisés ; aucune fiche client, donnée d’estimation ou copie privée
complète de Rapport ne doit apparaître par commodité de mise en page.

Archives et corbeille restent distinctes. Dans la corbeille, mettre « Restaurer »
en avant ; conserver la confirmation de suppression définitive. Retirer un partage
et mettre un document à la corbeille sont deux intentions différentes. Une copie
déjà téléchargée ne peut pas être rappelée par l’interface.

### UX05 — Rapports et CIL

Pour Rapport : deux désignations claires, « Restitution client » et « Dossier complet
privé ». La confirmation d’import explique la visibilité de chaque partie avant
conservation. La restitution client peut rejoindre les documents partagés ; le
dossier complet reste privé, comme dans le flux actuel.

Le volet CIL proposé doit à terme organiser caractéristiques du logement, matériaux,
équipements, travaux et justificatifs. Une liste explicite « Renseigné / À compléter /
À vérifier » est préférable à un pourcentage de conformité automatique. Applicabilité,
champs obligatoires et règles de transmission restent à cadrer dans le lot CIL.
Dans les maquettes, « Carnet CIL · à concevoir » représente cette suite, pas une
fonction disponible ou un carnet juridiquement complet.

## Accessibilité et critères de recette proposés

La cible de lecture est un contraste d’au moins 4,5:1 pour le texte courant.
Les quatre couples texte/blanc proposés donnent : bleu 14,67:1, graphite 13,16:1,
bleu ardoise 8,02:1, ardoise 4,76:1. Ces calculs ne constituent pas un audit complet.
L’ardoise claire ne doit pas être réutilisée automatiquement sur tous les fonds.

Viser des cibles tactiles de 44 px pour les actions importantes ; le minimum WCAG 2.2
AA est 24 × 24 px avec exceptions d’espacement, à distinguer de cette cible de confort.
Prévoir parcours clavier et focus visible ; ne jamais coder une information seulement
par couleur ou par une icône sans libellé.

Critères pour une implémentation future :

- trouver un fichier par catégorie et par nom, puis revenir à la même liste ;
- importer plusieurs archives et distinguer confirmation serveur et erreur partielle ;
- reclasser et réordonner, puis retrouver le même classement après réouverture ;
- conserver les champs et sélections pendant un rafraîchissement ciblé ;
- restaurer depuis la corbeille et confirmer séparément une purge ;
- contrôler les vues propriétaire et destinataire, la révocation et les exclusions ;
- distinguer restitution client et dossier Rapport privé ;
- vérifier bureau, petite largeur, vraie tablette et clavier avant livraison.

## Cadrage

État actuel : proposition rédigée et deux maquettes de principe. Arbitrages restants :
piste dominante, densité par défaut et périmètre du premier lot. Recommandation :
Bibliothèque, puis navigation, documents, import/enregistrement et partage en premier.
Aucune validation humaine de cette proposition n’est encore enregistrée.

## Développement local

À engager après choix du périmètre : composants et variables de couleur communs,
adaptation des vues existantes, tests des parcours et revue locale. Les maquettes ne
sont pas une implémentation de ces fonctions. Les opérations multiples, nouveaux
champs CIL ou changements de sauvegarde dépassent une simple modification de styles.

## Préproduction

À qualifier et autoriser pour le candidat retenu : conservation des données,
catégories, ordre, droits et publications ; recette sur bien fictif et compte lecteur.
Tester les gros imports et l’absence de perte de saisie. Aucun déploiement effectué
ou autorisé par le seul présent cadrage.

## Mise en production

Après revue, accords et qualification propres à cette cible : livrer le candidat
retenu, vérifier les parcours et préparer la suite CIL. Aucun passage de phase,
merge ou production n’est créé par les maquettes.

## Contrôles de cette proposition et documentation

Les deux maquettes ont été inspectées sur le navigateur de bureau. Filtre par
catégorie, changement d’aperçu et conservation d’un dossier replié après sélection
d’un autre fichier vérifiés. Syntaxe JavaScript et contrastes des quatre couples
texte/blanc calculés. La saisie dans la recherche n’a pas pu être validée avec
l’outil de contrôle du champ ; les appareils réels, petites largeurs, contrôles de
réglages et fonctions serveur ne sont pas recettés par ce prototype.

Documents concernés : présente proposition, [suivi UX/UI](../data/suivi-ux-ui.json),
[cockpit canonique](suivi-chantier.json) et ses vues dérivées, [point de reprise](point-session.md),
[README](../README.md), [exigences](../requirements.md) et [roadmap](../roadmap.md).
Le [relais AVEREO_2](<C:/Users/examg/OneDrive/Documents/AVEREO_2/docs/reprise-passeport-immo.md>)
est actualisé vers ce cadrage.
Les preuves déjà approuvées et les travaux locaux antérieurs restent conservés.
