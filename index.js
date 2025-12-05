const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Static folder for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB connection
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://Karthik:Admin123@cluster0.rqu1v4m.mongodb.net/tractor-tracker?retryWrites=true&w=majority";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB Connect Error:", err));

// Default Home Route (Fixes ❗ Cannot GET /)
app.get("/", (req, res) => {
  res.send("🚀 Backend Server is Running Successfully!");
});

// Load Models
const Admin = require("./models/Admin");

// Import Routes
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const farmerRoutes = require("./routes/farmer");
const workRoutes = require("./routes/work");

// Register Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/farmer", farmerRoutes);
app.use("/api/work", workRoutes);

// Default Admin Creator
(async () => {
  try {
    const count = await Admin.countDocuments();
    if (count === 0) {
      const admin = new Admin({
        username: "admin",
        password: "admin123", // Will be hashed in model
      });
      await admin.save();
      console.log("Default admin created → username: admin | password: admin123");
    }
  } catch (err) {
    console.error("Admin creation error:", err);
  }
})();

// Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
