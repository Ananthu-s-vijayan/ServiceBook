const bookingService = require("../../services/bookingService");

const createBooking = async (req, res) => {
    try {
        const {
            serviceId,
            addressId,
            availabilitySlotId,
            date,
            startTime,
            requestedDurationHours,
            entryInstructions
        } = req.body;

        let booking;

        if (availabilitySlotId) {
            // Keep the existing slot-based path for legacy and full-day bookings.
            booking = await bookingService.createBooking({
                userId: req.user.userId,
                serviceId,
                addressId,
                availabilitySlotId,
                entryInstructions
            });
        } else {
            // New hourly bookings use dynamically calculated availability.
            booking = await bookingService.createDynamicHourlyBooking({
                userId: req.user.userId,
                serviceId,
                addressId,
                date,
                startTime,
                requestedDurationHours,
                entryInstructions
            });
        }

        return res.status(201).json({
            success: true,
            message: "Booking created successfully",
            data: booking
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to create booking"
        });
    }
};

module.exports = {
    createBooking
};