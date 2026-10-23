import {describe, expect, it} from 'vitest';
import {WEB_ASSETS, WEB_ROUTES} from './web-routes.js';

describe('Web route constants', () => {
	it('preserves the app shell and asset URLs', () => {
		expect(WEB_ROUTES).toEqual({home: '/', script: '/assets/main.js', stylesheet: '/assets/main.css'});
		expect(WEB_ASSETS.map(asset => asset.route)).toEqual([WEB_ROUTES.script, WEB_ROUTES.stylesheet]);
	});
});
