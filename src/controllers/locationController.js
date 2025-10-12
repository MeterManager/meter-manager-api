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
    const location = await locationService.updateLocation(req.params.id, req.body);
    res.json({ success: true, message: 'Location updated successfully', data: location });
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
    await locationService.deleteLocation(id);

    res.json({
      success: true,
      message: 'Location deleted permanently',
    });
  } catch (error) {
    const statusCode =
      error.message === 'Location not found' ? 404 : error.message === 'Cannot delete active location' ? 400 : 500;

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
  createLocation,
  updateLocation,
  deleteLocation,
  assignTenant,
  unassignTenant,
};
