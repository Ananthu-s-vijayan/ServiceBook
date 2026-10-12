const bcrypt=require("bcrypt");
const User=require("../models/User");
const jwt =require("jsonwebtoken");

const {sendVerificationOTP}=require("./otpService");

const registerUser=async({fullName , email , password })=>{
    if(!fullName||!email||!password){
        const error=new Error("Full name, email and password are required");
        error.statusCode =400;
        throw error;
    }

    const normalizedEmail=email.trim().toLowerCase();

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

    // Allow an existing unverified account to request another OTP.
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
        verification:verification
    };
}
const passwordHash = await bcrypt.hash(password, 10);
const referralCode = `SB${Date.now()}${Math.floor(Math.random() * 1000)}`;

const user = await User.create({
    fullName: fullName.trim(),
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
    verification: verification
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

module.exports={
    registerUser,
    loginUser
};