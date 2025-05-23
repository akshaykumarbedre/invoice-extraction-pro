'use client';
import Navbar from '../components/Navbar';
import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Send, RefreshCw, Loader2, AlertCircle, FileText, Receipt, CreditCard, X, Image, MessageSquare, PlusCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; 

export default function Home() {
  // State management
  const [sessionId, setSessionId] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageDescription, setImageDescription] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [showImagePreviewBubble, setShowImagePreviewBubble] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // References
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  
  // Initialize session on component mount
  useEffect(() => {
    const storedSessionId = localStorage.getItem('chatSessionId');
    if (storedSessionId) {
      setSessionId(storedSessionId);
      // Fetch existing conversation if available
      fetchExistingConversation(storedSessionId);
    } else {
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      localStorage.setItem('chatSessionId', newSessionId);
      
      // Add initial greeting
      setChatHistory([
        { type: 'bot', message: "Hello! I'm your invoice analysis assistant. Upload an invoice image, and I'll help you extract key information." }
      ]);
    }
  }, []);
  
  // Fetch existing conversation if available
  const fetchExistingConversation = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/get_conversation?session_id=${id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.history && data.history.length > 0) {
          setChatHistory(data.history);
          if (data.image_description) {
            setImageDescription(data.image_description);
          }
          if (data.image_url) {
            setImagePreview(data.image_url);
          }
          if (data.suggested_questions) {
            setSuggestedQuestions(data.suggested_questions);
          }
        } else {
          setChatHistory([
            { type: 'bot', message: "Welcome back! Upload a new invoice image or continue our conversation." }
          ]);
        }
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
      setChatHistory([
        { type: 'bot', message: "Hello! I'm your invoice analysis assistant. Upload an invoice image, and I'll help you extract key information." }
      ]);
    }
  };
  
  // Scroll to bottom of chat when history changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);
  
  // Focus input when user input changes
  useEffect(() => {
    if (inputRef.current && !isLoading) {
      inputRef.current.focus();
    }
  }, [isLoading]);
  
  // Generate random session ID
  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };
  
  // Handle file selection change
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setUploadStatus('Error: File size exceeds 10MB limit');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        setImagePreview(e.target.result);
        // Automatically start analysis after preview is set
        await handleImageUpload(file);
      };
      reader.readAsDataURL(file);
    }
  };

  
  // Handle image upload and analysis
  const handleImageUpload = async (file) => {
    if (!file) {
      setUploadStatus('Please select an image first');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Analyzing image...');

    setChatHistory(prev => [...prev, {
      type: 'system',
      message: "🖼️ Processing your invoice image..."
    }]);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('session_id', sessionId);

    try {
      const response = await fetch('http://localhost:5000/upload_image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSessionId(data.session_id);
        localStorage.setItem('chatSessionId', data.session_id);
        setImageDescription(data.description);
        setChatHistory(prev => [
          ...prev,
          {
            type: 'bot',
            message: `I've analyzed your invoice image. Here's what I found:\n\n${data.description}`
          }
        ]);
        setSuggestedQuestions(data.suggested_questions || []);
        setUploadStatus('Image analyzed successfully!');
        setTimeout(() => {
          inputRef.current?.focus();
        }, 300);
      } else {
        setUploadStatus(`Error: ${data.error || 'Failed to analyze image'}`);
        setChatHistory(prev => [
          ...prev,
          {
            type: 'error',
            message: `I encountered an error analyzing your image: ${data.error || 'Unknown error'}`
          }
        ]);
      }
    } catch (error) {
      setUploadStatus(`Error: ${error.message}`);
      setChatHistory(prev => [
        ...prev,
        {
          type: 'error',
          message: `I encountered an error: ${error.message}. Please try again.`
        }
      ]);
    } finally {
      setIsUploading(false);
    }
  };

  // Send message to chat
  const sendMessage = async () => {
    const message = userInput.trim();
    if (!message || isLoading) return;
    
    // Add user message to chat
    setChatHistory(prev => [...prev, { type: 'user', message }]);
    
    // Clear input
    setUserInput('');
    
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: message,
          session_id: sessionId
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Add bot response to chat
        setChatHistory(prev => [...prev, { type: 'bot', message: data.response }]);
        
        // Update suggested questions if provided
        if (data.suggested_questions && data.suggested_questions.length > 0) {
          setSuggestedQuestions(data.suggested_questions);
        }
      } else {
        setChatHistory(prev => [
          ...prev, 
          { 
            type: 'error', 
            message: `Sorry, I encountered an error: ${data.error || 'Unknown error'}` 
          }
        ]);
      }
    } catch (error) {
      setChatHistory(prev => [
        ...prev,
        { 
          type: 'error', 
          message: `Sorry, I couldn't process your request: ${error.message}` 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle keyboard shortcuts
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // Handle suggested question click
  const handleQuestionClick = (question) => {
    setUserInput(question);
    setTimeout(() => {
      sendMessage();
    }, 100);
  };
  
  // Reset conversation
  const resetConversation = async () => {
    if (window.confirm("Are you sure you want to reset this conversation? All chat history will be cleared.")) {
      setIsLoading(true);
      
      try {
        await fetch('http://localhost:5000/reset', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId
          })
        });
        
        // Generate new session ID
        const newSessionId = generateSessionId();
        setSessionId(newSessionId);
        localStorage.setItem('chatSessionId', newSessionId);
        
        // Reset state
        setChatHistory([
          { type: 'bot', message: "I've reset our conversation. You can upload a new invoice image or start a fresh chat." }
        ]);
        setSuggestedQuestions([]);
        setImagePreview(null);
        setImageDescription('');
        setUploadStatus('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
      } catch (error) {
        console.error("Error resetting conversation:", error);
        setChatHistory(prev => [
          ...prev,
          { type: 'error', message: `Failed to reset conversation: ${error.message}` }
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Load demo invoice
  const loadDemoInvoice = async () => {
    setIsDemoMode(true);
    setIsLoading(true);
    
    try {
      // Mock loading a demo invoice image
      // In a real implementation, you'd fetch an actual image file
      setTimeout(async () => {
        // Create a mock File object (this would normally be an actual file)
        const response = await fetch('/invoice-sample-1.jpg');
        const blob = await response.blob();
        const file = new File([blob], 'invoice-sample-1.jpg', { type: 'image/jpeg' });
        
        // Show loading message
        setChatHistory(prev => [...prev, {
          type: 'system',
          message: "🔍 Loading demo invoice..."
        }]);
        
        // Read the file and set the preview
        const reader = new FileReader();
        reader.onload = async (e) => {
          setImagePreview(e.target.result);
          // Process the demo invoice
          await handleImageUpload(file);
        };
        reader.readAsDataURL(file);
        
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error("Error loading demo:", error);
      setChatHistory(prev => [
        ...prev,
        { type: 'error', message: `Failed to load demo: ${error.message}` }
      ]);
      setIsLoading(false);
    }
  };

  // Trigger file input click
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] font-sans">
      <Navbar />
      <main className="flex-1 text-gray-800 flex flex-col">
        <header className="bg-white border-b border-gray-100 py-5 shadow-sm">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Invoice Data Extraction</h1>
                <p className="text-sm text-gray-500 mt-1">Upload and analyze invoices to extract key information</p>
              </div>
              <div className="flex gap-3">
                {!imagePreview && !isLoading && (
                  <button
                    onClick={loadDemoInvoice}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm bg-teal-50 text-teal-700 rounded-xl border border-teal-100 hover:bg-teal-100 transition-all duration-200"
                  >
                    <Receipt className="h-4 w-4" />
                    <span>Try Demo</span>
                  </button>
                )}
                <button
                  onClick={resetConversation}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm text-gray-600 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-200"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>New Invoice</span>
                </button>
              </div>
            </div>
          </div>
        </header>
  
        <div className="container mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row gap-6 flex-1 overflow-hidden">
          {/* Demo Banner - show when demo mode is active */}
          {isDemoMode && !imagePreview && (
            <div className="w-full mb-4 p-5 bg-teal-50 border border-teal-100 rounded-xl text-teal-800 flex items-start gap-4 animate-fadeIn">
              <div className="rounded-full bg-teal-100 p-2.5 mt-0.5 flex-shrink-0">
                <Receipt className="h-5 w-5 text-teal-700" />
              </div>
              <div>
                <h3 className="font-medium text-lg mb-1">Demo Mode</h3>
                <p className="text-sm leading-relaxed">Loading a sample invoice for demonstration purposes. You'll be able to ask questions about the invoice details once processing is complete.</p>
              </div>
            </div>
          )}
        
          {/* Main Chat Panel */}
          <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 h-[calc(100vh-12rem)]">
            {/* Chat Header */}
            <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-teal-100 rounded-full p-2 text-teal-700">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">Invoice Assistant</h2>
                  <p className="text-xs text-gray-500">Session ID: {sessionId.substring(0, 8)}...</p>
                </div>
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                {imagePreview && <span className="text-teal-600 flex items-center gap-1"><Receipt className="h-4 w-4" /> Invoice loaded</span>}
              </div>
            </div>
  
            {/* Chat Messages */}
            <div 
              ref={chatContainerRef} 
              className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-gray-50 to-white"
              style={{ height: 'calc(100% - 140px)' }} // Fixed height for the messages area
            >
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                  <div className="bg-gray-50 rounded-full p-6 mb-5">
                    <Receipt className="h-12 w-12 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-500 mb-2">No Invoice Data Yet</h3>
                  <p className="text-center text-gray-400 max-w-md mb-6">Upload an invoice image to start extracting data and get insights about your document</p>
                  <div className="flex gap-3">
                    <button
                      onClick={triggerFileUpload}
                      className="flex items-center gap-2 px-5 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all duration-200 shadow-sm"
                    >
                      <UploadCloud className="h-5 w-5" />
                      <span>Upload Invoice</span>
                    </button>
                    <button
                      onClick={loadDemoInvoice}
                      className="flex items-center gap-2 px-5 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all duration-200"
                    >
                      <FileText className="h-5 w-5" />
                      <span>Try Demo</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {chatHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`animate-fadeIn ${
                        msg.type === 'user' ? 'flex justify-end' :
                        msg.type === 'system' ? 'flex justify-center' :
                        'flex justify-start'
                      }`}
                    >
                      {msg.type === 'system' ? (
                        <div className="py-2 px-4 bg-gray-100 rounded-full text-xs text-gray-600 max-w-[85%] flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {msg.message}
                        </div>
                      ) : msg.type === 'error' ? (
                        <div className="py-4 px-5 bg-red-50 border border-red-100 rounded-xl text-red-700 max-w-[85%] flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">{msg.message}</div>
                        </div>
                      ) : (
                        <div
                          className={`py-4 px-5 rounded-xl max-w-[85%] ${
                            msg.type === 'user'
                              ? 'bg-teal-600 text-white rounded-br-none'
                              : 'bg-gray-100 text-gray-800 rounded-bl-none shadow-sm'
                          }`}
                        >
                          <ReactMarkdown
                            components={{
                              p: ({children}) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                              code: ({node, inline, className, children, ...props}) => {
                                if (inline) {
                                  return <code className="px-1.5 py-0.5 bg-black/10 rounded text-sm" {...props}>{children}</code>
                                }
                                return (
                                  <pre className="bg-black/10 p-4 rounded-lg my-3 overflow-x-auto text-sm">
                                    <code {...props}>{children}</code>
                                  </pre>
                                )
                              }
                            }}
                          >
                            {msg.message}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  ))}
  
                  {isLoading && (
                    <div className="flex justify-center py-4">
                      <div className="flex items-center gap-3 bg-white py-3 px-5 rounded-full text-gray-600 shadow-sm border border-gray-100">
                        <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                        <span className="text-sm font-medium">Processing your request...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
  
            {/* Input Area with Inline Preview */}
            <div className="p-4 border-t border-gray-100 bg-white">
              <div className="flex items-end gap-3">
                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative">
                    <div className="relative group">
                      <div className="w-14 h-14 rounded-xl border border-gray-200 overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all">
                        <img src={imagePreview} alt="" className="w-full h-full object-cover"/>
                      </div>
                      
                      {/* Hover Preview */}
                      <div className="hidden group-hover:block absolute bottom-0 left-16 mb-2 p-3 bg-white rounded-xl shadow-lg border border-gray-200 z-10 animate-fadeIn">
                        <div className="relative w-56 h-56">
                          <img src={imagePreview} alt="" className="w-full h-full object-contain"/>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div>
                        </div>
                      </div>
  
                      {/* Remove Image Button */}
                      <button
                        onClick={() => {
                          setImagePreview(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
  
                {/* Upload Prompt - Show when no image and not chatting */}
                {!imagePreview && chatHistory.length === 0 && (
                  <button
                    onClick={triggerFileUpload}
                    className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-600 hover:bg-teal-50 hover:border-teal-100 hover:text-teal-700 transition-all"
                  >
                    <PlusCircle className="h-5 w-5" />
                    <span>Add Invoice</span>
                  </button>
                )}
  
                {/* Input Area */}
                <div className="relative flex-1">
                  <textarea
                    ref={inputRef}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="w-full border border-gray-200 rounded-xl px-5 py-3.5 pr-24 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none overflow-hidden bg-white text-gray-800 shadow-sm"
                    placeholder="Ask about the invoice details..."
                    rows={1}
                    disabled={isLoading}
                    style={{
                      height: 'auto',
                      minHeight: '56px',
                      maxHeight: '120px'
                    }}
                  />
  
                  {/* Action Buttons */}
                  <div className="absolute right-3 bottom-3 flex items-center gap-2">
                    {!imagePreview && (
                      <button
                        onClick={triggerFileUpload}
                        className="p-2 text-gray-400 hover:text-teal-600 transition-colors"
                        title="Upload invoice"
                      >
                        <UploadCloud className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={sendMessage}
                      disabled={!userInput.trim() || isLoading}
                      className={`p-2 rounded-lg ${userInput.trim() ? 'bg-teal-100 text-teal-700 hover:bg-teal-200' : 'text-gray-300 cursor-not-allowed'} transition-all`}
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
  
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/gif,application/pdf"
                className="hidden"
              />
  
              {uploadStatus && (
                <div className={`mt-3 text-sm px-4 py-3 rounded-xl ${
                  uploadStatus.includes('Error') ? 'bg-red-50 text-red-700 border border-red-100' :
                  uploadStatus.includes('success') ? 'bg-green-50 text-green-700 border border-green-100' :
                  'bg-teal-50 text-teal-700 border border-teal-100'
                } animate-fadeIn flex items-center gap-2`}>
                  {uploadStatus.includes('Error') ? <AlertCircle className="h-4 w-4" /> : 
                   uploadStatus.includes('success') ? <FileText className="h-4 w-4" /> : 
                   <Loader2 className="h-4 w-4 animate-spin" />}
                  {uploadStatus}
                </div>
              )}
            </div>
          </div>
  
          {/* Suggested Questions Sidebar */}
          <div className="w-full md:w-96 flex flex-col gap-5 md:h-[calc(100vh-12rem)] md:overflow-y-auto">
            {suggestedQuestions.length === 0 && !imagePreview && !isLoading && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-teal-50">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-teal-700" />
                    Getting Started
                  </h2>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                    Upload an invoice image to extract key information or try our demo with a sample invoice.
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={triggerFileUpload}
                      className="text-left p-4 bg-white hover:bg-teal-50 hover:text-teal-700 border border-gray-200 hover:border-teal-100 rounded-xl transition-all text-sm flex items-center gap-3 shadow-sm hover:shadow"
                    >
                      <div className="bg-teal-100 rounded-full p-2 text-teal-600">
                        <UploadCloud className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-medium block mb-0.5">Upload your invoice</span>
                        <span className="text-xs text-gray-500">JPG, PNG, PDF files supported</span>
                      </div>
                    </button>
                    <button
                      onClick={loadDemoInvoice}
                      className="text-left p-4 bg-white hover:bg-teal-50 hover:text-teal-700 border border-gray-200 hover:border-teal-100 rounded-xl transition-all text-sm flex items-center gap-3 shadow-sm hover:shadow"
                    >
                      <div className="bg-gray-100 rounded-full p-2 text-gray-600">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-medium block mb-0.5">Try with a demo invoice</span>
                        <span className="text-xs text-gray-500">See how the system works with sample data</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {suggestedQuestions.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-teal-50">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-teal-700" />
                    Suggested Questions
                  </h2>
                </div>
                <div className="p-5">
                  <div className="flex flex-col gap-3">
                    {suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuestionClick(question)}
                        disabled={isLoading}
                        className="text-left p-3.5 bg-white hover:bg-teal-50 hover:text-teal-700 border border-gray-200 hover:border-teal-100 rounded-xl transition-all text-sm disabled:opacity-70 disabled:hover:bg-gray-50 disabled:hover:text-inherit shadow-sm hover:shadow"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tips and Help Card */}
            {suggestedQuestions.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-800">Pro Tips</h2>
                </div>
                <div className="p-5">
                  <ul className="text-sm text-gray-600 space-y-3">
                    <li className="flex gap-2">
                      <div className="text-teal-500 flex-shrink-0">•</div>
                      <p>Ask about specific invoice details like total amount, date, or vendor.</p>
                    </li>
                    <li className="flex gap-2">
                      <div className="text-teal-500 flex-shrink-0">•</div>
                      <p>Request a summary of all key information at once.</p>
                    </li>
                    <li className="flex gap-2">
                      <div className="text-teal-500 flex-shrink-0">•</div>
                      <p>Get line item details by asking "What products were purchased?"</p>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
  
        <footer className="py-6 text-center text-sm text-gray-500 border-t border-gray-100 mt-auto">
          <div className="container mx-auto px-4">
            <p>© 2025 Invoice Extraction Pro. All rights reserved.</p>
          </div>
        </footer>
      </main>
  
      {/* Global styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        textarea {
          overflow-y: hidden;
        }
        textarea:focus {
          outline: none;
        }
        
        /* Add system font stack */
        html {
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        /* Ensure the chat container maintains its height */
        html, body {
          height: 100%;
          overflow: hidden;
        }
        
        body > div {
          height: 100%;
          overflow: auto;
        }
      `}</style>
    </div>
  );

}