'use client';
import Navbar from '../components/Navbar';
import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Send, RefreshCw, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react';

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
        { type: 'bot', message: "Hello! I'm your image analysis assistant. Upload an image, and I'll help you understand it better." }
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
            { type: 'bot', message: "Welcome back! Upload a new image or continue our conversation." }
          ]);
        }
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
      setChatHistory([
        { type: 'bot', message: "Hello! I'm your image analysis assistant. Upload an image, and I'll help you understand it better." }
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
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setUploadStatus('Error: File size exceeds 10MB limit');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setUploadStatus('Image selected. Click "Analyze Image" to proceed.');
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle image upload and analysis
  const handleImageUpload = async () => {
    const file = fileInputRef.current?.files[0];
    if (!file) {
      setUploadStatus('Please select an image first');
      return;
    }
    
    setIsUploading(true);
    setUploadStatus('Analyzing image...');
    
    // Add user action to chat
    setChatHistory(prev => [...prev, { 
      type: 'system', 
      message: "🖼️ You uploaded a new image for analysis" 
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
        // Update session ID
        setSessionId(data.session_id);
        localStorage.setItem('chatSessionId', data.session_id);
        
        // Set image description
        setImageDescription(data.description);
        
        // Add bot message
        setChatHistory(prev => [
          ...prev,
          { 
            type: 'bot', 
            message: `I've analyzed your image. Here's what I see:\n\n${data.description}` 
          }
        ]);
        
        // Set suggested questions
        setSuggestedQuestions(data.suggested_questions || []);
        
        setUploadStatus('Image analyzed successfully!');
        
        // Auto focus on input field after analysis
        setTimeout(() => {
          inputRef.current?.focus();
        }, 300);
      } else {
        setUploadStatus(`Error: ${data.error || 'Failed to analyze image'}`);
        
        // Add error message to chat
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
      
      // Add error message to chat
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
          { type: 'bot', message: "I've reset our conversation. You can upload a new image or start a fresh chat." }
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

  // Trigger file input click
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gradient-to-b from-gray-50 to-gray-100 text-gray-900">
        <header className="bg-white border-b border-gray-200 shadow-sm py-4">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-6 w-6 text-indigo-600" />
              <h1 className="text-xl font-semibold text-gray-800">Visual Insight AI</h1>
            </div>
            <button
              onClick={resetConversation}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>New Conversation</span>
            </button>
          </div>
        </header>
        
        <div className="flex-1 container mx-auto p-4 md:p-6 lg:py-8 flex flex-col lg:flex-row gap-6">
          {/* Chat Panel */}
          <div className="flex-1 flex flex-col bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            {/* Chat Header */}
            <div className="bg-gray-50 p-4 border-b border-gray-200">
              <h2 className="font-medium text-gray-800">AI Assistant</h2>
              <p className="text-xs text-gray-500">Session ID: {sessionId.substring(0, 8)}...</p>
            </div>
            
            {/* Chat Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 p-4 overflow-y-auto min-h-[400px] max-h-[calc(100vh-16rem)]"
            >
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon className="h-12 w-12 mb-4 text-gray-300" />
                  <p className="text-center">Upload an image to start analyzing</p>
                </div>
              ) : (
                chatHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-4 animate-fadeIn ${
                      msg.type === 'user' ? 'flex justify-end' : 
                      msg.type === 'system' ? 'flex justify-center' :
                      'flex justify-start'
                    }`}
                  >
                    {msg.type === 'system' ? (
                      <div className="py-2 px-3 bg-gray-100 rounded-md text-xs text-gray-500 max-w-[85%]">
                        {msg.message}
                      </div>
                    ) : msg.type === 'error' ? (
                      <div className="py-3 px-4 bg-red-50 border border-red-100 rounded-lg text-red-700 max-w-[85%] flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          {msg.message.split('\n').map((line, i) => (
                            <span key={i}>
                              {line}
                              {i !== msg.message.split('\n').length - 1 && <br />}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`py-3 px-4 rounded-2xl max-w-[85%] ${
                          msg.type === 'user'
                            ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm'
                            : 'bg-gray-100 text-gray-800 rounded-tl-none shadow-sm'
                        }`}
                      >
                        {msg.message.split('\n').map((line, i) => (
                          <span key={i}>
                            {line}
                            {i !== msg.message.split('\n').length - 1 && <br />}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex justify-center my-4">
                  <div className="flex items-center gap-2 bg-gray-100 py-2 px-4 rounded-full text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                    <span className="text-sm">Processing...</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <textarea
                    ref={inputRef}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none overflow-hidden bg-white text-gray-900"
                    placeholder="Ask about the image..."
                    rows={1}
                    disabled={isLoading}
                    style={{
                      height: 'auto',
                      minHeight: '48px',
                      maxHeight: '120px'
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!userInput.trim() || isLoading}
                    className="absolute right-2 bottom-2 p-2 text-gray-400 hover:text-indigo-600 disabled:text-gray-300 transition-colors"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-6">
            {/* Image Upload Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-base font-medium text-gray-800">Image Analysis</h2>
              </div>
              
              <div className="p-4">
                {imagePreview ? (
                  <div className="mb-4">
                    <div className="relative h-48 w-full rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={imagePreview}
                        alt="Selected image"
                        className="object-contain w-full h-full"
                      />
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={triggerFileUpload}
                    className="mb-4 h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors bg-gray-50"
                  >
                    <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Click to upload an image</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG or GIF (max 10MB)</p>
                  </div>
                )}
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/gif"
                  className="hidden"
                />
                
                <div className="flex flex-col gap-3">
                  <button
                    onClick={imagePreview ? handleImageUpload : triggerFileUpload}
                    disabled={isUploading}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white py-2 px-4 rounded-lg font-medium disabled:bg-indigo-400"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : imagePreview ? (
                      <>
                        <ImageIcon className="h-4 w-4" />
                        <span>Analyze Image</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-4 w-4" />
                        <span>Upload Image</span>
                      </>
                    )}
                  </button>
                  
                  {imagePreview && (
                    <button
                      onClick={triggerFileUpload}
                      className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                      Choose a different image
                    </button>
                  )}
                </div>
                
                {uploadStatus && (
                  <div className={`mt-3 text-sm px-3 py-2 rounded-md ${
                    uploadStatus.includes('Error') ? 'bg-red-50 text-red-700' : 
                    uploadStatus.includes('success') ? 'bg-green-50 text-green-700' : 
                    'bg-blue-50 text-blue-700'
                  }`}>
                    {uploadStatus}
                  </div>
                )}
              </div>
              
              {imageDescription && (
                <div className="px-4 pb-4">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Analysis Results:</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{imageDescription}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Suggested Questions */}
            {suggestedQuestions.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-base font-medium text-gray-800">Suggested Questions</h2>
                </div>
                <div className="p-4">
                  <div className="flex flex-col gap-2">
                    {suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuestionClick(question)}
                        disabled={isLoading}
                        className="text-left p-3 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 hover:border-indigo-200 rounded-lg transition-all text-sm disabled:opacity-70 disabled:hover:bg-gray-50 disabled:hover:text-inherit"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Feature Highlights */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 shadow-sm overflow-hidden p-4">
              <h3 className="text-sm font-medium text-indigo-800 mb-2">Features</h3>
              <ul className="text-xs text-indigo-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-600 flex-shrink-0 mt-0.5">✓</span>
                  <span>Image analysis with detailed descriptions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-600 flex-shrink-0 mt-0.5">✓</span>
                  <span>Contextual question suggestions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-600 flex-shrink-0 mt-0.5">✓</span>
                  <span>Multi-turn conversation with memory</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <footer className="py-4 border-t border-gray-200 bg-white">
          <div className="container mx-auto px-4 text-center text-xs text-gray-500">
            © 2025 Visual Insight AI. All rights reserved.
          </div>
        </footer>
        
        {/* Add global styles */}
        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
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
        `}</style>
      </main>
    </div>
  );
}