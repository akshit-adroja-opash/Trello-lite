import { ApiError } from '../utils/apiError.js';

export const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError(401, 'Unauthorized'));
        }

        // Implementation depends on how roles are stored in workspace/board
        // For now, this is a placeholder
        next();
    };
};
