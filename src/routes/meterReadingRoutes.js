const express = require('express');
const router = express.Router();
const meterReadingController = require('../controllers/meterReadingController');
const {
  createMeterReadingValidation,
  updateMeterReadingValidation,
  getMeterReadingByIdValidation,
  getMeterReadingsQueryValidation,
  handleValidationErrors,
} = require('../middlewares/meterReadingValidation');
const { checkJwt, checkRole, logAuth } = require('../middlewares/authMiddleware');

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
 *     Tenant:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         location:
 *           $ref: '#/components/schemas/Location'
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
 *     MeterTenant:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         tenant:
 *           $ref: '#/components/schemas/Tenant'
 *         meter:
 *           $ref: '#/components/schemas/Meter'
 *     MeterReading:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         meter_tenant_id:
 *           type: integer
 *         reading_date:
 *           type: string
 *           format: date
 *         current_reading:
 *           type: number
 *         consumption:
 *           type: number
 *         direct_consumption:
 *           type: number
 *         area_based_consumption:
 *           type: number
 *         total_consumption:
 *           type: number
 *         total_cost:
 *           type: number
 *         calculation_method:
 *           type: string
 *         executor_name:
 *           type: string
 *         tenant_representative:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         created_by:
 *           type: integer
 *         meterTenant:
 *           $ref: '#/components/schemas/MeterTenant'
 */

/**
 * @swagger
 * /api/meter-readings:
 *   get:
 *     tags: [MeterReadings]
 *     parameters:
 *       - name: meter_tenant_id
 *         in: query
 *         schema:
 *           type: integer
 *       - name: reading_date
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: executor_name
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of meter readings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MeterReading'
 */
router.get(
  '/',
  checkJwt,
  getMeterReadingsQueryValidation,
  handleValidationErrors,
  meterReadingController.getAllReadings
);

/**
 * @swagger
 * /api/meter-readings/{id}:
 *   get:
 *     tags: [MeterReadings]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Meter reading by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MeterReading'
 *       404:
 *         description: Not found
 */
router.get(
  '/:id',
  checkJwt,
  getMeterReadingByIdValidation,
  handleValidationErrors,
  meterReadingController.getReadingById
);

/**
 * @swagger
 * /api/meter-readings:
 *   post:
 *     tags: [MeterReadings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MeterReading'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MeterReading'
 */
router.post(
  '/',
  checkJwt,
  logAuth,
  checkRole('admin'),
  createMeterReadingValidation,
  handleValidationErrors,
  meterReadingController.createReading
);

/**
 * @swagger
 * /api/meter-readings/{id}:
 *   put:
 *     tags: [MeterReadings]
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
 *             $ref: '#/components/schemas/MeterReading'
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MeterReading'
 */
router.put(
  '/:id',
  checkJwt,
  checkRole('admin'),
  updateMeterReadingValidation,
  handleValidationErrors,
  meterReadingController.updateReading
);

/**
 * @swagger
 * /api/meter-readings/{id}:
 *   delete:
 *     summary: Delete meter reading
 *     tags: [MeterReadings]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Meter reading deleted
 *       404:
 *         description: Not found
 */
router.delete(
  '/:id',
  checkJwt,
  checkRole('admin'),
  getMeterReadingByIdValidation,
  handleValidationErrors,
  meterReadingController.deleteReading
);

module.exports = router;
