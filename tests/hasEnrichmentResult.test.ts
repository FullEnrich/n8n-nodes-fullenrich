import { hasEnrichmentResult } from '../nodes/FullEnrichTrigger/FullEnrichTrigger.node';

describe('hasEnrichmentResult — V2 (contact_info)', () => {
	it('returns true when most_probable_work_email is set', () => {
		const item = { contact_info: { most_probable_work_email: { email: 'john@acme.com', status: 'DELIVERABLE' } } };
		expect(hasEnrichmentResult(item)).toBe(true);
	});

	it('returns true when most_probable_personal_email is set', () => {
		const item = { contact_info: { most_probable_personal_email: { email: 'john@gmail.com', status: 'HIGH_PROBABILITY' } } };
		expect(hasEnrichmentResult(item)).toBe(true);
	});

	it('returns true when most_probable_phone is set', () => {
		const item = { contact_info: { most_probable_phone: { number: '+1 555-100-2000', region: 'US' } } };
		expect(hasEnrichmentResult(item)).toBe(true);
	});

	it('returns true when work_emails array is non-empty', () => {
		const item = { contact_info: { work_emails: [{ email: 'john@acme.com', status: 'DELIVERABLE' }] } };
		expect(hasEnrichmentResult(item)).toBe(true);
	});

	it('returns true when phones array is non-empty', () => {
		const item = { contact_info: { phones: [{ number: '+1 555-100-2000', region: 'US' }] } };
		expect(hasEnrichmentResult(item)).toBe(true);
	});

	it('returns false when contact_info is fully empty', () => {
		const item = {
			contact_info: {
				most_probable_work_email: null,
				most_probable_personal_email: null,
				most_probable_phone: null,
				work_emails: [],
				personal_emails: [],
				phones: [],
			},
		};
		expect(hasEnrichmentResult(item)).toBe(false);
	});

	it('returns false when most_probable_*_email object has no email field', () => {
		const item = {
			contact_info: {
				most_probable_work_email: { status: 'NOT_FOUND' },
				most_probable_personal_email: { status: 'NOT_FOUND' },
				most_probable_phone: { region: 'US' },
				work_emails: [],
				personal_emails: [],
				phones: [],
			},
		};
		expect(hasEnrichmentResult(item)).toBe(false);
	});

	it('returns false when contact_info is empty object', () => {
		expect(hasEnrichmentResult({ contact_info: {} })).toBe(false);
	});
});

describe('hasEnrichmentResult — V1 (contact)', () => {
	it('returns true when most_probable_email is set', () => {
		const item = { contact: { most_probable_email: 'john@acme.com' } };
		expect(hasEnrichmentResult(item)).toBe(true);
	});

	it('returns true when most_probable_personal_email is set', () => {
		const item = { contact: { most_probable_personal_email: 'john@gmail.com' } };
		expect(hasEnrichmentResult(item)).toBe(true);
	});

	it('returns true when most_probable_phone is set', () => {
		const item = { contact: { most_probable_phone: '+1 555-100-2000' } };
		expect(hasEnrichmentResult(item)).toBe(true);
	});

	it('returns true when emails array is non-empty', () => {
		const item = { contact: { emails: [{ email: 'john@acme.com' }] } };
		expect(hasEnrichmentResult(item)).toBe(true);
	});

	it('returns true when phones array is non-empty', () => {
		const item = { contact: { phones: [{ number: '+1 555-100-2000' }] } };
		expect(hasEnrichmentResult(item)).toBe(true);
	});

	it('returns false on real CREDITS_INSUFFICIENT V1 payload (all fields blank)', () => {
		// Actual shape observed from the API when no credits are left:
		// every contact field is present but empty ("" or []).
		const item = {
			custom: { contactId: '003gL00000XsC7dQAF', taskId: '2' },
			contact: {
				firstname: '',
				lastname: '',
				domain: '',
				most_probable_email: '',
				most_probable_email_status: '',
				most_probable_personal_email: '',
				most_probable_personal_email_status: '',
				most_probable_phone: '',
				emails: [],
				personal_emails: [],
				phones: [],
				social_medias: [],
			},
		};
		expect(hasEnrichmentResult(item)).toBe(false);
	});

	it('returns false when contact is empty object', () => {
		expect(hasEnrichmentResult({ contact: {} })).toBe(false);
	});
});

describe('hasEnrichmentResult — neither shape', () => {
	it('returns false when item has no contact nor contact_info', () => {
		expect(hasEnrichmentResult({ input: { first_name: 'John' } })).toBe(false);
	});

	it('returns false on null/undefined-ish input', () => {
		expect(hasEnrichmentResult({} as any)).toBe(false);
		expect(hasEnrichmentResult(undefined as any)).toBe(false);
		expect(hasEnrichmentResult(null as any)).toBe(false);
	});

	it('prefers V2 over V1 when both are present', () => {
		// If a payload accidentally carried both shapes, V2 wins. This test pins
		// the precedence so a future refactor doesn't silently flip it.
		const item = {
			contact_info: { work_emails: [{ email: 'v2@acme.com' }] },
			contact: { emails: [] }, // V1 says "nothing"
		};
		expect(hasEnrichmentResult(item)).toBe(true);
	});
});
