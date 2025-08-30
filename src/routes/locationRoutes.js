const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const {
  createLocationValidation,
  updateLocationValidation,
  getLocationByIdValidation,
  getLocationsQueryValidation,
  handleValidationErrors,
} = require('../middlewares/locationValidation');
const { checkJwt, checkRole } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Location:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         address:
 *           type: string
 *         is_active:
 *           type: boolean
 */

/**
 * @swagger
 * /api/locations:
 *   get:
 *     tags: [Locations]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', checkJwt, getLocationsQueryValidation, handleValidationErrors, locationController.getAllLocations);

/**
 * @swagger
 * /api/locations/{id}:
 *   get:
 *     tags: [Locations]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Not found
 */
router.get('/:id', checkJwt, getLocationByIdValidation, handleValidationErrors, locationController.getLocationById);

/**
 * @swagger
 * /api/locations:
 *   post:
 *     tags: [Locations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Created
 */
router.post(
  '/',
  checkJwt,
  checkRole('admin'),
  createLocationValidation,
  handleValidationErrors,
  locationController.createLocation
);

/**
 * @swagger
 * /api/locations/{id}:
 *   put:
 *     tags: [Locations]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated
 */
router.put(
  '/:id',
  checkJwt,
  checkRole('admin'),
  updateLocationValidation,
  handleValidationErrors,
  locationController.updateLocation
);

/**
 * @swagger
 * /api/locations/{id}:
 *   delete:
 *     summary: Delete location (only inactive)
 *     description: Permanently deletes location. Only inactive locations can be deleted.
 *     tags: [Locations]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Location deleted permanently
 *       400:
 *         description: Cannot delete active location
 *       404:
 *         description: Location not found
 */
router.delete(
  '/:id',
  checkJwt,
  checkRole('admin'),
  getLocationByIdValidation,
  handleValidationErrors,
  locationController.deleteLocation
);

module.exports = router;
