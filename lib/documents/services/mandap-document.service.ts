import { getDocumentGenerator } from "../registry/document-registry";
import { assertValidOrderDocumentData } from "../utils/validation";
import type { DocumentOutput, DocumentType, OrderDocumentData, OutputFormat } from "../types";
import { loadMandapInquiryDocumentData } from "./mandap-document-data.service";
import { resolveMandapDocumentNumber, getOrCreateReferenceNumber } from "./document-number.service";
import { renderDocument } from "./document-renderer.service";

/**
 * Assembles the full, validated OrderDocumentData for a given custom
 * MandapInquiry and document type. Mirrors assembleOrderDocumentData, with
 * one extra step: a MandapInquiry has no orderNumber-equivalent until its
 * first document is generated, so the reference number is claimed up front
 * (idempotent — resolveMandapDocumentNumber below claims the same one again
 * for non-legal types, cheaply, since it's already persisted by then).
 */
export async function assembleMandapInquiryDocumentData(inquiryId: string, type: DocumentType): Promise<OrderDocumentData> {
	await getOrCreateReferenceNumber(inquiryId);
	const data = await loadMandapInquiryDocumentData(inquiryId, type);
	const documentNumber = await resolveMandapDocumentNumber(type, { id: inquiryId });

	const full: OrderDocumentData = {
		...data,
		metadata: { documentNumber, type, issuedAt: new Date() },
	};

	assertValidOrderDocumentData(full);
	return full;
}

export interface GenerateMandapDocumentParams {
	inquiryId: string;
	type: DocumentType;
	format: OutputFormat;
}

export async function generateMandapInquiryDocument(params: GenerateMandapDocumentParams & { format: "buffer" }): Promise<Extract<DocumentOutput, { format: "buffer" }>>;
export async function generateMandapInquiryDocument(params: GenerateMandapDocumentParams & { format: "stream" }): Promise<Extract<DocumentOutput, { format: "stream" }>>;
export async function generateMandapInquiryDocument(params: GenerateMandapDocumentParams & { format: "blob" }): Promise<Extract<DocumentOutput, { format: "blob" }>>;
export async function generateMandapInquiryDocument(params: GenerateMandapDocumentParams): Promise<DocumentOutput>;
/** The single entry point every caller (webhook, admin routes) should use to generate a document for a custom mandap/temple order. */
export async function generateMandapInquiryDocument({ inquiryId, type, format }: GenerateMandapDocumentParams): Promise<DocumentOutput> {
	const data = await assembleMandapInquiryDocumentData(inquiryId, type);
	const generator = getDocumentGenerator(type);
	const element = generator.build(data);
	return renderDocument(element, data.metadata.documentNumber, format);
}
