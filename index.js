const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://Karthik:Admin123@cluster0.rqu1v4m.mongodb.net/tractor-tracker?retryWrites=true&w=majority";
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

mongoose.connect(MONGO_URI)
  .then(()=> console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connect error', err));

const Admin = require('./models/Admin');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const farmerRoutes = require('./routes/farmer');
const workRoutes = require('./routes/work');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/work', workRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> console.log('Server running on port', PORT));

// Create default admin if none exist
(async ()=>{
  try{
    const count = await Admin.countDocuments();
    if(count === 0){
      const a = new Admin({ username: 'admin', password: 'admin123' }); // password will be hashed in model
      await a.save();
      console.log('Created default admin -> username: admin password: admin123');
    }
  }catch(e){
    console.error(e);
  }
})();