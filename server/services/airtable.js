import Airtable from 'airtable';

class AirtableService {
  constructor() {
    this.base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY
    }).base(process.env.AIRTABLE_BASE_ID);
    
    this.table = this.base(process.env.AIRTABLE_TABLE_ID);
  }

  // Create a new record
  async createRecord(fields) {
    try {
      const record = await this.table.create([
        { fields }
      ]);
      return record[0];
    } catch (error) {
      console.error('Error creating Airtable record:', error);
      throw error;
    }
  }

  // Get all records from a view
  async getRecords(viewId = process.env.AIRTABLE_VIEW_ID) {
    try {
      const records = await this.table.select({
        view: viewId
      }).all();
      
      return records.map(record => ({
        id: record.id,
        ...record.fields
      }));
    } catch (error) {
      console.error('Error fetching Airtable records:', error);
      throw error;
    }
  }

  // Get a single record by ID
  async getRecord(recordId) {
    try {
      const record = await this.table.find(recordId);
      return {
        id: record.id,
        ...record.fields
      };
    } catch (error) {
      console.error('Error fetching Airtable record:', error);
      throw error;
    }
    }

  // Update a record
  async updateRecord(recordId, fields) {
    try {
      const record = await this.table.update([
        {
          id: recordId,
          fields
        }
      ]);
      return record[0];
    } catch (error) {
      console.error('Error updating Airtable record:', error);
      throw error;
    }
  }

  // Delete a record
  async deleteRecord(recordId) {
    try {
      const record = await this.table.destroy([recordId]);
      return record[0];
    } catch (error) {
      console.error('Error deleting Airtable record:', error);
      throw error;
    }
  }

  // Search records by field value
  async searchRecords(fieldName, value) {
    try {
      const records = await this.table.select({
        filterByFormula: `{${fieldName}} = '${value}'`
      }).all();
      
      return records.map(record => ({
        id: record.id,
        ...record.fields
      }));
    } catch (error) {
      console.error('Error searching Airtable records:', error);
      throw error;
    }
  }

  // Get records with pagination
  async getRecordsPaginated(pageSize = 10, offset = null) {
    try {
      const options = {
        pageSize,
        ...(offset && { offset })
      };
      
      const records = await this.table.select(options).all();
      return records.map(record => ({
        id: record.id,
        ...record.fields
      }));
    } catch (error) {
      console.error('Error fetching paginated Airtable records:', error);
      throw error;
    }
  }

  // Test connection
  async testConnection() {
    try {
      const records = await this.table.select({
        maxRecords: 1
      }).all();
      return true;
    } catch (error) {
      console.error('Airtable connection test failed:', error);
      return false;
    }
  }
}

export default AirtableService;
