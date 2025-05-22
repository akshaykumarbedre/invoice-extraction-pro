'use client';
import Navbar from '../components/Navbar';
import { useState, useRef } from 'react';
import { Upload, FileText, Server, Download, Trash2, Plus, Database, CheckCircle, AlertCircle, Loader2, Receipt, CreditCard, DollarSign } from 'lucide-react';
import EditableResultsTable from '../components/EditableResultsTable';

export default function BulkImageProcessing() {
  // State management
  const [schema, setSchema] = useState([]);
  const [files, setFiles] = useState([]);
  const [schemaId, setSchemaId] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('info'); // 'info', 'error', 'success'
  const [results, setResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDemoLoaded, setIsDemoLoaded] = useState(false);
  const fieldTypes = ['str', 'int', 'float', 'bool', 'List[str]'];
  
  // References
  const fileInputRef = useRef(null);
  
  // Demo invoice schema
  const demoSchema = [
    ['invoice_number', 'str', 'The unique identifier or number of the invoice'],
    ['invoice_date', 'str', 'The date when the invoice was issued'],
    ['due_date', 'str', 'The date by which payment is due'],
    ['total_amount', 'float', 'The total amount to be paid including tax'],
    ['tax_amount', 'float', 'The tax amount applied to the invoice'],
    ['vendor_name', 'str', 'The name of the vendor or supplier issuing the invoice'],
    ['vendor_address', 'str', 'The full address of the vendor/supplier'],
    ['client_name', 'str', 'The name of the client or customer receiving the invoice'],
    ['payment_terms', 'str', 'Terms and conditions for payment'],
    ['payment_method', 'str', 'The method of payment accepted']
  ];

  // Demo invoice file URLs (these would be local or accessible URLs)
  const demoFileUrls = [
    '/demo/invoice-sample-1.jpg',
    '/demo/invoice-sample-2.jpg',
    '/demo/invoice-sample-3.jpg'
  ];
  
  // Handle add field to schema
  const handleAddField = () => {
    setSchema([...schema, ['', 'str', '']]); // Default type to 'str'
  };

  // Handle field change in schema
  const handleFieldChange = (index, position, value) => {
    const newSchema = [...schema];
    newSchema[index][position] = value;
    setSchema(newSchema);
  };

  // Add new function for field deletion
  const handleDeleteField = (indexToDelete) => {
    setSchema(schema.filter((_, index) => index !== indexToDelete));
  };

  // Handle file selection change
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setStatus(`${selectedFiles.length} file(s) selected`);
    setStatusType('info');
  };
  
  // Trigger file input click
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Load demo schema 
  const loadDemoSchema = () => {
    setIsDemoLoaded(true);
    setSchema(demoSchema);
    setStatus('Demo schema loaded. Create the template to continue.');
    setStatusType('info');
  };

  // Load demo files
  const loadDemoFiles = async () => {
    if (!schemaId) {
      setStatus('Please create the template first before loading demo files');
      setStatusType('error');
      return;
    }
    
    try {
      setIsProcessing(true);
      setStatus('Loading demo invoice files...');
      setStatusType('info');
      
      // For a real implementation, you would fetch these files from your server
      // Here we're simulating the file loading with a timeout
      setTimeout(() => {
        // This is a mock implementation - in a real scenario,
        // you would actually fetch and load the files
        const mockFiles = [
          new File([''], 'invoice-sample-1.jpg', { type: 'image/jpeg' }),
          new File([''], 'invoice-sample-2.jpg', { type: 'image/jpeg' }),
          new File([''], 'invoice-sample-3.jpg', { type: 'image/jpeg' })
        ];
        
        setFiles(mockFiles);
        setStatus('Demo invoice files loaded. You can now upload them.');
        setStatusType('success');
        setIsProcessing(false);
      }, 1000);
      
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      setStatusType('error');
      setIsProcessing(false);
    }
  };

  // Create schema
  const createSchema = async () => {
    // Validate schema
    if (schema.length === 0) {
      setStatus('Please add at least one field to the schema');
      setStatusType('error');
      return;
    }
    
    const isValid = schema.every(field => field[0] && field[1]);
    if (!isValid) {
      setStatus('All fields must have a name and type');
      setStatusType('error');
      return;
    }
    
    try {
      setIsProcessing(true);
      setStatus('Creating schema...');
      setStatusType('info');
      
      const response = await fetch('http://localhost:5000/create_schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSchemaId(data.schema_id);
        setStatus('Schema created successfully');
        setStatusType('success');
      } else {
        setStatus(`Error: ${data.error}`);
        setStatusType('error');
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      setStatusType('error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Upload images
  const uploadImages = async () => {
    if (files.length === 0) {
      setStatus('Please select at least one image');
      setStatusType('error');
      return;
    }
    
    try {
      setIsProcessing(true);
      setStatus(`Uploading ${files.length} image(s)...`);
      setStatusType('info');
      
      const formData = new FormData();
      formData.append('schema_id', schemaId);
      files.forEach(file => formData.append('files[]', file));

      const response = await fetch('http://localhost:5000/upload_images', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        setJobId(data.job_id);
        setStatus('Images uploaded successfully');
        setStatusType('success');
      } else {
        setStatus(`Error: ${data.error}`);
        setStatusType('error');
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      setStatusType('error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Process images
  const processImages = async () => {
    try {
      setIsProcessing(true);
      setStatus('Processing images...');
      setStatusType('info');
      
      const response = await fetch('http://localhost:5000/process_images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResults(data.results);
        setStatus('Processing complete');
        setStatusType('success');
      } else {
        setStatus(`Error: ${data.error}`);
        setStatusType('error');
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      setStatusType('error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download results
  const downloadResults = () => {
    if (jobId) {
      window.location.href = `http://localhost:5000/download_excel/${jobId}`;
    }
  };

  // Cleanup
  const cleanup = async () => {
    if (!window.confirm("Are you sure you want to clean up? This will remove all data related to this job.")) {
      return;
    }
    
    try {
      setIsProcessing(true);
      setStatus('Cleaning up...');
      setStatusType('info');
      
      const response = await fetch('http://localhost:5000/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, schema_id: schemaId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus('Cleanup complete');
        setStatusType('success');
        setSchema([]);
        setFiles([]);
        setSchemaId(null);
        setJobId(null);
        setResults(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setStatus(`Error: ${data.error}`);
        setStatusType('error');
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      setStatusType('error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get status style
  const getStatusStyle = () => {
    switch (statusType) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-700';
      default:
        return 'bg-teal-50 border-teal-200 text-teal-700';
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    if (isProcessing) {
      return <Loader2 className="h-5 w-5 animate-spin text-teal-600" />;
    }
    
    switch (statusType) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gradient-to-b from-gray-50 to-teal-50 text-gray-900">
        {/* Header with title and demo buttons */}
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Batch Invoice Processing</h1>
          <div className="flex gap-2">
            <button
              onClick={loadDemoSchema}
              className="flex items-center gap-1 text-sm bg-teal-100 text-teal-800 px-3 py-1.5 rounded-md hover:bg-teal-200 transition-colors"
              disabled={isProcessing || isDemoLoaded}
            >
              <Receipt className="h-4 w-4" />
              <span>Load Demo Data</span>
            </button>
            <button
              onClick={cleanup}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <div className="container mx-auto p-4 md:p-6">
          {/* Demo Banner */}
          {isDemoLoaded && (
            <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-lg text-teal-800 flex items-start gap-3">
              <div className="rounded-full bg-teal-100 p-2 mt-1">
                <Receipt className="h-5 w-5 text-teal-700" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Demo Mode Active</h3>
                <p className="text-sm">
                  A demonstration invoice schema has been loaded. Follow these steps to test:
                </p>
                <ol className="text-sm list-decimal ml-4 mt-2 space-y-1">
                  <li>Click <strong>"Create Template"</strong> to create the schema</li>
                  <li>Use <strong>"Load Demo Files"</strong> button that will appear after creating the template</li>
                  <li>Click <strong>"Upload Files"</strong> to upload the demo invoices</li>
                  <li>Click <strong>"Extract Data"</strong> to process the invoices</li>
                </ol>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Schema Definition Panel */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
              <div className="bg-teal-50 p-4 border-b border-gray-200">
                <h2 className="font-medium text-gray-800">Step 1: Define Data Fields</h2>
                <p className="text-xs text-gray-500">Configure which information to extract from invoices</p>
              </div>
              
              <div className="p-4">
                {schema.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Receipt className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No fields added yet</p>
                    <div className="flex justify-center gap-2 mt-4">
                      <button 
                        onClick={handleAddField}
                        className="bg-teal-100 text-teal-700 px-4 py-2 rounded-lg hover:bg-teal-200 transition-colors"
                      >
                        Add First Field
                      </button>
                      <button 
                        onClick={loadDemoSchema}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Load Demo Schema
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="grid grid-cols-12 gap-2 mb-2 text-sm font-medium text-gray-600 px-2">
                      <div className="col-span-4">Field Name</div>
                      <div className="col-span-8">Description</div>
                    </div>
                    
                    {schema.map((field, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Field Name"
                          value={field[0]}
                          onChange={(e) => handleFieldChange(index, 0, e.target.value)}
                          className="col-span-4 border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                        <input
                          type="text"
                          placeholder="Description (optional)"
                          value={field[2]}
                          onChange={(e) => handleFieldChange(index, 2, e.target.value)}
                          className="col-span-7 border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                        <button
                          onClick={() => handleDeleteField(index)}
                          className="col-span-1 flex items-center justify-center text-red-500 hover:text-red-700 transition-colors"
                          title="Delete field"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-4">
                  <button 
                    onClick={handleAddField}
                    className="flex items-center gap-1 text-teal-600 hover:text-teal-800 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Field</span>
                  </button>
                  
                  <button
                    onClick={createSchema}
                    disabled={isProcessing || schema.length === 0}
                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 transition-colors text-white py-2 px-4 rounded-lg disabled:bg-teal-300"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4" />
                        <span>Create Template</span>
                      </>
                    )}
                  </button>
                </div>
                
                {schemaId && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg text-green-700 text-sm flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <div>
                      <strong>Template Created</strong>
                      <div className="text-xs">ID: {schemaId.substring(0, 10)}...</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Invoice Upload and Processing Panel */}
            <div className="flex flex-col gap-6">
              {/* File Upload Section */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                <div className="bg-teal-50 p-4 border-b border-gray-200">
                  <h2 className="font-medium text-gray-800">Step 2: Upload Invoices</h2>
                  <p className="text-xs text-gray-500">Select multiple invoice files for batch processing</p>
                </div>
                
                <div className="p-4">
                  <div 
                    onClick={triggerFileUpload}
                    className="mb-4 h-36 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-teal-400 transition-colors bg-gray-50"
                  >
                    <Receipt className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Click to upload invoice files</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG or PDF</p>
                  </div>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,application/pdf"
                    multiple
                    className="hidden"
                  />
                  
                  {/* Demo Files Button */}
                  {schemaId && isDemoLoaded && (
                    <button
                      onClick={loadDemoFiles}
                      disabled={isProcessing || files.length > 0}
                      className="w-full mb-4 flex items-center justify-center gap-2 bg-teal-100 hover:bg-teal-200 transition-colors text-teal-800 py-2 px-4 rounded-lg font-medium disabled:opacity-50"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Load Demo Files</span>
                    </button>
                  )}
                  
                  {files.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Selected Invoices</span>
                        <span className="text-xs text-gray-500">{files.length} file(s)</span>
                      </div>
                      <div className="max-h-24 overflow-y-auto">
                        {files.map((file, index) => (
                          <div key={index} className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                            <FileText className="h-3 w-3 text-gray-400" />
                            <span className="truncate">{file.name}</span>
                            <span className="text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={uploadImages}
                    disabled={isProcessing || !schemaId || files.length === 0}
                    className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 transition-colors text-white py-2 px-4 rounded-lg font-medium disabled:bg-teal-300"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>Upload Files</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Processing Section */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                <div className="bg-teal-50 p-4 border-b border-gray-200">
                  <h2 className="font-medium text-gray-800">Step 3: Process Invoices</h2>
                  <p className="text-xs text-gray-500">Extract data according to template</p>
                </div>
                
                <div className="p-4">
                  <button
                    onClick={processImages}
                    disabled={isProcessing || !jobId}
                    className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 transition-colors text-white py-2 px-4 rounded-lg font-medium disabled:bg-teal-300"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Server className="h-4 w-4" />
                        <span>Extract Data</span>
                      </>
                    )}
                  </button>
                  
                  {jobId && !results && (
                    <div className="mt-4 p-3 bg-teal-50 border border-teal-100 rounded-lg text-teal-700 text-sm flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                      <span>Job ready for processing (ID: {jobId.substring(0, 8)}...)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Results Section */}
          {results && (
            <div className="mt-6">
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 mb-4">
                <div className="bg-teal-50 p-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h2 className="font-medium text-gray-800">Extracted Invoice Data</h2>
                    <p className="text-xs text-gray-500">Review and export the processed data</p>
                  </div>
                  <button
                    onClick={downloadResults}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export to Excel</span>
                  </button>
                </div>
                <EditableResultsTable 
                  results={results} 
                  jobId={jobId}
                  onUpdate={(updatedResults) => setResults(updatedResults)}
                />
              </div>
            </div>
          )}
          
          {/* Status Bar */}
          {status && (
            <div className={`mt-6 p-4 rounded-lg border flex items-center gap-3 ${getStatusStyle()}`}>
              {getStatusIcon()}
              <span className="text-sm">{status}</span>
            </div>
          )}
        </div>
      </main>
      <footer className="py-4 border-t border-gray-200 bg-white mt-auto">
        <div className="container mx-auto px-4 text-center text-xs text-gray-500">
          © 2025 Invoice Extraction Pro. All rights reserved.
        </div>
      </footer>
    </div>
  );
}