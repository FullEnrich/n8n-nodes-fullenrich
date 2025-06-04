import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IExecuteFunctions,
	NodeConnectionType,
	IRequestOptions,
} from 'n8n-workflow';

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
	// The execute method will go here
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// Handle data coming from previous nodes
		const items = this.getInputData();
		let responseData;
		const returnData = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		// For each item, make an API call
		for (let i = 0; i < items.length; i++) {
			if (resource === 'enrichment') {
				if (operation === 'start') {
					// Get all required parameters
					const enrichmentName = this.getNodeParameter('enrichment_name', i) as string;
					const webhookUrl = this.getNodeParameter('webhook_url', i) as string;
					const firstname = this.getNodeParameter('firstname', i) as string;
					const lastname = this.getNodeParameter('lastname', i) as string;
					const domain = this.getNodeParameter('domain', i) as string;
					const linkedinUrl = this.getNodeParameter('linkedin_url', i) as string;
					const companyName = this.getNodeParameter('company_name', i) as string;

					// Make HTTP request
					const options: IRequestOptions = {
						headers: {
							'Accept': 'application/json',
							'Content-Type': 'application/json',
						},
						method: 'POST',
						body: {
							name: enrichmentName,
							webhook_url: webhookUrl,
							datas: [
								{
									firstname,
									lastname,
									domain,
									linkedin_url: linkedinUrl,
									company_name: companyName,
									enrich_fields: [
										'contact.emails',
										'contact.phones'
									]
								}
							]
						},
						uri: `http://localhost:6543/api/v1/contact/enrich/bulk`,
						json: true,
					};

					responseData = await this.helpers.requestWithAuthentication.call(this, 'FullEnrichAPI', options);
					returnData.push(responseData);
				}
			}
		}

		// Map data to n8n data structure
		return [this.helpers.returnJsonArray(returnData)];
	}
}