const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(process.env.MONGODB_URI);

        console.log(
            `MongoDB connected successfully: ${connection.connection.host}`
        );
        console.log(`Database name: ${connection.connection.name}`)
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        throw error;
    }
};

module.exports = connectDB;