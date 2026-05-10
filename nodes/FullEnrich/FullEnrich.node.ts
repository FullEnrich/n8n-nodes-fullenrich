import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';

import { fullEnrichFields } from './FullEnrich.description';
import { execute } from './FullEnrich.execute';

export class FullEnrich implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FullEnrich',
		name: 'fullEnrich',
		icon: {
			light: 'file:../fe-logo-light.svg',
			dark: 'file:../fe-logo-dark.svg',
		},
		group: ['transform'],
		version: [1, 2],
		defaultVersion: 2,
		description: 'Start a FullEnrich bulk enrichment request',
		subtitle: '={{$parameter["enrichmentName"] || "Enrichment by n8n"}}',
		defaults: {
			name: 'FullEnrich',
		},
		credentials: [
			{
				name: 'fullEnrichApi',
				required: true,
			},
		],
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: fullEnrichFields,
		usableAsTool: true,
	};

	// continueOnFail() is handled inside execute() in FullEnrich.execute.ts
	// eslint-disable-next-line @n8n/community-nodes/require-continue-on-fail
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const version = this.getNode().typeVersion;
		return execute(this, version);
	}
}
