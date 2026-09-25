---
project: avereo-app-rapport
document_type: integration
title: Ressources du batiment - GoRenove et Pro'Reno
status: active
version: git
created: 2026-09-15
updated: 2026-09-15
owner: jpdandin
tags:
  - rapport
  - ressources
  - batiment
---

# Ressources du batiment — evolution 2

## Parcours implemente

Dans `Site`, le bloc `Informations deja disponibles` complete les quatre vues
existantes pour tous les types de rapport. Les liens sont disponibles apres
confirmation du lieu dans Cadastre. Les notes restent utilisables meme sans
confirmation et sans acces aux services externes.

1. Copier l'adresse saisie dans le dossier (le repere geocode reste affiche
   separement, car il peut ne designer que la rue).
2. Ouvrir GoRenove dans un nouvel onglet, rechercher l'adresse et verifier
   manuellement la bonne fiche, notamment en cas de plusieurs batiments.
3. Dans `Conserver une fiche / des notes`, coller son lien, renseigner la date
   de consultation et confirmer la correspondance avec le bien. Si la date
   est vide, le bouton utilise la date du jour UTC ; elle reste modifiable.
4. Consulter les arborescences Pro'Reno maisons ou collectifs selon le besoin,
   choisir une ressource pertinente puis conserver son lien et les notes.
   Le lien du visualiseur PDF Pro'Reno fourni par l'utilisateur est accepte
   et normalise vers son PDF officiel. Preferer la page `documents/...`.
5. Enregistrer le dossier ; les notes, dates, liens et avertissements figurent
   dans le brouillon, l'export/import JSON et l'apercu/document Word existants.

GoRenove peut demander une acceptation de conditions, un compte ou une offre
selon l'usage. Le parcours public ponctuel OPEN est annonce comme limite.
Rapport ne promet pas un acces professionnel illimite gratuit. Il ne gere
pas ces comptes et ne contourne aucune condition ni restriction.

Pro'Reno est une ressource complementaire, pas une redirection automatique
en cas d'absence de donnees GoRenove. Aucune typologie (notamment MI-3-b)
n'est preselectionnee pour un bien. Une fiche generale n'est pas un diagnostic.
Les notes doivent distinguer donnee publiee, simulation et verification terrain.

## Implementation et donnees

- `frontend/src/BuildingResources.jsx` : cartes, liens et saisies.
- `frontend/src/buildingResources.js` : catalogue des sources, validation des
  URL, normalisation, rattachement et HTML de restitution.
- `ressources_batiment.gorenove` et `.proreno` : `url`, `consultedOn`, `notes`,
  `location` (adresse, longitude, latitude, date de la confirmation du lieu).
- Pas de nouvelle table, migration SQL, API PHP ni dependance. L'API conserve
  le payload JSON complet existant ; le parcours heberge reste a qualifier.
- Anciens brouillons : ressources vides par defaut. Saisies bornees a 4000
  caracteres pour l'URL et 8000 pour les notes ; types et dates normalises.
- La confirmation d'une fiche est une declaration du professionnel, pas
  une preuve que Rapport a consulte le site ou valide le contenu.

## Invalidation sans perte

Modifier l'URL annule son rattachement. Changer l'adresse, les coordonnees,
annuler ou renouveler la confirmation du lieu rend les anciens rattachements
caducs. Une nouvelle confirmation du lieu ne revalide pas les anciennes fiches.
Le professionnel doit les controler puis les rattacher explicitement.

Les liens et notes ne sont pas effaces. L'interface et l'export indiquent
`Rattachement au bien a verifier` ; l'export conserve aussi l'adresse du
rattachement precedent. Aucun constat, photo ou controle de protocole n'est modifie.
Les versions anterieures du frontend n'affichent pas ce nouvel objet : exporter
une copie JSON avant un retour arriere, puis la reprendre avec une version compatible.

## Securite et confidentialite

- Aucun appel automatique a GoRenove/Pro'Reno, iframe, scraping, widget ou
  cle. Ouverture externe uniquement sur action utilisateur.
- URL HTTPS uniquement, sans identifiants ni port non standard, domaines et
  routes de fiches autorises explicitement. Les parametres non necessaires
  sont retires. Un lien invalide reste editable mais n'est jamais navigable.
- Les PDF imbriques ne sont acceptes que sur les domaines Pro'Reno connus.
- Liens avec `noopener noreferrer` ; contenus manuels echappes dans l'export.
- Aucun nom, email, photo ou entretien ajoute aux liens. Le copier-adresse
  ne transmet rien au site ; la recherche externe est manuelle. Le fournisseur
  recoit la navigation et ses metadonnees reseau habituelles.
- Une interdiction du presse-papiers affiche un secours manuel. Aucun octroi
  automatique de permission navigateur.

## Sources verifiees le 15 septembre 2026

- [GoRenove](https://gorenove.fr/) : accueil et offre ponctuelle OPEN visibles ;
  acceptation de conditions laissee a l'utilisateur, recherche complete non realisee.
- [Presentation CSTB/BDNB](https://www.bdnb.io/services/gorenove/) : recherche
  a l'adresse, caracteristiques et performances dont certaines sont simulees.
- [Maisons](https://www.proreno.fr/documents/arborescence-des-fiches-typologie-de-maisons-individuelles)
  et [collectifs](https://www.proreno.fr/documents/arborescence-des-fiches-typologie-de-logements-collectifs) :
  arborescences officielles, sans choix automatique de typologie.
- [Exemple MI-3-b](https://www.proreno.fr/documents/fiche-typologie-analyse-du-parc-existant-mi-3-b) :
  « Ferme de village rue avant 1915 », exemple seulement, pas une correspondance au dossier.

## Recette de l'evolution 2

Utiliser un dossier fictif sur un port distinct de l'ancien prototype pour
ne pas remplacer le brouillon utilisateur. Aucun vrai compte, micro ou camera requis.

1. Avant confirmation du lieu : liens inactifs, notes disponibles.
2. Apres confirmation : liens externes disponibles, adresse a copier visible.
3. Coller un lien d'un autre domaine : erreur explicite et rattachement impossible.
4. Coller une fiche officielle, ajouter des notes et confirmer : source/date
   presentes ; rechargement/reprise conserve le rattachement.
5. Annuler puis reconfirmer le lieu : anciennes fiches a verifier, notes intactes.
6. Changer l'adresse : aucun ancien lien presente comme valide pour le nouveau
   bien ; les notes restent presentes. Verifier l'avertissement dans l'apercu.
7. Exporter le JSON, verifier puis reimporter sur un contexte de test ; verifier
   les deux ressources et leurs notes. Ne pas ecraser un brouillon utilisateur.
8. Tester Maison/Visite Globale et rapport technique ; controle clavier et
   affichage etroit. La phase Air activable de l'evolution 1 reste fonctionnelle.

## Limites restantes

### Liens directs au bien — evolution reportee

Le 15 septembre 2026, apres avoir demande l'ouverture directe du bien,
l'utilisateur confirme ne pas disposer des accords GoRenove et choisit de
conserver les acces externes actuels pour le moment. L'evolution est reportee,
pas en attente de realisation immediate. Les liens et le comportement de la
PR #63 restent inchanges : accueil GoRenove (connexion si necessaire),
arborescences Pro'Reno et recherche manuelle. Aucun pre-remplissage d'adresse.

Le [guide officiel de redirection RNB](https://gorenove.fr/assets/pdf/Guide_int%C3%A9gration_rnb.pdf),
accessible depuis l'accueil GoRenove, documente
`https://gorenove.fr/fiche-batiment?rnb=IDENTIFIANT_RNB`.
Il exige prealablement de contacter le support avec l'URL du site integrateur,
d'obtenir le droit d'utiliser le service et de signer les CGU specifiques
communiquees par email. L'absence d'accord AVEREO est confirmee par l'utilisateur.
Aucun appel a ce service ni acceptation de conditions n'a ete effectue.

En cas de reprise explicitement demandee et apres accord, il faudra identifier le ou les batiments RNB correspondant au
bien confirme ; une adresse ou un point sur une parcelle ne suffit pas a
garantir une correspondance unique. En cas de plusieurs candidats, demander
un choix explicite avant d'ouvrir la fiche. Ne pas reutiliser un identifiant
d'exemple ni presenter un batiment voisin comme le bien valide.

Pro'Reno est un catalogue documentaire par typologie, lot technique et besoin,
pas un annuaire de fiches par adresse, selon sa
[presentation officielle](https://programmeprofeel.fr/journal/proreno-la-ressource-pro-de-la-renovation-energetique/).
Un eventuel ciblage futur serait le type d'habitation deja renseigne, ou une
ressource retenue explicitement pour ce dossier, sans envoyer inutilement son adresse.
Ne pas inventer de parametre d'adresse ni annoncer un pre-remplissage non verifie.

Verification locale du 15 septembre : 49 tests frontend et compilation
reussis ; liens invalides refuses, confirmation manuelle, dates et notes,
rechargement/reprise, annulation et renouvellement du lieu controles dans
le navigateur. Le changement d'adresse conserve les notes sans rattachement
valide. Le JSON exporte a ete relu ; l'apercu HTML reprend sources, dates,
notes et avertissements. La compatibilite et le round-trip JSON des ressources
sont controles par tests unitaires ; l'import du fichier par l'interface et
le rendu Word natif n'ont pas ete requalifies dans ce lot.

Le navigateur integre refuse la copie automatique du presse-papiers : le
secours manuel a ete observe, sans changer les permissions. Le build a
necessite une execution hors bac a sable Windows (restriction de lecture de
configuration Vite), sans modification de la configuration applicative.
Le brouillon de recette `DEMO-RESSOURCES-20260915` est fictif et isole sur
le port 52873 ; les brouillons du port 52872 n'ont pas ete modifies.

TBD — association automatique adresse/BDNB/RNB, multi-batiments, quotas et
contrat d'API : hors perimetre de ce prototype de liens manuels. Aucun ID de
l'exemple utilisateur n'est reutilise automatiquement. Une source indisponible
n'est ni une preuve d'absence de donnees ni une validation technique.
Qualification CONNECT/MySQL et rendu bureautique natif a realiser avant production.
