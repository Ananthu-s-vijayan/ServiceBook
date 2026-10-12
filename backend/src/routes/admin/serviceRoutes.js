const express = require("express");

const{create,update,updateStatus,getAll}=require(
    "../../controllers/admin/serviceController");

const router=express.Router();

router.get("/",getAll);

router.post("/",create);

router.put("/:id",update);

router.patch("/:id/status",updateStatus);

module.exports=router;