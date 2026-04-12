import {
	IExecuteFunctions,
	INodeExecutionData,
	JsonObject,
	NodeApiError,
} from 'n8n-workflow';

import { baseUrlV2 } from '../shared/constant';
import { buildErrorResponse, parseCustomFields } from './FullEnrich.shared';

interface FullEnrichContactV2 {
	first_name: string;
	last_name: string;
	company_name: string;
	domain: string;
	linkedin_url: string;
	enrich_fields: string[];
	custom?: Record<string, string>;
}

const knownErrors: Record<string, string> = {
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

export function buildContactV2(context: IExecuteFunctions, index: number, enrichFields: string[]): FullEnrichContactV2 {
	const contact: FullEnrichContactV2 = {
		first_name: context.getNodeParameter('firstName', index) as string,
		last_name: context.getNodeParameter('lastName', index) as string,
		company_name: context.getNodeParameter('companyName', index) as string,
		domain: context.getNodeParameter('companyDomain', index) as string,
		linkedin_url: context.getNodeParameter('linkedinUrl', index) as string,
		enrich_fields: enrichFields,
	};

	const custom = parseCustomFields(context, index);
	if (custom) contact.custom = custom;

	return contact;
}

export async function executeV2(context: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	const items = context.getInputData();
	const returnData: INodeExecutionData[] = [];

	const enrichmentName = context.getNodeParameter('enrichmentName', 0) as string;
	const webhookUrl = context.getNodeParameter('webhookUrl', 0) as string;
	const enrichFields = context.getNodeParameter('enrichFields', 0) as string[];

	const contactFinishedUrl = context.getNodeParameter('webhookContactFinishedUrl', 0, '') as string;
	const webhookEvents = contactFinishedUrl ? { contact_finished: contactFinishedUrl } : undefined;

	for (let i = 0; i < items.length; i++) {
		const contact = buildContactV2(context, i, enrichFields);

		const requestBody: Record<string, unknown> = {
			name: enrichmentName,
			webhook_url: webhookUrl,
			data: [contact],
		};
		if (webhookEvents) requestBody.webhook_events = webhookEvents;

		try {
			const response = await context.helpers.httpRequestWithAuthentication.call(context, 'fullEnrichApi', {
				method: 'POST',
				url: `${baseUrlV2}/contact/enrich/bulk`,
				body: requestBody,
				json: true,
			});

			returnData.push({
				json: { success: true, enrichment_id: response.enrichment_id, sent: contact, webhook_url: webhookUrl },
				pairedItem: { item: i },
			});
		} catch (error) {
			if (context.continueOnFail()) {
				returnData.push({ json: { success: false, error: (error as Error).message }, pairedItem: { item: i } });
				continue;
			}
			const { message, description } = buildErrorResponse(error, knownErrors);
			throw new NodeApiError(context.getNode(), error as JsonObject, {
				message,
				description,
				itemIndex: i,
			});
		}
	}

	return [returnData];
}
