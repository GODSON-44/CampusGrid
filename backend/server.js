const express = require("express");
const dotenv = require("dotenv");
const cookie = require("cookie-parser");
const authRoute = require("./routes/authRoute");
const uploadRoute = require("./routes/uploadRoute");
const connectDB = require("./lib/db");
const path = require("path");

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(cookie());

// app.use(express.static(path.join(__dirname, "../frontend")));

app.use("/api", authRoute);
app.use("/api/upload", uploadRoute);

app.use(express.static(path.join(__dirname, "frontend")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

const startServer = async () => {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
        console.log("Server running on port:", PORT);
    });
};

startServer();