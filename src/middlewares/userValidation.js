const { body, param, query, validationResult } = require('express-validator');

const updateUserValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),

  body('full_name')
    .optional()
    .isString()
    .withMessage('Full name must be a string'),

  body('role')
    .optional()
    .isIn(['admin', 'manager', 'user'])
    .withMessage('Role must be one of: admin, manager, user'),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
];

const getUserByIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
];

const getUsersQueryValidation = [
  query('full_name')
    .optional()
    .isString()
    .withMessage('Full name must be a string'),

  query('role')
    .optional()
    .isIn(['admin', 'manager', 'user'])
    .withMessage('Role must be one of: admin, manager, user'),

  query('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
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
  updateUserValidation,
  getUserByIdValidation,
  getUsersQueryValidation,
  handleValidationErrors,
};
