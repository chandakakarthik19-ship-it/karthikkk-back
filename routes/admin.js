const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Farmer = require('../models/Farmer');
const Work = require('../models/Work');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { authAdmin } = require('./middleware');

// Default route
router.get("/", (req, res) => {
  res.json({ message: "Admin API Working!" });
});

// Change admin password
router.post('/change-password', authAdmin, async (req, res)=>{
  const { username, currentPassword, newPassword } = req.body;
  const admin = await Admin.findOne({ username });
  if(!admin) return res.status(404).json({ error: 'Admin not found' });
  const ok = await admin.comparePassword(currentPassword);
  if(!ok) return res.status(401).json({ error: 'Current password incorrect' });
  admin.password = newPassword;
  await admin.save();
  res.json({ success: true });
});

// Create farmer
router.post('/farmers', upload.single('profile'), async (req, res)=>{
  const { name, phone } = req.body;
  let profileImage = null;
  if(req.file){
    profileImage = '/uploads/' + req.file.filename;
  }
  const f = new Farmer({ name, phone, profileImage });
  await f.save();
  res.json(f);
});

// List farmers
router.get('/farmers', authAdmin, async (req, res)=>{
  const list = await Farmer.find().sort({createdAt:-1});
  res.json(list);
});

// Delete farmer
router.delete('/farmers/:id', authAdmin, async (req, res)=>{
  await Farmer.findByIdAndDelete(req.params.id);
  await Work.deleteMany({ farmer: req.params.id });
  res.json({ success: true });
});

// Add work entry
router.post('/work', authAdmin, async (req, res)=>{
  let { farmerId, workType, minutes, ratePer60, notes, timeStr } = req.body;

  // Support "1.2" → 1 hour 20 minutes
  if(!minutes && timeStr){
    try{
      if(timeStr.includes(".")){
        let [h, m] = timeStr.split(".");
        if(m.length === 1) m = m + "0";
        minutes = Number(h) * 60 + Number(m);
      } else {
        minutes = Number(timeStr) || 0;
      }
    }catch(err){
      minutes = 0;
    }
  }

  const totalAmount = (minutes/60) * Number(ratePer60);
  const w = new Work({ farmer: farmerId, workType, minutes, ratePer60, totalAmount, notes });
  await w.save();
  res.json(w);
});

// Update work
router.put('/work/:id', authAdmin, async (req, res)=>{
  const { workType, minutes, ratePer60, paymentGiven, notes } = req.body;
  const totalAmount = (minutes/60) * Number(ratePer60);
  const updated = await Work.findByIdAndUpdate(
    req.params.id,
    { workType, minutes, ratePer60, totalAmount, paymentGiven, notes },
    { new: true }
  );
  res.json(updated);
});

// Delete work
router.delete('/work/:id', authAdmin, async (req, res)=>{
  await Work.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// List all work
router.get('/work', authAdmin, async (req, res)=>{
  const filter = {};
  if(req.query.farmerId) filter.farmer = req.query.farmerId;
  const list = await Work.find(filter).populate('farmer').sort({date:-1});
  res.json(list);
});

// Record payment
router.post('/payment/:farmerId', authAdmin, async (req, res)=>{
  const { amount, workId } = req.body;
  const farmer = await Farmer.findById(req.params.farmerId);
  if(!farmer) return res.status(404).json({ error: 'Farmer not found' });

  farmer.payments.push({ amount: Number(amount), workId: workId || undefined });
  await farmer.save();

  if(workId){
    const work = await Work.findById(workId);
    if(work){
      work.paymentGiven = (work.paymentGiven || 0) + Number(amount);
      await work.save();
    }
  }

  res.json({ success: true, farmer });
});

module.exports = router;
