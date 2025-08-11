const { body, param, query, validationResult } = require('express-validator');

const createLocationValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Address must not exceed 1000 characters'),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value')
];

const updateLocationValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Location ID must be a positive integer'),
  
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Address must not exceed 1000 characters'),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value')
];

const getLocationByIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Location ID must be a positive integer')
];

const getLocationsQueryValidation = [
  query('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value'),
  
  query('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name filter must be between 1 and 255 characters')
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  createLocationValidation,
  updateLocationValidation,
  getLocationByIdValidation,
  getLocationsQueryValidation,
  handleValidationErrors
};