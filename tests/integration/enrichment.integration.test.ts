import { baseUrlV2 } from '../../nodes/shared/constant';
import { mapV2ToV1 } from '../../nodes/FullEnrichTrigger/FullEnrichTrigger.node';

const API_KEY = process.env.FULLENRICH_TEST_API_KEY;

async function postApi(url: string, body: Record<string, unknown>): Promise<{ status: number; data: any }> {
	const res = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${API_KEY}`,
		},
		body: JSON.stringify(body),
	});
	return { status: res.status, data: await res.json() };
}

async function getApi(url: string): Promise<any> {
	const res = await fetch(url, {
		headers: { Authorization: `Bearer ${API_KEY}` },
	});
	return res.json();
}

async function pollEnrichment(enrichmentId: string, maxWait = 55000): Promise<any> {
	const start = Date.now();
	while (Date.now() - start < maxWait) {
		const data = await getApi(`${baseUrlV2}/contact/enrich/bulk/${enrichmentId}`);
		if (data.status === 'FINISHED') return data;
		await new Promise((r) => setTimeout(r, 3000));
	}
	throw new Error(`Enrichment ${enrichmentId} did not finish within ${maxWait}ms`);
}

beforeAll(() => {
	if (!API_KEY) {
		throw new Error('FULLENRICH_TEST_API_KEY env var is required. Run: FULLENRICH_TEST_API_KEY=xxx npm run test:integration');
	}
});

it('sends enrichment via V2 API, polls result, and maps to V1 structure', async () => {
	// Send enrichment request (same as V1 node does internally)
	const { status, data: created } = await postApi(`${baseUrlV2}/contact/enrich/bulk`, {
		name: `integration-test-${Date.now()}`,
		webhook_url: 'https://webhook.site/test',
		data: [
			{
				first_name: 'John',
				last_name: 'Doe',
				domain: 'example.com',
				company_name: 'Example Inc',
				linkedin_url: '',
				enrich_fields: ['contact.work_emails', 'contact.phones'],
			},
		],
	});

	expect(status).toBe(200);
	expect(created.enrichment_id).toBeDefined();

	// Poll until finished
	const result = await pollEnrichment(created.enrichment_id);

	expect(result.status).toBe('FINISHED');
	expect(result.data).toHaveLength(1);

	// Verify V2 response has expected structure
	const row = result.data[0];
	expect(row).toHaveProperty('input');
	expect(row).toHaveProperty('contact_info');

	// Verify V2 → V1 mapping produces valid V1 structure
	const v1 = mapV2ToV1(row);
	expect(v1.contact.firstname).toBe('John');
	expect(v1.contact.lastname).toBe('Doe');
	expect(v1.contact).toHaveProperty('most_probable_email');
	expect(v1.contact).toHaveProperty('emails');
	expect(v1.contact).toHaveProperty('phones');
	expect(v1.contact).toHaveProperty('social_medias');
	expect(v1.contact).toHaveProperty('profile');
}, 60000);
