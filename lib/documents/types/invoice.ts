import type { BusinessAddress } from "./business";
import type { DocumentType } from "./document";

export interface DocumentMetadata {
	documentNumber: string;
	type: DocumentType;
	issuedAt: Date;
}

export interface ReturnInformation {
	/** The seller's own address, not the customer's — a BusinessAddress, not an Address. */
	returnAddress: BusinessAddress;
	returnWindowDays: number;
	instructions: string[];
	policySummary: string;
	supportEmail: string;
	supportPhone: string;
	website: string;
}
