import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
	NodeApiError,
	NodeConnectionType
} from 'n8n-workflow';

import { fullEnrichFields } from './FullEnrich.description';
import { baseUrl } from '../shared/constant';

// Define the structure of a contact to be sent to the FullEnrich API
// based on the documentation: https://docs.fullenrich.com/startbulk
interface FullEnrichContact {
	firstname: string;
	lastname: string;
	company_name: string;
	domain: string;
	linkedin_url: string;
	enrich_fields: string[];
	custom?: Record<string, string>;
}

export class FullEnrich implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FullEnrich',
		name: 'fullEnrich',
		icon: {
			light: 'file:../fe-logo-light.svg',
			dark: 'file:../fe-logo-dark.svg',
		},
		group: ['transform'],
		version: 1,
		description: 'Start a FullEnrich bulk enrichment request',
		defaults: {
			name: 'FullEnrich',
		},
		credentials: [
			{
				name: 'fullEnrichApi',
				required: true,
			},
		],
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		properties: fullEnrichFields,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {

		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Retrieve shared parameters for all items
		const enrichmentName = this.getNodeParameter('enrichmentName', 0) as string;
		const webhookUrl = this.getNodeParameter('webhookUrl', 0) as string;
		const enrichFieldsDefault = this.getNodeParameter('enrichFields', 0) as string[];

		// Process each item from input
		for (let i = 0; i < items.length; i++) {
			const firstname = this.getNodeParameter('firstName', i) as string;
			const lastname = this.getNodeParameter('lastName', i) as string;
			const companyName = this.getNodeParameter('companyName', i) as string;
			const companyDomain = this.getNodeParameter('companyDomain', i) as string;
			const linkedinUrl = this.getNodeParameter('linkedinUrl', i) as string;

			// Retrieve custom fields (as an array of key-value pairs)
			const rawCustomFields = this.getNodeParameter('customFields', i) as {
				customField?: Array<{ key: string; value: string }>;
			};

			// Convert custom fields array into a key-value object
			const custom: Record<string, string> = {};
			if (rawCustomFields?.customField?.length) {
				for (const { key, value } of rawCustomFields.customField) {
					if (key && value !== undefined && value !== null) {
						custom[key] = String(value);
					}
				}
			}

			// Build the contact object
			const contact: FullEnrichContact = {
				firstname,
				lastname,
				company_name: companyName,
				domain: companyDomain,
				linkedin_url: linkedinUrl,
				enrich_fields: enrichFieldsDefault,
			};


			// Add custom fields only if any exist
			if (Object.keys(custom).length > 0) {
				contact.custom = custom;
			}

			// Build the request body
			const requestBody = {
				name: enrichmentName,
				webhook_url: webhookUrl,
				datas: [contact],
			};

			try {
				await this.helpers.httpRequestWithAuthentication?.call(this, 'fullEnrichApi', {
					method: 'POST',
					url: `${baseUrl}/contact/enrich/bulk`,
					body: requestBody,
					json: true,
				});

				returnData.push({ json: { success: true, sent: contact, webhook_url: webhookUrl } });

			} catch (error) {
				const apiError = error as NodeApiError & { response?: any };

				// Try to extract error details from response
				const response = (apiError as any)?.cause?.response;
				const status = (apiError as any)?.httpCode;
				const responseData = response?.data;

				const errorCode = responseData?.code || (apiError as any)?.context?.data?.code;
				const errorMessage = responseData?.message || apiError.message;

				// Map of known error codes to custom messages
				const knownErrors: Record<string, string> = {
					'error.linkedin.malformated': 'Invalid LinkedIn URL provided',
					'error.enrichment.webhook_url': 'Invalid or missing webhook URL',
					'error.enrichment.custom.key.exceeded': 'Custom key character limit exceeded',
					'error.enrichment.custom.value.exceeded': 'Custom value character limit exceeded',
					'error.enrichment.firstname.empty': 'First name is required',
					'error.enrichment.lastname.empty': 'Last name is required',
					'error.enrichment.domain.empty': 'Company domain is required',
					'error.enrichment.domain.invalid': 'Invalid company domain',
					'error.enrichment.linkedin_url.invalid': 'Invalid LinkedIn URL provided',
				};

				// Default to known error message or fallbacks
				let message = knownErrors[errorCode] || errorMessage || 'Unknown error occurred';
				let description = `API error: ${errorCode || 'unknown'} (HTTP ${status || 'n/a'})`;

				// Add specific messages per status code
				if (status === 400) {
					description = 'Bad Request — The input data might be invalid or incomplete.';
				} else if (status === 401) {
					message = 'Unauthorized — Please check your API credentials.';
					description = 'Authentication failed. Verify your API key or token.';
				} else if (status === 500) {
					message = 'Server Error — The external service failed.';
					description = 'The API encountered an internal error. Try again later.';
				}

				throw new NodeApiError(this.getNode(), error as JsonObject, {
					message,
					description,
					itemIndex: i,
				});
			}
		}

		return [returnData];
	}
}
