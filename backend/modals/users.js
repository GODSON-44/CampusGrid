const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
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
        roll:{
            type:String,
            required:true,
            unique:true,
        },
        branch:{
            type:String,
            required:true,
        },
        phone:{
            type:String,
            required:true,
        },
        p_mob:{
            type:String,
            required:true,
        },
        detail:{
            type:String,
            default:"BIT Student"
        },
        profile_pic_url:{
            type:String,
            default:"",
        },
    },
    {
        timestamps:true,
    }
);

const User = mongoose.model("User", userSchema);

module.exports = User;