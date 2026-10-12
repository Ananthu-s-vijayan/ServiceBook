const adminMiddleware = (req, res, next) => {
    // Reject requests unless authentication has already populated req.user.
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication is required"
        });
    }

    // Only users with the administrator role may access admin endpoints.
    if (req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Administrator access is required"
        });
    }

    next();
};

module.exports = adminMiddleware;