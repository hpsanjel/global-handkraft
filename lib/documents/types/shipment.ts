import type { Address } from "./customer";

export interface Package {
	packageNumber: number;
	weightInGrams: number;
	lengthCm?: number;
	widthCm?: number;
	heightCm?: number;
	contentsSummary?: string;
}

export type Carrier = "BRING" | "POSTNORD" | "DHL" | "UPS" | "FEDEX" | "OTHER";

export interface Shipment {
	shipmentNumber: string;
	carrier: Carrier | null;
	serviceName: string | null;
	trackingNumber: string | null;
	trackingUrl: string | null;
	packages: Package[];
	totalWeightInGrams: number;
}

export interface ShippingInformation {
	method: string | null;
	/** True when the customer chose in-store pickup rather than a shipped delivery. */
	isPickup: boolean;
	estimatedDelivery: string | null;
	address: Address;
	shipment: Shipment | null;
	/** Per-order Incoterms override (e.g. "EXW", "FOB", "DAP"). Falls back to Business.defaultIncoterm when unset. */
	incoterm?: string;
}
