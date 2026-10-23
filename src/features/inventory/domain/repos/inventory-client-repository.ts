import {type Product} from '../models/product.js';

export type InventoryClientRepository = {
	list(): Promise<Product[]>;
};
