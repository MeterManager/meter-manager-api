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

const getResourceTypeDependencies = async (req, res) => {
  try {
    const { id } = req.params;
    const dependencies = await energyResourceTypeService.getResourceTypeDependencies(id);

    res.json({
      success: true,
      data: dependencies,
      message:
        dependencies.active_meters > 0 || dependencies.deliveries > 0
          ? `This resource type has ${dependencies.active_meters} active meters and ${dependencies.deliveries} deliveries that will be affected`
          : 'No active dependent objects',
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

    let message = 'Resource type updated successfully';
    if (req.body.is_active === false) {
      const dependencies = await energyResourceTypeService.getResourceTypeDependencies(id);
      if (dependencies.active_meters === 0) {
        message += ' (no dependent objects affected)';
      } else {
        message += ` (deactivated ${dependencies.active_meters} meters)`;
      }
    }

    res.json({
      success: true,
      message: message,
      data: type,
    });
  } catch (error) {
    const statusCode = error.message === 'Resource type not found' ? 404 : error.message.includes('already exists') ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteResourceType = async (req, res) => {
  try {
    const { id } = req.params;
    const dependencies = await energyResourceTypeService.getResourceTypeDependencies(id);
    await energyResourceTypeService.deleteResourceType(id);

    let message = 'Resource type deleted permanently';
    const deletedItems = [];
    if (dependencies.active_meters > 0) deletedItems.push(`${dependencies.active_meters} meters`);
    if (dependencies.deliveries > 0) deletedItems.push(`${dependencies.deliveries} deliveries`);
    if (deletedItems.length > 0) message += ` (also deleted: ${deletedItems.join(', ')})`;

    res.json({
      success: true,
      message: message,
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
  getResourceTypeDependencies,
  createResourceType,
  updateResourceType,
  deleteResourceType,
};