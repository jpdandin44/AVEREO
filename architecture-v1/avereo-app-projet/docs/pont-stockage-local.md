---
project: avereo-app-projet
document_type: guide-technique
title: Pont Drupal CONNECT et stockage privé — candidat local
status: active
version: git
created: 2026-11-07
updated: 2026-11-07
owner: jpdandin
tags: [developpements, local, prive, stockage, connect]
---

# Pont et stockage privé — local uniquement

## Résultat et limites

Le candidat implémente le contrôle d'habilitation Drupal → CONNECT → lecteur Projet et une copie de consultation persistante, privée, séparée du Gantt. Les quatre phases, versions, critères et preuves proviennent des suivis canoniques, sans écriture retour ni validation humaine créée.

**Ce n'est pas un raccordement SSO installé.** Les nouveaux services PHP ne sont pas déployés. Aucun identifiant réel n'est épinglé dans une configuration active ; aucun rôle, compte, secret hébergé ou dossier client n'est modifié. La recette du pont complet utilise des identités fictives. La copie des vrais suivis se consulte séparément avec l'accès privé du poste explicitement autorisé, sans revendiquer une attestation CONNECT réelle.

## Composants et frontières

1. Drupal fournit une décision brève depuis le compte natif actuellement actif et son rôle global réellement configuré.
2. CONNECT exige son propriétaire exact, le compte lié actif, la session non révoquée et le droit Projet ; il interroge Drupal puis relit les droits avant de répondre.
3. Projet contrôle la décision signée à chaque accès protégé, y compris page, ressources, état, détail et preuve. Une panne, révocation, réponse fausse ou ancienne ferme l'accès ; aucune décision positive n'est mise en cache.
4. L'exporteur lit uniquement les sources du registre consultatif et les preuves expressément sélectionnées. Il vérifie les empreintes après lecture, sans promettre un instantané transactionnel de plusieurs dépôts.
5. Le stockage vérifie le paquet puis active un index signé atomiquement. Le lecteur ne sait ni approuver un critère, ni modifier un suivi, ni publier un déploiement.

[Contrat d'autorisation CONNECT et Drupal](../../avereo-app-connect/api/developments-authorization.md). Le ticket de lancement CONNECT existant ne reçoit pas un booléen global et conserve son comportement.

## Trois modes explicitement séparés

Depuis `frontend/`, Node.js et dépendances Vite installées ; PHP CLI requis pour le mode fictif :

```powershell
npm.cmd run dev:private-storage -- --demo --port 5199
npm.cmd run dev:private-storage -- --local-private-owner --directory CHEMIN_DU_STOCKAGE_PRIVÉ --port 5200
npm.cmd run dev:private-storage -- --config CONFIGURATION_PRIVÉE_HORS_GIT --port 5199
```

- **Démo** : données et comptes fictifs, appel Node → vrai code PHP CONNECT → fournisseur PHP Drupal pur → Node. Ce n'est pas un noyau Drupal complet ni une recette HTTPS hébergée.
- **Privé du poste** : vrais suivis déjà exportés, accès par capacité locale à usage unique puis session signée. L'identifiant interne de cette capacité n'est pas un identifiant CONNECT. Le bandeau indique l'absence de SSO/rôle réel attesté.
- **Pont configuré** : capacité locale du propriétaire et vérification de son habilitation par le service CONNECT. Toujours pas un parcours de connexion navigateur CONNECT. Configuration hors Git, HTTPS obligatoire hors fixtures, échec fermé si le service manque. Ne pas utiliser ce mode contre une cible non installée.

Le fichier d'accès généré est privé ; le choisir dans l'écran d'entrée du navigateur local. Ne pas le publier, le recopier dans le chat ou le placer dans le dépôt. Le serveur écoute seulement `127.0.0.1`, sans HMR. Chaque port du nouveau lanceur a son cookie de session distinct pour éviter une déconnexion entre démo et copie réelle. Le build hébergé exclut toujours le module et ses données.

## Configuration du mode pont, à préparer en privé seulement

Structure JSON, valeurs indicatives non actives :

```json
{
  "mode": "private_local_role_bridge",
  "storageDirectory": "CHEMIN_PRIVÉ_QUALIFIÉ",
  "ownerConnectId": "ID_CONNECT_EXACT_À_QUALIFIER",
  "connectAuthorizationUrl": "https://CONNECT_À_QUALIFIER/api/v1/developments/authorize",
  "projectChannelKey": "SECRET_DISTINCT_À_GÉNÉRER_EN_PRIVÉ"
}
```

Le propriétaire doit correspondre au compte stable et au sujet Drupal qualifiés sur la cible exacte. Pas d'e-mail, de nom affiché, de rôle d'organisation ou de UID 1 implicitement privilégié. La configuration est refusée dans le dépôt. Les clés de publication et de contrôle de rôle doivent être différentes ; la fabrication/rotation des vrais secrets hébergés n'est pas réalisée par ce lot.

## Préparer et actualiser la copie consultative

Depuis `frontend/` :

```powershell
npm.cmd run prepare:private-storage -- --registry REGISTRE --create --sequence 1
npm.cmd run prepare:private-storage -- --registry REGISTRE --directory STOCKAGE_PRIVÉ --sequence 2 --proof-selection SÉLECTION_JSON
```

Le registre doit avoir toutes ses entrées `writable:false`. La commande affiche le chemin du stockage et les compteurs, jamais la clé. Réutiliser ce même chemin et augmenter la séquence ; ne pas régénérer sa clé. Aucune publication distante ni surveillance permanente n'est installée.

La sélection est un tableau explicite, par exemple fictif :

```json
[{"iterationId":"demo-formulaire","proofId":"demo-parcours"}]
```

Aucune preuve n'est copiée implicitement. Une preuve non sélectionnée reste indisponible dans la projection, même si le fichier existe sur le poste. Une sélection inconnue, inaccessible ou d'un type interdit provoque un refus ; elle ne devient pas une preuve valide. Seuls JSON, texte/Markdown/journal, PNG/JPEG et PDF déclarés sont admissibles, avec taille, type et empreinte vérifiés. Les images/PDF ont aussi un contrôle d'en-tête ; aucun HTML/SVG/script/exécutable n'est servi.

## Format exécuté et quotas locaux

`development-snapshot-store.mjs` définit l'enveloppe signée : `schema:avereo-private-development-snapshot`, `version:1`, séquence positive, date/fenêtre de lecture, catalogue, vues normalisées, provenance et preuves sélectionnées. HMAC SHA-256 avec une clé de publication privée indépendante. Les chemins physiques sont remplacés par des alias ; les états Git sont figés à la date d'export, pas mesurés au rafraîchissement.

Limites du candidat : paquet 32 Mio, 50 suivis/applications, 500 pièces au maximum, 10 Mio par pièce, 20 instantanés conservés. Un quota atteint refuse la publication (507), sans suppression automatique de l'historique. Ce ne sont pas des quotas d'hébergement mesurés.

Organisation réelle :

```text
avereo-development-store-<aléatoire>/
  storage.json
  publication-key
  index.json
  <uuid généré>.snapshot.json
```

`index.json` signé conserve courant, précédent et séquence haute ; les instantanés sont immuables. L'admission est verrouillée, vérifiée intégralement avant bascule, avec synchronisation disque et renommage de l'index. Un paquet falsifié, incomplet, incohérent ou ancien est rejeté sans remplacer la dernière copie valide. Une corruption du stockage est signalée sans reconstruction silencieuse.

`restorePrevious()` est une opération technique explicite de l'API interne, testée sur fixtures uniquement. Elle ne diminue pas la séquence haute ; un ancien paquet reste refusé après restauration. Aucun bouton public de restauration ou endpoint de publication n'est ajouté. L'index marque la restauration pour le lecteur. Une sauvegarde indépendante et une politique de purge/rotation restent à qualifier avant hébergement.

## Protection du répertoire

Création persistante sous AppData utilisateur (Windows) ou `~/.local/share/AVEREO/Projet/Developpements` (autres systèmes), hors racines publiques. Dossier unique, clé aléatoire, contrôle du propriétaire, refus des liens symboliques/jonctions et vérification à la réouverture. Windows : DACL sans héritage autorisant seulement le propriétaire courant et SYSTEM ; vérification de chaque fichier, via PowerShell 7. Cette installation Codex redirige AppData vers son cache privé MSIX : le chemin canonique réel reste sous le profil utilisateur et est celui à conserver. Les secrets ne sont pas passés en argument de processus.

Sur POSIX : dossiers 0700 et fichiers 0600, UID courant. Ces modes ne cloisonnent pas les applications exécutées sous le même compte Unix ni l'administrateur système. Un hôte mutualisé, ses utilisateurs, sauvegardes, quotas et permissions doivent être audités séparément. Le stockage n'est ni chiffré applicativement ni une protection contre un poste compromis.

## Lecture et fraîcheur

La page indique génération, réception, séquence et éventuelle restauration. « Actualiser » relit la copie privée, pas les sources du poste, GitHub ou les environnements hébergés. Pour mettre à jour les informations, réexécuter l'export explicite avec une séquence supérieure. Une version hébergée déclarée par un suivi ne devient jamais une version actuellement mesurée. Chaque preuve affiche son commit ou, à défaut, son empreinte d'artefact sans la présenter comme un commit. Un refus d'autorisation sur une pièce efface aussi immédiatement l'état privé déjà affiché dans l'interface.

Les sources canoniques restent les seules références métier. Le lecteur refuse toute revue/décision (403), même si la source d'origine permet des écritures. Les plannings, `workspace.json`, données navigateur et dossiers clients ne sont pas utilisés ou modifiés. Les changements du suivi de ce lot servent seulement à documenter le développement demandé.

## Vérifications et suite

Tests Node : contrôle de rôle, interopérabilité PHP réelle sur fixtures, refus avant lecture des données, stockage persistant/intégrité/rejeu/restauration/quotas/preuves, permissions Windows et conservation des sources. Tests PHP : broker, fournisseur pur, contrôleur Drupal avec doubles de services ; suite CONNECT existante. La construction publique vérifie l'absence du module privé et des données.

Le reçu de qualification du lot et le manifeste sont dans l'espace de pilotage propriétaire. Les quatre phases restent **Cadrage → Développement local → Préproduction → Mise en production** ; aucun critère ou accord humain n'est approuvé par les tests.

Le [lecteur PHP et son raccordement au contrat natif Projet](preproduction-developpements.md) sont désormais réalisés dans le code local. Le présent guide reste celui du mode privé Node et de l'export consultatif. Restent avant installation : vraie configuration propriétaire/émetteurs et clés séparées, accord ciblé, noyau Drupal/HTTPS réels, révocation sur comptes fictifs, refus de tous profils tiers, accès avec le poste éteint, deux navigateurs, quotas/ACL et sauvegarde indépendante/restauration. Aucun déploiement ni raccordement automatique ne découle de ces guides.
