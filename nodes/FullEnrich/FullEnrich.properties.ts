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
		default: 'record',
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
		description: 'A unique name for this enrichment task.',
	},
	{
		displayName: 'Webhook URL',
		name: 'webhookUrl',
		type: 'string',
		required: true,
		default: '',
		description: 'The URL to receive the enrichment result.',
	},
	{
		displayName: 'Custom Fields',
		name: 'customFields',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		placeholder: 'Add custom field',
		options: [
			{
				displayName: 'Field',
				name: 'field',
				values: [
					{
						displayName: 'Key',
						name: 'key',
						type: 'string',
						default: '',
						placeholder: 'e.g. row_number',
						description: 'Custom field name to extract from input data',
					},
				],
			},
		],
		description: 'Specify keys to extract from input data as custom fields',
	},
	{
		displayName: 'Contact',
		name: 'contact',
		type: 'fixedCollection',
		required: true,
		typeOptions: {
			multipleValues: true,
		},
		placeholder: 'Add Contact',
		default: null,
		options: [
			{
				displayName: 'Fields',
				name: 'fields',
				values: [
					{
						displayName: 'First Name',
						name: 'firstName',
						type: 'string',
						required: true,
						default: '',
					},
					{
						displayName: 'Last Name',
						name: 'lastName',
						type: 'string',
						required: true,
						default: '',
					},
					{
						displayName: 'Company Domain',
						name: 'domain',
						type: 'string',
						required: true,
						default: '',
					},
					{
						displayName: 'Company Name',
						name: 'companyName',
						type: 'string',
						required: true,
						default: '',
					},
					{
						displayName: 'LinkedIn URL',
						name: 'linkedinUrl',
						type: 'string',
						required: true,
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
		description: 'Which fields should be enriched.',
		options: [
			{ name: 'Contact Emails', value: 'contact.emails' },
			{ name: 'Contact Phones', value: 'contact.phones' },
		],
	},
];