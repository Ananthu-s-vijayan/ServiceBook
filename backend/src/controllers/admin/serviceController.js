const{
    createService,
    updateService,
    updateServiceStatus,
    getAllServices
}=require("../../services/serviceService");

const create=async(req,res)=>{
    try{
        const service=await createService(req.body);

        return res.status(201).json({
            success:true,
            message:"Service created successfully",
            data:service
        });
    }catch(error){
        console.error(
            "Service creation error:",error.message
        );
        return res.status(error.statusCode || 500).json({
            success:false,
            message:error.message || "Service creation failed"
        });

    }
}

const update = async(req,res)=>{
    try{
        const service=await updateService(
            req.params.id,
            req.body
        );
        return res.status(200).json({
            success:true,
            message:"Service updated successfully",
            data:service
        });
    }catch(error){
        console.error("Service update error:",
            error.message
        );
        return res.status(error.statusCode||500).json({
            success:false,
            message:error.message||"Service update failed"
        });
    }
}

const updateStatus = async (req, res) => {
    try {
        const service = await updateServiceStatus(
            req.params.id,
            req.body.isActive
        );

        return res.status(200).json({
            success: true,
            message: "Service status updated successfully",
            data: service
        });
    } catch (error) {
        console.error(
            "Service status update error:",
            error.message
        );

        return res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.message ||
                "Service status update failed"
        });
    }
};

const getAll = async (req, res) => {
    try {
        const services = await getAllServices();

        return res.status(200).json({
            success: true,
            data: services
        });
    } catch (error) {
        console.error(
            "Service fetch error:",
            error.message
        );

        return res.status(error.statusCode || 500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch services"
        });
    }
};

module.exports={create,update,updateStatus,getAll};