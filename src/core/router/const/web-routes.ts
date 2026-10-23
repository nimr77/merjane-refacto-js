export const WEB_ROUTES = {
	home: '/',
	script: '/assets/main.js',
	stylesheet: '/assets/main.css',
} as const;

export const WEB_ASSETS = [
	{route: WEB_ROUTES.script, file: 'main.js', contentType: 'application/javascript'},
	{route: WEB_ROUTES.stylesheet, file: 'main.css', contentType: 'text/css'},
] as const;
