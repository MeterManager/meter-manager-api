const meterTenantService = require('../services/meterTenantService');

const getAllMeterTenants = async (req, res) => {
  try {
    const filters = {};
    ['tenant_id', 'meter_id', 'assigned_from', 'assigned_to'].forEach((key) => {
      if (req.query[key] !== undefined) {
        filters[key] = req.query[key];
      }
    });

    const meterTenants = await meterTenantService.getAllMeterTenants(filters);

    res.json({
      success: true,
      data: meterTenants,
      count: meterTenants.length,
    });
  } catch (error) {
    console.error('Error in getAllMeterTenants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter tenants',
      error: error.message,
    });
  }
};

const getMeterTenantById = async (req, res) => {
  try {
    const { id } = req.params;
    const meterTenant = await meterTenantService.getMeterTenantById(id);

    res.json({
      success: true,
      data: meterTenant,
    });
  } catch (error) {
    const statusCode = error.message === 'MeterTenant not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const createMeterTenant = async (req, res) => {
  try {
    const meterTenant = await meterTenantService.createMeterTenant(req.body);

    res.status(201).json({
      success: true,
      message: 'MeterTenant created successfully',
      data: meterTenant,
    });
  } catch (error) {
    console.error('Error in createMeterTenant:', error);
    let statusCode = 500;
    if (error.message.includes('already assigned')) {
      statusCode = 409; 
    } else if (error.name === 'SequelizeValidationError') {
      statusCode = 400; 
    }
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const updateMeterTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const meterTenant = await meterTenantService.updateMeterTenant(id, req.body);

    res.json({
      success: true,
      message: 'MeterTenant updated successfully',
      data: meterTenant,
    });
  } catch (error) {
    console.error('Error in updateMeterTenant:', error);
    let statusCode = 500;
    if (error.message === 'MeterTenant not found') {
      statusCode = 404;
    } else if (error.message.includes('already assigned')) {
      statusCode = 409;
    } else if (error.name === 'SequelizeValidationError') {
      statusCode = 400;
    }
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteMeterTenant = async (req, res) => {
  try {
    const { id } = req.params;
    await meterTenantService.deleteMeterTenant(id);

    res.json({
      success: true,
      message: 'MeterTenant deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteMeterTenant:', error);
    const statusCode = error.message === 'MeterTenant not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllMeterTenants,
  getMeterTenantById,
  createMeterTenant,
  updateMeterTenant,
  deleteMeterTenant,
};
