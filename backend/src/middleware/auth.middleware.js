import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { ApiError } from '../utils/apiError.js';

export const verifyJWT = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            throw new ApiError(401, 'Unauthorized request');
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decodedToken?.id).select('-password');

        if (!user) {
            throw new ApiError(401, 'Invalid Access Token');
        }

        // Verify if session exists in DB
        let session = await Session.findOne({ userId: user._id, token });
        if (!session) {
            throw new ApiError(401, 'Session has been revoked or expired');
        }

        // Update last active
        session.lastActive = new Date();
        await session.save();

        req.user = user;
        req.currentSessionId = session._id;
        next();
    } catch (error) {
        next(new ApiError(401, error?.message || 'Invalid access token'));
    }
};
