import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';

import { fullEnrichFields } from './FullEnrich.properties';

export class StartEnrichment implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Start Enrichment',
		name: 'startEnrichment',
		icon: 'file:fullenrich.svg',
		group: ['transform'],
		version: 1,
		description: 'Start a FullEnrich bulk enrichment request',
		defaults: {
			name: 'Start Enrichment',
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
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
	
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
	
			// Allow enrichmentName from input OR form
			const enrichmentName = item.json.enrichmentName as string
				?? this.getNodeParameter('enrichmentName', i) as string;
	
			// Allow webhookUrl from input OR form
			const webhookUrl = item.json.webhookUrl as string
				?? this.getNodeParameter('webhookUrl', i) as string;
	
			// Allow enrichFields from input OR form
			const enrichFields = item.json.enrichFields as string[]
				?? this.getNodeParameter('enrichFields', i) as string[];
	
			// Allow contact from input OR form
			const contact = item.json.contact as { fields: any[] }
				?? this.getNodeParameter('contact', i) as { fields: any[] };
	
			// Build request body
			const requestBody = {
				name: enrichmentName,
				webhook_url: webhookUrl,
				datas: contact.fields.map(c => ({
					firstname: c.firstName,
					lastname: c.lastName,
					domain: c.domain,
					company_name: c.companyName,
					linkedin_url: c.linkedinUrl,
					enrich_fields: enrichFields,
				})),
			};
	
			// Send to FullEnrich API
			await this.helpers.httpRequestWithAuthentication?.call(this, 'fullEnrichApi', {
				method: 'POST',
				url: 'http://localhost:6543/api/v1/contact/enrich/bulk',
				body: requestBody,
				json: true,
			});
	
			returnData.push({ json: { success: true, webhook_url: webhookUrl } });
		}
	
		return [returnData];
	}
}