const { body, param, query, validationResult } = require('express-validator');

const createLocationValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 255 }),

  body('address').optional().trim().isLength({ max: 1000 }),

  body('tenant_id')
    .optional({ nullable: true })
    .custom((value) => value === null || Number.isInteger(value))
    .withMessage('tenant_id must be an integer or null'),

  body('is_active').optional().isBoolean(),
];

const updateLocationValidation = [
  param('id').isInt({ min: 1 }).withMessage('Location ID must be a positive integer'),

  body('name').optional().trim().isLength({ min: 2, max: 255 }),

  body('address').optional().trim().isLength({ max: 1000 }),

  body('tenant_id')
    .optional({ nullable: true })
    .custom((value) => value === null || Number.isInteger(value))
    .withMessage('tenant_id must be an integer or null'),

  body('is_active').optional().isBoolean(),
];

const getLocationByIdValidation = [
  param('id').isInt({ min: 1 }).withMessage('Location ID must be a positive integer')
];

const getLocationsQueryValidation = [
  query('is_active').optional().isBoolean(),
  query('name').optional().trim().isLength({ min: 1, max: 255 }),
];

const assignTenantValidation = [
  param('locationId').isInt({ min: 1 }),
  param('tenantId').isInt({ min: 1 }),
];

const unassignTenantValidation = [
  param('locationId').isInt({ min: 1 }),
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
  createLocationValidation,
  updateLocationValidation,
  getLocationByIdValidation,
  getLocationsQueryValidation,
  assignTenantValidation,
  unassignTenantValidation,
  handleValidationErrors,
};
