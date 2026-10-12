const mongoose = require("mongoose");

const verificationTokenSchema = new mongoose.Schema(
    {
        // Links the OTP to the user who requested it.
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Stores the normalized email address associated with the OTP.
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },

        // Identifies the OTP's purpose: email verification or password reset.
        type: {
            type: String,
            enum: ["email_verification", "password_reset"],
            required: true,
        },

        // Stores the hashed OTP, never the original OTP.
        otpHash: {
            type: String,
            required: true,
        },

        //Records when this OTP request was created for rate limiting.
        requestedAt:{
            type:Date,
            default:Date.now,
            required:true,
        },

        // Defines when the OTP expires.
        expiresAt: {
            type: Date,
            required: true,
        },

        // Records when the OTP was successfully used.
        verifiedAt: {
            type: Date,
            default: null,
        },
        //Records when this OTP was invalidated without successful verification.
        invalidatedAt:{
            type:Date,
            default:null,
        },

        // Tracks failed verification attempts.
        attempts: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("VerificationToken", verificationTokenSchema);