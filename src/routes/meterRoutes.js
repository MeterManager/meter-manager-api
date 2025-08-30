const express = require('express');
const router = express.Router();
const meterController = require('../controllers/meterController');
const {
  createMeterValidation,
  updateMeterValidation,
  getMeterByIdValidation,
  getMetersQueryValidation,
  handleValidationErrors,
} = require('../middlewares/meterValidation');
const { checkJwt, checkRole } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Meter:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         serial_number:
 *           type: string
 *         location_id:
 *           type: integer
 *         energy_resource_type_id:
 *           type: integer
 *         is_active:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/meters:
 *   get:
 *     tags: [Meters]
 *     parameters:
 *       - name: is_active
 *         in: query
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - name: serial_number
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by serial number (partial match)
 *       - name: location_id
 *         in: query
 *         schema:
 *           type: integer
 *         description: Filter by location ID
 *       - name: energy_resource_type_id
 *         in: query
 *         schema:
 *           type: integer
 *         description: Filter by energy resource type ID
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Meter'
 *                 count:
 *                   type: integer
 */
router.get('/', checkJwt, getMetersQueryValidation, handleValidationErrors, meterController.getAllMeters);

/**
 * @swagger
 * /api/meters/{id}:
 *   get:
 *     tags: [Meters]
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
 *         description: Meter not found
 */
router.get('/:id', checkJwt, getMeterByIdValidation, handleValidationErrors, meterController.getMeterById);

/**
 * @swagger
 * /api/meters:
 *   post:
 *     tags: [Meters]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serial_number
 *               - location_id
 *               - energy_resource_type_id
 *             properties:
 *               serial_number:
 *                 type: string
 *                 maxLength: 100
 *               location_id:
 *                 type: integer
 *                 minimum: 1
 *               energy_resource_type_id:
 *                 type: integer
 *                 minimum: 1
 *               is_active:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Meter created successfully
 *       409:
 *         description: Meter with this serial number already exists
 */
router.post(
  '/',
  checkJwt,
  checkRole('admin'),
  createMeterValidation,
  handleValidationErrors,
  meterController.createMeter
);

/**
 * @swagger
 * /api/meters/{id}:
 *   put:
 *     tags: [Meters]
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
 *               serial_number:
 *                 type: string
 *                 maxLength: 100
 *               location_id:
 *                 type: integer
 *                 minimum: 1
 *               energy_resource_type_id:
 *                 type: integer
 *                 minimum: 1
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Meter updated successfully
 *       404:
 *         description: Meter not found
 *       409:
 *         description: Serial number already exists
 */
router.put(
  '/:id',
  checkJwt,
  checkRole('admin'),
  updateMeterValidation,
  handleValidationErrors,
  meterController.updateMeter
);

/**
 * @swagger
 * /api/meters/{id}:
 *   delete:
 *     description: Permanently deletes meter. Only inactive meters can be deleted.
 *     tags: [Meters]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Meter deleted permanently
 *       400:
 *         description: Cannot delete active meter
 *       404:
 *         description: Meter not found
 */
router.delete(
  '/:id',
  checkJwt,
  checkRole('admin'),
  getMeterByIdValidation,
  handleValidationErrors,
  meterController.deleteMeter
);

module.exports = router;
