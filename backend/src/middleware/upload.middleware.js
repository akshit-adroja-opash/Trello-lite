import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

export const avatarUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimetype = /jpeg|jpg|png|gif/i.test(file.mimetype);
    const allowedExt = /jpeg|jpg|png|gif/i.test(path.extname(file.originalname).toLowerCase());
    if (allowedMimetype && allowedExt) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, PNG, and GIF images are allowed for avatars.'), false);
    }
  },
});

export const cardAttachmentUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB Limit
  fileFilter: (req, file, cb) => {
    // Reject video formats (mp4, mkv, avi, mov, etc.)
    const isVideo = /video/i.test(file.mimetype) || /\.(mp4|webm|mkv|avi|mov|flv|wmv)$/i.test(file.originalname);
    if (isVideo) {
      return cb(new Error('Video uploads are not allowed!'), false);
    }
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|zip|txt|rar|7z/i;
    const isMimetypeAllowed = allowedTypes.test(file.mimetype);
    const isExtensionAllowed = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (isMimetypeAllowed && isExtensionAllowed) {
      cb(null, true);
    } else {
      cb(new Error('Only images and document attachments are allowed.'), false);
    }
  },
});

