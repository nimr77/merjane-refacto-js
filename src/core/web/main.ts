import {AppRoute, isAppRoute} from '../router/routes.js';
import '@/shared/styles/app.css';
import {HttpInventoryRepository, InventoryState} from '@/features/inventory/shared/index.js';
import {HttpOrdersRepository, OrdersState} from '@/features/orders/shared/index.js';
import {mountInventory} from '@/features/inventory/presentation/inventory-view.js';
import {mountOrders} from '@/features/orders/presentation/orders-view.js';
import {element} from '@/shared/presentation/html.js';

type TransitionDocument = Document & {
	startViewTransition?: (update: () => void) => {finished: Promise<void>};
};

const inventory = new InventoryState(new HttpInventoryRepository());
const orders = new OrdersState(new HttpOrdersRepository());
mountInventory(inventory);
mountOrders(orders, async () => inventory.load());

function navigate(): void {
	const route = window.location.hash.slice(1);
	const productRoute = new RegExp(`^${AppRoute.Product}/(\\d+)$`).exec(route);
	const section = isAppRoute(route) && route === AppRoute.Orders ? AppRoute.Orders : AppRoute.Inventory;
	const update = () => {
		element('#inventory-section', HTMLElement).hidden = section !== AppRoute.Inventory;
		element('#orders-section', HTMLElement).hidden = section !== AppRoute.Orders;
		for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-nav]')) {
			if (link.dataset['nav'] === section) {
				link.setAttribute('aria-current', 'page');
			} else {
				link.removeAttribute('aria-current');
			}
		}

		inventory.select(productRoute ? Number(productRoute[1]) : undefined);
	};

	const transitionDocument: TransitionDocument = document;
	if (document.visibilityState === 'visible'
		&& transitionDocument.startViewTransition
		&& !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		transitionDocument.startViewTransition(update);
	} else {
		update();
	}
}

window.addEventListener('hashchange', navigate);
element('#refresh', HTMLButtonElement).addEventListener('click', () => {
	void Promise.all([inventory.load(), orders.load()]);
});
await Promise.all([inventory.load(), orders.load()]);
navigate();
