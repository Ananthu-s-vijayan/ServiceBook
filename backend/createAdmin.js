// One-time script to create the first ServiceBook admin account.

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("./src/models/User");

const createAdmin = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is missing from the environment");
        }

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("Connected to MongoDB");

        // Ask for admin details through environment variables.
        const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

        if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
            throw new Error(
                "Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in your environment"
            );
        }

        const email = ADMIN_EMAIL.trim().toLowerCase();

        // Do not overwrite an existing account.
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            throw new Error(
                "An account with this email already exists. No changes were made."
            );
        }

        const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

        const admin = await User.create({
            fullName: ADMIN_NAME.trim(),
            email,
            passwordHash,
            role: "admin",
            isVerified: true,
            status: "active",
        });

        console.log("Admin account created successfully.");
        console.log(`Email: ${admin.email}`);
        console.log(`Role: ${admin.role}`);
    } catch (error) {
        console.error("Admin setup failed:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

createAdmin();