# Plan des lots — AVEREO Vision

Version : Lot 0, 23/11/2026. Tenu par Claude Code (sous-agent scribe-cockpit). Le suivi canonique est `data/suivi-vision.json` ; ce fichier tient le détail des lots et des tâches.

## Règles de lecture
- Statuts : **à faire, en cours, délégué Codex, fait, annulé, reporté**. Pour « annulé » et « reporté », la colonne « Pourquoi » est obligatoire. Une ligne n'est jamais supprimée : on change son statut.
- Chaque lot est livrable seul, dans une branche `vision/lot-N-<sujet>` et une PR vers `main`. Le responsable fait les merges.
- Taille : **S** (quelques tâches, moins d'une journée de travail de l'agent), **M**, **L**. Indicative.
- « Qui » : **Claude** (Claude Code), **sous-agent** (explorateur, testeur, scribe-cockpit, verif-licences, relecteur-metres), **Codex** (tâche cadrée par un brief `docs/codex/briefs/T-NN-<sujet>.md`).
- Modèle et effort selon le tableau de `CLAUDE.md` : cadrage Opus (via opusplan) effort high ; implémentation Sonnet medium ; sous-agents Haiku low (licences : medium) ; relecteur-metres Opus high ; Codex : défaut de `.codex/config.toml` (medium), « le plus capable » en high pour les tâches complexes, `--model spark` en low pour le mécanique.
- Les tâches ci-dessous sont **prévues** ; elles se précisent au début de chaque lot (message « Lot N selon docs/plan-lots.md », puis accord du responsable). Celles des lots lointains sont volontairement grossières.
- Jamais délégué à Codex : ADR, architecture, choix de moteur ou de dépendance, écrans et charte, tout ce qui touche le serveur OVH.

## Tableau des lots
| Lot | Titre | Statut | Taille | Exigences couvertes | Portes (à franchir avant ou pendant) |
|---|---|---|---|---|---|
| 0 | Cadrage technique, sans code | fait (PR [#188](https://github.com/jpdandin44/AVEREO/pull/188) mergée le 23/11/2026, commit 54d3fba) | M | cadre toutes les exigences | ADR 0001 et décisions D1, D2, D4, D5, D6 acceptés le 23/11/2026 ; PR mergée ; inscription au cockpit appliquée le 23/11/2026 (source sur le worktree avereo-vision-lot0) |
| 1 | Fondations, plan 2D manuel, métrés, charte | en cours (code et tests faits ; PR en préparation) | L | R10, R11, R12, R23 à R35 (R27, R29, R32 en cours : essais smartphone et vraie pièce de référence) | pièce de référence et cotes laser fournies par le responsable (R29) ; décision sur caniuse-lite (CC-BY-4.0) |
| 2 | Projets, comptes, hors ligne, synchronisation, PWA | à faire | L | R01 à R06, R08, R09 | choix de la méthode d'authentification (À VÉRIFIER) |
| 3 | Capture terrain : cotes laser, photos, commentaires, vidéo jointe | à faire | L | R13 à R17, R36 à R38 | essais sur 1 Android et 1 iPhone fournis par le responsable |
| 4 | Exports CSV, PDF, DXF | à faire | M | R42, R43, R47, R48 | contrôle des licences de Gotenberg (Chromium, LibreOffice) ; décision D6 prise (règle serveur), audit de l'image Gotenberg à faire ; accord avant tout conteneur sur le serveur OVH |
| 5 | Maquette 3D, vue 3D, exports glTF et OBJ, partage par lien | à faire | L | R07, R39, R40, R45, R46 | — |
| 6 | Export IFC | à faire | M | R44 | décisions D1 et D5 prises le 23/11/2026 ; maquette 3D du lot 5 |
| 7 | Service de traitement, prototype de pipeline et essai de précision vidéo | à faire | L | R19, R22 | ADR validé ; accord explicite pour le serveur OVH ; décisions D2 et D6 prises le 23/11/2026 (essai en conteneur local autorisé ; mise en place sur OVH = accord séparé) ; serveur OVH relevé le 24/11/2026 (VPS-1, insuffisant : choix d'offre = accord séparé), vidéo et cotes de la pièce de référence |
| 8 | Reconstruction 3D depuis la vidéo (intégration au service) | à faire | L | R18, R20, R21, R41 | résultat de l'essai du lot 7 (précision, ressources) ; maquette 3D du lot 5 pour R41 |
| 9 | Finition et préparation de la livraison | à faire | M | revue de toutes les exigences, R30 final | toute livraison en préproduction ou production = décision séparée du responsable |

Ordre voulu : la reconstruction 3D (lots 7 et 8) vient **après** les exports PDF et DXF (lot 4). Les lots 5 et 6 peuvent passer avant ou après le lot 4 selon les priorités du responsable.

## Tableau des tâches

### Lot 0 — Cadrage technique, sans code
| Tâche | Statut | Pourquoi (si annulé ou reporté) | Qui | Modèle | Effort | Job Codex |
|---|---|---|---|---|---|---|
| T0-01 Lire le contexte, vérifier Codex, créer le worktree et la branche | fait | — | Claude | Sonnet | medium | — |
| T0-02 Rédiger `docs/exigences.md` | fait | — | Claude | Opus (plan) | high | — |
| T0-03 Rédiger `docs/adr/0001-moteurs.md` | fait | — | Claude | Opus (plan) | high | — |
| T0-04 Rédiger `docs/architecture.md` | fait | — | Claude | Opus (plan) | high | — |
| T0-05 Rédiger `docs/plan-lots.md` | fait | — | Claude | Opus (plan) | high | — |
| T0-06 Initialiser `docs/licences.md` (aucune dépendance installée ; dépendances prévues listées) | fait | — | Claude | Sonnet | medium | — |
| T0-07 Relecture adversariale de l'ADR et du plan (15 remarques : 13 traitées, 1 traitée en partie, 1 réfutée) | fait | — | Codex (`/codex:adversarial-review --base main`) | défaut Codex | — | — |
| T0-08 Relecture de toute la PR (1 remarque P2 traitée) | fait | — | Codex (`/codex:review --base main`) | défaut Codex | — | — |
| T0-09 Traiter les remarques, mettre à jour le suivi, ouvrir la PR | fait | — | Claude + scribe-cockpit | Sonnet / Haiku | medium / low | — |

### Lot 1 — Fondations, plan 2D manuel, métrés, charte
| Tâche | Statut | Pourquoi | Qui | Modèle | Effort | Job Codex |
|---|---|---|---|---|---|---|
| T1-01 Squelette Vite + React, `package.json`, commandes dans AGENTS.md | fait | — | Claude | Sonnet | medium | — |
| T1-02 Jetons, polices, logo, composants de base, tests R10, R11, R12 | fait | — | Claude | Sonnet | medium | — |
| T1-03 Modèle de données et unités en millimètres (R28, R35) | fait | — | Claude | Sonnet | medium | — |
| T1-04 Brief puis logique de métrés pure : REF-1, REF-2, REF-3, cas limites (R24 à R26, R31) | fait | — | Codex | défaut Codex | medium | task-mwudd6yr-q967pt |
| T1-05 Relecture des calculs de métré | fait | 10 remarques : 9 traitées (dimensions d'ouverture, hauteur nulle, sommet en double, hauteur de niveau, id de pièce, position entière, aller-retour des champs, chevauchement signalé, tests), 1 traitée dans la documentation (R31) | sous-agent relecteur-metres (Opus, lancé comme sous-agent général) | Opus | high | — |
| T1-06 Plan 2D Konva : murs, sommets, ouvertures, cotes, aimantation, annuler/rétablir (R32 à R34) | fait | — | Claude | Sonnet | medium | — |
| T1-07 Saisie rapide des cotes (moins de 6 champs) et panneau de métrés en temps réel (R23, R27) | fait | — | Claude | Sonnet | medium | — |
| T1-08 État de précision par mode (R30) et banc d'essai d'écart ≤ 20 mm avec cas limites 19/20/21 mm (R29) | fait | Banc d'essai livré avec un jeu provisoire : R29 reste en cours | Codex | défaut Codex | medium | task-mwudokoy-cwlkzv |
| T1-09 Contrôle des licences, `docs/licences.md` | fait | Seul point hors liste : caniuse-lite (CC-BY-4.0, transitive de développement), décision du responsable | sous-agent verif-licences (Haiku, lancé comme sous-agent général) | Haiku | medium | — |
| T1-10 Tests et build, rapport des échecs | fait | — | Claude (tests lancés directement : 114 réussis, build réussi) | — | — | — |
| T1-11 Relecture `/codex:review` de la PR, suivi et plan de lots à jour, relecture du diff | en cours | — | Codex ; Claude | défaut Codex | — | — |

### Lot 2 — Projets, comptes, hors ligne, synchronisation, PWA
| Tâche | Statut | Pourquoi | Qui | Modèle | Effort | Job Codex |
|---|---|---|---|---|---|---|
| T2-01 Choix et mise en place de l'authentification (R08), droits centralisés (R02) | à faire | — | Claude | Opus (plan) puis Sonnet | high puis medium | — |
| T2-02 Schéma MySQL du §4 de l'architecture ; migrations écrites, non exécutées | à faire | — | Codex (schéma fixé par Claude dans le brief) | défaut Codex | medium | — |
| T2-03 API PHP projets et synchro (push/pull, journal des conflits) (R01, R05, R06) | à faire | — | Claude | Sonnet | medium | — |
| T2-04 Stockage local Dexie, file d'envoi, enregistrement automatique (R03, R04) | à faire | — | Claude | Sonnet | medium | — |
| T2-05 PWA : manifeste, service worker, installation (R09) | à faire | — | Claude | Sonnet | medium | — |
| T2-06 Tests de synchronisation et de conflits sur jeux de données | à faire | — | Codex | défaut Codex | medium | — |
| T2-07 Essais hors ligne Android et iPhone, quota iOS | à faire | Essai physique par le responsable | responsable | — | — | — |
| T2-08 Licences, tests, relecture Codex, suivi | à faire | — | verif-licences / testeur / Codex / scribe | Haiku / Haiku / défaut / Haiku | medium / low / — / low | — |

### Lot 3 — Capture terrain : cotes laser, photos, commentaires, vidéo jointe
| Tâche | Statut | Pourquoi | Qui | Modèle | Effort | Job Codex |
|---|---|---|---|---|---|---|
| T3-01 Écrans de capture mobile (cibles ≥ 48 px, peu de saisie) (R13) | à faire | — | Claude | Sonnet | medium | — |
| T3-02 Saisie des 3 cotes laser et état « hors tolérance » (R17) | à faire | — | Claude | Sonnet | medium | — |
| T3-03 Photos et commentaires placés sur le plan (R36, R37, R38) | à faire | — | Claude | Sonnet | medium | — |
| T3-04 Capture vidéo MediaRecorder + secours fichier (R14) | à faire | — | Claude | Sonnet | medium | — |
| T3-05 Envoi reprenable (tus ou morceaux maison) côté API et navigateur (R15) | à faire | — | Codex (choix tus vs maison fait par Claude) | `--model` le plus capable | high | — |
| T3-06 Rattachement des vidéos aux pièces (R16) | à faire | — | Claude | Sonnet | medium | — |
| T3-07 Essais sur 1 Android et 1 iPhone (formats vidéo, caméra en PWA iOS) | à faire | Essai physique par le responsable | responsable | — | — | — |
| T3-08 Licences, tests, relecture Codex, suivi | à faire | — | verif-licences / testeur / Codex / scribe | Haiku / Haiku / défaut / Haiku | medium / low / — / low | — |

### Lot 4 — Exports CSV, PDF, DXF
| Tâche | Statut | Pourquoi | Qui | Modèle | Effort | Job Codex |
|---|---|---|---|---|---|---|
| T4-01 Export CSV des métrés (R47) | à faire | — | Codex | `--model spark` | low | — |
| T4-02 Export DXF du plan (R43) | à faire | — | Codex | défaut Codex | medium | — |
| T4-03 Gabarit HTML du dossier PDF selon le §6.1 de la charte, appel de Gotenberg (R42) | à faire | — | Claude | Sonnet | medium | — |
| T4-04 Contrôle des licences de Gotenberg (Chromium, LibreOffice) avant adoption, décision D6 | à faire | — | sous-agent verif-licences | Haiku | medium | — |
| T4-05 Test de cohérence écran, CSV et PDF (R48) | à faire | — | Codex | défaut Codex | medium | — |
| T4-06 Relecture visuelle du PDF par rapport à la charte | à faire | — | Claude | Sonnet | medium | — |
| T4-07 Tests, relecture Codex, suivi | à faire | — | testeur / Codex / scribe | Haiku / défaut / Haiku | low / — / low | — |

### Lot 5 — Maquette 3D, vue 3D, glTF, OBJ, partage
| Tâche | Statut | Pourquoi | Qui | Modèle | Effort | Job Codex |
|---|---|---|---|---|---|---|
| T5-01 Maquette 3D depuis le plan : murs, sol, plafond, ouvertures percées (R39) | à faire | — | Claude | Sonnet | medium | — |
| T5-02 Vue 3D navigable PC et mobile en WebGL (R40) | à faire | — | Claude | Sonnet | medium | — |
| T5-03 Exports glTF et OBJ, test avec glTF-Validator (R45, R46) | à faire | — | Codex | défaut Codex | medium | — |
| T5-04 Partage par lien en lecture seule, jetons, révocation (R07) | à faire | — | Claude | Sonnet | medium | — |
| T5-05 Licences, tests, relecture Codex, suivi | à faire | — | verif-licences / testeur / Codex / scribe | Haiku / Haiku / défaut / Haiku | medium / low / — / low | — |

### Lot 6 — Export IFC
| Tâche | Statut | Pourquoi | Qui | Modèle | Effort | Job Codex |
|---|---|---|---|---|---|---|
| T6-01 Spécification écrite du sous-ensemble IFC4 (site, bâtiment, niveaux, espaces, murs, dalles, portes, fenêtres) | à faire | D1 prise : générateur maison | Claude | Opus (plan) | high | — |
| T6-02 Générateur IFC4 STEP maison selon la spécification (R44) | à faire | D1 prise : générateur maison (réexamen possible par nouvel ADR) | Codex | `--model` le plus capable | high | — |
| T6-03 Validation du fichier par un validateur de schéma IFC | à faire | D5 prise : IfcOpenShell en outil de test seulement (hors application et conteneurs) | Claude | Sonnet | medium | — |
| T6-04 Licences, tests, relecture Codex, suivi | à faire | — | verif-licences / testeur / Codex / scribe | Haiku / Haiku / défaut / Haiku | medium / low / — / low | — |

### Lot 7 — Service de traitement, prototype de pipeline et essai de précision vidéo
| Tâche | Statut | Pourquoi | Qui | Modèle | Effort | Job Codex |
|---|---|---|---|---|---|---|
| T7-01 Dossier de ressources pour le serveur OVH (CPU, GPU, mémoire, disque) et demande d'accord au responsable | à faire | Aucune mise en place avant accord | Claude | Opus (plan) | high | — |
| T7-02 Image de conteneur du service (COLMAP compilé sans LSD, CGAL ni GPU, SiftGPU absent), exécutée en local seulement | à faire | D2 (CPU seul) et D6 pris ; essai en conteneur local seulement, accord séparé pour OVH | Codex | `--model` le plus capable | high | — |
| T7-07 Prototype minimal du pipeline (extraction d'images, COLMAP CPU, mise à l'échelle par cotes laser, contrôle), exécuté en local, **à faire avant T7-04** pour produire l'essai de précision | à faire | Sans prototype, l'essai du lot 7 ne peut pas exister | Codex | `--model` le plus capable | high | — |
| T7-03 File de tâches, statuts, API de dépôt (R19) | à faire | — | Claude | Sonnet | medium | — |
| T7-04 Essai de précision sur la vidéo de la pièce de référence, rapport chiffré (R22) | à faire | Dépend de la vidéo et des cotes fournies par le responsable | Claude + responsable | Sonnet | medium | — |
| T7-05 Instruction des licences : Boost, Eigen, FFmpeg, programmes embarqués (décision D6) | à faire | — | sous-agent verif-licences | Haiku | medium | — |
| T7-06 Tests, relecture Codex, suivi | à faire | — | testeur / Codex / scribe | Haiku / défaut / Haiku | low / — / low | — |

### Lot 8 — Reconstruction 3D depuis la vidéo
| Tâche | Statut | Pourquoi | Qui | Modèle | Effort | Job Codex |
|---|---|---|---|---|---|---|
| T8-01 Intégration du pipeline au service : densification (chemin CPU d'OpenSfM à démontrer), maillage, export glTF (R20) | à faire | Dépend du lot 7 (prototype T7-07 et essai T7-04) | Codex | `--model` le plus capable | high | — |
| T8-02 Mise à l'échelle par cotes laser et contrôle (R21) | à faire | — | Codex (formule fixée dans le brief) | défaut Codex | medium | — |
| T8-03 Mire ArUco de secours (R18) | à faire | — | Codex | défaut Codex | medium | — |
| T8-04 Affichage et superposition du maillage reconstruit (R41) | à faire | — | Claude | Sonnet | medium | — |
| T8-05 Relecture des calculs d'échelle et de précision | à faire | — | sous-agent relecteur-metres | Opus | high | — |
| T8-06 Licences, tests, relecture Codex, suivi | à faire | — | verif-licences / testeur / Codex / scribe | Haiku / Haiku / défaut / Haiku | medium / low / — / low | — |

### Lot 9 — Finition et préparation de la livraison
| Tâche | Statut | Pourquoi | Qui | Modèle | Effort | Job Codex |
|---|---|---|---|---|---|---|
| T9-01 Revue de toutes les exigences : statut, preuve, test | à faire | — | Claude + scribe-cockpit | Sonnet / Haiku | medium / low | — |
| T9-02 Accessibilité et charte sur tous les écrans | à faire | — | Claude | Sonnet | medium | — |
| T9-03 Documentation de développement local, déploiement, retour arrière | à faire | — | Claude | Sonnet | medium | — |
| T9-04 Préparation de la préproduction (dossier seulement ; livraison = décision du responsable) | à faire | — | Claude | Opus (plan) | high | — |

## Dépendances principales
- Lot 1 avant tous les autres (modèle, métrés, charte).
- Lot 2 avant les lots 3 et 5 (projets, synchronisation, partage).
- Lot 4 avant le lot 7 (voulu par le responsable).
- Lot 7 avant le lot 8 (le prototype et l'essai de précision du lot 7 précèdent l'intégration du lot 8).
- Lot 5 avant les lots 6 et 8 (la maquette 3D sert à l'IFC et à la superposition R41). Le DXF (lot 4) ne dépend que du modèle, pas de la 3D.
- R04 (hors ligne, lot 2) ne recette que la saisie de cotes ; la photo hors ligne est recettée avec R38 au lot 3.
- Décisions D1, D2, D4, D5 et D6 prises le 23/11/2026. Avant le lot 7 : choix de l'offre OVH (le VPS-1 relevé le 24/11/2026 est insuffisant) et accord séparé pour toute mise en place sur OVH ; audit de l'image Gotenberg au lot 4.

## Remarques de découpage (relecture Codex du Lot 0)
- Les lots 1, 2 et 5 regroupent plusieurs capacités. Le contenu du lot 1 (plan 2D manuel, métrés, charte) est imposé par le message du Lot 0 ; ses tâches sont ordonnées pour que chacune soit démontrable seule. Au début de chaque lot, Claude Code propose, avec l'accord du responsable, de le couper en deux PR si un blocage (matériel, authentification) menace de bloquer des fonctions déjà vérifiables. Coupes envisagées : lot 2 en 2A (API, authentification, projets) et 2B (hors ligne, synchronisation, PWA) ; lot 5 en 5A (maquette 3D, glTF, OBJ) et 5B (partage par lien).
- Cette coupe se décide au lancement du lot, pas maintenant : elle ne change ni les exigences couvertes ni les dépendances ci-dessus.
