const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// Sends a transactional email through Resend.
const sendEmail = async ({ to, subject, html }) => {
    if (!process.env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY is not configured");
    }

    if (!process.env.RESEND_FROM_EMAIL) {
        throw new Error("RESEND_FROM_EMAIL is not configured");
    }

    const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to,
        subject,
        html,
    });

    if (error) {
        console.error("Resend email error:", error.message);
        throw new Error("Failed to send email");
    }

    return data;
};

module.exports = { sendEmail };