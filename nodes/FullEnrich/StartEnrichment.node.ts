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
		displayName: 'FullEnrich',
		name: 'fullEnrich',
		icon: {
			light: 'file:fe-logo-light.svg',
			dark: 'file:fe-logo-dark.svg',
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

		// Shared/default values from form
		const enrichmentName = this.getNodeParameter('enrichmentName', 0) as string;
		const webhookUrl = this.getNodeParameter('webhookUrl', 0) as string;
		const enrichFieldsDefault = this.getNodeParameter('enrichFields', 0) as string[];
		const customFields = this.getNodeParameter('customFields', 0) as string;
		

		// Get contacts from the form
		const formContacts = (
			this.getNodeParameter('contact', 0, false) as {
				fields: Array<{
					firstName: string;
					lastName: string;
					domain: string;
					companyName: string;
					linkedinUrl: string;
				}>;
			}
		)?.fields ?? [];

		// Transform form contacts
		const contactsFromForm = formContacts.map((c) => ({
			firstname: c.firstName,
			lastname: c.lastName,
			domain: c.domain,
			company_name: c.companyName,
			linkedin_url: c.linkedinUrl,
			enrich_fields: enrichFieldsDefault,
		}));

		// Transform input contacts
		const contactsFromInput = items.length > 1 ? items.map(item => {
			const contact = item.json as {
				firstname: string;
				lastname: string;
				company?: string;
				linkedin_url?: string;
				[key: string]: any; // To access dynamic fields like customFields
			};
			
			const customFieldValueRaw = contact[customFields];
			const shouldIncludeCustom = customFields && customFieldValueRaw !== undefined && customFieldValueRaw !== null && customFieldValueRaw !== '';
		
			const baseContact = {
				firstname: contact.firstname,
				lastname: contact.lastname,
				domain: contact.company,
				company_name: contact.company,
				linkedin_url: contact.linkedin_url,
				enrich_fields: enrichFieldsDefault,
			};
		
			// Conditionally add custom field if valid
			if (shouldIncludeCustom) {
				return {
					...baseContact,
					custom: {
						[customFields]: String(customFieldValueRaw),
					},
				};
			} else {
				return baseContact;
			}
		}) : [];

		// Merge both
		const allContacts = [...contactsFromForm, ...contactsFromInput];
				
		// Build request body with all contacts
		const requestBody = {
			name: enrichmentName,
			webhook_url: webhookUrl,
			datas: allContacts,
		};

		// Send single batch request
		await this.helpers.httpRequestWithAuthentication?.call(this, 'fullEnrichApi', {
			method: 'POST',
			url: 'http://localhost:6543/api/v1/contact/enrich/bulk',
			body: requestBody,
			json: true,
		});

		// One return item for the batch
		returnData.push({ json: { success: true, sent: allContacts.length, webhook_url: webhookUrl } });

		return [returnData];
	}
}