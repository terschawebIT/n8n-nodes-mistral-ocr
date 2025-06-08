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
 * Build custom fields schema from UI collection
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex logic needed for processing multiple field types and configurations
export function buildCustomFieldsFromCollection(
	customFields: any,
	quickFields: string[] = [],
): CustomFieldSchema {
	const schema: CustomFieldSchema = {};

	// Process fields from the collection
	if (customFields?.field && Array.isArray(customFields.field)) {
		for (const field of customFields.field) {
			if (field.fieldName && field.fieldType && field.description) {
				schema[field.fieldName] = {
					type: field.fieldType === 'array' ? 'array' : field.fieldType,
					description: field.description,
				};

				// Add items property for arrays
				if (field.fieldType === 'array') {
					schema[field.fieldName].items = { type: 'string' };
				}
			}
		}
	}

	// Add quick fields with default configurations
	const quickFieldDefinitions: Record<
		string,
		{ type: 'string' | 'number' | 'boolean' | 'array'; description: string }
	> = {
		total_amount: { type: 'number', description: 'Total amount including all taxes and fees' },
		net_amount: { type: 'number', description: 'Net amount before taxes' },
		tax_amount: { type: 'number', description: 'Tax amount' },
		customer_number: { type: 'string', description: 'Customer or client identification number' },
		document_number: { type: 'string', description: 'Invoice, receipt, or document number' },
		document_date: { type: 'string', description: 'Date when the document was created' },
		due_date: { type: 'string', description: 'Payment due date' },
		sender: { type: 'string', description: 'Name and address of the sender' },
		recipient: { type: 'string', description: 'Name and address of the recipient' },
		reference: { type: 'string', description: 'File number, case reference or subject line' },
		company_name: { type: 'string', description: 'Name of the company' },
		address: { type: 'string', description: 'Street address' },
		payment_method: { type: 'string', description: 'How the payment was made' },
		phone_number: { type: 'string', description: 'Contact phone number' },
		email: { type: 'string', description: 'Email address' },
	};

	// Add quick fields that aren't already defined
	for (const quickField of quickFields) {
		if (quickFieldDefinitions[quickField] && !schema[quickField]) {
			schema[quickField] = quickFieldDefinitions[quickField];
		}
	}

	return schema;
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
