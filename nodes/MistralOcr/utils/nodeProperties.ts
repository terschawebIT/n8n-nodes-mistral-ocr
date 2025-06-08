import type { INodeProperties } from 'n8n-workflow';
import { DEFAULT_BBOX_SCHEMA, DEFAULT_CUSTOM_FIELDS, LIMITS } from '../constants/defaults';

export const NODE_PROPERTIES: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		default: 'basicOcr',
		options: [
			{
				name: 'Basic OCR',
				value: 'basicOcr',
				description: 'Extract text from documents using Mistral OCR',
				action: 'Extract text from document',
			},
			{
				name: 'OCR with Annotations',
				value: 'ocrWithAnnotations',
				description: 'Extract text plus structured annotations using predefined templates',
				action: 'Extract structured data from document',
			},
		],
		description: 'Choose the type of OCR operation to perform',
	},

	{
		displayName: 'Binary Property',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		description: 'Name of the binary property containing the document to process',
		placeholder: 'data',
	},

	{
		displayName: 'Model',
		name: 'model',
		type: 'options',
		default: 'mistral-ocr-latest',
		options: [
			{
				name: 'Mistral OCR Latest',
				value: 'mistral-ocr-latest',
			},
		],
		description: 'The Mistral OCR model to use',
	},

	// Document Template Selection
	{
		displayName: 'Document Template',
		name: 'documentTemplate',
		type: 'options',
		displayOptions: {
			show: {
				operation: ['ocrWithAnnotations'],
			},
		},
		default: 'custom',
		options: [
			{
				name: 'Custom Fields',
				value: 'custom',
				description: 'Define your own fields',
			},
			{
				name: 'Invoice/Bill (Rechnung)',
				value: 'invoice',
				description: 'Extract invoice data: amount, customer, date, etc.',
			},
			{
				name: 'Letter/Correspondence (Brief)',
				value: 'letter',
				description: 'Extract sender, recipient, date, reference, etc.',
			},
			{
				name: 'Contract (Vertrag)',
				value: 'contract',
				description: 'Extract parties, dates, amounts, terms, etc.',
			},
			{
				name: 'Receipt (Beleg)',
				value: 'receipt',
				description: 'Extract store, amount, date, items, etc.',
			},
			{
				name: 'ID Document (Ausweis)',
				value: 'id_document',
				description: 'Extract name, birth date, ID number, etc.',
			},
			{
				name: 'Research Paper',
				value: 'research_paper',
				description: 'Extract title, authors, abstract, keywords, etc.',
			},
		],
		description: 'Choose a pre-configured template or define custom fields',
	},

	// Custom Fields as JSON for simplicity
	{
		displayName: 'Custom Fields',
		name: 'customFieldsJson',
		type: 'json',
		displayOptions: {
			show: {
				operation: ['ocrWithAnnotations'],
				documentTemplate: ['custom'],
			},
		},
		default: JSON.stringify(DEFAULT_CUSTOM_FIELDS, null, 2),
		description:
			'Define the fields you want to extract as JSON schema. Common fields: total_amount (number), customer_number (string), document_date (string), sender (string), recipient (string), reference (string)',
		placeholder: `{
  "field_name": {
    "type": "string",
    "description": "What this field contains"
  }
}`,
	},

	// Include Element Analysis
	{
		displayName: 'Include Element Analysis',
		name: 'includeBboxAnnotations',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['ocrWithAnnotations'],
			},
		},
		default: false,
		description: 'Also analyze charts, figures, tables and other visual elements in the document',
	},

	// Advanced JSON Schema fallback
	{
		displayName: 'Advanced: Custom JSON Schema',
		name: 'advancedMode',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['ocrWithAnnotations'],
			},
		},
		default: false,
		description: 'Enable advanced mode to define JSON schemas manually',
	},

	// BBox Annotation Schema (Advanced Mode)
	{
		displayName: 'BBox Annotation Schema',
		name: 'bboxAnnotationSchema',
		type: 'json',
		displayOptions: {
			show: {
				operation: ['ocrWithAnnotations'],
				advancedMode: [true],
				includeBboxAnnotations: [true],
			},
		},
		default: JSON.stringify(DEFAULT_BBOX_SCHEMA, null, 2),
		description: 'Advanced: JSON Schema for visual element annotations',
	},

	// Document Annotation Schema (Advanced Mode)
	{
		displayName: 'Document Annotation Schema',
		name: 'documentAnnotationSchema',
		type: 'json',
		displayOptions: {
			show: {
				operation: ['ocrWithAnnotations'],
				advancedMode: [true],
			},
		},
		default: JSON.stringify(
			{
				document_type: {
					type: 'string',
					description: 'The type/category of the document',
				},
				language: {
					type: 'string',
					description: 'The primary language of the document',
				},
			},
			null,
			2,
		),
		description: 'Advanced: JSON Schema for document-level annotations',
	},

	// Pages parameter for Document Annotations
	{
		displayName: 'Pages to Process',
		name: 'pages',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['ocrWithAnnotations'],
			},
		},
		default: '0-7',
		description: `Pages to process for Document Annotations (e.g., "0-7" or "0,1,2,3"). Max ${LIMITS.MAX_DOCUMENT_PAGES} pages for Document Annotations.`,
		placeholder: '0-7 or 0,1,2,3',
	},

	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		options: [
			{
				displayName: 'Include Image Base64',
				name: 'includeImageBase64',
				type: 'boolean',
				default: false,
				description: 'Whether to include the base64 encoded image in the response',
			},
			{
				displayName: 'File Expiry Hours',
				name: 'expiryHours',
				type: 'number',
				default: LIMITS.DEFAULT_EXPIRY_HOURS,
				description: `Number of hours before the uploaded file expires (${LIMITS.MIN_EXPIRY_HOURS}-${LIMITS.MAX_EXPIRY_HOURS} hours)`,
				typeOptions: {
					minValue: LIMITS.MIN_EXPIRY_HOURS,
					maxValue: LIMITS.MAX_EXPIRY_HOURS,
				},
			},
		],
	},
];
