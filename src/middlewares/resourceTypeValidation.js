const { body, param, query, validationResult } = require('express-validator');

const createResourceTypeValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),

  body('unit')
    .trim()
    .notEmpty()
    .withMessage('Unit is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Unit must be between 1 and 50 characters'),

  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean value'),
];

const updateResourceTypeValidation = [
  param('id').isInt({ min: 1 }).withMessage('Resource Type ID must be a positive integer'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),

  body('unit')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Unit cannot be empty')
    .isLength({ min: 1, max: 50 })
    .withMessage('Unit must be between 1 and 50 characters'),

  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean value'),
];

const getResourceTypeByIdValidation = [
  param('id').isInt({ min: 1 }).withMessage('Resource Type ID must be a positive integer'),
];

const getResourceTypesQueryValidation = [
  query('is_active').optional().isBoolean().withMessage('is_active must be a boolean value'),

  query('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name filter must be between 1 and 255 characters'),
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
  createResourceTypeValidation,
  updateResourceTypeValidation,
  getResourceTypeByIdValidation,
  getResourceTypesQueryValidation,
  handleValidationErrors,
};
