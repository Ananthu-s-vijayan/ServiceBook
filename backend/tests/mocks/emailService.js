// Purpose: Simulate successful email delivery during tests
// without requiring Resend credentials or sending real emails.

const sendEmail = jest.fn().mockResolvedValue({
    id: "test-email-id",
});

module.exports = { sendEmail };