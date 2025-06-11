import FormData from 'form-data';
import type {
	IBinaryData,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError, NodeApiError } from 'n8n-workflow';

import { DEFAULT_BBOX_SCHEMA, LIMITS, MISTRAL_API_ENDPOINTS } from './constants/defaults';
import { getDocumentTemplate } from './templates/documentTemplates';
// Local imports
import type {
	DocumentTemplateType,
	MistralApiResponse,
	MistralOcrOptions,
	MistralOcrRequest,
	NodeExecutionMetadata,
} from './types';
import { NODE_PROPERTIES } from './utils/nodeProperties';
import {
	buildCustomFieldsFromCollection,
	buildJsonSchema,
	parseCustomFieldsJson,
	parsePages,
} from './utils/schemaUtils';

export class MistralOcr implements INodeType {

	description: INodeTypeDescription = {
		displayName: 'Mistral OCR',
		name: 'mistralOcr',
		icon: 'file:mistral.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Extract text and structured data from documents using Mistral OCR API',
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
		requestDefaults: {
			baseURL: 'https://api.mistral.ai',
		},
		properties: NODE_PROPERTIES,
	};

	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Main execute method naturally has high complexity due to various operation types
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Helper function for rate limiting and retry logic
		const makeRequestWithRetry = async (
			requestOptions: any,
			maxRetries: number = 3,
			baseDelay: number = 1000,
		): Promise<any> => {
			let lastError: any;

			for (let attempt = 0; attempt <= maxRetries; attempt++) {
				try {
					return await this.helpers.httpRequestWithAuthentication.call(this, 'mistralApi', requestOptions);
				} catch (error: any) {
					lastError = error;

					// Check if it's a rate limiting error (429)
					if (error.httpCode === '429' || error.message?.includes('429')) {
						if (attempt < maxRetries) {
							// Calculate exponential backoff delay
							const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
							console.log(`Rate limit hit, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
							await new Promise(resolve => setTimeout(resolve, delay));
							continue;
						} else {
							// Max retries reached, throw a more informative error
							throw new NodeOperationError(
								this.getNode(),
								`Mistral API rate limit exceeded. Service tier capacity exceeded for this model. Please try again later or consider upgrading your Mistral API plan.`,
								{
									description: 'The Mistral OCR API is receiving too many requests. This usually happens when your API plan\'s rate limits are exceeded.',
								}
							);
						}
					}

					// If it's not a rate limiting error, throw immediately
					throw error;
				}
			}

			throw lastError;
		};

		for (let i = 0; i < items.length; i++) {
			try {
				// Get parameters
				const operation = this.getNodeParameter('operation', i) as string;
				const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
				const model = this.getNodeParameter('model', i) as string;
				const options = this.getNodeParameter('options', i, {}) as MistralOcrOptions;

				const binaryData = items[i].binary?.[binaryPropertyName] as IBinaryData;

				if (!binaryData) {
					throw new NodeOperationError(
						this.getNode(),
						`No binary data found in property "${binaryPropertyName}"`,
						{ itemIndex: i },
					);
				}

				// Validate file size (50MB limit according to Mistral documentation)
				const fileSizeBytes = Buffer.byteLength(binaryData.data, 'base64');
				if (fileSizeBytes > LIMITS.MAX_FILE_SIZE) {
					throw new NodeOperationError(
						this.getNode(),
						`File size (${Math.round(fileSizeBytes / 1024 / 1024)}MB) exceeds the maximum allowed size of ${LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB`,
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

				const uploadResponse = await makeRequestWithRetry({
					method: 'POST',
					url: MISTRAL_API_ENDPOINTS.UPLOAD,
					body: formData,
					headers: {
						...formData.getHeaders(),
					},
				});

				if (!uploadResponse.id) {
					throw new NodeOperationError(this.getNode(), 'Failed to upload file to Mistral API', {
						itemIndex: i,
					});
				}

				// Step 2: Get signed URL
				const signedUrlResponse = await makeRequestWithRetry({
					method: 'GET',
					url: MISTRAL_API_ENDPOINTS.GET_URL(uploadResponse.id),
					qs: {
						expiry: options.expiryHours || LIMITS.DEFAULT_EXPIRY_HOURS,
					},
					headers: {
						Accept: 'application/json',
					},
				});

				if (!signedUrlResponse.url) {
					throw new NodeOperationError(
						this.getNode(),
						'Failed to get signed URL from Mistral API',
						{ itemIndex: i },
					);
				}

				// Step 3: Build OCR request
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
					const documentTemplate = this.getNodeParameter(
						'documentTemplate',
						i,
					) as DocumentTemplateType;
					const includeBboxAnnotations = this.getNodeParameter(
						'includeBboxAnnotations',
						i,
					) as boolean;
					const advancedMode = this.getNodeParameter('advancedMode', i) as boolean;

					// Build document annotation schema
					let documentSchema: any = {};
					let customFields: any = undefined;

					if (advancedMode) {
						// Use advanced JSON schema mode
						const documentSchemaStr = this.getNodeParameter(
							'documentAnnotationSchema',
							i,
						) as string;
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
							customFields = this.getNodeParameter('customFields', i, { field: [] }) as any;
							try {
								documentSchema = buildCustomFieldsFromCollection(customFields);
							} catch (error: any) {
								throw new NodeOperationError(this.getNode(), error.message, { itemIndex: i });
							}
						} else {
							documentSchema = getDocumentTemplate(documentTemplate);
						}
					}

					// Add document annotation format if we have fields
					if (Object.keys(documentSchema).length > 0) {
						ocrRequestBody.document_annotation_format = buildJsonSchema(
							documentSchema,
							'DocumentAnnotation',
							documentTemplate === 'custom' ? customFields : undefined,
						);

						// Add pages parameter (limit to 8 for document annotations)
						const pagesStr = this.getNodeParameter('pages', i, '0-7') as string;
						const pages = parsePages(pagesStr);
						if (pages.length > 0) {
							if (pages.length > LIMITS.MAX_DOCUMENT_PAGES) {
								throw new NodeOperationError(
									this.getNode(),
									`Document Annotations are limited to maximum ${LIMITS.MAX_DOCUMENT_PAGES} pages`,
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
							bboxSchema = DEFAULT_BBOX_SCHEMA;
						}

						ocrRequestBody.bbox_annotation_format = buildJsonSchema(bboxSchema, 'BBoxAnnotation');
					}
				}

				// Step 4: Process OCR
				const ocrResponse = await makeRequestWithRetry({
					method: 'POST',
					url: MISTRAL_API_ENDPOINTS.OCR,
					body: ocrRequestBody,
					headers: {
						'Content-Type': 'application/json',
						Accept: 'application/json',
					},
				});

				// Step 5: Build response
				const metadata: NodeExecutionMetadata = {
					operation,
					uploadedFileId: uploadResponse.id,
					signedUrl: signedUrlResponse.url,
					processedAt: new Date().toISOString(),
				};

				if (operation === 'ocrWithAnnotations') {
					metadata.documentTemplate = this.getNodeParameter('documentTemplate', i) as string;
					metadata.includeBboxAnnotations = this.getNodeParameter(
						'includeBboxAnnotations',
						i,
					) as boolean;
					metadata.advancedMode = this.getNodeParameter('advancedMode', i) as boolean;
				}

				const responseData = {
					...ocrResponse,
					_metadata: metadata,
				};

				returnData.push({ json: responseData });
			} catch (error) {
				if (this.continueOnFail()) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					returnData.push({
						json: { error: errorMessage },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
