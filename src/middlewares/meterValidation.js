const { body, param, query, validationResult } = require('express-validator');

// Meter validations
const createMeterValidation = [
  body('serial_number')
    .trim()
    .notEmpty()
    .withMessage('Serial number is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Serial number must be between 1 and 100 characters'),
  body('location_id').isInt({ min: 1 }).withMessage('Location ID must be a positive integer'),
  body('energy_resource_type_id').isInt({ min: 1 }).withMessage('Energy resource type ID must be a positive integer'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean value'),
];

const updateMeterValidation = [
  param('id').isInt({ min: 1 }).withMessage('Meter ID must be a positive integer'),
  body('serial_number')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Serial number cannot be empty')
    .isLength({ min: 1, max: 100 })
    .withMessage('Serial number must be between 1 and 100 characters'),
  body('location_id').optional().isInt({ min: 1 }).withMessage('Location ID must be a positive integer'),
  body('energy_resource_type_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Energy resource type ID must be a positive integer'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean value'),
];

const getMeterByIdValidation = [param('id').isInt({ min: 1 }).withMessage('Meter ID must be a positive integer')];

const getMetersQueryValidation = [
  query('is_active').optional().isBoolean().withMessage('is_active must be a boolean value'),
  query('serial_number')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Serial number filter must be between 1 and 100 characters'),
  query('location_id').optional().isInt({ min: 1 }).withMessage('Location ID must be a positive integer'),
  query('energy_resource_type_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Energy resource type ID must be a positive integer'),
];

// MeterTenant validations
const createMeterTenantValidation = [
  body('meter_id').isInt({ min: 1 }).withMessage('Meter ID must be a positive integer'),
  body('tenant_id').isInt({ min: 1 }).withMessage('Tenant ID must be a positive integer'),
  body('assigned_from').isISO8601().withMessage('Assigned from must be a valid date (YYYY-MM-DD)'),
  body('assigned_to')
    .optional()
    .isISO8601()
    .withMessage('Assigned to must be a valid date (YYYY-MM-DD)')
    .custom((value, { req }) => {
      if (value && req.body.assigned_from) {
        if (new Date(value) <= new Date(req.body.assigned_from)) {
          throw new Error('Assigned to date must be after assigned from date');
        }
      }
      return true;
    }),
];

const getMeterTenantByIdValidation = [
  param('id').isInt({ min: 1 }).withMessage('Meter tenant ID must be a positive integer'),
];

const getMeterTenantsQueryValidation = [
  query('meter_id').optional().isInt({ min: 1 }).withMessage('Meter ID must be a positive integer'),
  query('tenant_id').optional().isInt({ min: 1 }).withMessage('Tenant ID must be a positive integer'),
  query('active_only').optional().isBoolean().withMessage('active_only must be a boolean value'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

module.exports = {
  // Meter validations
  createMeterValidation,
  updateMeterValidation,
  getMeterByIdValidation,
  getMetersQueryValidation,

  // MeterTenant validations
  createMeterTenantValidation,
  getMeterTenantByIdValidation,
  getMeterTenantsQueryValidation,

  // Common
  handleValidationErrors,
};
