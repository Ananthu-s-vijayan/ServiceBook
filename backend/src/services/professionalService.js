const Professional = require("../models/Professional");
const Service = require("../models/Service");
const mongoose = require("mongoose");

// Create a professional and assign them to a service.
const createProfessional = async ({ name, serviceId }) => {
    if (!name || !name.trim() || !serviceId) {
        const error = new Error(
            "Professional name and service ID are required"
        );
        error.statusCode = 400;
        throw error;
    }

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
        const error = new Error("Active service not found");
        error.statusCode = 404;
        throw error;
    }

    return await Professional.create({
        name: name.trim(),
        serviceId
    });
};

// Get professionals assigned to a service.
const getProfessionalsByService = async (serviceId) => {
    if (!serviceId) {
        const error = new Error("Service ID is required");
        error.statusCode = 400;
        throw error;
    }

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

    return await Professional.find({
        serviceId,
        isActive: true
    }).sort({ name: 1 });
};

// Updates the weekly working schedule of an existing professional.
const updateProfessionalSchedule = async (professionalId, workingSchedule) => {
    // Validate the professional ID.
    if (!mongoose.Types.ObjectId.isValid(professionalId)) {
        const error = new Error("Invalid professional ID");
        error.statusCode = 400;
        throw error;
    }

    // Validate the schedule input.
    if (!Array.isArray(workingSchedule)) {
        const error = new Error("Working schedule must be an array");
        error.statusCode = 400;
        throw error;
    }

    // Find the existing professional.
    const professional = await Professional.findById(professionalId);

    if (!professional) {
        const error = new Error("Professional not found");
        error.statusCode = 404;
        throw error;
    }

    // Update the schedule without changing other professional details.
    professional.workingSchedule = workingSchedule;

    // Save the document using Mongoose schema validation.
    await professional.save();

    return professional;
};

module.exports = {
    createProfessional,
    getProfessionalsByService,
    updateProfessionalSchedule
};