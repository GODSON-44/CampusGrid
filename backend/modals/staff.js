const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
    {
        userId:{
            type:String,
            required:true,
            unique:true,
        },
        password:{
            type:String,
            required:true,
            minlength:6,
        },
        name:{
            type:String,
            required:true,
        },
        phone:{
            type:String,
            required:true,
        },
        role:{
            type:String,
            required:true,
        },
    },
    {
        timestamps:true,
    }
);

const Staff = mongoose.model("Staff", staffSchema);

module.exports = Staff;