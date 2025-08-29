const tariffService = require('../services/tariffService');

const getAllTariffs = async (req, res) => {
  try {
    const filters = {
      location_id: req.query.location_id,
      energy_resource_type_id: req.query.energy_resource_type_id,
      valid_from: req.query.valid_from,
      valid_to: req.query.valid_to,
    };

    const tariffs = await tariffService.getAllTariffs(filters);

    res.json({
      success: true,
      data: tariffs,
      count: tariffs.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tariffs',
      error: error.message,
    });
  }
};

const getTariffById = async (req, res) => {
  try {
    const { id } = req.params;
    const tariff = await tariffService.getTariffById(id);

    res.json({
      success: true,
      data: tariff,
    });
  } catch (error) {
    const statusCode = error.message === 'Tariff not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const createTariff = async (req, res) => {
  try {
    const tariff = await tariffService.createTariff(req.body);

    res.status(201).json({
      success: true,
      message: 'Tariff created successfully',
      data: tariff,
    });
  } catch (error) {
    let statusCode = 500;
    if (error.message.includes('Overlapping tariff period')) {
      statusCode = 409;
    }
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const updateTariff = async (req, res) => {
  try {
    const { id } = req.params;
    const tariff = await tariffService.updateTariff(id, req.body);

    res.json({
      success: true,
      message: 'Tariff updated successfully',
      data: tariff,
    });
  } catch (error) {
    let statusCode = 500;
    if (error.message === 'Tariff not found') {
      statusCode = 404;
    } else if (error.message.includes('overlaps')) {
      statusCode = 409;
    }

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteTariff = async (req, res) => {
  try {
    const { id } = req.params;
    await tariffService.deleteTariff(id);

    res.json({
      success: true,
      message: 'Tariff deleted permanently',
    });
  } catch (error) {
    const statusCode = error.message === 'Tariff not found' ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllTariffs,
  getTariffById,
  createTariff,
  updateTariff,
  deleteTariff,
};
