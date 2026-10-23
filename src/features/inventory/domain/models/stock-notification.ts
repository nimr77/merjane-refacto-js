import {type StockNotificationType} from '../enums/stock-notification-type.js';

export type StockNotification =
	| {readonly type: StockNotificationType.Delay; readonly productName: string; readonly leadTime: number}
	| {readonly type: StockNotificationType.Unavailable; readonly productName: string}
	| {readonly type: StockNotificationType.Expired; readonly productName: string; readonly expiryDate: Date};
