---
project: avereo-app-passeport-immo
document_type: session-handoff
title: Point de reprise de session
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [passeport-immo, local, cockpit]
---

# Point de reprise de session

## Disponible
Prototype local React/Tailwind après phase 0, puis raccordement demandé au protocole
GitHub/cockpit et correction PDF autorisée. Quatorze tests, build et parité a/b/c+d
réussis ; le même export court réel donne une page A4 complète.
La [fiche générée](iteration-developpement.md), issue du seul suivi JSON, identifie
le candidat, la PR nº71, les observations CI et les blocages. Ne pas la modifier à la main.
La CI et le candidat local sont identiques octet par octet, manifeste et cinq assets
vérifiés. Consulter cette fiche pour les SHA et dates ; ils ne sont pas dupliqués ici.

## Git et périmètre
Branche active : `feat/passeport-immo-suivi`, complément de pilotage post-fusion.
PR nº71 fusionnée par le responsable, observation vérifiée sur GitHub et dans main.
Base du prototype : `f4695d662546fe7277bf3a50c8c975ce97e8b9a0`.
Fusion observée dans main : `6399524cc0f92a90ab9c53c1990f07016e827775`.
La publication par connecteur GitHub a conservé exactement l'arbre local après
échec d'authentification du Git habituel. Les branches locales phase-0, phase-1
et `feat/passeport-immo-cockpit-local` conservent les étapes précédentes.
Le clone Collector original et la source CONNECT historique sont préservés.
Les chemins du poste, imports, données navigateur et preuves locales sont hors Git.

## Autorisation et état
Accords de périmètre : « Phase 0 puis prototype local dans cette session », puis
invocation du skill et « Raccordement et correction du PDF ».
Les six statuts formels, décisions et événements de revue restent inchangés :
phase 0 en cours, phase 1 formellement non commencée ; la copie locale reste
disponible sous l'accord de session. La checklist GitHub humaine et la fusion valident le lot source nº71 ; les phases
formelles et la recette détaillée restent distinctes. Aucun accord de déploiement,
d'accès production ou d'ouverture n'a été acquis.
Préproduction dédiée o2switch choisie ; adresse/répertoire et accès non déterminés.
Préproduction et production : isolement/vacuité ou sauvegarde
restaurée, intégration CONNECT et retour arrière à qualifier.

## Ouvrir et reprendre
Application : `../start-local.cmd`, <http://127.0.0.1:5175/>, « Se connecter ».
Cockpit Projet : `../start-review.cmd`, <http://127.0.0.1:5193/>.
Dans phase 1, sélectionner le document « Itération GitHub et cockpit ».
Les deux services ont été lancés sur ce poste ; leurs instances peuvent être arrêtées
par Ctrl+C dans leur terminal. Ne pas arrêter un service inconnu occupant le port.

Tests et build depuis `frontend/` ; parité depuis le sous-projet.
Lire le [mapping du protocole](../workflows/developpement-github-cockpit.md)
pour packaging et contrôles de passage. Les paramètres locaux du skill et du rendu
sont dans `.local/review-settings.json` ignoré.
Avant chaque écriture du suivi, vérifier l'absence de `.projet-review.lock`,
puis régénérer les vues et utiliser `--check`.

## Suite et limites
Recette humaine R01…R13 et téléphone réel ouverts. Q09 est résolue techniquement ;
h/ml à zéro, partage d'URL et groupement PDF par nom restent inchangés.
Docker : configuration vérifiée, image non exécutée. Avertissement de bundle conservé.
Qualifier la cible dédiée o2switch et le lot CONNECT, puis préparer un accord
portant sur le candidat exact. Les contrôles de passage refusent les preuves absentes.
Claude n'a pas été consulté : interface accessible à l'écran de connexion dans
le lot initial ; le prompt fourni reste une ressource, sans session ouverte à sa place.

## Vérification documentaire
Socles du sous-projet et de la racine présents. Contrôle des métadonnées simples,
liens locaux, matrice, JSON, vues dérivées et lecture native du cockpit effectué.
Les détails et preuves sont dans [raccordement-cockpit.md](raccordement-cockpit.md).
Le périmètre vérifié est ce lot ; audit global des autres applications : TBD.
