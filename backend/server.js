const express = require("express")
const dotenv = require("dotenv")
const cookie = require("cookie-parser")
const authRoute = require("./routes/authRoute")
const uploadRoute = require("./routes/uploadRoute")
const connectDB = require("./lib/db")
const cors = require("cors")




dotenv.config()
const PORT = process.env.PORT||5000
const app = express()

app.use(
  cors({
    origin: [
      "http://localhost:5500",
      "http://localhost:5501",
      "http://127.0.0.1:5500", // Added to match your current frontend origin
      "https://campus-grid-two.vercel.app",
    ],
    credentials: true,
  })
);


app.use(express.json())
app.use(cookie())
console.log("NODE_ENV =", process.env.NODE_ENV);


app.use("/api", authRoute);
app.use("/api/upload", uploadRoute);




const startServer = async () => {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
        console.log("Server running on port:", PORT);
    });
};

startServer();