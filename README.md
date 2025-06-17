# n8n-nodes-fullenrich

This is an n8n community node. It lets you use FullEnrich in your n8n workflows.

**FullEnrich** is a contact enrichment service that takes minimal input (like first name, last name, company domain or LinkedIn URL) and returns enriched information such as emails, phone numbers, and company data. This node enables you to start asynchronous enrichment jobs and receive enriched results via webhook, all inside n8n.

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

This node provides the following:

### FullEnrich Node: Start Enrichment
- Accepts contacts as input (via previous node or form UI).
- Sends a batch enrichment request to the FullEnrich API.
- Supports enriching multiple contacts at once.
- Optional custom field mapping for tracking (e.g. `row_number`, `user_id`).
- Automatically handles webhook URL generation.

### FullEnrich Node: Get Enrichment Result (Webhook Trigger)
- Listens for enrichment results returned via webhook from FullEnrich.
- Outputs enriched contact data in a format usable by other nodes like Google Sheets, Airtable, or CRMs.

---

## Credentials

The node requires API authentication:

- Go to **n8n > Credentials**.
- Create a new **HTTP Basic Auth** credential or custom one labeled `fullEnrichApi`.
- Provide your API key or username/password as required by your FullEnrich backend.

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
  - UI form (via structured fields).
  - Or both (merged into one request).
- You can also pass a **custom field name** (e.g. `user_id`) to track each contact in your workflow — this value will be passed under the `custom` object.
- The **Get Result** node acts as a webhook and must be connected to the URL you provide to FullEnrich (auto-generated in most cases).

**Example Use Case:**
1. Load leads from a Google Sheet.
2. Send to **Start Enrichment** (with batching).
3. Receive enriched data via **Get Result Trigger**.
4. Update the same Google Sheet.

---

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [FullEnrich API documentation](https://docs.fullenrich.com/introduction)

---

## Version history

### 0.1.0
- Initial release.
- Supports asynchronous bulk enrichment and webhook result handling.
- Batch handling from input nodes and merging with UI form data.
