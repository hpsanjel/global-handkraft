"use client";

import { useEffect, useState } from "react";
import { CartDrawer } from "@/components/cart-drawer";

export function CartDrawerProvider() {
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		const handleOpen = () => setIsOpen(true);
		window.addEventListener("cart:drawer:open", handleOpen);
		return () => window.removeEventListener("cart:drawer:open", handleOpen);
	}, []);

	return <CartDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}
