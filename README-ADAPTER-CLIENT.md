# Portail Mathieu Richard

Ce dossier est la version client du portail Legacy Protocol pour Mathieu Richard.

## Fichiers importants

- `index.html`: page principale GitHub Pages. Ne pas renommer.
- `portal.config.js`: fichier a modifier pour chaque client.
- `assets/data/program.config.js`: programme d'entrainement editable.
- `assets/data/nutrition.html`: plan nutrition editable.
- `assets/js/app.js`: logique du portail. Eviter de modifier sauf correction technique.
- `assets/css/styles.css`: design du portail.
- `site.webmanifest`: manifest mobile. Garder `"start_url": "./"` pour GitHub Pages.
- `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`: icones mobiles.

## Pour creer un client

1. Dupliquer tout ce dossier.
2. Ouvrir `portal.config.js`.
3. Modifier `clientName`, `clientSlug`, `storageKey`, `photoDbName`.
4. Modifier le logo et les couleurs dans `brand`.
5. Adapter `assets/data/program.config.js` si le programme change.
6. Adapter `assets/data/nutrition.html` si la nutrition change.
7. Verifier `reportEndpoint`.
8. Remplacer l'icone mobile si necessaire.
9. Publier le dossier avec `index.html` a la racine GitHub Pages.

## Regle de stockage

`storageKey` est la cle localStorage du client.
`photoDbName` est la base IndexedDB des photos du client.

Ces deux valeurs doivent etre uniques par client.

Ne jamais changer `storageKey` ou `photoDbName` apres livraison, sinon le client
pourrait ne plus voir ses donnees ou ses photos sur le meme telephone/navigateur.

Pour un nouveau client, utiliser une cle unique:

```js
faem_jd_v1
faem_prenom_nom_v1
```

## Telegram par client

Le HTML ne doit jamais contenir de token Telegram.

Le portail envoie vers `reportEndpoint`. Le backend doit gerer les variables
d'environnement cote serveur: token du bot, chat id, etc.

Endpoint stable actuel:

```txt
https://legacy-telegram-backend.vercel.app/api/send-report
```

## Programme et nutrition

La version nettoyee separe les blocs importants:

- Le programme est dans `assets/data/program.config.js`.
- La nutrition est dans `assets/data/nutrition.html`.
- `portal.config.js` garde les reglages client et peut encore remplacer ces blocs avec `programWeeks` ou `nutritionHtml` pour un cas special.

## Test rapide avant livraison

1. Ouvrir `index.html` via GitHub Pages ou un serveur local.
2. Verifier que le nom client apparait en haut.
3. Ouvrir Entrainement, Nutrition, Check-in, Progression, Historique.
4. Entrer une seance test et confirmer que la sauvegarde reste apres recharge.
5. Faire un check-in test seulement sur une copie de test.
6. Verifier que le rapport Telegram arrive au bon endroit.

## Export

L'export est un backup texte seulement.

Les photos restent sur l'appareil du client, dans IndexedDB, et ne sont pas
incluses dans le fichier exporte.
