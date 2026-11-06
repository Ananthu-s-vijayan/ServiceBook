const {registerUser, loginUser,googleLogin}=require("../../services/authService");

const{verifyEmailOTP,sendVerificationOTP,sendPasswordResetOTP,resetPassword}=require("../../services/otpService");

const User = require("../../models/User");


const register=async(req,res)=>{
    try{
        const user=await registerUser(req.body);

        return res.status(201).json({
            success:true,
            message:"User registered successfully",
            data:user
        });
    }catch(error){
        console.error("Registration error:",error.message);
        return res.status(error.statusCode||500).json({
            success:false,
            message:error.message||"Registration failed"
        });
    }
};

const login = async(req,res)=>{
    try{
        const user=await loginUser(req.body);
        return res.status(200).json({
            success:true,
            message:"Login successful",
            data:user
        });
    }catch(error){
        console.error("Login error:",error.message);
        return res.status(error.statusCode || 500).json({
            success:false,
            message:error.message || "Login failed"
        });
    }
}

// Authenticates a user through Google and returns a ServiceBook JWT.
const googleAuth = async (req, res, next) => {
    try {
        const result = await googleLogin(req.body);

        return res.status(200).json({
            success: true,
            message: "Google login successful",
            data: result
        });
    } catch (error) {
        next(error);
    }
};


// Handles requests to verify a user's email using an OTP.
const verifyEmail = async (req, res) => {
    try {
        const result = await verifyEmailOTP(req.body);

        return res.status(200).json({
            success: true,
            message: "Email verified successfully",
            data: result,
        });
    } catch (error) {
        console.error("Email verification error:", error.message);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Email verification failed",
        });
    }
};

// Handles requests to resend an email-verification OTP.
const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || typeof email !== "string") {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail,
        });

        // Avoid revealing whether an email address has an account.
        if (!user) {
            return res.status(200).json({
                success: true,
                message: "If the account is eligible, a verification email will be sent",
            });
        }

        await sendVerificationOTP(user);

        return res.status(200).json({
            success: true,
            message: "Verification OTP sent successfully",
            data: {
                email: user.email,
                expiresInMinutes: 5,
                resendCooldownSeconds: 60,
            },
        });
    } catch (error) {
        console.error("Resend verification error:", error.message);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to resend verification OTP",
        });
    }
};

// Requests a password-reset OTP.
const forgotPassword = async (req, res) => {
    try {
        const result = await sendPasswordResetOTP(req.body.email);

        return res.status(200).json({
            success: true,
            message: result.message,
            data: result,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Unable to process password-reset request",
        });
    }
};

// Validates the reset OTP and updates the password.
const resetPasswordController = async (req, res) => {
    try {
        const result = await resetPassword(req.body);

        return res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Unable to reset password",
        });
    }
};

module.exports={
    register,
    login,
    googleAuth,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword:resetPasswordController,
};