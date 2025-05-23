# Invoice Extraction Pro

## Project Overview

Invoice Extraction Pro is an AI-powered web application designed to automate the extraction of data from invoice documents. The system uses advanced computer vision and natural language processing to identify, extract, and process key information from invoice images, enabling users to quickly digitize and analyze invoice data without manual entry.

![Invoice Extraction Pro](https://placeholder-for-project-screenshot.com/screenshot.png)

## Key Features

### 1. Single Invoice Processing

- **AI-Powered Document Analysis**: Upload an invoice image to automatically extract key information
- **Interactive Chat Interface**: Ask questions about the invoice in natural language
- **Smart Extraction**: Automatically identifies invoice number, date, amount, vendor details, and line items
- **Suggested Questions**: Intelligent suggestions for relevant follow-up questions
- **Demo Mode**: Try the system with sample invoices

### 2. Batch Processing

- **Schema Definition**: Create custom templates to specify which fields to extract
- **Bulk Upload**: Process multiple invoices simultaneously
- **Data Validation**: Review and edit extracted information
- **Excel Export**: Export results to spreadsheet format
- **Multi-Step Workflow**: Clear, guided process from upload to results

### 3. Common Features

- **Modern UI**: Clean, intuitive interface with workflow-based design
- **Light/Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Feedback**: Processing status and notifications
- **API Integration**: Connects with Google Gemini for AI processing

## Technology Stack

### Frontend
- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS
- **UI Libraries**: Lucide React (icons)
- **HTTP Client**: Axios
- **Markdown Rendering**: React Markdown

### Backend
- **Language**: Python
- **API Framework**: Flask
- **AI/ML**: Google Gemini API for natural language processing
- **Computer Vision**: OCR for text extraction from images
- **Data Processing**: Pandas for data manipulation

## Getting Started

### Prerequisites
- Node.js (v14+) 
- Python (v3.8+)
- Google Gemini API Key

### Installation

#### Backend Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/invoice-extraction-pro.git
   cd invoice-extraction-pro
   ```

2. Set up Python virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Set your Google Gemini API key:
   - Create a `.env` file in the backend directory
   - Add your API key: `GEMINI_API_KEY=your_api_key_here`

4. Start the backend server:
   ```bash
   python app.py
   ```
   
#### Frontend Setup
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## Usage Guide

### Single Invoice Processing

1. Navigate to the "Single Invoice" page
2. Upload an invoice image or use the "Try Demo" button
3. Wait for the AI to process the image and extract information
4. Use the chat interface to ask questions about the invoice
   - Example: "What is the total amount?"
   - Example: "Who is the vendor?"
5. Click on suggested questions or type your own queries
6. Use the "New Invoice" button to start over

### Batch Processing

1. Navigate to the "Batch Processing" page
2. Define extraction fields (or use "Load Demo Data")
   - Add fields like invoice_number, date, total_amount, etc.
   - Specify data types for each field
3. Create the template
4. Upload multiple invoice files
   - Drag and drop files or use the file browser
   - Alternatively, use "Load Demo Files"
5. Upload the files
6. Process the data with "Extract Data Now"
7. Review the extracted information in the table
   - Edit any incorrect values by clicking on cells
8. Export the data to Excel
9. Use "Start New Batch" to process another set of invoices

## Project Structure

```
invoice-extraction-pro/
├── backend/                # Python Flask server
│   ├── app.py              # Main Flask application
│   ├── requirements.txt    # Python dependencies
│   └── processors/         # Invoice processing modules
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           
│   │   │   ├── imagedest/  # Single invoice processing
│   │   │   ├── bulkimgpro/ # Batch processing
│   │   │   └── components/ # Shared components
│   ├── public/             # Static assets
│   └── package.json        # Node.js dependencies
└── README.md               # Project documentation
```

## API Endpoints

### `/upload_image` (POST)
- Uploads and processes a single invoice image
- Returns extracted information and suggested questions

### `/chat` (POST)
- Processes natural language questions about invoice
- Returns AI-generated answers

### `/create_schema` (POST)
- Creates a template for batch processing
- Returns schema_id for reference

### `/upload_images` (POST)
- Uploads multiple invoice files for batch processing
- Returns job_id for tracking

### `/process_images` (POST)
- Processes uploaded images using the defined schema
- Returns extracted data results

### `/download_excel/:job_id` (GET)
- Generates and downloads Excel file with extracted data

## Contributing

We welcome contributions to improve Invoice Extraction Pro. Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Gemini API for providing the AI capabilities
- Open-source community for the various libraries used
- All contributors who have helped shape this project

---

© 2025 Invoice Extraction Pro. All rights reserved.
