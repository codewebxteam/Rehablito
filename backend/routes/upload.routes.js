const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { protect } = require('../middleware/auth.middleware');
const multer = require('multer');

// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Single file upload endpoint (accessible by any authenticated user)
router.post('/', protect, upload.single('file'), uploadController.uploadFile);

module.exports = router;
