const request = require("supertest");
const bcrypt = require("bcrypt");

const app = require("../src/app");
const User = require("../src/models/User");
const VerificationToken = require("../src/models/VerificationToken");
const { sendEmail } = require("../src/utils/emailService");

// Extract the OTP from the mocked email so the test can exercise
// the real password-reset flow without sending an actual email.
const getOTPFromMockedEmail = (email) => {
    const emailCall = sendEmail.mock.calls
        .map(([message]) => message)
        .find((message) => message.to === email);

    if (!emailCall) {
        throw new Error(`No mocked email found for ${email}`);
    }

    const match = emailCall.html.match(/<h1>(\d{6})<\/h1>/);

    if (!match) {
        throw new Error("Could not extract the six-digit OTP from the email");
    }

    return match[1];
};

describe("Password recovery API", () => {
    const email = "password-reset-test@example.com";
    const oldPassword = "OldPassword@123";
    const newPassword = "NewPassword@456";

    let user;

    beforeEach(async () => {
        // Clear previous test records and email calls so each test
        // starts independently.
        await VerificationToken.deleteMany({});
        await User.deleteMany({});
        sendEmail.mockClear();

        const passwordHash = await bcrypt.hash(oldPassword, 10);

        user = await User.create({
            fullName: "Password Reset Test",
            email,
            passwordHash,
            isVerified: true,
            status: "active",
            referralCode: `SB-RESET-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        });
    });

    test("requests a password-reset OTP for a registered email", async () => {
        // Verify the API responds successfully and sends a mocked email.
        const response = await request(app)
            .post("/api/user/forgot-password")
            .send({ email });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(sendEmail).toHaveBeenCalledTimes(1);
        expect(sendEmail.mock.calls[0][0].to).toBe(email);
    });

    test("resets the password with a valid OTP and permits login with the new password", async () => {
        // Verify the complete recovery flow, including subsequent login.
        const forgotResponse = await request(app)
            .post("/api/user/forgot-password")
            .send({ email });

        expect(forgotResponse.status).toBe(200);

        const otp = getOTPFromMockedEmail(email);

        const resetResponse = await request(app)
            .post("/api/user/reset-password")
            .send({ email, otp, newPassword });

        expect(resetResponse.status).toBe(200);
        expect(resetResponse.body.success).toBe(true);

        const updatedUser = await User.findById(user._id);
        // Verify the new password matches the stored hash and the old one does not.
expect(await bcrypt.compare(newPassword, updatedUser.passwordHash)).toBe(true);
expect(await bcrypt.compare(oldPassword, updatedUser.passwordHash)).toBe(false);


        const loginResponse = await request(app)
            .post("/api/user/login")
            .send({ email, password: newPassword });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body.success).toBe(true);

        // The old password must no longer authenticate the user.
        const oldLoginResponse = await request(app)
            .post("/api/user/login")
            .send({ email, password: oldPassword });

        expect(oldLoginResponse.status).toBe(401);
        expect(oldLoginResponse.body.message).toBe("Invalid email or password");
    });

    test("rejects an incorrect OTP", async () => {
        // Verify a wrong OTP is rejected without changing the password.
        await request(app)
            .post("/api/user/forgot-password")
            .send({ email });

        const resetResponse = await request(app)
            .post("/api/user/reset-password")
            .send({
                email,
                otp: "000000",
                newPassword,
            });

        expect(resetResponse.status).toBe(400);
        expect(resetResponse.body.message).toBe("Invalid or expired OTP");

        const unchangedUser = await User.findById(user._id);
        expect(await bcrypt.compare(oldPassword, unchangedUser.passwordHash)).toBe(true);
    });

    test("rejects an expired OTP", async () => {
        // Verify an expired reset token cannot be used to change a password.
        await request(app)
            .post("/api/user/forgot-password")
            .send({ email });

        const otp = getOTPFromMockedEmail(email);

        await VerificationToken.updateOne(
            { userId: user._id, type: "password_reset" },
            { $set: { expiresAt: new Date(Date.now() - 1000) } }
        );

        const resetResponse = await request(app)
            .post("/api/user/reset-password")
            .send({ email, otp, newPassword });

        expect(resetResponse.status).toBe(400);
        expect(resetResponse.body.message).toBe("Invalid or expired OTP");
    });

    test("rejects a weak new password", async () => {
        // Verify password policy is enforced before a password can be reset.
        await request(app)
            .post("/api/user/forgot-password")
            .send({ email });

        const otp = getOTPFromMockedEmail(email);

        const resetResponse = await request(app)
            .post("/api/user/reset-password")
            .send({
                email,
                otp,
                newPassword: "weak",
            });

        expect(resetResponse.status).toBe(400);

        const unchangedUser = await User.findById(user._id);
        expect(await bcrypt.compare(oldPassword, unchangedUser.passwordHash)).toBe(true);
    });

    test("returns a generic success response for an unknown email", async () => {
        // Verify the endpoint doesn't reveal whether an email is registered.
        const response = await request(app)
            .post("/api/user/forgot-password")
            .send({ email: "unknown-user@example.com" });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(sendEmail).not.toHaveBeenCalled();
    });
});