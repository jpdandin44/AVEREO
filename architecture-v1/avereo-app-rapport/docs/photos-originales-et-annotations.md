---
project: avereo-app-rapport
document_type: cadrage
title: Photos originales privées et versions annotées du rapport
status: active
version: git
created: 2026-11-12
updated: 2026-11-13
owner: jpdandin
tags: [rapport, photos, originaux, annotations, connect, passeport]
---

# Photos originales privées et versions annotées du rapport

**État du 13 novembre : première tranche implémentée et vérifiée localement**, dans la [PR150 en brouillon](https://github.com/jpdandin44/AVEREO/pull/150). Le responsable a explicitement demandé de lancer le prochain lot après la livraison du lot 0 en préproduction. Le stockage et la réouverture privés existent désormais dans ce candidat ; ils restent désactivés par défaut et aucun hébergement n’est modifié. Recadrage, annotations et version rapport optimisée restent prévus.

La [délégation initiale](../prompts/delegation-compression-photos.md) et le cadrage ci-dessous restent conservés. Les tableaux de propositions décrivent la cible du lot complet, pas ce qui est déjà livré. Le suivi canonique est `rapportV12CadrageProfils20261112.photosOriginales20261112` dans [suivi-chantier.json](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/suivi-chantier.json>) ; ce guide en décrit le contrat.

## Statuts utilisés

| Statut | Sens |
| --- | --- |
| Confirmé | Demandé par le responsable. |
| Existant | Constaté lors de la délégation initiale sur `f48a3a9` ; les changements du lot 0 sont ensuite intégrés sans modifier ces flux photo. |
| Proposition | Piste de ce cadrage, à valider. |
| TBD | Décision ou mesure manquante ; aucune valeur n'est supposée. |

## Besoin et principes

| Point | Statut |
| --- | --- |
| Conserver les photos **originales** pour rouvrir un détail. | Confirmé |
| Les placer dans un **espace privé du dossier en ligne**, accessible avec CONNECT. | Confirmé |
| Proposer recadrage, commentaires et formes sur une **version dérivée** réinjectable dans le rapport. | Confirmé |
| Aucune optimisation ne supprime le seul exemplaire d'un original. | Confirmé |
| Les 500 Mo concernent le chargement dans Passeport Immo (500 Mo par fichier **et** par lot, puis plusieurs lots), pas un quota total. Rapport garde son plafond JSON par défaut de 50 Mio. Aucune limite de Passeport ou d'o2switch n'est modifiée. | Confirmé |
| Aucun nouveau rôle ni accès partagé implicite. | Confirmé |
| Bibliothèque privée liée au dossier **et** à son propriétaire, accès intercomptes refusé. | Confirmé |
| Envois fichier par fichier en multipart. Le retrait des images base64 du JSON reste une proposition ultérieure : elles sont encore conservées pour compatibilité. | Implémenté localement / Proposition |
| Contrôle d'accès côté serveur à **chaque** lecture et écriture avec identité CONNECT : exigence de confidentialité confirmée ; détails d'implémentation à préparer. | Confirmé / Proposition d'implémentation |
| Original immuable ; version « rapport » dérivée ; opérations de recadrage, texte et formes **réversibles** (liste d'opérations rejouable sur l'original) ; choix explicite de la version avant export. | Proposition |

## Existant utile

**Actualisation de clôture du 13 novembre pour la journée du 12.** La [source de livraison Passeport](<C:/Users/examg/Documents local/passeport-immo-archives/architecture-v1/avereo-app-passeport-immo/docs/preproduction-import-volumineux.md>) et son suivi propre attestent la livraison à 500 Mo en préproduction privée le 12 novembre (PR147). Réception/validation HTTPS à 173 et 500 Mo et refus à 501 Mo vérifiés ; sauvegarde/restauration et conservation contrôlées. L'enregistrement positif d'une archive réelle sur un bien reste une recette du responsable, distincte des sondes de réception sans création de document. Cette observation plus récente remplace ici la réserve issue de la seule lecture du contrat local ancien : les 500 Mo sont déjà installés en préproduction Passeport. Aucun contrôle serveur n'est rejoué pour cette clôture, aucune production ni fonction photo Rapport n'est déclarée livrée.

| Élément | Constat |
| --- | --- |
| Photos du dossier | `observations[].photos[]` = `{ id, name, src, horodatageISO }`, `src` étant une data URL dans le JSON (`App.jsx`). |
| Brouillon local | IndexedDB (`idb-keyval`) avec repli `localStorage`. |
| Sauvegarde en ligne | `reports.php` enregistre le JSON dans `rapport_reports.payload_json` ; propriétaire `owner_provider` + `owner_id`. Pour un compte ordinaire : dossier d'autrui absent de la liste, lecture GET 404, écriture POST 403. Les administrateurs habilités suivent l'exception existante. Plafond `max_payload_bytes` par défaut = 50 Mio (réponse 413). |
| Administrateur | Le rôle `administrateur_rapport` conserve ses droits historiques sur les rapports (`docs/authentication.md`). Aucun accès dérogatoire aux originaux : un administrateur non propriétaire est refusé. |
| Copie de test | Exclut images, plans et signature ; import JSON + sauvegarde en ligne crée un dossier indépendant sous le compte importateur ([partage](partage-tests-et-stockage.md)). |
| Export / import JSON | Le JSON complet contient les photos en base64 ; import limité à 50 Mio (`MAX_REPORT_BYTES`). |
| Sauvegarde | La tranche locale ajoute des fichiers privés ; ils ne sont pas couverts par la sauvegarde SQL historique ([rollback](rollback.md)). La restauration conjointe locale est vérifiée ; procédure hébergée à répéter avant activation. |
| Word | `reportDocx.js` lit les data URL `png/jpeg/gif/webp` et affiche les photos au plus à 570 px de largeur. Cette transformation d'affichage ne réduit ni la définition ni les octets JPEG/PNG/GIF incorporés ; WebP est converti en PNG à définition native. Le poids du Word reste donc à maîtriser par une version rapport adaptée, après conservation de l'original. |
| Plans | Les plans annotés (repères) sont déjà rendus par canvas (`annotatedPlanImage`) ; ce n'est pas un éditeur de photos. |
| Passeport Immo | Contrat `MAX_FILE_SIZE`/`MAX_BATCH_SIZE` de 500 Mo, 100 fichiers par requête, empreinte SHA-256 par bien (`document-store.js`, `docs/import-volumineux.md`). La livraison privée et ses limites de preuve sont précisées dans l'actualisation ci-dessus ; la première lecture de cette délégation portait sur le contrat local antérieur. Sources Passeport consultées sans modification. |
| Compression | `photoCompression.js` et ses 12 tests existent comme [candidat isolé](compression-photos.md), non branché dans le parcours. |

## Cadrage

### Raccordements à traiter

| Raccordement | Existant | Proposition à valider | Refus et échecs à prévoir |
| --- | --- | --- | --- |
| Import fichier et caméra | Import : lecture directe en data URL ; caméra : PNG canvas | L'original est envoyé individuellement au serveur ; la photo du dossier porte une référence `original` (`id`, SHA-256, octets, type, dimensions) et une version rapport | Refus de stockage, fichier trop lourd, perte réseau : la photo reste utilisable localement, jamais marquée « original conservé » |
| Brouillon local | JSON dans IndexedDB | Original en attente conservé comme fichier (Blob) hors du JSON, avec état « à envoyer » | Fermeture avant envoi : reprise à la réouverture |
| Sauvegarde en ligne | JSON seul, 50 Mio | JSON = références et opérations ; originaux sur leur propre chemin | Dossier remplacé ou constat supprimé pendant un envoi : l'envoi est rattaché à l'identifiant du dossier d'origine, jamais injecté dans un autre ; orphelin signalé |
| Réouverture, autre session ou ordinateur | Rouvre le JSON du serveur | Version rapport immédiate ; original chargé à la demande | Session expirée (30 min) : relance CONNECT sans perte |
| Copie vers un autre propriétaire | Copie de test sans images | Une référence d'un autre compte est refusée ou retirée à l'import ; toute copie d'original est un acte explicite du propriétaire | Refus inter-comptes, test avec deux identités |
| Export JSON | Photos en base64 | Export allégé (références) ; « export complet avec originaux » = TBD | Un JSON importé ailleurs ne donne jamais accès aux originaux |
| Sauvegarde et restauration | Base MySQL | Les fichiers privés **ne sont pas couverts** par la sauvegarde SQL : sauvegarde jointe des fichiers et de leur table, restauration cohérente | Restauration à blanc sur copie privée ; référence sans fichier détectée |
| Word | Data URL de la version rapport | Inchangé : la version rapport sert de `src` ; l'original n'est jamais exporté sans choix | Pas de version rapport : l'export le signale |
| Futur PDF et Passeport | Aucun PDF natif ; Passeport accepte des fichiers par lot | Transfert des **seuls fichiers choisis** (original ou version rapport, au choix explicite), empreinte transmise ; jamais de copie automatique de la photothèque | Limites de Passeport respectées sans les modifier |

### Contrôles côté serveur à préparer

- Chaque lecture et écriture vérifie l'identité CONNECT puis le propriétaire du dossier ; aucune URL publique, aucun lien partageable.
- Original immuable : un identifiant existant ne peut être ni remplacé ni modifié ; l'empreinte SHA-256 calculée par le navigateur est recalculée et vérifiée par le serveur.
- Même contenu dans un dossier : détecté par empreinte, un seul exemplaire ; jamais de dédoublonnage entre propriétaires.
- Accès d'un administrateur aux originaux : TBD, **refusé tant qu'il n'est pas décidé**.

### Décisions TBD

| Sujet | Piste |
| --- | --- |
| Lieu de stockage | Choix local arrêté : fichiers hors racine web, métadonnées en base ; chemin et capacité de la cible restent à qualifier. |
| Taille maximale par original, quota par dossier ou par compte | Aucune valeur supposée ; à mesurer sur l'espace réel de l'hébergement (page Utilisation du disque) |
| Suppression d'une photo du dossier : le fichier privé est-il supprimé ? | À arbitrer entre immuabilité et droit à l'effacement |
| Durée de conservation, suppression d'un dossier | TBD |
| Accès administrateur et support | Voir ci-dessus |
| Formats : HEIC et autres formats de téléphone | TBD, à constater sur appareils |
| Métadonnées EXIF (dont position) de l'original | Octets intacts dans l'original privé et dans `src` actuel. Une future version rapport réencodée pourra les retirer ; elle n'existe pas encore. |
| Forme des opérations (recadrage en fractions, texte, formes simples) et interface | Cadrage fonctionnel séparé avant tout éditeur |

### Critères d'acceptation du lot

1. Un original envoyé est relu octet pour octet, avec la même empreinte, depuis une autre session.
2. Un autre compte CONNECT n'obtient ni lecture, ni écriture, ni liste.
3. Aucune compression ne remplace un exemplaire non confirmé côté serveur.
4. Recadrage, texte et formes se défont ; la version rapport se régénère depuis l'original.
5. Le Word utilise la version rapport choisie ; l'original n'est jamais embarqué sans choix.
6. Anciens dossiers et photos sans original : inchangés, utilisables.
7. Échec de stockage, envoi interrompu, dossier remplacé pendant l'envoi : aucun état faux annoncé, reprise possible.
8. Sauvegarde puis restauration à blanc : fichiers et références concordent.

## Développement local

### Première tranche disponible

| Fonction | État local |
| --- | --- |
| Voir une photo existante | Dialogue agrandi, zoom 25–400 %, ajustement à la fenêtre, fermeture Échap et retour du focus. |
| Conserver l’original | Après sauvegarde du dossier en ligne, commande volontaire par photo JPEG/PNG/WebP ; le Blob contient les octets exacts de `src`. |
| Accusé et rattachement | Taille, type et SHA-256 contrôlés ; référence facultative `photo.original`. Résultat tardif ignoré si dossier, constat, photo ou source ont changé. |
| Réouverture privée | Charge le fichier sous session authentifiée et contrôle taille, type et empreinte avant affichage/téléchargement. Aucun chemin ni URL publique. |
| Isolation | Propriétaire courant du rapport + propriétaire de l’original ; second compte et administrateur non propriétaire refusés. Rapport source et propriétaire inchangés. |
| Compatibilité | Import, brouillon, `photo.src`, plans et exports existants conservés. JSON et Word portent encore l’image complète ; aucun gain de poids revendiqué. |
| Compression et éditeur | Module de compression toujours isolé ; aucun recadrage, commentaire, forme ou version dérivée intégré dans cette tranche. |

Parcours : enregistrer le dossier en ligne → Observations → **Conserver l’original en ligne** → attendre la confirmation → **Sauver en ligne** pour conserver le lien → rouvrir le dossier depuis la liste serveur → **Ouvrir l’original privé**. Un enregistrement est bloqué pendant un envoi ; l’envoi est bloqué pendant l’enregistrement. La navigation ou le remplacement d’une photo annule sa requête : aucun succès ni rattachement tardif n’est annoncé. Le serveur peut avoir conservé les octets avant une interruption ; un renvoi identique retrouve le même original dans ce dossier.

Une photo non envoyée reste dans le brouillon existant ; aucun stockage Blob séparé n’est encore implémenté. La vue de détail locale fonctionne sans le stockage privé. Une copie JSON importée ne transmet aucun droit de lecture sur un original.

### Serveur, configuration et contrat

[Contrat OpenAPI](../api/photos-originales.json). `frontend/public/api/photo-originals.php` réutilise le sas CONNECT et le verrou de révocation ; le service `photo-original-store.php` reçoit l’identité authentifiée. La migration [003](../database/migrations/003_photo_originals.sql) ajoute uniquement `rapport_photo_originals` ; pas de modification des lignes des rapports. L’original est publié atomiquement dans un sous-répertoire d’identifiants, jamais dans le webroot et jamais avec le nom reçu.

| Clé de configuration privée | Valeur / condition |
| --- | --- |
| `photo_originals_enabled` | `false` par défaut ; seul le booléen `true` active. |
| `photo_originals_directory` | Chemin absolu préexistant, canonique, sans lien, hors racine web ; aucun chemin cible choisi. |
| `photo_originals_max_bytes` | Entier positif obligatoire, **TBD sur l’hébergement**. |
| `photo_originals_owner_quota_bytes` | Entier positif obligatoire, tous rapports du propriétaire compris, **TBD sur l’hébergement**. |

L’[exemple de configuration](../backend/config.example.php) reste inactif. Les limites PHP `upload_max_filesize` et `post_max_size` ainsi que la capacité disque réelle doivent être compatibles avec les valeurs choisies. Le test local utilise 1 Mio/photo et 2 Mio/compte, valeurs fictives sans portée pour o2switch ni Passeport. Les bornes de dimensions du prototype sont 32 767 px/côté et 200 millions de pixels ; signature et en-tête contrôlés, sans décodage complet du corps.

Dédoublonnage dans un même dossier seulement. Le verrou par propriétaire protège la consommation du quota sur **un seul hôte**. Les métadonnées restent comptées si le rapport est supprimé ; les fichiers deviennent inaccessibles, sans effacement implicite. Si le propriétaire du rapport change, l’ancien comme le nouveau n’accèdent plus à ces originaux jusqu’à un transfert explicitement conçu. Le futur cadrage V1.2 de transfert avant fermeture d’un compte doit inclure ces fichiers ; aucune habilitation ni priorité nouvelle n’en découle ici.

### Vérifications du 13 novembre

| Preuve | Portée / résultat |
| --- | --- |
| Tests Node | **157 réussis**, dont 10 de contrat client ; les 12 tests de compression concernent toujours le module isolé. |
| Compilations Vite | Réussies avec et sans synchronisation en ligne ; avertissement existant sur la taille des bundles, sans erreur. |
| PHP 8.4 / SQLite | PASS : intégrité, refus inter-comptes/admin, configuration, quota, deux processus concurrents, pannes, propriétaires recontrôlés, noms UTF-8, table absente en 503, restauration à blanc. Lint des nouveaux fichiers réussi. |
| PHP HTTP + MariaDB 11.4 local | **31 contrôles réussis**, vraies migrations 001 et 003, multipart et lecture, nouveau sas signé fictif, refus B/admin, dédoublonnage, lignes/propriétaires inchangés. SQL et fichiers restaurés dans une seconde base et un autre arbre privé, source intacte. |
| Navigateur | Mire fictive 1200×800 : import, conservation, sauvegarde du lien, nouveau lancement signé local, réouverture depuis la liste serveur, ouverture privée et téléchargement octet-identique. Vue agrandie et zoom vérifiés ; fermeture au clavier. |
| Export | JSON réimporté puis exporté : tous les champs préexistants des observations et photos conservés ; seule normalisation historique `controle_habitologie` ajoutée. Image des deux Word expert/client identique à la mire source. |

Le service de revue est **local et temporaire** : [entrée des deux comptes fictifs](http://127.0.0.1:5185/fixture/). [Commandes et dépendances](../tests/README.md). Les preuves originales sont dans [l’archive de recette](<C:/Users/examg/OneDrive/Documents/AVEREO_2/preprod-acces-local/outillage/acces-preproduction/archives/rapport-originaux-20261113>), notamment `recette-http-mariadb-finale.json`, `recette-navigateur.json` et `reouverture-original-prive.png`. Le [bilan de Claude](stockage-originaux-resultat.md) conserve son périmètre SQLite/HTTP hors base ; les vérifications MariaDB et navigateur ont été effectuées séparément par Codex. Aucun compte hébergé, donnée réelle, accès OAuth ou cPanel utilisé pour cette tranche.

### Réserves avant activation

- Traiter l’arrêt brutal entre publication du fichier et insertion SQL : un fichier orphelin pourrait échapper au quota calculé sur les lignes. Une interruption ordinaire avec exception retire le seul fichier créé ; le crash du processus est un cas distinct. Définir un comptage conservateur ou une récupération sans suppression automatique.
- Choisir les limites sur la cible, arrêter la politique de rétention/effacement et les droits administrateur/support. Mesurer les permissions réelles (0600/0700 demandées, non mesurables sous Windows) et vérifier espace/disque.
- Répéter la sauvegarde/restauration SQL **et** fichiers sur copie privée de préproduction, puis qualifier les deux comptes CONNECT et la session expirée sur cette cible. Le test local de restauration ne remplace pas cette opération.
- Essayer de vraies photos de téléphone, HEIC/HEIF, appareils mobiles et gros lots ; pas de support HEIC annoncé. Pas d’allègement du JSON ni de PDF natif dans cette tranche.


## Préproduction

Candidat nommé avec son point d'entrée réel. Sauvegarde fraîche (base, configuration **et** fichiers privés) puis restauration sur copie privée avant installation. Qualification avec deux comptes CONNECT réels de test : refus inter-comptes, réouverture depuis un autre appareil, session de 30 minutes. Valeurs PHP effectives et espace disque mesurés sur cette cible, taille maximale par original arrêtée à partir de ces mesures. Recette de vraies photos de téléphone par le responsable, sur dossiers de test. Revue en préproduction.

## Mise en production

Après accord humain explicite : sauvegarde préalable de la base et des fichiers, migration additive, retour arrière documenté (les fichiers privés ne sont jamais supprimés par un retour applicatif). Contrôles après livraison sur la **production réelle** : envoi, relecture identique, refus inter-comptes, export Word. Le transfert vers Passeport reste une évolution distincte, par fichiers choisis, selon la qualification de Passeport.

## Historique des versions

- 2026-11-12 : première version du cadrage, après confirmation de la conservation des originaux dans l'espace privé du dossier en ligne.
- 2026-11-13 : première tranche locale conservation/réouverture, contrat API et preuves ; propositions de la version dérivée conservées séparément.
