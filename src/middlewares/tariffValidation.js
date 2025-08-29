const { body, param, query, validationResult } = require('express-validator');

const createTariffValidation = [
  body('location_id')
    .isInt({ min: 1 })
    .withMessage('Location ID must be a positive integer'),

  body('energy_resource_type_id')
    .isInt({ min: 1 })
    .withMessage('Energy Resource Type ID must be a positive integer'),

  body('price')
    .isDecimal({ decimal_digits: '1,4' })
    .withMessage('Price must be a decimal number with up to 4 decimal places'),

  body('valid_from')
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('valid_from must be a valid date in YYYY-MM-DD format'),

  body('valid_to')
    .optional()
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('valid_to must be a valid date in YYYY-MM-DD format'),
];

const updateTariffValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Tariff ID must be a positive integer'),

  body('location_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Location ID must be a positive integer'),

  body('energy_resource_type_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Energy Resource Type ID must be a positive integer'),

  body('price')
    .optional()
    .isDecimal({ decimal_digits: '1,4' })
    .withMessage('Price must be a decimal number with up to 4 decimal places'),

  body('valid_from')
    .optional()
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('valid_from must be a valid date in YYYY-MM-DD format'),

  body('valid_to')
    .optional()
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('valid_to must be a valid date in YYYY-MM-DD format'),
];

const getTariffByIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Tariff ID must be a positive integer'),
];

const getTariffsQueryValidation = [
  query('location_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Location ID must be a positive integer'),

  query('energy_resource_type_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Energy Resource Type ID must be a positive integer'),

  query('valid_from')
    .optional()
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('valid_from must be a valid date in YYYY-MM-DD format'),

  query('valid_to')
    .optional()
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('valid_to must be a valid date in YYYY-MM-DD format'),
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
  createTariffValidation,
  updateTariffValidation,
  getTariffByIdValidation,
  getTariffsQueryValidation,
  handleValidationErrors,
};
