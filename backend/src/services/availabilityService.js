const AvailabilitySlot = require("../models/AvailabilitySlot");
const Service = require("../models/Service");
const mongoose = require("mongoose");

const createAvailabilitySlot = async ({
    serviceId,
    date,
    startTime,
    endTime,
    capacity
}) => {
    if (
        !serviceId ||
        !date ||
        !startTime ||
        !endTime ||
        capacity === undefined
    ) {
        const error = new Error(
            "Service, date, start time, end time and capacity are required"
        );

        error.statusCode = 400;
        throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        const error = new Error("Invalid service ID");

        error.statusCode = 400;
        throw error;
    }

    const service = await Service.findById(serviceId);

    if (!service) {
        const error = new Error("Service not found");

        error.statusCode = 404;
        throw error;
    }

    return await AvailabilitySlot.create({
        serviceId,
        date,
        startTime,
        endTime,
        capacity
    });
};


const getServiceSlots = async (serviceId) => {
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        const error = new Error("Invalid service ID");

        error.statusCode = 400;
        throw error;
    }

    const service = await Service.findById(serviceId);

    if (!service) {
        const error = new Error("Service not found");

        error.statusCode = 404;
        throw error;
    }

    return await AvailabilitySlot.find({
        serviceId
    }).sort({
        date: 1,
        startTime: 1
    });
};


const updateAvailabilitySlot = async (
    slotId,
    {
        date,
        startTime,
        endTime,
        capacity
    }
) => {
    if (!mongoose.Types.ObjectId.isValid(slotId)) {
        const error = new Error("Invalid slot ID");

        error.statusCode = 400;
        throw error;
    }

    const slot = await AvailabilitySlot.findById(slotId);

    if (!slot) {
        const error = new Error("Availability slot not found");

        error.statusCode = 404;
        throw error;
    }

    if (date !== undefined) {
        slot.date = date;
    }

    if (startTime !== undefined) {
        slot.startTime = startTime.trim();
    }

    if (endTime !== undefined) {
        slot.endTime = endTime.trim();
    }

    if (capacity !== undefined) {
        slot.capacity = capacity;
    }

    return await slot.save();
};


const updateAvailabilitySlotStatus = async (
    slotId,
    status
) => {
    if (!mongoose.Types.ObjectId.isValid(slotId)) {
        const error = new Error("Invalid slot ID");

        error.statusCode = 400;
        throw error;
    }

    if (!["available", "paused", "full"].includes(status)) {
        const error = new Error("Invalid slot status");

        error.statusCode = 400;
        throw error;
    }

    const slot = await AvailabilitySlot.findByIdAndUpdate(
        slotId,
        { status },
        {
            returnDocument: "after",
            runValidators: true
        }
    );

    if (!slot) {
        const error = new Error("Availability slot not found");

        error.statusCode = 404;
        throw error;
    }

    return slot;
};

// Returns available slots for a service on a selected date.
const getAvailableSlotsForCustomer = async (serviceId, date) => {
    if (!serviceId || !date) {
        const error = new Error("Service ID and date are required");
        error.statusCode = 400;
        throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        const error = new Error("Invalid service ID");
        error.statusCode = 400;
        throw error;
    }

    // Validate the date strictly in YYYY-MM-DD format.
    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        new Date(`${date}T00:00:00.000Z`).toISOString().slice(0, 10) !== date
    ) {
        const error = new Error("Invalid date. Use YYYY-MM-DD format");
        error.statusCode = 400;
        throw error;
    }

    const service = await Service.findOne({
        _id: serviceId,
        isActive: true
    });

    if (!service) {
        const error = new Error("Active service not found");
        error.statusCode = 404;
        throw error;
    }

    // Use a UTC date range so the query matches the requested calendar date.
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const startOfNextDay = new Date(startOfDay);
    startOfNextDay.setUTCDate(startOfNextDay.getUTCDate() + 1);

    const slots = await AvailabilitySlot.find({
        serviceId,
        date: {
            $gte: startOfDay,
            $lt: startOfNextDay
        },
        status: "available",
        $expr: {
            $lt: ["$bookedCount", "$capacity"]
        }
    }).sort({
        startTime: 1
    });

    return slots;
};


module.exports = {
    createAvailabilitySlot,
    getServiceSlots,
    updateAvailabilitySlot,
    updateAvailabilitySlotStatus,
    getAvailableSlotsForCustomer
};