import fastify from 'fastify';
import {asValue} from 'awilix';
import {serializerCompiler, validatorCompiler} from 'fastify-type-provider-zod';
import {awilixPlugin} from './core/di/awilix.plugin.js';
import {configureDiContext} from './core/di/di.context.js';
import shutdownPlugin from './core/shutdown/shutdown.plugin.js';
import {drizzlePlugin} from './core/db/drizzle.plugin.js';
import {orderRoutes} from './features/orders/presentation/order-routes.js';
import {inventoryRoutes} from './features/inventory/presentation/inventory-routes.js';
import {webRoutes} from './core/web/web-routes.js';
import {type Database} from './core/db/type.js';

export async function buildFastify(database?: Database) {
	const server = fastify();
	server.setValidatorCompiler(validatorCompiler);
	server.setSerializerCompiler(serializerCompiler);

	await server.register(awilixPlugin());
	if (database) {
		server.decorate('database', database);
	} else {
		await server.register(drizzlePlugin);
	}

	await server.register(shutdownPlugin);
	await server.register(configureDiContext);
	await server.register(orderRoutes);
	await server.register(inventoryRoutes);
	await server.register(webRoutes);

	server.addHook('onRequest', async request => {
		request.diScope.register({
			logger: asValue(request.log),
		});
	});
	return server;
}
