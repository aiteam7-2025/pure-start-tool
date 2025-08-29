import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';

interface AirtableRecord {
  id: string;
  [key: string]: any;
}

interface AirtableConfig {
  baseId: string;
  tableId: string;
  viewId: string;
  hasApiKey: boolean;
}

const AirtableManager: React.FC = () => {
  const [config, setConfig] = useState<AirtableConfig | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');
  const [records, setRecords] = useState<AirtableRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [newRecord, setNewRecord] = useState('');
  const [searchField, setSearchField] = useState('');
  const [searchValue, setSearchValue] = useState('');

  // Test Airtable connection
  const testConnection = async () => {
    setConnectionStatus('testing');
    try {
      const response = await fetch('/api/airtable/test');
      const data = await response.json();
      
      if (data.success) {
        setConnectionStatus('connected');
        setConfig(data);
        toast.success('Airtable connection successful!');
      } else {
        setConnectionStatus('failed');
        toast.error('Airtable connection failed');
      }
    } catch (error) {
      setConnectionStatus('failed');
      toast.error('Error testing connection');
    }
  };

  // Get Airtable configuration
  const getConfig = async () => {
    try {
      const response = await fetch('/api/airtable/config');
      const data = await response.json();
      if (data.success) {
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  // Fetch all records
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/airtable/records');
      const data = await response.json();
      if (data.success) {
        setRecords(data.data);
        toast.success(`Fetched ${data.data.length} records`);
      }
    } catch (error) {
      toast.error('Error fetching records');
    } finally {
      setLoading(false);
    }
  };

  // Create new record
  const createRecord = async () => {
    if (!newRecord.trim()) {
      toast.error('Please enter record data');
      return;
    }

    try {
      let fields;
      try {
        fields = JSON.parse(newRecord);
      } catch {
        toast.error('Invalid JSON format');
        return;
      }

      const response = await fetch('/api/airtable/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Record created successfully!');
        setNewRecord('');
        fetchRecords(); // Refresh the list
      } else {
        toast.error('Error creating record');
      }
    } catch (error) {
      toast.error('Error creating record');
    }
  };

  // Search records
  const searchRecords = async () => {
    if (!searchField.trim() || !searchValue.trim()) {
      toast.error('Please enter both field name and value');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/airtable/search?fieldName=${encodeURIComponent(searchField)}&value=${encodeURIComponent(searchValue)}`);
      const data = await response.json();
      if (data.success) {
        setRecords(data.data);
        toast.success(`Found ${data.data.length} matching records`);
      }
    } catch (error) {
      toast.error('Error searching records');
    } finally {
      setLoading(false);
    }
  };

  // Delete record
  const deleteRecord = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      const response = await fetch(`/api/airtable/records/${recordId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Record deleted successfully!');
        fetchRecords(); // Refresh the list
      } else {
        toast.error('Error deleting record');
      }
    } catch (error) {
      toast.error('Error deleting record');
    }
  };

  useEffect(() => {
    getConfig();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Airtable Manager</h1>
          <p className="text-muted-foreground">Manage your Airtable integration and records</p>
        </div>
        <Button onClick={testConnection} disabled={connectionStatus === 'testing'}>
          {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
        </Button>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Badge variant={connectionStatus === 'connected' ? 'default' : connectionStatus === 'failed' ? 'destructive' : 'secondary'}>
              {connectionStatus.toUpperCase()}
            </Badge>
            {config && (
              <div className="text-sm text-muted-foreground">
                Base: {config.baseId} | Table: {config.tableId} | View: {config.viewId}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      {config && (
        <Card>
          <CardHeader>
            <CardTitle>Airtable Configuration</CardTitle>
            <CardDescription>Your current Airtable setup</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <Label>Base ID</Label>
                <div className="font-mono bg-muted p-2 rounded">{config.baseId}</div>
              </div>
              <div>
                <Label>Table ID</Label>
                <div className="font-mono bg-muted p-2 rounded">{config.tableId}</div>
              </div>
              <div>
                <Label>View ID</Label>
                <div className="font-mono bg-muted p-2 rounded">{config.viewId}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Record */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Record</CardTitle>
          <CardDescription>Add a new record to your Airtable base</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="newRecord">Record Fields (JSON)</Label>
            <Textarea
              id="newRecord"
              placeholder='{"Name": "John Doe", "Email": "john@example.com"}'
              value={newRecord}
              onChange={(e) => setNewRecord(e.target.value)}
              rows={4}
            />
          </div>
          <Button onClick={createRecord} disabled={!newRecord.trim()}>
            Create Record
          </Button>
        </CardContent>
      </Card>

      {/* Search Records */}
      <Card>
        <CardHeader>
          <CardTitle>Search Records</CardTitle>
          <CardDescription>Find records by field value</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="searchField">Field Name</Label>
              <Input
                id="searchField"
                placeholder="Name"
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="searchValue">Field Value</Label>
              <Input
                id="searchValue"
                placeholder="John Doe"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={searchRecords} disabled={!searchField.trim() || !searchValue.trim()}>
              Search
            </Button>
            <Button onClick={fetchRecords} variant="outline">
              Show All Records
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Records Display */}
      <Card>
        <CardHeader>
          <CardTitle>Records</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `${records.length} records found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No records to display. Create a record or search for existing ones.
            </p>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <div key={record.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">ID: {record.id}</Badge>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteRecord(record.id)}
                    >
                      Delete
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {Object.entries(record).map(([key, value]) => {
                      if (key === 'id') return null;
                      return (
                        <div key={key}>
                          <Label className="text-xs text-muted-foreground">{key}</Label>
                          <div className="font-mono bg-muted p-2 rounded text-xs">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AirtableManager;
