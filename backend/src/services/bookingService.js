const mongoose = require("mongoose");
const crypto = require("crypto");

const Booking = require("../models/Booking");
const Service = require("../models/Service");
const Address = require("../models/Address");
const AvailabilitySlot = require("../models/AvailabilitySlot");
const Professional = require("../models/Professional");
const ProfessionalAvailabilityException = require(
    "../models/ProfessionalAvailabilityException"
);

// Convert HH:mm into minutes after midnight.
// This allows us to compare time intervals when checking overlapping bookings.
const timeToMinutes = (time) => {
    if (typeof time !== "string" || !/^\d{2}:\d{2}$/.test(time)) {
        return null;
    }

    const [hours, minutes] = time.split(":").map(Number);

    if (hours > 23 || minutes > 59) {
        return null;
    }

    return hours * 60 + minutes;
};

// Create a unique booking reference.
// The database's unique index on bookingNumber remains the final safeguard.
const generateBookingNumber = () => {
    const randomPart = crypto.randomBytes(5).toString("hex").toUpperCase();

    return `SB-${Date.now()}-${randomPart}`;
};

// Calculate the service amount using the service's stored pricing details.
// The customer must not be allowed to determine the price through the request body.
const calculateServiceAmount = (service) => {
    if (service.durationType === "hourly") {
        if (
            typeof service.pricePerHour !== "number" ||
            !Number.isFinite(service.pricePerHour) ||
            service.pricePerHour < 0
        ) {
            const error = new Error("The service hourly price is invalid.");
            error.statusCode = 400;
            throw error;
        }

        if (
            typeof service.estimatedDuration !== "number" ||
            !Number.isFinite(service.estimatedDuration) ||
            service.estimatedDuration <= 0
        ) {
            const error = new Error("The service duration is invalid.");
            error.statusCode = 400;
            throw error;
        }

        return service.pricePerHour * service.estimatedDuration;
    }

    if (service.durationType === "full_day") {
        if (
            typeof service.pricePerDay !== "number" ||
            !Number.isFinite(service.pricePerDay) ||
            service.pricePerDay < 0
        ) {
            const error = new Error("The service daily price is invalid.");
            error.statusCode = 400;
            throw error;
        }

        return service.pricePerDay;
    }

    const error = new Error("The service pricing duration is not supported.");
    error.statusCode = 400;
    throw error;
};

// Calculates the price using the duration selected by the customer.
// The hourly rate always comes from the database, never the request body.
const calculateDynamicHourlyAmount = (service, durationHours) => {
    if (
        typeof service.pricePerHour !== "number" ||
        !Number.isFinite(service.pricePerHour) ||
        service.pricePerHour < 0
    ) {
        const error = new Error("The service hourly price is invalid.");
        error.statusCode = 400;
        throw error;
    }

    return service.pricePerHour * durationHours;
};

// Check whether two time intervals overlap.
// For example, 09:00–11:00 conflicts with 10:00–12:00.
const intervalsOverlap = (startA, endA, startB, endB) => {
    return startA < endB && startB < endA;
};

// Validates a calendar date without accepting normalized invalid dates.
const isValidCalendarDate = (date) => {
    if (
        typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
        return false;
    }

    const parsed = new Date(`${date}T00:00:00.000Z`);

    return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === date
    );
};

// Converts a date and HH:00 time into a UTC timestamp.
const makeUtcDateTime = (date, time) => {
    const [year, month, day] = date.split("-").map(Number);
    const [hours, minutes] = time.split(":").map(Number);

    return new Date(
        Date.UTC(year, month - 1, day, hours, minutes)
    );
};

// Converts an interval on a UTC calendar day to minute offsets.
const getDayInterval = (startAt, endAt, dayStart, dayEnd) => {
    const clippedStart = Math.max(
        startAt.getTime(),
        dayStart.getTime()
    );

    const clippedEnd = Math.min(
        endAt.getTime(),
        dayEnd.getTime()
    );

    if (clippedStart >= clippedEnd) {
        return null;
    }

    return {
        start: (clippedStart - dayStart.getTime()) / 60000,
        end: (clippedEnd - dayStart.getTime()) / 60000
    };
};

const createBooking = async ({
    userId,
    serviceId,
    addressId,
    availabilitySlotId,
    entryInstructions
}) => {
    // 1. Validate the authenticated customer's ID.
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        const error = new Error("Invalid authenticated user.");
        error.statusCode = 401;
        throw error;
    }

    // 2. Validate the IDs supplied in the booking request.
    const suppliedIds = { serviceId, addressId, availabilitySlotId };

    for (const [field, value] of Object.entries(suppliedIds)) {
        if (!value || !mongoose.Types.ObjectId.isValid(value)) {
            const error = new Error(`Invalid ${field}.`);
            error.statusCode = 400;
            throw error;
        }
    }

    // 3. Validate optional entry instructions.
    if (
        entryInstructions !== undefined &&
        entryInstructions !== null &&
        typeof entryInstructions !== "string"
    ) {
        const error = new Error("Entry instructions must be text.");
        error.statusCode = 400;
        throw error;
    }

    const instructions = entryInstructions?.trim() || null;

    // Keep the reservation and booking creation in one transaction.
    // If booking creation fails, the slot reservation is rolled back.
    const session = await mongoose.startSession();

    let createdBooking;

    try {
        await session.withTransaction(async () => {
            // 4. Find the requested active service.
            const service = await Service.findOne({
                _id: serviceId,
                isActive: true
            }).session(session);

            if (!service) {
                const error = new Error("Service not found or inactive.");
                error.statusCode = 404;
                throw error;
            }

            // 5. Ensure the address belongs to this authenticated customer.
            const address = await Address.findOne({
                _id: addressId,
                userId
            }).session(session);

            if (!address) {
                const error = new Error(
                    "Address not found or does not belong to this customer."
                );
                error.statusCode = 404;
                throw error;
            }

            // 6. Find the requested available slot for this service.
            const slot = await AvailabilitySlot.findOne({
                _id: availabilitySlotId,
                serviceId,
                status: "available",
                $expr: {
                    $lt: ["$bookedCount", "$capacity"]
                }
            }).session(session);

            if (!slot) {
                const error = new Error(
                    "This availability slot is unavailable or fully booked."
                );
                error.statusCode = 409;
                throw error;
            }

            // 7. Confirm that the slot's professional is active
            // and is assigned to the requested service.
            const professional = await Professional.findOne({
                _id: slot.professionalId,
                serviceId,
                isActive: true
            }).session(session);

            if (!professional) {
                const error = new Error(
                    "The professional assigned to this slot is unavailable."
                );
                error.statusCode = 409;
                throw error;
            }

            // 8. Confirm that the slot type matches the service.
            if (slot.slotType !== service.durationType) {
                const error = new Error(
                    "The availability slot does not match the service duration type."
                );
                error.statusCode = 400;
                throw error;
            }

            // 9. Validate the selected time interval.
            const slotStart = timeToMinutes(slot.startTime);
            const slotEnd = timeToMinutes(slot.endTime);

            if (
                slotStart === null ||
                slotEnd === null ||
                slotEnd <= slotStart
            ) {
                const error = new Error(
                    "The availability slot has an invalid time interval."
                );
                error.statusCode = 400;
                throw error;
            }

            // 10. Determine the professional's occupied interval.
            // Assumption for hourly services: estimatedDuration represents
            // the actual number of hours needed to perform the service.
            let requestedStart = slotStart;
            let requestedEnd = slotEnd;

            if (service.durationType === "hourly") {
                requestedEnd =
                    requestedStart + service.estimatedDuration * 60;

                // This implementation does not support a service extending
                // beyond midnight. Such a booking must be scheduled differently.
                if (requestedEnd > 24 * 60) {
                    const error = new Error(
                        "The service duration extends beyond the selected day."
                    );
                    error.statusCode = 400;
                    throw error;
                }

                // The estimated service duration must fit within the selected slot.
                if (requestedEnd > slotEnd) {
                    const error = new Error(
                        "The selected slot is too short for this service."
                    );
                    error.statusCode = 409;
                    throw error;
                }
            }

            // 11. Find other active bookings assigned to this professional.
            // Pending-payment bookings also count as occupied to prevent
            // another customer taking the same time while payment is pending.
            const existingBookings = await Booking.find({
                assignedProfessionalId: professional._id,
                bookingStatus: {
                    $in: ["pending_payment", "confirmed", "in_progress"]
                },
                availabilitySlotId: { $ne: slot._id }
            })
                .populate("availabilitySlotId")
                .session(session);

            for (const existingBooking of existingBookings) {
                const existingSlot = existingBooking.availabilitySlotId;

                if (!existingSlot || !existingSlot.date) {
                    continue;
                }

                // Compare calendar days using UTC because the existing
                // availability lookup uses UTC day boundaries.
                const requestedDay = new Date(slot.date)
                    .toISOString()
                    .slice(0, 10);

                const existingDay = new Date(existingSlot.date)
                    .toISOString()
                    .slice(0, 10);

                if (requestedDay !== existingDay) {
                    continue;
                }

                // A full-day service reserves the professional for the day.
                if (
                    service.durationType === "full_day" ||
                    existingSlot.slotType === "full_day"
                ) {
                    const error = new Error(
                        "The professional already has a booking on this day."
                    );
                    error.statusCode = 409;
                    throw error;
                }

                const existingStart = timeToMinutes(existingSlot.startTime);

                if (existingStart === null) {
                    const error = new Error(
                        "An existing booking has an invalid time interval."
                    );
                    error.statusCode = 500;
                    throw error;
                }

                // Use the existing service's estimated duration rather than
                // assuming every booking occupies its entire availability slot.
                const existingService = await Service.findById(
                    existingBooking.serviceId
                ).session(session);

                if (
                    !existingService ||
                    existingService.durationType !== "hourly" ||
                    typeof existingService.estimatedDuration !== "number" ||
                    existingService.estimatedDuration <= 0
                ) {
                    const error = new Error(
                        "Could not validate the duration of an existing booking."
                    );
                    error.statusCode = 500;
                    throw error;
                }

                const existingEnd =
                    existingStart + existingService.estimatedDuration * 60;

                if (
                    intervalsOverlap(
                        requestedStart,
                        requestedEnd,
                        existingStart,
                        existingEnd
                    )
                ) {
                    const error = new Error(
                        "The professional already has a booking during this time."
                    );
                    error.statusCode = 409;
                    throw error;
                }
            }

            // 12. Calculate the service amount from database values.
            const serviceAmount = calculateServiceAmount(service);

            // Taxes, coupons and wallet deductions are not implemented yet.
            const couponDiscount = 0;
            const walletAmount = 0;
            const taxAmount = 0;

            const totalAmount =
                serviceAmount - couponDiscount - walletAmount + taxAmount;

            // 13. Reserve one place in the selected slot atomically.
            // This prevents the slot's bookedCount from exceeding capacity.
            const reservedSlot = await AvailabilitySlot.findOneAndUpdate(
                {
                    _id: slot._id,
                    status: "available",
                    $expr: {
                        $lt: ["$bookedCount", "$capacity"]
                    }
                },
                {
                    $inc: { bookedCount: 1 }
                },
                {
                    new: true,
                    session
                }
            );

            if (!reservedSlot) {
                const error = new Error(
                    "This slot has just become unavailable. Please select another slot."
                );
                error.statusCode = 409;
                throw error;
            }

            // 14. Create the booking and preserve service/address snapshots.
            const [booking] = await Booking.create(
                [
                    {
                        bookingNumber: generateBookingNumber(),
                        userId,
                        serviceId: service._id,
                        availabilitySlotId: slot._id,
                        assignedProfessionalId: professional._id,
                        addressId: address._id,

                        serviceSnapshot: {
                            title: service.title,
                            pricingType: service.pricingType,
                            durationType: service.durationType,
                            pricePerHour: service.pricePerHour ?? null,
                            pricePerDay: service.pricePerDay ?? null,
                            estimatedDuration:
                                service.estimatedDuration ?? null
                        },

                        addressSnapshot: {
                            label: address.label,
                            houseFlat: address.houseFlat,
                            roadArea: address.roadArea,
                            landmark: address.landmark ?? null,
                            city: address.city,
                            pincode: address.pincode
                        },

                        entryInstructions: instructions,

                        serviceAmount,
                        couponDiscount,
                        walletAmount,
                        taxAmount,
                        totalAmount,

                        bookingStatus: "pending_payment",
                        paymentStatus: "pending"
                    }
                ],
                { session }
            );

            createdBooking = booking;
        });

        return createdBooking;
    } finally {
        await session.endSession();
    }
};

// Creates a new hourly booking without requiring a pre-created availability slot.
// Availability is revalidated inside a transaction before the booking is saved.
const createDynamicHourlyBooking = async ({
    userId,
    serviceId,
    addressId,
    date,
    startTime,
    requestedDurationHours,
    entryInstructions
}) => {
    // Validate IDs before starting a database transaction.
    for (const [field, value] of Object.entries({
        userId,
        serviceId,
        addressId
    })) {
        if (!value || !mongoose.Types.ObjectId.isValid(value)) {
            const error = new Error(`Invalid ${field}.`);
            error.statusCode = field === "userId" ? 401 : 400;
            throw error;
        }
    }

    if (!isValidCalendarDate(date)) {
        const error = new Error("Invalid date. Use YYYY-MM-DD format.");
        error.statusCode = 400;
        throw error;
    }

    if (
        typeof startTime !== "string" ||
        !/^([01]\d|2[0-3]):00$/.test(startTime)
    ) {
        const error = new Error("Start time must use the HH:00 format.");
        error.statusCode = 400;
        throw error;
    }

    if (
        !Number.isInteger(requestedDurationHours) ||
        requestedDurationHours < 1
    ) {
        const error = new Error(
            "Duration must be a positive whole number of hours."
        );
        error.statusCode = 400;
        throw error;
    }

    if (
        entryInstructions !== undefined &&
        entryInstructions !== null &&
        typeof entryInstructions !== "string"
    ) {
        const error = new Error("Entry instructions must be text.");
        error.statusCode = 400;
        throw error;
    }

    const instructions = entryInstructions?.trim() || null;
    const requestedStartMinutes = timeToMinutes(startTime);
    const requestedEndMinutes =
        requestedStartMinutes + requestedDurationHours * 60;

    if (requestedEndMinutes > 24 * 60) {
        const error = new Error(
            "The requested booking cannot extend beyond midnight."
        );
        error.statusCode = 400;
        throw error;
    }

    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const scheduledStartAt = makeUtcDateTime(date, startTime);
    const scheduledEndAt = new Date(
        scheduledStartAt.getTime() +
        requestedDurationHours * 60 * 60 * 1000
    );

    const session = await mongoose.startSession();
    let createdBooking;

    try {
        await session.withTransaction(async () => {
            const service = await Service.findOne({
                _id: serviceId,
                isActive: true,
                durationType: "hourly"
            }).session(session);

            if (!service) {
                const error = new Error(
                    "Active hourly service not found."
                );
                error.statusCode = 404;
                throw error;
            }

            const address = await Address.findOne({
                _id: addressId,
                userId
            }).session(session);

            if (!address) {
                const error = new Error(
                    "Address not found or does not belong to this customer."
                );
                error.statusCode = 404;
                throw error;
            }

            const workingDayNumber = dayStart.getUTCDay();

            const professionals = await Professional.find({
                serviceId: service._id,
                isActive: true,
                "workingSchedule.dayOfWeek": workingDayNumber
            })
                .sort({ _id: 1 })
                .session(session);

            if (professionals.length === 0) {
                const error = new Error(
                    "No active professional has a working schedule for this date."
                );
                error.statusCode = 409;
                throw error;
            }

            // Any active booking can occupy time, including a legacy booking
            // whose actual interval must be reconstructed from its old slot.
            const existingBookings = await Booking.find({
                bookingStatus: {
                    $in: ["pending_payment", "confirmed", "in_progress"]
                },
                $or: [
                    {
                        scheduledStartAt: { $lt: dayEnd },
                        scheduledEndAt: { $gt: dayStart }
                    },
                    {
                        scheduledStartAt: null,
                        availabilitySlotId: { $ne: null }
                    }
                ]
            })
                .populate("availabilitySlotId")
                .populate("serviceId")
                .session(session);

            const exceptions = await ProfessionalAvailabilityException.find({
                professionalId: {
                    $in: professionals.map((professional) => professional._id)
                },
                date: {
                    $gte: dayStart,
                    $lt: dayEnd
                },
                isActive: true
            }).session(session);

            let selectedProfessional = null;

            for (const candidate of professionals) {
                const workingDay = candidate.workingSchedule.find(
                    (entry) =>
                        entry.dayOfWeek === workingDayNumber &&
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
                    workingEnd <= workingStart ||
                    requestedStartMinutes < workingStart ||
                    requestedEndMinutes > workingEnd
                ) {
                    continue;
                }

                const candidateExceptions = exceptions.filter(
                    (exception) =>
                        String(exception.professionalId) ===
                        String(candidate._id)
                );

                if (
                    candidateExceptions.some(
                        (exception) => exception.exceptionType === "full_day"
                    )
                ) {
                    continue;
                }

                const breaks = (workingDay.breaks || []).concat(
                    candidateExceptions
                        .filter(
                            (exception) =>
                                exception.exceptionType === "partial_day"
                        )
                        .map((exception) => ({
                            startTime: exception.startTime,
                            endTime: exception.endTime
                        }))
                );

                const blockedByBreak = breaks.some((breakItem) => {
                    const breakStart = timeToMinutes(breakItem.startTime);
                    const breakEnd = timeToMinutes(breakItem.endTime);

                    return (
                        breakStart !== null &&
                        breakEnd !== null &&
                        breakEnd > breakStart &&
                        intervalsOverlap(
                            requestedStartMinutes,
                            requestedEndMinutes,
                            breakStart,
                            breakEnd
                        )
                    );
                });

                if (blockedByBreak) {
                    continue;
                }

                let blockedByBooking = false;

                for (const booking of existingBookings) {
                    let existingStartAt = booking.scheduledStartAt;
                    let existingEndAt = booking.scheduledEndAt;
                    let existingProfessionalId =
                        booking.assignedProfessionalId;

                    if (
                        !existingStartAt ||
                        !existingEndAt
                    ) {
                        const oldSlot = booking.availabilitySlotId;

                        if (!oldSlot || !oldSlot.date) {
                            continue;
                        }

                        existingProfessionalId =
                            existingProfessionalId || oldSlot.professionalId;

                        const oldDay = new Date(oldSlot.date)
                            .toISOString()
                            .slice(0, 10);

                        if (oldDay !== date) {
                            continue;
                        }

                        if (
                            oldSlot.slotType === "full_day" ||
                            booking.serviceId?.durationType === "full_day"
                        ) {
                            existingStartAt = dayStart;
                            existingEndAt = dayEnd;
                        } else {
                            const oldStart = timeToMinutes(oldSlot.startTime);
                            const oldDuration =
                                booking.serviceId?.estimatedDuration;

                            if (
                                oldStart === null ||
                                typeof oldDuration !== "number" ||
                                oldDuration <= 0
                            ) {
                                // Conservatively block the legacy slot interval
                                // if its actual occupied duration is unknown.
                                const oldEnd = timeToMinutes(oldSlot.endTime);

                                if (
                                    oldStart !== null &&
                                    oldEnd !== null &&
                                    intervalsOverlap(
                                        requestedStartMinutes,
                                        requestedEndMinutes,
                                        oldStart,
                                        oldEnd
                                    ) &&
                                    String(existingProfessionalId) ===
                                    String(candidate._id)
                                ) {
                                    blockedByBooking = true;
                                    break;
                                }

                                continue;
                            }

                            existingStartAt = makeUtcDateTime(
                                date,
                                oldSlot.startTime
                            );

                            existingEndAt = new Date(
                                existingStartAt.getTime() +
                                oldDuration * 60 * 60 * 1000
                            );
                        }
                    }

                    // A legacy booking may not have its professional assigned
                    // directly, so use the referenced slot's professional.
                    if (
                        String(existingProfessionalId) !==
                        String(candidate._id)
                    ) {
                        continue;
                    }

                    const existingInterval = getDayInterval(
                        new Date(existingStartAt),
                        new Date(existingEndAt),
                        dayStart,
                        dayEnd
                    );

                    if (
                        existingInterval &&
                        intervalsOverlap(
                            requestedStartMinutes,
                            requestedEndMinutes,
                            existingInterval.start,
                            existingInterval.end
                        )
                    ) {
                        blockedByBooking = true;
                        break;
                    }
                }

                if (blockedByBooking) {
                    continue;
                }

                // Write to the professional document inside the transaction.
                // Competing transactions for the same professional contend
                // on this document, rather than relying on a read-only check.
                const lockedProfessional = await Professional.findOneAndUpdate(
                    {
                        _id: candidate._id,
                        isActive: true
                    },
                    {
                        $inc: { bookingVersion: 1 }
                    },
                    {
                        new: true,
                        session
                    }
                );

                if (!lockedProfessional) {
                    continue;
                }

                selectedProfessional = lockedProfessional;
                break;
            }

            if (!selectedProfessional) {
                const error = new Error(
                    "The requested time is no longer available. Please choose another time."
                );
                error.statusCode = 409;
                throw error;
            }

            const serviceAmount = calculateDynamicHourlyAmount(
                service,
                requestedDurationHours
            );

            const couponDiscount = 0;
            const walletAmount = 0;
            const taxAmount = 0;
            const totalAmount =
                serviceAmount - couponDiscount - walletAmount + taxAmount;

            const [booking] = await Booking.create(
                [
                    {
                        bookingNumber: generateBookingNumber(),
                        userId,
                        serviceId: service._id,
                        availabilitySlotId: null,
                        assignedProfessionalId: selectedProfessional._id,
                        addressId: address._id,
                        requestedDurationHours,
                        scheduledStartAt,
                        scheduledEndAt,

                        serviceSnapshot: {
                            title: service.title,
                            pricingType: service.pricingType,
                            durationType: service.durationType,
                            pricePerHour: service.pricePerHour,
                            pricePerDay: service.pricePerDay ?? null,
                            estimatedDuration: service.estimatedDuration ?? null
                        },

                        addressSnapshot: {
                            label: address.label,
                            houseFlat: address.houseFlat,
                            roadArea: address.roadArea,
                            landmark: address.landmark ?? null,
                            city: address.city,
                            pincode: address.pincode
                        },

                        entryInstructions: instructions,
                        serviceAmount,
                        couponDiscount,
                        walletAmount,
                        taxAmount,
                        totalAmount,
                        bookingStatus: "pending_payment",
                        paymentStatus: "pending"
                    }
                ],
                { session }
            );

            createdBooking = booking;
        });

        return createdBooking;
    } finally {
        await session.endSession();
    }
};

module.exports = {
    createBooking,
    createDynamicHourlyBooking
};