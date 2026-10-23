import {type Product} from '../models/product.js';

export type InventoryRepository = {
	list(): Product[];
};
