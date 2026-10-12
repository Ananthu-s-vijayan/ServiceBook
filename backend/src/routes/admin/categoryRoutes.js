const express = require("express");


const {
    getAll,
    create,
    update,
    updateStatus
} = require("../../controllers/admin/categoryController");

const{
    categoryUpload
}=require("../../middleware/uploadMiddleware");


const router = express.Router();

router.get("/", getAll);

router.post("/",
    categoryUpload.single("icon"), create);

router.put("/:id",
    categoryUpload.single("icon"), update);

router.patch("/:id/status", updateStatus);


module.exports = router;