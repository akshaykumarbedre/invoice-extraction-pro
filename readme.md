# Chat with Invoice Formatted Data Extraction

This project enables users to interactively chat with invoice documents and extract structured, formatted data from them. Leveraging advanced Natural Language Processing (NLP) and document parsing techniques, it provides an intuitive interface for querying and retrieving invoice details efficiently.

## Features

- **Chat-Based Interface:** Communicate with the system using natural language to ask questions about invoice documents.
- **Automatic Invoice Parsing:** Upload invoice files (PDF, image, etc.) and automatically extract key data fields such as invoice number, date, total amount, vendor details, line items, and more.
- **Structured Data Output:** Receive results in a structured and formatted manner (e.g., JSON, tables) suitable for further processing or integration.
- **Multi-Format Support:** Supports various invoice formats and layouts, including scanned images and digital PDFs.
- **Contextual Understanding:** Handles follow-up questions and context, enabling conversational extraction (e.g., "What’s the due date on the last invoice?").
- **Export Options:** Export extracted data for use in spreadsheets, databases, or accounting software.
- **Flexible Deployment:** Can be integrated as a web application, chatbot, or API service.

## Getting Started

### Prerequisites

- Python 3.8+
- (List any additional dependencies or tools required)

### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/akshaykumarbedre/Chat-with-invoice-formated-data-extraction.git
    cd Chat-with-invoice-formated-data-extraction
    ```
2. Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

### Usage

1. Start the application:
    ```bash
    python app.py
    ```
2. Open your browser and navigate to the provided local address.
3. Upload an invoice document and start chatting to extract information.

## Example Chat

> **User:** Uploads `invoice.pdf`  
> **User:** What is the total amount due?  
> **Bot:** The total amount due is $1,250.00  
> **User:** Who is the vendor?  
> **Bot:** The vendor is ABC Supplies Ltd.

## Technologies Used

- Python (Flask/FastAPI/Streamlit, etc.)
- NLP Libraries (spaCy, transformers, etc.)
- OCR (Tesseract, EasyOCR, or similar for image-based PDFs)
- PDF Parsing Libraries (pdfplumber, PyPDF2, etc.)
- Frontend: (Streamlit, React, etc. - specify as appropriate)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for new features, bug fixes, or suggestions.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Acknowledgements

- Open-source NLP and OCR libraries
- Inspiration from community-driven document extraction projects

---

*Created by [akshaykumarbedre](https://github.com/akshaykumarbedre)*
