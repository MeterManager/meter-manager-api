const express = require('express');
const router = express.Router();
const locationRoutes = require('./locationRoutes');
const testRoute = require('./testRoute');
const resourceTypeRoutes = require('./resourceTypeRoutes');
const resourceDeliveryRoutes = require('./resourceDeliveryRoutes');
const tariffRoutes = require('./tariffRoutes');
const tenantRoutes = require('./tenantRoutes');
const meterRoutes = require('./meterRoutes');
const meterTenantRoutes = require('./meterTenantRoutes');
const meterReadingRoutes = require('./meterReadingRoutes');
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');

router.use('/locations', locationRoutes);
router.use('/test', testRoute);
router.use('/resource-types', resourceTypeRoutes);
router.use('/tariffs', tariffRoutes);
router.use('/tenants', tenantRoutes);
router.use('/meters', meterRoutes);
router.use('/meter-tenants', meterTenantRoutes);
router.use('/meter-readings', meterReadingRoutes);
router.use('/resource-deliveries', resourceDeliveryRoutes);
router.use('/users', userRoutes);
router.use('/auth', authRoutes);

module.exports = router;
