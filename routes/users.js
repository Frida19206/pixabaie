const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');
const uploadAvatar = require('../middleware/uploadAvatar');

router.put('/me', authMiddleware, userController.updateProfile);
router.post('/me/avatar', authMiddleware, uploadAvatar.single('avatar'), userController.updateAvatar);
router.get('/:username', userController.getProfile);

module.exports = router;
