const mongoose = require("mongoose");

const professionalAvailabilityExceptionSchema = new mongoose.Schema(
    {
        // The professional whose availability is being changed.
        professionalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Professional",
            required: true,
            index: true
        },

        // The affected calendar date, normalized to UTC midnight.
        date: {
            type: Date,
            required: true
        },

        // full_day blocks the entire date.
        // partial_day blocks only the specified interval.
        exceptionType: {
            type: String,
            enum: ["full_day", "partial_day"],
            required: true
        },

        // Required for partial-day exceptions.
        // Times use whole-hour increments for the initial implementation.
        startTime: {
            type: String,
            default: null,
            trim: true,
            match: /^([01]\d|2[0-3]):00$/
        },

        endTime: {
            type: String,
            default: null,
            trim: true,
            match: /^([01]\d|2[0-3]):00$/
        },

        // Optional explanation recorded by the admin.
        reason: {
            type: String,
            default: null,
            trim: true,
            maxlength: 250
        },

        // Deactivating an exception preserves its record.
        isActive: {
            type: Boolean,
            default: true,
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Helps retrieve active exceptions for a professional on a given date.
professionalAvailabilityExceptionSchema.index({
    professionalId: 1,
    date: 1,
    isActive: 1
});

// Validate relationships between exception fields.
professionalAvailabilityExceptionSchema.pre("validate", function () {
    if (!(this.date instanceof Date) || Number.isNaN(this.date.getTime())) {
        this.invalidate("date", "A valid exception date is required.");
        return;
    }

    if (this.exceptionType === "full_day") {
        if (this.startTime || this.endTime) {
            this.invalidate(
                "startTime",
                "Full-day exceptions must not contain a time interval."
            );
        }

        return;
    }

    if (this.exceptionType === "partial_day") {
        if (!this.startTime || !this.endTime) {
            this.invalidate(
                "startTime",
                "Partial-day exceptions require a start time and end time."
            );
            return;
        }

        const timeToMinutes = (time) => {
            const match = /^([01]\d|2[0-3]):00$/.exec(time);

            if (!match) {
                return null;
            }

            const [hours, minutes] = time.split(":").map(Number);

            return hours * 60 + minutes;
        };

        const start = timeToMinutes(this.startTime);
        const end = timeToMinutes(this.endTime);

        if (start === null || end === null) {
            this.invalidate(
                "startTime",
                "Exception times must use the HH:00 format."
            );
            return;
        }

        if (end <= start) {
            this.invalidate(
                "endTime",
                "Exception end time must be after its start time."
            );
        }
    }
});

module.exports = mongoose.model(
    "ProfessionalAvailabilityException",
    professionalAvailabilityExceptionSchema
);