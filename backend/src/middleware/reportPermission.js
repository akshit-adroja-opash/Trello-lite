export const canGenerateFullReport = (req, res, next) => {
    if (
        req.user.role === "admin" ||
        req.user.role === "project_manager"
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
        req.user.role === "project_manager" ||
        req.user.role === "client"
    ) {
        return next();
    }

    return res.status(403).json({
        message: "Access denied",
    });
};