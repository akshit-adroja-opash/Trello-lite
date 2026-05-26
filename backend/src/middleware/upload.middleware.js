import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Ensure upload directories exist
const avatarsDir = path.resolve('uploads', 'avatars');
const cardsDir = path.resolve('uploads', 'cards');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}
if (!fs.existsSync(cardsDir)) {
  fs.mkdirSync(cardsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

export const avatarUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/.test(file.mimetype);
    cb(null, allowed);
  },
});

const cardStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, cardsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

export const cardAttachmentUpload = multer({
  storage: cardStorage,
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
