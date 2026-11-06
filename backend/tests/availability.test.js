const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const app = require("../src/app");

const Category = require("../src/models/Category");
const Service = require("../src/models/Service");
const Professional = require("../src/models/Professional");

describe("Availability API", () => {
    let service;
    let adminToken;
    let professional;

    beforeEach(async () => {
        // Create a valid admin JWT for testing protected admin endpoints.
        adminToken = jwt.sign(
            {
                userId: new mongoose.Types.ObjectId(),
                role: "admin"
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // Create a category required by the Service model.
        const category = await Category.create({
            name: "Test Category",
            icon: "test",
            description: "Test category",
            isActive: true
        });

        // Create a service used by the availability tests.
        service = await Service.create({
            categoryId: category._id,
            title: "Test Plumbing Service",
            sku: `TEST-PLUMB-${Date.now()}`,
            shortDescription: "Test service",
            description: "Test plumbing service",
            pricingType: "hourly",
            pricePerHour: 300,
            estimatedDuration: 60,
            imageUrl: null,
            isActive: true
        });

         // Create a professional assigned to the test service.
        // Availability slots require a valid professional reference.
         professional = await Professional.create({
         name: "Test Professional",
            serviceId: service._id,
            isActive: true
        });
    });

    afterEach(async () => {
        // Remove test data so each test starts with a clean state.
        await Professional.deleteMany({});
        await Service.deleteMany({});
        await Category.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    test("should create an availability slot successfully", async () => {
        // Verify that an authorized admin can create a valid availability slot.
        const response = await request(app)
            .post("/api/admin/availability")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                serviceId: service._id,
                professionalId: professional._id,
                date: "2026-10-10",
                startTime: "08:00",
                endTime: "09:00",
                capacity: 3
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe(
            "Availability slot created successfully"
        );

        expect(response.body.data.serviceId.toString()).toBe(
            service._id.toString()
        );
        expect(response.body.data.startTime).toBe("08:00");
        expect(response.body.data.endTime).toBe("09:00");
        expect(response.body.data.capacity).toBe(3);
        expect(response.body.data.bookedCount).toBe(0);
        expect(response.body.data.status).toBe("available");
    });

    test("should fetch availability slots for a service", async () => {
        // Verify that an authorized admin can retrieve a service's availability slots.
        const firstSlot = await request(app)
            .post("/api/admin/availability")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                serviceId: service._id,
                professionalId: professional._id,
                date: "2026-10-10",
                startTime: "08:00",
                endTime: "09:00",
                capacity: 3
            });

        const secondSlot = await request(app)
            .post("/api/admin/availability")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                serviceId: service._id,
                professionalId: professional._id,
                date: "2026-10-10",
                startTime: "09:00",
                endTime: "10:00",
                capacity: 2
            });

        // Ensure slot creation succeeded before testing retrieval.
        expect(firstSlot.statusCode).toBe(201);
        expect(secondSlot.statusCode).toBe(201);

        const response = await request(app)
            .get(`/api/admin/availability/service/${service._id}`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(2);

        expect(response.body.data[0].serviceId.toString()).toBe(
            service._id.toString()
        );
        expect(response.body.data[1].serviceId.toString()).toBe(
            service._id.toString()
        );
    });

    test("should update an availability slot successfully", async () => {
        // Verify that an authorized admin can update an existing slot.
        const createResponse = await request(app)
            .post("/api/admin/availability")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                serviceId: service._id,
                professionalId: professional._id,
                date: "2026-10-10",
                startTime: "08:00",
                endTime: "09:00",
                capacity: 3
            });

        expect(createResponse.statusCode).toBe(201);

        const slotId = createResponse.body.data._id;

        const response = await request(app)
            .put(`/api/admin/availability/${slotId}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                date: "2026-10-11",
                startTime: "09:00",
                endTime: "10:00",
                capacity: 5
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe(
            "Availability slot updated successfully"
        );

        expect(response.body.data.date).toBe(
            "2026-10-11T00:00:00.000Z"
        );
        expect(response.body.data.startTime).toBe("09:00");
        expect(response.body.data.endTime).toBe("10:00");
        expect(response.body.data.capacity).toBe(5);
    });

    test("should update an availability slot status successfully", async () => {
        // Verify that an authorized admin can pause an availability slot.
        const createResponse = await request(app)
            .post("/api/admin/availability")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                serviceId: service._id,
                professionalId: professional._id,
                date: "2026-10-10",
                startTime: "08:00",
                endTime: "09:00",
                capacity: 3
            });

        expect(createResponse.statusCode).toBe(201);

        const slotId = createResponse.body.data._id;

        const response = await request(app)
            .patch(`/api/admin/availability/${slotId}/status`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                status: "paused"
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe(
            "Availability slot status updated successfully"
        );
        expect(response.body.data.status).toBe("paused");
    });

    test("should reject an invalid service ID when fetching slots", async () => {
        // Verify that an authorized request with a malformed service ID receives a validation error.
        const response = await request(app)
            .get("/api/admin/availability/service/invalid-service-id")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Invalid service ID");
    });

    test("should return 404 when the service does not exist", async () => {
        // Verify that a valid but nonexistent service ID returns a not-found response.
        const nonExistentServiceId = new mongoose.Types.ObjectId();

        const response = await request(app)
            .get(
                `/api/admin/availability/service/${nonExistentServiceId}`
            )
            .set("Authorization", `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Service not found");
    });

    test("should reject slot creation when required fields are missing", async () => {
        // Verify that the API rejects a slot request missing required fields.
        const response = await request(app)
            .post("/api/admin/availability")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                serviceId: service._id,
                date: "2026-10-10"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe(
            "Service,professional, date, start time, end time and capacity are required"
        );
    });
});