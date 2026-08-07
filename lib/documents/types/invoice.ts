import type { DocumentType } from "./document";

export interface DocumentMetadata {
	documentNumber: string;
	type: DocumentType;
	issuedAt: Date;
}

/** We run a no-returns policy — this is a notice, not a return-instructions sheet. */
export interface ReturnInformation {
	policySummary: string;
	supportEmail: string;
	supportPhone: string;
	website: string;
}
