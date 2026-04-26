import {
	IExecuteFunctions,
	INodeExecutionData,
	JsonObject,
	NodeApiError,
} from 'n8n-workflow';

import { baseUrl } from '../shared/constant';
import { knownErrors, buildErrorResponse, parseCustomFields, mapEnrichFields } from './FullEnrich.shared';
import { version as pkgVersion } from '../../package.json';

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

// V1 workflows echoed `firstname`/`lastname` (no underscore) and the raw (unmapped) enrich_fields.
// Keep that shape so downstream steps referencing {{ $json.sent.firstname }} keep working.
function buildV1Echo(contact: Record<string, unknown>, originalEnrichFields: string[]) {
	const echo: Record<string, unknown> = {
		firstname: contact.first_name,
		lastname: contact.last_name,
		company_name: contact.company_name,
		domain: contact.domain,
		linkedin_url: contact.linkedin_url,
		enrich_fields: originalEnrichFields,
	};
	if (contact.custom) {
		echo.custom = contact.custom;
	}
	return echo;
}

export async function execute(context: IExecuteFunctions, version: number): Promise<INodeExecutionData[][]> {
	const items = context.getInputData();
	const returnData: INodeExecutionData[] = [];

	const rawEnrichmentName = context.getNodeParameter('enrichmentName', 0) as string;
	const enrichmentName = rawEnrichmentName?.trim() || 'Enrichment by n8n';
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
				url: `${baseUrl}/contact/enrich/bulk`,
				body: requestBody,
				json: true,
				headers: {
					'User-Agent': `n8n-nodes-fullenrich/${pkgVersion}`,
					'X-Client-Source': 'n8n',
					'X-Client-Node-Version': String(version),
					'X-Client-Package-Version': pkgVersion,
				},
			});

			const sentEcho = version === 1 ? buildV1Echo(contact, enrichFields) : contact;
			returnData.push({
				json: { success: true, enrichment_id: response.enrichment_id, sent: sentEcho, webhook_url: webhookUrl },
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
