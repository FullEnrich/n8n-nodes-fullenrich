import {
	IWebhookFunctions,
	IWebhookResponseData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

export class FullEnrichTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FullEnrich Trigger',
		name: 'fullEnrichTrigger',
		icon: {
			light: 'file:../fe-logo-light.svg',
			dark: 'file:../fe-logo-dark.svg',
		  },
		group: ['trigger'],
		version: 1,
		description: 'Receives the enrichment result from FullEnrich',
		defaults: {
			name: 'FullEnrich Trigger',
		},
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
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				options: [
					{
						name: 'Enrichment Result',
						value: 'enrichment_result',
						description:
							'Triggered when an enrichment result is received',
					}
				],
				required: true,
				default: [],
				description: 'The events to listen to',
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData();
	
		if (!body || !body.status || !Array.isArray(body.datas)) {
			throw new NodeOperationError(this.getNode(), 'Invalid webhook payload');
		}
	
		// Transform datas
		const flattened = body.datas.map(data => ({
			// Flatten custom fields (with string cast)
			...Object.entries(data.custom ?? {}).reduce((acc, [key, value]) => {
			  acc[key] = String(value);
			  return acc;
			}, {} as Record<string, string>),
			// Add contact info
			firstname: data.contact?.firstname ?? '',
			lastname: data.contact?.lastname ?? '',
			most_probable_email: data.contact?.most_probable_email ?? '',
			most_probable_phone: data.contact?.most_probable_phone
			  ? `'${data.contact.most_probable_phone}`
			  : '',
		  }));
	
		return {
			workflowData: [
				flattened.map(entry => ({ json: entry })) // ONE branch, multiple items
			],
		};
	}
}
