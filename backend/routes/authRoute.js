const express = require("express")
const router = express.Router()
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")
const cookie = require("cookie-parser")
const User = require("../modals/users")
const Admin = require("../modals/admin")
const Staff = require("../modals/staff")
const generateToken = require("../lib/utils")
const protectRoute = require("../middleware/auth.middleware")
const protectRouteAdmin = require("../middleware/authAdmin.middleware")
const prisma = require("../lib/prisma")
const protectRouteGuard = require("../middleware/authGuard.middleware")
const protectRouteStaff = require("../middleware/authStaff.middleware")
const crypto = require("crypto")


router.post("/register/admin", async(req, res)=>{
    try{

        const {email, name,userId, password, adminPass, profile} = req.body
        if(!name || !email|| !password){
            return res.status(400).json({
            message:"All the fields are required!"
        })
    }

    if(adminPass != process.env.adminPass){
        return res.status(400).json({
            message:"Admin password incorrect!"
        })
    }

    const user = await Admin.findOne({email})
    if(user){
        return res.status(400).json({
            message:"User already exists!"
        })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new Admin({
        email,
        userId,
        fullName:name,
        password:hashedPassword,
        profilePic:profile
    })

    if(newAdmin){// if above new user is created successfully send a token!! which is created in util of lib
                    // to send as JWT resposnce (javascript web token)
            // generateToken(newAdmin._id, res)// in the utils
            await newAdmin.save()
            res.status(201).json({
                _id:newAdmin._id,
                fullName:newAdmin.fullName,
                email:newAdmin.email,
                password:hashedPassword,
                profilePic:newAdmin.profilePic,
                createdAt:newAdmin.createdAt
            })

        }else{
            return res.status(400).json({message:"Invalid user data!!"})
        }



    }catch(error){
        return res.status(400).json({
            message:"error in admin register"
        })
    }
    
})
router.post("/admin/register-student",protectRouteAdmin, async(req, res)=>{
    try {
        const { userId, password, name, roll, branch, phone, p_mob, profile_pic_url, detail} = req.body;
        const exist = await User.findOne({userId})
        if(exist){
            return res.status(400).json({
                message:"User already exists"
            })
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = new User({
            userId,
            password:hashedPassword,
            name,
            roll,
            branch,
            phone,
            p_mob,
            detail,
            profile_pic_url
        })
        
        if(newUser){
            await newUser.save()
            res.status(201).json({
                message:"New user added successfully!",
                success:true
            })

        }else{
            return res.status(400).json({message:"Invalid user data!!"})
        }

        
    }catch(error){
    return res.status(500).json({
        message: error.message
    });
}
})

router.post("/register/staff", protectRouteAdmin, async(req, res)=>{
    const {userId, password, name, phone, role} = req.body
    const exist = await Staff.findOne({userId});
    if(!userId || !password || !role || !phone){
        return res.status(400).json({
            message:"Not enough field filled!"
        })
    }
    if(exist){
        return res.status(400).json({
            message:"UserId already Exists!"
        })
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);

    const staff = new Staff({
        userId,
        password:hashedPass,
        name,
        phone,
        role
    })

    if(staff){
            await staff.save()
            res.status(201).json({
                message:"New staff added successfully!"
            })

    }else{
        return res.status(400).json({message:"Invalid staff data!!"})
    }

})

router.post("/login", async(req, res)=>{
    const {userId, password, role} = req.body
    let roles = User
    if(role == "admin") {
        roles = Admin
    }else if(role == "staff"|| role == "guard"){
        roles = Staff
    }
    const user = await roles.findOne({userId})
    if(!user){
        return res.status(401).json({
            message:"user not found"
        })
    }
    // console.log(user.email)
    const isPasswordCorrect = await bcrypt.compare(password, user.password)
    if(!isPasswordCorrect){
        return res.status(400).json({message:"Invalid Credential!"})
    }

    generateToken(user._id, role, res);
    const name = roles == "admin"?user.fullName:user.name;

    res.status(200).json({
        name,
        message:"login successfull!",
        success:true
    })

})

router.post("/logout", async(req, res)=>{
    try {
        res.clearCookie("jwt");
        res.status(200).json({message:"Logged out successfully"});
    } catch (error) {
        console.log("Error in logout controller", error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
})

router.get("/student/profile", async(req, res)=>{
    try{
     const token =
          req.cookies?.jwt ||
          req.headers.authorization?.split(" ")[1];
    
        if (!token) {
          return res.status(401).json({
            message: "Unauthorized - No token provided",
          });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(decoded.role != "student"){
            return res.status(401).json({
                message:"Unautharized!"
            })
        }
    
        const user = await User.findOne({
            _id: decoded.userId,
        }).select("-password");

        if (!user) {
          return res.status(401).json({
            message: "Unauthorized - User not found",
          });
        }
    
        return res.status(200).json({
            success: true,
            user: user
        });
        
      } catch (error) {
        console.log("Error in protectedRoute middleware", error.message);
        return res.status(401).json({
          message: "Unauthorized - Invalid token",
        });
      }

})

router.get("/guard/profile", async(req, res)=>{
    try{
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
            return res.status(401).json({
                message:"Unautharized!"
            })
        }
        
        // console.log(decoded)
        const user = await Staff.findOne({
            _id: decoded.userId,
            role:decoded.role
        }).select("-password");

        if (!user) {
          return res.status(401).json({
            message: "Unauthorized - User not found",
          });
        }
    
        return res.status(200).json({
            success: true,
            user: user
        });
        
      } catch (error) {
        console.log("Error in protectedRoute middleware", error.message);
        return res.status(401).json({
          message: "Unauthorized - Invalid token",
        });
      }

})

router.get("/staff/profile", async(req, res)=>{
    try{
     const token =
          req.cookies?.jwt ||
          req.headers.authorization?.split(" ")[1];
    
        if (!token) {
          return res.status(401).json({
            message: "Unauthorized - No token provided",
          });
        }
    
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(decoded.role != "staff"){
            return res.status(401).json({
                message:"Unautharized!"
            })
        }

        const user = await Staff.findOne({
            _id: decoded.userId,
            role: decoded.role
        }).select("-password");

        if (!user) {
          return res.status(401).json({
            message: "Unauthorized - User not found",
          });
        }
    
        return res.status(200).json({
            success: true,
            user: user
        });
        
      } catch (error) {
        console.log("Error in protectedRoute middleware", error.message);
        return res.status(401).json({
          message: "Unauthorized - Invalid token",
        });
      }
})


router.get("/admin/profile", async(req, res)=>{
    try{
     const token =
          req.cookies?.jwt ||
          req.headers.authorization?.split(" ")[1];
    
        if (!token) {
          return res.status(401).json({
            message: "Unauthorized - No token provided",
          });
        }
    
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if(decoded.role != "admin"){
            return res.status(401).json({
                message:"Unautharized!"
            })
        }

        const user = await Admin.findOne({
            _id: decoded.userId,
        }).select("-password");

        if (!user) {
          return res.status(401).json({
            message: "Unauthorized - User not found",
          });
        }
    
        return res.status(200).json({
            success: true,
            userDetail: user,
            role:decoded.role,
            details:"BIT Admin"
        });
        
      } catch (error) {
        console.log("Error in protectedRoute middleware", error.message);
        return res.status(401).json({
          message: "Unauthorized - Invalid token",
        });
      }
})

//QR entry to SQL table
router.post("/post-entry", protectRouteGuard, async (req, res) => {
    try {
        const { name, roll, phone, pmob, branch, reason } = req.body;

        // Check if the student is currently outside
        const activeEntry = await prisma.$queryRaw`
            SELECT *
            FROM "GatePass"
            WHERE roll = ${roll}
              AND "inTime" IS NULL
            ORDER BY "outTime" DESC
            LIMIT 1;
        `;

        // Student is returning -> update IN time
        if (activeEntry.length > 0) {
            await prisma.$executeRaw`
                UPDATE "GatePass"
                SET "inTime" = NOW()
                WHERE id = ${activeEntry[0].id};
            `;

            return res.status(200).json({
                success: true,
                message: "Student returned successfully."
            });
        }

        // Student is leaving -> create a new OUT entry
        await prisma.$executeRaw`
            INSERT INTO "GatePass"
            (
                name,
                roll,
                phone,
                "parentsPh",
                branch,
                reason,
                "outTime",
                "createdAt"
            )
            VALUES
            (
                ${name},
                ${roll},
                ${phone},
                ${pmob},
                ${branch},
                ${reason},
                NOW(),
                NOW()
            );
        `;

        return res.status(201).json({
            success: true,
            message: "Student checked out successfully."
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
});


router.get("/student-image", protectRouteGuard, async (req, res) => {
    try {
        const { roll } = req.query;
        if (!roll) {
            return res.status(400).json({
                success: false,
                message: "Roll number is required."
            });
        }
        const student = await User.findOne({ roll });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found."
            });
        }

        res.json({
            success: true,
            profile_pic_url: student.profile_pic_url
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
});

router.get("/get-entry", protectRouteGuard, async (req, res) => {
    try {
        const entries = await prisma.$queryRaw`
            SELECT *
            FROM "GatePass"
            WHERE "outTime" >= CURRENT_DATE
              AND "outTime" < CURRENT_DATE + INTERVAL '1 day'
            ORDER BY "outTime" DESC;
        `;

        return res.status(200).json({
            success: true,
            count: entries.length,
            entries
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
});

router.get("/get-campus-status", protectRoute, async (req, res) => {
    try {
        const { roll } = req.query;

        const result = await prisma.$queryRaw`
            SELECT *
            FROM "GatePass"
            WHERE roll = ${roll}
              AND "inTime" IS NULL
            LIMIT 1;
        `;
        let campusStat = "inCampus"
        if(result.length>0){
            campusStat = "outCampus"
        }

        res.status(200).json({
            // isOut: result.length > 0,
            campusStatus:campusStat
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// router.get("/staff/session")
router.get("/products/students", protectRoute, async (req, res) => {
    try {

        const products = await prisma.$queryRaw`
            SELECT
                id,
                name,
                description,
                price,
                "inStock",
                "createdAt",
                "updatedAt"
            FROM "Product"
            ORDER BY "createdAt" DESC;
        `;

        res.status(200).json({
            success: true,
            products
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to load products."
        });
    }
});

router.get("/products", protectRouteStaff, async (req, res) => {
    try {

        const products = await prisma.$queryRaw`
            SELECT
                id,
                name,
                description,
                price,
                "inStock",
                "createdAt",
                "updatedAt"
            FROM "Product"
            ORDER BY "createdAt" DESC;
        `;

        res.status(200).json({
            success: true,
            products
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to load products."
        });
    }
});



router.get("/products/menu",protectRoute, async (req, res) => {
    try {

        const products = await prisma.$queryRaw`
            SELECT
                id,
                name,
                description,
                price,
                "inStock",
                "createdAt",
                "updatedAt"
            FROM "Product"
            ORDER BY "createdAt" DESC;
        `;

        res.status(200).json({
            success: true,
            products
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to load products."
        });
    }
});


router.post("/products", protectRouteStaff, async (req, res) => {
    try {

        if (req.user.role !== "staff") {
            return res.status(403).json({
                message: "Only staff can add products."
            });
        }

        const { name, description, price } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({
                message: "Product name is required."
            });
        }

        if (price == null || isNaN(price) || Number(price) < 0) {
            return res.status(400).json({
                message: "Invalid price."
            });
        }

        const productName = name.trim();

        // Check if product already exists (case-insensitive)
        const existingProduct = await prisma.$queryRaw`
            SELECT id
            FROM "Product"
            WHERE LOWER(name) = LOWER(${productName})
            LIMIT 1;
        `;

        if (existingProduct.length > 0) {
            return res.status(409).json({
                message: "Product already exists."
            });
        }

        const [product] = await prisma.$queryRaw`
            INSERT INTO "Product"
            (
                "name",
                "description",
                "price",
                "createdAt",
                "updatedAt"
            )
            VALUES
            (
                ${productName},
                ${description?.trim() || null},
                ${Number(price)},
                NOW(),
                NOW()
            )
            RETURNING *;
        `;

        res.status(201).json({
            success: true,
            product
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create product."
        });
    }
});




router.patch("/products/:id/status", protectRouteStaff, async (req, res) => {
    try {

        if (req.user.role !== "staff") {
            return res.status(403).json({
                message: "Only staff can update products."
            });
        }

        const id = Number(req.params.id);
        const { inStock } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({
                message: "Invalid product id."
            });
        }

        if (typeof inStock !== "boolean") {
            return res.status(400).json({
                message: "inStock must be true or false."
            });
        }

        const [product] = await prisma.$queryRaw`
            UPDATE "Product"
            SET
                "inStock" = ${inStock},
                "updatedAt" = NOW()
            WHERE id = ${id}
            RETURNING *;
        `;

        if (!product) {
            return res.status(404).json({
                message: "Product not found."
            });
        }

        res.status(200).json({
            success: true,
            product
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to update product."
        });

    }
});

router.post("/pending", protectRoute, async (req, res) => {
    try {
        const { items } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: "No products selected."
            });
        }
        //validating the product
        for (const item of items) {

            if (
                !item.productId ||
                !Number.isInteger(item.quantity) ||
                item.quantity <= 0
            ) {
                return res.status(400).json({
                    message: "Invalid product or quantity."
                });
            }

            const product = await prisma.$queryRaw`
                SELECT
                    id,
                    "inStock"
                FROM "Product"
                WHERE id = ${item.productId}
                LIMIT 1;
            `;

            if (product.length === 0) {
                return res.status(404).json({
                    message: `Product ${item.productId} not found.`
                });
            }

            if (!product[0].inStock) {
                return res.status(400).json({
                    message: "One or more products are out of stock."
                });
            }
        }


        //creating pending orders
        const token = crypto.randomUUID();

        const studentId = req.user._id.toString();
        const rollNumber = req.user.roll;

        await prisma.$transaction(async (tx) => {

            // Delete previous pending order (if any)
            await tx.$executeRaw`
                DELETE FROM "PendingOrder"
                WHERE "rollNumber" = ${rollNumber};
            `;

            // Create PendingOrder
            const [pendingOrder] = await tx.$queryRaw`
                INSERT INTO "PendingOrder"
                (
                    "studentId",
                    "rollNumber",
                    "token",
                    "createdAt",
                    "updatedAt"
                )
                VALUES
                (
                    ${studentId},
                    ${rollNumber},
                    ${token},
                    NOW(),
                    NOW()
                )
                RETURNING *;
            `;

            // Insert every item
            for (const item of items) {

                await tx.$executeRaw`
                    INSERT INTO "PendingItem"
                    (
                        "pendingOrderId",
                        "productId",
                        "quantity"
                    )
                    VALUES
                    (
                        ${pendingOrder.id},
                        ${item.productId},
                        ${item.quantity}
                    );
                `;
            }

        });

        res.status(201).json({
            success: true,
            token
        });

        

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
});


router.get("/pending/:token", protectRouteStaff, async (req, res) => {
    try {

        const { token } = req.params;

        const pendingOrder = await prisma.$queryRaw`
            SELECT *
            FROM "PendingOrder"
            WHERE token = ${token}
            LIMIT 1;
        `;

        if (pendingOrder.length === 0) {
            return res.status(404).json({
                message: "Pending order not found."
            });
        }

        const items = await prisma.$queryRaw`
            SELECT
                pi."productId",
                p.name,
                p.description,
                p.price,
                pi.quantity
            FROM "PendingItem" pi
            JOIN "Product" p
                ON p.id = pi."productId"
            WHERE pi."pendingOrderId" = ${pendingOrder[0].id}
            ORDER BY p.name;
        `;

        //calculting the total
        let totalAmount = 0;

        const formattedItems = items.map(item => {

            const subtotal = item.price * item.quantity;

            totalAmount += subtotal;

            return {
                productId: item.productId,
                name: item.name,
                description: item.description,
                price: item.price,
                quantity: item.quantity,
                subtotal
            };

        });


        const student = await User.findById(
            pendingOrder[0].studentId
        ).select(
            "name roll branch phone profile_pic_url"
        );

        if (!student) {
            return res.status(404).json({
                message: "Student not found."
            });
        }

        res.status(200).json({
            success: true,
            student,
            items: formattedItems,
            totalAmount
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }
});

router.get("/pending/students/:token", protectRoute, async(req, res)=>{
    try {

        const { token } = req.params;

        const pendingOrder = await prisma.$queryRaw`
            SELECT id
            FROM "PendingOrder"
            WHERE token = ${token}
            LIMIT 1;
        `;

        return res.status(200).json({
            success: true,
            completed: pendingOrder.length === 0
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }
})

router.post("/purchases", protectRouteStaff, async (req, res) => {
    try {

        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                message: "Token is required."
            });
        }

        const pendingOrder = await prisma.$queryRaw`
            SELECT *
            FROM "PendingOrder"
            WHERE token = ${token}
            LIMIT 1;
        `;

        if (pendingOrder.length === 0) {
            return res.status(404).json({
                message: "Pending order not found."
            });
        }

        const items = await prisma.$queryRaw`
            SELECT
                pi."productId",
                pi.quantity,
                p.price,
                p."inStock"
            FROM "PendingItem" pi
            JOIN "Product" p
                ON p.id = pi."productId"
            WHERE pi."pendingOrderId" = ${pendingOrder[0].id};
        `;

        if (items.length === 0) {
            return res.status(400).json({
                message: "Pending order is empty."
            });
        }

        //validating items again
        let totalAmount = 0;

        for (const item of items) {

            if (!item.inStock) {
                return res.status(400).json({
                    message: "One or more products are now out of stock."
                });
            }

            totalAmount += item.price * item.quantity;
        }

        let purchase;
        //transactions
        await prisma.$transaction(async (tx) => {
            //creating the purchase items:
            [purchase] = await tx.$queryRaw`
                INSERT INTO "Purchase"
                (
                    "studentId",
                    "rollNumber",
                    "totalAmount",
                    "createdAt"
                )
                VALUES
                (
                    ${pendingOrder[0].studentId},
                    ${pendingOrder[0].rollNumber},
                    ${totalAmount},
                    NOW()
                )
                RETURNING *;
            `;

            //creating the purchase items
        for (const item of items) {

            await tx.$executeRaw`
                INSERT INTO "PurchaseItem"
                (
                    "purchaseId",
                    "productId",
                    "quantity",
                    "price"
                )
                VALUES
                (
                    ${purchase.id},
                    ${item.productId},
                    ${item.quantity},
                    ${item.price}
                );
            `;

        }

        await tx.$executeRaw`
            DELETE FROM "PendingOrder"
            WHERE id = ${pendingOrder[0].id};
        `;

        });

        

        res.status(201).json({
        success: true,
        purchaseId: purchase.id,
        totalAmount
    });
    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }
});

router.get("/purchases/history", protectRouteStaff, async (req, res) => {
    try {

        if (req.user.role !== "staff") {
            return res.status(403).json({
                message: "Only staff can view purchase history."
            });
        }

        const limit = Number(req.query.limit) || 50;

        // Get recent purchases
        const purchases = await prisma.$queryRaw`
            SELECT *
            FROM "Purchase"
            ORDER BY "createdAt" DESC
            LIMIT ${limit};
        `;

        if (purchases.length === 0) {
            return res.status(200).json({
                success: true,
                history: []
            });
        }

        // Get student details from MongoDB
        const ids = purchases.map(p => p.studentId);

        const students = await User.find({
            _id: { $in: ids }
        }).select("name roll branch");

        const studentMap = new Map(
            students.map(student => [
                student._id.toString(),
                student
            ])
        );

        const history = [];

        // Build response
        for (const purchase of purchases) {

            const items = await prisma.$queryRaw`
                SELECT
                    pr.name,
                    pi.quantity,
                    pi.price
                FROM "PurchaseItem" pi
                JOIN "Product" pr
                    ON pr.id = pi."productId"
                WHERE pi."purchaseId" = ${purchase.id};
            `;

            const student = studentMap.get(purchase.studentId);

            history.push({
                id: purchase.id,

                student: {
                    name: student?.name ?? "Unknown",
                    roll: student?.roll ?? purchase.rollNumber,
                    branch: student?.branch ?? ""
                },

                products: items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    subtotal: item.price * item.quantity
                })),

                totalAmount: purchase.totalAmount,

                createdAt: purchase.createdAt
            });
        }

        res.status(200).json({
            success: true,
            history
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load purchase history."
        });

    }
});

router.get("/purchases/history/student", protectRoute, async (req, res) => {
    try {

        const purchases = await prisma.$queryRaw`
            SELECT *
            FROM "Purchase"
            WHERE "studentId" = ${req.user._id.toString()}
            ORDER BY "createdAt" DESC;
        `;

        const history = [];

        for (const purchase of purchases) {

            const items = await prisma.$queryRaw`
                SELECT
                    pr.name,
                    pi.quantity,
                    pi.price
                FROM "PurchaseItem" pi
                JOIN "Product" pr
                    ON pr.id = pi."productId"
                WHERE pi."purchaseId" = ${purchase.id};
            `;

            history.push({
                id: purchase.id,
                totalAmount: purchase.totalAmount,
                createdAt: purchase.createdAt,

                products: items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    subtotal: item.price * item.quantity
                }))
            });
        }

        res.status(200).json({
            success: true,
            history
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load purchase history."
        });

    }
});



module.exports = router