import { IExecuteFunctions, NodeApiError } from 'n8n-workflow';

export const knownErrors: Record<string, string> = {
	'error.linkedin.malformated': 'Invalid LinkedIn URL provided',
	'error.enrichment.webhook_url': 'Invalid or missing webhook URL',
	'error.enrichment.custom.key.exceeded': 'Custom key character limit exceeded',
	'error.enrichment.custom.value.exceeded': 'Custom value character limit exceeded',
	'error.enrichment.first_name.empty': 'First name is required',
	'error.enrichment.last_name.empty': 'Last name is required',
	'error.enrichment.domain.empty': 'Company domain is required',
	'error.enrichment.domain.invalid': 'Invalid company domain',
	'error.enrichment.linkedin_url.invalid': 'Invalid LinkedIn URL provided',
};

// V1 enrich fields → V2 enrich fields
const enrichFieldsV1toV2: Record<string, string> = {
	'contact.emails': 'contact.work_emails',
	'contact.phones': 'contact.phones',
};

export function mapEnrichFields(fields: string[]): string[] {
	return fields.map((f) => enrichFieldsV1toV2[f] || f);
}

export const statusMessages: Record<string, { message?: string; description: string }> = {
	'400': { description: 'Bad Request - The input data might be invalid or incomplete.' },
	'401': {
		message: 'Unauthorized - Please check your API credentials.',
		description: 'Authentication failed. Verify your API key or token.',
	},
	'500': {
		message: 'Server Error - The external service failed.',
		description: 'The API encountered an internal error. Try again later.',
	},
};

export function buildErrorResponse(error: unknown, knownErrors: Record<string, string>): { message: string; description: string } {
	const apiError = error as NodeApiError;
	const response = (apiError as any)?.cause?.response;
	const status = apiError.httpCode;
	const responseData = response?.data;
	const errorCode = responseData?.code as string | undefined;
	const errorMessage = (responseData?.message || apiError.message) as string;

	let message = (errorCode && knownErrors[errorCode]) || errorMessage || 'Unknown error occurred';
	let description = `API error: ${errorCode || 'unknown'} (HTTP ${status || 'n/a'})`;

	const statusOverride = status ? statusMessages[status] : undefined;
	if (statusOverride) {
		if (statusOverride.message) message = statusOverride.message;
		description = statusOverride.description;
	}

	return { message, description };
}

export function parseCustomFields(context: IExecuteFunctions, index: number): Record<string, string> | undefined {
	const rawCustomFields = context.getNodeParameter('customFields', index) as {
		customField?: Array<{ key: string; value: string }>;
	};
	if (!rawCustomFields?.customField?.length) return undefined;

	const custom: Record<string, string> = {};
	for (const { key, value } of rawCustomFields.customField) {
		if (key && value !== undefined && value !== null) {
			custom[key] = String(value);
		}
	}
	return Object.keys(custom).length > 0 ? custom : undefined;
}
