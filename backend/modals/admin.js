const mongoose = require("mongoose")

const adminSchema = new mongoose.Schema(
    //first object
    {
        email:{
            type:String,
            required:true,
            unique: true,
        },
        userId:{
            type:String,
            required:true,
            unique:true,
        },
        fullName:{
            type:String,
            required:true,
        },
        password:{
            type:String,
            required:true,
            minlength:6,
        },
        profilePic:{
            type:String,
            default:"",
        },

    },
    //second object
    {
        timestamps:true
    }
);

const admin = mongoose.model("admin", adminSchema);

module.exports = admin;