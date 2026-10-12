// Load environment variables for testing.
require("dotenv").config({ path: ".env.test" });

// Mock email delivery before the application loads.
// This prevents Resend from requiring a real API key during tests.
jest.mock("../src/utils/emailService", () => {
    return require("./mocks/emailService");
});

const mongoose = require("mongoose");
const connectDB = require("../src/config/db");

// Connect to the test database and clear it before the test run.
beforeAll(async () => {
    await connectDB();
    await mongoose.connection.dropDatabase();
});

// Close the database connection after the test run.
afterAll(async () => {
    await mongoose.connection.close();
});