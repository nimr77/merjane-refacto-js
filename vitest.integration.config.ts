import {type UserConfig, mergeConfig} from 'vitest/config';
import {baseConfig} from './vitest.config.base.js';

export default mergeConfig<UserConfig, Partial<UserConfig>>(baseConfig, {
	test: {
		include: ['**/*.integration.spec.ts'],
		minWorkers: 1,
		maxWorkers: 1,
	},
});
