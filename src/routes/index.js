const express = require('express');
const router = express.Router();
const locationRoutes = require('./locationRoutes');
const testRoute = require('./testRoute');
const resourceTypeRoutes = require('./resourceTypeRoutes');
const resourceDeliveryRoutes = require('./resourceDeliveryRoutes');
const tariffRoutes = require('./tariffRoutes');
const tenantRoutes = require('./tenantRoutes');
<<<<<<< Updated upstream
const authRoutes = require('./authRoutes');
=======
const userRoute = require('./userRoutes');
>>>>>>> Stashed changes

router.use('/locations', locationRoutes);
router.use('/test', testRoute);
router.use('/resource-types', resourceTypeRoutes);
router.use('/tariffs', tariffRoutes);
router.use('/tenants', tenantRoutes);
router.use('/resource-deliveries', resourceDeliveryRoutes);
router.use('/users', userRoute);

router.use('/auth', authRoutes);


module.exports = router;
