// import jwt from "jsonwebtoken" // installed using npm i at the begeinin
const jwt = require("jsonwebtoken")
const generateToken = (userId, role, res)=>{
    const token = jwt.sign({userId, role}, process.env.JWT_SECRET,{expiresIn:"7d"})

    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: true,
        sameSite:"none"
    });

};
module.exports = generateToken