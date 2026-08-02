-- Migration à exécuter UNIQUEMENT si vous avez déjà créé la base "pixabaie"
-- avant l'ajout des pages de profil (bio + photo de profil).
-- Dans phpMyAdmin : onglet Importer -> choisir ce fichier -> Exécuter.

USE pixabaie;

ALTER TABLE users ADD COLUMN bio VARCHAR(160) DEFAULT NULL AFTER email;
ALTER TABLE users ADD COLUMN avatar_filename VARCHAR(255) DEFAULT NULL AFTER bio;
