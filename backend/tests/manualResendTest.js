require("dotenv").config();

const { sendEmail } = require("../src/utils/emailService");

const testResend = async () => {
    try {
        // Tests whether the backend can successfully submit an email through Resend.
        const result = await sendEmail({
            to: "delivered@resend.dev",
            subject: "ServiceBook Email Configuration Test",
            html: "<h2>ServiceBook</h2><p>Resend email integration is working.</p>",
        });

        console.log("Email submitted successfully:", result.id);
    } catch (error) {
        console.error("Email test failed:", error.message);
        process.exitCode = 1;
    }
};

testResend();