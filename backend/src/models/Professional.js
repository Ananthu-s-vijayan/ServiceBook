const mongoose = require("mongoose");

// Represents a break during a professional's working day.
const breakSchema = new mongoose.Schema(
    {
        startTime: {
            type: String,
            required: true,
            trim: true,
            match: /^([01]\d|2[0-3]):00$/
        },

        endTime: {
            type: String,
            required: true,
            trim: true,
            match: /^([01]\d|2[0-3]):00$/
        }
    },
    {
        _id: false
    }
);

// Represents the regular working hours for one day of the week.
const workingDaySchema = new mongoose.Schema(
    {
        // JavaScript weekday numbering: Sunday = 0, Saturday = 6.
        dayOfWeek: {
            type: Number,
            required: true,
            min: 0,
            max: 6
        },

        startTime: {
            type: String,
            required: true,
            trim: true,
            match: /^([01]\d|2[0-3]):00$/
        },

        endTime: {
            type: String,
            required: true,
            trim: true,
            match: /^([01]\d|2[0-3]):00$/
        },

        breaks: {
            type: [breakSchema],
            default: []
        },

        isWorking: {
            type: Boolean,
            default: true
        }
    },
    {
        _id: false
    }
);

const professionalSchema = new mongoose.Schema(
    {
        // Name of the professional managed by the admin.
        name: {
            type: String,
            required: true,
            trim: true
        },

        // Each professional provides one service.
        serviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true
        },

        // Regular working hours configured by the administrator.
        workingSchedule: {
            type: [workingDaySchema],
            default: []
        },

        // Inactive professionals must not receive new bookings.
        isActive: {
            type: Boolean,
            default: true
        },

        //Updated inside booking transactions to serialize concurrent reservations.
        bookingVersion:{
            type:Number,
            default:0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Professional",
    professionalSchema
);