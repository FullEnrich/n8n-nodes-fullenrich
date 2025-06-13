import {
	IWebhookFunctions,
	IWebhookResponseData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

export class EnrichmentResultTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FullEnrich Trigger',
		name: 'fullEnrichTrigger',
		icon: {
			light: 'file:fe-logo-light.svg',
			dark: 'file:fe-logo-dark.svg',
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
}
