const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Farmer = require('../models/Farmer');
const Work = require('../models/Work');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { authAdmin } = require('./middleware');

// change admin password (requires current password)
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

// upload farmer profile image and create farmer
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

// list farmers
router.get('/farmers', authAdmin, async (req, res)=>{
  const list = await Farmer.find().sort({createdAt:-1});
  res.json(list);
});

// delete farmer
router.delete('/farmers/:id', authAdmin, async (req, res)=>{
  await Farmer.findByIdAndDelete(req.params.id);
  await Work.deleteMany({ farmer: req.params.id });
  res.json({ success: true });
});

// add work entry
router.post('/work', authAdmin, async (req, res)=>{
  let { farmerId, workType, minutes, ratePer60, notes, timeStr } = req.body;
  // support timeStr like '1.2' meaning 1 hour 20 minutes (decimal part treated as minutes)
  if((typeof minutes === 'undefined' || minutes === null || minutes === '') && timeStr){
    try{
      const s = String(timeStr).trim();
      if(s.includes('.')){
        const parts = s.split('.');
        const h = Number(parts[0]) || 0;
        let mstr = parts[1] || '0';
        if(mstr.length === 1) mstr = mstr + '0';
        let m = Number(mstr);
        if(isNaN(m)) m = 0;
        const addHours = Math.floor(m/60);
        m = m % 60;
        minutes = h*60 + addHours*60 + m;
      } else {
        minutes = Number(s) || 0;
      }
    }catch(e){ minutes = Number(minutes) || 0 }
  }

  const totalAmount = (minutes/60) * Number(ratePer60 || 0);
  const w = new Work({ farmer: farmerId, workType, minutes, ratePer60, totalAmount, notes });
  await w.save();
  res.json(w);
});

// update work
router.put('/work/:id', authAdmin, async (req, res)=>{
  const { workType, minutes, ratePer60, paymentGiven, notes } = req.body;
  const totalAmount = (minutes/60) * Number(ratePer60 || 0);
  const w = await Work.findByIdAndUpdate(req.params.id, { workType, minutes, ratePer60, totalAmount, paymentGiven, notes }, { new: true });
  res.json(w);
});

// delete work
router.delete('/work/:id', authAdmin, async (req, res)=>{
  await Work.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// list all work entries
router.get('/work', authAdmin, async (req, res)=>{
  const filter = {};
  if(req.query.farmerId) filter.farmer = req.query.farmerId;
  const list = await Work.find(filter).populate('farmer').sort({date:-1});
  res.json(list);
});

/**
 * Record a payment for a farmer or optionally attach it to a specific work entry.
 * BODY: { amount: Number, workId: optional }
 */
router.post('/payment/:farmerId', authAdmin, async (req, res)=>{
  const { amount, workId } = req.body;
  const farmer = await Farmer.findById(req.params.farmerId);
  if(!farmer) return res.status(404).json({ error: 'Farmer not found' });
  farmer.payments = farmer.payments || [];
  farmer.payments.push({ amount: Number(amount), workId: workId || undefined });
  await farmer.save();

  // if workId provided, also increment the work's paymentGiven
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