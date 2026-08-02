const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

// GET /api/users/:username -> profil public (infos + statistiques)
exports.getProfile = async (req, res) => {
  try {
    const { username } = req.params;

    const [users] = await pool.query(
      'SELECT id, username, bio, avatar_filename, created_at FROM users WHERE username = ?',
      [username]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }
    const user = users[0];

    const [stats] = await pool.query(
      `SELECT COUNT(DISTINCT i.id) AS posts_count, COUNT(l.id) AS likes_received
       FROM images i LEFT JOIN likes l ON l.image_id = i.id
       WHERE i.user_id = ?`,
      [user.id]
    );

    res.json({
      id: user.id,
      username: user.username,
      bio: user.bio,
      avatar_filename: user.avatar_filename,
      created_at: user.created_at,
      posts_count: stats[0].posts_count,
      likes_received: stats[0].likes_received
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// PUT /api/users/me -> modifier sa bio
exports.updateProfile = async (req, res) => {
  try {
    const { bio } = req.body;
    if (bio !== undefined && bio.length > 160) {
      return res.status(400).json({ message: 'La bio ne peut pas dépasser 160 caractères.' });
    }

    await pool.query('UPDATE users SET bio = ? WHERE id = ?', [bio || null, req.user.id]);
    res.json({ message: 'Profil mis à jour.', bio: bio || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// POST /api/users/me/avatar -> changer sa photo de profil
exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucune image reçue.' });
    }

    const [rows] = await pool.query('SELECT avatar_filename FROM users WHERE id = ?', [req.user.id]);
    const oldAvatar = rows[0] ? rows[0].avatar_filename : null;

    await pool.query('UPDATE users SET avatar_filename = ? WHERE id = ?', [req.file.filename, req.user.id]);

    if (oldAvatar) {
      const oldPath = path.join(__dirname, '../uploads/avatars', oldAvatar);
      fs.unlink(oldPath, () => {});
    }

    res.json({ message: 'Photo de profil mise à jour.', avatar_filename: req.file.filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
