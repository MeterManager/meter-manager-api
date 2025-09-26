const tenantService = require('../services/tenantService');

const getAllTenants = async (req, res) => {
  try {
    const filters = {
      is_active: req.query.is_active,
      name: req.query.name,
      location_id: req.query.location_id,
    };

    const tenants = await tenantService.getAllTenants(filters);
    res.json({
      success: true,
      data: tenants,
      count: tenants.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenants',
      error: error.message,
    });
  }
};

const getTenantById = async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await tenantService.getTenantById(id);
    res.json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    const statusCode = error.message === 'Tenant not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const getTenantDependencies = async (req, res) => {
  try {
    const { id } = req.params;
    const dependencies = await tenantService.getTenantDependencies(id);

    res.json({
      success: true,
      data: dependencies,
      message:
        dependencies.active_meter_tenants > 0
          ? `This tenant has ${dependencies.active_meter_tenants} active meter assignments that will be affected`
          : 'No active dependent objects',
    });
  } catch (error) {
    const statusCode = error.message === 'Tenant not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const createTenant = async (req, res) => {
  try {
    const tenant = await tenantService.createTenant(req.body);
    res.status(201).json({
      success: true,
      message: 'Tenant created successfully',
      data: tenant,
    });
  } catch (error) {
    const statusCode = error.message.includes('already exists') ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await tenantService.updateTenant(id, req.body);

    let message = 'Tenant updated successfully';
    if (req.body.is_active === false) {
      const dependencies = await tenantService.getTenantDependencies(id);
      if (dependencies.active_meter_tenants === 0) {
        message += ' (no dependent objects affected)';
      } else {
        message += ` (deactivated ${dependencies.active_meter_tenants} meter tenants)`;
      }
    }

    res.json({
      success: true,
      message: message,
      data: tenant,
    });
  } catch (error) {
    const statusCode =
      error.message === 'Tenant not found' ? 404 : error.message.includes('already exists') ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const dependencies = await tenantService.getTenantDependencies(id);
    await tenantService.deleteTenant(id);

    let message = 'Tenant deleted permanently';
    if (dependencies.active_meter_tenants > 0) {
      message += ` (also deleted: ${dependencies.active_meter_tenants} meter tenants)`;
    }

    res.json({
      success: true,
      message: message,
    });
  } catch (error) {
    const statusCode =
      error.message === 'Tenant not found' ? 404 : error.message === 'Cannot delete active tenant' ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllTenants,
  getTenantById,
  getTenantDependencies,
  createTenant,
  updateTenant,
  deleteTenant,
};