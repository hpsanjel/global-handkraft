"use client";

import { useEffect, useState } from "react";
import { CartDrawer } from "@/components/cart-drawer";
import type { PriceZoneWithCountries } from "@/lib/price-zones-shared";

export function CartDrawerProvider({ priceZones }: { priceZones: PriceZoneWithCountries[] }) {
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		const handleOpen = () => setIsOpen(true);
		window.addEventListener("cart:drawer:open", handleOpen);
		return () => window.removeEventListener("cart:drawer:open", handleOpen);
	}, []);

	return <CartDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} priceZones={priceZones} />;
}
