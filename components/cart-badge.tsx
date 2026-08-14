"use client";

import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { getCartCount } from "@/lib/cart";

export function CartBadge() {
	const [count, setCount] = useState(0);

	useEffect(() => {
		const updateCount = () => setCount(getCartCount());
		updateCount();
		const handleVisibility = () => {
			if (document.visibilityState === "visible") {
				updateCount();
			}
		};
		document.addEventListener("visibilitychange", handleVisibility);
		window.addEventListener("storage", updateCount);
		window.addEventListener("cart:updated", updateCount);
		// Re-sync when the page is restored from the back-forward cache (e.g. a
		// user pressing back after completing checkout), since bfcache restores
		// the previous React state instead of re-running mount effects.
		window.addEventListener("pageshow", updateCount);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibility);
			window.removeEventListener("storage", updateCount);
			window.removeEventListener("cart:updated", updateCount);
			window.removeEventListener("pageshow", updateCount);
		};
	}, []);

	const handleOpenCart = () => {
		window.dispatchEvent(new Event("cart:drawer:open"));
	};

	return (
		<button type="button" onClick={handleOpenCart} className="relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 transition hover:text-stone-950 sm:h-10 sm:w-10" aria-label="Open cart">
			<ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
			{count > 0 ? <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-stone-900 px-1 text-xs font-semibold text-white sm:h-5 sm:min-w-5 sm:text-xs">{count}</span> : null}
		</button>
	);
}
