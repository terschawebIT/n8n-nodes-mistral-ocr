import FormData from 'form-data';
import {
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

export class MistralOcr implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Mistral OCR',
		name: 'mistralOcr',
		icon: 'file:mistral.svg',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["model"]}}',
		description:
			'Extract text from documents using Mistral OCR API with optional structured annotations',
		defaults: {
			name: 'Mistral OCR',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'mistralApi',
				required: true,
			},
		],

		properties: [
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
						description: 'Simple text extraction from documents',
					},
					{
						name: 'OCR with Annotations',
						value: 'ocrWithAnnotations',
						description:
							'Extract text with structured data annotations (BBox and/or Document level)',
					},
				],
				description: 'Type of OCR operation to perform',
			},
			{
				displayName: 'Input Data Field Name',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				description: 'Name of the binary property which contains the file to be processed',
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

			// Custom Fields Builder
			{
				displayName: 'Custom Fields',
				name: 'customFields',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						operation: ['ocrWithAnnotations'],
						documentTemplate: ['custom'],
					},
				},
				default: {},
				options: [
					{
						name: 'fields',
						displayName: 'Document Field',
						values: [
							{
								displayName: 'Field Name',
								name: 'fieldName',
								type: 'string',
								default: '',
								description: 'Name of the field to extract (e.g., "total_amount", "customer_number")',
								placeholder: 'total_amount',
							},
							{
								displayName: 'Field Description',
								name: 'fieldDescription',
								type: 'string',
								default: '',
								description: 'What information should be extracted',
								placeholder: 'The total amount of the invoice including tax',
							},
							{
								displayName: 'Field Type',
								name: 'fieldType',
								type: 'options',
								default: 'string',
								options: [
									{
										name: 'Text (String)',
										value: 'string',
									},
									{
										name: 'Number',
										value: 'number',
									},
									{
										name: 'Date',
										value: 'date',
									},
									{
										name: 'List of Texts',
										value: 'array',
									},
									{
										name: 'Yes/No (Boolean)',
										value: 'boolean',
									},
								],
								description: 'Type of data expected',
							},
						],
					},
				],
				description: 'Add fields you want to extract from the document',
			},

			// Quick Field Presets for Custom
			{
				displayName: 'Add Quick Field',
				name: 'quickField',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['ocrWithAnnotations'],
						documentTemplate: ['custom'],
					},
				},
				default: '',
				options: [
					{
						name: 'Select a common field...',
						value: '',
					},
					{
						name: '💰 Total Amount (Gesamtbetrag)',
						value: 'total_amount|The total amount including all taxes and fees|number',
					},
					{
						name: '👤 Customer Number (Kundennummer)',
						value: 'customer_number|Customer or client identification number|string',
					},
					{
						name: '📄 Document Number (Belegnummer)',
						value: 'document_number|Document, invoice or reference number|string',
					},
					{
						name: '📅 Document Date (Dokumentendatum)',
						value: 'document_date|Date when the document was created|date',
					},
					{
						name: '📧 Sender (Absender)',
						value: 'sender|Name or company who sent the document|string',
					},
					{
						name: '📨 Recipient (Empfänger)',
						value: 'recipient|Name or company who received the document|string',
					},
					{
						name: '📋 Reference (Aktenzeichen)',
						value: 'reference|File number, case reference or subject line|string',
					},
					{
						name: '💳 Payment Method (Zahlungsart)',
						value: 'payment_method|How the payment was made|string',
					},
					{
						name: '🏪 Company Name (Firmenname)',
						value: 'company_name|Company or organization name|string',
					},
					{
						name: '📍 Address (Adresse)',
						value: 'address|Full address information|string',
					},
				],
				description: 'Click to quickly add common fields to your extraction',
			},

			// Annotation Types (simplified)
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
				default: JSON.stringify(
					{
						element_type: {
							type: 'string',
							description: 'Type of visual element (chart, table, figure, etc.)',
						},
						description: {
							type: 'string',
							description: 'Description of what the element shows',
						},
						key_data: {
							type: 'array',
							items: { type: 'string' },
							description: 'Key data points or insights from the element',
						},
					},
					null,
					2,
				),
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
						annotationTypes: ['document'],
					},
				},
				default: '0-7',
				description:
					'Pages to process for Document Annotations (e.g., "0-7" or "0,1,2,3"). Max 8 pages for Document Annotations.',
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
						default: 24,
						description: 'Number of hours before the uploaded file expires (1-168 hours)',
						typeOptions: {
							minValue: 1,
							maxValue: 168,
						},
					},
				],
			},
		],
	};

	// Helper method to get predefined templates
	private static getTemplateSchema(template: string): any {
		const templates: { [key: string]: any } = {
			invoice: {
				total_amount: {
					type: 'number',
					description: 'Total amount including all taxes and fees'
				},
				net_amount: {
					type: 'number',
					description: 'Net amount before taxes'
				},
				tax_amount: {
					type: 'number',
					description: 'Tax amount'
				},
				customer_number: {
					type: 'string',
					description: 'Customer or client identification number'
				},
				invoice_number: {
					type: 'string',
					description: 'Invoice number or reference'
				},
				invoice_date: {
					type: 'string',
					description: 'Invoice date'
				},
				due_date: {
					type: 'string',
					description: 'Payment due date'
				},
				vendor_name: {
					type: 'string',
					description: 'Name of the company or vendor issuing the invoice'
				},
				customer_name: {
					type: 'string',
					description: 'Name of the customer or client'
				},
				payment_method: {
					type: 'string',
					description: 'Accepted payment methods'
				}
			},
			letter: {
				sender: {
					type: 'string',
					description: 'Name and address of the sender'
				},
				recipient: {
					type: 'string',
					description: 'Name and address of the recipient'
				},
				document_date: {
					type: 'string',
					description: 'Date when the letter was written'
				},
				reference: {
					type: 'string',
					description: 'File number, case reference or subject line'
				},
				subject: {
					type: 'string',
					description: 'Subject or topic of the letter'
				},
				letter_type: {
					type: 'string',
					description: 'Type of correspondence (official, personal, business, etc.)'
				}
			},
			contract: {
				contract_title: {
					type: 'string',
					description: 'Title or type of contract'
				},
				party_1: {
					type: 'string',
					description: 'First contracting party (name and details)'
				},
				party_2: {
					type: 'string',
					description: 'Second contracting party (name and details)'
				},
				contract_date: {
					type: 'string',
					description: 'Date when the contract was signed'
				},
				start_date: {
					type: 'string',
					description: 'Contract start date'
				},
				end_date: {
					type: 'string',
					description: 'Contract end date'
				},
				contract_amount: {
					type: 'number',
					description: 'Contract value or amount'
				},
				key_terms: {
					type: 'array',
					items: { type: 'string' },
					description: 'Key terms and conditions'
				}
			},
			receipt: {
				store_name: {
					type: 'string',
					description: 'Name of the store or business'
				},
				total_amount: {
					type: 'number',
					description: 'Total amount paid'
				},
				purchase_date: {
					type: 'string',
					description: 'Date of purchase'
				},
				receipt_number: {
					type: 'string',
					description: 'Receipt or transaction number'
				},
				payment_method: {
					type: 'string',
					description: 'How the payment was made (cash, card, etc.)'
				},
				items: {
					type: 'array',
					items: { type: 'string' },
					description: 'List of purchased items'
				}
			},
			id_document: {
				full_name: {
					type: 'string',
					description: 'Full name as shown on the document'
				},
				birth_date: {
					type: 'string',
					description: 'Date of birth'
				},
				id_number: {
					type: 'string',
					description: 'ID number or passport number'
				},
				nationality: {
					type: 'string',
					description: 'Nationality or citizenship'
				},
				issue_date: {
					type: 'string',
					description: 'Date when the document was issued'
				},
				expiry_date: {
					type: 'string',
					description: 'Document expiry date'
				},
				issuing_authority: {
					type: 'string',
					description: 'Authority that issued the document'
				}
			},
			research_paper: {
				title: {
					type: 'string',
					description: 'Title of the research paper'
				},
				authors: {
					type: 'array',
					items: { type: 'string' },
					description: 'List of authors'
				},
				abstract: {
					type: 'string',
					description: 'Abstract or summary of the paper'
				},
				keywords: {
					type: 'array',
					items: { type: 'string' },
					description: 'Keywords or key topics'
				},
				publication_date: {
					type: 'string',
					description: 'Publication date'
				},
				journal: {
					type: 'string',
					description: 'Journal or conference name'
				},
				doi: {
					type: 'string',
					description: 'DOI or other identifier'
				}
			}
		};

		return templates[template] || {};
	}

	// Helper method to build schema from custom fields
	private static buildCustomFieldSchema(customFields: any): any {
		const schema: any = {};

		if (customFields && customFields.fields) {
			for (const field of customFields.fields) {
				if (field.fieldName && field.fieldDescription) {
					schema[field.fieldName] = {
						type: field.fieldType === 'date' ? 'string' : field.fieldType,
						description: field.fieldDescription
					};

					// Handle array types
					if (field.fieldType === 'array') {
						schema[field.fieldName].items = { type: 'string' };
					}
				}
			}
		}

		return schema;
	}

	// Helper method to convert schema object to Mistral API format
	private static buildJsonSchema(schemaObj: any, schemaName: string): any {
		const properties: any = {};
		const required: string[] = [];

		for (const [key, config] of Object.entries(schemaObj)) {
			const configObj = config as any;
			properties[key] = {
				type: configObj.type,
				title: key
					.split('_')
					.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
					.join('_'),
			};

			if (configObj.description) {
				properties[key].description = configObj.description;
			}

			// Handle array types
			if (configObj.type === 'array' && configObj.items) {
				properties[key].items = configObj.items;
			}

			required.push(key);
		}

		return {
			type: 'json_schema',
			json_schema: {
				schema: {
					properties,
					required,
					title: schemaName,
					type: 'object',
					additionalProperties: false,
				},
				name: schemaName.toLowerCase(),
				strict: true,
			},
		};
	}

	// Helper method to parse pages parameter
	private static parsePages(pagesStr: string): number[] {
		if (!pagesStr) return [];

		// Handle range format like "0-7"
		if (pagesStr.includes('-')) {
			const [start, end] = pagesStr.split('-').map(Number);
			return Array.from({ length: end - start + 1 }, (_, i) => start + i);
		}

		// Handle comma-separated format like "0,1,2,3"
		return pagesStr
			.split(',')
			.map((s) => Number.parseInt(s.trim()))
			.filter((n) => !Number.isNaN(n));
	}

	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Legacy method needs refactoring in future version
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				// Get the binary data
				const operation = this.getNodeParameter('operation', i) as string;
				const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
				const model = this.getNodeParameter('model', i) as string;
				const options = this.getNodeParameter('options', i, {}) as {
					includeImageBase64?: boolean;
					expiryHours?: number;
				};

				const binaryData = items[i].binary?.[binaryPropertyName];

				if (!binaryData) {
					throw new NodeOperationError(
						this.getNode(),
						`No binary data found in property "${binaryPropertyName}"`,
						{ itemIndex: i },
					);
				}

				// Step 1: Upload file to Mistral
				const formData = new FormData();
				formData.append('purpose', 'ocr');
				formData.append('file', Buffer.from(binaryData.data, 'base64'), {
					filename: binaryData.fileName || 'document',
					contentType: binaryData.mimeType,
				});

				const uploadResponse = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'mistralApi',
					{
						method: 'POST',
						url: 'https://api.mistral.ai/v1/files',
						body: formData,
						headers: {
							...formData.getHeaders(),
						},
					},
				);

				if (!uploadResponse.id) {
					throw new NodeOperationError(this.getNode(), 'Failed to upload file to Mistral API', {
						itemIndex: i,
					});
				}

				// Step 2: Get signed URL automatically
				const signedUrlResponse = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'mistralApi',
					{
						method: 'GET',
						url: `https://api.mistral.ai/v1/files/${uploadResponse.id}/url`,
						qs: {
							expiry: options.expiryHours || 24,
						},
						headers: {
							Accept: 'application/json',
						},
					},
				);

				if (!signedUrlResponse.url) {
					throw new NodeOperationError(
						this.getNode(),
						'Failed to get signed URL from Mistral API',
						{ itemIndex: i },
					);
				}

				// Step 3: Build OCR request based on operation type
				const ocrRequestBody: any = {
					model,
					document: {
						type: 'document_url',
						document_url: signedUrlResponse.url,
					},
					include_image_base64: options.includeImageBase64 || false,
				};

				// Add annotations if requested
				if (operation === 'ocrWithAnnotations') {
					const documentTemplate = this.getNodeParameter('documentTemplate', i) as string;
					const includeBboxAnnotations = this.getNodeParameter('includeBboxAnnotations', i) as boolean;
					const advancedMode = this.getNodeParameter('advancedMode', i) as boolean;

					// Build document annotation schema
					let documentSchema: any = {};

					if (advancedMode) {
						// Use advanced JSON schema mode
						const documentSchemaStr = this.getNodeParameter('documentAnnotationSchema', i) as string;
						try {
							documentSchema = JSON.parse(documentSchemaStr);
						} catch (error: any) {
							throw new NodeOperationError(
								this.getNode(),
								`Invalid Document Annotation Schema JSON: ${error.message}`,
								{ itemIndex: i },
							);
						}
					} else {
						// Use template-based or custom field approach
						if (documentTemplate === 'custom') {
							const customFields = this.getNodeParameter('customFields', i, {}) as any;
							documentSchema = MistralOcr.buildCustomFieldSchema(customFields);
						} else {
							documentSchema = MistralOcr.getTemplateSchema(documentTemplate);
						}
					}

					// Add document annotation format if we have fields
					if (Object.keys(documentSchema).length > 0) {
						ocrRequestBody.document_annotation_format = MistralOcr.buildJsonSchema(
							documentSchema,
							'DocumentAnnotation',
						);

						// Add pages parameter (limit to 8 for document annotations)
						const pagesStr = this.getNodeParameter('pages', i, '0-7') as string;
						const pages = MistralOcr.parsePages(pagesStr);
						if (pages.length > 0) {
							if (pages.length > 8) {
								throw new NodeOperationError(
									this.getNode(),
									'Document Annotations are limited to maximum 8 pages',
									{ itemIndex: i },
								);
							}
							ocrRequestBody.pages = pages;
						}
					}

					// Add BBox annotations if requested
					if (includeBboxAnnotations) {
						let bboxSchema: any = {};

						if (advancedMode) {
							const bboxSchemaStr = this.getNodeParameter('bboxAnnotationSchema', i) as string;
							try {
								bboxSchema = JSON.parse(bboxSchemaStr);
							} catch (error: any) {
								throw new NodeOperationError(
									this.getNode(),
									`Invalid BBox Annotation Schema JSON: ${error.message}`,
									{ itemIndex: i },
								);
							}
						} else {
							// Use default bbox schema
							bboxSchema = {
								element_type: {
									type: 'string',
									description: 'Type of visual element (chart, table, figure, etc.)'
								},
								description: {
									type: 'string',
									description: 'Description of what the element shows'
								},
								key_data: {
									type: 'array',
									items: { type: 'string' },
									description: 'Key data points or insights from the element'
								}
							};
						}

						ocrRequestBody.bbox_annotation_format = MistralOcr.buildJsonSchema(
							bboxSchema,
							'BBoxAnnotation',
						);
					}
				}

				// Step 4: Process OCR
				const ocrResponse = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'mistralApi',
					{
						method: 'POST',
						url: 'https://api.mistral.ai/v1/ocr',
						body: ocrRequestBody,
						headers: {
							'Content-Type': 'application/json',
						},
					},
				);

				// Return the complete OCR result
				returnData.push({
					json: {
						...ocrResponse,
						_metadata: {
							operation,
							uploadedFileId: uploadResponse.id,
							signedUrl: signedUrlResponse.url,
							processedAt: new Date().toISOString(),
							...(operation === 'ocrWithAnnotations' && {
								documentTemplate: this.getNodeParameter('documentTemplate', i),
								includeBboxAnnotations: this.getNodeParameter('includeBboxAnnotations', i),
								advancedMode: this.getNodeParameter('advancedMode', i),
							}),
						},
					},
					binary: items[i].binary,
				});
			} catch (error: any) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
						pairedItem: {
							item: i,
						},
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
