import { useEffect, useState } from "react";
import { products as initialProducts } from "@/lib/data/products";
import type { Product } from "@/types/store";

export const productsCatalogStorageKey = "global-handcraft-admin-products";

let inMemoryCatalog: Product[] | null = null;

function readCatalogFromStorage(): Product[] {
	if (typeof window === "undefined") {
		return initialProducts;
	}

	try {
		const stored = window.localStorage.getItem(productsCatalogStorageKey);
		if (stored) {
			const parsed = JSON.parse(stored) as Product[];
			if (Array.isArray(parsed) && parsed.length > 0) {
				return parsed;
			}
		}
	} catch {
		// Fall back to the seeded catalog if storage is unavailable.
	}

	return initialProducts;
}

export function getProductsCatalog(): Product[] {
	if (inMemoryCatalog) {
		return inMemoryCatalog;
	}

	inMemoryCatalog = readCatalogFromStorage();
	return inMemoryCatalog;
}

export function saveProductsCatalog(products: Product[]) {
	inMemoryCatalog = products;
	if (typeof window === "undefined") {
		return;
	}

	window.localStorage.setItem(productsCatalogStorageKey, JSON.stringify(products));
	window.dispatchEvent(new Event("products:updated"));
}

export function useProductsCatalog() {
	const [products, setProducts] = useState<Product[]>(() => getProductsCatalog());

	useEffect(() => {
		const syncProducts = () => {
			setProducts(getProductsCatalog());
		};

		syncProducts();
		window.addEventListener("products:updated", syncProducts);

		return () => {
			window.removeEventListener("products:updated", syncProducts);
		};
	}, []);

	return products;
}
