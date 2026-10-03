---
project: protocole-developpement
document_type: security-validation
title: Périmètre et validation sécurité et données du protocole commun
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [developpement, revue, donnees]
---

# Validation du lot commun

Le lot ajoute un socle d'outillage et des liens documentaires. Il n'altère pas le code des applications, leurs bases, secrets, DNS ou environnements hébergés. Les workflows de déploiement existants restent sous leurs déclencheurs et accords propres.

Le contrôleur de passage est en lecture seule. Ses tests utilisent des données fictives. Les observations GitHub de la phase locale sont datées ; elles ne constituent ni revue humaine, ni accord de merge, ni autorisation de livraison.

L'installateur Windows crée des jonctions dans les emplacements de skills du profil choisi. Il préserve les dossiers ordinaires ; le remplacement explicite concerne seulement des jonctions. Il ne change ni les secrets, ni les permissions GitHub, ni le contenu des projets. Les liens doivent rester dirigés vers un checkout disponible du socle.

Le lanceur du cockpit utilise la boucle locale et une configuration privée de machine. Il refuse un port déjà occupé par un autre chantier. La restauration d'un site et les contrôles réels de production sont des travaux propres à chaque projet, sans réussite déduite de cette PR.

Contrôles du lot : validation de la structure des skills, tests de refus et d'acceptation des preuves fictives, cohérence documentaire et essai de l'installateur dans un profil temporaire. Les résultats observés sont conservés dans le suivi du lot. Cette vérification ne constitue pas un audit de tous les dépôts ou de toutes les applications.
