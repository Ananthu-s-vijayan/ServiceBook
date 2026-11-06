const { authenticate } = require("@google-cloud/local-auth");
const fs = require("fs");
require("dotenv").config();

const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];

async function main() {
try {
// Locate the OAuth credentials file in SBookRevision.
const credentialsPath =
"C:/SBookRevision/client_secret_213271617539-vh5ff8hs2u8h4o45qc8cu0dd9c4q3u0h.apps.googleusercontent.com.json";


    // Confirm that the OAuth credentials file exists.
    if (!fs.existsSync(credentialsPath)) {
        throw new Error(
            "OAuth JSON file not found at: " + credentialsPath
        );
    }

    // Open Google's authorization flow and handle the localhost redirect.
    const auth = await authenticate({
        scopes: SCOPES,
        keyfilePath: credentialsPath,
    });

    // Retrieve the refresh token needed for future Gmail API requests.
    const refreshToken = auth.credentials.refresh_token;

    if (!refreshToken) {
        throw new Error(
            "No refresh token received. Check whether this Google account has already authorized the application."
        );
    }

    console.log("\nGmail authorization successful.");
    console.log("Refresh token obtained successfully.");
    console.log("\nAdd this variable to your backend .env file:");
    console.log("GOOGLE_REFRESH_TOKEN=" + refreshToken);
    console.log(
        "\nSecurity: Keep this token private and never commit it to Git."
    );
} catch (error) {
    console.error("\nGmail authorization failed:");
    console.error(error.message);
    process.exitCode = 1;
}


}

main();
