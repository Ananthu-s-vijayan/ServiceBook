const AvailabilitySlot = require("../models/AvailabilitySlot");
const Service = require("../models/Service");
const Professional = require("../models/Professional");
const ProfessionalAvailabilityException = require("../models/ProfessionalAvailabilityException");
const Booking = require("../models/Booking");
const mongoose = require("mongoose");


// Converts an HH:00 time into minutes after midnight.
const timeToMinutes = (time) => {
    const match = /^([01]\d|2[0-3]):00$/.exec(time);

    if (!match) {
        return null;
    }

    const [hours, minutes] = time.split(":").map(Number);

    return hours * 60 + minutes;
};

// Checks whether two intervals overlap.
// Touching endpoints are allowed: 09:00-10:00 and 10:00-11:00 do not overlap.
const intervalsOverlap = (startA, endA, startB, endB) => {
    return startA < endB && startB < endA;
};

// Converts a date and HH:00 time into a UTC timestamp.
// The current API treats YYYY-MM-DD dates as UTC calendar dates.
const dateTimeToUtc = (date, time) => {
    const [year, month, day] = date.split("-").map(Number);
    const [hours, minutes] = time.split(":").map(Number);

    return new Date(Date.UTC(
        year,
        month - 1,
        day,
        hours,
        minutes
    ));
};

// Create an availability slot for an hourly or full-day service.
const createAvailabilitySlot = async ({
    serviceId,
    professionalId,
    date,
    startTime,
    endTime,
    slotType,
    capacity
}) => {
    if (
        !serviceId ||
        !professionalId ||
        !date ||
        !startTime ||
        !endTime ||
        capacity === undefined
    ) {
        const error = new Error(
            "Service,professional, date, start time, end time and capacity are required"
        );
        error.statusCode = 400;
        throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        const error = new Error("Invalid service ID");
        error.statusCode = 400;
        throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(professionalId)){
        const error = new Error("Invalid professional ID");
        error.statusCode=400;
        throw error;
    }

    

    const service = await Service.findById(serviceId);

    if (!service) {
        const error = new Error("Service not found");
        error.statusCode = 404;
        throw error;
    }

    const professional = await Professional.findOne({
        _id:professionalId,
        serviceId,
        isActive:true
    });

    if(!professional){
        const error = new Error(
            "Active professional not found for this service"
        );
        error.statusCode=400;
        throw error;
    }

    // Default existing requests to hourly slots for compatibility.
    const resolvedSlotType = slotType || "hourly";

    if (!["hourly", "full_day"].includes(resolvedSlotType)) {
        const error = new Error("Invalid slot type");
        error.statusCode = 400;
        throw error;
    }

    // A slot's type must match its service's booking type.
    if (resolvedSlotType !== service.durationType) {
        const error = new Error(
            "Slot type must match the service duration type"
        );
        error.statusCode = 400;
        throw error;
    }

    return await AvailabilitySlot.create({
        serviceId,
        professionalId,
        date,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        slotType: resolvedSlotType,
        capacity
    });
};

// Fetch all availability slots for a service.
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
        serviceId,
        slotType: service.durationType
    })
    .populate("professionalId", "name")
    .sort({
        date: 1,
        startTime: 1
    });
};

// Update an existing availability slot.
const updateAvailabilitySlot = async (
    slotId,
    {
        date,
        startTime,
        endTime,
        slotType,
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

    const service = await Service.findById(slot.serviceId);

    if (!service) {
        const error = new Error("Service not found");
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

    if (slotType !== undefined) {
        slot.slotType = slotType;
    }

    if (slot.slotType !== service.durationType) {
        const error = new Error(
            "Slot type must match the service duration type"
        );
        error.statusCode = 400;
        throw error;
    }

    if (capacity !== undefined) {
        slot.capacity = capacity;
    }

    return await slot.save();
};

// Change the availability status of a slot.
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

// Fetch available slots for a service on the selected date.
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
        new Date(`${date}T00:00:00.000Z`)
            .toISOString()
            .slice(0, 10) !== date
    ) {
        const error = new Error(
            "Invalid date. Use YYYY-MM-DD format"
        );
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

    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const startOfNextDay = new Date(startOfDay);
    startOfNextDay.setUTCDate(
        startOfNextDay.getUTCDate() + 1
    );

    const slots = await AvailabilitySlot.find({
        serviceId,
        slotType: service.durationType,
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

// Calculates dynamic start times for a customer-selected hourly duration.
// This does not create or modify AvailabilitySlot records.
const getDynamicHourlyAvailability = async (
    serviceId,
    date,
    durationHours
) => {
    if (!serviceId || !date || durationHours === undefined) {
        const error = new Error(
            "Service ID, date, and duration are required"
        );
        error.statusCode = 400;
        throw error;
    }

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        const error = new Error("Invalid service ID");
        error.statusCode = 400;
        throw error;
    }

    // Validate the calendar date without allowing invalid dates to normalize.
    if (
        typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
        const error = new Error("Invalid date. Use YYYY-MM-DD format");
        error.statusCode = 400;
        throw error;
    }

    const parsedDate = new Date(`${date}T00:00:00.000Z`);

    if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== date
    ) {
        const error = new Error("Invalid calendar date");
        error.statusCode = 400;
        throw error;
    }

    if (
        !Number.isInteger(durationHours) ||
        durationHours < 1
    ) {
        const error = new Error(
            "Duration must be a positive whole number of hours"
        );
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

    if (service.durationType !== "hourly") {
        const error = new Error(
            "Dynamic duration availability is only supported for hourly services"
        );
        error.statusCode = 400;
        throw error;
    }

    if (
        typeof service.pricePerHour !== "number" ||
        service.pricePerHour < 0
    ) {
        const error = new Error(
            "The service does not have a valid hourly price"
        );
        error.statusCode = 400;
        throw error;
    }

    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const startOfNextDay = new Date(startOfDay);
    startOfNextDay.setUTCDate(startOfNextDay.getUTCDate() + 1);

    const dayOfWeek = startOfDay.getUTCDay();

    const professionals = await Professional.find({
        serviceId,
        isActive: true
    }).lean();

    if (professionals.length === 0) {
        return [];
    }

    const professionalIds = professionals.map(
        (professional) => professional._id
    );

    const [exceptions, existingBookings, legacySlots] = await Promise.all([
        ProfessionalAvailabilityException.find({
            professionalId: { $in: professionalIds },
            date: {
                $gte: startOfDay,
                $lt: startOfNextDay
            },
            isActive: true
        }).lean(),

    Booking.find({
    bookingStatus: {
        $in: ["pending_payment", "confirmed", "in_progress"]
    },

    // Include bookings assigned directly to a professional and legacy
    // bookings whose professional assignment exists only on their slot.
    $or: [
        {
            assignedProfessionalId: {
                $in: professionalIds
            }
        },
        {
            assignedProfessionalId: null,
            availabilitySlotId: {
                $ne: null
            }
        }
    ],

    // Include scheduled bookings overlapping the date and legacy
    // slot-based bookings without scheduled timestamps.
    $and: [
        {
            $or: [
                {
                    scheduledStartAt: {
                        $lt: startOfNextDay
                    },
                    scheduledEndAt: {
                        $gt: startOfDay
                    }
                },
                {
                    scheduledStartAt: null,
                    availabilitySlotId: {
                        $ne: null
                    }
                }
            ]
        }
    ]
})
    .select(
        "assignedProfessionalId scheduledStartAt scheduledEndAt availabilitySlotId serviceId bookingStatus"
    )
    .populate({
        path: "availabilitySlotId",
        select: "date startTime endTime slotType professionalId"
    })
    .populate({
        path: "serviceId",
        select: "durationType estimatedDuration"
    })
    .lean(),

        // Legacy slots may represent occupied intervals even when their
        // associated booking predates scheduledStartAt/scheduledEndAt.
        AvailabilitySlot.find({
            professionalId: { $in: professionalIds },
            date: {
                $gte: startOfDay,
                $lt: startOfNextDay
            }
        }).lean()
    ]);

    const availableStarts = new Map();

    for (const professional of professionals) {
        const workingDay = (professional.workingSchedule || []).find(
            (entry) =>
                entry.dayOfWeek === dayOfWeek &&
                entry.isWorking !== false
        );

        if (!workingDay) {
            continue;
        }

        const workingStart = timeToMinutes(workingDay.startTime);
        const workingEnd = timeToMinutes(workingDay.endTime);

        if (
            workingStart === null ||
            workingEnd === null ||
            workingEnd <= workingStart
        ) {
            // Ignore malformed schedules rather than advertising invalid times.
            continue;
        }

        const professionalExceptions = exceptions.filter(
            (exception) =>
                String(exception.professionalId) ===
                String(professional._id)
        );

        if (
            professionalExceptions.some(
                (exception) => exception.exceptionType === "full_day"
            )
        ) {
            continue;
        }

        const breaks = (workingDay.breaks || [])
            .map((breakItem) => ({
                start: timeToMinutes(breakItem.startTime),
                end: timeToMinutes(breakItem.endTime)
            }))
            .filter(
                (breakItem) =>
                    breakItem.start !== null &&
                    breakItem.end !== null &&
                    breakItem.end > breakItem.start
            );

        const partialExceptions = professionalExceptions
            .filter((exception) => exception.exceptionType === "partial_day")
            .map((exception) => ({
                start: timeToMinutes(exception.startTime),
                end: timeToMinutes(exception.endTime)
            }))
            .filter(
                (exception) =>
                    exception.start !== null &&
                    exception.end !== null &&
                    exception.end > exception.start
            );

        const occupiedIntervals = [];

    for (const booking of existingBookings) {
    let bookingStart = null;
    let bookingEnd = null;
    let bookingProfessionalId = booking.assignedProfessionalId;

    // Legacy bookings may store the professional on the slot instead
    // of on the booking document.
    if (
        !bookingProfessionalId &&
        booking.availabilitySlotId
    ) {
        bookingProfessionalId =
            booking.availabilitySlotId.professionalId;
    }

    if (booking.scheduledStartAt && booking.scheduledEndAt) {
        bookingStart = new Date(booking.scheduledStartAt);
        bookingEnd = new Date(booking.scheduledEndAt);
    } else if (booking.availabilitySlotId) {
        const slot = booking.availabilitySlotId;

                // Legacy slot bookings may not have an assigned professional
                // stored on the booking itself. Use the slot's professional.
                bookingProfessionalId =
                    bookingProfessionalId || slot.professionalId;

                if (
                    !slot.date ||
                    new Date(slot.date) < startOfDay ||
                    new Date(slot.date) >= startOfNextDay
                ) {
                    continue;
                }

                const legacyStart = timeToMinutes(slot.startTime);

                if (legacyStart === null) {
                    continue;
                }

                let legacyDuration = booking.serviceId?.estimatedDuration;

                if (
                    booking.serviceId?.durationType === "full_day" ||
                    slot.slotType === "full_day"
                ) {
                    bookingStart = startOfDay;
                    bookingEnd = startOfNextDay;
                } else {
                    if (
                        typeof legacyDuration !== "number" ||
                        legacyDuration <= 0
                    ) {
                        // If duration cannot be reconstructed safely,
                        // conservatively block the legacy slot interval.
                        const legacyEnd = timeToMinutes(slot.endTime);

                        if (legacyEnd === null || legacyEnd <= legacyStart) {
                            continue;
                        }

                        legacyDuration = (legacyEnd - legacyStart) / 60;
                    }

                    bookingStart = dateTimeToUtc(
                        date,
                        slot.startTime
                    );
                    bookingEnd = new Date(
                        bookingStart.getTime() +
                        legacyDuration * 60 * 60 * 1000
                    );
                }
            } else {
                continue;
            }

            if (
                String(bookingProfessionalId) !== String(professional._id) ||
                !bookingStart ||
                !bookingEnd ||
                Number.isNaN(bookingStart.getTime()) ||
                Number.isNaN(bookingEnd.getTime())
            ) {
                continue;
            }

            // Only intervals intersecting this calendar day matter here.
            if (
                bookingStart < startOfNextDay &&
                bookingEnd > startOfDay
            ) {
                const startMinute = Math.max(
                    0,
                    (bookingStart.getTime() - startOfDay.getTime()) / 60000
                );

                const endMinute = Math.min(
                    1440,
                    (bookingEnd.getTime() - startOfDay.getTime()) / 60000
                );

                occupiedIntervals.push({
                    start: startMinute,
                    end: endMinute
                });
            }
        }

        // A legacy slot that is paused, full, or has exhausted capacity
        // must not be offered as an available start time.
        const blockedLegacySlots = legacySlots
            .filter(
                (slot) =>
                    String(slot.professionalId) === String(professional._id) &&
                    slot.slotType === "hourly" &&
                    (
                        slot.status !== "available" ||
                        slot.bookedCount >= slot.capacity
                    )
            )
            .map((slot) => ({
                start: timeToMinutes(slot.startTime),
                end: timeToMinutes(slot.endTime)
            }))
            .filter(
                (slot) =>
                    slot.start !== null &&
                    slot.end !== null &&
                    slot.end > slot.start
            );

        for (
            let candidateStart = workingStart;
            candidateStart + durationHours * 60 <= workingEnd;
            candidateStart += 60
        ) {
            const candidateEnd = candidateStart + durationHours * 60;

            const overlapsBreak = breaks.some((breakItem) =>
                intervalsOverlap(
                    candidateStart,
                    candidateEnd,
                    breakItem.start,
                    breakItem.end
                )
            );

            const overlapsException = partialExceptions.some((exception) =>
                intervalsOverlap(
                    candidateStart,
                    candidateEnd,
                    exception.start,
                    exception.end
                )
            );

            const overlapsBooking = occupiedIntervals.some((interval) =>
                intervalsOverlap(
                    candidateStart,
                    candidateEnd,
                    interval.start,
                    interval.end
                )
            );

            const overlapsBlockedLegacySlot = blockedLegacySlots.some((slot) =>
                intervalsOverlap(
                    candidateStart,
                    candidateEnd,
                    slot.start,
                    slot.end
                )
            );

            if (
                overlapsBreak ||
                overlapsException ||
                overlapsBooking ||
                overlapsBlockedLegacySlot
            ) {
                continue;
            }

            const startTime =
                `${String(Math.floor(candidateStart / 60)).padStart(2, "0")}:00`;

            const endTime =
                `${String(Math.floor(candidateEnd / 60)).padStart(2, "0")}:00`;

            const key = `${startTime}-${endTime}`;

            if (!availableStarts.has(key)) {
                availableStarts.set(key, {
                    startTime,
                    endTime
                });
            }
        }
    }

    return Array.from(availableStarts.values()).sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
    );
};

module.exports = {
    createAvailabilitySlot,
    getServiceSlots,
    updateAvailabilitySlot,
    updateAvailabilitySlotStatus,
    getAvailableSlotsForCustomer,
    getDynamicHourlyAvailability
};