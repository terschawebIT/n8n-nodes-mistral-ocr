export interface CustomFieldSchema {
	[key: string]: {
		type: 'string' | 'number' | 'boolean' | 'array';
		description: string;
		items?: { type: string };
	};
}

export interface DocumentTemplate {
	[key: string]: {
		type: 'string' | 'number' | 'boolean' | 'array';
		description: string;
		items?: { type: string };
	};
}

export interface MistralOcrOptions {
	includeImageBase64?: boolean;
	expiryHours?: number;
}

export interface MistralApiResponse {
	id: string;
	url?: string;
	[key: string]: any;
}

export interface MistralOcrRequest {
	model: string;
	document: {
		type: 'document_url';
		document_url: string;
	};
	include_image_base64: boolean;
	bbox_annotation_format?: any;
	document_annotation_format?: any;
	pages?: number[];
}

export interface NodeExecutionMetadata {
	operation: string;
	uploadedFileId: string;
	signedUrl: string;
	processedAt: string;
	documentTemplate?: string;
	includeBboxAnnotations?: boolean;
	advancedMode?: boolean;
}

export type DocumentTemplateType =
	| 'custom'
	| 'invoice'
	| 'letter'
	| 'contract'
	| 'receipt'
	| 'id_document'
	| 'research_paper';

export type FieldType = 'string' | 'number' | 'date' | 'array' | 'boolean';
