const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true
        },

        transactionId: {
            type: String,
            unique: true,
            sparse: true,
            trim: true
        },

        paymentMethod: {
            type: String,
            enum: ["razorpay"],
            default: "razorpay",
            required: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed", "refunded"],
            default: "pending",
            required: true
        },

        gateway: {
            type: String,
            enum: ["razorpay"],
            default: "razorpay",
            required: true
        },

        gatewayOrderId: {
            type: String,
            default: null,
            trim: true
        },

        gatewayPaymentId: {
            type: String,
            default: null,
            trim: true
        },

        gatewaySignature: {
            type: String,
            default: null
        },

        paidAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Payment", paymentSchema);