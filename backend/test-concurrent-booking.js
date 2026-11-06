
const API_URL = "http://localhost:3000/api/bookings";

// Supply a valid JWT through the environment variable.
// Never hardcode a real authentication token in the script.
const TOKEN = process.env.SERVICEBOOK_TEST_TOKEN;

if (!TOKEN) {
    console.error(
        "Missing token. Set the SERVICEBOOK_TEST_TOKEN environment variable first."
    );
    process.exit(1);
}

const bookingPayload = {
    serviceId: "6ad35d3fa8dbc35eff01325e",
    addressId: "6adca1f55be91d5e617b3866",
    date: "2026-10-28",
    startTime: "15:00",
    requestedDurationHours: 3,
    entryInstructions: "Concurrent booking test"
};

async function sendBookingRequest(requestName) {
    const startedAt = Date.now();

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${TOKEN}`
            },
            body: JSON.stringify(bookingPayload)
        });

        const responseBody = await response.json();

        return {
            requestName,
            httpStatus: response.status,
            elapsedMs: Date.now() - startedAt,
            success: responseBody.success,
            message: responseBody.message,
            bookingId: responseBody.data?._id ?? null,
            bookingNumber: responseBody.data?.bookingNumber ?? null,
            start: responseBody.data?.scheduledStartAt ?? null,
            end: responseBody.data?.scheduledEndAt ?? null
        };
    } catch (error) {
        return {
            requestName,
            error: error.message
        };
    }
}

async function runTest() {
    console.log("Starting concurrent booking test...");
    console.log("Requested interval: 2026-10-28 15:00–18:00 UTC");
    console.log("Launching both requests concurrently.\n");

    // Both HTTP requests are initiated together rather than awaited sequentially.
    const results = await Promise.all([
        sendBookingRequest("Request A"),
        sendBookingRequest("Request B")
    ]);

    console.table(results);

    const successfulBookings = results.filter(
        result => result.success === true
    );

    const failedRequests = results.filter(
        result => result.success === false
    );

    console.log("\nTest summary:");
    console.log("Successful requests:", successfulBookings.length);
    console.log("Rejected requests:", failedRequests.length);

    if (
        successfulBookings.length === 1 &&
        failedRequests.length === 1
    ) {
        console.log(
            "PASS: Exactly one request succeeded and one was rejected."
        );
    } else {
        console.log(
            "INCONCLUSIVE: Inspect both responses and verify the database state."
        );
    }
}

runTest();


