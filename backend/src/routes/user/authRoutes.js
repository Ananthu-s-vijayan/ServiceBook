const express = require("express");

const {
    register,
    login,
    googleAuth,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
} = require("../../controllers/user/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

// Authenticates users using a Google ID token.
router.post("/google", googleAuth);

// Email verification
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);

// Password recovery
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;