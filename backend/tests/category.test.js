const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = require("../src/app");
const User = require("../src/models/User");

describe("Category API", () => {
    let categoryId;
    let adminToken;

    // Prepare a verified admin account and JWT for protected API tests.
    beforeAll(async () => {
        const passwordHash = await bcrypt.hash("AdminTest@123", 10);

        const admin = await User.create({
            fullName: "Category Test Admin",
            email: "category-admin@example.com",
            passwordHash,
            role: "admin",
            isVerified: true,
            status: "active",
            referralCode: `TEST-ADMIN-${Date.now()}`
        });

        adminToken = jwt.sign(
            {
                userId: admin._id,
                role: admin.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
    });

    // Attach the admin JWT to each protected request.
    const adminRequest = () => ({
        set: (req) =>
            req.set("Authorization", `Bearer ${adminToken}`)
    });

    test("should create a category successfully", async () => {
        const response = await adminRequest()
            .set(
                request(app).post("/api/admin/categories")
            )
            .send({
                name: "Plumbing",
                icon: "plumbing",
                description: "Plumbing services"
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe(
            "Category created successfully"
        );

        expect(response.body.data.name).toBe("Plumbing");
        expect(response.body.data.icon).toBe("plumbing");
        expect(response.body.data.description).toBe(
            "Plumbing services"
        );
        expect(response.body.data.isActive).toBe(true);

        categoryId = response.body.data._id;
    });

    test("should reject a duplicate category", async () => {
        const response = await adminRequest()
            .set(
                request(app).post("/api/admin/categories")
            )
            .send({
                name: "Plumbing",
                icon: "plumbing",
                description: "Plumbing services"
            });

        expect(response.statusCode).toBe(409);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe(
            "Category already exists"
        );
    });

    test("should reject category without a name", async () => {
        const response = await adminRequest()
            .set(
                request(app).post("/api/admin/categories")
            )
            .send({
                icon: "electrical",
                description: "Electrical services"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe(
            "Category name is required"
        );
    });

    test("should update a category successfully", async () => {
        const response = await adminRequest()
            .set(
                request(app).put(
                    `/api/admin/categories/${categoryId}`
                )
            )
            .send({
                name: "Plumbing Services",
                icon: "plumbing",
                description: "Home plumbing services"
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe(
            "Category updated successfully"
        );

        expect(response.body.data.name).toBe(
            "Plumbing Services"
        );
    });

    test("should update category status successfully", async () => {
        const response = await adminRequest()
            .set(
                request(app).patch(
                    `/api/admin/categories/${categoryId}/status`
                )
            )
            .send({
                isActive: false
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe(
            "Category status updated successfully"
        );

        expect(response.body.data.isActive).toBe(false);
    });

    test("should fetch active categories", async () => {
        const response = await request(app)
            .get("/api/categories");

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe(
            "Categories fetched successfully"
        );

        expect(Array.isArray(response.body.data)).toBe(true);

        expect(
            response.body.data.every(
                (category) => category.isActive === true
            )
        ).toBe(true);
    });

    test("should fetch a category by ID", async () => {
        const response = await request(app)
            .get(`/api/categories/${categoryId}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe(
            "Category fetched successfully"
        );

        expect(response.body.data._id).toBe(categoryId);
        expect(response.body.data.name).toBe(
            "Plumbing Services"
        );
    });
});