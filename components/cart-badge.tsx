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
		<button type="button" onClick={handleOpenCart} className="relative inline-flex cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white p-2.5 text-stone-700 transition hover:text-stone-950" aria-label="Open cart">
			<ShoppingCart className="h-5 w-5" />
			{count > 0 ? <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-stone-900 px-1 text-[11px] font-semibold text-white">{count}</span> : null}
		</button>
	);
}
