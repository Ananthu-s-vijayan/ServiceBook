const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const app = require("../src/app");
const Address = require("../src/models/Address");

describe("Address API", () => {
let userId;
let anotherUserId;
let authToken;
let anotherUserToken;


// Prepare two authenticated users for ownership and isolation tests.
beforeEach(() => {
    userId = new mongoose.Types.ObjectId();
    anotherUserId = new mongoose.Types.ObjectId();

    authToken = jwt.sign(
        { userId: userId.toString(), role: "user" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    anotherUserToken = jwt.sign(
        { userId: anotherUserId.toString(), role: "user" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
});

// Remove address records created by these tests after each test.
afterEach(async () => {
    await Address.deleteMany({
        userId: { $in: [userId, anotherUserId] }
    });
});

const validAddress = {
    label: "Home",
    houseFlat: "House 12",
    roadArea: "Main Road",
    landmark: "Near the library",
    city: "Varkala",
    pincode: "695141",
    isDefault: false
};

test("should reject requests without an authentication token", async () => {
    // Verify that address endpoints cannot be accessed without authentication.
    const response = await request(app)
        .get("/api/user/addresses");

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
        "Authentication token is required"
    );
});

test("should create an address successfully", async () => {
    // Verify that an authenticated user can create an address linked to their account.
    const response = await request(app)
        .post("/api/user/addresses")
        .set("Authorization", `Bearer ${authToken}`)
        .send(validAddress);

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Address created successfully");
    expect(response.body.data.userId.toString()).toBe(userId.toString());
    expect(response.body.data.label).toBe("Home");
    expect(response.body.data.houseFlat).toBe("House 12");
    expect(response.body.data.city).toBe("Varkala");
});

test("should reject an address with missing required fields", async () => {
    // Verify that the API rejects address data missing required fields.
    const response = await request(app)
        .post("/api/user/addresses")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
            label: "Home",
            houseFlat: "House 12"
        });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
        "Please fill all required address fields"
    );
});

test("should reject an invalid address label", async () => {
    // Verify that only Home, Office, and Other are accepted address labels.
    const response = await request(app)
        .post("/api/user/addresses")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
            ...validAddress,
            label: "School"
        });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid address label");
});

test("should return only the authenticated user's addresses", async () => {
    // Verify that one user cannot retrieve another user's address records.
    await Address.create({
        ...validAddress,
        userId,
        isDefault: true
    });

    await Address.create({
        ...validAddress,
        userId: anotherUserId,
        label: "Office"
    });

    const response = await request(app)
        .get("/api/user/addresses")
        .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].userId.toString()).toBe(
        userId.toString()
    );
});

test("should update an address owned by the authenticated user", async () => {
    // Verify that a user can update their own address.
    const address = await Address.create({
        ...validAddress,
        userId
    });

    const response = await request(app)
        .put(`/api/user/addresses/${address._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
            city: "Kollam",
            houseFlat: "House 25"
        });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Address updated successfully");
    expect(response.body.data.city).toBe("Kollam");
    expect(response.body.data.houseFlat).toBe("House 25");
});

test("should prevent a user from updating another user's address", async () => {
    // Verify that address ownership is enforced during updates.
    const address = await Address.create({
        ...validAddress,
        userId: anotherUserId
    });

    const response = await request(app)
        .put(`/api/user/addresses/${address._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
            city: "Kollam"
        });

    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Address not found");
});

test("should delete an address owned by the authenticated user", async () => {
    // Verify that a user can delete their own address.
    const address = await Address.create({
        ...validAddress,
        userId
    });

    const response = await request(app)
        .delete(`/api/user/addresses/${address._id}`)
        .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Address deleted successfully");

    const deletedAddress = await Address.findById(address._id);
    expect(deletedAddress).toBeNull();
});

test("should prevent a user from deleting another user's address", async () => {
    // Verify that address ownership is enforced during deletion.
    const address = await Address.create({
        ...validAddress,
        userId: anotherUserId
    });

    const response = await request(app)
        .delete(`/api/user/addresses/${address._id}`)
        .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Address not found");

    const existingAddress = await Address.findById(address._id);
    expect(existingAddress).not.toBeNull();
});

test("should allow only one default address per user", async () => {
    // Verify that marking a second address as default clears the previous default.
    const firstAddress = await Address.create({
        ...validAddress,
        userId,
        isDefault: true
    });

    const secondAddress = await Address.create({
        ...validAddress,
        userId,
        label: "Office",
        houseFlat: "Office 3",
        isDefault: false
    });

    const response = await request(app)
        .put(`/api/user/addresses/${secondAddress._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
            isDefault: true
        });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.isDefault).toBe(true);

    const updatedFirstAddress = await Address.findById(firstAddress._id);
    const updatedSecondAddress = await Address.findById(secondAddress._id);

    expect(updatedFirstAddress.isDefault).toBe(false);
    expect(updatedSecondAddress.isDefault).toBe(true);
});


});
