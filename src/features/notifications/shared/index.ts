import {type INotificationService} from '@/services/notifications.port.js';
import {type StockNotification, StockNotificationType} from '@/features/inventory/shared/index.js';

export {type INotificationService} from '@/services/notifications.port.js';

export function sendStockNotification(service: INotificationService, notification: StockNotification): void {
	switch (notification.type) {
		case StockNotificationType.Delay: {
			service.sendDelayNotification(notification.leadTime, notification.productName);
			break;
		}

		case StockNotificationType.Unavailable: {
			service.sendOutOfStockNotification(notification.productName);
			break;
		}

		case StockNotificationType.Expired: {
			service.sendExpirationNotification(notification.productName, notification.expiryDate);
			break;
		}
	}
}
