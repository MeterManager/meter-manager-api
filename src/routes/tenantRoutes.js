const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/TenantController');
const {
  createTenantValidation,
  updateTenantValidation,
  getTenantByIdValidation,
  getTenantsQueryValidation,
  handleValidationErrors,
} = require('../middlewares/TenantValidation');
const { checkJwt, checkRole } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Tenant:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         location_id:
 *           type: integer
 *         occupied_area:
 *           type: number
 *         contact_person:
 *           type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *         is_active:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/tenants:
 *   get:
 *     tags: [Tenants]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', checkJwt, getTenantsQueryValidation, handleValidationErrors, tenantController.getAllTenants);

/**
 * @swagger
 * /api/tenants/{id}:
 *   get:
 *     tags: [Tenants]
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
router.get('/:id', checkJwt, getTenantByIdValidation, handleValidationErrors, tenantController.getTenantById);

/**
 * @swagger
 * /api/tenants:
 *   post:
 *     tags: [Tenants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - location_id
 *             properties:
 *               name:
 *                 type: string
 *               location_id:
 *                 type: integer
 *               occupied_area:
 *                 type: number
 *               contact_person:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
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
  createTenantValidation,
  handleValidationErrors,
  tenantController.createTenant
);

/**
 * @swagger
 * /api/tenants/{id}:
 *   put:
 *     tags: [Tenants]
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
 *               location_id:
 *                 type: integer
 *               occupied_area:
 *                 type: number
 *               contact_person:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
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
  updateTenantValidation,
  handleValidationErrors,
  tenantController.updateTenant
);

/**
 * @swagger
 * /api/tenants/{id}:
 *   delete:
 *     summary: Delete tenant (only inactive)
 *     description: Permanently deletes tenant. Only inactive tenants can be deleted.
 *     tags: [Tenants]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tenant deleted permanently
 *       400:
 *         description: Cannot delete active tenant
 *       404:
 *         description: Tenant not found
 */
router.delete(
  '/:id',
  checkJwt,
  checkRole('admin'),
  getTenantByIdValidation,
  handleValidationErrors,
  tenantController.deleteTenant
);

module.exports = router;
