import {
	IHookFunctions,
	IWebhookFunctions,
	IWebhookResponseData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	NodeConnectionType,
} from 'n8n-workflow';

import { fullEnrichFields } from './FullEnrich.properties';

export class FullEnrich implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FullEnrich',
		name: 'fullEnrich',
		icon: 'file:fullenrich.svg',
		group: ['trigger'],
		version: 1,
		description: 'Start enrichment and wait for callback in one node',
		defaults: {
			name: 'Full Enrich',
		},
		credentials: [
			{
				name: 'fullEnrichApi',
				required: true,
			},
		],
		inputs: [],
		outputs: [NodeConnectionType.Main],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'enrich-callback',
			},
		],
		properties: fullEnrichFields,
	};

	// Handle the webhook call from the FullEnrich service
	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData();
		
		if (!body || !body.status || !body.datas) {
			throw new NodeOperationError(this.getNode(), 'Invalid webhook payload');
		}

		return {
			workflowData: [
				[
					{
						json: body,
					},
				],
			],
		};
	}

	webhookMethods = {
		default: {
			async checkExists(): Promise<boolean> {
				return false; // Always create new enrichment
			},

			// Triggered when the node is activated (or workflow runs)
			async create(this: IHookFunctions): Promise<boolean> {

			// Get the enrichment name
			const enrichmentName = this.getNodeParameter('enrichmentName', 0) as string;

			// Get the contact info fixedCollection parameter
			const contact = this.getNodeParameter('contact', 0) as {
			fields: Array<{
				firstName: string;
				lastName: string;
				domain: string;
				companyName: string;
				linkedinUrl: string;
			}>;
			};

			// Extract the array of contacts from the 'fields' property
			const enrichmentRequest = contact.fields;

			// Get the fields to enrich (multiOptions)
			const enrichFields = this.getNodeParameter('enrichFields', 0) as string[];

			// Get the webhook URL for the callback
			const webhookUrl = this.getNodeWebhookUrl('default');

			// Build the request body for the enrichment API
			const requestBody = {
			name: enrichmentName,
			webhook_url: webhookUrl,
			datas: enrichmentRequest.map(enrichmentRequest => ({
				firstname: enrichmentRequest.firstName,
				lastname: enrichmentRequest.lastName,
				domain: enrichmentRequest.domain,
				company_name: enrichmentRequest.companyName,
				linkedin_url: enrichmentRequest.linkedinUrl,
				enrich_fields: enrichFields,
			})),
			}

				await this.helpers.httpRequestWithAuthentication?.call(this, 'fullEnrichApi', {
					method: 'POST',
					url: 'http://localhost:6543/api/v1/contact/enrich/bulk',
					body: requestBody,
					json: true,
				});

				return true;
			},

			async delete(): Promise<boolean> {
				// Optional: cleanup if necessary
				return true;
			},
		},
	};
}
