const { body, param, query, validationResult } = require('express-validator');

const createResourceDeliveryValidation = [
  body('location_id')
    .notEmpty()
    .withMessage('location_id is required')
    .isInt({ min: 1 })
    .withMessage('location_id must be a positive integer'),

  body('energy_resource_type_id')
    .notEmpty()
    .withMessage('energy_resource_type_id is required')
    .isInt({ min: 1 })
    .withMessage('energy_resource_type_id must be a positive integer'),

  body('delivery_date')
    .notEmpty()
    .withMessage('delivery_date is required')
    .isISO8601()
    .withMessage('delivery_date must be a valid date'),

  body('quantity')
    .notEmpty()
    .withMessage('quantity is required')
    .isFloat({ min: 0 })
    .withMessage('quantity must be a positive number'),

  body('unit').notEmpty().withMessage('unit is required').isString().withMessage('unit must be a string'),

  body('price_per_unit').optional().isFloat({ min: 0 }).withMessage('price_per_unit must be a positive number'),

  body('total_cost').optional().isFloat({ min: 0 }).withMessage('total_cost must be a positive number'),

  body('supplier').optional().isString().withMessage('supplier must be a string'),
];

const updateResourceDeliveryValidation = [
  param('id').isInt({ min: 1 }).withMessage('Delivery ID must be a positive integer'),

  body('location_id').optional().isInt({ min: 1 }).withMessage('location_id must be a positive integer'),

  body('energy_resource_type_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('energy_resource_type_id must be a positive integer'),

  body('delivery_date').optional().isISO8601().withMessage('delivery_date must be a valid date'),

  body('quantity').optional().isFloat({ min: 0 }).withMessage('quantity must be a positive number'),

  body('unit').optional().isString().withMessage('unit must be a string'),

  body('price_per_unit').optional().isFloat({ min: 0 }).withMessage('price_per_unit must be a positive number'),

  body('total_cost').optional().isFloat({ min: 0 }).withMessage('total_cost must be a positive number'),

  body('supplier').optional().isString().withMessage('supplier must be a string'),
];

const getDeleteResourceDeliveryByIdValidation = [
  param('id').isInt({ min: 1 }).withMessage('Delivery ID must be a positive integer'),
];

const getResourceDeliveriesQueryValidation = [
  query('location_id').optional().isInt({ min: 1 }).withMessage('location_id must be a positive integer'),

  query('energy_resource_type_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('energy_resource_type_id must be a positive integer'),

  query('delivery_date').optional().isISO8601().withMessage('delivery_date must be a valid date'),
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
  createResourceDeliveryValidation,
  updateResourceDeliveryValidation,
  getDeleteResourceDeliveryByIdValidation,
  getResourceDeliveriesQueryValidation,
  handleValidationErrors,
};
