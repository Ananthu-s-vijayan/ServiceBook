const express=require("express");

const {
    create,
    getByService,
    update,
    updateStatus
}=require("../../controllers/admin/availabilityController");

const router=express.Router();

router.post("/",create);

router.get("/service/:serviceId",getByService);

router.put("/:id",update);

router.patch("/:id/status",updateStatus);

module.exports=router;