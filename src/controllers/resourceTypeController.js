const energyResourceTypeService = require('../services/resourceTypeService');

const getAllResourceTypes = async (req, res) => {
  try {
    const filters = {
      is_active: req.query.is_active,
      name: req.query.name,
    };

    const types = await energyResourceTypeService.getAllResourceTypes(filters);

    res.json({
      success: true,
      data: types,
      count: types.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resource types',
      error: error.message,
    });
  }
};

const getResourceTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const type = await energyResourceTypeService.getResourceTypeById(id);

    res.json({
      success: true,
      data: type,
    });
  } catch (error) {
    const statusCode = error.message === 'Resource type not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const createResourceType = async (req, res) => {
  try {
    const type = await energyResourceTypeService.createResourceType(req.body);

    res.status(201).json({
      success: true,
      message: 'Resource type created successfully',
      data: type,
    });
  } catch (error) {
    const statusCode = error.message.includes('already exists') ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const updateResourceType = async (req, res) => {
  try {
    const { id } = req.params;
    const type = await energyResourceTypeService.updateResourceType(id, req.body);

    res.json({
      success: true,
      message: 'Resource type updated successfully',
      data: type,
    });
  } catch (error) {
    let statusCode = 500;
    if (error.message === 'Resource type not found') {
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

const deleteResourceType = async (req, res) => {
  try {
    const { id } = req.params;
    await energyResourceTypeService.deleteResourceType(id);

    res.json({
      success: true,
      message: 'Resource type deleted permanently',
    });
  } catch (error) {
    const statusCode =
      error.message === 'Resource type not found' ? 404 : error.message.includes('Cannot delete active') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllResourceTypes,
  getResourceTypeById,
  createResourceType,
  updateResourceType,
  deleteResourceType,
};
