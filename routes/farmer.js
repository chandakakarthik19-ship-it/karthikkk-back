const express = require('express');
const router = express.Router();
const Farmer = require('../models/Farmer');
const Work = require('../models/Work');
const PDFDocument = require('pdfkit');

// get farmer by id
router.get('/:id', async (req, res)=>{
  const f = await Farmer.findById(req.params.id);
  if(!f) return res.status(404).json({ error: 'Farmer not found' });
  res.json(f);
});

// get farmer work history
router.get('/:id/history', async (req, res)=>{
  const works = await Work.find({ farmer: req.params.id }).sort({date:-1});
  res.json(works);
});

// generate PDF of farmer history
router.get('/:id/history/pdf', async (req, res)=>{
  const farmer = await Farmer.findById(req.params.id);
  if(!farmer) return res.status(404).send('Farmer not found');
  const works = await Work.find({ farmer: req.params.id }).sort({date:-1});
  const doc = new PDFDocument();
  res.setHeader('Content-Disposition', 'attachment; filename=history_'+(farmer.name||'farmer')+'.pdf');
  res.setHeader('Content-Type', 'application/pdf');
  doc.fontSize(18).text('Farmer Work History', {align:'center'});
  doc.moveDown();
  doc.fontSize(12).text('Name: ' + (farmer.name || ''));
  doc.text('Phone: ' + (farmer.phone || ''));
  doc.moveDown();
  works.forEach(w=>{
    doc.text(`Date: ${w.date.toISOString().slice(0,10)} | Type: ${w.workType} | Minutes: ${w.minutes} | Rate/60: ${w.ratePer60} | Total: ${w.totalAmount} | Paid: ${w.paymentGiven}`);
    doc.moveDown(0.2);
  });
  doc.end();
  doc.pipe(res);
});

module.exports = router;