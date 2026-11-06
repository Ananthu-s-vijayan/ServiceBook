
// Centralized error handler that returns consistent JSON responses.
const errorMiddleware = (error, req, res, next) => {
    // Log unexpected server errors for debugging.
    if (!error.statusCode || error.statusCode >= 500) {
        console.error("Server error:", error);
    }

    // Return an appropriate HTTP status and JSON error message.
    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
        success: false,
        message: error.message || "Internal server error"
    });
};

module.exports = errorMiddleware;

