---
project: avereo-app-passeport-immo
document_type: user-guide
title: Accéder au suivi Passeport Immo
status: active
version: git
created: 2026-10-03
updated: 2026-10-14
owner: jpdandin
tags: [avereo, documentation, local]
---

# Accéder au suivi Passeport Immo

## Accès
Le responsable double-clique sur `../start-review.cmd`. Le chantier est affiché
par l'AVEREO Projet de cette copie du dépôt à <http://127.0.0.1:5193/>.
Le lot de raccordement utilise ce serveur pour vérifier les vues. Aucun compte requis.
Le tableau courant présente quatre phases. La fiche d’itération initiale conservée
en Cadrage reste historique ; les livrables du lot documentaire se trouvent dans
« Développement local ».

## Préparer et vérifier
Depuis `../avereo-app-projet/frontend`, installer les dépendances avec `npm ci`
si elles sont absentes. Ne pas remplacer le service de revue par un outil nouveau.
Le lanceur utilise le chemin relatif du dossier docs et le port 5193 strict.
Le contrat [de revue](../../avereo-app-projet/api/revue-locale.md) et le
[guide commun](../../avereo-app-projet/docs/guide-utilisateur.md) expliquent les actions.

## Reprise et sauvegarde
Le [suivi](suivi-chantier.json) porte l'avancement ; les vues sont générées.
Les sauvegardes avant décisions se trouvent dans `.review-backups/` hors Git.
Les paramètres du poste sont dans `../.local/review-settings.json` hors Git.
Si le port est occupé, ne pas arrêter un service inconnu. Le lanceur reste au
premier plan ; Ctrl+C arrête sa propre instance. L'adresse est limitée à ce PC.

## Actualisation et reprise de la revue

Le serveur de cette copie vérifie automatiquement les PR référencées toutes les
minutes avec GitHub CLI connecté sur le poste. L'écran relit les observations
sans recharger la page et conserve les cases de revue. Si une preuve change
pendant la lecture, utiliser **Charger les nouvelles preuves** avant une décision
normale. Le guide commun décrit aussi **Forcer le passage à la phase suivante**,
avec motif et confirmation spécifiques.

Une fiche d'itération approuvée conserve sa version historique. Le JSON, les
cartes GitHub et les tableaux affichent l'état actuel du chantier. Les décisions
sur disque survivent à la fermeture du serveur ; un brouillon non enregistré
reste propre à la page ouverte.

## Serveur arrêté et approbation indisponible

Si l'adresse refuse la connexion, le serveur de revue doit être relancé avec
`../start-review.cmd`. Le service de l'application sur 5175 et celui du suivi
sur 5193 sont deux services distincts. Le 14 octobre, le suivi a été relancé
en arrière-plan sur ce poste ; la lecture de l'état et la synchronisation GitHub
ont été vérifiées. Fermer le serveur ou redémarrer le PC nécessite un nouveau lancement.

Une PR fusionnée actualise sa carte, sans soumettre ni approuver automatiquement
la phase. « Soumettre à la revue » demande tous les livrables déclarés et des
preuves amont courantes. « Approuver la phase » apparaît ensuite lorsque la phase
est soumise ; le responsable examine chaque document et coche chaque critère.

Lors du diagnostic de la PR nº78, la phase Développement local mélangeait cinq
documents disponibles et un livrable CONNECT absent, ainsi que deux critères
CONNECT non réalisés. Le responsable a limité la revue au lot documents/coupes :
les cinq livrables sont maintenant « À valider » avec trois critères. CONNECT
reste un prérequis explicite et non livré de Préproduction, à réaliser avant
toute installation distante ; aucune approbation n’a été ajoutée.

Dans Développement local, choisir chaque document puis cocher « J’ai examiné
cette version du livrable ». Dans « Critères », vérifier les trois cases. L’action
« Approuver la phase » nécessite ensuite le nom du décideur, un commentaire et
la confirmation explicite. L’autorisation de la phase suivante reste distincte.
