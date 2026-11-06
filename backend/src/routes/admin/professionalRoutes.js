const express = require("express");

const {
    createProfessionalController,
    getProfessionalsByServiceController,
    updateProfessionalScheduleController
} = require("../../controllers/admin/professionalController");

const {
    createProfessionalException,
    getProfessionalExceptions,
    deactivateProfessionalException
}= require("../../controllers/admin/professionalAvailabilityExceptionController");

const router = express.Router();

// Create a professional.
router.post("/", createProfessionalController);

// Get professionals by service ID.
router.get("/", getProfessionalsByServiceController);

// Update a professional's weekly working schedule.
router.patch(
    "/:professionalId/schedule",
    updateProfessionalScheduleController
);


// Create an availability exception for a professional.
router.post("/exceptions", createProfessionalException);

// Get availability exceptions for a professional.
router.get(
    "/:professionalId/exceptions",
    getProfessionalExceptions
);

// Deactivate an availability exception.
router.patch(
    "/exceptions/:exceptionId/deactivate",
    deactivateProfessionalException
);

module.exports = router;