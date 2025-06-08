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
4. **Choose Annotation Types**: Select BBox and/or Document annotations
5. **Configure Schemas**: Define what information to extract:

**Example BBox Schema** (for charts/figures):
```json
{
  "chart_type": {
    "type": "string",
    "description": "Type of chart (bar, line, pie, etc.)"
  },
  "title": {
    "type": "string", 
    "description": "Chart title or heading"
  },
  "key_insights": {
    "type": "array",
    "items": {"type": "string"},
    "description": "Main insights from the chart"
  }
}
```

**Example Document Schema** (for research papers):
```json
{
  "language": {
    "type": "string",
    "description": "Primary language of the document"
  },
  "document_type": {
    "type": "string", 
    "description": "Type of document (research paper, report, etc.)"
  },
  "abstract": {
    "type": "string",
    "description": "Document abstract or summary"
  },
  "authors": {
    "type": "array",
    "items": {"type": "string"},
    "description": "List of document authors"
  },
  "keywords": {
    "type": "array", 
    "items": {"type": "string"},
    "description": "Key topics and themes"
  }
}
```

6. **Execute**: Get OCR text PLUS structured annotations in a single response!

## Response Format

### Basic OCR Response
- **Extracted text content** from the OCR process
- **All Mistral OCR response data** (structured text, confidence scores, etc.)
- **Metadata** in `_metadata` object

### Annotations Response  
Everything from Basic OCR plus:
- **bbox_annotations**: Array of annotations for document elements (charts, figures, etc.)
- **document_annotation**: Structured information about the entire document
- **Enhanced metadata** with annotation types used

Example annotations response:
```json
{
  "text": "...",
  "bbox_annotations": [
    {
      "chart_type": "line chart",
      "title": "Sales Performance Q1-Q4", 
      "key_insights": ["Revenue increased 23%", "Peak in Q3"]
    }
  ],
  "document_annotation": {
    "language": "English",
    "document_type": "quarterly report",
    "keywords": ["sales", "performance", "revenue"]
  },
  "_metadata": {
    "operation": "ocrWithAnnotations",
    "annotationTypes": ["bbox", "document"],
    "processedAt": "2024-01-01T12:00:00Z"
  }
}
```

## Use Cases

### BBox Annotations Perfect For:
- 📊 **Chart Analysis**: Extract data insights from graphs and charts
- 📋 **Form Processing**: Structure form fields and signatures  
- 🖼️ **Image Cataloging**: Classify and describe images/figures
- 📄 **Layout Analysis**: Understand document structure and elements

### Document Annotations Perfect For:
- 📚 **Document Classification**: Categorize document types automatically
- 🔍 **Content Analysis**: Extract themes, topics, and key information
- 📊 **Metadata Extraction**: Get structured document properties
- 📑 **Document Summarization**: Generate structured summaries

### Combined Power:
- 📖 **Research Paper Processing**: Extract structure + analyze figures
- 📋 **Report Analysis**: Get overview + detailed chart insights  
- 📄 **Invoice Processing**: Document metadata + specific field extraction
- 📊 **Presentation Analysis**: Slide content + individual chart descriptions

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
- ✅ **BBox Annotations** - ✨ Extract structured data from document elements
- ✅ **Document Annotations** - ✨ Get structured document-level information  
- ✅ **Flexible JSON Schemas** - ✨ Define custom annotation structures
- ✅ **Combined Operations** - ✨ OCR + Annotations in one step
- ✅ **n8n best practices** - Following official node development standards

## Limitations

- **Document Annotations**: Limited to 8 pages maximum
- **BBox Annotations**: No page limit
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
