const request = require("supertest");
const app = require("../src/app");
const { sendEmail } = require("../src/utils/emailService");

// Purpose: Extract the six-digit OTP from the mocked verification email
// so tests can verify a user's email without sending a real email.
const getOTPFromMockedEmail = (email) => {
    const emailCall = sendEmail.mock.calls.find(
        ([message]) => message.to === email
    );

    if (!emailCall) {
        throw new Error(`No verification email found for ${email}`);
    }

    const html = emailCall[0].html;
    const match = html.match(/<h1>(\d{6})<\/h1>/);

    if (!match) {
        throw new Error(
            `OTP not found in verification email for ${email}`
        );
    }

    return match[1];
};

// Purpose: Verify a registered user's email through the actual API.
// This ensures login tests follow ServiceBook's email-verification rules.
const verifyUserEmail = async (email) => {
    const otp = getOTPFromMockedEmail(email);

    const response = await request(app)
        .post("/api/user/verify-email")
        .send({
            email,
            otp
        });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.isVerified).toBe(true);

    return response;
};

describe("GET /api/health", () => {
    test("should return 200 and API health message", async () => {
        const response = await request(app)
            .get("/api/health");

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            success: true,
            message: "ServiceBook API is running"
        });
    });

    test("should return 404 for an invalid endpoint", async () => {
        const response = await request(app)
            .get("/api/invalid");

        expect(response.statusCode).toBe(404);
    });
});

describe("POST /api/user/register", () => {
    test("should register a new user successfully", async () => {
        const response = await request(app)
            .post("/api/user/register")
            .send({
                fullName: "Test User",
                email: "testuser@example.com",
                password: "Password@123"
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe(
            "User registered successfully"
        );
        expect(response.body.data.email).toBe(
            "testuser@example.com"
        );
        expect(response.body.data.fullName).toBe("Test User");
        expect(response.body.data).not.toHaveProperty("passwordHash");
    });
});

describe("POST /api/user/login", () => {
    test("should login an existing user successfully", async () => {
        // Register the user.
        const registerResponse = await request(app)
            .post("/api/user/register")
            .send({
                fullName: "Login Test User",
                email: "logintest@example.com",
                password: "Password@123"
            });

        expect(registerResponse.statusCode).toBe(201);

        // Verify the user's email before attempting login.
        await verifyUserEmail("logintest@example.com");

        // Attempt login using the correct password.
        const response = await request(app)
            .post("/api/user/login")
            .send({
                email: "logintest@example.com",
                password: "Password@123"
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("Login successful");
        expect(response.body.data.email).toBe(
            "logintest@example.com"
        );
        expect(response.body.data.fullName).toBe(
            "Login Test User"
        );
        expect(response.body.data).toHaveProperty("token");
        expect(typeof response.body.data.token).toBe("string");
        expect(response.body.data.token.length).toBeGreaterThan(0);
        expect(response.body.data).not.toHaveProperty("passwordHash");
    });

    test("should reject login with an incorrect password", async () => {
        // Register the user.
        const registerResponse = await request(app)
            .post("/api/user/register")
            .send({
                fullName: "Wrong Password User",
                email: "wrongpassword@example.com",
                password: "Password@123"
            });

        expect(registerResponse.statusCode).toBe(201);

        // Verify the user's email so the login request reaches
        // password validation rather than failing verification first.
        await verifyUserEmail("wrongpassword@example.com");

        // Attempt login using an incorrect password.
        const response = await request(app)
            .post("/api/user/login")
            .send({
                email: "wrongpassword@example.com",
                password: "WrongPassword@123"
            });

        expect(response.statusCode).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe(
            "Invalid email or password"
        );
    });
});