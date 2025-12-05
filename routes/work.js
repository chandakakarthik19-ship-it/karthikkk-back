const express = require('express');
const router = express.Router();
const Work = require('../models/Work');

// public endpoint to get work list for a farmer by id (used by farmer login)
router.get('/farmer/:farmerId', async (req, res)=>{
  const list = await Work.find({ farmer: req.params.farmerId }).sort({date:-1});
  res.json(list);
});

module.exports = router;