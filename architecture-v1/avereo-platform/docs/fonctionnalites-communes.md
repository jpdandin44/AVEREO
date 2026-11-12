---
project: avereo-platform
document_type: standard
title: Règle des fonctionnalités communes AVEREO
status: active
version: git
created: 2026-11-06
updated: 2026-11-12
owner: jpdandin
tags: [avereo, interface, fonctions-communes]
---

# Fonctionnalités communes AVEREO

## Règle applicable

Une même fonction de compte conserve le même nom, le même comportement et une
implémentation commune dans les applications AVEREO. Avant de créer un équivalent,
réutiliser le socle ; chaque application fournit uniquement ses actions métier.
Tout écart nécessaire est décrit dans son audit source, avec sa raison et sa portée.
Une fonction annoncée doit exister : un menu ne crée ni droit ni stockage en ligne.

## Mon compte

- Le déclencheur clair **Mon compte** reste en bas à gauche. Le logo officiel et les actions de sauvegarde et de sortie occupent le bandeau supérieur. [Modèle, réglages et recette](modele-affichage.md).
- Menu ouvert au clic, fermé par le choix d’une action, un clic extérieur ou Échap.
  Navigation au clavier, focus visible et retour au déclencheur avec Échap.
- Panneau dans les limites de l’écran, défilable sur petit écran ; bouton compact
  conservant son nom accessible. L’impression masque les commandes de compte.
- La déconnexion conserve le parcours de l’application, sa confirmation éventuelle
  et la sauvegarde préalable existante. Elle ne supprime pas les dossiers.

| Fonction | Règle commune |
| --- | --- |
| Mes projets | Même libellé dans les applications métier ; ouvrir exclusivement leur liste native. Le contenu et le stockage restent propres à l’application. CONNECT, portail sans projets métier, ne présente pas cette rubrique. |
| Préférences | Réglages propres à l’application ; même dialogue partagé lorsque nécessaire. Dans CONNECT, distinguer le médaillon personnel enregistré sur le compte des préférences applicatives locales. Ne jamais modifier les projets existants ni les préférences d'un autre compte. Afficher leur portée de stockage. |
| Mon compte | Ouvrir le profil CONNECT du même environnement ; destination commune, y compris depuis Projet. |
| Mes applications | Ouvrir le catalogue CONNECT du même environnement, dans un autre onglet pour préserver le travail courant. |
| Gérer les comptes | Action native CONNECT visible aux administrateurs autorisés ; les autres applications ne dupliquent pas les habilitations. |
| Administration de l’application | Conserver, si elle existe, l’administration métier et son contrôle de rôle ; la distinguer de la gestion des comptes CONNECT. |
| Se déconnecter | Dernière action ; réutiliser le mécanisme natif. RGA conserve son propre cookie et sa propre sortie. |

Le manifeste [account-menu-applications.json](../data/account-menu-applications.json)
porte la liste des intégrations et capacités. Saisie unique embarque le même composant
dans son fichier autonome et expose seulement ses dossiers locaux et préférences. Le frontend historique CONNECT
reste distinct du portail PHP réellement utilisé. Les outils internes de revue locale
et les prototypes archivés ne deviennent pas des applications client par ce lot.

## Source et intégration

[account-menu.js](../shared/account-menu.js) définit le composant natif
`avereo-account-menu`. Son style est isolé ; les actions des applications sont des
boutons/liens existants dans les emplacements `items`, `account`, `applications`,
`administration` et `logout`. Le composant ne réalise pas l'authentification ni d'appel API de dossiers métier. Le candidat du 12 novembre lit la préférence personnelle par la session CONNECT et permet son édition dans CONNECT uniquement ; il ne crée aucun droit. [Contrat privé, CORS et limites](medaillon-personnel.md). Les autres préférences définies par l’application restent dans une clé localStorage
`avereo.<application>.preferences.v1`. Les champs autorisés sont décrits par
`preferences-fields` ; les événements `avereo-preferences-change` sont filtrés
par identifiant applicatif. `shared/use-app-preferences.js` raccorde React sans
seconde dépendance React. Une erreur de stockage garde le formulaire ouvert ;
annuler ne modifie rien. Les données métier ne passent pas par ce composant.

Le portail public est fourni après le contrôle d’accès par la métadonnée
`avereo-connect-portal`. Une page intégrée peut lire celle de son parent de même
origine. Sans portail valable, les liens de compte par défaut sont absents et un
message décrit cette indisponibilité. Les actions locales existantes restent utilisables.
Les URL du portail n’incluent ni secret ni identité. Les liens refusent les protocoles
actifs, les domaines extérieurs et les identifiants intégrés à l’URL.

Le script [prepare-account-menu.mjs](../../../.github/scripts/prepare-account-menu.mjs)
copie la source avant `dev` et `build`. Les copies frontend sont ignorées par Git.
La copie du portail PHP CONNECT est versionnée parce que son paquet existant est
construit depuis Git sans étape Node ; le contrôle CI en vérifie l’égalité exacte.
Ne jamais modifier ces copies à la main. Saisie unique importe directement cette source
dans son bundle autonome, sans dépendance réseau.

## Toute prochaine fonction transversale

1. Vérifier l’existant, les applications concernées et la source de vérité.
2. Définir les libellés, les comportements, les états indisponibles et les adaptations
   métier ; conserver les droits et la portée réelle des données.
3. Implémenter une seule source commune et des raccordements limités.
4. Vérifier les variantes HTML/React, le clavier, les petits écrans, les actions
   natives et la présence du composant dans chaque fichier de livraison.
5. Documenter les écarts et rattacher le candidat au suivi canonique.

Les quatre phases restent **Cadrage → Développement local → Préproduction → Mise en production**.
Une fusion de PR n’établit pas une livraison. Chaque cible de préproduction doit
être identifiée, sauvegardée et restaurée sur copie avant remplacement autorisé.
La production et l’ouverture publique conservent leurs accords distincts.

## Vérification de ce lot

[Suivi canonique](../data/suivi-fonctions-communes.json) ·
[Qualification et limites](qualification-mon-espace.md).

## Adaptations métier du candidat PR #121

| Application | Mes projets | Préférences propres |
| --- | --- | --- |
| Projet | Espace privé et dossiers du planning existants | Préférences natives de ProjectWorkspace, inchangées |
| Rapport | Accueil des rapports et sauvegardes natives ; sauvegarde du brouillon avant sortie | Format proposé pour un nouveau rapport : expert ou synthèse client ; ne transforme pas un rapport existant |
| RGA | Liste locale des points repérés, distincte des rapports ; consultation Géorisques relancée à l’ouverture | Ordre des départements et intensité de la couche RGA |
| Coupe | Sélecteur natif de projets en ligne | Grille et aimantation de l’éditeur |
| Thermo | Rapports locaux indépendants, conservation du brouillon historique avant changement | Tri des rapports et affichage du nom des étapes |
| Drone | Missions locales ; enregistrement de la mission avant retour à la liste | Tri des missions et affichage des missions archivées |
| Passeport Immo | Liste native des biens, selon son mode serveur ou démonstration | Tri par adresse et composition visible dans la liste |
| CONNECT | Sans rubrique de projets, conformément à la décision du responsable | Tri du catalogue et affichage des applications non accessibles ; aucun droit modifié |

Les réglages de cette ancienne extension #121 sont propres au navigateur. Ils ne se synchronisent pas par
le compte CONNECT ; le médaillon personnel du candidat du 12 novembre est une exception distincte. Projet conserve sa portée native. Thermo, Drone et les points
RGA restent locaux : cette extension de menu ne crée pas leur synchronisation en
ligne. Recherche n’a pas de cible préproduction déclarée et Saisie unique reste
son application autonome ; leurs fonctions métier sont hors de cette extension.

## Identité des organisations et livrables

Les préférences personnelles restent propres à chaque application. L’identité
d’entreprise et ses mentions relèvent d’une configuration de l’organisation,
modifiable uniquement par son administrateur et utilisée par tous ses membres.
La [règle des livrables](identite-livrables.md) définit les responsabilités, la
priorité AVEREO, les adaptations métier et les éléments encore à implémenter.
Le menu actuel et son stockage local ne réalisent pas ce contrôle d’administration.

## Missions depuis Mon compte

Afficher **Missions** selon les capacités de l’application et de la surface ouverte. Coupe, RGA et Passeport Immo utilisent un menu `no-missions`. Il retire l’action et empêche l’ouverture du formulaire, y compris si le générateur de Rapport est déjà chargé. La préparation des fichiers de Coupe et Passeport Immo écarte aussi les anciennes copies du générateur. RGA partage les ressources de Rapport et applique son propre choix sur l’accueil et sur la carte. Les autres rubriques conservent leur comportement. [Manifeste des capacités](../data/account-menu-applications.json) · [Périmètre métier](protocole-missions.md#applications-qui-génèrent-des-missions).
