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
import { baseUrlV2 } from '../shared/constant';
import { buildErrorResponse, parseCustomFields } from './FullEnrich.shared';
import { executeV2 } from './FullEnrichV2.execute';

// V2 error codes (V1 now calls V2 API internally)
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

// V1 enrich fields → V2 enrich fields
const enrichFieldsV1toV2: Record<string, string> = {
	'contact.emails': 'contact.work_emails',
	'contact.phones': 'contact.phones',
};

function buildContactForV2(context: IExecuteFunctions, index: number, enrichFields: string[]) {
	const contact: Record<string, unknown> = {
		first_name: context.getNodeParameter('firstName', index) as string,
		last_name: context.getNodeParameter('lastName', index) as string,
		company_name: context.getNodeParameter('companyName', index) as string,
		domain: context.getNodeParameter('companyDomain', index) as string,
		linkedin_url: context.getNodeParameter('linkedinUrl', index) as string,
		enrich_fields: enrichFields.map((f) => enrichFieldsV1toV2[f] || f),
	};

	const custom = parseCustomFields(context, index);
	if (custom) contact.custom = custom;

	return contact;
}

export class FullEnrich implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FullEnrich (DEV)',
		name: 'fullEnrich',
		icon: {
			light: 'file:../fe-logo-light.svg',
			dark: 'file:../fe-logo-dark.svg',
		},
		group: ['transform'],
		version: [1, 2],
		defaultVersion: 1,
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
		const nodeVersion = this.getNode().typeVersion;

		if (nodeVersion >= 2) {
			return executeV2(this);
		}

		// V1: calls V2 API internally, maps request fields
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const enrichmentName = this.getNodeParameter('enrichmentName', 0) as string;
		const webhookUrl = this.getNodeParameter('webhookUrl', 0) as string;
		const enrichFields = this.getNodeParameter('enrichFields', 0) as string[];

		for (let i = 0; i < items.length; i++) {
			const contact = buildContactForV2(this, i, enrichFields);

			const requestBody = {
				name: enrichmentName,
				webhook_url: webhookUrl,
				data: [contact],
			};

			try {
				const response = await this.helpers.httpRequestWithAuthentication.call(this, 'fullEnrichApi', {
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
				if (this.continueOnFail()) {
					returnData.push({ json: { success: false, error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				const { message, description } = buildErrorResponse(error, knownErrors);
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
