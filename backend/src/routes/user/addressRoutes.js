const express = require("express");

const {
    createAddress,
    getAddresses,
    updateAddress,
    deleteAddress
} = require("../../controllers/user/addressController");

const router = express.Router();

// Create a new address.
router.post("/", createAddress);

// Get all addresses belonging to the logged-in user.
router.get("/", getAddresses);

// Update an existing address.
router.put("/:id", updateAddress);

// Delete an existing address.
router.delete("/:id", deleteAddress);

module.exports = router;