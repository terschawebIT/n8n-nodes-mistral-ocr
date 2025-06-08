import type { CustomFieldSchema } from '../types';

/**
 * Parse custom fields from JSON string
 */
export function parseCustomFieldsJson(customFieldsJson: string): CustomFieldSchema {
	try {
		return JSON.parse(customFieldsJson);
	} catch (error) {
		throw new Error(
			`Invalid Custom Fields JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
	}
}

/**
 * Convert schema object to Mistral API format
 */
export function buildJsonSchema(schemaObj: CustomFieldSchema, schemaName: string): any {
	const properties: any = {};
	const required: string[] = [];

	for (const [key, config] of Object.entries(schemaObj)) {
		properties[key] = {
			type: config.type,
			title: key
				.split('_')
				.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
				.join('_'),
		};

		if (config.description) {
			properties[key].description = config.description;
		}

		// Handle array types
		if (config.type === 'array' && config.items) {
			properties[key].items = config.items;
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

/**
 * Parse pages parameter
 */
export function parsePages(pagesStr: string): number[] {
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
