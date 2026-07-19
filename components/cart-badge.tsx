"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

		return () => {
			document.removeEventListener("visibilitychange", handleVisibility);
			window.removeEventListener("storage", updateCount);
			window.removeEventListener("cart:updated", updateCount);
		};
	}, []);

	return (
		<Link href="/cart" className="relative inline-flex items-center justify-center rounded-full border border-stone-200 bg-white p-2.5 text-stone-700 transition hover:text-stone-950">
			<ShoppingCart className="h-5 w-5" />
			{count > 0 ? <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-stone-900 px-1 text-[11px] font-semibold text-white">{count}</span> : null}
		</Link>
	);
}
