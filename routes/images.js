const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', optionalAuth, imageController.getAll);
router.post('/', authMiddleware, upload.single('image'), imageController.create);
router.put('/:id', authMiddleware, imageController.update);
router.delete('/:id', authMiddleware, imageController.remove);

module.exports = router;
