import type { Config } from 'jest';

const config: Config = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testMatch: ['**/tests/**/*.test.ts'],
	testPathIgnorePatterns: ['/node_modules/', '/dist/', '/tests/integration/'],
	modulePathIgnorePatterns: ['/dist/'],
};

export default config;
