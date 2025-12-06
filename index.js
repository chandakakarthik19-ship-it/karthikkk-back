const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB Error:', err));

// Models
const Admin = require('./models/Admin');

// Health check route
app.get('/', (req, res) => {
  res.send('🚀 Backend Server is Running Successfully!');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/farmer', require('./routes/farmer'));
app.use('/api/work', require('./routes/work'));

// Create default admin
(async () => {
  try {
    const count = await Admin.countDocuments();
    if (count === 0) {
      const admin = new Admin({ username: "admin", password: "admin123" });
      await admin.save();
      console.log("Default admin created: admin / admin123");
    }
  } catch (err) {
    console.error(err);
  }
})();

// Server start
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Server running on port", PORT));
