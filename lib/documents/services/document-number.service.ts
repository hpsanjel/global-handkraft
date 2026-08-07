import { prisma } from "@/lib/prisma";
import type { DocumentType } from "../types";

const INVOICE_SCOPE = "INVOICE";

/**
 * Atomically claims the next sequence value for a (scope, year) counter.
 * `nextValue` is stored as "the value the next caller should receive"; the
 * create branch seeds it at 2 so the formula `result.nextValue - 1` gives the
 * correct assigned number on both branches uniformly (create: 2 - 1 = 1;
 * update: whatever it was pre-increment). Prisma compiles this upsert to a
 * single atomic `INSERT ... ON CONFLICT DO UPDATE` on Postgres, so it's
 * race-safe under real concurrency without any manual transaction/retry
 * logic — an earlier hand-rolled try/create/catch/retry version of this
 * broke under concurrent first-time requests (a Postgres error inside a
 * transaction aborts the whole transaction, so the "retry" query inside the
 * catch block was itself rejected).
 */
async function nextSequenceValue(scope: string, year: number): Promise<number> {
	const result = await prisma.documentCounter.upsert({
		where: { scope_year: { scope, year } },
		create: { scope, year, nextValue: 2 },
		update: { nextValue: { increment: 1 } },
		select: { nextValue: true },
	});
	return result.nextValue - 1;
}

function formatSequence(prefix: string, year: number, sequence: number): string {
	return `${prefix}-${year}-${String(sequence).padStart(6, "0")}`;
}

/**
 * Returns the order's existing invoice number if one was already assigned,
 * otherwise atomically assigns and persists a new one.
 *
 * The counter increment alone is atomic, but "check if the order already has
 * a number, then assign one" is a classic check-then-act race: two concurrent
 * calls for the same never-before-numbered order can both see null and both
 * mint a number. Guard the write with `WHERE invoiceNumber IS NULL` so
 * Postgres's row-level locking serializes concurrent UPDATEs on that row —
 * only one wins; the loser discards its claimed sequence value (an
 * intentional gap in the series, which is safer than the order ending up
 * with a persisted number that doesn't match the one already printed on a
 * PDF generated a moment earlier) and reads back the winning number instead.
 */
export async function getOrCreateInvoiceNumber(orderId: string): Promise<string> {
	const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, select: { invoiceNumber: true } });
	if (order.invoiceNumber) return order.invoiceNumber;

	const year = new Date().getFullYear();
	const sequence = await nextSequenceValue(INVOICE_SCOPE, year);
	const candidateNumber = formatSequence("INV", year, sequence);

	const claimed = await prisma.order.updateMany({
		where: { id: orderId, invoiceNumber: null },
		data: { invoiceNumber: candidateNumber },
	});
	if (claimed.count === 1) return candidateNumber;

	const existing = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, select: { invoiceNumber: true } });
	if (!existing.invoiceNumber) {
		throw new Error(`Failed to resolve invoice number for order ${orderId}`);
	}
	return existing.invoiceNumber;
}

const NON_LEGAL_PREFIXES: Partial<Record<DocumentType, string>> = {
	PACKING_LIST: "PKL",
	RECEIPT: "RCT",
	RETURN_CARD: "RTN",
	SHIPPING_SUMMARY: "SHS",
	ORDER_SUMMARY: "ORS",
	GIFT_RECEIPT: "GFT",
};

/**
 * Resolves the document number to print on a generated document. Commercial
 * and customs invoices share one legally-numbered series (a customs invoice
 * is the same commercial invoice reformatted for customs, not a separate
 * legal document) and are the only types that get a persisted, gap-free
 * sequence — everything else gets a stable identifier derived from the order
 * number, which is sufficient since those documents aren't accounting records.
 */
export async function resolveDocumentNumber(type: DocumentType, order: { id: string; orderNumber: string }): Promise<string> {
	if (type === "COMMERCIAL_INVOICE" || type === "CUSTOMS_INVOICE") {
		return getOrCreateInvoiceNumber(order.id);
	}

	const prefix = NON_LEGAL_PREFIXES[type] ?? type;
	return `${prefix}-${order.orderNumber}`;
}
