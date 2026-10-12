const express = require("express");

const {
    getAvailableSlots
} = require("../../controllers/user/availabilityController");

const router = express.Router();

// Fetch bookable slots for a service and date.
router.get("/", getAvailableSlots);

module.exports = router;