import { INodeProperties } from 'n8n-workflow';

export const fullEnrichFields: INodeProperties[] = [
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Enrichment',
				value: 'enrichment',
			}
		],
		default: 'enrichment',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Start Enrichment',
				value: 'startEnrichment',
				description: 'Start an enrichment task',
				action: 'Start enrichment',
			}
		],
		default: 'startEnrichment',
		displayOptions: {
			show: {
				resource: ['enrichment'],
			},
		},
	},
	{
		displayName: 'Enrichment Name',
		name: 'enrichmentName',
		type: 'string',
		required: true,
		default: '',
		description: 'A unique name for this enrichment task',
	},
	{
		displayName: 'Webhook URL',
		name: 'webhookUrl',
		type: 'string',
		default: '',
		description: 'The webhook URL to receive results. Must be publicly accessible (e.g. n8n webhook trigger URL).',
	},
	{
		displayName: 'Company Domain',
		name: 'companyDomain',
		type: 'string',
		default: '',
	},
	{
		displayName: 'Company Name',
		name: 'companyName',
		type: 'string',
		default: '',
	},
	{
		displayName: 'First Name',
		name: 'firstName',
		type: 'string',
		default: '',
	},
	{
		displayName: 'Last Name',
		name: 'lastName',
		type: 'string',
		default: '',
	},
	{
		displayName: 'LinkedIn URL',
		name: 'linkedinUrl',
		type: 'string',
		default: '',
	},
	{
		displayName: 'Custom Fields',
		name: 'customFields',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		placeholder: 'Add Custom Field',
		options: [
			{
				displayName: 'Custom Field',
				name: 'customField',
				values: [
					{
						displayName: 'Key',
						name: 'key',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
					},
				],
			},
		],
	},
	{
		displayName: 'Fields to Enrich',
		name: 'enrichFields',
		type: 'multiOptions',
		required: true,
		default: ['contact.emails', 'contact.phones'],
		description: 'Which fields should be enriched',
		options: [
			{ name: 'Contact Emails', value: 'contact.emails' },
			{ name: 'Contact Phones', value: 'contact.phones' },
		],
	},
];