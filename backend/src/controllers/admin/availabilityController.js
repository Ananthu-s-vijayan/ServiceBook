const{
    createAvailabilitySlot,
    getServiceSlots,
    updateAvailabilitySlot,
    updateAvailabilitySlotStatus
}=require("../../services/availabilityService");

const create=async(req,res)=>{
    try {
        const slot = await createAvailabilitySlot(req.body);

        return res.status(201).json({
            success: true,
            message: "Availability slot created successfully",
            data: slot
        });

    } catch (error) {
        console.error(
            "Availability slot creation error:",
            error.message
        );
         return res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.message ||
                "Availability slot creation failed"
        });

    }

};

const getByService = async (req, res) => {
    try {
        const slots = await getServiceSlots(
            req.params.serviceId
        );

        return res.status(200).json({
            success: true,
            message: "Availability slots fetched successfully",
            data: slots
        });

    } catch (error) {
        console.error(
            "Availability slot fetch error:",
            error.message
        );

        return res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.message ||
                "Availability slot fetch failed"
        });
    }
};

const update = async (req, res) => {
    try {
        const slot = await updateAvailabilitySlot(
            req.params.id,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Availability slot updated successfully",
            data: slot
        });

    } catch (error) {
        console.error(
            "Availability slot update error:",
            error.message
        );

        return res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.message ||
                "Availability slot update failed"
        });
    }
};

const updateStatus = async (req, res) => {
    try {
        const slot = await updateAvailabilitySlotStatus(
            req.params.id,
            req.body.status
        );

        return res.status(200).json({
            success: true,
            message: "Availability slot status updated successfully",
            data: slot
        });

    } catch (error) {
        console.error(
            "Availability slot status update error:",
            error.message
        );

        return res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.message ||
                "Availability slot status update failed"
        });
    }
};

module.exports={
    create,getByService,update,updateStatus
};

