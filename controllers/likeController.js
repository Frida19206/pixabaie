const pool = require('../config/db');

// POST /api/likes/:id -> bascule le like (like / unlike) et notifie le propriétaire
exports.toggleLike = async (req, res) => {
  try {
    const imageId = req.params.id;
    const userId = req.user.id;

    const [imgRows] = await pool.query('SELECT * FROM images WHERE id = ?', [imageId]);
    if (imgRows.length === 0) {
      return res.status(404).json({ message: 'Image introuvable.' });
    }
    const image = imgRows[0];

    const [existing] = await pool.query(
      'SELECT * FROM likes WHERE user_id = ? AND image_id = ?',
      [userId, imageId]
    );

    // L'utilisateur a déjà liké -> on retire le like
    if (existing.length > 0) {
      await pool.query('DELETE FROM likes WHERE id = ?', [existing[0].id]);
      return res.json({ liked: false, message: 'Like retiré.' });
    }

    // Sinon on ajoute le like
    await pool.query('INSERT INTO likes (user_id, image_id) VALUES (?, ?)', [userId, imageId]);

    // Notification uniquement si on ne like pas sa propre image
    if (image.user_id !== userId) {
      const [userRows] = await pool.query('SELECT username FROM users WHERE id = ?', [userId]);
      const likerName = userRows[0].username;

      await pool.query(
        'INSERT INTO notifications (user_id, from_user_id, image_id, message) VALUES (?, ?, ?, ?)',
        [image.user_id, userId, imageId, `${likerName} a aimé votre photo "${image.title}".`]
      );
    }

    res.json({ liked: true, message: 'Image likée.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
