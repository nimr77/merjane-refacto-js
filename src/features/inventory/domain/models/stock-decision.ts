import {type Product} from './product.js';
import {type StockNotification} from './stock-notification.js';

export type StockDecision = {
	readonly product: Product;
	readonly notification?: StockNotification;
};
