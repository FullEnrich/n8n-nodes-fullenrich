import { INodeType, INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';

export class FullEnrich implements INodeType {
	description: INodeTypeDescription = {
		// Basic node details will go here
        displayName: 'FullEnrich',
        name: 'FullEnrich',
        icon: 'file:fullenrich.svg',
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
        description: 'Get data from FullEnrich API',
        defaults: {
            name: 'FullEnrich',
        },
        inputs: [NodeConnectionType.Main],
        outputs: [NodeConnectionType.Main],
        credentials: [
            {
                name: 'FullEnrichAPI',
                required: true,
            },
        ],
        requestDefaults: {
            baseURL: 'http://localhost:6543/api',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        },
		properties: [
            {
                displayName: 'Resource',
                name: 'resource',
                type: 'options',
                noDataExpression: true,
                options: [
                    {
                        name: 'Current Balance',
                        value: 'currentBalance',
                    },
                    {
                        name: 'Enrichment',
                        value: 'enrichment',
                    },
                ], 
                default: 'currentBalance',
            },
            // Operations will go here
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: {
                        resource: [
                            'currentBalance',
                        ],
                    },
                },
                options: [
                    {
                        name: 'Get',
                        value: 'get',
                        action: 'Get the balance',
                        description: 'Get your current credits balance',
                        routing: {
                            request: {
                                method: 'GET',
                                url: '/v1/account/credits',
                            },
                        },
                    },
                ],
                default: 'get',
            },
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: {
                        resource: [
                            'enrichment',
                        ],
                    },
                },
                options: [
                    {
                        name: 'Start',
                        value: 'start',
                        action: 'Start a new enrichment',
                        description: 'Start a new enrichment',
                        routing: {
                            request: {
                                method: 'POST',
                                url: 'v1/contact/enrich/bulk',
                                body: {
                                    name: 'Test Name',
                                    webhook_url: '={{$parameter.webhook_url}}',
                                    datas: [
                                        {
                                            firstname: '={{$parameter.firstname}}',
                                            lastname: '={{$parameter.lastname}}',
                                            domain: '={{$parameter.domain}}',
                                            linkedin_url: '={{$parameter.linkedin_url}}',
                                            company_name: '={{$parameter.company_name}}',
                                            enrich_fields: [
                                              'contact.emails',
                                              'contact.phones'
                                            ]
                                        }
                                    ]
                                },
                            },
                        },
                    },
                ],
                default: 'start',
            },
			// ➤ Enrichment name input for enrichment
			{
				displayName: 'Enrichment name',
				name: 'enrichment_name',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['enrichment'],
						operation: ['start'],
					},
				},
			},
			// ➤ Webhook URL input for enrichment
			{
				displayName: 'Webhook URL',
				name: 'webhook_url',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['enrichment'],
						operation: ['start'],
					},
				},
			},
			// ➤ Firstname input for enrichment
			{
				displayName: 'Firstname',
				name: 'firstname',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['enrichment'],
						operation: ['start'],
					},
				},
			},
			// ➤ Lastname input for enrichment
			{
				displayName: 'Lastname',
				name: 'lastname',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['enrichment'],
						operation: ['start'],
					},
				},
			},
			// ➤ Domain input for enrichment
			{
				displayName: 'Domain',
				name: 'domain',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['enrichment'],
						operation: ['start'],
					},
				},
			},
			// ➤ Linkedin URL input for enrichment
			{
				displayName: 'Linkedin URL',
				name: 'linkedin_url',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['enrichment'],
						operation: ['start'],
					},
				},
			},
			// ➤ Company name input for enrichment
			{
				displayName: 'Company name',
				name: 'company_name',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['enrichment'],
						operation: ['start'],
					},
				},
			},
        ]
	};
}