# n8n-nodes-mistral-ocr

This is an n8n community node that integrates with the Mistral OCR API to extract text from documents and images **in a single step**. 

Instead of managing separate upload, URL generation, and OCR processing steps, this node handles everything automatically.

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

### One-Step OCR Processing
This node performs all OCR steps automatically in a single operation:

1. **Automatic File Upload** - Uploads your document to Mistral
2. **Automatic URL Generation** - Gets a signed processing URL 
3. **Automatic OCR Processing** - Extracts text from the document
4. **Returns Complete Results** - Text content plus metadata

**Parameters:**
- **Input Data Field Name**: Name of the binary property containing the file to process (usually "data")
- **Model**: The Mistral OCR model to use (currently `mistral-ocr-latest`)
- **Options**:
  - **Include Image Base64**: Include the base64 encoded image in the response
  - **File Expiry Hours**: Hours before the uploaded file expires (1-168 hours, default: 24)

**Supported File Types:**
- PDF documents
- Image files (PNG, JPEG, GIF, BMP, TIFF, etc.)

## Example Usage

1. **Read File**: Use a "Read Binary File" node to load your document
2. **Mistral OCR**: Connect to the Mistral OCR node 
3. **Configure**: Set your binary field name (usually "data")
4. **Execute**: The node automatically:
   - ✅ Uploads your file to Mistral
   - ✅ Gets a signed URL for processing
   - ✅ Performs OCR extraction
   - ✅ Returns the extracted text and metadata

**That's it!** No need for multiple nodes or complex workflows.

## Response Format

The node returns the complete OCR results in a single response:
- **Extracted text content** from the OCR process
- **All Mistral OCR response data** (structured text, confidence scores, etc.)
- **Metadata** in `_metadata` object:
  - `uploadedFileId`: ID of the uploaded file
  - `signedUrl`: The signed URL used for processing  
  - `processedAt`: Timestamp of processing
- **Optional base64 image data** (if requested)

## Error Handling

The node includes comprehensive error handling for:
- Invalid API credentials
- Missing binary data
- Unsupported file formats
- File upload failures
- API rate limits and network issues
- OCR processing errors

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
- ✅ **n8n best practices** - Following official node development standards

## Status

🚀 **Ready for use** - Core functionality implemented and tested

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

## Support

For issues related to this node, please open an issue in this repository.

For general n8n questions, visit the [n8n community forum](https://community.n8n.io/). 
