require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const imageRoutes = require('./routes/images');
const likeRoutes = require('./routes/likes');
const notificationRoutes = require('./routes/notifications');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// S'assure que les dossiers d'upload existent
const avatarsDir = path.join(__dirname, 'uploads/avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fichiers statiques : images uploadées + frontend
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

// Gestionnaire d'erreurs global (ex : erreurs Multer)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Erreur serveur.' });
});

app.listen(PORT, () => {
  console.log(`Serveur Pixabaie démarré sur http://localhost:${PORT}`);
});
