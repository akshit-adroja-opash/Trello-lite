import { Router } from 'express';
import { register, login, getMe, logout, updateProfile, getDevelopers } from '../controllers/auth.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { avatarUpload } from '../middleware/upload.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyJWT, getMe);
router.post('/logout', logout);
router.patch('/profile', verifyJWT, avatarUpload.single('avatar'), updateProfile);
router.get('/developers', verifyJWT, getDevelopers);
export default router;
