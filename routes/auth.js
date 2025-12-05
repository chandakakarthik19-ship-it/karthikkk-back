const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Farmer = require('../models/Farmer');

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// Admin login
router.post('/admin/login', async (req, res)=>{
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username });
  if(!admin) return res.status(401).json({ error: 'Invalid admin' });
  const ok = await admin.comparePassword(password);
  if(!ok) return res.status(401).json({ error: 'Invalid admin' });
  const token = jwt.sign({ id: admin._id, role: 'admin' }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token });
});

// Farmer register
router.post('/farmer/register', async (req, res)=>{
  const { name, phone, profileImage } = req.body;
  const f = new Farmer({ name, phone, profileImage });
  await f.save();
  res.json(f);
});

// Farmer login (simple by phone)
router.post('/farmer/login', async (req, res)=>{
  const { phone } = req.body;
  const f = await Farmer.findOne({ phone });
  if(!f) return res.status(404).json({ error: 'Farmer not found' });
  res.json({ farmer: f });
});

module.exports = router;