const { body, param, query, validationResult } = require('express-validator');

const createTenantValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),

  body('location_ids')
    .optional()
    .isArray({ min: 1 })
    .withMessage('location_ids must be an array of IDs')
    .bail()
    .custom((arr) => arr.every(Number.isInteger))
    .withMessage('All location_ids must be integers'),

  body('occupied_area').optional().isFloat({ min: 0 }).withMessage('Occupied area must be a positive number'),
  body('contact_person').optional().trim().isLength({ max: 255 }),
  body('phone').optional().trim().isLength({ max: 50 }),
  body('email').optional().isEmail(),
  body('is_active').optional().isBoolean(),
];

const updateTenantValidation = [
  param('id').isInt({ min: 1 }).withMessage('Tenant ID must be a positive integer'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 2, max: 255 }),

  body('location_ids')
    .optional()
    .isArray()
    .withMessage('location_ids must be an array')
    .bail()
    .custom((arr) => arr.every(Number.isInteger))
    .withMessage('All location_ids must be integers'),

  body('occupied_area').optional().isFloat({ min: 0 }),
  body('contact_person').optional().trim().isLength({ max: 255 }),
  body('phone').optional().trim().isLength({ max: 50 }),
  body('email').optional().isEmail(),
  body('is_active').optional().isBoolean(),
];

const getTenantByIdValidation = [
  param('id').isInt({ min: 1 }).withMessage('Tenant ID must be a positive integer')
];

const getTenantsQueryValidation = [
  query('is_active').optional().isBoolean(),
  query('name').optional().trim().isLength({ min: 1, max: 255 }),
  query('location_id').optional().isInt({ min: 1 }), 
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
  createTenantValidation,
  updateTenantValidation,
  getTenantByIdValidation,
  getTenantsQueryValidation,
  handleValidationErrors,
};
