const {
    createProfessional,
    getProfessionalsByService,
    updateProfessionalSchedule
} = require("../../services/professionalService");

// Create a professional.
const createProfessionalController = async (req, res, next) => {
    try {
        const professional = await createProfessional(req.body);

        return res.status(201).json({
            success: true,
            message: "Professional created successfully",
            data: professional
        });
    } catch (error) {
        next(error);
    }
};

// Get active professionals for a service.
const getProfessionalsByServiceController = async (req, res, next) => {
    try {
        const professionals = await getProfessionalsByService(
            req.query.serviceId
        );

        return res.status(200).json({
            success: true,
            count: professionals.length,
            data: professionals
        });
    } catch (error) {
        next(error);
    }
};

// Updates a professional's weekly working schedule.
const updateProfessionalScheduleController = async (req, res) => {
    try {
        const { professionalId } = req.params;
        const { workingSchedule } = req.body;

        const professional = await updateProfessionalSchedule(
            professionalId,
            workingSchedule
        );

        return res.status(200).json({
            success: true,
            message: "Professional working schedule updated successfully",
            data: professional
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to update professional working schedule"
        });
    }
};

module.exports = {
    createProfessionalController,
    getProfessionalsByServiceController,
    updateProfessionalScheduleController
};