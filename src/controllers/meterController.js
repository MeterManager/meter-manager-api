const meterService = require('../services/meterService');

const getAllMeters = async (req, res) => {
  try {
    const filters = {
      is_active: req.query.is_active,
      serial_number: req.query.serial_number,
      location_id: req.query.location_id,
      energy_resource_type_id: req.query.energy_resource_type_id,
    };

    const meters = await meterService.getAllMeters(filters);
    res.json({
      success: true,
      data: meters,
      count: meters.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meters',
      error: error.message,
    });
  }
};

const getMeterById = async (req, res) => {
  try {
    const { id } = req.params;
    const meter = await meterService.getMeterById(id);
    res.json({
      success: true,
      data: meter,
    });
  } catch (error) {
    const statusCode = error.message === 'Meter not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const getMeterDependencies = async (req, res) => {
  try {
    const { id } = req.params;
    const dependencies = await meterService.getMeterDependencies(id);

    res.json({
      success: true,
      data: dependencies,
      message:
        dependencies.active_meter_tenants > 0 || dependencies.deliveries > 0
          ? `This meter has ${dependencies.active_meter_tenants} active meter tenants and ${dependencies.deliveries} deliveries that will be affected`
          : 'No active dependent objects',
    });
  } catch (error) {
    const statusCode = error.message === 'Meter not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const createMeter = async (req, res) => {
  try {
    const meter = await meterService.createMeter(req.body);
    res.status(201).json({
      success: true,
      message: 'Meter created successfully',
      data: meter,
    });
  } catch (error) {
    const statusCode = error.message.includes('already exists') ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const updateMeter = async (req, res) => {
  try {
    const { id } = req.params;
    const meter = await meterService.updateMeter(id, req.body);

    let message = 'Meter updated successfully';
    if (req.body.is_active === false) {
      const dependencies = await meterService.getMeterDependencies(id);
      if (dependencies.active_meter_tenants === 0) {
        message += ' (no dependent objects affected)';
      } else {
        message += ` (deactivated ${dependencies.active_meter_tenants} meter tenants)`;
      }
    }

    res.json({
      success: true,
      message: message,
      data: meter,
    });
  } catch (error) {
    const statusCode = error.message === 'Meter not found' ? 404 : error.message.includes('already exists') ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteMeter = async (req, res) => {
  try {
    const { id } = req.params;
    const dependencies = await meterService.getMeterDependencies(id);
    await meterService.deleteMeter(id);

    let message = 'Meter deleted permanently';
    const deletedItems = [];
    if (dependencies.active_meter_tenants > 0) deletedItems.push(`${dependencies.active_meter_tenants} meter tenants`);
    if (dependencies.deliveries > 0) deletedItems.push(`${dependencies.deliveries} deliveries`);
    if (deletedItems.length > 0) message += ` (also deleted: ${deletedItems.join(', ')})`;

    res.json({
      success: true,
      message: message,
    });
  } catch (error) {
    const statusCode =
      error.message === 'Meter not found' ? 404 : error.message === 'Cannot delete active meter' ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllMeterTenants = async (req, res) => {
  try {
    const filters = {
      meter_id: req.query.meter_id,
      tenant_id: req.query.tenant_id,
      active_only: req.query.active_only,
    };

    const meterTenants = await meterService.getAllMeterTenants(filters);
    res.json({
      success: true,
      data: meterTenants,
      count: meterTenants.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter tenants',
      error: error.message,
    });
  }
};

const createMeterTenant = async (req, res) => {
  try {
    const meterTenant = await meterService.createMeterTenant(req.body);
    res.status(201).json({
      success: true,
      message: 'Meter tenant assignment created successfully',
      data: meterTenant,
    });
  } catch (error) {
    const statusCode =
      error.message.includes('already assigned') || error.message.includes('overlap')
        ? 409
        : error.message.includes('not found')
        ? 404
        : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteMeterTenant = async (req, res) => {
  try {
    const { id } = req.params;
    await meterService.deleteMeterTenant(id);
    res.json({
      success: true,
      message: 'Meter tenant assignment deleted permanently',
    });
  } catch (error) {
    const statusCode = error.message === 'Meter tenant assignment not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const updateMeterTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const meterTenant = await meterService.updateMeterTenant(id, req.body);
    res.json({
      success: true,
      message: 'Meter tenant assignment updated successfully',
      data: meterTenant,
    });
  } catch (error) {
    const statusCode = error.message.includes('not found')
      ? 404
      : error.message.includes('inactive')
      ? 400
      : error.message.includes('overlap')
      ? 409
      : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllMeters,
  getMeterById,
  getMeterDependencies,
  createMeter,
  updateMeter,
  deleteMeter,
  getAllMeterTenants,
  createMeterTenant,
  deleteMeterTenant,
  updateMeterTenant,
};