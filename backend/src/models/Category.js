const mongoose=require("mongoose");

const categorySchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    icon:{
        type:String,
        default:null
    },
    description:{
        type:String,
        default:null,
        trim:true
    },
    isActive:{
        type:Boolean,
        default:true
    },
},
{
    timestamps:true
}
);
module.exports=mongoose.model("Category",categorySchema);