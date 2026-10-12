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

        availabilitySlotId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AvailabilitySlot",
            required: true
        },

        addressId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Address",
            required: true
        },

        serviceSnapshot: {
            title: { type: String, required: true },
            pricingType: { type: String, required: true },
            pricePerHour: { type: Number, required: true },
            estimatedDuration: { type: Number, default: null }
        },

        addressSnapshot: {
            label: { type: String, required: true },
            houseFlat: { type: String, required: true },
            roadArea: { type: String, required: true },
            landmark: { type: String, default: null },
            city: { type: String, required: true },
            pincode: { type: String, required: true }
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

module.exports = mongoose.model("Booking", bookingSchema);