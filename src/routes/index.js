const express = require('express');
const router = express.Router();
const locationRoutes = require('./locationRoutes');
const testRoute = require('./testRoute');

router.use('/locations', locationRoutes);
router.use('/test', testRoute);

module.exports = router;
