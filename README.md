# n8n-nodes-mistral-ocr

This is an n8n community node that integrates with the Mistral OCR API to extract text from documents and images **with optional structured annotations** - all in a single step. 

Instead of managing separate upload, URL generation, and OCR processing steps, this node handles everything automatically and can additionally extract structured information using Mistral's powerful annotation capabilities.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### Manual Installation

1. Install the package in your n8n instance:
```bash
npm install n8n-nodes-mistral-ocr
```

2. Restart your n8n instance

## Prerequisites

You need a Mistral API account to use this node. You can sign up at [https://console.mistral.ai/](https://console.mistral.ai/).

## Credentials

This node uses the Mistral API credentials. You'll need:

- **API Key**: Your Mistral API key from your account settings

## Operations

### 1. Basic OCR Processing
Traditional text extraction from documents:

1. **Automatic File Upload** - Uploads your document to Mistral
2. **Automatic URL Generation** - Gets a signed processing URL 
3. **Automatic OCR Processing** - Extracts text from the document
4. **Returns Complete Results** - Text content plus metadata

### 2. OCR with Annotations ✨ **NEW**
Advanced processing that combines text extraction with structured data annotations:

**BBox Annotations**: Extract and describe specific document elements like:
- Charts and figures with custom descriptions
- Tables with structured summaries  
- Images with type classification
- Diagrams with detailed analysis

**Document Annotations**: Extract structured information about the entire document:
- Document language and type
- Key topics and themes
- URLs and references
- Chapter titles and structure
- Custom metadata fields

**Parameters:**
- **Input Data Field Name**: Name of the binary property containing the file to process (usually "data")
- **Model**: The Mistral OCR model to use (currently `mistral-ocr-latest`)
- **Annotation Types**: Choose BBox annotations, Document annotations, or both
- **BBox Annotation Schema**: JSON schema defining structure for element annotations
- **Document Annotation Schema**: JSON schema defining structure for document-level annotations  
- **Pages to Process**: Specify pages for Document Annotations (max 8 pages)
- **Options**:
  - **Include Image Base64**: Include the base64 encoded image in the response
  - **File Expiry Hours**: Hours before the uploaded file expires (1-168 hours, default: 24)

**Supported File Types:**
- PDF documents
- Image files (PNG, JPEG, GIF, BMP, TIFF, etc.)

## Example Usage

### Basic OCR Workflow
1. **Read File**: Use a "Read Binary File" node to load your document
2. **Mistral OCR**: Connect to the Mistral OCR node 
3. **Select Operation**: Choose "Basic OCR"
4. **Configure**: Set your binary field name (usually "data")
5. **Execute**: Get extracted text and metadata

### Advanced Annotations Workflow
1. **Read File**: Load your document (PDF, image, etc.)
2. **Mistral OCR**: Connect to the Mistral OCR node
3. **Select Operation**: Choose "OCR with Annotations"
4. **Choose Document Template**: Select from predefined templates or create custom fields
5. **Configure Extraction**: Easy-to-use interface - no JSON knowledge required!

**🎯 Document Templates Available:**

- 📄 **Invoice/Bill (Rechnung)**: Total amount, customer number, invoice date, vendor details
- 📧 **Letter/Correspondence (Brief)**: Sender, recipient, date, reference, subject
- 📋 **Contract (Vertrag)**: Parties, contract dates, amounts, key terms
- 🧾 **Receipt (Beleg)**: Store name, total amount, items, payment method
- 🆔 **ID Document (Ausweis)**: Name, birth date, ID numbers, validity dates
- 📖 **Research Paper**: Title, authors, abstract, keywords, publication info

**⚡ Quick Field Selection:**

For custom extractions, simply click "Add Quick Field" to instantly add:
- 💰 Total Amount (Gesamtbetrag)
- 👤 Customer Number (Kundennummer) 
- 📄 Document Number (Belegnummer)
- 📅 Document Date (Dokumentendatum)
- 📧 Sender (Absender)
- 📨 Recipient (Empfänger)  
- 📋 Reference (Aktenzeichen)
- 💳 Payment Method (Zahlungsart)
- 🏪 Company Name (Firmenname)
- 📍 Address (Adresse)

**🎨 Element Analysis:**

Enable "Include Element Analysis" to automatically analyze charts, figures, tables and other visual elements.

**⚙️ Advanced Mode:**

For expert users: Enable "Advanced Mode" to manually define JSON schemas.

6. **Execute**: Get OCR text PLUS structured annotations in a single response!

## Response Format

### Basic OCR Response
- **Extracted text content** from the OCR process
- **All Mistral OCR response data** (structured text, confidence scores, etc.)
- **Metadata** in `_metadata` object

### Annotations Response  
Everything from Basic OCR plus:
- **bbox_annotations**: Array of annotations for visual elements (charts, figures, etc.) - if enabled
- **document_annotation**: Structured information based on your chosen template or custom fields
- **Enhanced metadata** with template and settings used

Example annotations response (Invoice template):
```json
{
  "text": "...",
  "document_annotation": {
    "total_amount": 1247.50,
    "customer_number": "CUST-2024-001",
    "invoice_number": "INV-240115-789",
    "invoice_date": "2024-01-15",
    "vendor_name": "TechServices GmbH",
    "customer_name": "Müller Industries"
  },
  "bbox_annotations": [
    {
      "element_type": "table",
      "description": "Itemized billing table with services and costs",
      "key_data": ["Software License: €999.00", "Support: €248.50"]
    }
  ],
  "_metadata": {
    "operation": "ocrWithAnnotations",
    "documentTemplate": "invoice",
    "includeBboxAnnotations": true,
    "processedAt": "2024-01-01T12:00:00Z"
  }
}
```

## Use Cases

### Template-Based Extraction Perfect For:
- 📄 **Invoice Processing**: Automatically extract amounts, customer details, dates
- 📧 **Mail Management**: Parse correspondence for sender, recipient, references
- 📋 **Contract Analysis**: Extract parties, terms, dates, and amounts
- 🧾 **Expense Management**: Process receipts and extract transaction details
- 🆔 **Identity Verification**: Extract personal details from ID documents
- 📖 **Research Automation**: Process academic papers for metadata

### Element Analysis Perfect For:
- 📊 **Chart Processing**: Extract insights from graphs and visualizations
- 📋 **Form Recognition**: Structure form fields and analyze layouts
- 🖼️ **Figure Analysis**: Describe and categorize images and diagrams
- 📑 **Table Extraction**: Convert tables to structured data

### Combined Power:
- 📄 **Smart Invoice Processing**: Get structured data + analyze embedded charts
- 📧 **Complete Document Analysis**: Extract metadata + process attachments
- 📊 **Report Intelligence**: Document summary + detailed figure insights
- 📋 **Comprehensive Form Processing**: Field extraction + signature analysis

## Error Handling

The node includes comprehensive error handling for:
- Invalid API credentials
- Missing binary data
- Unsupported file formats
- File upload failures
- API rate limits and network issues
- OCR processing errors
- **Invalid annotation schemas** ✨ **NEW**
- **Page limit violations** ✨ **NEW**

All errors are handled gracefully with meaningful error messages.

## Development

### Building

```bash
npm run build
```

### Code Quality (using Biome)

```bash
npm run check      # Check code quality and formatting
npm run check:fix  # Auto-fix issues
npm run lint       # Lint only
npm run format     # Format only
```

### Local Development

1. Clone this repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Link to your n8n instance for testing

### Requirements

- Node.js 20+
- npm
- n8n instance for testing

## Features

- ✅ **One-step OCR processing** - No complex workflows needed
- ✅ **Automatic file handling** - Upload, URL generation, and processing
- ✅ **Multiple file formats** - PDF, images (PNG, JPEG, GIF, etc.)
- ✅ **Configurable options** - Model selection, expiry times, base64 output
- ✅ **Error handling** - Comprehensive error management
- ✅ **Metadata included** - File IDs, processing timestamps, URLs
- ✅ **Template-Based Extraction** - ✨ Pre-built templates for common documents (invoices, letters, contracts, etc.)
- ✅ **Custom Field Builder** - ✨ Easy-to-use interface for defining extraction fields
- ✅ **Quick Field Selection** - ✨ One-click addition of common fields (amounts, dates, references)
- ✅ **Visual Element Analysis** - ✨ Optional chart, table, and figure analysis
- ✅ **Advanced Mode** - ✨ Raw JSON schema access for power users
- ✅ **Combined Operations** - ✨ OCR + Structured Extraction in one step
- ✅ **n8n best practices** - Following official node development standards

## Limitations

- **Document Templates/Custom Fields**: Limited to 8 pages maximum
- **Element Analysis**: No page limit
- **File Size**: Maximum 50MB per document
- **Document Length**: Maximum 1,000 pages

## Status

🚀 **Ready for use** - Core functionality and annotations implemented and tested

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

Before contributing:
1. Run `npm run check` to ensure code quality
2. Test with your own Mistral API credentials
3. Update documentation if needed

## License

[MIT](LICENSE.md)

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Mistral API documentation](https://docs.mistral.ai/api/)
- [Mistral OCR API reference](https://docs.mistral.ai/api/#tag/ocr)
- [Mistral OCR Annotations Guide](https://docs.mistral.ai/capabilities/OCR/annotations/)

## Support

For issues related to this node, please open an issue in this repository.

For general n8n questions, visit the [n8n community forum](https://community.n8n.io/). 
