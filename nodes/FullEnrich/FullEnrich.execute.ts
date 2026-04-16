import {
	IExecuteFunctions,
	INodeExecutionData,
	JsonObject,
	NodeApiError,
} from 'n8n-workflow';

import { baseUrlV2 } from '../shared/constant';
import { knownErrors, buildErrorResponse, parseCustomFields, mapEnrichFields } from './FullEnrich.shared';

function buildContact(context: IExecuteFunctions, index: number, enrichFields: string[], version: number) {
	// V1 enrich fields need to be mapped to V2 equivalents (contact.emails → contact.work_emails)
	let mappedEnrichFields = enrichFields;
	if (version === 1) {
		mappedEnrichFields = mapEnrichFields(enrichFields);
	}

	const contact: Record<string, unknown> = {
		first_name: context.getNodeParameter('firstName', index) as string,
		last_name: context.getNodeParameter('lastName', index) as string,
		company_name: context.getNodeParameter('companyName', index) as string,
		domain: context.getNodeParameter('companyDomain', index) as string,
		linkedin_url: context.getNodeParameter('linkedinUrl', index) as string,
		enrich_fields: mappedEnrichFields,
	};

	const custom = parseCustomFields(context, index);
	if (custom) {
		contact.custom = custom;
	}

	return contact;
}

export async function execute(context: IExecuteFunctions, version: number): Promise<INodeExecutionData[][]> {
	const items = context.getInputData();
	const returnData: INodeExecutionData[] = [];

	const enrichmentName = context.getNodeParameter('enrichmentName', 0) as string;
	const webhookUrl = context.getNodeParameter('webhookUrl', 0) as string;
	const enrichFields = context.getNodeParameter('enrichFields', 0) as string[];

	// V2 supports per-contact webhook callback
	let webhookEvents: Record<string, string> | undefined;
	if (version === 2) {
		const contactFinishedUrl = context.getNodeParameter('webhookContactFinishedUrl', 0, '') as string;
		if (contactFinishedUrl) {
			webhookEvents = { contact_finished: contactFinishedUrl };
		}
	}

	for (let i = 0; i < items.length; i++) {
		const contact = buildContact(context, i, enrichFields, version);

		const requestBody: Record<string, unknown> = {
			name: enrichmentName,
			webhook_url: webhookUrl,
			data: [contact],
		};
		if (webhookEvents) {
			requestBody.webhook_events = webhookEvents;
		}

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
