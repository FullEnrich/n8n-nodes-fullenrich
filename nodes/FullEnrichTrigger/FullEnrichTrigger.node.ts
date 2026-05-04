import {
	IDataObject,
	IWebhookFunctions,
	IWebhookResponseData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';

// Minimal shape of the V2 webhook payload — only fields the V1 mapping reads.
interface V2SocialNetwork {
	id?: number;
	url?: string;
	handle?: string;
}

interface V2Location {
	region?: string;
	city?: string;
	country?: string;
	country_code?: string;
	line1?: string;
	line2?: string;
}

interface V2Company {
	name?: string;
	description?: string;
	domain?: string;
	industry?: { main_industry?: string };
	company_type?: string;
	year_founded?: number;
	headcount?: number;
	headcount_range?: string;
	social_profiles?: { professional_network?: V2SocialNetwork };
	locations?: { headquarters?: V2Location };
}

interface V2Employment {
	title?: string;
	description?: string;
	start_at?: string;
	end_at?: string;
	company?: V2Company;
}

interface V2Profile {
	first_name?: string;
	last_name?: string;
	location?: { city?: string; region?: string; country?: string };
	employment?: { current?: V2Employment; all?: V2Employment[] };
	social_profiles?: { professional_network?: V2SocialNetwork };
}

interface V2ContactInfo {
	most_probable_work_email?: { email?: string; status?: string };
	most_probable_personal_email?: { email?: string; status?: string };
	most_probable_phone?: { number?: string };
	work_emails?: unknown[];
	personal_emails?: unknown[];
	phones?: unknown[];
}

export interface V2Row {
	input?: { first_name?: string; last_name?: string; company_domain?: string };
	profile?: V2Profile;
	contact_info?: V2ContactInfo;
	custom?: IDataObject;
}

function toMonthYear(value: unknown): { month: number; year: number } | null {
	if (!value || typeof value !== 'string') return null;
	// Prefer string extraction to tolerate malformed ISO dates (e.g. "2024-1-0T..." from V2 API)
	const match = /^(\d{4})-(\d{1,2})/.exec(value);
	if (match) {
		const year = Number(match[1]);
		const month = Number(match[2]);
		if (month >= 1 && month <= 12) return { month, year };
	}
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return null;
	return { month: d.getMonth() + 1, year: d.getFullYear() };
}

// V2's `employment.current` often carries only a subset (e.g. title) — fill holes from all[0]
function pickEmployment(profile: V2Profile | undefined): V2Employment | undefined {
	const current = profile?.employment?.current;
	const first = profile?.employment?.all?.[0];
	if (!current?.title) return first;
	return {
		title: current.title ?? first?.title,
		description: current.description ?? first?.description,
		start_at: current.start_at ?? first?.start_at,
		end_at: current.end_at ?? first?.end_at,
		company: current.company ?? first?.company,
	};
}

// Map a single V2 data item back to V1 flat structure
export function mapV2ToV1(row: V2Row): Record<string, unknown> {
	const employment = pickEmployment(row.profile);
	const network = row.profile?.social_profiles?.professional_network;
	const companyNetwork = employment?.company?.social_profiles?.professional_network;
	const hq = employment?.company?.locations?.headquarters;

	return {
		contact: {
			firstname: row.input?.first_name ?? '',
			lastname: row.input?.last_name ?? '',
			domain: row.input?.company_domain || employment?.company?.domain || '',
			most_probable_email: row.contact_info?.most_probable_work_email?.email ?? '',
			most_probable_email_status: row.contact_info?.most_probable_work_email?.status ?? '',
			most_probable_personal_email: row.contact_info?.most_probable_personal_email?.email ?? '',
			most_probable_personal_email_status: row.contact_info?.most_probable_personal_email?.status ?? '',
			most_probable_phone: row.contact_info?.most_probable_phone?.number ?? '',
			emails: row.contact_info?.work_emails ?? [],
			personal_emails: row.contact_info?.personal_emails ?? [],
			phones: row.contact_info?.phones ?? [],
			social_medias: network
				? [{ url: network.url, type: 'LINKEDIN' }]
				: [],
			profile: row.profile ? {
				linkedin_id: network?.id,
				linkedin_url: network?.url,
				linkedin_handle: network?.handle,
				firstname: row.profile?.first_name,
				lastname: row.profile?.last_name,
				sales_navigator_id: '',
				premium_account: false,
				summary: '',
				headline: '',
				location: row.profile?.location
					? [row.profile.location.city, row.profile.location.region, row.profile.location.country].filter(Boolean).join(', ')
					: '',
				position: {
					title: employment?.title,
					description: employment?.description,
					start_at: toMonthYear(employment?.start_at),
					end_at: toMonthYear(employment?.end_at),
					company: {
						linkedin_id: companyNetwork?.id,
						linkedin_url: companyNetwork?.url,
						linkedin_handle: companyNetwork?.handle,
						name: employment?.company?.name,
						description: employment?.company?.description,
						website: employment?.company?.domain ?? '',
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
			} : undefined,
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
		version: [1, 2],
		defaultVersion: 2,
		description: 'Receives the enrichment result from FullEnrich',
		subtitle: '=Enrichment Result',
		defaults: {
			name: 'FullEnrich Trigger',
		},
		inputs: [], // This is a trigger node, so it has no input
		outputs: [NodeConnectionTypes.Main], // It sends data to the main output
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
		usableAsTool: true,
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData();

		const triggerVersion = this.getNode().typeVersion;

		// Accept both V2 (body.data) and V1 (body.datas) webhook payloads
		const isV2Payload = Array.isArray(body.data);
		const isV1Payload = Array.isArray(body.datas);

		if (!isV2Payload && !isV1Payload) {
			throw new NodeOperationError(this.getNode(), 'Invalid webhook payload: expected "data" or "datas" array');
		}

		const items = isV2Payload ? body.data : body.datas;

		const results = (items as V2Row[]).map((dataItem) => {
			// V1 trigger: map V2 responses back to V1 structure for backward compatibility
			// V2 trigger: pass through raw data as-is
			const mapped = triggerVersion === 1 && isV2Payload ? mapV2ToV1(dataItem) : dataItem;
			return {
				json: {
					id: body.id,
					name: body.name,
					status: body.status,
					...mapped,
				},
			};
		});

		return {
			workflowData: [results],
		};
	}
}
