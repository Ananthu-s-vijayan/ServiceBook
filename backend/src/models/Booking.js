const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        bookingNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        serviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true
        },

        // Retained for compatibility with existing slot-based bookings.
        // New dynamic bookings may not reference a predefined slot.
        availabilitySlotId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AvailabilitySlot",
            default: null
        },

        assignedProfessionalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Professional",
            default: null
        },

        addressId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Address",
            required: true
        },

        // Customer-selected duration for new hourly bookings.
        // Null remains valid for historical bookings and full-day bookings.
        requestedDurationHours: {
            type: Number,
            default: null,
            min: 1,
            validate: {
                validator: function (value) {
                    return (
                        value === null ||
                        value === undefined ||
                        Number.isInteger(value)
                    );
                },
                message: "Requested duration must be a whole number of hours."
            }
        },

        // Actual scheduled interval for the booking.
        // Optional to preserve historical bookings.
        scheduledStartAt: {
            type: Date,
            default: null
        },

        scheduledEndAt: {
            type: Date,
            default: null,
            validate: {
                validator: function (value) {
                    if (value === null || value === undefined) {
                        return true;
                    }

                    if (
                        !this.scheduledStartAt ||
                        !(this.scheduledStartAt instanceof Date) ||
                        Number.isNaN(this.scheduledStartAt.getTime())
                    ) {
                        return false;
                    }

                    return value.getTime() > this.scheduledStartAt.getTime();
                },
                message: "Scheduled end time must be after scheduled start time."
            }
        },

        serviceSnapshot: {
            title: {
                type: String,
                required: true
            },

            pricingType: {
                type: String,
                required: true
            },

            durationType: {
                type: String,
                enum: ["hourly", "full_day"],
                required: true
            },

            pricePerHour: {
                type: Number,
                default: null,
                min: 0
            },

            pricePerDay: {
                type: Number,
                default: null,
                min: 0
            },

            estimatedDuration: {
                type: Number,
                default: null
            }
        },

        addressSnapshot: {
            label: {
                type: String,
                required: true
            },

            houseFlat: {
                type: String,
                required: true
            },

            roadArea: {
                type: String,
                required: true
            },

            landmark: {
                type: String,
                default: null
            },

            city: {
                type: String,
                required: true
            },

            pincode: {
                type: String,
                required: true
            }
        },

        entryInstructions: {
            type: String,
            default: null,
            trim: true
        },

        serviceAmount: {
            type: Number,
            required: true,
            min: 0
        },

        couponDiscount: {
            type: Number,
            default: 0,
            min: 0
        },

        walletAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        taxAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },

        bookingStatus: {
            type: String,
            enum: [
                "pending_payment",
                "confirmed",
                "in_progress",
                "completed",
                "cancelled"
            ],
            default: "pending_payment",
            required: true
        },

        paymentStatus: {
            type: String,
            enum: [
                "pending",
                "paid",
                "failed",
                "refunded"
            ],
            default: "pending",
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Helps find bookings assigned to a professional on a date.
// The booking service will still need to apply the correct
// status and interval-overlap conditions.
bookingSchema.index({
    assignedProfessionalId: 1,
    scheduledStartAt: 1,
    scheduledEndAt: 1
});

module.exports = mongoose.model(
    "Booking",
    bookingSchema
);