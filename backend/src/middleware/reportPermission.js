export const canGenerateFullReport = (req, res, next) => {
    if (
        req.user.role === "admin" ||
        req.user.role === "pm"
    ) {
        return next();
    }

    return res.status(403).json({
        message: "Access denied",
    });
};

export const canGenerateClientReport = (req, res, next) => {
    if (
        req.user.role === "admin" ||
        req.user.role === "pm" ||
        req.user.role === "client"
    ) {
        return next();
    }

    return res.status(403).json({
        message: "Access denied",
    });
};