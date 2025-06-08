import type { CustomFieldSchema } from '../types';

export const DEFAULT_CUSTOM_FIELDS: CustomFieldSchema = {
	total_amount: {
		type: 'number',
		description: 'Total amount including all taxes and fees',
	},
	document_date: {
		type: 'string',
		description: 'Date when the document was created',
	},
};

export const DEFAULT_BBOX_SCHEMA: CustomFieldSchema = {
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
};

export const MISTRAL_API_ENDPOINTS = {
	UPLOAD: 'https://api.mistral.ai/v1/files',
	GET_URL: (fileId: string) => `https://api.mistral.ai/v1/files/${fileId}/url`,
	OCR: 'https://api.mistral.ai/v1/ocr',
} as const;

export const LIMITS = {
	MAX_DOCUMENT_PAGES: 8,
	MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
	MAX_TOTAL_PAGES: 1000,
	DEFAULT_EXPIRY_HOURS: 24,
	MIN_EXPIRY_HOURS: 1,
	MAX_EXPIRY_HOURS: 168,
} as const;
