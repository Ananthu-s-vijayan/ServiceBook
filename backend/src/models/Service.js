const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
    {
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        sku: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        shortDescription: {
            type: String,
            default: null,
            trim: true
        },

        description: {
            type: String,
            default: null,
            trim: true
        },

        pricingType: {
            type: String,
            required: true,
            trim: true
        },

        pricePerHour: {
            type: Number,
            default: null
        },

        estimatedDuration: {
            type: Number,
            default: null
        },

        imageUrl: {
            type: String,
            default: null,
            trim: true
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Service", serviceSchema);