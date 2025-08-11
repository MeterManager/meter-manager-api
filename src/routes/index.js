const express = require('express');
const router = express.Router();
const locationRoutes = require('./locationRoutes');

router.use('/locations', locationRoutes);

module.exports = router;
