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
	estimatedDelivery: string | null;
	address: Address;
	shipment: Shipment | null;
}
