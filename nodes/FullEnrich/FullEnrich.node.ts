import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

import { fullEnrichFields } from './FullEnrich.description';
import { baseUrl } from '../shared/constant';

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

		const enrichmentName = this.getNodeParameter('enrichmentName', 0) as string;
		const webhookUrl = this.getNodeParameter('webhookUrl', 0) as string;
		const enrichFieldsDefault = this.getNodeParameter('enrichFields', 0) as string[];
		const rawCustomFields = this.getNodeParameter('customFields', 0) as {
			field: Array<{ key: string }>
		};
		const customFieldKeys = rawCustomFields?.field?.map(f => f.key).filter(Boolean) ?? [];
		
		const formContacts = (
			this.getNodeParameter('contact', 0, false) as {
				fields: Array<{
					firstName: string;
					lastName: string;
					domain: string;
					companyName: string;
					linkedinUrl: string;
					customFields?: {
						customField?: Array<{ key: string; value: string }>;
					};
				}>;
			}
		)?.fields ?? [];

		const contactsFromForm = formContacts.map((c) => {
			const baseContact = {
				firstname: c.firstName,
				lastname: c.lastName,
				domain: c.domain,
				company_name: c.companyName,
				linkedin_url: c.linkedinUrl,
				enrich_fields: enrichFieldsDefault,
			};
		
			// Extract custom fields if any
			const custom: Record<string, string> = {};
			if (c.customFields?.customField?.length) {
				for (const { key, value } of c.customFields.customField) {
					if (key && value !== undefined) {
						custom[key] = value;
					}
				}
			}
		
			return Object.keys(custom).length > 0
				? { ...baseContact, custom }
				: baseContact;
		});

		const contactsFromInput = items
		.map(item => item.json)
		.filter(contact => {
			const { firstname, lastname, company, company_name } = contact;
			return firstname && lastname && (company || company_name);
		})
		.map(contact => {
			const { firstname, lastname, company, company_name, linkedin_url } = contact;
	
			const baseContact = {
				firstname,
				lastname,
				domain: company ?? company_name ?? '',
				company_name: company_name ?? company ?? '',
				linkedin_url: linkedin_url ?? '',
				enrich_fields: enrichFieldsDefault,
			};
	
			const custom: Record<string, string> = {};
			for (const key of customFieldKeys) {
				const val = contact[key];
				if (val !== undefined && val !== null && val !== '') {
					custom[key] = String(val);
				}
			}
	
			return Object.keys(custom).length > 0 ? { ...baseContact, custom } : baseContact;
		});

		const allContacts = [...contactsFromForm, ...contactsFromInput];
		if (allContacts.length === 0) {
			throw new NodeOperationError(this.getNode(), 'No contacts provided from form or input');
		}
		const requestBody = {
			name: enrichmentName,
			webhook_url: webhookUrl,
			datas: allContacts,
		};
		await this.helpers.httpRequestWithAuthentication?.call(this, 'fullEnrichApi', {
			method: 'POST',
			url: `${baseUrl}/contact/enrich/bulk`,
			body: requestBody,
			json: true,
		});

		returnData.push({ json: { success: true, sent: allContacts.length, webhook_url: webhookUrl } });

		return [returnData];
	}
}