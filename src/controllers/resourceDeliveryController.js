const resourceDeliveryService = require('../services/resourceDeliveryService');

const getAllResourceDeliveries = async (req, res) => {
  try {
    const deliveries = await resourceDeliveryService.getAllDeliveries(req.query);
    res.json({
      success: true,
      data: deliveries,
      count: deliveries.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deliveries',
      error: error.message,
    });
  }
};

const getResourceDeliveryById = async (req, res) => {
  try {
    const { id } = req.params;
    const delivery = await resourceDeliveryService.getDeliveryById(id);

    !delivery
      ? res.status(404).json({
          success: false,
          message: 'Delivery not found',
        })
      : res.json({
          success: true,
          data: delivery,
        });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createResourceDelivery = async (req, res) => {
  try {
    const delivery = await resourceDeliveryService.createResourceDelivery(req.body);

    res.status(201).json({
      success: true,
      message: 'Delivery created successfully',
      data: delivery,
    });
  } catch (error) {
    if (error.message.includes('Delivery not found'))
      return res.status(404).json({
        success: false,
        message: error.message,
      });

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateResourceDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const delivery = await resourceDeliveryService.updateResourceDelivery(id, req.body);

    res.json({
      success: true,
      message: 'Delivery updated successfully',
      data: delivery,
    });
  } catch (error) {
    if (error.message.includes('Delivery not found'))
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteResourceDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    await resourceDeliveryService.deleteResourceDelivery(id);

    res.json({
      success: true,
      message: 'Delivery deleted successfully',
    });
  } catch (error) {
    if (error.message.includes('Delivery not found'))
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllResourceDeliveries,
  getResourceDeliveryById,
  createResourceDelivery,
  updateResourceDelivery,
  deleteResourceDelivery,
};
