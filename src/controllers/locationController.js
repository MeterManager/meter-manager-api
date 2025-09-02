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

    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      data: location,
    });
  } catch (error) {
    const statusCode = error.message.includes('already exists') ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await locationService.updateLocation(id, req.body);

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: location,
    });
  } catch (error) {
    let statusCode = 500;
    if (error.message === 'Location not found') {
      statusCode = 404;
    } else if (error.message.includes('already exists')) {
      statusCode = 409;
    }

    res.status(statusCode).json({
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

module.exports = {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
};
