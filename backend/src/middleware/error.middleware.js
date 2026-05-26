import multer from 'multer';

export const errorMiddleware = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    if (err instanceof multer.MulterError) {
        statusCode = 400;
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'File size is too large. Max limit is 10MB.';
        } else {
            message = `Upload error: ${err.message}`;
        }
    } else if (err.message && (
        err.message.includes('are allowed') || 
        err.message.includes('not allowed') ||
        err.message.includes('Only')
    )) {
        statusCode = 400;
    }

    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message,
        errors: err.errors || [],
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};
