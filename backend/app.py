import base64
import os
import json
from flask import Flask, request, jsonify, render_template, session, send_file
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from flask_cors import CORS
from langchain.chains import LLMChain
from langchain.memory import ConversationBufferMemory
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.prompts.chat import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    MessagesPlaceholder,
)
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Union, Optional
import re
import pandas as pd
import tempfile
import uuid
from io import BytesIO

# Load environment variables
load_dotenv()
os.environ['GOOGLE_API_KEY'] = os.getenv("GOOGLE_API_KEY")
model_name = os.getenv("MODEL")

# Initialize Flask app
app = Flask(__name__)
CORS(app) 
app.secret_key = os.getenv("FLASK_SECRET_KEY", "your-secret-key")

# Configure upload folder for image extraction
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max upload
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize the model
model_vision = ChatGoogleGenerativeAI(model=model_name)

# Dictionary to store conversation chains for each session
conversation_chains = {}

# In-memory storage
schema_storage = {}  # Store schemas with schema_id as key
job_storage = {}    # Store job info with job_id as key
result_storage = {} # Store results with job_id as key

# ====================================================
# Chat & Image Analysis Functions
# ====================================================

def get_image_description(image_file):
    """
    Function to get description of an image
    
    Args:
        image_file: Uploaded image file
    
    Returns:
        str: Description of the image
    """
    if hasattr(image_file, 'read'):
        # If it's a file object from request
        image_bytes = image_file.read()
        # Reset file pointer for potential reuse
        image_file.seek(0)
    else:
        # If it's a file path
        with open(image_file, 'rb') as f:
            image_bytes = f.read()
    
    image_data = base64.b64encode(image_bytes).decode("utf-8")
    
    message = HumanMessage(
        content=[
            {"type": "text", "text": "Act as Image Analyst. Analyze and extract insights from images. An expert in visual content interpretation and text Extraction with years of experience in image analysis"},
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{image_data}"},
            },
        ],
    )
    response = model_vision.invoke([message])
    return response.content

def suggest_questions(image_description):
    """
    Function to suggest questions based on image description
    
    Args:
        image_description (str): Description of the image
    
    Returns:
        list: List of suggested questions
    """
    class Question(BaseModel):
        question: str = Field(None, description="Generate simple and useful suggestion questions based on the given content. The questions should be directly answerable using the information within the content.")
    
    class SuggestQue(BaseModel):
        questions: List[Question]
    
    query_llm = model_vision.with_structured_output(SuggestQue)
    result = query_llm.invoke(image_description)
    return [q.question for q in result.questions]

def get_conversation_chain(session_id):
    """Create and return the conversation chain with memory for a session"""
    if session_id in conversation_chains:
        return conversation_chains[session_id]
    
    prompt = ChatPromptTemplate(
        [
            SystemMessage(content="Act as a Teacher, Based on the information you know answer the user Questions"),
            MessagesPlaceholder(variable_name="chat_history"),
            HumanMessagePromptTemplate.from_template("User: {question}, Give the Answer in plan text"),
        ]
    )
    
    memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
    
    chain = LLMChain(
        llm=model_vision,
        prompt=prompt,
        memory=memory,
    )
    
    conversation_chains[session_id] = (chain, memory)
    return chain, memory

# ====================================================
# Image Extraction Functions
# ====================================================

def json_to_pydantic_model(json_data: Union[List, Dict], class_name: str = "Data") -> str:
    """
    Convert a list of field definitions to a Pydantic BaseModel class definition.
    
    Args:
        json_data: List of field definitions [name, type, description] or dict
        class_name: Name for the Pydantic class
        
    Returns:
        String containing the Pydantic class definition
    """
    # Handle list of field definitions
    if isinstance(json_data, list):
        fields = []
        for field_def in json_data:
            if len(field_def) >= 3:
                field_name = field_def[0]
                field_type = field_def[1]
                description = field_def[2]
                fields.append((field_name, field_type, description))
            else:
                return "Error: Each field definition should have name, type, and description."
    else:
        return "Error: Expected a list of field definitions."
    
    # Generate class definition
    class_definition = [
        "from pydantic import BaseModel, Field",
        "from typing import List, Optional, Dict, Any, Union\n",
        f"class {class_name}(BaseModel):"
    ]
    
    for field_name, field_type, description in fields:
        # Sanitize field name to be a valid Python identifier
        field_name = re.sub(r'\W|^(?=\d)', '_', field_name)
        description+=" if No data found , show None"
        
        # Add field with type annotation and Field description
        class_definition.append(f"    {field_name}: str  = Field(description=\"{description}\")")
    
    return "\n".join(class_definition)

# ====================================================
# Flask Routes - Chat & Image Analysis
# ====================================================

@app.route('/')
def index():
    """Render the main chat interface"""
    return render_template('index.html')

@app.route('/upload_image', methods=['POST'])
def upload_image():
    """Handle image upload and analysis"""
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400
    
    image_file = request.files['image']
    session_id = request.form.get('session_id')
    
    # Generate a session ID if not provided
    if not session_id:
        session_id = os.urandom(16).hex()
    
    # Get conversation chain for this session
    chain, memory = get_conversation_chain(session_id)
    
    try:
        # Get image description
        image_description = get_image_description(image_file)
        
        # Add to memory
        memory.save_context(
            {"text": "Image uploaded by user."},
            {"text": f"Image Description: {image_description}"}
        )
        
        # Generate suggested questions
        suggested_questions = suggest_questions(image_description)
        
        return jsonify({
            "session_id": session_id,
            "description": image_description,
            "suggested_questions": suggested_questions
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    """Handle chat messages"""
    data = request.json
    question = data.get('question')
    session_id = data.get('session_id')
    
    if not question:
        return jsonify({"error": "No question provided"}), 400
    
    if not session_id:
        return jsonify({"error": "No session ID provided"}), 400
    
    # Get conversation chain for this session
    chain, memory = get_conversation_chain(session_id)
    
    try:
        # Process the question
        response = chain.invoke({"question": question})
        
        return jsonify({
            "response": response['text'],
            "session_id": session_id
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/reset', methods=['POST'])
def reset_conversation():
    """Reset the conversation for a session"""
    data = request.json
    session_id = data.get('session_id')
    
    if not session_id:
        return jsonify({"error": "No session ID provided"}), 400
    
    if session_id in conversation_chains:
        del conversation_chains[session_id]
    
    return jsonify({"status": "success", "message": "Conversation reset successfully"})

# ====================================================
# Flask Routes - Image Extraction
# ====================================================

@app.route('/extraction')
def extraction_interface():
    """Render the invoice extraction interface"""
    return render_template('extraction.html')

@app.route('/create_schema', methods=['POST'])
def create_schema():
    try:
        schema_data = request.json.get('schema', [])
        
        # Generate Pydantic model from schema
        pydantic_class_code = json_to_pydantic_model(schema_data)
        
        # Store schema in memory
        schema_id = str(uuid.uuid4())
        schema_storage[schema_id] = pydantic_class_code
        
        return jsonify({
            'success': True, 
            'schema_id': schema_id,
            'message': 'Invoice template created successfully',
            'code': pydantic_class_code
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/upload_images', methods=['POST'])
def upload_images():
    try:
        schema_id = request.form.get('schema_id')
        if not schema_id or schema_id not in schema_storage:
            return jsonify({'success': False, 'error': 'Invalid template ID'}), 400
        
        if 'files[]' not in request.files:
            return jsonify({'success': False, 'error': 'No invoice files provided'}), 400
        
        files = request.files.getlist('files[]')
        file_data = []
        
        for file in files:
            if file.filename == '':
                continue
            
            # Store file data in memory
            file_bytes = file.read()
            file_data.append({
                'filename': secure_filename(file.filename),
                'data': file_bytes
            })
        
        if not file_data:
            return jsonify({'success': False, 'error': 'No valid files uploaded'}), 400
        
        # Create a job ID and store job info in memory
        job_id = str(uuid.uuid4())
        job_storage[job_id] = {
            'schema_id': schema_id,
            'files': file_data
        }
        
        return jsonify({
            'success': True,
            'job_id': job_id,
            'files_count': len(file_data),
            'message': 'Invoice files uploaded successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/process_images', methods=['POST'])
def process_images():
    try:
        job_id = request.json.get('job_id')
        if not job_id or job_id not in job_storage:
            return jsonify({'success': False, 'error': 'Invalid job ID'}), 400
        
        # Get job info from memory
        job_info = job_storage[job_id]
        schema_id = job_info['schema_id']
        files = job_info['files']
        
        # Get schema from memory
        schema_code = schema_storage[schema_id]
        
        # Execute the schema code to define the Data class
        locals_dict = {}
        exec(schema_code, globals(), locals_dict)
        Data = locals_dict['Data']
        
        # Create structured output model
        structured_llm = model_vision.with_structured_output(Data)
        
        # Process each image
        results = []
        for file_info in files:
            try:
                # Create temporary BytesIO object
                file_obj = BytesIO(file_info['data'])
                
                # Get image description
                image_des = get_image_description(file_obj)
                
                # Extract structured data
                result = structured_llm.invoke(f"Extract invoice data from the following text description of an invoice: {image_des}")
                
                # Convert to dict and add filename
                result_dict = result.dict()
                result_dict['filename'] = file_info['filename']
                results.append(result_dict)
            except Exception as e:
                results.append({
                    'filename': file_info['filename'],
                    'error': str(e)
                })
        
        # Store results in memory
        result_storage[job_id] = results
        
        # Create Excel file in memory
        excel_buffer = BytesIO()
        df = pd.DataFrame(results)
        df.to_excel(excel_buffer, index=False)
        excel_buffer.seek(0)
        
        return jsonify({
            'success': True,
            'job_id': job_id,
            'message': 'Invoice data extraction complete',
            'results': results
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/download_excel/<job_id>', methods=['GET'])
def download_excel(job_id):
    if job_id not in result_storage:
        return jsonify({'success': False, 'error': 'Results not found'}), 404
    
    # Create Excel file in memory
    excel_buffer = BytesIO()
    df = pd.DataFrame(result_storage[job_id])
    df.to_excel(excel_buffer, index=False)
    excel_buffer.seek(0)
    
    return send_file(
        excel_buffer,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=f'results_{job_id}.xlsx'
    )

@app.route('/cleanup', methods=['POST'])
def cleanup():
    try:
        job_id = request.json.get('job_id')
        schema_id = request.json.get('schema_id')
        
        if job_id:
            job_storage.pop(job_id, None)
            result_storage.pop(job_id, None)
        
        if schema_id:
            schema_storage.pop(schema_id, None)
        
        return jsonify({'success': True, 'message': 'Cleanup successful'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/update_results', methods=['POST'])
def update_results():
    try:
        job_id = request.json.get('job_id')
        updated_results = request.json.get('results', [])
        
        if not job_id:
            return jsonify({'success': False, 'error': 'Job ID is required'}), 400
        
        # Update results in memory
        result_storage[job_id] = updated_results
        
        return jsonify({
            'success': True,
            'message': 'Results updated successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/update_api_key', methods=['POST'])
def update_api_key():
    """
    Update the Google Gemini API key
    
    Expected JSON payload:
    {
        "api_key": "your-new-api-key"
    }
    """
    try:
        data = request.json
        api_key = data.get('api_key')
        
        if not api_key:
            return jsonify({'success': False, 'error': 'API key is required'}), 400
            
        # Update environment variable
        os.environ['GOOGLE_API_KEY'] = api_key
        
        # Reinitialize the model with new API key
        global model_vision
        model_vision = ChatGoogleGenerativeAI(model=model_name)
        
        # Reset all conversation chains since they use the old model
        global conversation_chains
        conversation_chains = {}
        
        return jsonify({
            'success': True,
            'message': 'API key updated successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

if __name__ == '__main__':
    # Create templates directory if it doesn't exist
    if not os.path.exists('templates'):
        os.makedirs('templates')
    
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))