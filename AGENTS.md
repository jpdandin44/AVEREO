# Règles de développement du projet

Ces règles constituent la base de fonctionnement du monorepo. Elles s'appliquent à toute intervention, y compris lorsqu'un `AGENTS.md` plus spécifique complète les contraintes d'une application.

## 1. Réfléchir avant de coder et respecter les bases

Avant toute modification :

- reformuler l'objectif ;
- énoncer les hypothèses ;
- signaler les ambiguïtés ;
- demander une clarification lorsqu'une décision peut modifier le comportement, les données, l'architecture, la sécurité ou le déploiement ;
- proposer une solution plus simple lorsqu'elle existe ;
- ne jamais choisir silencieusement une interprétation incertaine.

## 2. Privilégier la simplicité

Produire le minimum de code nécessaire pour résoudre correctement la tâche.

Ne pas ajouter :

- d'abstraction spéculative ;
- de flexibilité non demandée ;
- de dépendance inutile ;
- d'architecture destinée à un besoin futur non confirmé.

Avant de livrer, vérifier qu'un développeur senior ne considérerait pas la solution comme inutilement complexe.

## 3. Réaliser des changements chirurgicaux

Modifier uniquement ce que la tâche exige.

Ne pas :

- refactorer le code voisin ;
- reformater un fichier complet ;
- renommer des éléments sans nécessité ;
- mettre à jour des dépendances sans rapport ;
- corriger d'autres anomalies au passage.

Chaque ligne modifiée doit être justifiée par la demande.

## 4. Piloter l'exécution par des résultats vérifiables

Avant de coder, définir :

- le résultat fonctionnel attendu ;
- les critères d'acceptation ;
- les cas nominaux ;
- les cas invalides ;
- les tests à écrire ou à exécuter ;
- les commandes de vérification.

Pour une correction de bug :

1. reproduire le problème ;
2. écrire ou identifier un test en échec ;
3. appliquer la correction minimale ;
4. faire réussir le test ;
5. vérifier l'absence de régression.

## 5. Contrôler le périmètre

Avant toute modification, annoncer :

- les fichiers concernés ;
- la raison de chaque modification ;
- les éléments explicitement hors périmètre.

Si le périmètre doit être élargi, demander une validation avant de poursuivre.

## 6. Vérifier avant de livrer

Exécuter, selon le projet :

- les tests ciblés ;
- les tests du module ;
- le lint ;
- le contrôle des types ;
- le build ;
- les tests d'intégration concernés.

Ne jamais masquer un échec en supprimant un test, en affaiblissant une assertion ou en désactivant une règle de contrôle.

## 7. Relire le diff

Avant livraison :

- examiner l'intégralité du diff ;
- supprimer les modifications sans rapport ;
- vérifier qu'aucun fichier inattendu n'a changé ;
- vérifier que la solution reste simple et limitée.

## 8. Rendre compte honnêtement

À la fin, indiquer :

- le résultat obtenu ;
- les fichiers modifiés ;
- les tests exécutés ;
- leurs résultats ;
- les hypothèses restantes ;
- les risques ou limites ;
- les validations humaines encore nécessaires.

Ne jamais annoncer qu'une tâche est terminée si elle n'a pas été vérifiée.

## 9. Actions nécessitant une validation humaine

Ne pas réaliser sans autorisation explicite :

- merge ;
- déploiement ;
- mise en production ;
- suppression de données ;
- migration irréversible ;
- modification de secrets ;
- modification majeure d'architecture ou d'authentification.

## 10. Checklist des pull requests

- conserver la structure de `.github/pull_request_template.md` sauf demande explicite du responsable du projet ;
- remplacer les emplacements du modèle par les liens directs vers l'application locale, le diff de la pull request, la validation sécurité/données et la documentation ;
- laisser toutes les cases décochées lors de la création ou de la mise à jour d'une pull request ;
- fournir les contrôles exécutés et leurs résultats dans la section `Validation`, sans les transformer en attestation humaine ;
- réserver la validation et le cochage de la checklist au responsable humain du projet.
