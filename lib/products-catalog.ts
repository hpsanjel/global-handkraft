import { useEffect, useState } from "react";
import type { Product } from "@/types/store";

let inMemoryCatalog: Product[] | null = null;

async function fetchProductsFromApi(): Promise<Product[]> {
	const response = await fetch("/api/products", {
		method: "GET",
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error("Unable to fetch product catalog.");
	}

	const data = (await response.json()) as Product[];
	if (!Array.isArray(data)) {
		return [];
	}

	return data;
}

export async function refreshProductsCatalog() {
	if (typeof window === "undefined") {
		return;
	}

	inMemoryCatalog = await fetchProductsFromApi();
	window.dispatchEvent(new Event("products:updated"));
}

export function useProductsCatalog() {
	const [products, setProducts] = useState<Product[]>(() => inMemoryCatalog ?? []);

	useEffect(() => {
		let isDisposed = false;

		const syncProducts = async () => {
			try {
				if (inMemoryCatalog) {
					setProducts(inMemoryCatalog);
					return;
				}

				const nextProducts = await fetchProductsFromApi();
				inMemoryCatalog = nextProducts;
				if (!isDisposed) {
					setProducts(nextProducts);
				}
			} catch {
				if (!isDisposed) {
					setProducts([]);
				}
			}
		};

		const handleProductsUpdated = () => {
			inMemoryCatalog = null;
			void syncProducts();
		};

		void syncProducts();
		window.addEventListener("products:updated", handleProductsUpdated);

		return () => {
			isDisposed = true;
			window.removeEventListener("products:updated", handleProductsUpdated);
		};
	}, []);

	return products;
}
