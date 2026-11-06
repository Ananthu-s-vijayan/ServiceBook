const bcrypt=require("bcrypt");
const User=require("../models/User");
const jwt =require("jsonwebtoken");


const { OAuth2Client } = require("google-auth-library");
// Used to verify Google ID tokens received from the frontend.
const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

const {sendVerificationOTP}=require("./otpService");

const registerUser = async ({ fullName, email, password } = {}) => {
    // Test that all required fields are strings before using string methods.
    if (
        typeof fullName !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string"
    ) {
        const error = new Error(
            "Full name, email and password are required"
        );
        error.statusCode = 400;
        throw error;
    }

    const normalizedName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Allow letters, spaces, periods, apostrophes and hyphens.
// Require at least one letter.
const nameRegex = /^(?=.*\p{L})[\p{L}\p{M} .'-]+$/u;

if (!nameRegex.test(normalizedName)) {
    const error = new Error(
        "Full name must contain letters and may include spaces, periods, apostrophes or hyphens"
    );
    error.statusCode = 400;
    throw error;
}

    // Reject missing or whitespace-only required fields.
    if (!normalizedName || !normalizedEmail || !password.trim()) {
        const error = new Error(
            "Full name, email and password are required"
        );
        error.statusCode = 400;
        throw error;
    }

    // Reject email addresses that do not match a basic email format.
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
        const error = new Error("Please provide a valid email address");
        error.statusCode = 400;
        throw error;
    }

    // Prevent excessively long input values.
    if (normalizedName.length > 100) {
        const error = new Error("Full name must not exceed 100 characters");
        error.statusCode = 400;
        throw error;
    }

    if (normalizedEmail.length > 254) {
        const error = new Error("Email must not exceed 254 characters");
        error.statusCode = 400;
        throw error;
    }

    // Match the password-strength policy used by password reset.
    const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,128}$/;

    if (!passwordRegex.test(password)) {
        const error = new Error(
            "Password must be 8-128 characters and include uppercase, lowercase, a number and a special character"
        );
        error.statusCode = 400;
        throw error;
    }

    const existingUser = await User.findOne({
        email: normalizedEmail
    });

    if (existingUser) {
        // Verified accounts cannot register again.
        if (existingUser.isVerified) {
            const error = new Error("Email already registered");
            error.statusCode = 409;
            throw error;
        }

        // Preserve the existing flow for unverified accounts.
        const verification = await sendVerificationOTP(existingUser);

        return {
            id: existingUser._id,
            fullName: existingUser.fullName,
            email: existingUser.email,
            role: existingUser.role,
            isVerified: existingUser.isVerified,
            profileImage: existingUser.profileImage,
            referralCode: existingUser.referralCode,
            status: existingUser.status,
            createdAt: existingUser.createdAt,
            updatedAt: existingUser.updatedAt,
            verification
        };
    }

    // Hash the password only after validation succeeds.
    const passwordHash = await bcrypt.hash(password, 10);
    const referralCode =
        `SB${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const user = await User.create({
        fullName: normalizedName,
        email: normalizedEmail,
        passwordHash,
        referralCode
    });

    const verification = await sendVerificationOTP(user);

    return {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        profileImage: user.profileImage,
        referralCode: user.referralCode,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        verification
    };
};

const loginUser = async ({ email, password } = {}) => {
    // Validate required fields and their types before using string methods.
    if (
        typeof email !== "string" ||
        !email.trim() ||
        typeof password !== "string" ||
        !password
    ) {
        const error = new Error("Email and password are required");
        error.statusCode = 400;
        throw error;
    }

    // Normalize the email so login is case-insensitive.
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
        email: normalizedEmail,
    });

    // Use the same response for an unknown email and an incorrect password.
    if (!user) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }

    // Reject password login if this account has no password hash.
// Google-only accounts must authenticate through Google.
if (!user.passwordHash) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
}

// Verify the submitted password against the stored hash.
const isPasswordValid = await bcrypt.compare(
    password,
    user.passwordHash
);

if (!isPasswordValid) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
}

    // Email verification is required before login.
    if (!user.isVerified) {
        const error = new Error(
            "Please verify your email before logging in"
        );
        error.statusCode = 403;
        throw error;
    }

    // Inactive accounts must not receive a login token.
    if (user.status !== "active") {
        const error = new Error("Your account is inactive");
        error.statusCode = 403;
        throw error;
    }

    // Generate a JWT only after all authentication checks pass.
    const token = jwt.sign(
        {
            userId: user._id,
            role: user.role,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d",
        }
    );

    return {
        token,
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        profileImage: user.profileImage,
        referralCode: user.referralCode,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
};



const googleLogin = async ({ idToken, mode } = {}) => {
    // Accept only the two supported Google authentication operations.
    if (!["signup", "login"].includes(mode)) {
        const error = new Error(
            "Invalid Google authentication mode"
        );
        error.statusCode = 400;
        throw error;
    }

    // Validate the Google ID token before contacting Google.
    if (typeof idToken !== "string" || !idToken.trim()) {
        const error = new Error("Google ID token is required");
        error.statusCode = 400;
        throw error;
    }

    // Verify the token's signature, expiry and intended audience.
    let ticket;

    try {
        ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });
    } catch {
        const error = new Error("Invalid Google ID token");
        error.statusCode = 401;
        throw error;
    }

    const payload = ticket.getPayload();

    // Require an email address verified by Google.
    if (
        !payload ||
        !payload.email ||
        payload.email_verified !== true
    ) {
        const error = new Error(
            "Google account must have a verified email address"
        );
        error.statusCode = 401;
        throw error;
    }

    const normalizedEmail = payload.email.trim().toLowerCase();

    // Find any existing ServiceBook account with this email.
    const user = await User.findOne({
        email: normalizedEmail
    });

    // SIGNUP: reject an email that is already registered.
    if (mode === "signup") {
        if (user) {
            const error = new Error(
                "Email already registered. Please log in instead."
            );
            error.statusCode = 409;
            throw error;
        }

        // Create a new Google account only when the email is unused.
        const fullName =
            typeof payload.name === "string" && payload.name.trim()
                ? payload.name.trim()
                : normalizedEmail.split("@")[0];

        const referralCode =
            `SB${Date.now()}${Math.floor(Math.random() * 1000)}`;

        const newUser = await User.create({
            fullName,
            email: normalizedEmail,
            authProvider: "google",
            isVerified: true,
            profileImage:
                typeof payload.picture === "string"
                    ? payload.picture
                    : null,
            referralCode,
            role: "user",
            status: "active"
        });

        // Generate a ServiceBook JWT for the new account.
        const token = jwt.sign(
            {
                userId: newUser._id,
                role: newUser.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        return {
            token,
            id: newUser._id,
            fullName: newUser.fullName,
            email: newUser.email,
            role: newUser.role,
            isVerified: newUser.isVerified,
            profileImage: newUser.profileImage,
            referralCode: newUser.referralCode,
            status: newUser.status,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt
        };
    }

    // LOGIN: reject an email that has no ServiceBook account.
    if (!user) {
        const error = new Error(
            "No account is registered with this email. Please sign up first."
        );
        error.statusCode = 404;
        throw error;
    }

    // Do not authenticate password-based accounts through Google.
    if (user.authProvider !== "google") {
        const error = new Error(
            "This account uses email and password. Please log in using your email and password."
        );
        error.statusCode = 409;
        throw error;
    }

    // Inactive accounts must not receive a JWT.
    if (user.status !== "active") {
        const error = new Error("Your account is inactive");
        error.statusCode = 403;
        throw error;
    }

    // Generate a ServiceBook JWT for the existing Google account.
    const token = jwt.sign(
        {
            userId: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d"
        }
    );

    return {
        token,
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        profileImage: user.profileImage,
        referralCode: user.referralCode,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
};


module.exports={
    registerUser,
    loginUser,
    googleLogin
};