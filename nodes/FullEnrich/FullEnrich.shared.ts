import { IExecuteFunctions, NodeApiError } from 'n8n-workflow';

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
