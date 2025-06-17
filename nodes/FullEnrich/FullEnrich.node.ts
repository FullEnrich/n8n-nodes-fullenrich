import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

import { fullEnrichFields } from './FullEnrich.description';

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
				}>;
			}
		)?.fields ?? [];
		const contactsFromForm = formContacts.map((c) => ({
			firstname: c.firstName,
			lastname: c.lastName,
			domain: c.domain,
			company_name: c.companyName,
			linkedin_url: c.linkedinUrl,
			enrich_fields: enrichFieldsDefault,
		}));

		const contactsFromInput = items.map(item => {
			const contact = item.json as {
				firstname: string;
				lastname: string;
				company?: string;
				linkedin_url?: string;
				[key: string]: any;
			};

			const { firstname, lastname, company, company_name } = contact;

			if (!firstname || !lastname || (!company && !company_name)) {
				throw new NodeOperationError(this.getNode(), `Each contact must have firstname, lastname, and at least one of domain (company) or company_name.`);
			}
			const baseContact = {
				firstname: contact.firstname,
				lastname: contact.lastname,
				domain: contact.company,
				company_name: contact.company,
				linkedin_url: contact.linkedin_url,
				enrich_fields: enrichFieldsDefault,
			};
		
			const custom: Record<string, string> = {};
			for (const key of customFieldKeys) {
				const val = contact[key];
				if (val !== undefined && val !== null && val !== '') {
					custom[key] = String(val);
				}
			}	
			if (Object.keys(custom).length > 0) {
				return {
					...baseContact,
					custom,
				};
			} else {
				return baseContact;
			}
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
			url: 'http://localhost:6543/api/v1/contact/enrich/bulk',
			body: requestBody,
			json: true,
		});

		returnData.push({ json: { success: true, sent: allContacts.length, webhook_url: webhookUrl } });

		return [returnData];
	}
}