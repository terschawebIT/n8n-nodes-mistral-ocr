import type { DocumentTemplate, DocumentTemplateType } from '../types';

export const DOCUMENT_TEMPLATES: Record<DocumentTemplateType, DocumentTemplate> = {
	custom: {},

	invoice: {
		total_amount: {
			type: 'number',
			description: 'Total amount including all taxes and fees',
		},
		net_amount: {
			type: 'number',
			description: 'Net amount before taxes',
		},
		tax_amount: {
			type: 'number',
			description: 'Tax amount',
		},
		customer_number: {
			type: 'string',
			description: 'Customer or client identification number',
		},
		invoice_number: {
			type: 'string',
			description: 'Invoice number or reference',
		},
		invoice_date: {
			type: 'string',
			description: 'Invoice date',
		},
		due_date: {
			type: 'string',
			description: 'Payment due date',
		},
		vendor_name: {
			type: 'string',
			description: 'Name of the company or vendor issuing the invoice',
		},
		customer_name: {
			type: 'string',
			description: 'Name of the customer or client',
		},
		payment_method: {
			type: 'string',
			description: 'Accepted payment methods',
		},
	},

	letter: {
		sender: {
			type: 'string',
			description: 'Name and address of the sender',
		},
		recipient: {
			type: 'string',
			description: 'Name and address of the recipient',
		},
		document_date: {
			type: 'string',
			description: 'Date when the letter was written',
		},
		reference: {
			type: 'string',
			description: 'File number, case reference or subject line',
		},
		subject: {
			type: 'string',
			description: 'Subject or topic of the letter',
		},
		letter_type: {
			type: 'string',
			description: 'Type of correspondence (official, personal, business, etc.)',
		},
	},

	contract: {
		contract_title: {
			type: 'string',
			description: 'Title or type of contract',
		},
		party_1: {
			type: 'string',
			description: 'First contracting party (name and details)',
		},
		party_2: {
			type: 'string',
			description: 'Second contracting party (name and details)',
		},
		contract_date: {
			type: 'string',
			description: 'Date when the contract was signed',
		},
		start_date: {
			type: 'string',
			description: 'Contract start date',
		},
		end_date: {
			type: 'string',
			description: 'Contract end date',
		},
		contract_amount: {
			type: 'number',
			description: 'Contract value or amount',
		},
		key_terms: {
			type: 'array',
			items: { type: 'string' },
			description: 'Key terms and conditions',
		},
	},

	receipt: {
		store_name: {
			type: 'string',
			description: 'Name of the store or business',
		},
		total_amount: {
			type: 'number',
			description: 'Total amount paid',
		},
		purchase_date: {
			type: 'string',
			description: 'Date of purchase',
		},
		receipt_number: {
			type: 'string',
			description: 'Receipt or transaction number',
		},
		payment_method: {
			type: 'string',
			description: 'How the payment was made (cash, card, etc.)',
		},
		items: {
			type: 'array',
			items: { type: 'string' },
			description: 'List of purchased items',
		},
	},

	id_document: {
		full_name: {
			type: 'string',
			description: 'Full name as shown on the document',
		},
		birth_date: {
			type: 'string',
			description: 'Date of birth',
		},
		id_number: {
			type: 'string',
			description: 'ID number or passport number',
		},
		nationality: {
			type: 'string',
			description: 'Nationality or citizenship',
		},
		issue_date: {
			type: 'string',
			description: 'Date when the document was issued',
		},
		expiry_date: {
			type: 'string',
			description: 'Document expiry date',
		},
		issuing_authority: {
			type: 'string',
			description: 'Authority that issued the document',
		},
	},

	research_paper: {
		title: {
			type: 'string',
			description: 'Title of the research paper',
		},
		authors: {
			type: 'array',
			items: { type: 'string' },
			description: 'List of authors',
		},
		abstract: {
			type: 'string',
			description: 'Abstract or summary of the paper',
		},
		keywords: {
			type: 'array',
			items: { type: 'string' },
			description: 'Keywords or key topics',
		},
		publication_date: {
			type: 'string',
			description: 'Publication date',
		},
		journal: {
			type: 'string',
			description: 'Journal or conference name',
		},
		doi: {
			type: 'string',
			description: 'DOI or other identifier',
		},
	},
};

/**
 * Get a document template by type
 */
export function getDocumentTemplate(templateType: DocumentTemplateType): DocumentTemplate {
	return DOCUMENT_TEMPLATES[templateType] || {};
}
