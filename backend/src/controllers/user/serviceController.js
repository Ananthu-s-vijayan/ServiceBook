const{
    getActiveServices,
    getActiveServiceById
}=require("../../services/serviceService");

const getAll=async(req,res)=>{
    
    try{
        const services=await getActiveServices();
        return res.status(200).json({
            success:true,
            message:"Services fetched successfully",
            data:services
        });
    }catch(error){
        console.error("Service fetch error:",
            error.message
        );
        return res.status(error.statusCode||500).json({
            success:false,
            message:
            error.message||"Failed to fetch services"
        });
    }
}

const getById=async(req,res)=>{
    try{
        const service=await getActiveServiceById(
            req.params.id);

        return res.status(200).json({
            success:true,
            message:"Service fetched successfully",
            data:service
        });

    }catch(error){
        console.error(
            "Service fetch by ID error:",
            error.message
        );
        return res.status(error.statusCode||500).json({
            success:false,
            message:
            error.message||"Failed to fetch service"
        });
    }
}


module.exports={
    getAll,
    getById
}