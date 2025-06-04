import {
	IHookFunctions,
	IWebhookFunctions,
	IWebhookResponseData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	NodeConnectionType,
} from 'n8n-workflow';

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
				name: 'FullEnrichAPI',
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
		properties: [
			{
				displayName: 'Enrichment Name',
				name: 'enrichmentName',
				type: 'string',
				required: true,
				default: '',
			},
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				required: true,
				default: '',
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				required: true,
				default: '',
			},
			{
				displayName: 'Domain',
				name: 'domain',
				type: 'string',
				required: true,
				default: '',
			},
			{
				displayName: 'Company Name',
				name: 'companyName',
				type: 'string',
				required: true,
				default: '',
			},
			{
				displayName: 'LinkedIn URL',
				name: 'linkedinUrl',
				type: 'string',
				required: true,
				default: '',
			},
			{
				displayName: 'Enrich Fields',
				name: 'enrichFields',
				type: 'multiOptions',
				required: true,
				default: ['contact.emails', 'contact.phones'],
				options: [
					{
						name: 'Contact Emails',
						value: 'contact.emails',
					},
					{
						name: 'Contact Phones',
						value: 'contact.phones',
					},
				],
			},
		],
	};

	// Handle the webhook call from your enrichment service
	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData();
		
		if (!body || !body.status || !body.datas) {
			throw new NodeOperationError(this.getNode(), 'Invalid webhook payload');
		}

		return {
			workflowData: [
				[
					{
						json: body, // you could also process this further before returning
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
				const enrichmentName = this.getNodeParameter('enrichmentName', 0) as string;
				const firstName = this.getNodeParameter('firstName', 0) as string;
				const lastName = this.getNodeParameter('lastName', 0) as string;
				const domain = this.getNodeParameter('domain', 0) as string;
				const companyName = this.getNodeParameter('companyName', 0) as string;
				const linkedinUrl = this.getNodeParameter('linkedinUrl', 0) as string;
				const enrichFields = this.getNodeParameter('enrichFields', 0) as string[];

				const webhookUrl = this.getNodeWebhookUrl('default');

				const requestBody = {
					name: enrichmentName,
					webhook_url: webhookUrl,
					datas: [
						{
							firstname: firstName,
							lastname: lastName,
							domain,
							company_name: companyName,
							linkedin_url: linkedinUrl,
							enrich_fields: enrichFields,
						},
					],
				};

				await this.helpers.httpRequestWithAuthentication?.call(this, 'FullEnrichAPI', {
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
