const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/User");
const VerificationToken = require("../src/models/VerificationToken");
const { sendEmail } = require("../src/utils/emailService");

describe("POST /api/user/register", () => {
    beforeEach(async () => {
        // Purpose: Isolate each test so previous users and emails cannot affect results.
        await VerificationToken.deleteMany({});
        await User.deleteMany({});
        sendEmail.mockClear();
    });

    const validUser = {
        fullName: "Nanda",
        email: "nanda@example.com",
        password: "StrongPass@123"
    };

    test("registers a valid user and sends verification email", async () => {
        // Purpose: Verify valid input creates an unverified user and starts OTP delivery.
        const response = await request(app)
            .post("/api/user/register")
            .send(validUser);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.email).toBe(validUser.email);
        expect(response.body.data.isVerified).toBe(false);
        expect(sendEmail).toHaveBeenCalledTimes(1);

        const savedUser = await User.findOne({
            email: validUser.email
        });

        expect(savedUser).not.toBeNull();
        expect(savedUser.passwordHash).not.toBe(validUser.password);
    });

    test.each([
        [{ email: "nanda@example.com", password: "StrongPass@123" }],
        [{ fullName: "Nanda", password: "StrongPass@123" }],
        [{ fullName: "Nanda", email: "nanda@example.com" }]
    ])("rejects missing required fields: %j", async (payload) => {
        // Purpose: Verify registration refuses requests missing a required field.
        const response = await request(app)
            .post("/api/user/register")
            .send(payload);

        expect(response.status).toBe(400);
    });

    test.each([
        [{ fullName: "   ", email: "nanda@example.com", password: "StrongPass@123" }],
        [{ fullName: "Nanda", email: "   ", password: "StrongPass@123" }],
        [{ fullName: "Nanda", email: "nanda@example.com", password: "   " }]
    ])("rejects whitespace-only required fields: %j", async (payload) => {
        // Purpose: Verify whitespace cannot bypass required-field validation.
        const response = await request(app)
            .post("/api/user/register")
            .send(payload);

        expect(response.status).toBe(400);
    });

    test.each([
        "invalid-email",
        "missing-domain@",
        "@missing-name.com"
    ])("rejects invalid email %s", async (email) => {
        // Purpose: Verify malformed email addresses are rejected before user creation.
        const response = await request(app)
            .post("/api/user/register")
            .send({ ...validUser, email });

        expect(response.status).toBe(400);
        expect(await User.countDocuments()).toBe(0);
    });

    test.each([
        "weakpass",
        "NoNumber@",
        "NoSpecial123",
        "nouppercase@123",
        "Short@1"
    ])("rejects weak password %s", async (password) => {
        // Purpose: Verify passwords that violate the strength policy cannot register.
        const response = await request(app)
            .post("/api/user/register")
            .send({ ...validUser, password });

        expect(response.status).toBe(400);
        expect(await User.countDocuments()).toBe(0);
    });

    // NEW TESTS: Reject names that do not follow the allowed name format.
    test.each([
        ["12345", "numbers only"],
        ["@@@@", "symbols only"],
        ["Anu123", "letters mixed with numbers"],
        ["Anu@Maria", "unsupported symbol"]
    ])("rejects invalid name: %s (%s)", async (fullName) => {
        // Purpose: Verify names without an allowed format cannot register.
        const response = await request(app)
            .post("/api/user/register")
            .send({
                ...validUser,
                fullName
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(await User.countDocuments()).toBe(0);
    });

    // NEW TESTS: Ensure common and international names remain valid.
    test.each([
        "Anu Maria",
        "A. K. Suresh",
        "John O'Connor",
        "Anne-Marie",
        "അനു"
    ])("accepts a valid name: %s", async (fullName) => {
        // Purpose: Verify the name validation supports common punctuation and Malayalam.
        const response = await request(app)
            .post("/api/user/register")
            .send({
                ...validUser,
                fullName
            });

        expect(response.status).toBe(201);
        expect(response.body.data.fullName).toBe(fullName);
    });

    test("normalizes email to lowercase and removes surrounding spaces", async () => {
        // Purpose: Verify email normalization is applied before lookup and persistence.
        const response = await request(app)
            .post("/api/user/register")
            .send({
                ...validUser,
                email: "  NANDA@EXAMPLE.COM  "
            });

        expect(response.status).toBe(201);
        expect(response.body.data.email).toBe("nanda@example.com");
        expect(await User.countDocuments()).toBe(1);
    });

    test("rejects duplicate registration for an already verified email", async () => {
        // Purpose: Verify a verified account cannot register again with the same email.
        const bcrypt = require("bcrypt");

        await User.create({
            fullName: "Existing User",
            email: validUser.email,
            passwordHash: await bcrypt.hash("ExistingPass@123", 10),
            isVerified: true,
            status: "active",
            referralCode: "SB-EXISTING-001"
        });

        const response = await request(app)
            .post("/api/user/register")
            .send(validUser);

        expect(response.status).toBe(409);
        expect(response.body.message).toBe("Email already registered");
    });
});