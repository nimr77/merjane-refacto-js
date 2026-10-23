import {type OrdersState} from '../shared/index.js';
import {element, escapeHtml} from '@/shared/presentation/html.js';

export function mountOrders(state: OrdersState, onProcessed: () => Promise<void>): () => void {
	const list = element('#order-list', HTMLElement);
	list.addEventListener('click', event => {
		const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-order]') : null;
		if (button) {
			void state.process(Number(button.dataset['order'])).then(async processed => {
				if (processed) {
					element('#announcement', HTMLElement).textContent = `Order ${button.dataset['order']} processed. Inventory updated.`;
					await onProcessed();
				}
			});
		}
	});
	const render = () => {
		element('#orders-error', HTMLElement).textContent = state.error ?? '';
		element('#total-orders', HTMLElement).textContent = String(state.orders.length).padStart(2, '0');
		list.innerHTML = state.orders.map(order => `<article class="order-row"><span class="order-icon" aria-hidden="true">↗</span>
			<div><strong>Order #${escapeHtml(order.id)}</strong><p>${order.productCount} products · One unit each</p></div>
			<button class="button ${state.isCompleted(order.id) ? 'secondary' : ''}" data-order="${order.id}" ${state.processingId !== undefined || state.isCompleted(order.id) ? 'disabled' : ''}>${state.isCompleted(order.id) ? 'Processed ✓' : (state.processingId === order.id ? 'Processing…' : 'Process order ↗')}</button></article>`).join('')
			|| `<div class="empty">${state.loading ? 'Loading orders…' : 'No orders yet. Run pnpm demo to create sample orders.'}</div>`;
	};

	render();
	return state.subscribe(render);
}
