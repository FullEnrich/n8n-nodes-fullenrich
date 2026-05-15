import { config } from '@n8n/node-cli/eslint';

export default [
	...config,
	{ ignores: ['tests/**', 'jest.config.ts', 'dist/**'] },
	{
		files: ['nodes/FullEnrichTrigger/**/*.ts'],
		rules: {
			'@n8n/community-nodes/webhook-lifecycle-complete': 'off',
		},
	},
];
