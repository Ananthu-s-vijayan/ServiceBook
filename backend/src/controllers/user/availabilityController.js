const availabilityService = require("../../services/availabilityService");

// Fetches bookable slots for a service on a selected date.
const getAvailableSlots = async (req, res) => {
    try {
        const { serviceId, date } = req.query;

        const slots = await availabilityService.getAvailableSlotsForCustomer(
            serviceId,
            date
        );

        return res.status(200).json({
            success: true,
            message: "Available slots fetched successfully",
            data: slots
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch available slots"
        });
    }
};

module.exports = {
    getAvailableSlots
};