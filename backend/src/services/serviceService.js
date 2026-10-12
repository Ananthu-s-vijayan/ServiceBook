const Service = require("../models/Service");
const Category = require("../models/Category");
const mongoose=require("mongoose");

const createService = async ({
    categoryId,
    title,
    sku,
    shortDescription,
    description,
    pricingType,
    pricePerHour,
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

    const existingService = await Service.findOne({
        sku: sku.trim()
    });

    if (existingService) {
        const error = new Error("Service SKU already exists");

        error.statusCode = 409;
        throw error;
    }

    return await Service.create({
        categoryId,
        title: title.trim(),
        sku: sku.trim(),
        shortDescription: shortDescription
            ? shortDescription.trim()
            : null,
        description: description
            ? description.trim()
            : null,
        pricingType: pricingType.trim(),
        pricePerHour:
            pricePerHour !== undefined
                ? pricePerHour
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

const updateService = async (
    serviceId,
    {
        categoryId,
        title,
        sku,
        shortDescription,
        description,
        pricingType,
        pricePerHour,
        estimatedDuration,
        imageUrl
    }
) => {
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

    if (pricePerHour !== undefined) {
        service.pricePerHour = pricePerHour;
    }

    if (estimatedDuration !== undefined) {
        service.estimatedDuration = estimatedDuration;
    }

    if (imageUrl !== undefined) {
        service.imageUrl = imageUrl
            ? imageUrl.trim()
            : null;
    }

    return await service.save();
};

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
            returnDocument:"after",
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


const getActiveServices=async()=>{
    return await Service.find({
        isActive:true
    }).sort({
        createdAt:-1
    })
}

const getActiveServiceById=async(serviceId)=>{


      //Validate the MongoDB ObjectId before querying the database.
     
      //This prevents an invalid ID such as "abc" from causing
      //a Mongoose CastError and becoming an incorrect 500 response.


    if(!mongoose.Types.ObjectId.isValid(serviceId)){
        const error=new Error("Invalid service ID");
        error.statusCode=400;
        throw error;
    }
    const service= await Service.findOne({
        _id: serviceId,
        isActive:true
    });

    if(!service){
        const error = new Error("Service not found");
        error.statusCode=404;
        throw error;
    }
    return service;
}

const getAllServices = async () => {
    return await Service.find()
        .sort({
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