const express = require('express');
const router = express.Router();
const locationRoutes = require('./locationRoutes');
const testRoute = require('./testRoute');
const resourceTypeRoutes = require('./resourceTypeRoutes');

router.use('/locations', locationRoutes);
router.use('/test', testRoute);
router.use('/resource-types', resourceTypeRoutes);

module.exports = router;
