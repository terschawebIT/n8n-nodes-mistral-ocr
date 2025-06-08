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
		subtitle: 'Extract text from documents',
		description:
			'Extract text from documents using Mistral OCR API in one step - automatically handles upload, URL generation and OCR processing',
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				// Get the binary data
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

				// Step 3: Process OCR automatically
				const ocrRequestBody = {
					model,
					document: {
						type: 'document_url',
						document_url: signedUrlResponse.url,
					},
					include_image_base64: options.includeImageBase64 || false,
				};

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
							uploadedFileId: uploadResponse.id,
							signedUrl: signedUrlResponse.url,
							processedAt: new Date().toISOString(),
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
