---
project: avereo-platform
document_type: standard
title: Règle des fonctionnalités communes AVEREO
status: active
version: git
created: 2026-11-06
updated: 2026-11-06
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

## Mon espace

- Déclencheur **Mon espace**, sous-titre **Compte AVEREO**, avatar neutre **MOI**.
- Pied de la navigation latérale ; dans l’en-tête lorsque l’application ne possède
  pas de barre latérale permanente. Pas de déconnexion flottante au-dessus du travail.
- Menu ouvert au clic, fermé par le choix d’une action, un clic extérieur ou Échap.
  Navigation au clavier, focus visible et retour au déclencheur avec Échap.
- Panneau dans les limites de l’écran, défilable sur petit écran ; bouton compact
  conservant son nom accessible. L’impression masque les commandes de compte.
- La déconnexion conserve le parcours de l’application, sa confirmation éventuelle
  et la sauvegarde préalable existante. Elle ne supprime pas les dossiers.

| Fonction | Règle commune |
| --- | --- |
| Mes projets / Mes rapports / Mes biens | Conserver le nom du contenu métier et son action existante. Indiquer explicitement quand il est local. |
| Préférences | Afficher cette entrée lorsqu’un écran de préférences existe. Décrire leur portée : navigateur ou compte. |
| Mon compte | Identité et accès gérés dans CONNECT ; Projet peut d’abord présenter son écran explicatif. |
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
`administration` et `logout`. Aucun appel API métier, stockage de données ou
authentification n’est ajouté au composant.

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
