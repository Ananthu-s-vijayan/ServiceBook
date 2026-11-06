const {
    createException,
    getExceptionsByProfessional,
    deactivateException
} = require("../../services/professionalAvailabilityExceptionService");

// Create a professional availability exception.
const createProfessionalException = async (req, res) => {
    try {
        const exception = await createException(req.body);

        return res.status(201).json({
            success: true,
            message: "Professional availability exception created successfully",
            data: exception
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Get exceptions for a particular professional.
const getProfessionalExceptions = async (req, res) => {
    try {
        const { professionalId } = req.params;
        const { date } = req.query;

        const exceptions = await getExceptionsByProfessional(
            professionalId,
            date
        );

        return res.status(200).json({
            success: true,
            message: "Professional availability exceptions fetched successfully",
            data: exceptions
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// Deactivate an exception and restore normal availability.
const deactivateProfessionalException = async (req, res) => {
    try {
        const { exceptionId } = req.params;

        const exception = await deactivateException(exceptionId);

        return res.status(200).json({
            success: true,
            message: "Professional availability exception deactivated successfully",
            data: exception
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createProfessionalException,
    getProfessionalExceptions,
    deactivateProfessionalException
};