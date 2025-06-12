import { INodeProperties } from 'n8n-workflow';

export const fullEnrichFields: INodeProperties[] = [
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
		displayName: 'Contact',
		name: 'contact',
		type: 'fixedCollection',
		required: true,
		typeOptions: {
			multipleValues: true,
		},
		placeholder: 'Add Contact',
		default: {
		  fields: [
			{
			  firstName: 'john',
			  lastName: 'snow',
			  domain: 'example.com',
			  companyName: 'Example Inc.',
			  linkedinUrl: 'https://www.linkedin.com/in/demoge/',
			},
		  ],
		},
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