"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { type ShippingConfig, DEFAULT_SHIPPING_CONFIG } from "@/lib/shipping-client";

const ShippingContext = createContext<ShippingConfig>(DEFAULT_SHIPPING_CONFIG);

export function ShippingProvider({
	children,
	initialConfig,
}: {
	children: React.ReactNode;
	initialConfig?: ShippingConfig;
}) {
	const [config, setConfig] = useState<ShippingConfig>(initialConfig ?? DEFAULT_SHIPPING_CONFIG);

	useEffect(() => {
		if (initialConfig) {
			setConfig(initialConfig);
			return;
		}

		let active = true;
		fetch("/api/shipping/config")
			.then((res) => res.json())
			.then((data: ShippingConfig) => {
				if (active && data && typeof data.norwayRate === "number") {
					setConfig(data);
				}
			})
			.catch(() => {});

		return () => {
			active = false;
		};
	}, [initialConfig]);

	return <ShippingContext.Provider value={config}>{children}</ShippingContext.Provider>;
}

export function useShippingConfig(): ShippingConfig {
	return useContext(ShippingContext);
}
