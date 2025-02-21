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
        question: str = Field(None, description="Act as teacher , and genarate the suggested question based on given content and answe should be preset in given ")
    
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
        class_definition.append(f"    {field_name}: {field_type} = Field(description=\"{description}\")")
    
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
    """Render the image extraction interface"""
    return render_template('extraction.html')

@app.route('/create_schema', methods=['POST'])
def create_schema():
    try:
        schema_data = request.json.get('schema', [])
        
        # Generate Pydantic model from schema
        pydantic_class_code = json_to_pydantic_model(schema_data)
        
        # Save schema to session or temporary file
        schema_id = str(uuid.uuid4())
        with open(f'data/schema_{schema_id}.py', 'w') as f:
            f.write(pydantic_class_code)
        
        return jsonify({
            'success': True, 
            'schema_id': schema_id,
            'message': 'Schema created successfully',
            'code': pydantic_class_code
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/upload_images', methods=['POST'])
def upload_images():
    try:
        schema_id = request.form.get('schema_id')
        if not schema_id or not os.path.exists(f'data/schema_{schema_id}.py'):
            return jsonify({'success': False, 'error': 'Invalid schema ID'}), 400
        
        if 'files[]' not in request.files:
            return jsonify({'success': False, 'error': 'No files provided'}), 400
        
        files = request.files.getlist('files[]')
        file_paths = []
        
        for file in files:
            if file.filename == '':
                continue
                
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            file_paths.append(file_path)
        
        if not file_paths:
            return jsonify({'success': False, 'error': 'No valid files uploaded'}), 400
        
        # Create a job ID for processing
        job_id = str(uuid.uuid4())
        
        # Save file paths to process
        with open(f'data/job_{job_id}.json', 'w') as f:
            json.dump({
                'schema_id': schema_id,
                'file_paths': file_paths
            }, f)
        
        return jsonify({
            'success': True,
            'job_id': job_id,
            'files_count': len(file_paths),
            'message': 'Files uploaded successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/process_images', methods=['POST'])
def process_images():
    try:
        job_id = request.json.get('job_id')
        if not job_id or not os.path.exists(f'data/job_{job_id}.json'):
            return jsonify({'success': False, 'error': 'Invalid job ID'}), 400
        
        # Load job details
        with open(f'data/job_{job_id}.json', 'r') as f:
            job_info = json.load(f)
        
        schema_id = job_info['schema_id']
        file_paths = job_info['file_paths']
        
        # Load schema
        with open(f'data/schema_{schema_id}.py', 'r') as f:
            schema_code = f.read()
        
        # Execute the schema code to define the Data class
        exec(schema_code)
        locals_dict = {}
        exec(schema_code, globals(), locals_dict)
        Data = locals_dict['Data']
        
        # Create structured output model
        structured_llm = model_vision.with_structured_output(Data)
        
        # Process each image
        results = []
        for file_path in file_paths:
            try:
                # Get image description
                image_des = get_image_description(file_path)
                
                # Extract structured data
                result = structured_llm.invoke(image_des)
                
                # Convert to dict and add filename
                result_dict = result.dict()
                result_dict['filename'] = os.path.basename(file_path)
                results.append(result_dict)
            except Exception as e:
                # Add error entry
                results.append({
                    'filename': os.path.basename(file_path),
                    'error': str(e)
                })
        
        # Create Excel file
        df = pd.DataFrame(results)
        excel_path = f'results_{job_id}.xlsx'
        df.to_excel(excel_path, index=False)
        
        return jsonify({
            'success': True,
            'excel_path': excel_path,
            'message': 'Processing complete',
            'results': results
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/download_excel/<job_id>', methods=['GET'])
def download_excel(job_id):
    excel_path = f'results_{job_id}.xlsx'
    if not os.path.exists(excel_path):
        return jsonify({'success': False, 'error': 'Results not found'}), 404
    
    return send_file(excel_path, as_attachment=True)

@app.route('/cleanup', methods=['POST'])
def cleanup():
    try:
        job_id = request.json.get('job_id')
        schema_id = request.json.get('schema_id')
        
        files_to_remove = []
        
        if job_id:
            files_to_remove.extend([
                f'job_{job_id}.json',
                f'results_{job_id}.xlsx'
            ])
        
        if schema_id:
            files_to_remove.append(f'schema_{schema_id}.py')
        
        for file_path in files_to_remove:
            if os.path.exists(file_path):
                os.remove(file_path)
        
        return jsonify({'success': True, 'message': 'Cleanup successful'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

if __name__ == '__main__':
    # Create templates directory if it doesn't exist
    if not os.path.exists('templates'):
        os.makedirs('templates')
    
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))