import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';

import { fullEnrichFields } from './FullEnrich.description';
import { baseUrl } from '../shared/constant';

// Define the structure of a contact to be sent to the FullEnrich API
// based on the documentation: https://docs.fullenrich.com/startbulk
interface FullEnrichContact {
	firstname: string;
	lastname: string;
	domain: string;
	linkedin_url: string;
	enrich_fields: string[];
	custom?: Record<string, string>;
  }

export class FullEnrich implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FullEnrich',
		name: 'fullEnrich',
		icon: {
			light: 'file:../fe-logo-light.svg',
			dark: 'file:../fe-logo-dark.svg',
		  },
		group: ['action'],
		version: 1,
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
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Retrieve shared parameters for all items
		const enrichmentName = this.getNodeParameter('enrichmentName', 0) as string;
		const webhookUrl = this.getNodeParameter('webhookUrl', 0) as string;
		const enrichFieldsDefault = this.getNodeParameter('enrichFields', 0) as string[];

		// Process each item from input
		for (let i = 0; i < items.length; i++) {
			const firstname = this.getNodeParameter('firstName', i) as string;
			const lastname = this.getNodeParameter('lastName', i) as string;
			const domain = this.getNodeParameter('domain', i) as string;
			const linkedinUrl = this.getNodeParameter('linkedinUrl', i) as string;

			// Retrieve custom fields (as an array of key-value pairs)
			const rawCustomFields = this.getNodeParameter('customFields', i) as {
				customField?: Array<{ key: string; value: string }>;
			};

			// Convert custom fields array into a key-value object
			const custom: Record<string, string> = {};
			if (rawCustomFields?.customField?.length) {
				for (const { key, value } of rawCustomFields.customField) {
					if (key && value !== undefined && value !== null) {
						custom[key] = String(value);
					}
				}
			}

			// Build the contact object
			const contact: FullEnrichContact = {
				firstname,
				lastname,
				domain,
				linkedin_url: linkedinUrl,
				enrich_fields: enrichFieldsDefault,
			};


			// Add custom fields only if any exist
			if (Object.keys(custom).length > 0) {
				contact.custom = custom;
			}

			// Build the request body
			const requestBody = {
				name: enrichmentName,
				webhook_url: webhookUrl,
				datas: [contact],
			};
			try {
				// Send the HTTP POST request using authentication
				await this.helpers.httpRequestWithAuthentication?.call(this, 'fullEnrichApi', {
					method: 'POST',
					url: `${baseUrl}/contact/enrich/bulk`,
					body: requestBody,
					json: true,
				});
				returnData.push({ json: { success: true, sent: contact, webhook_url: webhookUrl } });
			  } catch (error) {
				returnData.push({ json: { success: false, error: error.message, contact } });
			  }		}
		return [returnData];
	}
}