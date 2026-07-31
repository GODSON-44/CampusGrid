const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadPic");
const cloudinary = require("../lib/cloudinary");
const protectRouteAdmin = require("../middleware/authAdmin.middleware");
const streamifier = require("streamifier");

router.post("/",protectRouteAdmin,upload.single("image"), async (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image uploaded."
            });
        }

        const streamUpload = () =>
            new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: "CampusGrid/students"
                    },
                    (error, result) => {
                        if (result) resolve(result);
                        else reject(error);
                    }
                );

                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });

        const result = await streamUpload();

        return res.status(200).json({
            success: true,
            imageUrl: result.secure_url
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Upload failed."
        });

    }
});

module.exports = router;