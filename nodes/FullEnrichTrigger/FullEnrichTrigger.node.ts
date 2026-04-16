import {
	IWebhookFunctions,
	IWebhookResponseData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

// Map a single V2 data item back to V1 flat structure
export function mapV2ToV1(row: Record<string, any>): Record<string, any> {
	const employment = row.profile?.employment?.all?.[0];
	const network = row.profile?.social_profiles?.professional_network;
	const companyNetwork = employment?.company?.social_profiles?.professional_network;
	const hq = employment?.company?.locations?.headquarters;

	return {
		contact: {
			firstname: row.input?.first_name,
			lastname: row.input?.last_name,
			domain: row.input?.company_domain,
			most_probable_email: row.contact_info?.most_probable_work_email?.email,
			most_probable_email_status: row.contact_info?.most_probable_work_email?.status,
			most_probable_personal_email: row.contact_info?.most_probable_personal_email?.email ?? '',
			most_probable_personal_email_status: row.contact_info?.most_probable_personal_email?.status ?? '',
			most_probable_phone: row.contact_info?.most_probable_phone?.number,
			emails: row.contact_info?.work_emails,
			personal_emails: row.contact_info?.personal_emails,
			phones: row.contact_info?.phones,
			social_medias: network
				? [{ url: network.url, type: 'LINKEDIN' }]
				: [],
			profile: {
				linkedin_id: network?.id,
				linkedin_url: network?.url,
				linkedin_handle: network?.handle,
				firstname: row.profile?.first_name,
				lastname: row.profile?.last_name,
				sales_navigator_id: null,
				premium_account: null,
				summary: null,
				headline: null,
				location: row.profile?.location
					? [row.profile.location.city, row.profile.location.region, row.profile.location.country].filter(Boolean).join(', ')
					: null,
				position: {
					title: employment?.title,
					description: employment?.description,
					start_at: employment?.start_at
						? { month: new Date(employment.start_at).getMonth() + 1, year: new Date(employment.start_at).getFullYear() }
						: null,
					end_at: employment?.end_at
						? { month: new Date(employment.end_at).getMonth() + 1, year: new Date(employment.end_at).getFullYear() }
						: null,
					company: {
						linkedin_id: companyNetwork?.id,
						linkedin_url: companyNetwork?.url,
						linkedin_handle: companyNetwork?.handle,
						name: employment?.company?.name,
						description: employment?.company?.description,
						website: null,
						domain: employment?.company?.domain,
						industry: employment?.company?.industry?.main_industry,
						type: employment?.company?.company_type,
						year_founded: employment?.company?.year_founded,
						headcount: employment?.company?.headcount,
						headcount_range: employment?.company?.headcount_range,
						headquarters: {
							region: hq?.region,
							city: hq?.city,
							country: hq?.country,
							country_code: hq?.country_code,
							postal_code: null,
							address_line_1: hq?.line1,
							address_line_2: hq?.line2,
						},
					},
				},
			},
		},
		custom: row.custom,
	};
}

export class FullEnrichTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FullEnrich Trigger',
		name: 'fullEnrichTrigger',
		icon: {
			light: 'file:../fe-logo-light.svg',
			dark: 'file:../fe-logo-dark.svg',
		},
		group: ['trigger'],
		version: 1,
		description: 'Receives the enrichment result from FullEnrich',
		defaults: {
			name: 'FullEnrich Trigger',
		},
		inputs: [], // This is a trigger node, so it has no input
		outputs: [NodeConnectionType.Main], // It sends data to the main output
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived', // Respond immediately when webhook is received
				path: 'enrich-callback',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				options: [
					{
						name: 'Enrichment Result',
						value: 'enrichment_result',
						description:
							'Triggered when an enrichment result is received',
					}
				],
				required: true,
				default: [],
				description: 'The events to listen to',
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData();

		// Accept both V2 (body.data) and V1 (body.datas) webhook payloads
		const isV2 = Array.isArray(body.data);
		const isV1 = Array.isArray(body.datas);

		if (!isV2 && !isV1) {
			throw new NodeOperationError(this.getNode(), 'Invalid webhook payload: expected "data" or "datas" array');
		}

		const items = isV2 ? body.data : body.datas;

		// V2 payloads are mapped back to V1 structure for backward compatibility
		const results = (items as Record<string, any>[]).map((dataItem) => ({
			json: isV2 ? mapV2ToV1(dataItem) : dataItem,
		}));
		return {
			workflowData: [results],
		};
	}
}
