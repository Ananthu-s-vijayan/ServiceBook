const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        label: {
            type: String,
            enum: ["Home", "Office", "Other"],
            required: true
        },

        houseFlat: {
            type: String,
            required: true,
            trim: true
        },

        roadArea: {
            type: String,
            required: true,
            trim: true
        },

        landmark: {
            type: String,
            default: null,
            trim: true
        },

        city: {
            type: String,
            required: true,
            trim: true
        },

        pincode: {
            type: String,
            required: true,
            trim: true
        },

        isDefault: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Address", addressSchema);