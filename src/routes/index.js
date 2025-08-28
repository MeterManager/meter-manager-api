const express = require('express');
const router = express.Router();
const locationRoutes = require('./locationRoutes');
const testRoute = require('./testRoute');
const resourceTypeRoutes = require('./resourceTypeRoutes');
const tenantRoutes = require('./tenantRoutes');
const meterRoutes = require('./meterRoutes');
const meterTenantRoutes = require('./meterTenantRoutes');

router.use('/locations', locationRoutes);
router.use('/test', testRoute);
router.use('/resource-types', resourceTypeRoutes);
router.use('/tenants', tenantRoutes);
router.use('/meters', meterRoutes);
router.use('/meter-tenants', meterTenantRoutes);

module.exports = router;
