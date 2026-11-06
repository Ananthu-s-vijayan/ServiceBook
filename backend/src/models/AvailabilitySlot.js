const mongoose = require("mongoose");

const availabilitySlotSchema = new mongoose.Schema(
    {
        serviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true
        },
        professionalId:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"Professional",
            required:true
        },

        date: {
            type: Date,
            required: true
        },

        // Identifies whether this slot is hourly or for a full day.
        slotType: {
            type: String,
            enum: ["hourly", "full_day"],
            default: "hourly",
            required: true
        },

        startTime: {
            type: String,
            required: true,
            trim: true
        },

        endTime: {
            type: String,
            required: true,
            trim: true
        },

        status: {
            type: String,
            enum: ["available", "paused", "full"],
            default: "available",
            required: true
        },

        capacity: {
            type: Number,
            required: true,
            min: 1
        },

        bookedCount: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "AvailabilitySlot",
    availabilitySlotSchema
);