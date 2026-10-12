const Address = require("../models/Address");

const createAddress = async (userId, addressData) => {
    const {
        label,
        houseFlat,
        roadArea,
        landmark,
        city,
        pincode,
        isDefault
    } = addressData;

    if (!label || !houseFlat || !roadArea || !city || !pincode) {
        const error = new Error("Please fill all required address fields");
        error.statusCode = 400;
        throw error;
    }

    if (!["Home", "Office", "Other"].includes(label)) {
        const error = new Error("Invalid address label");
        error.statusCode = 400;
        throw error;
    }

    // A customer can have only one default address.
    if (isDefault === true) {
        await Address.updateMany(
            { userId },
            { $set: { isDefault: false } }
        );
    }

    const address = await Address.create({
        userId,
        label,
        houseFlat,
        roadArea,
        landmark,
        city,
        pincode,
        isDefault: isDefault === true
    });

    return address;
};

const getAddresses = async (userId) => {
    return await Address.find({ userId }).sort({
        isDefault: -1,
        createdAt: -1
    });
};

const updateAddress = async (userId, addressId, addressData) => {
    const address = await Address.findOne({
        _id: addressId,
        userId
    });

    if (!address) {
        const error = new Error("Address not found");
        error.statusCode = 404;
        throw error;
    }

    const allowedFields = [
        "label",
        "houseFlat",
        "roadArea",
        "landmark",
        "city",
        "pincode"
    ];

    for (const field of allowedFields) {
        if (addressData[field] !== undefined) {
            address[field] = addressData[field];
        }
    }

    if (addressData.isDefault === true) {
        await Address.updateMany(
            { userId, _id: { $ne: addressId } },
            { $set: { isDefault: false } }
        );

        address.isDefault = true;
    } else if (addressData.isDefault === false) {
        address.isDefault = false;
    }

    await address.save();

    return address;
};

const deleteAddress = async (userId, addressId) => {
    const address = await Address.findOneAndDelete({
        _id: addressId,
        userId
    });

    if (!address) {
        const error = new Error("Address not found");
        error.statusCode = 404;
        throw error;
    }

    return address;
};

module.exports = {
    createAddress,
    getAddresses,
    updateAddress,
    deleteAddress
};