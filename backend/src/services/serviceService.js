const Service = require("../models/Service");
const Category = require("../models/Category");
const mongoose = require("mongoose");

// Validate pricing according to the service's booking type.
const validateServicePricing = ({
    durationType,
    pricePerHour,
    pricePerDay
}) => {
    if (!["hourly", "full_day"].includes(durationType)) {
        const error = new Error(
            "Duration type must be hourly or full_day"
        );
        error.statusCode = 400;
        throw error;
    }

    if (durationType === "hourly") {
        if (
            pricePerHour === undefined ||
            pricePerHour === null ||
            pricePerHour === "" ||
            !Number.isFinite(Number(pricePerHour)) ||
            Number(pricePerHour) < 0
        ) {
            const error = new Error(
                "A valid price per hour is required for hourly services"
            );
            error.statusCode = 400;
            throw error;
        }
    }

    if (durationType === "full_day") {
        if (
            pricePerDay === undefined ||
            pricePerDay === null ||
            pricePerDay === "" ||
            !Number.isFinite(Number(pricePerDay)) ||
            Number(pricePerDay) < 0
        ) {
            const error = new Error(
                "A valid price per day is required for full-day services"
            );
            error.statusCode = 400;
            throw error;
        }
    }
};

// Create a new service.
const createService = async ({
    categoryId,
    title,
    sku,
    shortDescription,
    description,
    pricingType,
    durationType = "hourly",
    pricePerHour,
    pricePerDay,
    estimatedDuration,
    imageUrl
}) => {
    if (!categoryId || !title || !sku || !pricingType) {
        const error = new Error(
            "Category, title, SKU and pricing type are required"
        );
        error.statusCode = 400;
        throw error;
    }

    const category = await Category.findById(categoryId);

    if (!category) {
        const error = new Error("Category not found");
        error.statusCode = 404;
        throw error;
    }

    const normalizedSku = sku.trim();

    const existingService = await Service.findOne({
        sku: normalizedSku
    });

    if (existingService) {
        const error = new Error("Service SKU already exists");
        error.statusCode = 409;
        throw error;
    }

    validateServicePricing({
        durationType,
        pricePerHour,
        pricePerDay
    });

    return await Service.create({
        categoryId,
        title: title.trim(),
        sku: normalizedSku,
        shortDescription: shortDescription
            ? shortDescription.trim()
            : null,
        description: description
            ? description.trim()
            : null,
        pricingType: pricingType.trim(),
        durationType,
        pricePerHour:
            durationType === "hourly"
                ? Number(pricePerHour)
                : null,
        pricePerDay:
            durationType === "full_day"
                ? Number(pricePerDay)
                : null,
        estimatedDuration:
            estimatedDuration !== undefined
                ? estimatedDuration
                : null,
        imageUrl: imageUrl
            ? imageUrl.trim()
            : null
    });
};

// Update an existing service.
const updateService = async (
    serviceId,
    {
        categoryId,
        title,
        sku,
        shortDescription,
        description,
        pricingType,
        durationType,
        pricePerHour,
        pricePerDay,
        estimatedDuration,
        imageUrl
    }
) => {
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        const error = new Error("Invalid service ID");
        error.statusCode = 400;
        throw error;
    }

    const service = await Service.findById(serviceId);

    if (!service) {
        const error = new Error("Service not found");
        error.statusCode = 404;
        throw error;
    }

    if (categoryId !== undefined) {
        const category = await Category.findById(categoryId);

        if (!category) {
            const error = new Error("Category not found");
            error.statusCode = 404;
            throw error;
        }

        service.categoryId = categoryId;
    }

    if (title !== undefined) {
        service.title = title.trim();
    }

    if (sku !== undefined) {
        const normalizedSku = sku.trim();

        const existingService = await Service.findOne({
            sku: normalizedSku,
            _id: { $ne: serviceId }
        });

        if (existingService) {
            const error = new Error("Service SKU already exists");
            error.statusCode = 409;
            throw error;
        }

        service.sku = normalizedSku;
    }

    if (shortDescription !== undefined) {
        service.shortDescription = shortDescription
            ? shortDescription.trim()
            : null;
    }

    if (description !== undefined) {
        service.description = description
            ? description.trim()
            : null;
    }

    if (pricingType !== undefined) {
        service.pricingType = pricingType.trim();
    }

    // Apply the new booking type before validating the final pricing.
    if (durationType !== undefined) {
        service.durationType = durationType;
    }

    if (pricePerHour !== undefined) {
        service.pricePerHour = pricePerHour;
    }

    if (pricePerDay !== undefined) {
        service.pricePerDay = pricePerDay;
    }

    if (estimatedDuration !== undefined) {
        service.estimatedDuration = estimatedDuration;
    }

    if (imageUrl !== undefined) {
        service.imageUrl = imageUrl
            ? imageUrl.trim()
            : null;
    }

    validateServicePricing({
        durationType: service.durationType,
        pricePerHour: service.pricePerHour,
        pricePerDay: service.pricePerDay
    });

    // Keep only the price relevant to the selected booking type.
    if (service.durationType === "hourly") {
        service.pricePerDay = null;
    } else {
        service.pricePerHour = null;
    }

    return await service.save();
};

// Activate or deactivate a service.
const updateServiceStatus = async (
    serviceId,
    isActive
) => {
    if (typeof isActive !== "boolean") {
        const error = new Error(
            "isActive must be a boolean"
        );
        error.statusCode = 400;
        throw error;
    }

    const service = await Service.findByIdAndUpdate(
        serviceId,
        { isActive },
        {
            returnDocument: "after",
            runValidators: true
        }
    );

    if (!service) {
        const error = new Error("Service not found");
        error.statusCode = 404;
        throw error;
    }

    return service;
};

// Fetch active services that belong to active categories.
const getActiveServices = async () => {
    const activeCategories = await Category.find({
        isActive: true
    }).select("_id");

    const activeCategoryIds = activeCategories.map(
        (category) => category._id
    );

    return await Service.find({
        isActive: true,
        categoryId: { $in: activeCategoryIds }
    }).sort({
        createdAt: -1
    });
};

// Fetch one active service by ID from an active category.
const getActiveServiceById = async (serviceId) => {
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        const error = new Error("Invalid service ID");
        error.statusCode = 400;
        throw error;
    }

    const service = await Service.findOne({
        _id: serviceId,
        isActive: true
    });

    if (!service) {
        const error = new Error("Service not found");
        error.statusCode = 404;
        throw error;
    }

    const category = await Category.findOne({
        _id: service.categoryId,
        isActive: true
    });

    if (!category) {
        const error = new Error("Service not found");
        error.statusCode = 404;
        throw error;
    }

    return service;
};

// Fetch all services for admin management.
const getAllServices = async () => {
    return await Service.find().sort({
        createdAt: -1
    });
};

module.exports = {
    createService,
    updateService,
    updateServiceStatus,
    getActiveServices,
    getActiveServiceById,
    getAllServices
};