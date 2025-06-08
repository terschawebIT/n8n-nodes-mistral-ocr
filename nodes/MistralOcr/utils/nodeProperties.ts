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

	// Custom Fields as User-Friendly Collection
	{
		displayName: 'Custom Fields',
		name: 'customFields',
		type: 'fixedCollection',
		displayOptions: {
			show: {
				operation: ['ocrWithAnnotations'],
				documentTemplate: ['custom'],
			},
		},
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		options: [
			{
				name: 'field',
				displayName: 'Field',
				values: [
					{
						displayName: 'Field Name',
						name: 'fieldName',
						type: 'options',
						default: '',
						required: true,
						options: [
							{
								name: '🔧 Custom Field Name',
								value: '__custom__',
								description: 'Enter a custom field name - no auto-fill',
							},
							{
								name: '💰 Total Amount (total_amount)',
								value: 'total_amount',
								description: 'Total amount including all taxes and fees',
							},
							{
								name: '💳 Net Amount (net_amount)',
								value: 'net_amount',
								description: 'Net amount before taxes',
							},
							{
								name: '🏷️ Tax Amount (tax_amount)',
								value: 'tax_amount',
								description: 'Tax amount',
							},
							{
								name: '💸 Skonto Percent (skontoPercent)',
								value: 'skontoPercent',
								description:
									'Early payment discount percentage as decimal (e.g. "Skonto 2%", "2,0% discount"). Extract decimal value, return null if not found.',
							},
							{
								name: '💵 Amount without Skonto (amountWithoutSkonto)',
								value: 'amountWithoutSkonto',
								description:
									'Gross amount from lines like "Bruttobetrag", "Gesamt", "Total" or net + tax. Return as decimal with dot separator, null if not found.',
							},
							{
								name: '💴 Amount with Skonto (amountWithSkonto)',
								value: 'amountWithSkonto',
								description:
									'Amount with early payment discount applied (explicit "Zahlbetrag" or calculated). Return as decimal with dot separator, 2 decimal places, null if not found.',
							},
							{
								name: '👤 Customer Number (customer_number)',
								value: 'customer_number',
								description: 'Customer or client identification number',
							},
							{
								name: '📄 Document Number (document_number)',
								value: 'document_number',
								description: 'Invoice, receipt, or document number',
							},
							{
								name: '📝 Document Title (document_title)',
								value: 'document_title',
								description:
									'Title or brief summary of the document content (e.g. "Invoice for IT Services", "Contract for Office Rental")',
							},
							{
								name: '📅 Document Date (document_date)',
								value: 'document_date',
								description:
									'Date when the document was created in DD.MM.YYYY format, return null if not found',
							},
							{
								name: '⏰ Due Date (dueDate)',
								value: 'dueDate',
								description: 'Payment due date in DD.MM.YYYY format, return null if not found',
							},
							{
								name: '⚡ Skonto Due Date (dueDateSkonto)',
								value: 'dueDateSkonto',
								description:
									'Early payment discount due date in DD.MM.YYYY format, return null if not found',
							},
							{
								name: '📧 Sender (sender)',
								value: 'sender',
								description: 'Name or company name of the sender (without address)',
							},
							{
								name: '📨 Recipient (recipient)',
								value: 'recipient',
								description: 'Name or company name of the recipient (without address)',
							},
							{
								name: '📍 Sender Address (sender_address)',
								value: 'sender_address',
								description: 'Full address of the sender',
							},
							{
								name: '📮 Recipient Address (recipient_address)',
								value: 'recipient_address',
								description: 'Full address of the recipient',
							},
							{
								name: '📋 Reference (reference)',
								value: 'reference',
								description: 'File number, case reference or subject line',
							},
							{
								name: '🏪 Company Name (company_name)',
								value: 'company_name',
								description: 'Name of the company',
							},
							{
								name: '📍 Address (address)',
								value: 'address',
								description: 'Street address',
							},
							{
								name: '💳 Payment Method (payment_method)',
								value: 'payment_method',
								description: 'How the payment was made',
							},
							{
								name: '📞 Phone Number (phone_number)',
								value: 'phone_number',
								description: 'Contact phone number',
							},
							{
								name: '✉️ Email Address (email)',
								value: 'email',
								description: 'Email address',
							},
						],
						description: 'Select a common field or choose "Custom" to enter your own field name',
					},
					{
						displayName: 'Custom Field Name',
						name: 'customFieldName',
						type: 'string',
						displayOptions: {
							show: {
								fieldName: ['__custom__'],
							},
						},
						default: '',
						required: true,
						description: 'Enter your custom field name',
						placeholder: 'my_custom_field',
					},
					// Smart Field Type for amount fields (auto-selects Number)
					{
						displayName: 'Field Type',
						name: 'fieldType',
						type: 'options',
						default: 'number',
						displayOptions: {
							show: {
								fieldName: [
									'total_amount',
									'net_amount',
									'tax_amount',
									'skontoPercent',
									'amountWithoutSkonto',
									'amountWithSkonto',
								],
							},
						},
						options: [
							{
								name: 'Number',
								value: 'number',
								description: 'Numeric values like amounts, quantities, IDs',
							},
							{
								name: 'Text (String)',
								value: 'string',
								description: 'Text content like names, addresses, references',
							},
							{
								name: 'Date',
								value: 'date',
								description: 'Date values (stored as string)',
							},
							{
								name: 'List (Array)',
								value: 'array',
								description: 'Multiple items like authors, keywords, items',
							},
							{
								name: 'Yes/No (Boolean)',
								value: 'boolean',
								description: 'True/false values',
							},
						],
						description:
							'The type of data this field contains. Auto-selected as Number for amount fields.',
					},
					// Smart Field Type for text fields (auto-selects String)
					{
						displayName: 'Field Type',
						name: 'fieldType',
						type: 'options',
						default: 'string',
						displayOptions: {
							show: {
								fieldName: [
									'customer_number',
									'document_number',
									'document_title',
									'document_date',
									'dueDate',
									'dueDateSkonto',
									'sender',
									'recipient',
									'sender_address',
									'recipient_address',
									'reference',
									'company_name',
									'address',
									'payment_method',
									'phone_number',
									'email',
									'__custom__',
								],
							},
						},
						options: [
							{
								name: 'Text (String)',
								value: 'string',
								description: 'Text content like names, addresses, references',
							},
							{
								name: 'Number',
								value: 'number',
								description: 'Numeric values like amounts, quantities, IDs',
							},
							{
								name: 'Date',
								value: 'date',
								description: 'Date values (stored as string)',
							},
							{
								name: 'List (Array)',
								value: 'array',
								description: 'Multiple items like authors, keywords, items',
							},
							{
								name: 'Yes/No (Boolean)',
								value: 'boolean',
								description: 'True/false values',
							},
						],
						description:
							'The type of data this field contains. Auto-selected as String for text fields.',
					},
					// Smart Auto-Fill Notice
					{
						displayName: 'ℹ️ Smart Auto-Fill Active',
						name: 'autoFillNotice',
						type: 'notice',
						displayOptions: {
							hide: {
								fieldName: ['__custom__'],
							},
						},
						default: '',
						description:
							'Field Type and Description are automatically filled based on your selection. You can still modify them if needed.',
					},
					// Smart Descriptions for each predefined field
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: 'Total amount including all taxes and fees',
						displayOptions: {
							show: {
								fieldName: ['total_amount'],
							},
						},
						required: true,
						description: 'Auto-filled smart description. You can modify this as needed.',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: 'Net amount before taxes',
						displayOptions: {
							show: {
								fieldName: ['net_amount'],
							},
						},
						required: true,
						description: 'Auto-filled smart description. You can modify this as needed.',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: 'Tax amount',
						displayOptions: {
							show: {
								fieldName: ['tax_amount'],
							},
						},
						required: true,
						description: 'Auto-filled smart description. You can modify this as needed.',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default:
							'Early payment discount percentage as decimal (e.g. "Skonto 2%", "2,0% discount"). Extract decimal value, return null if not found.',
						displayOptions: {
							show: {
								fieldName: ['skontoPercent'],
							},
						},
						required: true,
						description: 'Auto-filled smart description. You can modify this as needed.',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default:
							'Gross amount from lines like "Bruttobetrag", "Gesamt", "Total" or net + tax. Return as decimal with dot separator, null if not found.',
						displayOptions: {
							show: {
								fieldName: ['amountWithoutSkonto'],
							},
						},
						required: true,
						description: 'Auto-filled smart description. You can modify this as needed.',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default:
							'Amount with early payment discount applied (explicit "Zahlbetrag" or calculated). Return as decimal with dot separator, 2 decimal places, null if not found.',
						displayOptions: {
							show: {
								fieldName: ['amountWithSkonto'],
							},
						},
						required: true,
						description: 'Auto-filled smart description. You can modify this as needed.',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: 'Customer or client identification number',
						displayOptions: {
							show: {
								fieldName: ['customer_number'],
							},
						},
						required: true,
						description: 'Auto-filled smart description. You can modify this as needed.',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: 'Invoice, receipt, or document number',
						displayOptions: {
							show: {
								fieldName: ['document_number'],
							},
						},
						required: true,
						description: 'Auto-filled smart description. You can modify this as needed.',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default:
							'Title or brief summary of the document content (e.g. "Invoice for IT Services", "Contract for Office Rental")',
						displayOptions: {
							show: {
								fieldName: ['document_title'],
							},
						},
						required: true,
						description: 'Auto-filled smart description. You can modify this as needed.',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default:
							'Date when the document was created in DD.MM.YYYY format, return null if not found',
						displayOptions: {
							show: {
								fieldName: ['document_date'],
							},
						},
						required: true,
						description: 'Auto-filled smart description. You can modify this as needed.',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: 'Payment due date in DD.MM.YYYY format, return null if not found',
						displayOptions: {
							show: {
								fieldName: ['dueDate'],
							},
						},
						required: true,
						description: 'Auto-filled smart description. You can modify this as needed.',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default:
							'Early payment discount due date in DD.MM.YYYY format, return null if not found',
						displayOptions: {
							show: {
								fieldName: ['dueDateSkonto'],
							},
						},
						required: true,
						description: 'Auto-filled smart description. You can modify this as needed.',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: 'Name or company name of the sender (without address)',
						displayOptions: {
							show: {
								fieldName: ['sender'],
							},
						},
						required: true,
						description: 'Auto-filled smart description. You can modify this as needed.',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: 'Name or company name of the recipient (without address)',
						displayOptions: {
							show: {
								fieldName: ['recipient'],
							},
						},
						required: true,
						description: 'Auto-filled smart description. You can modify this as needed.',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: 'Full address of the sender',
						displayOptions: {
							show: {
								fieldName: ['sender_address'],
							},
						},
						required: true,
						description: 'Auto-filled smart description. You can modify this as needed.',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: 'Full address of the recipient',
						displayOptions: {
							show: {
								fieldName: ['recipient_address'],
							},
						},
						required: true,
						description: 'Auto-filled smart description. You can modify this as needed.',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: 'File number, case reference or subject line',
						displayOptions: {
							show: {
								fieldName: ['reference'],
							},
						},
						required: true,
						description: 'Auto-filled smart description. You can modify this as needed.',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: 'Name of the company',
						displayOptions: {
							show: {
								fieldName: ['company_name'],
							},
						},
						required: true,
						description: 'Auto-filled smart description. You can modify this as needed.',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: 'Street address',
						displayOptions: {
							show: {
								fieldName: ['address'],
							},
						},
						required: true,
						description: 'Auto-filled smart description. You can modify this as needed.',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: 'How the payment was made',
						displayOptions: {
							show: {
								fieldName: ['payment_method'],
							},
						},
						required: true,
						description: 'Auto-filled smart description. You can modify this as needed.',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: 'Contact phone number',
						displayOptions: {
							show: {
								fieldName: ['phone_number'],
							},
						},
						required: true,
						description: 'Auto-filled smart description. You can modify this as needed.',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: 'Email address',
						displayOptions: {
							show: {
								fieldName: ['email'],
							},
						},
						required: true,
						description: 'Auto-filled smart description. You can modify this as needed.',
					},
					// Custom field description
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								fieldName: ['__custom__'],
							},
						},
						required: true,
						description:
							'Describe what this field should contain to help the AI extract it correctly',
						placeholder: 'What information should be extracted for this field?',
					},
					{
						displayName: 'Required',
						name: 'required',
						type: 'boolean',
						default: true,
						description: 'Whether this field must be found in the document',
					},
				],
			},
		],
		description:
			'Define the fields you want to extract from the document. Add as many fields as you need.',
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
