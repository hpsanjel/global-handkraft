import type { DocumentGenerator, DocumentType } from "../types";
import {
	invoiceGenerator,
	packingListGenerator,
	receiptGenerator,
	customsInvoiceGenerator,
	returnCardGenerator,
	shippingSummaryGenerator,
	orderSummaryGenerator,
	giftReceiptGenerator,
	proFormaInvoiceGenerator,
	depositReceiptGenerator,
} from "../builders";

const DOCUMENT_REGISTRY: Record<DocumentType, DocumentGenerator> = {
	COMMERCIAL_INVOICE: invoiceGenerator,
	PACKING_LIST: packingListGenerator,
	RECEIPT: receiptGenerator,
	CUSTOMS_INVOICE: customsInvoiceGenerator,
	RETURN_CARD: returnCardGenerator,
	SHIPPING_SUMMARY: shippingSummaryGenerator,
	ORDER_SUMMARY: orderSummaryGenerator,
	GIFT_RECEIPT: giftReceiptGenerator,
	PRO_FORMA_INVOICE: proFormaInvoiceGenerator,
	DEPOSIT_RECEIPT: depositReceiptGenerator,
};

export function getDocumentGenerator(type: DocumentType): DocumentGenerator {
	return DOCUMENT_REGISTRY[type];
}
