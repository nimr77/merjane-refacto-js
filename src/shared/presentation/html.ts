export function escapeHtml(value: string | number): string {
	return String(value).replaceAll(/[&<>"']/g, character => {
		switch (character) {
			case '&': { return '&amp;'; }
			case '<': { return '&lt;'; }
			case '>': { return '&gt;'; }
			case '"': { return '&quot;'; }
			default: { return '&#39;'; }
		}
	});
}

export function element<T extends HTMLElement>(selector: string, type: new () => T): T {
	const result = document.querySelector(selector);
	if (!(result instanceof type)) {
		throw new TypeError(`Missing UI element: ${selector}`);
	}

	return result;
}
