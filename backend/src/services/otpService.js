const crypto = require("crypto");
const bcrypt = require("bcrypt");

const User = require("../models/User");
const VerificationToken = require("../models/VerificationToken");
const { sendEmail } = require("../utils/emailService");

const OTP_EXPIRY_MINUTES = 5;
const OTP_RESEND_COOLDOWN_SECONDS =60;
const MAX_OTP_REQUESTS_PER_HOUR = 5;

// Generates a cryptographically secure six-digit OTP.
const generateOTP = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

// Sends a verification OTP while enforcing cooldown and hourly request limits.
const sendVerificationOTP = async (user) => {
    if (user.isVerified) {
        const error = new Error("Email is already verified");
        error.statusCode = 400;
        throw error;
    }

    const now = new Date();
    const oneHourAgo = new Date(
        now.getTime() - 60 * 60 * 1000
    );

    // Find the latest email-verification OTP request for this user.
    const latestRequest = await VerificationToken.findOne({
        userId: user._id,
        type: "email_verification",
    }).sort({ requestedAt: -1, createdAt: -1 });

    // Enforce the resend cooldown.
    // Use createdAt for older records that do not have requestedAt.
    if (latestRequest) {
        const lastRequestTime =
            latestRequest.requestedAt || latestRequest.createdAt;

        const secondsSinceLastRequest =
            (Date.now() - new Date(lastRequestTime).getTime()) / 1000;


        if (
            secondsSinceLastRequest >= 0 &&
            secondsSinceLastRequest < OTP_RESEND_COOLDOWN_SECONDS
        ) {
            const error = new Error(
                "Please wait before requesting another OTP"
            );
            error.statusCode = 429;
            throw error;
        }

        // Reject inconsistent future timestamps instead of treating them
        // as a normal cooldown.
        if (secondsSinceLastRequest < 0) {
            console.error("OTP request timestamp is in the future.");

            const error = new Error(
                "Unable to process OTP request. Please try again shortly."
            );
            error.statusCode = 500;
            throw error;
        }
    }

    // Count OTP requests during the previous hour.
// Include legacy records that have createdAt but no requestedAt.
const requestsInLastHour = await VerificationToken.countDocuments({
    userId: user._id,
    type: "email_verification",
    $or: [
        { requestedAt: { $gte: oneHourAgo } },
        {
            requestedAt: { $exists: false },
            createdAt: { $gte: oneHourAgo },
        },
    ],
});

    if (requestsInLastHour >= MAX_OTP_REQUESTS_PER_HOUR) {
        const error = new Error(
            "OTP request limit reached. Please try again later"
        );
        error.statusCode = 429;
        throw error;
    }

    // Invalidate previous unused OTPs without marking them as verified.
    await VerificationToken.updateMany(
        {
            userId: user._id,
            type: "email_verification",
            verifiedAt: null,
            invalidatedAt: null,
        },
        {
            $set: { invalidatedAt: now },
        }
    );

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);

    const expiresAt = new Date(
        now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000
    );

    // Save the OTP request time so it can be included in rate-limit calculations.
    const verificationToken = await VerificationToken.create({
        userId: user._id,
        email: user.email,
        type: "email_verification",
        otpHash,
        requestedAt: now,
        expiresAt,
    });

    try {
        // Deliver the OTP to the user's registered email address.
        await sendEmail({
            to: user.email,
            subject: "Verify your ServiceBook email",
            html: `
                <h2>Welcome to ServiceBook</h2>
                <p>Your email verification code is:</p>
                <h1>${otp}</h1>
                <p>This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
                <p>If you did not register for ServiceBook, you can ignore this email.</p>
            `,
        });
    } catch (error) {
        // Invalidate the unsent OTP so it cannot be used.
        await VerificationToken.updateOne(
            { _id: verificationToken._id },
            { $set: { invalidatedAt: new Date() } }
        );

        throw error;
    }

    return {
        email: user.email,
        expiresInMinutes: OTP_EXPIRY_MINUTES,
        resendCooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    };
};

// Verifies an email OTP and marks the user's email as verified.
const verifyEmailOTP = async ({ email, otp }) => {
    // Validate the required inputs.
    if (!email || !otp) {
        const error = new Error("Email and OTP are required");
        error.statusCode = 400;
        throw error;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find the user associated with this email.
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
        const error = new Error("Invalid or expired OTP");
        error.statusCode = 400;
        throw error;
    }

    // Stop if the email has already been verified.
    if (user.isVerified) {
        const error = new Error("Email is already verified");
        error.statusCode = 400;
        throw error;
    }

    // Find the latest verification OTP that has not been used or invalidated.
    const verificationToken = await VerificationToken.findOne({
        userId: user._id,
        email: normalizedEmail,
        type: "email_verification",
        verifiedAt: null,
        invalidatedAt: null,
        expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!verificationToken || verificationToken.attempts >= 5) {
        const error = new Error("Invalid or expired OTP");
        error.statusCode = 400;
        throw error;
    }

    // Compare the submitted OTP with the stored hash.
    const isOTPValid = await bcrypt.compare(
        String(otp),
        verificationToken.otpHash
    );

    if (!isOTPValid) {
        // Increment the failed-attempt count.
        await VerificationToken.updateOne(
            { _id: verificationToken._id },
            { $inc: { attempts: 1 } }
        );

        const error = new Error("Invalid or expired OTP");
        error.statusCode = 400;
        throw error;
    }

    // Record successful verification.
    verificationToken.verifiedAt = new Date();
    await verificationToken.save();

    // Mark the user's email as verified.
    user.isVerified = true;
    await user.save();

    // Invalidate any other unused email-verification OTPs for this user.
    await VerificationToken.updateMany(
        {
            userId: user._id,
            type: "email_verification",
            _id: { $ne: verificationToken._id },
            verifiedAt: null,
            invalidatedAt: null,
        },
        { $set: { invalidatedAt: new Date() } }
    );

    return {
        email: user.email,
        isVerified: user.isVerified,
    };
};

// Sends a password-reset OTP to a registered email address.
const sendPasswordResetOTP = async (email) => {
    if (typeof email !== "string" || !email.trim()) {
        const error = new Error("A valid email is required");
        error.statusCode = 400;
        throw error;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    // Use the same response for existing and non-existing emails
    // to avoid revealing whether an account exists.
    if (!user) {
        return {
            message: "If an account exists for this email, a password-reset OTP will be sent.",
            expiresInMinutes: OTP_EXPIRY_MINUTES,
        };
    }

    const now = new Date();

    // Enforce the resend cooldown for password-reset OTPs.
    const latestRequest = await VerificationToken.findOne({
        userId: user._id,
        type: "password_reset",
    }).sort({ requestedAt: -1, createdAt: -1 });

    if (latestRequest) {
        const lastRequestTime =
            latestRequest.requestedAt || latestRequest.createdAt;

        const secondsSinceLastRequest =
            (now.getTime() - new Date(lastRequestTime).getTime()) / 1000;

        if (secondsSinceLastRequest < 0) {
            const error = new Error(
                "Unable to process the request. Please try again shortly."
            );
            error.statusCode = 500;
            throw error;
        }

        if (secondsSinceLastRequest < OTP_RESEND_COOLDOWN_SECONDS) {
            const error = new Error(
                "Please wait before requesting another OTP"
            );
            error.statusCode = 429;
            throw error;
        }
    }

    // Limit password-reset requests to five per hour.
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const requestsInLastHour = await VerificationToken.countDocuments({
        userId: user._id,
        type: "password_reset",
        $or: [
            { requestedAt: { $gte: oneHourAgo } },
            {
                requestedAt: { $exists: false },
                createdAt: { $gte: oneHourAgo },
            },
        ],
    });

    if (requestsInLastHour >= MAX_OTP_REQUESTS_PER_HOUR) {
        const error = new Error(
            "OTP request limit reached. Please try again later."
        );
        error.statusCode = 429;
        throw error;
    }

    // Invalidate previous unused password-reset OTPs.
    await VerificationToken.updateMany(
        {
            userId: user._id,
            type: "password_reset",
            verifiedAt: null,
            invalidatedAt: null,
        },
        { $set: { invalidatedAt: now } }
    );

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);

    const expiresAt = new Date(
        now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000
    );

    const resetToken = await VerificationToken.create({
        userId: user._id,
        email: user.email,
        type: "password_reset",
        otpHash,
        requestedAt: now,
        expiresAt,
    });

    try {
        await sendEmail({
            to: user.email,
            subject: "Reset your ServiceBook password",
            html: `
                <h2>ServiceBook Password Reset</h2>
                <p>Your password-reset code is:</p>
                <h1>${otp}</h1>
                <p>This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
                <p>If you did not request a password reset, you can ignore this email.</p>
            `,
        });
    } catch (error) {
        await VerificationToken.updateOne(
            { _id: resetToken._id },
            { $set: { invalidatedAt: new Date() } }
        );

        throw error;
    }

    return {
        message: "If an account exists for this email, a password-reset OTP will be sent.",
        expiresInMinutes: OTP_EXPIRY_MINUTES,
        resendCooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    };
};

// Validates a password-reset OTP and updates the user's password.
const resetPassword = async ({ email, otp, newPassword } = {}) => {
    if (
        typeof email !== "string" ||
        !email.trim() ||
        typeof otp !== "string" ||
        !/^\d{6}$/.test(otp) ||
        typeof newPassword !== "string" ||
        newPassword.length < 8 ||
        !/[A-Z]/.test(newPassword) ||
        !/[a-z]/.test(newPassword) ||
        !/\d/.test(newPassword) ||
        !/[^A-Za-z0-9]/.test(newPassword)
    ) {
        const error = new Error(
            "Provide a valid email, six-digit OTP, and a password with at least 8 characters including uppercase, lowercase, number, and special character."
        );
        error.statusCode = 400;
        throw error;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
        const error = new Error("Invalid or expired OTP");
        error.statusCode = 400;
        throw error;
    }

    const token = await VerificationToken.findOne({
        userId: user._id,
        email: normalizedEmail,
        type: "password_reset",
        verifiedAt: null,
        invalidatedAt: null,
        expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });


    if (!token || token.attempts >= 5) {
        const error = new Error("Invalid or expired OTP");
        error.statusCode = 400;
        throw error;
    }

    const isOTPValid = await bcrypt.compare(otp, token.otpHash);

    if (!isOTPValid) {
        await VerificationToken.updateOne(
            { _id: token._id },
            { $inc: { attempts: 1 } }
        );

        const error = new Error("Invalid or expired OTP");
        error.statusCode = 400;
        throw error;
    }

    // Hash the new password before saving it.
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Mark the OTP as used and invalidate any other unused reset OTPs.
    const now = new Date();

    await VerificationToken.updateOne(
        { _id: token._id },
        { $set: { verifiedAt: now } }
    );

    await VerificationToken.updateMany(
        {
            userId: user._id,
            type: "password_reset",
            _id: { $ne: token._id },
            verifiedAt: null,
            invalidatedAt: null,
        },
        { $set: { invalidatedAt: now } }
    );

    return {
        message: "Password has been reset successfully.",
    };
};

module.exports = {
    sendVerificationOTP,
    verifyEmailOTP,
    sendPasswordResetOTP,
    resetPassword
};