import { mapV2ToV1 } from '../nodes/FullEnrichTrigger/FullEnrichTrigger.node';

const v2Row = {
	input: {
		professional_network_url: 'https://www.linkedin.com/in/jdoe',
		linkedin_url: 'https://www.linkedin.com/in/jdoe',
		first_name: 'John',
		last_name: 'Doe',
		full_name: 'John Doe',
		company_name: 'Acme Corp',
		company_domain: 'acme.com',
	},
	contact_info: {
		most_probable_work_email: { email: 'john@acme.com', status: 'DELIVERABLE' },
		most_probable_personal_email: { email: 'johndoe@gmail.com', status: 'HIGH_PROBABILITY' },
		most_probable_phone: { number: '+1 555-100-2000', region: 'US' },
		work_emails: [
			{ email: 'john@acme.com', status: 'DELIVERABLE' },
			{ email: 'j.doe@acme.com', status: 'INVALID' },
		],
		personal_emails: [{ email: 'johndoe@gmail.com', status: 'HIGH_PROBABILITY' }],
		phones: [
			{ number: '+1 555-100-2000', region: 'US' },
			{ number: '+44 20 7946 0958', region: 'GB' },
		],
	},
	custom: { crm_id: '99887' },
	profile: {
		id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
		full_name: 'John Doe',
		first_name: 'John',
		last_name: 'Doe',
		location: { country: 'United States', country_code: 'US', city: 'New York', region: 'New York' },
		employment: {
			current: {
				title: 'VP of Sales',
				description: 'Leading sales org',
				company: {
					id: '11111111-2222-3333-4444-555555555555',
					name: 'Acme Corp',
					domain: 'acme.com',
					description: 'Enterprise software',
					year_founded: 2010,
					headcount: 500,
					headcount_range: '201-500',
					company_type: 'Privately Held',
					locations: {
						headquarters: {
							line1: '100 Main St',
							line2: 'Suite 200',
							city: 'New York',
							region: 'New York',
							country: 'United States',
							country_code: 'US',
						},
					},
					social_profiles: {
						professional_network: { id: 12345678, url: 'https://www.linkedin.com/company/acme-corp', handle: 'acme-corp' },
					},
					industry: { main_industry: 'Computer Software' },
				},
				is_current: true,
				start_at: '2022-06-01T00:00:00.000Z',
			},
			all: [
				{
					title: 'VP of Sales',
					description: 'Leading sales org',
					company: {
						id: '11111111-2222-3333-4444-555555555555',
						name: 'Acme Corp',
						domain: 'acme.com',
						description: 'Enterprise software',
						year_founded: 2010,
						headcount: 500,
						headcount_range: '201-500',
						company_type: 'Privately Held',
						locations: {
							headquarters: {
								line1: '100 Main St',
								line2: 'Suite 200',
								city: 'New York',
								region: 'New York',
								country: 'United States',
								country_code: 'US',
							},
						},
						social_profiles: {
							professional_network: { id: 12345678, url: 'https://www.linkedin.com/company/acme-corp', handle: 'acme-corp' },
						},
						industry: { main_industry: 'Computer Software' },
					},
					is_current: true,
					start_at: '2022-06-01T00:00:00.000Z',
				},
			],
		},
		social_profiles: {
			professional_network: { id: 87654321, url: 'https://www.linkedin.com/in/jdoe', handle: 'jdoe' },
		},
	},
};

describe('mapV2ToV1', () => {
	const result = mapV2ToV1(v2Row);

	it('maps contact base fields', () => {
		expect(result.contact.firstname).toBe('John');
		expect(result.contact.lastname).toBe('Doe');
		expect(result.contact.domain).toBe('acme.com');
	});

	it('maps email and phone fields', () => {
		expect(result.contact.most_probable_email).toBe('john@acme.com');
		expect(result.contact.most_probable_phone).toBe('+1 555-100-2000');
		expect(result.contact.emails).toHaveLength(2);
		expect(result.contact.phones).toHaveLength(2);
	});

	it('maps social_medias from professional_network', () => {
		expect(result.contact.social_medias).toEqual([
			{ url: 'https://www.linkedin.com/in/jdoe', type: 'LINKEDIN' },
		]);
	});

	it('sets 5 deprecated fields to null', () => {
		expect(result.contact.profile.sales_navigator_id).toBeNull();
		expect(result.contact.profile.premium_account).toBeNull();
		expect(result.contact.profile.summary).toBeNull();
		expect(result.contact.profile.headline).toBeNull();
		expect(result.contact.profile.position.company.website).toBeNull();
	});

	it('maps location as joined string', () => {
		expect(result.contact.profile.location).toBe('New York, New York, United States');
	});

	it('maps position from employment.all[0]', () => {
		expect(result.contact.profile.position.title).toBe('VP of Sales');
		expect(result.contact.profile.position.description).toBe('Leading sales org');
		expect(result.contact.profile.position.start_at).toEqual({ month: 6, year: 2022 });
		expect(result.contact.profile.position.end_at).toBeNull();
	});

	it('passes through custom fields', () => {
		expect(result.custom).toEqual({ crm_id: '99887' });
	});
});

describe('mapV2ToV1 — minimal payload (no profile)', () => {
	const minimalRow = {
		input: { first_name: 'Jane', last_name: 'Smith', company_domain: 'example.com' },
		contact_info: {
			most_probable_work_email: { email: 'jane@example.com', status: 'HIGH_PROBABILITY' },
			work_emails: [{ email: 'jane@example.com', status: 'HIGH_PROBABILITY' }],
			phones: [],
			personal_emails: [],
		},
	};

	const result = mapV2ToV1(minimalRow);

	it('maps contact fields', () => {
		expect(result.contact.firstname).toBe('Jane');
		expect(result.contact.lastname).toBe('Smith');
		expect(result.contact.domain).toBe('example.com');
		expect(result.contact.most_probable_email).toBe('jane@example.com');
	});

	it('returns empty social_medias when no profile', () => {
		expect(result.contact.social_medias).toEqual([]);
	});

	it('handles missing profile gracefully', () => {
		expect(result.contact.profile.linkedin_id).toBeUndefined();
		expect(result.contact.profile.location).toBeNull();
		expect(result.contact.profile.position.title).toBeUndefined();
		expect(result.contact.profile.position.company.linkedin_id).toBeUndefined();
	});

	it('defaults personal email to empty string when missing', () => {
		expect(result.contact.most_probable_personal_email).toBe('');
		expect(result.contact.most_probable_personal_email_status).toBe('');
	});
});
