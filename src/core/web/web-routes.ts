import {readFile} from 'node:fs/promises';
import {type FastifyInstance} from 'fastify';
import {WEB_ASSETS, WEB_ROUTES} from '../router/const/web-routes.js';

export async function webRoutes(server: FastifyInstance): Promise<void> {
	server.get(WEB_ROUTES.home, async (_request, reply) => {
		const html = await readFile(new URL('index.html', import.meta.url), 'utf8');
		return reply.type('text/html; charset=utf-8').send(html);
	});
	for (const {route, file, contentType} of WEB_ASSETS) {
		server.get(route, async (_request, reply) => {
			const asset = await readFile(new URL(`../../../dist/web/${file}`, import.meta.url));
			return reply.type(contentType).send(asset);
		});
	}
}
