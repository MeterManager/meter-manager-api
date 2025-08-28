const express = require('express');
const router = express.Router();
const locationRoutes = require('./locationRoutes');
const testRoute = require('./testRoute');
const resourceTypeRoutes = require('./resourceTypeRoutes');
const resourceDeliveryRoutes = require('./resourceDeliveryRoutes');
const tenantRoutes = require('./tenantRoutes');

router.use('/locations', locationRoutes);
router.use('/test', testRoute);
router.use('/resource-types', resourceTypeRoutes);
router.use('/tenants', tenantRoutes);
router.use('/resource-deliveries', resourceDeliveryRoutes);

module.exports = router;
