const mongoose = require("mongoose");

const Professional = require("../models/Professional");
const ProfessionalAvailabilityException = require(
    "../models/ProfessionalAvailabilityException"
);

// Validate and normalize a date in YYYY-MM-DD format.
const normalizeDate = (date) => {
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const error = new Error("Date must be in YYYY-MM-DD format");
        error.statusCode = 400;
        throw error;
    }

    const parsedDate = new Date(`${date}T00:00:00.000Z`);

    if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== date
    ) {
        const error = new Error("Invalid date");
        error.statusCode = 400;
        throw error;
    }

    return parsedDate;
};

// Create an availability exception for a professional.
const createException = async ({
    professionalId,
    date,
    exceptionType,
    startTime,
    endTime,
    reason
}) => {
    // Validate the professional ID.
    if (!mongoose.Types.ObjectId.isValid(professionalId)) {
        const error = new Error("Invalid professional ID");
        error.statusCode = 400;
        throw error;
    }

    // Validate the exception type.
    if (!["full_day", "partial_day"].includes(exceptionType)) {
        const error = new Error("Invalid exception type");
        error.statusCode = 400;
        throw error;
    }

    // Normalize the selected date.
    const normalizedDate = normalizeDate(date);

    // Validate the professional.
    const professional = await Professional.findOne({
        _id: professionalId,
        isActive: true
    });

    if (!professional) {
        const error = new Error("Active professional not found");
        error.statusCode = 404;
        throw error;
    }

    // Full-day exceptions must not contain a time interval.
    if (exceptionType === "full_day" && (startTime || endTime)) {
        const error = new Error(
            "Full-day exceptions must not contain start and end times"
        );
        error.statusCode = 400;
        throw error;
    }

    // Partial-day exceptions require a valid time interval.
    if (exceptionType === "partial_day") {
        const timePattern = /^([01]\d|2[0-3]):00$/;

        if (
            !timePattern.test(startTime || "") ||
            !timePattern.test(endTime || "")
        ) {
            const error = new Error(
                "Partial-day exception times must use HH:00 format"
            );
            error.statusCode = 400;
            throw error;
        }

        const startMinutes = Number(startTime.slice(0, 2)) * 60;
        const endMinutes = Number(endTime.slice(0, 2)) * 60;

        if (endMinutes <= startMinutes) {
            const error = new Error(
                "Exception end time must be after start time"
            );
            error.statusCode = 400;
            throw error;
        }
    }

    // Save the exception. The model also performs schema validation.
    return await ProfessionalAvailabilityException.create({
        professionalId,
        date: normalizedDate,
        exceptionType,
        startTime: exceptionType === "partial_day" ? startTime : null,
        endTime: exceptionType === "partial_day" ? endTime : null,
        reason: reason?.trim() || null
    });
};

// Retrieve exceptions for a professional, optionally filtered by date.
const getExceptionsByProfessional = async (professionalId, date) => {
    if (!mongoose.Types.ObjectId.isValid(professionalId)) {
        const error = new Error("Invalid professional ID");
        error.statusCode = 400;
        throw error;
    }

    const professional = await Professional.findById(professionalId);

    if (!professional) {
        const error = new Error("Professional not found");
        error.statusCode = 404;
        throw error;
    }

    const filter = { professionalId };

    if (date) {
        filter.date = normalizeDate(date);
    }

    return await ProfessionalAvailabilityException.find(filter)
        .sort({ date: 1, createdAt: -1 });
};

// Deactivate an exception without deleting its record.
const deactivateException = async (exceptionId) => {
    if (!mongoose.Types.ObjectId.isValid(exceptionId)) {
        const error = new Error("Invalid exception ID");
        error.statusCode = 400;
        throw error;
    }

    const exception =
        await ProfessionalAvailabilityException.findById(exceptionId);

    if (!exception) {
        const error = new Error("Availability exception not found");
        error.statusCode = 404;
        throw error;
    }

    if (!exception.isActive) {
        const error = new Error("Availability exception is already inactive");
        error.statusCode = 400;
        throw error;
    }

    exception.isActive = false;
    await exception.save();

    return exception;
};

module.exports = {
    createException,
    getExceptionsByProfessional,
    deactivateException
};