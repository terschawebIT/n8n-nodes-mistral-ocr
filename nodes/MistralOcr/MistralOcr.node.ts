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

			// Annotations-specific parameters
			{
				displayName: 'Annotation Types',
				name: 'annotationTypes',
				type: 'multiOptions',
				displayOptions: {
					show: {
						operation: ['ocrWithAnnotations'],
					},
				},
				default: ['bbox'],
				options: [
					{
						name: 'BBox Annotations',
						value: 'bbox',
						description: 'Annotate specific document elements (figures, charts, tables)',
					},
					{
						name: 'Document Annotations',
						value: 'document',
						description: 'Extract structured information about the entire document',
					},
				],
				description: 'Types of annotations to include',
			},

			// BBox Annotation Schema
			{
				displayName: 'BBox Annotation Schema',
				name: 'bboxAnnotationSchema',
				type: 'json',
				displayOptions: {
					show: {
						operation: ['ocrWithAnnotations'],
						annotationTypes: ['bbox'],
					},
				},
				default: JSON.stringify(
					{
						image_type: {
							type: 'string',
							description: 'The type of the image/element',
						},
						short_description: {
							type: 'string',
							description: 'A brief description of the element',
						},
						summary: {
							type: 'string',
							description: 'Detailed summary of the element',
						},
					},
					null,
					2,
				),
				description:
					'JSON Schema defining the structure for BBox annotations. Each property can have "type" and "description" fields.',
				placeholder:
					'{\n  "property_name": {\n    "type": "string",\n    "description": "Description for the annotation"\n  }\n}',
			},

			// Document Annotation Schema
			{
				displayName: 'Document Annotation Schema',
				name: 'documentAnnotationSchema',
				type: 'json',
				displayOptions: {
					show: {
						operation: ['ocrWithAnnotations'],
						annotationTypes: ['document'],
					},
				},
				default: JSON.stringify(
					{
						language: {
							type: 'string',
							description: 'The primary language of the document',
						},
						document_type: {
							type: 'string',
							description: 'The type/category of the document',
						},
						key_topics: {
							type: 'array',
							items: { type: 'string' },
							description: 'Main topics covered in the document',
						},
					},
					null,
					2,
				),
				description:
					'JSON Schema defining the structure for Document annotations. Each property can have "type", "description", and for arrays "items" fields.',
				placeholder:
					'{\n  "property_name": {\n    "type": "string",\n    "description": "Description for the annotation"\n  }\n}',
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
					const annotationTypes = this.getNodeParameter('annotationTypes', i) as string[];

					// Add BBox annotations
					if (annotationTypes.includes('bbox')) {
						const bboxSchemaStr = this.getNodeParameter('bboxAnnotationSchema', i) as string;
						try {
							const bboxSchema = JSON.parse(bboxSchemaStr);
							ocrRequestBody.bbox_annotation_format = MistralOcr.buildJsonSchema(
								bboxSchema,
								'BBoxAnnotation',
							);
						} catch (error: any) {
							throw new NodeOperationError(
								this.getNode(),
								`Invalid BBox Annotation Schema JSON: ${error.message}`,
								{ itemIndex: i },
							);
						}
					}

					// Add Document annotations
					if (annotationTypes.includes('document')) {
						const documentSchemaStr = this.getNodeParameter(
							'documentAnnotationSchema',
							i,
						) as string;
						const pagesStr = this.getNodeParameter('pages', i, '0-7') as string;

						try {
							const documentSchema = JSON.parse(documentSchemaStr);
							ocrRequestBody.document_annotation_format = MistralOcr.buildJsonSchema(
								documentSchema,
								'DocumentAnnotation',
							);

							// Add pages parameter
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
						} catch (error: any) {
							if (error instanceof NodeOperationError) throw error;
							throw new NodeOperationError(
								this.getNode(),
								`Invalid Document Annotation Schema JSON: ${error.message}`,
								{ itemIndex: i },
							);
						}
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
								annotationTypes: this.getNodeParameter('annotationTypes', i),
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
