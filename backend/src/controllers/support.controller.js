import Support from '../models/Support.js';

export const createSupportRequest = async (req, res, next) => {
    try {
        const { name, email, message } = req.body;
        
        const supportRequest = await Support.create({
            user: req.user._id,
            name,
            email,
            message
        });

        res.status(201).json({
            status: 'success',
            data: { support: supportRequest }
        });
    } catch (error) {
        next(error);
    }
};
