const express = require('express');
const router = express.Router();
const locationRoutes = require('./locationRoutes');
const testRoute = require('./testRoute');
const resourceTypeRoutes = require('./resourceTypeRoutes');
const tariffRoutes = require('./tariffRoutes');
const tenantRoutes = require('./tenantRoutes');
const authRoutes = require('./authRoutes');

router.use('/locations', locationRoutes);
router.use('/test', testRoute);
router.use('/resource-types', resourceTypeRoutes);
router.use('/tariffs', tariffRoutes);
router.use('/tenants', tenantRoutes);
router.use('/auth', authRoutes);

module.exports = router;
