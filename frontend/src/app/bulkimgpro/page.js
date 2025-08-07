'use client';
import Navbar from '../components/Navbar';
import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Server, Download, Trash2, Plus, Database, CheckCircle, AlertCircle, 
         Loader2, Receipt, ArrowRight, ChevronRight, X, Edit3, Save, Settings, Clock, RefreshCw } from 'lucide-react';
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
  const [activeStep, setActiveStep] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const fieldTypes = ['str', 'int', 'float', 'bool', 'List[str]'];
  
  // References
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  
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

  // Demo invoice file URLs
  const demoFileUrls = [
    '/invoice-sample-1.jpg',
    '/invoice-sample-2.jpg',
    '/invoice-sample-3.jpg'
  ];
  
  // Check for completion of steps
  useEffect(() => {
    if (schemaId && !files.length) {
      setActiveStep(2);
    } else if (jobId && !results) {
      setActiveStep(3);
    } else if (results) {
      setActiveStep(4);
    }
  }, [schemaId, files, jobId, results]);

  // Show toast notification
  const displayToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };
  
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
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
    setStatus(`${selectedFiles.length} file(s) added`);
    setStatusType('success');
    displayToast(`${selectedFiles.length} file(s) added successfully`, 'success');
  };
  
  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('border-teal-400', 'bg-teal-50');
    }
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-teal-400', 'bg-teal-50');
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-teal-400', 'bg-teal-50');
    }
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prevFiles => [...prevFiles, ...droppedFiles]);
    setStatus(`${droppedFiles.length} file(s) added`);
    setStatusType('success');
    displayToast(`${droppedFiles.length} file(s) added successfully`, 'success');
  };
  
  // Remove file
  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
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
    displayToast('Demo schema loaded successfully', 'success');
  };

  // Load demo files
  const loadDemoFiles = async () => {
    if (!schemaId) {
      setStatus('Please create the template first before loading demo files');
      setStatusType('error');
      displayToast('Please create the template first', 'error');
      return;
    }
    
    try {
      setIsProcessing(true);
      setStatus('Loading demo invoice files...');
      setStatusType('info');
      
      // Actually fetch the demo files from the public folder
      const demoFiles = [];
      
      for (let i = 0; i < demoFileUrls.length; i++) {
        try {
          const response = await fetch(demoFileUrls[i]);
          const blob = await response.blob();
          const fileName = demoFileUrls[i].split('/').pop();
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          demoFiles.push(file);
        } catch (err) {
          console.error(`Error loading demo file ${demoFileUrls[i]}:`, err);
        }
      }
      
      if (demoFiles.length === 0) {
        throw new Error('Failed to load demo files');
      }
      
      setFiles(demoFiles);
      setStatus(`${demoFiles.length} demo invoice files loaded. You can now upload them.`);
      setStatusType('success');
      displayToast(`${demoFiles.length} demo files loaded successfully`, 'success');
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      setStatusType('error');
      displayToast(`Error: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Create schema
  const createSchema = async () => {
    // Validate schema
    if (schema.length === 0) {
      setStatus('Please add at least one field to the schema');
      setStatusType('error');
      displayToast('Please add at least one field', 'error');
      return;
    }
    
    const isValid = schema.every(field => field[0] && field[1]);
    if (!isValid) {
      setStatus('All fields must have a name and type');
      setStatusType('error');
      displayToast('All fields must have a name and type', 'error');
      return;
    }
    
    try {
      setIsProcessing(true);
      setStatus('Creating schema...');
      setStatusType('info');
      
      const response = await fetch('http://127.0.0.1:5000/create_schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSchemaId(data.schema_id);
        setStatus('Schema created successfully');
        setStatusType('success');
        setActiveStep(2);
        displayToast('Template created successfully!', 'success');
      } else {
        setStatus(`Error: ${data.error}`);
        setStatusType('error');
        displayToast(`Error: ${data.error}`, 'error');
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      setStatusType('error');
      displayToast(`Error: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Upload images
  const uploadImages = async () => {
    if (files.length === 0) {
      setStatus('Please select at least one image');
      setStatusType('error');
      displayToast('Please select at least one image', 'error');
      return;
    }
    
    try {
      setIsProcessing(true);
      setStatus(`Uploading ${files.length} image(s)...`);
      setStatusType('info');
      
      const formData = new FormData();
      formData.append('schema_id', schemaId);
      files.forEach(file => formData.append('files[]', file));

      const response = await fetch('http://127.0.0.1:5000/upload_images', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        setJobId(data.job_id);
        setStatus('Images uploaded successfully');
        setStatusType('success');
        setActiveStep(3);
        displayToast('Images uploaded successfully!', 'success');
      } else {
        setStatus(`Error: ${data.error}`);
        setStatusType('error');
        displayToast(`Error: ${data.error}`, 'error');
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      setStatusType('error');
      displayToast(`Error: ${error.message}`, 'error');
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
      
      const response = await fetch('http://127.0.0.1:5000/process_images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResults(data.results);
        setStatus('Processing complete');
        setStatusType('success');
        setActiveStep(4);
        displayToast('Data extraction completed!', 'success');
      } else {
        setStatus(`Error: ${data.error}`);
        setStatusType('error');
        displayToast(`Error: ${data.error}`, 'error');
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      setStatusType('error');
      displayToast(`Error: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download results
  const downloadResults = () => {
    if (jobId) {
      window.location.href = `http://127.0.0.1:5000/download_excel/${jobId}`;
      displayToast('Downloading Excel file...', 'success');
    }
  };

  // Cleanup
  const cleanup = async () => {
    if (!window.confirm("Are you sure you want to start over? This will clear all data and progress.")) {
      return;
    }
    
    try {
      setIsProcessing(true);
      setStatus('Resetting workspace...');
      setStatusType('info');
      
      const response = await fetch('http://127.0.0.1:5000/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, schema_id: schemaId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus('Workspace reset successfully');
        setStatusType('success');
        setSchema([]);
        setFiles([]);
        setSchemaId(null);
        setJobId(null);
        setResults(null);
        setActiveStep(1);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        displayToast('Workspace reset successfully', 'success');
      } else {
        setStatus(`Error: ${data.error}`);
        setStatusType('error');
        displayToast(`Error: ${data.error}`, 'error');
      }
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      setStatusType('error');
      displayToast(`Error: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get status style for notification bar
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

  // Get toast style
  const getToastStyle = () => {
    switch (toastType) {
      case 'error':
        return 'bg-red-500 text-white';
      case 'success':
        return 'bg-teal-600 text-white';
      default:
        return 'bg-teal-600 text-white';
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
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] font-sans">
      <Navbar />
      
      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 py-2 px-4 rounded-lg shadow-lg transition-all duration-300 flex items-center gap-2 max-w-md ${getToastStyle()} animate-fadeIn`}>
          {toastType === 'error' ? 
            <AlertCircle className="h-5 w-5" /> : 
            <CheckCircle className="h-5 w-5" />
          }
          <span>{toastMessage}</span>
          <button 
            onClick={() => setShowToast(false)}
            className="ml-2 text-white/80 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      <main className="flex-1 text-gray-800">
        {/* Header with title and actions */}
        <header className="bg-white border-b border-gray-100 py-5 shadow-sm">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Invoice Batch Processing</h1>
                <p className="text-sm text-gray-500 mt-1">Extract data from multiple invoices at once</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={loadDemoSchema}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm bg-teal-50 text-teal-700 rounded-xl border border-teal-100 hover:bg-teal-100 transition-all duration-200"
                  disabled={isProcessing || isDemoLoaded}
                >
                  <Receipt className="h-4 w-4" />
                  <span>Load Demo Data</span>
                </button>
                <button
                  onClick={cleanup}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Start Over</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Progress Steps */}
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
            <div className="flex items-center justify-between">
              {[
                { step: 1, title: "Define Fields" },
                { step: 2, title: "Upload Files" },
                { step: 3, title: "Process Data" },
                { step: 4, title: "Review Results" }
              ].map((item, index) => (
                <div key={index} className="flex items-center flex-1">
                  <div className={`flex flex-col items-center ${index > 0 ? 'ml-4' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      activeStep > item.step ? 'bg-teal-600 text-white' : 
                      activeStep === item.step ? 'bg-teal-100 text-teal-800 border-2 border-teal-600' : 
                      'bg-gray-100 text-gray-500 border border-gray-300'
                    } transition-all duration-200`}>
                      {activeStep > item.step ? <CheckCircle className="h-5 w-5" /> : item.step}
                    </div>
                    <span className={`text-xs mt-2 font-medium ${
                      activeStep >= item.step ? 'text-teal-800' : 'text-gray-500'
                    }`}>
                      {item.title}
                    </span>
                  </div>
                  
                  {index < 3 && (
                    <div className={`h-1 flex-1 mx-2 ${
                      activeStep > item.step ? 'bg-teal-600' : 'bg-gray-200'
                    } transition-all duration-300`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Demo Banner */}
          {isDemoLoaded && (
            <div className="mb-6 p-5 bg-teal-50 border border-teal-100 rounded-xl text-teal-800 flex items-start gap-4 animate-fadeIn">
              <div className="rounded-full bg-teal-100 p-2.5 mt-0.5 flex-shrink-0">
                <Receipt className="h-5 w-5 text-teal-700" />
              </div>
              <div>
                <h3 className="font-medium text-lg mb-1">Demo Mode Active</h3>
                <p className="text-sm leading-relaxed">
                  A sample invoice schema has been loaded to help you explore the system's capabilities.
                  Follow the workflow steps to see how batch processing works.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Content Area - Schema Builder (Step 1) */}
            {activeStep === 1 && (
              <div className="lg:col-span-12 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 animate-fadeIn">
                <div className="bg-white p-6 border-b border-gray-100">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="bg-teal-100 rounded-full p-2 text-teal-700">
                      <Settings className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">Define Extraction Fields</h2>
                  </div>
                  <p className="text-gray-500 ml-10">Specify what information you want to extract from your invoices</p>
                </div>
                
                <div className="p-6">
                  {schema.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">No Fields Added Yet</h3>
                      <p className="text-gray-500 max-w-md mx-auto mb-6">
                        Define which invoice data you want to extract, such as invoice number, 
                        date, amount, or vendor details.
                      </p>
                      <div className="flex justify-center gap-3">
                        <button 
                          onClick={handleAddField}
                          className="bg-teal-600 text-white px-5 py-2.5 rounded-xl hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add First Field</span>
                        </button>
                        <button 
                          onClick={loadDemoSchema}
                          className="bg-white text-gray-700 px-5 py-2.5 rounded-xl hover:bg-gray-50 border border-gray-200 transition-colors flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          <span>Load Demo Template</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <div className="flex justify-end mb-6">
                        <button 
                          onClick={handleAddField}
                          className="flex items-center gap-2 text-teal-600 hover:text-teal-800 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add Field</span>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-12 gap-3 mb-3 text-sm font-medium text-gray-600 px-2">
                        <div className="col-span-4">Field Name</div>
                        <div className="col-span-3">Data Type</div>
                        <div className="col-span-4">Description</div>
                        <div className="col-span-1"></div>
                      </div>
                      
                      {schema.map((field, index) => (
                        <div key={index} className="grid grid-cols-12 gap-3 mb-3 group">
                          <input
                            type="text"
                            placeholder="e.g. invoice_number"
                            value={field[0]}
                            onChange={(e) => handleFieldChange(index, 0, e.target.value)}
                            className="col-span-4 border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          />
                          <select
                            value={field[1]}
                            onChange={(e) => handleFieldChange(index, 1, e.target.value)}
                            className="col-span-3 border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                          >
                            {fieldTypes.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Optional description"
                            value={field[2]}
                            onChange={(e) => handleFieldChange(index, 2, e.target.value)}
                            className="col-span-4 border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          />
                          <button
                            onClick={() => handleDeleteField(index)}
                            className="col-span-1 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete field"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-100">
                    <button
                      onClick={createSchema}
                      disabled={isProcessing || schema.length === 0}
                      className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 transition-colors text-white py-3 px-6 rounded-xl disabled:bg-teal-300 shadow-sm"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Creating Template...</span>
                        </>
                      ) : (
                        <>
                          <Database className="h-5 w-5" />
                          <span>Create Template</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  {schemaId && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 flex items-center gap-3 animate-fadeIn">
                      <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                      <div>
                        <strong className="font-medium">Template Created Successfully</strong>
                        <div className="text-sm mt-0.5">Template ID: {schemaId}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* File Upload (Step 2) */}
            {activeStep === 2 && (
              <div className="lg:col-span-12 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 animate-fadeIn">
                <div className="bg-white p-6 border-b border-gray-100">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="bg-teal-100 rounded-full p-2 text-teal-700">
                      <Upload className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">Upload Invoice Files</h2>
                  </div>
                  <p className="text-gray-500 ml-10">Select invoice files for batch processing</p>
                </div>
                
                <div className="p-6">
                  <div 
                    ref={dropZoneRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerFileUpload}
                    className="mb-6 h-64 border-3 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-all duration-200 bg-gray-50 group"
                  >
                    <Upload className="h-16 w-16 text-gray-300 mb-4 group-hover:text-teal-500 transition-colors" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2 group-hover:text-teal-700 transition-colors">
                      Drag and drop files here
                    </h3>
                    <p className="text-gray-500 text-sm mb-4">or click to browse</p>
                    <span className="px-4 py-2 bg-white shadow-sm rounded-xl text-sm text-gray-600 border border-gray-200 group-hover:border-teal-200 transition-colors">
                      Select Files
                    </span>
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
                      className="w-full mb-6 flex items-center justify-center gap-2 bg-teal-100 hover:bg-teal-200 transition-colors text-teal-800 py-3 px-6 rounded-xl font-medium disabled:opacity-50"
                    >
                      <FileText className="h-5 w-5" />
                      <span>Load Demo Files</span>
                    </button>
                  )}
                  
                  {files.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-800">Selected Files</h3>
                        <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm">
                          {files.length} file(s)
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {files.map((file, index) => (
                          <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex items-center p-3 group">
                            <div className="bg-white p-2 rounded-lg">
                              <FileText className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="ml-3 flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(index);
                              }}
                              className="p-1.5 ml-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-white opacity-0 group-hover:opacity-100 transition-all"
                              title="Remove file"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-100">
                    <button
                      onClick={uploadImages}
                      disabled={isProcessing || !schemaId || files.length === 0}
                      className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 transition-colors text-white py-3 px-6 rounded-xl disabled:bg-teal-300 shadow-sm"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5" />
                          <span>Upload Files</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Process Data (Step 3) */}
            {activeStep === 3 && (
              <div className="lg:col-span-12 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 animate-fadeIn">
                <div className="bg-white p-6 border-b border-gray-100">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="bg-teal-100 rounded-full p-2 text-teal-700">
                      <Server className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">Process Invoices</h2>
                  </div>
                  <p className="text-gray-500 ml-10">Extract data from your uploaded invoices</p>
                </div>
                
                <div className="p-6">
                  <div className="text-center py-8 mb-6">
                    <Server className="h-16 w-16 text-teal-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                      Ready to Process {files.length} Invoice{files.length !== 1 ? 's' : ''}
                    </h3>
                    <p className="text-gray-500 max-w-lg mx-auto mb-8">
                      Our AI will extract information according to your template. 
                      This might take a few moments depending on the number of files.
                    </p>
                    
                    <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 max-w-md mx-auto mb-6 text-left">
                      <h4 className="flex items-center text-teal-800 font-medium mb-2">
                        <Receipt className="h-5 w-5 mr-2" />
                        Job Information
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-gray-600">Job ID:</div>
                        <div className="text-teal-800 font-medium">{jobId?.substring(0, 8)}...</div>
                        <div className="text-gray-600">Files Count:</div>
                        <div className="text-teal-800 font-medium">{files.length}</div>
                        <div className="text-gray-600">Template ID:</div>
                        <div className="text-teal-800 font-medium">{schemaId?.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <button
                      onClick={processImages}
                      disabled={isProcessing || !jobId}
                      className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 transition-colors text-white py-3 px-8 rounded-xl disabled:bg-teal-300 shadow-sm"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Server className="h-5 w-5" />
                          <span>Extract Data Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Results View (Step 4) */}
            {activeStep === 4 && results && (
              <div className="lg:col-span-12 animate-fadeIn">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mb-6">
                  <div className="bg-white p-6 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="bg-teal-100 rounded-full p-2 text-teal-700">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800">Extraction Results</h2>
                        <p className="text-gray-500 text-sm">Data extracted from {files.length} invoice(s)</p>
                      </div>
                    </div>
                    <button
                      onClick={downloadResults}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm transition-colors shadow-sm"
                    >
                      <Download className="h-4 w-4" />
                      <span>Export to Excel</span>
                    </button>
                  </div>
                  
                  <div className="p-6 pb-0 flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-800">
                      Extracted Data <span className="text-sm font-normal text-gray-500">({Object.keys(results).length} records)</span>
                    </h3>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Edit3 className="h-4 w-4" /> Click any cell to edit
                    </span>
                  </div>
                  
                  <EditableResultsTable 
                    results={results} 
                    jobId={jobId}
                    onUpdate={(updatedResults) => setResults(updatedResults)}
                  />
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="h-5 w-5" />
                    <span>Job completed successfully</span>
                  </div>
                  <button
                    onClick={cleanup}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Start New Batch</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Status Bar */}
          {status && !showToast && (
            <div className={`mt-6 p-4 rounded-xl border shadow-sm flex items-center gap-3 animate-fadeIn ${getStatusStyle()}`}>
              {getStatusIcon()}
              <span>{status}</span>
            </div>
          )}
        </div>
      </main>
      
      <footer className="py-6 text-center text-sm text-gray-500 border-t border-gray-100 mt-auto">
        <div className="container mx-auto px-4">
          <p>© 2025 Invoice Extraction Pro. All rights reserved.</p>
        </div>
      </footer>

      {/* Global styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        /* Add system font stack */
        html {
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
      `}</style>
    </div>
  );
}