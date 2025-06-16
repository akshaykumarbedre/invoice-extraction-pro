import streamlit as st
import base64
import os
import json
import pandas as pd
import tempfile
import uuid
from io import BytesIO
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
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

# Load environment variables
load_dotenv()

# Page config
st.set_page_config(
    page_title="Invoice Processing Assistant",
    page_icon="📄",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better UI
# st.markdown("""
# <style>
# .stRadio > div {
#     flex-direction: column;
#     gap: 10px;
# }
# .stRadio > div > label {
#     background-color: #f0f2f6;
#     padding: 10px 15px;
#     border-radius: 10px;
#     border: 2px solid transparent;
#     cursor: pointer;
#     transition: all 0.3s;
#     font-size: 16px;
#     font-weight: 500;
# }
# .stRadio > div > label:hover {
#     background-color: #e6f3ff;
#     border-color: #0066cc;
# }
# .stRadio > div > label[data-checked="true"] {
#     background-color: #0066cc;
#     color: white;
#     border-color: #0066cc;
# }
# .chat-container {
#     height: 600px;
#     overflow-y: auto;
#     border: 1px solid #ddd;
#     border-radius: 10px;
#     padding: 10px;
#     background-color: #fafafa;
# }
# .sidebar-container {
#     height: 600px;
#     border: 1px solid #ddd;
#     border-radius: 10px;
#     padding: 15px;
#     background-color: #f8f9fa;
# }
# </style>
# """, unsafe_allow_html=True)

# Initialize session state
if 'api_key' not in st.session_state:
    st.session_state.api_key = os.getenv("GOOGLE_API_KEY", "") or  st.secrets["GOOGLE_API_KEY"]
if 'model_name' not in st.session_state:
    st.session_state.model_name = os.getenv("MODEL", "gemini-2.5-flash-preview-04-17")
if 'chat_memory' not in st.session_state:
    st.session_state.chat_memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
if 'chat_chain' not in st.session_state:
    st.session_state.chat_chain = None
if 'schema_storage' not in st.session_state:
    st.session_state.schema_storage = {}
if 'extraction_fields' not in st.session_state:
    st.session_state.extraction_fields = [
        ["invoice_number", "str", "The unique identifier or number of the invoice"],
        ["invoice_date", "str", "The date when the invoice was issued"],
        ["due_date", "str", "The date by which payment is due"],
        ["total_amount", "float", "The total amount to be paid including tax"],
        ["tax_amount", "float", "The tax amount applied to the invoice"],
        ["vendor_name", "str", "The name of the vendor or supplier issuing the invoice"]
    ]

# Helper Functions
def initialize_model():
    """Initialize the Gemini model with current API key"""
    if st.session_state.api_key:
        os.environ['GOOGLE_API_KEY'] = st.session_state.api_key
        return ChatGoogleGenerativeAI(model=st.session_state.model_name)
    return None

def load_demo_image(image_path):
    """Load demo image from the backend/demo_images folder"""
    try:
        full_path = os.path.join( "backend","demo_images", image_path)
        if os.path.exists(full_path):
            with open(full_path, "rb") as f:
                return f.read()
        else:
            st.error(f"Demo image not found: {full_path}")
            return None
    except Exception as e:
        st.error(f"Error loading demo image: {str(e)}")
        return None

def get_image_description(image_file):
    """Get description of an image using Gemini Vision"""
    model = initialize_model()
    if not model:
        return "Please set your Google API key first."
    
    # Handle both file upload and demo image bytes
    if hasattr(image_file, 'read'):
        image_bytes = image_file.read()
    else:
        image_bytes = image_file
    
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
    response = model.invoke([message])
    return response.content

def suggest_questions(image_description):
    """Generate suggested questions based on image description"""
    model = initialize_model()
    if not model:
        return []
    
    class Question(BaseModel):
        question: str = Field(None, description="Generate simple and useful suggestion questions based on the given content. The questions should be directly answerable using the information within the content.")
    
    class SuggestQue(BaseModel):
        questions: List[Question]
    
    query_llm = model.with_structured_output(SuggestQue)
    result = query_llm.invoke(image_description)
    return [q.question for q in result.questions]

def get_conversation_chain():
    """Create conversation chain with memory"""
    model = initialize_model()
    if not model:
        return None
    
    prompt = ChatPromptTemplate(
        [
            SystemMessage(content="Act as a Teacher, Based on the information you know answer the user Questions"),
            MessagesPlaceholder(variable_name="chat_history"),
            HumanMessagePromptTemplate.from_template("User: {question}, Give the Answer in plan text"),
        ]
    )
    
    chain = LLMChain(
        llm=model,
        prompt=prompt,
        memory=st.session_state.chat_memory,
    )
    
    return chain

def json_to_pydantic_model(json_data: List, class_name: str = "Data") -> str:
    """Convert field definitions to Pydantic BaseModel class definition"""
    fields = []
    for field_def in json_data:
        if len(field_def) >= 3:
            field_name = field_def[0]
            field_type = field_def[1]
            description = field_def[2]
            fields.append((field_name, field_type, description))
    
    class_definition = [
        "from pydantic import BaseModel, Field",
        "from typing import List, Optional, Dict, Any, Union\n",
        f"class {class_name}(BaseModel):"
    ]
    
    for field_name, field_type, description in fields:
        field_name = re.sub(r'\W|^(?=\d)', '_', field_name)
        description += " if No data found , show None"
        class_definition.append(f"    {field_name}: str = Field(description=\"{description}\")")
    
    return "\n".join(class_definition)

# Sidebar Configuration
with st.sidebar:
    st.title("🔧 Configuration")
    
    # API Key input
    api_key = st.text_input(
        "Google Gemini API Key", 
        value=st.session_state.api_key, 
        type="password",
        help="Enter your Google Gemini API key"
    )
    
    if api_key != st.session_state.api_key:
        st.session_state.api_key = api_key
        st.session_state.chat_chain = None  # Reset chain when API key changes
    
    # Model selection
    model_name = st.selectbox(
        "Model",
        ["gemini-1.5-flash", "gemini-2.5-flash-preview-04-17",],
        index=0
    )
    st.session_state.model_name = model_name
    
    st.divider()
    
    # Navigation with improved styling
    st.title("🚀 Navigation Hub")
    page = st.radio(
        "Select Your Task:",
        ["🗣️ Interactive Chat & Analysis", "📊 Bulk Data Extraction & Processing"],
        index=0,
        help="Choose between interactive chat or batch processing mode"
    )

# Main Content
if page == "🗣️ Interactive Chat & Analysis":
    st.title("🗣️ Interactive Invoice Chat & Analysis")
    st.markdown("### Upload invoice images and have intelligent conversations about their content")
    
    # Check API key
    if not st.session_state.api_key:
        st.error("⚠️ Please enter your Google Gemini API key in the sidebar to continue.")
        st.stop()
    
    # Split layout: 30% sidebar, 70% chat
    col_sidebar, col_chat = st.columns([3, 7])
    
    # Left Sidebar - Image Upload & Suggestions (30%)
    with col_sidebar:
        st.markdown('<div class="sidebar-container">', unsafe_allow_html=True)
        
        # Demo Images Section
        st.subheader("🎯 Quick Demo")
        st.markdown("**Try with sample invoices:**")
        
        demo_images = [
            ("Invoice Sample 1", "invoice-sample-1.jpg"),
            ("Invoice Sample 2", "invoice-sample-2.jpg"),
            ("Invoice Sample 3", "invoice-sample-3.jpg")
        ]
        
        demo_cols = st.columns(len(demo_images))
        for i, (name, filename) in enumerate(demo_images):
            with demo_cols[i]:
                if st.button(f"📄 {i+1}", key=f"demo_{i}", use_container_width=True, help=f"Load {name}"):
                    demo_image_bytes = load_demo_image(filename)
                    if demo_image_bytes:
                        # Store demo image in session state
                        st.session_state.demo_image = demo_image_bytes
                        st.session_state.demo_image_name = name
                        
                        with st.spinner("Analyzing demo image..."):
                            description = get_image_description(demo_image_bytes)
                            
                            # Store in session state
                            st.session_state.image_description = description
                            
                            # Add to memory
                            st.session_state.chat_memory.save_context(
                                {"text": f"Demo image loaded: {name}"},
                                {"text": f"Image Description: {description}"}
                            )
                            
                            # Generate suggested questions
                            questions = suggest_questions(description)
                            st.session_state.suggested_questions = questions
                            
                            st.success(f"✅ {name} analyzed!")
                            st.rerun()
        
        st.divider()
        
        st.subheader("📤 Custom Upload")
        uploaded_file = st.file_uploader(
            "Choose an image file",
            type=['png', 'jpg', 'jpeg'],
            help="Upload an invoice or document image to analyze",
            key="image_uploader"
        )
        
        # Display current image (demo or uploaded)
        if 'demo_image' in st.session_state and st.session_state.demo_image:
            st.image(st.session_state.demo_image, caption=f"Demo: {st.session_state.demo_image_name}", use_container_width=True)
        elif uploaded_file is not None:
            st.image(uploaded_file, caption="Uploaded Image", use_container_width=True)
            
            if st.button("🔍 Analyze Image", type="primary", use_container_width=True):
                with st.spinner("Analyzing image..."):
                    # Clear demo image when uploading custom
                    if 'demo_image' in st.session_state:
                        del st.session_state.demo_image
                        del st.session_state.demo_image_name
                    
                    # Reset file pointer
                    uploaded_file.seek(0)
                    description = get_image_description(uploaded_file)
                    
                    # Store in session state
                    st.session_state.image_description = description
                    
                    # Add to memory
                    st.session_state.chat_memory.save_context(
                        {"text": "Image uploaded by user."},
                        {"text": f"Image Description: {description}"}
                    )
                    
                    # Generate suggested questions
                    questions = suggest_questions(description)
                    st.session_state.suggested_questions = questions
                    
                    st.success("✅ Image analyzed!")
        
        # Suggested questions
        if 'suggested_questions' in st.session_state and st.session_state.suggested_questions:
            st.divider()
            st.subheader("💡 Quick Questions")
            
            for i, question in enumerate(st.session_state.suggested_questions):
                if st.button(question, key=f"suggested_{i}", use_container_width=True, help="Click to ask this question"):
                    st.session_state.current_question = question
                    st.rerun()
        
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Right Chat Interface (70%)
    with col_chat:
        st.markdown('<div class="chat-container">', unsafe_allow_html=True)
        
        # Chat history
        if st.session_state.chat_memory.chat_memory.messages:
            st.subheader("💬 Conversation")
            for message in st.session_state.chat_memory.chat_memory.messages:
                if hasattr(message, 'content')  and "Image Description" not in str(message.content) :
                    if "User:" in str(message.content) or isinstance(message, HumanMessage):
                        st.chat_message("user").write(str(message.content))
                    else:
                        st.chat_message("assistant").write(str(message.content))
        
        st.markdown('</div>', unsafe_allow_html=True)
        
        # Question input at bottom
        st.divider()
        question_input = st.text_input(
            "Ask a question about the image:",
            value=st.session_state.get('current_question', ''),
            placeholder="What is the invoice number?",
            key="question_input"
        )
        
        col1, col2 = st.columns([2, 1])
        with col1:
            if st.button("💬 Send Message", type="primary", use_container_width=True):
                if question_input and 'image_description' in st.session_state:
                    # Initialize chain if needed
                    if st.session_state.chat_chain is None:
                        st.session_state.chat_chain = get_conversation_chain()
                    
                    if st.session_state.chat_chain:
                        with st.spinner("Thinking..."):
                            response = st.session_state.chat_chain.invoke({"question": question_input})
                            
                            # Clear the input
                            st.session_state.current_question = ""
                            st.rerun()
                else:
                    st.error("Please load a demo image or upload and analyze an image first, then ask a question.")
        
        with col2:
            if st.button("🔄 Reset Chat", use_container_width=True):
                st.session_state.chat_memory.clear()
                st.session_state.chat_chain = None
                if 'image_description' in st.session_state:
                    del st.session_state.image_description
                if 'suggested_questions' in st.session_state:
                    del st.session_state.suggested_questions
                if 'demo_image' in st.session_state:
                    del st.session_state.demo_image
                    del st.session_state.demo_image_name
                st.success("✅ Chat reset!")
                st.rerun()

else:  # Invoice Extraction mode
    st.title("📊 Bulk Invoice Data Extraction & Processing")
    st.markdown("### Extract structured data from multiple invoice images using custom schemas")
    
    # Check API key
    if not st.session_state.api_key:
        st.error("⚠️ Please enter your Google Gemini API key in the sidebar to continue.")
        st.stop()
    
    # Step 1: Define Fields
    st.subheader("1️⃣ Define Extraction Fields")
    
    with st.expander("📋 Configure Extraction Fields", expanded=True):
        st.markdown("**Demo Mode Active** - A sample invoice schema has been loaded to help you explore the system's capabilities.")
        
        # Add field form with unique key
        with st.form("add_field_form", clear_on_submit=True):
            col1, col2, col3, col4 = st.columns([2, 2, 3, 1])
            
            with col1:
                field_name = st.text_input("Field Name", placeholder="field_name", key="field_name_input")
            with col2:
                data_type = st.selectbox("Data Type", ["str", "float", "int"], key="data_type_input")
            with col3:
                description = st.text_input("Description", placeholder="Description of the field", key="description_input")
            with col4:
                submitted = st.form_submit_button("➕ Add Field")
                
            if submitted:
                if field_name and description:
                    st.session_state.extraction_fields.append([field_name, data_type, description])
                    st.success(f"✅ Added field: {field_name}")
                    st.rerun()
                else:
                    st.error("Please fill in both field name and description")
        
        # Display current fields
        if st.session_state.extraction_fields:
            st.markdown("**Current Fields:**")
            for i, (name, dtype, desc) in enumerate(st.session_state.extraction_fields):
                col1, col2, col3, col4 = st.columns([2, 1, 3, 1])
                with col1:
                    st.text(name)
                with col2:
                    st.text(dtype)
                with col3:
                    st.text(desc)
                with col4:
                    if st.button("🗑️", key=f"delete_{i}", help="Delete field"):
                        st.session_state.extraction_fields.pop(i)
                        st.rerun()
    
    # Step 2: Upload Files
    st.subheader("2️⃣ Upload Files")
    
    # Demo Images Section for Bulk Processing
    st.markdown("**🎯 Quick Demo - Load Sample Invoices:**")
    
    demo_images = [
        ("Invoice Sample 1", "invoice-sample-1.jpg"),
        ("Invoice Sample 2", "invoice-sample-2.jpg"),
        ("Invoice Sample 3", "invoice-sample-3.jpg")
    ]
    
    col1,cal2s = st.columns([2,2])
    
    
    with col1:
        if st.button("📄 Load All Samples", use_container_width=True, help="Load all 3 sample invoices"):
            st.session_state.bulk_demo_images = []
            for name, filename in demo_images:
                demo_image_bytes = load_demo_image(filename)
                if demo_image_bytes:
                    st.session_state.bulk_demo_images.append({
                        'name': filename,
                        'data': demo_image_bytes
                    })
            st.success("✅ All samples loaded!")
            st.rerun()
    
    # Clear demo images button
    if 'bulk_demo_images' in st.session_state and st.session_state.bulk_demo_images:
        if st.button("🗑️ Clear Demo Images", help="Remove all loaded demo images"):
            st.session_state.bulk_demo_images = []
            st.success("✅ Demo images cleared!")
            st.rerun()
    
    st.divider()
    
    uploaded_files = st.file_uploader(
        "Choose invoice images",
        type=['png', 'jpg', 'jpeg'],
        accept_multiple_files=True,
        help="Upload multiple invoice images for batch processing"
    )
    
    # Combine uploaded files and demo images for processing
    total_files = 0
    if uploaded_files:
        total_files += len(uploaded_files)
    if 'bulk_demo_images' in st.session_state and st.session_state.bulk_demo_images:
        total_files += len(st.session_state.bulk_demo_images)
    
    if total_files > 0:
        st.success(f"✅ {total_files} files ready for processing")
        
        # Show files preview
        with st.expander("📁 Files Ready for Processing", expanded=False):
            preview_cols = st.columns(3)
            file_count = 0
            
            # Show demo images
            if 'bulk_demo_images' in st.session_state and st.session_state.bulk_demo_images:
                for demo_img in st.session_state.bulk_demo_images:
                    with preview_cols[file_count % 3]:
                        st.image(demo_img['data'], caption=f"Demo: {demo_img['name']}", use_container_width=True)
                        file_count += 1
            
            # Show uploaded files
            if uploaded_files:
                for file in uploaded_files[:6]:  # Show max 6 previews
                    with preview_cols[file_count % 3]:
                        st.image(file, caption=file.name, use_container_width=True)
                        file_count += 1
    
    # Step 3: Process Data
    st.subheader("3️⃣ Process Data")
    
    has_files = (uploaded_files and len(uploaded_files) > 0) or ('bulk_demo_images' in st.session_state and st.session_state.bulk_demo_images)
    
    if st.button("🚀 Process Images", type="primary", disabled=not has_files or not st.session_state.extraction_fields):
        if not has_files:
            st.error("Please upload files or load demo images.")
        elif not st.session_state.extraction_fields:
            st.error("Please define at least one extraction field.")
        else:
            # Generate schema
            schema_code = json_to_pydantic_model(st.session_state.extraction_fields)
            
            with st.spinner("Processing images..."):
                # Execute schema code
                locals_dict = {}
                exec(schema_code, globals(), locals_dict)
                Data = locals_dict['Data']
                
                # Initialize model
                model = initialize_model()
                structured_llm = model.with_structured_output(Data)
                
                # Process each image
                results = []
                
                # Combine all files for processing
                all_files = []
                
                # Add demo images
                if 'bulk_demo_images' in st.session_state and st.session_state.bulk_demo_images:
                    for demo_img in st.session_state.bulk_demo_images:
                        all_files.append({
                            'name': demo_img['name'],
                            'data': demo_img['data'],
                            'type': 'demo'
                        })
                
                # Add uploaded files
                if uploaded_files:
                    for file in uploaded_files:
                        all_files.append({
                            'name': file.name,
                            'data': file,
                            'type': 'uploaded'
                        })
                
                progress_bar = st.progress(0)
                
                for i, file_info in enumerate(all_files):
                    try:
                        # Get image description based on file type
                        if file_info['type'] == 'demo':
                            image_desc = get_image_description(file_info['data'])
                        else:
                            # Reset file pointer for uploaded files
                            file_info['data'].seek(0)
                            image_desc = get_image_description(file_info['data'])
                        
                        # Extract structured data
                        result = structured_llm.invoke(
                            f"Extract invoice data from the following text description of an invoice: {image_desc}"
                        )
                        
                        # Convert to dict
                        result_dict = result.dict()
                        result_dict['filename'] = file_info['name']
                        result_dict['source'] = file_info['type']
                        results.append(result_dict)
                        
                    except Exception as e:
                        results.append({
                            'filename': file_info['name'],
                            'source': file_info['type'],
                            'error': str(e)
                        })
                    
                    # Update progress
                    progress_bar.progress((i + 1) / len(all_files))
                
                # Store results
                st.session_state.extraction_results = results
                
                st.success("✅ Processing completed!")
    
    # Step 4: Review Results
    if 'extraction_results' in st.session_state:
        st.subheader("4️⃣ Review Results")
        
        results = st.session_state.extraction_results
        
        # Create DataFrame
        df = pd.DataFrame(results)
        
        # Display results
        st.dataframe(df, use_container_width=True)
        
        # Download options
        col1, col2, col3 = st.columns(3)
        
        with col1:
            # Download as Excel
            buffer = BytesIO()
            df.to_excel(buffer, index=False)
            buffer.seek(0)
            
            st.download_button(
                label="📥 Download Excel",
                data=buffer.getvalue(),
                file_name=f"invoice_extraction_results_{uuid.uuid4().hex[:8]}.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
        
        with col2:
            # Download as CSV
            csv = df.to_csv(index=False)
            st.download_button(
                label="📥 Download CSV",
                data=csv,
                file_name=f"invoice_extraction_results_{uuid.uuid4().hex[:8]}.csv",
                mime="text/csv"
            )
        
        with col3:
            # Download as JSON
            json_data = df.to_json(orient='records', indent=2)
            st.download_button(
                label="📥 Download JSON",
                data=json_data,
                file_name=f"invoice_extraction_results_{uuid.uuid4().hex[:8]}.json",
                mime="application/json"
            )
        
        # Edit results
        st.subheader("✏️ Edit Results")
        
        with st.expander("Edit Extraction Results", expanded=False):
            edited_df = st.data_editor(
                df,
                use_container_width=True,
                num_rows="dynamic"
            )
            
            if st.button("💾 Save Changes"):
                st.session_state.extraction_results = edited_df.to_dict('records')
                st.success("✅ Changes saved!")
                st.rerun()

# Footer
st.divider()
st.markdown(
    """
    <div style='text-align: center; color: #666;'>
        <p>Invoice Processing Assistant powered by Google Gemini</p>
    </div>
    """,
    unsafe_allow_html=True
)
