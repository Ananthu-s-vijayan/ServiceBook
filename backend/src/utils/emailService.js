const { google } = require("googleapis");

const getGmailClient = () => {
const {
GOOGLE_CLIENT_ID,
GOOGLE_CLIENT_SECRET,
GOOGLE_REFRESH_TOKEN,
} = process.env;


if (
    !GOOGLE_CLIENT_ID ||
    !GOOGLE_CLIENT_SECRET ||
    !GOOGLE_REFRESH_TOKEN
) {
    throw new Error(
        "Google Gmail API credentials are not fully configured"
    );
}

const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN,
});

return google.gmail({
    version: "v1",
    auth: oauth2Client,
});


};

// Encodes an email message for the Gmail API.
const encodeMessage = ({ to, subject, html, from }) => {
const message = [
`From: ${from}`,
`To: ${to}`,
`Subject: ${subject}`,
"MIME-Version: 1.0",
'Content-Type: text/html; charset="UTF-8"',
"Content-Transfer-Encoding: base64",
"",
Buffer.from(html, "utf8").toString("base64"),
].join("\r\n");


return Buffer.from(message)
    .toString("base64url");


};

// Sends a transactional email through Gmail API.
const sendEmail = async ({ to, subject, html }) => {
const senderEmail = process.env.GOOGLE_SENDER_EMAIL;


if (!senderEmail) {
    throw new Error("GOOGLE_SENDER_EMAIL is not configured");
}

if (!to || !subject || !html) {
    throw new Error("Email recipient, subject, and HTML are required");
}

try {
    const gmail = getGmailClient();

    const rawMessage = encodeMessage({
        to,
        subject,
        html,
        from: senderEmail,
    });

    const response = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
            raw: rawMessage,
        },
    });

    return response.data;
} catch (error) {
    console.error("Gmail OAuth diagnostic:", {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
    });

    throw new Error("Failed to send email");
}


};

module.exports = { sendEmail };
