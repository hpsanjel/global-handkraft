import type { CartItem } from "@/types/store";

export const CART_STORAGE_KEY = "global-handcraft-cart";

export function getCartItems(): CartItem[] {
	if (typeof window === "undefined") {
		return [];
	}

	try {
		const rawValue = window.localStorage.getItem(CART_STORAGE_KEY);
		return rawValue ? (JSON.parse(rawValue) as CartItem[]) : [];
	} catch {
		return [];
	}
}

export function saveCartItems(items: CartItem[]) {
	if (typeof window === "undefined") {
		return;
	}

	window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function getCartCount() {
	return getCartItems().reduce((count, item) => count + item.quantity, 0);
}

export function updateCartItemQuantity(productId: string, variantId: string, addonIds: string[], delta: number) {
	const nextItems = getCartItems()
		.map((item) => {
			const sameSelection = item.productId === productId && item.variantId === variantId && JSON.stringify(item.addonIds) === JSON.stringify(addonIds);
			if (!sameSelection) {
				return item;
			}

			const updatedQuantity = Math.max(0, item.quantity + delta);
			return updatedQuantity > 0 ? { ...item, quantity: updatedQuantity } : null;
		})
		.filter(Boolean) as CartItem[];

	saveCartItems(nextItems);
	window.dispatchEvent(new Event("cart:updated"));
}

export function removeCartItem(productId: string, variantId: string, addonIds: string[]) {
	const nextItems = getCartItems().filter((item) => !(item.productId === productId && item.variantId === variantId && JSON.stringify(item.addonIds) === JSON.stringify(addonIds)));
	saveCartItems(nextItems);
	window.dispatchEvent(new Event("cart:updated"));
}

export function clearCart() {
	saveCartItems([]);
	window.dispatchEvent(new Event("cart:updated"));
}

export function resetCart() {
	saveCartItems([]);
	window.dispatchEvent(new Event("cart:updated"));
}
