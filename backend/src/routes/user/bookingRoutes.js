const express = require("express");
const bookingController = require("../../controllers/user/bookingController");

const router = express.Router();

// Create a booking for the authenticated customer.
router.post("/", bookingController.createBooking);

module.exports = router;