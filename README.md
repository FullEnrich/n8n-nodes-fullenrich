# n8n-nodes-fullenrich

This is an n8n community node that lets you use FullEnrich in your n8n workflows.

**FullEnrich** is a contact enrichment service that takes minimal input (such as first name, last name, company domain, or LinkedIn URL) and returns enriched contact data like emails, phone numbers, and company information.  
This node enables you to **start asynchronous enrichment requests** and **receive enriched results via webhook**, all within n8n.


[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  
[Version history](#version-history)  

---

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

Example:

```bash
npm install n8n-nodes-fullenrich
```

Then restart your n8n instance.

---

## Operations

This package provides two nodes:

### FullEnrich Node: Start Enrichment
- Accepts one or multiple contacts from previous nodes (e.g., Sheets, forms, or manual input).
- Supports additional custom fields per contact (e.g. `row_id`, `user_id`).
- Sends each contact to FullEnrich's API enrichment endpoint.

### FullEnrich Node: Get Enrichment Result (Webhook Trigger)
- Acts as a webhook endpoint.
- Listens for enrichment results returned via `webhook_url` from FullEnrich.
- Outputs enriched contact data in a format usable by other nodes like Google Sheets, Airtable, or CRMs.

---

## Credentials

The node requires API authentication:

- Go to **n8n > Credentials**.
- Create a new **HTTP Basic Auth** credential or custom one labeled `fullEnrichApi`.
- Provide your API key as required by your FullEnrich backend.

_You must assign this credential in the "Start Enrichment" node configuration._

---

## Compatibility

- Minimum **n8n version**: `1.22.0`
- Tested on: `1.22.0`, `1.25.1`, `1.28.0`
- Node requires a FullEnrich-compatible API (self-hosted or cloud-based).

---

## Usage

- The **Start Enrichment** node supports contacts from:
- Previous nodes (e.g., Google Sheets, Airtable, Manual trigger).
- Manual input from UI form (via structured fields).
- You can also pass a **custom field name** (e.g. `user_id`) to track each contact in your workflow — this value will be passed under the `custom` object.
- The **Get Result** node acts as a webhook and must be connected to the URL you provide to FullEnrich (auto-generated in most cases).

**Example Use Case:**
1. Load leads from a Google Sheet.
2. Send to **Start Enrichment**.
3. Receive enriched data via **FullEnrich Trigger**.
4. Update the same Google Sheet.

---

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [FullEnrich API documentation](https://docs.fullenrich.com/introduction)

---

## Version history

### 0.1.0
- Initial release.
