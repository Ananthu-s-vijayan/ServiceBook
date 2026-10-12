const express =require("express");
const path =require("path");

const cors=require("cors");

const authRoutes=require("./routes/user/authRoutes");

const categoryRoutes=require("./routes/admin/categoryRoutes");
const userCategoryRoutes=require("./routes/user/categoryRoutes");

const serviceRoutes=require("./routes/admin/serviceRoutes");
const userServiceRoutes=require("./routes/user/serviceRoutes");

const availabilityRoutes=require("./routes/admin/availabilityRoutes");
const userAvailabilityRoutes = require("./routes/user/availabilityRoutes");

const addressRoutes=require("./routes/user/addressRoutes");


const authMiddleware=require("./middleware/authMiddleware");

const adminMiddleware=require("./middleware/adminMiddleware");







const app=express();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({extended:true}));

app.use("/uploads",
    express.static(
        path.join(__dirname,"../uploads")
    )
);

app.get("/api/health",(req,res)=>{
    res.status(200).json({
        success:true,
        message:"ServiceBook API is running"
    });
});

app.use("/api/user",authRoutes);
app.use("/api/user/addresses",authMiddleware,addressRoutes);

app.use("/api/admin/categories",
    authMiddleware,
    adminMiddleware,
    categoryRoutes
);

app.use("/api/categories",userCategoryRoutes);

app.use("/api/admin/services",
    authMiddleware,
    adminMiddleware,
    serviceRoutes);

app.use("/api/services",userServiceRoutes);

app.use("/api/admin/availability",
    authMiddleware,
    adminMiddleware,
    availabilityRoutes);

app.use("/api/availability",userAvailabilityRoutes);   



module.exports=app;