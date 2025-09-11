const { body, param, query, validationResult } = require('express-validator');

const createMeterReadingValidation = [
    body('meter_tenant_id').isInt({ min: 1 }).withMessage('meter_tenant_id must be a positive integer'),
    body('reading_date').isISO8601().withMessage('reading_date must be a valid date (YYYY-MM-DD)'),
    body('current_reading').optional().isDecimal().withMessage('current_reading must be a decimal number'),
  
    body('consumption').optional().isDecimal().withMessage('consumption must be a decimal number'),
    body('total_consumption').optional().isDecimal().withMessage('total_consumption must be a decimal number'),
    body('total_cost').optional().isDecimal().withMessage('total_cost must be a decimal number'),
    body('direct_consumption').optional().isDecimal().withMessage('direct_consumption must be a decimal number'),
    body('area_based_consumption').optional().isDecimal().withMessage('area_based_consumption must be a decimal number'),
    
    body('calculation_method').trim().notEmpty().withMessage('calculation_method is required'),
  
    body('executor_name').optional().isLength({ max: 255 }).withMessage('executor_name must not exceed 255 characters'),
    body('tenant_representative').optional().isLength({ max: 255 }).withMessage('tenant_representative must not exceed 255 characters'),
  
  ];


const updateMeterReadingValidation = [
  param('id').isInt({ min: 1 }).withMessage('MeterReading ID must be a positive integer'),

  body('meter_tenant_id').optional().isInt({ min: 1 }).withMessage('meter_tenant_id must be a positive integer'),

  body('reading_date').optional().isISO8601().withMessage('reading_date must be a valid date'),

  body('current_reading').optional().isDecimal().withMessage('current_reading must be a decimal number'),

  body('direct_consumption').optional().isDecimal().withMessage('direct_consumption must be a decimal number'),

  body('area_based_consumption').optional().isDecimal().withMessage('area_based_consumption must be a decimal number'),

  body('calculation_method').optional().trim().notEmpty().withMessage('calculation_method cannot be empty'),

  body('executor_name').optional().isLength({ max: 255 }).withMessage('executor_name must not exceed 255 characters'),

  body('tenant_representative').optional().isLength({ max: 255 }).withMessage('tenant_representative must not exceed 255 characters'),
];

const getMeterReadingByIdValidation = [
  param('id').isInt({ min: 1 }).withMessage('MeterReading ID must be a positive integer'),
];

const getMeterReadingsQueryValidation = [
  query('meter_tenant_id').optional().isInt({ min: 1 }).withMessage('meter_tenant_id must be a positive integer'),

  query('reading_date').optional().isISO8601().withMessage('reading_date must be a valid date'),

  query('executor_name').optional().trim().isLength({ min: 1, max: 255 }).withMessage('executor_name must be between 1 and 255 chars'),
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
