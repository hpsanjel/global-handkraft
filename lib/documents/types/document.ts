import type { ReactElement } from "react";
import type { Business } from "./business";
import type { Customer } from "./customer";
import type { Order } from "./order";
import type { Payment, Tax, Discount } from "./payment";
import type { ShippingInformation } from "./shipment";
import type { DocumentMetadata, ReturnInformation } from "./invoice";

export type DocumentType = "COMMERCIAL_INVOICE" | "PACKING_LIST" | "RECEIPT" | "CUSTOMS_INVOICE" | "RETURN_CARD" | "SHIPPING_SUMMARY" | "ORDER_SUMMARY" | "GIFT_RECEIPT";

export const DOCUMENT_TYPES: readonly DocumentType[] = ["COMMERCIAL_INVOICE", "PACKING_LIST", "RECEIPT", "CUSTOMS_INVOICE", "RETURN_CARD", "SHIPPING_SUMMARY", "ORDER_SUMMARY", "GIFT_RECEIPT"];

/** Single source of truth for validating a DocumentType coming from an untrusted source (e.g. a route param). */
export function isDocumentType(value: string): value is DocumentType {
	return (DOCUMENT_TYPES as string[]).includes(value);
}

/**
 * PDF-only. All three are produced from the same react-pdf <Document> element
 * by DocumentRendererService; the caller picks the container that fits its use
 * (email attachment -> buffer, route handler -> stream, client download -> blob).
 * "Printable HTML" (the other output format in the brief) is intentionally not
 * part of this union — it's a separate React Server Component page with print
 * CSS, not a react-pdf render, so it doesn't go through this pipeline at all.
 */
export type OutputFormat = "buffer" | "stream" | "blob";

/** The single composite root every document builder receives; assembled once per generation by OrderDocumentDataService. */
export interface OrderDocumentData {
	business: Business;
	customer: Customer;
	order: Order;
	payment: Payment;
	taxes: Tax[];
	discounts: Discount[];
	shipping: ShippingInformation;
	returnInformation: ReturnInformation;
	metadata: DocumentMetadata;
}

export interface DocumentGenerator {
	readonly type: DocumentType;
	/** Builds the presentational element tree only — never fetches data or performs I/O. */
	build(data: OrderDocumentData): ReactElement;
}

export interface DocumentGenerateOptions {
	format: OutputFormat;
}

interface DocumentOutputBase {
	fileName: string;
	documentNumber: string;
}

export type DocumentOutput = DocumentOutputBase &
	(
		| { format: "buffer"; contentType: "application/pdf"; data: Buffer }
		| { format: "stream"; contentType: "application/pdf"; data: NodeJS.ReadableStream }
		| { format: "blob"; contentType: "application/pdf"; data: Blob }
	);
