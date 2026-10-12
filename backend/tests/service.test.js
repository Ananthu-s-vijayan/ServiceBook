const request = require("supertest");
const app = require("../src/app");
const jwt = require("jsonwebtoken");

describe("Service API", () => {

    let categoryId;
    let adminToken;

    /*
     * Create one category before running the Service API tests.
     *
     * All service records require a valid categoryId because
     * services have a relationship with the Category collection.
     */
    beforeAll(async () => {
    // Create a test-only admin token for protected admin API requests.
    adminToken = jwt.sign(
        {
            userId: "507f1f77bcf86cd799439011",
            role: "admin"
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    // Create a category because every service requires a valid categoryId.
    const categoryResponse = await request(app)
        .post("/api/admin/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
            name: "Electrical",
            icon: "electrical",
            description: "Electrical services"
        });

    // Fail clearly if category setup does not succeed.
    expect(categoryResponse.statusCode).toBe(201);
    expect(categoryResponse.body.success).toBe(true);
    expect(categoryResponse.body.data).toBeDefined();

    categoryId = categoryResponse.body.data._id;
});


    /*
     * TEST 1
     *
     * Purpose:
     * Verify that an admin can successfully create a new service.
     *
     * API:
     * POST /api/admin/services
     *
     * Expected:
     * - HTTP 201
     * - success = true
     * - Correct service data is returned
     * - Newly created service is active by default
     */
    test("should create a service successfully", async () => {
        const response = await request(app)
            .post("/api/admin/services")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                categoryId,
                title: "AC Installation",
                sku: "AC-INSTALL-001",
                shortDescription: "Professional AC installation",
                description: "Complete AC installation service",
                pricingType: "hourly",
                pricePerHour: 500,
                estimatedDuration: 120,
                imageUrl: "https://example.com/ac-installation.jpg"
            });

        expect(response.statusCode).toBe(201);

        expect(response.body.success).toBe(true);

        expect(response.body.message).toBe(
            "Service created successfully"
        );

        expect(response.body.data.categoryId).toBe(categoryId);

        expect(response.body.data.title).toBe(
            "AC Installation"
        );

        expect(response.body.data.sku).toBe(
            "AC-INSTALL-001"
        );

        expect(response.body.data.pricingType).toBe(
            "hourly"
        );

        expect(response.body.data.pricePerHour).toBe(500);

        expect(response.body.data.estimatedDuration).toBe(120);

        expect(response.body.data.isActive).toBe(true);
    });


    /*
     * TEST 2
     *
     * Purpose:
     * Verify that an existing service can be updated.
     *
     * API:
     * PUT /api/admin/services/:id
     *
     * We first create a service so that we have a real service ID.
     *
     * Then we update:
     * - title
     * - pricePerHour
     * - estimatedDuration
     *
     * We also verify that the SKU remains unchanged because
     * it was not included in the update request.
     *
     * Expected:
     * - HTTP 200
     * - success = true
     * - Updated fields contain new values
     * - Unchanged fields remain unchanged
     */
    test("should update a service successfully", async () => {
        const serviceResponse = await request(app)
            .post("/api/admin/services")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                categoryId,
                title: "AC Installation",
                sku: "AC-INSTALL-002",
                shortDescription: "Professional AC installation",
                description: "Complete AC installation service",
                pricingType: "hourly",
                pricePerHour: 500,
                estimatedDuration: 120,
                imageUrl: "https://example.com/ac-installation.jpg"
            });

        expect(serviceResponse.statusCode).toBe(201);

        const serviceId = serviceResponse.body.data._id;

        const response = await request(app)
            .put(`/api/admin/services/${serviceId}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                title: "AC Installation and Setup",
                pricePerHour: 600,
                estimatedDuration: 150
            });

        expect(response.statusCode).toBe(200);

        expect(response.body.success).toBe(true);

        expect(response.body.message).toBe(
            "Service updated successfully"
        );

        expect(response.body.data.title).toBe(
            "AC Installation and Setup"
        );

        expect(response.body.data.pricePerHour).toBe(600);

        expect(response.body.data.estimatedDuration).toBe(150);

        // SKU was not included in the update request,
        // so the original SKU should remain unchanged.
        expect(response.body.data.sku).toBe(
            "AC-INSTALL-002"
        );

        // Updating a service should not automatically deactivate it.
        expect(response.body.data.isActive).toBe(true);
    });


    /*
     * TEST 3
     *
     * Purpose:
     * Verify that an admin can deactivate an active service.
     *
     * API:
     * PATCH /api/admin/services/:id/status
     *
     * Request:
     * {
     *     isActive: false
     * }
     *
     * Expected:
     * - HTTP 200
     * - success = true
     * - isActive becomes false
     */
    test("should deactivate a service successfully", async () => {
        const serviceResponse = await request(app)
            .post("/api/admin/services")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                categoryId,
                title: "AC Repair",
                sku: "AC-REPAIR-001",
                shortDescription: "Professional AC repair",
                description: "Complete AC repair service",
                pricingType: "hourly",
                pricePerHour: 700,
                estimatedDuration: 90,
                imageUrl: "https://example.com/ac-repair.jpg"
            });

        expect(serviceResponse.statusCode).toBe(201);

        const serviceId = serviceResponse.body.data._id;

        const response = await request(app)
            .patch(`/api/admin/services/${serviceId}/status`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                isActive: false
            });

        expect(response.statusCode).toBe(200);

        expect(response.body.success).toBe(true);

        expect(response.body.message).toBe(
            "Service status updated successfully"
        );

        expect(response.body.data.isActive).toBe(false);
    });


    /*
     * TEST 4
     *
     * Purpose:
     * Verify that a previously deactivated service can be
     * activated again.
     *
     * API:
     * PATCH /api/admin/services/:id/status
     *
     * Flow:
     * 1. Create an active service.
     * 2. Deactivate it.
     * 3. Reactivate it.
     *
     * Expected:
     * - HTTP 200
     * - isActive becomes true again
     */
    test("should reactivate a service successfully", async () => {
        const serviceResponse = await request(app)
            .post("/api/admin/services")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                categoryId,
                title: "Plumbing Repair",
                sku: "PLUMB-REPAIR-001",
                shortDescription: "Professional plumbing repair",
                description: "Complete plumbing repair service",
                pricingType: "hourly",
                pricePerHour: 600,
                estimatedDuration: 60,
                imageUrl: "https://example.com/plumbing.jpg"
            });

        expect(serviceResponse.statusCode).toBe(201);

        const serviceId = serviceResponse.body.data._id;

        // First deactivate the service.
        await request(app)
            .patch(`/api/admin/services/${serviceId}/status`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                isActive: false
            });

        // Then activate the same service again.
        const response = await request(app)
            .patch(`/api/admin/services/${serviceId}/status`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                isActive: true
            });

        expect(response.statusCode).toBe(200);

        expect(response.body.success).toBe(true);

        expect(response.body.message).toBe(
            "Service status updated successfully"
        );

        expect(response.body.data.isActive).toBe(true);
    });


    /*
     * TEST 5
     *
     * Purpose:
     * Verify that the API rejects an invalid isActive value.
     *
     * Valid values:
     * - true
     * - false
     *
     * Invalid example:
     * - "false"  ← string instead of Boolean
     *
     * Expected:
     * - HTTP 400
     * - success = false
     * - Correct validation message
     */
    test("should reject an invalid service status", async () => {
        const serviceResponse = await request(app)
            .post("/api/admin/services")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                categoryId,
                title: "Washing Machine Repair",
                sku: "WM-REPAIR-001",
                shortDescription: "Washing machine repair",
                description: "Complete washing machine repair",
                pricingType: "hourly",
                pricePerHour: 550,
                estimatedDuration: 90,
                imageUrl: "https://example.com/washing-machine.jpg"
            });

        expect(serviceResponse.statusCode).toBe(201);

        const serviceId = serviceResponse.body.data._id;

        const response = await request(app)
            .patch(`/api/admin/services/${serviceId}/status`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                // Intentionally using a string to test validation.
                isActive: "false"
            });

        expect(response.statusCode).toBe(400);

        expect(response.body.success).toBe(false);

        expect(response.body.message).toBe(
            "isActive must be a boolean"
        );
    });


    /*
     * TEST 6
     *
     * Purpose:
     * Verify that the API returns 404 when attempting to
     * update the status of a service that does not exist.
     *
     * API:
     * PATCH /api/admin/services/:id/status
     *
     * Expected:
     * - HTTP 404
     * - success = false
     * - "Service not found" message
     */
    test(
        "should return 404 when updating status of a nonexistent service",
        async () => {
            const response = await request(app)
                .patch(
                    "/api/admin/services/507f1f77bcf86cd799439011/status"
                )
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    isActive: false
                });

            expect(response.statusCode).toBe(404);

            expect(response.body.success).toBe(false);

            expect(response.body.message).toBe(
                "Service not found"
            );
        }
    );

    /*
 * TEST: Verify that updating a service that does not exist
 * returns a 404 error instead of creating or modifying anything.
 */
test(
    "should return 404 when updating a nonexistent service",
    async () => {
        const response = await request(app)
            .put(
                "/api/admin/services/507f1f77bcf86cd799439011"
            )
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                title: "Updated Service"
            });

        expect(response.statusCode).toBe(404);

        expect(response.body.success).toBe(false);

        expect(response.body.message).toBe(
            "Service not found"
        );
    }
);

/*
 * TEST: Verify that updating a service with an SKU already
 * used by another service is rejected with a 409 conflict.
 */
test(
    "should reject update when SKU already exists",
    async () => {
        // Create the first service with a unique SKU.
        const firstServiceResponse = await request(app)
            .post("/api/admin/services")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                categoryId,
                title: "AC Repair",
                sku: "AC-REPAIR-UPDATE-001",
                pricingType: "hourly",
                pricePerHour: 700,
                estimatedDuration: 90
            });

        expect(firstServiceResponse.statusCode).toBe(201);

        // Create another service with a different SKU.
        const secondServiceResponse = await request(app)
            .post("/api/admin/services")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                categoryId,
                title: "AC Installation",
                sku: "AC-INSTALL-UPDATE-001",
                pricingType: "hourly",
                pricePerHour: 800,
                estimatedDuration: 120
            });

        expect(secondServiceResponse.statusCode).toBe(201);

        const secondServiceId =
            secondServiceResponse.body.data._id;

        // Try changing the second service's SKU to the
        // SKU already belonging to the first service.
        const response = await request(app)
            .put(`/api/admin/services/${secondServiceId}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                sku: "AC-REPAIR-UPDATE-001"
            });

        expect(response.statusCode).toBe(409);

        expect(response.body.success).toBe(false);

        expect(response.body.message).toBe(
            "Service SKU already exists"
        );
    }
);

/*
 * TEST: Verify that customers can fetch the available services.
 *
 * We are checking:
 * - GET /api/services works
 * - The API returns HTTP 200
 * - The response is successful
 * - Active services are included in the result
 */
test("should return active services successfully", async () => {
    // Create an active service.
    const serviceResponse = await request(app)
        .post("/api/admin/services")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
            categoryId,
            title: "Customer AC Service",
            sku: "CUSTOMER-AC-001",
            pricingType: "hourly",
            pricePerHour: 500,
            estimatedDuration: 120
        });

    expect(serviceResponse.statusCode).toBe(201);

    // Request services through the customer API.
    const response = await request(app)
        .get("/api/services");

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe(
        "Services fetched successfully"
    );

    expect(Array.isArray(response.body.data)).toBe(true);

    // Verify that the newly created active service is present.
    const service = response.body.data.find(
        (item) => item.sku === "CUSTOMER-AC-001"
    );

    expect(service).toBeDefined();

    expect(service.title).toBe(
        "Customer AC Service"
    );

    expect(service.isActive).toBe(true);
});

/*
 * TEST: Verify that inactive services are hidden from customers.
 *
 * We are checking:
 * - An admin can deactivate a service
 * - GET /api/services does not return that inactive service
 * - Customers only receive active services
 */
test(
    "should not return inactive services",
    async () => {
        // Create a service.
        const serviceResponse = await request(app)
            .post("/api/admin/services")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                categoryId,
                title: "Inactive AC Service",
                sku: "INACTIVE-AC-001",
                pricingType: "hourly",
                pricePerHour: 600,
                estimatedDuration: 90
            });

        expect(serviceResponse.statusCode).toBe(201);

        const serviceId =
            serviceResponse.body.data._id;

        // Deactivate the service.
        const statusResponse = await request(app)
            .patch(
                `/api/admin/services/${serviceId}/status`
            )
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                isActive: false
            });

        expect(statusResponse.statusCode).toBe(200);

        // Request services through the customer API.
        const response = await request(app)
            .get("/api/services");

        expect(response.statusCode).toBe(200);

        // The inactive service must not appear.
        const inactiveService = response.body.data.find(
            (item) => item.sku === "INACTIVE-AC-001"
        );

        expect(inactiveService).toBeUndefined();
    }
);

/*
 * TEST: Verify that a customer can fetch one active service
 * using its service ID.
 *
 * We are checking:
 * - GET /api/services/:id works
 * - HTTP 200 is returned
 * - The correct service is returned
 */
test(
    "should return an active service by ID",
    async () => {
        // Create an active service first.
        const serviceResponse = await request(app)
            .post("/api/admin/services")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                categoryId,
                title: "AC Service Details",
                sku: "AC-DETAILS-001",
                pricingType: "hourly",
                pricePerHour: 500,
                estimatedDuration: 120
            });

        expect(serviceResponse.statusCode).toBe(201);

        const serviceId =
            serviceResponse.body.data._id;

        // Request that service through the customer API.
        const response = await request(app)
            .get(`/api/services/${serviceId}`);

        expect(response.statusCode).toBe(200);

        expect(response.body.success).toBe(true);

        expect(response.body.message).toBe(
            "Service fetched successfully"
        );

        expect(response.body.data._id).toBe(
            serviceId
        );

        expect(response.body.data.title).toBe(
            "AC Service Details"
        );

        expect(response.body.data.sku).toBe(
            "AC-DETAILS-001"
        );

        expect(response.body.data.isActive).toBe(true);
    }
);

/*
 * TEST: Verify that customers cannot fetch an inactive service
 * by its ID.
 *
 * We are checking:
 * - The service exists in the database
 * - The service is deactivated
 * - Customer API returns 404 instead of exposing it
 */
test(
    "should return 404 when requesting an inactive service",
    async () => {
        // Create a service.
        const serviceResponse = await request(app)
            .post("/api/admin/services")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                categoryId,
                title: "Inactive AC Details",
                sku: "AC-INACTIVE-DETAILS-001",
                pricingType: "hourly",
                pricePerHour: 600,
                estimatedDuration: 90
            });

        expect(serviceResponse.statusCode).toBe(201);

        const serviceId =
            serviceResponse.body.data._id;

        // Deactivate the service.
        const statusResponse = await request(app)
            .patch(
                `/api/admin/services/${serviceId}/status`
            )
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                isActive: false
            });

        expect(statusResponse.statusCode).toBe(200);

        // Try to fetch the inactive service as a customer.
        const response = await request(app)
            .get(`/api/services/${serviceId}`);

        expect(response.statusCode).toBe(404);

        expect(response.body.success).toBe(false);

        expect(response.body.message).toBe(
            "Service not found"
        );
    }
);

/*
 * TEST: Verify that requesting a valid but nonexistent
 * service ID returns a 404 error.
 *
 * We are checking:
 * - The ID format is valid
 * - No service exists with that ID
 * - The API correctly returns 404
 */
test(
    "should return 404 when service does not exist",
    async () => {
        const response = await request(app)
            .get(
                "/api/services/507f1f77bcf86cd799439011"
            );

        expect(response.statusCode).toBe(404);

        expect(response.body.success).toBe(false);

        expect(response.body.message).toBe(
            "Service not found"
        );
    }
);

/*
 * TEST: Verify that the API rejects an invalid service ID.
 *
 * We are checking:
 * - The ID is not a valid MongoDB ObjectId
 * - The API does not query MongoDB with the invalid value
 * - The API returns HTTP 400
 * - A clear validation message is returned
 */
test(
    "should return 400 for an invalid service ID",
    async () => {
        const response = await request(app)
            .get("/api/services/abc");

        expect(response.statusCode).toBe(400);

        expect(response.body.success).toBe(false);

        expect(response.body.message).toBe(
            "Invalid service ID"
        );
    }
);

});