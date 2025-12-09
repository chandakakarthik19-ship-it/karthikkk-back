const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");

// -------------------------
// ADMIN LOGIN
// -------------------------
router.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Find admin
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(400).json({ error: "Invalid username" });
    }

    // 2. Compare password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // 3. Generate token
    const token = jwt.sign(
      {
        id: admin._id,
        role: "admin"
      },
      process.env.JWT_SECRET,
      { expiresIn: "5h" }
    );

    return res.json({ token });
  } catch (err) {
    console.error("Admin Login Error:", err);
    return res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
