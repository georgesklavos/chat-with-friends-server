const express = require('express');
const router = new express.Router();
const path = require('path');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    res.sendFile(path.join(__dirname + '../../../public/pages/index.html'));
  } catch (error) {
    res.status(404).json({ error: error.toString() });
  }
});

router.get('/signUp', async (req, res) => {
  try {
    res.sendFile(path.join(__dirname + '../../../public/pages/signUp.html'));
  } catch (error) {
    res.status(404).json({ error: error.toString() });
  }
});

router.get('/signIn', async (req, res) => {
  try {
    res.sendFile(path.join(__dirname + '../../../public/pages/signIn.html'));
  } catch (error) {
    res.status(404).json({ error: error.toString() });
  }
});
module.exports = router;
