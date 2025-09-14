const { body, param, query, validationResult } = require('express-validator');

const createMeterReadingValidation = [
    body('meter_tenant_id').isInt({ min: 1 }).withMessage('meter_tenant_id must be a positive integer'),
    body('reading_date').isISO8601().withMessage('reading_date must be a valid date (YYYY-MM-DD)'),
    body('current_reading').optional().isDecimal().withMessage('current_reading must be a decimal number'),
    body('previous_reading').optional().isDecimal().withMessage('previous_reading must be a decimal number'),
    body('consumption').optional().isDecimal().withMessage('consumption must be a decimal number'),
    body('total_consumption').optional().isDecimal().withMessage('total_consumption must be a decimal number'),
    body('total_cost').optional().isDecimal().withMessage('total_cost must be a decimal number'),
    body('direct_consumption').optional().isDecimal().withMessage('direct_consumption must be a decimal number'),
    body('area_based_consumption').optional().isDecimal().withMessage('area_based_consumption must be a decimal number'),
    
    body('calculation_method')
      .trim()
      .notEmpty()
      .withMessage('calculation_method is required')
      .isIn(['direct', 'area_based', 'mixed'])
      .withMessage('calculation_method must be one of: direct, area_based, mixed'),

    body('rental_area')
      .optional()
      .isDecimal({ decimal_digits: '0,2' })
      .withMessage('rental_area must be a decimal number with up to 2 decimal places')
      .custom((value) => {
        if (value < 0) throw new Error('rental_area cannot be negative');
        return true;
      }),

    body('total_rented_area_percentage')
      .optional()
      .isDecimal({ decimal_digits: '0,2' })
      .withMessage('total_rented_area_percentage must be a decimal number')
      .custom((value) => {
        if (value < 0 || value > 100) throw new Error('total_rented_area_percentage must be between 0 and 100');
        return true;
      }),

    body('energy_consumption_coefficient')
      .optional()
      .isDecimal({ decimal_digits: '0,4' })
      .withMessage('energy_consumption_coefficient must be a decimal number with up to 4 decimal places')
      .custom((value) => {
        if (value <= 0) throw new Error('energy_consumption_coefficient must be positive');
        return true;
      }),

    body('calculation_coefficient')
      .optional()
      .isDecimal({ decimal_digits: '0,4' })
      .withMessage('calculation_coefficient must be a decimal number with up to 4 decimal places')
      .custom((value) => {
        if (value <= 0) throw new Error('calculation_coefficient must be positive');
        return true;
      }),

    body('executor_name').optional().trim().isLength({ max: 255 }).withMessage('executor_name must not exceed 255 characters'),

    body('tenant_representative').optional().trim().isLength({ max: 255 }).withMessage('tenant_representative must not exceed 255 characters'),
    body('notes').optional().trim().isLength({ max: 5000 }).withMessage('notes must not exceed 5000 characters'),
    body('act_number').optional().trim().isLength({ max: 100 }).withMessage('act_number must not exceed 100 characters'),
  ];


const updateMeterReadingValidation = [
  param('id').isInt({ min: 1 }).withMessage('MeterReading ID must be a positive integer'),

  body('meter_tenant_id').optional().isInt({ min: 1 }).withMessage('meter_tenant_id must be a positive integer'),

  body('reading_date').optional().isISO8601().withMessage('reading_date must be a valid date'),

  body('current_reading').optional().isDecimal().withMessage('current_reading must be a decimal number'),
  body('previous_reading').optional().isDecimal().withMessage('previous_reading must be a decimal number'),

  body('direct_consumption').optional().isDecimal().withMessage('direct_consumption must be a decimal number'),

  body('area_based_consumption').optional().isDecimal().withMessage('area_based_consumption must be a decimal number'),

  body('calculation_method').optional().trim().notEmpty().withMessage('calculation_method cannot be empty').isIn(['direct', 'area_based', 'mixed']).withMessage('calculation_method must be one of: direct, area_based, mixed'),

  body('rental_area')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('rental_area must be a decimal number')
    .custom((value) => {
      if (value < 0) throw new Error('rental_area cannot be negative');
      return true;
    }),

  body('total_rented_area_percentage')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('total_rented_area_percentage must be a decimal number')
    .custom((value) => {
      if (value < 0 || value > 100) throw new Error('total_rented_area_percentage must be between 0 and 100');
      return true;
    }),

  body('energy_consumption_coefficient')
    .optional()
    .isDecimal({ decimal_digits: '0,4' })
    .withMessage('energy_consumption_coefficient must be a decimal number')
    .custom((value) => {
      if (value <= 0) throw new Error('energy_consumption_coefficient must be positive');
      return true;
    }),

  body('calculation_coefficient')
    .optional()
    .isDecimal({ decimal_digits: '0,4' })
    .withMessage('calculation_coefficient must be a decimal number')
    .custom((value) => {
      if (value <= 0) throw new Error('calculation_coefficient must be positive');
      return true;
    }),

  body('executor_name').optional().trim().isLength({ max: 255 }).withMessage('executor_name must not exceed 255 characters'),

  body('tenant_representative').optional().trim().isLength({ max: 255 }).withMessage('tenant_representative must not exceed 255 characters'),
  body('notes').optional().trim().isLength({ max: 5000 }).withMessage('notes must not exceed 5000 characters'),
  body('act_number').optional().trim().isLength({ max: 100 }).withMessage('act_number must not exceed 100 characters'),
];

const getMeterReadingByIdValidation = [
  param('id').isInt({ min: 1 }).withMessage('MeterReading ID must be a positive integer'),
];

const getMeterReadingsQueryValidation = [
  query('meter_tenant_id').optional().isInt({ min: 1 }).withMessage('meter_tenant_id must be a positive integer'),

  query('reading_date').optional().isISO8601().withMessage('reading_date must be a valid date'),

  query('executor_name').optional().trim().isLength({ min: 1, max: 255 }).withMessage('executor_name must be between 1 and 255 characters'),

  query('act_number')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('act_number must be between 1 and 100 characters'),

  query('calculation_method')
    .optional()
    .isIn(['direct', 'area_based', 'mixed'])
    .withMessage('calculation_method must be one of: direct, area_based, mixed'),
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
  createMeterReadingValidation,
  updateMeterReadingValidation,
  getMeterReadingByIdValidation,
  getMeterReadingsQueryValidation,
  handleValidationErrors,
};
