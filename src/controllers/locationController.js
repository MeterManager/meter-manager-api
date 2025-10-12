const locationService = require('../services/locationService');

const getAllLocations = async (req, res) => {
  try {
    const filters = {
      is_active: req.query.is_active,
      name: req.query.name,
    };

    const locations = await locationService.getAllLocations(filters);

    res.json({
      success: true,
      data: locations,
      count: locations.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch locations',
      error: error.message,
    });
  }
};

const getLocationById = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await locationService.getLocationById(id);

    res.json({
      success: true,
      data: location,
    });
  } catch (error) {
    const statusCode = error.message === 'Location not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const getLocationDependencies = async (req, res) => {
  try {
    const { id } = req.params;
    const dependencies = await locationService.getLocationDependencies(id);
    
    res.json({
      success: true,
      data: dependencies,
      message: dependencies.active_meters > 0 
        ? `This location has ${dependencies.active_meters} active meters that will be deactivated`
        : 'No active dependent objects'
    });
  } catch (error) {
    const statusCode = error.message === 'Location not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const createLocation = async (req, res) => {
  try {
    const location = await locationService.createLocation(req.body);
    res.status(201).json({ success: true, message: 'Location created successfully', data: location });
  } catch (error) {
    res.status(error.message.includes('Invalid tenant_id') ? 400 :
               error.message.includes('already exists') ? 409 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await locationService.updateLocation(id, req.body);

    let message = 'Location updated successfully';
    if (req.body.is_active === false) {
      const dependencies = await locationService.getLocationDependencies(id);
      if (dependencies.active_meters === 0 && dependencies.deliveries === 0) {
        message += ' (no dependent objects affected)';
      } else {
        message += ` (deactivated ${dependencies.active_meters || 0} meters)`;
      }
    }

    res.json({
      success: true,
      message: message,
      data: location,
    });
  } catch (error) {
    res.status(error.message.includes('Invalid tenant_id') ? 400 :
               error.message.includes('Location not found') ? 404 :
               error.message.includes('already exists') ? 409 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const dependencies = await locationService.getLocationDependencies(id);
    
    await locationService.deleteLocation(id);

    let message = 'Location deleted permanently';
    const deletedItems = [];
    
    if (dependencies.active_meters > 0 || dependencies.deliveries > 0) {
      if (dependencies.active_meters > 0) deletedItems.push(`${dependencies.active_meters} meters`);
      if (dependencies.deliveries > 0) deletedItems.push(`${dependencies.deliveries} deliveries`);
      
      message += ` (also deleted: ${deletedItems.join(', ')})`;
    }

    res.json({
      success: true,
      message: message,
    });
  } catch (error) {
    let statusCode = 500;
    if (error.message === 'Location not found') {
      statusCode = 404;
    } else if (error.message.includes('Cannot delete active location')) {
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};
const assignTenant = async (req, res) => {
  try {
    const { locationId, tenantId } = req.params;
    const location = await locationService.assignTenant(locationId, tenantId);

    res.json({
      success: true,
      message: `Location ${locationId} assigned to Tenant ${tenantId}`,
      data: location,
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const unassignTenant = async (req, res) => {
  try {
    const { locationId } = req.params;
    const location = await locationService.unassignTenant(locationId);

    res.json({
      success: true,
      message: `Location ${locationId} unassigned from tenant`,
      data: location,
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  getAllLocations,
  getLocationById,
  getLocationDependencies,
  createLocation,
  updateLocation,
  deleteLocation,
  assignTenant,
  unassignTenant,
};