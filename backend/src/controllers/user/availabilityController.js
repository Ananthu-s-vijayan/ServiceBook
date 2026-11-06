const availabilityService = require("../../services/availabilityService");

// Fetches available times for either legacy slots or dynamic hourly bookings.
const getAvailableSlots = async (req, res) => {
try {
const { serviceId, date, durationHours } = req.query;


    let slots;

    if (durationHours !== undefined) {
        // Dynamic availability requires a positive whole-hour duration.
        if (!/^[1-9]\d*$/.test(durationHours)) {
            const error = new Error(
                "Duration must be a positive whole number of hours"
            );
            error.statusCode = 400;
            throw error;
        }

        slots = await availabilityService.getDynamicHourlyAvailability(
            serviceId,
            date,
            Number(durationHours)
        );

        return res.status(200).json({
            success: true,
            message: "Available start times fetched successfully",
            data: slots
        });
    }

    // Preserve the existing response and behavior for legacy callers.
    slots = await availabilityService.getAvailableSlotsForCustomer(
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
        message: error.message || "Failed to fetch availability"
    });
}


};

module.exports = {
getAvailableSlots
};
