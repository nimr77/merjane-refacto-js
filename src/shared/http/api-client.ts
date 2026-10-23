import {z} from 'zod';
import {HttpMethod} from './http-method.js';

export async function apiRequest(path: string, method = HttpMethod.Get): Promise<unknown> {
	const response = await fetch(path, {method, headers: {accept: 'application/json'}});
	const body: unknown = await response.json();
	if (!response.ok) {
		const error = z.object({message: z.string()}).safeParse(body);
		throw new Error(error.success ? error.data.message : `Request failed (${response.status}).`);
	}

	return body;
}
