import type { CustomFieldSchema } from '../types';

/**
 * Get quick field definitions for UI and processing
 */
export function getQuickFieldDefinitions(): Record<
	string,
	{ type: 'string' | 'number' | 'boolean' | 'array'; description: string; required?: boolean }
> {
	return {
		total_amount: { type: 'number', description: 'Total amount including all taxes and fees', required: true },
		net_amount: { type: 'number', description: 'Net amount before taxes', required: false },
		tax_amount: { type: 'number', description: 'Tax amount', required: false },
		customer_number: { type: 'string', description: 'Customer or client identification number', required: false },
		document_number: { type: 'string', description: 'Invoice, receipt, or document number', required: false },
		document_title: { type: 'string', description: 'Title or brief summary of the document content (e.g. "Invoice for IT Services", "Contract for Office Rental")', required: false },
		document_date: { type: 'string', description: 'Date when the document was created in DD.MM.YYYY format, return null if not found', required: true },
		due_date: { type: 'string', description: 'Payment due date', required: false },
		dueDate: { type: 'string', description: 'Payment due date in DD.MM.YYYY format, return null if not found', required: false },
		dueDateSkonto: { type: 'string', description: 'Early payment discount due date in DD.MM.YYYY format, return null if not found', required: false },
		skontoPercent: { type: 'number', description: 'Early payment discount percentage as decimal (e.g. "Skonto 2%", "2,0% discount"). Extract decimal value, return null if not found.', required: false },
		amountWithoutSkonto: { type: 'number', description: 'Gross amount from lines like "Bruttobetrag", "Gesamt", "Total" or net + tax. Return as decimal with dot separator, null if not found.', required: false },
		amountWithSkonto: { type: 'number', description: 'Amount with early payment discount applied (explicit "Zahlbetrag" or calculated). Return as decimal with dot separator, 2 decimal places, null if not found.', required: false },
		sender: { type: 'string', description: 'Name or company name of the sender (without address)', required: false },
		recipient: { type: 'string', description: 'Name or company name of the recipient (without address)', required: false },
		sender_address: { type: 'string', description: 'Full address of the sender', required: false },
		recipient_address: { type: 'string', description: 'Full address of the recipient', required: false },
		reference: { type: 'string', description: 'File number, case reference or subject line', required: false },
		company_name: { type: 'string', description: 'Name of the company', required: false },
		address: { type: 'string', description: 'Street address', required: false },
		payment_method: { type: 'string', description: 'How the payment was made', required: false },
		phone_number: { type: 'string', description: 'Contact phone number', required: false },
		email: { type: 'string', description: 'Email address', required: false },
	};
}

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
export function buildCustomFieldsFromCollection(customFields: any): CustomFieldSchema {
	const schema: CustomFieldSchema = {};

	// Process fields from the collection
	if (customFields?.field && Array.isArray(customFields.field)) {
		for (const field of customFields.field) {
			// Handle custom field names vs predefined field names
			const fieldName = field.fieldName === '__custom__' ? field.customFieldName : field.fieldName;

			if (fieldName && field.fieldType && field.description) {
				schema[fieldName] = {
					type: field.fieldType === 'array' ? 'array' : field.fieldType,
					description: field.description,
				};

				// Add items property for arrays
				if (field.fieldType === 'array') {
					schema[fieldName].items = { type: 'string' };
				}
			}
		}
	}

	return schema;
}

/**
 * Convert schema object to Mistral API format
 */
export function buildJsonSchema(
	schemaObj: CustomFieldSchema,
	schemaName: string,
	customFieldsConfig?: any
): any {
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

		// Check if field is required - check in customFields configuration
		if (customFieldsConfig?.field && Array.isArray(customFieldsConfig.field)) {
			const customField = customFieldsConfig.field.find((f: any) => {
				// Handle both direct fieldName and __custom__ fieldName
				const fieldName = f.fieldName === '__custom__' ? f.customFieldName : f.fieldName;
				return fieldName === key;
			});

			if (customField && customField.required === true) {
				required.push(key);
			}
		}
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
