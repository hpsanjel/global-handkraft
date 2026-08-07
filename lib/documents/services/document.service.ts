import { getDocumentGenerator } from "../registry/document-registry";
import { assertValidOrderDocumentData } from "../utils/validation";
import { isShippingOnlyDocumentType } from "../types";
import type { DocumentOutput, DocumentType, OrderDocumentData, OutputFormat } from "../types";
import { loadOrderDocumentData } from "./order-document-data.service";
import { resolveDocumentNumber } from "./document-number.service";
import { renderDocument } from "./document-renderer.service";

export class DocumentNotApplicableError extends Error {
	constructor(type: DocumentType) {
		super(`${type} is not applicable to this order — it requires a shipped delivery, and this order is in-store pickup.`);
		this.name = "DocumentNotApplicableError";
	}
}

/**
 * Assembles the full, validated OrderDocumentData for a given order and
 * document type — everything a builder needs, with its document number
 * resolved and assigned. Exposed separately from generateDocument() so
 * non-PDF consumers (e.g. a future printable-HTML page) can reuse the same
 * data assembly without going through the PDF renderer.
 */
export async function assembleOrderDocumentData(orderId: string, type: DocumentType): Promise<OrderDocumentData> {
	const data = await loadOrderDocumentData(orderId);

	if (isShippingOnlyDocumentType(type) && data.shipping.isPickup) {
		throw new DocumentNotApplicableError(type);
	}

	const documentNumber = await resolveDocumentNumber(type, { id: orderId, orderNumber: data.order.orderNumber });

	const full: OrderDocumentData = {
		...data,
		metadata: { documentNumber, type, issuedAt: new Date() },
	};

	assertValidOrderDocumentData(full);
	return full;
}

export interface GenerateDocumentParams {
	orderId: string;
	type: DocumentType;
	format: OutputFormat;
}

export async function generateDocument(params: GenerateDocumentParams & { format: "buffer" }): Promise<Extract<DocumentOutput, { format: "buffer" }>>;
export async function generateDocument(params: GenerateDocumentParams & { format: "stream" }): Promise<Extract<DocumentOutput, { format: "stream" }>>;
export async function generateDocument(params: GenerateDocumentParams & { format: "blob" }): Promise<Extract<DocumentOutput, { format: "blob" }>>;
// General fallback overload for callers passing a non-literal (widened) format value.
export async function generateDocument(params: GenerateDocumentParams): Promise<DocumentOutput>;
/** The single entry point every caller (webhook, account routes, admin routes, email attachments) should use to generate a document. */
export async function generateDocument({ orderId, type, format }: GenerateDocumentParams): Promise<DocumentOutput> {
	const data = await assembleOrderDocumentData(orderId, type);
	const generator = getDocumentGenerator(type);
	const element = generator.build(data);
	return renderDocument(element, data.metadata.documentNumber, format);
}
