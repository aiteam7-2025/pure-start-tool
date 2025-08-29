import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import AirtableService from '../services/airtable.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const airtableService = new AirtableService();

// Test Airtable connection
router.get('/test', async (req, res) => {
  try {
    const isConnected = await airtableService.testConnection();
    if (isConnected) {
      res.json({ 
        success: true, 
        message: 'Airtable connection successful',
        baseId: process.env.AIRTABLE_BASE_ID,
        tableId: process.env.AIRTABLE_TABLE_ID,
        viewId: process.env.AIRTABLE_VIEW_ID
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Airtable connection failed' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error testing Airtable connection',
      error: error.message 
    });
  }
});

// Get all records from a view
router.get('/records', [
  query('viewId').optional().isString(),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { viewId, pageSize, offset } = req.query;
    
    if (pageSize || offset) {
      const records = await airtableService.getRecordsPaginated(
        parseInt(pageSize) || 10,
        offset
      );
      res.json({ success: true, data: records });
    } else {
      const records = await airtableService.getRecords(viewId);
      res.json({ success: true, data: records });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching records',
      error: error.message 
    });
  }
});

// Get a single record by ID
router.get('/records/:recordId', [
  param('recordId').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recordId } = req.params;
    const record = await airtableService.getRecord(recordId);
    
    if (record) {
      res.json({ success: true, data: record });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Record not found' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching record',
      error: error.message 
    });
  }
});

// Create a new record
router.post('/records', [
  body('fields').isObject().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fields } = req.body;
    const record = await airtableService.createRecord(fields);
    
    res.status(201).json({ 
      success: true, 
      message: 'Record created successfully',
      data: record 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error creating record',
      error: error.message 
    });
  }
});

// Update a record
router.put('/records/:recordId', [
  param('recordId').isString().notEmpty(),
  body('fields').isObject().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recordId } = req.params;
    const { fields } = req.body;
    
    const record = await airtableService.updateRecord(recordId, fields);
    
    res.json({ 
      success: true, 
      message: 'Record updated successfully',
      data: record 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating record',
      error: error.message 
    });
  }
});

// Delete a record
router.delete('/records/:recordId', [
  param('recordId').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recordId } = req.params;
    await airtableService.deleteRecord(recordId);
    
    res.json({ 
      success: true, 
      message: 'Record deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting record',
      error: error.message 
    });
  }
});

// Search records by field value
router.get('/search', [
  query('fieldName').isString().notEmpty(),
  query('value').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fieldName, value } = req.query;
    const records = await airtableService.searchRecords(fieldName, value);
    
    res.json({ 
      success: true, 
      data: records,
      searchCriteria: { fieldName, value }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error searching records',
      error: error.message 
    });
  }
});

// Get Airtable configuration info
router.get('/config', (req, res) => {
  res.json({
    success: true,
    config: {
      baseId: process.env.AIRTABLE_BASE_ID,
      tableId: process.env.AIRTABLE_TABLE_ID,
      viewId: process.env.AIRTABLE_VIEW_ID,
      hasApiKey: !!process.env.AIRTABLE_API_KEY
    }
  });
});

export default router;
