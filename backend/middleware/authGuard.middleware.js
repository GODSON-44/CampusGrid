//later fixed version!!!
// import jwt from "jsonwebtoken";
// import User from "../models/user.model.js";
const jwt = require("jsonwebtoken")
const Staff = require("../modals/staff")

const protectRouteGuard = async (req, res, next) => {
  try {

    const token =
      req.cookies?.jwt ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized - No token provided",
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if(decoded.role != "guard"){
        return res.status(400).json({
            message:"Unautharized guard!"
        })
    }

    const user = await Staff.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({
        message: "Unauthorized - User not a Guard",
      });
    }

    req.user = user;
    next(); // ✅ only reached if everything is OK
  } catch (error) {
    console.log("Error in protectedRoute middleware", error.message);
    return res.status(401).json({
      message: "Unauthorized - Invalid token",
    });
  }
};

module.exports = protectRouteGuard;

