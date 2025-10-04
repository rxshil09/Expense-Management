// File upload middleware with Cloudinary
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'avatars', // Folder in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill' }, // Resize to 400x400
      { quality: 'auto' }, // Auto quality optimization
      { fetch_format: 'auto' } // Auto format selection (WebP when supported)
    ],
    public_id: (req, file) => {
      // Generate unique public_id with timestamp (user ID will be handled in controller)
      return `avatar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer with Cloudinary storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Avatar upload middleware
const uploadAvatar = upload.single('avatar');

// Error handling wrapper
const handleAvatarUpload = (req, res, next) => {
  uploadAvatar(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB.',
        });
      }
      return res.status(400).json({
        success: false,
        message: 'File upload error: ' + err.message,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next();
  });
};

module.exports = {
  handleAvatarUpload,
  cloudinary, // Export cloudinary for use in controllers
};
