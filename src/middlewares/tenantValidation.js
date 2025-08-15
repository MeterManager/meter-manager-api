const { body, param, query, validationResult } = require('express-validator');

const createTenantValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('location_id')
    .isInt({ min: 1 })
    .withMessage('Location ID must be a positive integer'),
  body('occupied_area')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Occupied area must be a positive number'),
  body('contact_person')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Contact person must not exceed 255 characters'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone must not exceed 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value'),
];

const updateTenantValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Tenant ID must be a positive integer'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('location_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Location ID must be a positive integer'),
  body('occupied_area')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Occupied area must be a positive number'),
  body('contact_person')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Contact person must not exceed 255 characters'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone must not exceed 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value'),
];

const getTenantByIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Tenant ID must be a positive integer'),
];

const getTenantsQueryValidation = [
  query('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value'),
  query('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name filter must be between 1 and 255 characters'),
  query('location_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Location ID must be a positive integer'),
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