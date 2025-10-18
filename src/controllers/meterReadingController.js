const meterReadingService = require('../services/meterReadingService');
const getAllReadings = async (req, res) => {
  try {
    const filters = {
      meter_tenant_id: req.query.meter_tenant_id,
      reading_date: req.query.reading_date,
      executor_name: req.query.executor_name,
    };

    const readings = await meterReadingService.getAllReadings(filters);

    // Convert Sequelize instances to plain objects
    const plainReadings = Array.isArray(readings) 
      ? readings.map(r => r.toJSON ? r.toJSON() : r)
      : readings;

    res.json({
      success: true,
      data: plainReadings,
      count: plainReadings.length,
    });
  } catch (error) {
    console.error('Error in getAllReadings controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter readings',
      error: error.message,
    });
  }
};

const getReadingById = async (req, res) => {
  try {
    const { id } = req.params;
    const reading = await meterReadingService.getReadingById(id);

    res.json({
      success: true,
      data: reading,
    });
  } catch (error) {
    const statusCode = error.message === 'Meter reading not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const createReading = async (req, res) => {
  try {
    const reading = await meterReadingService.createReading(req.body);

    res.status(201).json({
      success: true,
      message: 'Meter reading created successfully',
      data: reading,
    });
  } catch (error) {
    const statusCode =
      error.message.includes('already exists') || error.message.includes('not found')
        ? 400
        : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const updateReading = async (req, res) => {
  try {
    const { id } = req.params;
    const reading = await meterReadingService.updateReading(id, req.body);

    res.json({
      success: true,
      message: 'Meter reading updated successfully',
      data: reading,
    });
  } catch (error) {
    const statusCode = error.message === 'Meter reading not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteReading = async (req, res) => {
  try {
    const { id } = req.params;
    await meterReadingService.deleteReading(id);

    res.json({
      success: true,
      message: 'Meter reading deleted successfully',
    });
  } catch (error) {
    const statusCode = error.message === 'Meter reading not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const getReadingsSummary = async (req, res) => {
  try {
    const summary = await meterReadingService.getReadingsSummary(req.query);

    res.json({
      success: true,
      message: 'Meter readings summary fetched successfully',
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch readings summary',
      error: error.message,
    });
  }
};

module.exports = {
  getAllReadings,
  getReadingById,
  createReading,
  updateReading,
  deleteReading,
  getReadingsSummary, 
};
