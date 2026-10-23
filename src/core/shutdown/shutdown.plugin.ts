import process from 'node:process';
import {type FastifyPluginAsync} from 'fastify';

const shutdownPlugin: FastifyPluginAsync = async server => {
	const close = async () => server.close();
	process.on('SIGINT', close);
	process.on('SIGTERM', close);
	server.addHook('onClose', async () => {
		process.off('SIGINT', close);
		process.off('SIGTERM', close);
	});
};

export default shutdownPlugin;
