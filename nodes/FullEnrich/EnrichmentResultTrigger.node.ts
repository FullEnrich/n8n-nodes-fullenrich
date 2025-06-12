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
		displayName: 'Enrichment Result Trigger',
		name: 'enrichmentResultTrigger',
		icon: 'file:fullenrich.svg',
		group: ['trigger'],
		version: 1,
		description: 'Receives the enrichment result from FullEnrich',
		defaults: {
			name: 'Enrichment Result Trigger',
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
		properties: [],
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
