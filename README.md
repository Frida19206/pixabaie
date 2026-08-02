# Pixabaie 📷

Plateforme de partage de photos (type Instagram / Pixabay), développée avec **Node.js / Express / MySQL** côté serveur et **JavaScript ES6 (vanilla)** côté client.

## Fonctionnalités

- **Galerie d'accueil** listant toutes les photos, avec **filtre par catégorie sans rechargement de page** et **barre de recherche** par titre (fetch AJAX + re-rendu du DOM).
- **Inscription / Connexion** (JWT + mots de passe hashés avec bcrypt).
- **Publication de photos** par glisser-déposer avec aperçu avant envoi.
- **CRUD complet des photos** : création, filtrage/recherche, **modification** (titre + catégorie) et suppression, réservées au propriétaire.
- **Likes** avec **notifications** envoyées au propriétaire de la photo (rafraîchies toutes les 30s).
- **Page de profil publique** pour chaque utilisateur : bannière, photo de profil, bio, statistiques (nombre de publications, likes reçus, date d'inscription) et grille de ses photos — accessible en cliquant sur n'importe quel avatar/nom d'utilisateur du site.
- **Édition du profil** : changer sa bio et sa photo de profil.

## Stack technique

- Backend : Node.js, Express, MySQL (mysql2), JWT (jsonwebtoken), bcryptjs, Multer (upload de fichiers)
- Frontend : HTML5, CSS3, JavaScript ES6 (modules natifs, `fetch`, aucun framework)
- Polices : Fraunces (marque), Inter (interface), IBM Plex Mono (métadonnées)

## Installation locale

### 1. Prérequis
- Node.js (v18+ recommandé)
- MySQL (v5.7+ ou v8+) — via XAMPP/WAMP, ou une installation autonome

### 2. Installer les dépendances
```bash
npm install
```

### 3. Créer la base de données
**Nouvelle installation** — importez le schéma complet :
```bash
mysql -u root -p < sql/schema.sql
```
Ou via phpMyAdmin : onglet **Importer** → sélectionner `sql/schema.sql` → **Exécuter**.

**Base déjà existante** (créée avant l'ajout des profils) — appliquez seulement la migration :
```bash
mysql -u root -p < sql/migration_add_profile_fields.sql
```
Ou via phpMyAdmin, importez `sql/migration_add_profile_fields.sql`.

### 4. Configurer les variables d'environnement
```bash
cp .env.example .env
```
Éditez `.env` :
```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=pixabaie
JWT_SECRET=une_longue_chaine_secrete_aleatoire
```

### 5. Lancer le serveur
```bash
npm start
```
Ou en développement (rechargement auto) :
```bash
npm run dev
```
Le site est accessible sur **http://localhost:3000**.

## Structure du projet

```
pixabaie/
├── server.js
├── config/db.js                  # Connexion MySQL (pool)
├── middleware/
│   ├── auth.js                    # Vérification JWT
│   ├── upload.js                  # Upload des photos
│   └── uploadAvatar.js            # Upload des photos de profil
├── controllers/                   # auth, images, likes, notifications, catégories, users
├── routes/                        # Routes Express /api/...
├── sql/
│   ├── schema.sql                  # Schéma complet (nouvelle installation)
│   └── migration_add_profile_fields.sql  # Migration (base existante)
├── uploads/                       # Photos publiées + uploads/avatars/
└── public/                        # Frontend statique
    ├── index.html                   # Accueil (galerie + filtres + recherche)
    ├── profile.html                  # Page de profil
    ├── login.html / register.html / upload.html
    ├── css/style.css
    └── js/                           # api.js, auth.js, gallery.js, notifications.js, profile.js...
```

## API principales

| Méthode | Route                        | Auth | Description                              |
|---------|------------------------------|:---:|--------------------------------------------|
| POST    | /api/auth/register            | non | Créer un compte                          |
| POST    | /api/auth/login                | non | Se connecter                             |
| GET     | /api/categories                | non | Lister les catégories                    |
| GET     | /api/images?category=&search=&userId= | non | Lister/filtrer/rechercher les images |
| POST    | /api/images                    | oui | Publier une image                        |
| PUT     | /api/images/:id                 | oui | Modifier une image (propriétaire)        |
| DELETE  | /api/images/:id                  | oui | Supprimer une image (propriétaire)       |
| POST    | /api/likes/:id                    | oui | Liker / retirer un like                  |
| GET     | /api/notifications                | oui | Lister ses notifications                 |
| GET     | /api/users/:username              | non | Profil public + statistiques             |
| PUT     | /api/users/me                      | oui | Modifier sa bio                          |
| POST    | /api/users/me/avatar                | oui | Changer sa photo de profil               |

## Mettre le site en ligne gratuitement

**Combinaison recommandée : Render (serveur Node.js) + Aiven (base MySQL).**
Railway, souvent cité, a supprimé son offre gratuite illimitée en 2023 (aujourd'hui limité à un essai de 5$ puis payant) — Aiven propose au contraire du MySQL réellement gratuit, sans limite de temps et sans carte bancaire.

### 1. Créer la base de données sur Aiven
1. Créez un compte sur [aiven.io](https://aiven.io) (gratuit, sans CB).
2. Créez un service **MySQL**, plan **Free**.
3. Une fois le service prêt, ouvrez sa page **Overview** : notez `Host`, `Port`, `User`, `Password`, `Database name`.
4. Téléchargez le **certificat CA** (bouton de téléchargement à côté de "CA Certificate") et placez-le dans le projet sous `certs/aiven-ca.pem`.
5. Utilisez l'onglet **Query Editor** (ou une connexion via MySQL Workbench avec le certificat) pour importer le contenu de `sql/schema.sql`.

### 2. Mettre le code sur GitHub
```bash
git init
git add .
git commit -m "Premier déploiement Pixabaie"
```
Créez un dépôt sur GitHub et poussez ce code dedans.

⚠️ Le fichier `.env` ne doit **jamais** être poussé sur GitHub (il est déjà ignoré si vous utilisez le `.gitignore` fourni). Le certificat `certs/aiven-ca.pem` peut lui être commité sans risque : ce n'est pas une clé secrète, juste un certificat public.

### 3. Déployer sur Render
1. Créez un compte sur [render.com](https://render.com) (gratuit, sans CB pour le plan gratuit).
2. **New** → **Web Service** → connectez votre dépôt GitHub.
3. Configuration :
   - Build command : `npm install`
   - Start command : `npm start`
4. Dans l'onglet **Environment**, ajoutez ces variables (avec vos valeurs Aiven) :
   ```
   DB_HOST=votre-host.aivencloud.com
   DB_PORT=votre-port
   DB_USER=avnadmin
   DB_PASSWORD=votre-mot-de-passe-aiven
   DB_NAME=defaultdb
   DB_SSL_CA_PATH=certs/aiven-ca.pem
   JWT_SECRET=une-longue-phrase-secrete-unique
   ```
5. Cliquez sur **Create Web Service**. Render construit et déploie automatiquement.
6. Vous obtenez une URL publique du type `https://pixabaie.onrender.com` — votre site est en ligne !

### À savoir sur le plan gratuit Render
- Le service **s'endort après 15 minutes d'inactivité** ; la première visite suivante prend 30 à 60 secondes à charger (le temps qu'il se réveille). C'est normal et gratuit, pas un bug.
- 750h de fonctionnement gratuites par mois (largement suffisant pour un seul service qui tourne en continu).

### ⚠️ Point important : le stockage des photos
Le disque de Render (plan gratuit) est **éphémère** : les photos dans `uploads/` peuvent être perdues à chaque redéploiement. Pour un usage réel durable, il est recommandé de stocker les images sur un service dédié comme **Cloudinary** (plan gratuit généreux) plutôt que sur le disque du serveur. C'est une évolution que je peux implémenter si vous voulez sécuriser vos photos avant de partager le site largement.

## Notes

- Le token JWT est stocké dans le `localStorage` du navigateur et envoyé via l'en-tête `Authorization: Bearer <token>`.
- Le filtrage et la recherche sur la page d'accueil se font entièrement en JavaScript (fetch + re-rendu du DOM), sans rechargement de page.
- Pensez à changer `JWT_SECRET` avant toute mise en production.
