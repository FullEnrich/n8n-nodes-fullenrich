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
		inputs: [], // This is a trigger node, so it has no input
		outputs: [NodeConnectionType.Main], // It sends data to the main output
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived', // Respond immediately when webhook is received
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
	
		// Validate the payload to make sure it contains a "datas" array
		if (!body || !Array.isArray(body.datas)) {
			throw new NodeOperationError(this.getNode(), 'Invalid webhook payload');
		}
	
		// Format each data item as n8n output
		const results = body.datas.map((dataItem) => ({
			json: dataItem,
		}));
		return {
			workflowData: [results],
		};
	}
}
