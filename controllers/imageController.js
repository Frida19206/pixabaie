const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

// GET /api/images?category=ID&userId=ID
exports.getAll = async (req, res) => {
  try {
    const { category, userId, search } = req.query;
    const currentUserId = req.user ? req.user.id : 0;

    let sql = `
      SELECT i.id, i.title, i.filename, i.created_at,
             u.id AS user_id, u.username, u.avatar_filename AS user_avatar,
             c.id AS category_id, c.name AS category_name,
             COUNT(DISTINCT l.id) AS likes_count,
             MAX(CASE WHEN l.user_id = ? THEN 1 ELSE 0 END) AS liked_by_me
      FROM images i
      JOIN users u ON u.id = i.user_id
      LEFT JOIN categories c ON c.id = i.category_id
      LEFT JOIN likes l ON l.image_id = i.id
      WHERE 1 = 1
    `;
    const params = [currentUserId];

    if (category) {
      sql += ' AND c.id = ?';
      params.push(category);
    }
    if (userId) {
      sql += ' AND u.id = ?';
      params.push(userId);
    }
    if (search) {
      sql += ' AND i.title LIKE ?';
      params.push(`%${search}%`);
    }

    sql += ' GROUP BY i.id ORDER BY i.created_at DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// POST /api/images (auth requise, champ "image" via multipart/form-data)
exports.create = async (req, res) => {
  try {
    const { title, category_id } = req.body;

    if (!title || !req.file) {
      return res.status(400).json({ message: 'Le titre et une image sont requis.' });
    }

    const [result] = await pool.query(
      'INSERT INTO images (title, filename, category_id, user_id) VALUES (?, ?, ?, ?)',
      [title, req.file.filename, category_id || null, req.user.id]
    );

    res.status(201).json({
      message: 'Image publiée avec succès.',
      id: result.insertId,
      filename: req.file.filename
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur lors de la publication.' });
  }
};

// PUT /api/images/:id (auth requise, propriétaire uniquement)
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category_id } = req.body;

    const [rows] = await pool.query('SELECT * FROM images WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Image introuvable.' });
    }
    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à modifier cette image." });
    }

    await pool.query(
      'UPDATE images SET title = ?, category_id = ? WHERE id = ?',
      [title || rows[0].title, category_id !== undefined ? category_id : rows[0].category_id, id]
    );

    res.json({ message: 'Image mise à jour avec succès.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// DELETE /api/images/:id (auth requise, propriétaire uniquement)
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query('SELECT * FROM images WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Image introuvable.' });
    }
    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à supprimer cette image." });
    }

    const filePath = path.join(__dirname, '../uploads', rows[0].filename);
    await pool.query('DELETE FROM images WHERE id = ?', [id]);
    fs.unlink(filePath, () => {}); // suppression silencieuse du fichier physique

    res.json({ message: 'Image supprimée avec succès.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
