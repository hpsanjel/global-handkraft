import { prisma } from "@/lib/prisma";
import { BUSINESS } from "../business-config";
import { mapAddress, type PrismaOrderAddress } from "./order-document-data.service";
import { mandapDocumentRequiresAddress } from "../types";
import type { Address, Customer, Discount, OrderDocumentData, OrderItem, Payment, PaymentStatus, ReturnInformation, ShippingInformation, Order as DocumentOrder, OrderStatus as DocumentOrderStatus, Tax, DocumentType } from "../types";

export class MandapInquiryNotFoundError extends Error {
	constructor(inquiryId: string) {
		super(`Custom order request not found: ${inquiryId}`);
		this.name = "MandapInquiryNotFoundError";
	}
}

export class MandapAddressRequiredError extends Error {
	constructor(inquiryId: string) {
		super(`A shipping address must be on file before generating this document for custom order request ${inquiryId}.`);
		this.name = "MandapAddressRequiredError";
	}
}

const RETURN_INFORMATION: ReturnInformation = {
	policySummary: "Custom mandap and temple commissions are made to order and non-refundable once production begins. Contact our support team if your delivered piece is damaged, defective, or doesn't match the agreed specification.",
	supportEmail: BUSINESS.seller.supportEmail,
	supportPhone: BUSINESS.seller.supportPhone,
	website: BUSINESS.seller.website,
};

const PLACEHOLDER_ADDRESS: Address = {
	fullName: "Address pending",
	phone: "",
	email: "",
	line1: "To be provided by customer",
	city: "—",
	postalCode: "—",
	country: "—",
	countryCode: "XX",
};

function mapOrderStatus(inquiry: { paymentStatus: string; fulfillmentStatus: string }): DocumentOrderStatus {
	if (inquiry.paymentStatus === "DECLINED") return "CANCELLED";
	if (inquiry.fulfillmentStatus === "SHIPPED") return "SHIPPED";
	if (inquiry.fulfillmentStatus === "DELIVERED") return "DELIVERED";
	if (inquiry.paymentStatus === "PAID") return inquiry.fulfillmentStatus === "AWAITING_PRODUCTION" ? "PAID" : "PROCESSING";
	if (inquiry.paymentStatus === "DEPOSIT_PAID") return "PROCESSING";
	return "PENDING";
}

function mapPaymentStatus(inquiry: { paymentStatus: string; amountPaid: number }): PaymentStatus {
	if (inquiry.paymentStatus === "DECLINED") return "FAILED";
	if (inquiry.paymentStatus === "PAID") return "PAID";
	if (inquiry.amountPaid > 0) return "PARTIALLY_PAID";
	return "PENDING";
}

export type MandapInquiryDocumentDataWithoutMetadata = Omit<OrderDocumentData, "metadata">;

/**
 * Fetches a MandapInquiry and maps it into the exact same canonical document
 * data shape loadOrderDocumentData produces for a regular Order — so every
 * existing builder/template downstream (commercial invoice, receipt, packing
 * list, customs invoice, shipping summary, order summary) works unmodified
 * against a custom mandap/temple order too. This is the only place in the
 * document module that queries Prisma for a MandapInquiry.
 */
export async function loadMandapInquiryDocumentData(inquiryId: string, type: DocumentType): Promise<MandapInquiryDocumentDataWithoutMetadata> {
	const inquiry = await prisma.mandapInquiry.findUnique({
		where: { id: inquiryId },
		include: {
			address: true,
			transactions: { where: { status: "PAID" }, orderBy: { paidAt: "desc" }, take: 1 },
		},
	});

	if (!inquiry) {
		throw new MandapInquiryNotFoundError(inquiryId);
	}

	if (mandapDocumentRequiresAddress(type) && !inquiry.address) {
		throw new MandapAddressRequiredError(inquiryId);
	}

	const address = inquiry.address ? mapAddress(inquiry.address as PrismaOrderAddress) : PLACEHOLDER_ADDRESS;

	const customer: Customer = {
		id: inquiry.id,
		fullName: inquiry.address?.fullName || inquiry.email || "Prospective customer",
		email: inquiry.email || inquiry.address?.email || "",
		phone: inquiry.whatsapp || inquiry.address?.phone || "",
		billingAddress: address,
		shippingAddress: address,
	};

	const quotedPrice = inquiry.quotedPrice ?? 0;
	const item: OrderItem = {
		sku: `CUSTOM-${inquiry.productSlug}`,
		productName: inquiry.productName,
		variantName: inquiry.material,
		description: inquiry.description,
		quantity: 1,
		unitPrice: quotedPrice,
		lineTotal: quotedPrice,
		addonNames: [],
		hsCode: inquiry.hsCode ?? undefined,
		countryOfOrigin: BUSINESS.defaultCountryOfOrigin,
		weightInGrams: inquiry.weightKg ? inquiry.weightKg * 1000 : undefined,
		dimensions: { width: inquiry.width, height: inquiry.height, depth: inquiry.length },
	};

	// referenceNumber is guaranteed set by the time this loads — the orchestration
	// service (mandap-document.service.ts) always claims it before calling this loader.
	const mappedOrder: DocumentOrder = {
		id: inquiry.id,
		orderNumber: inquiry.referenceNumber ?? inquiry.id,
		status: mapOrderStatus(inquiry),
		currency: BUSINESS.defaultCurrency.code,
		items: [item],
		subtotal: quotedPrice,
		shippingCost: 0,
		vatTotal: 0,
		discountTotal: 0,
		grandTotal: quotedPrice,
		placedAt: inquiry.createdAt,
	};

	const amountPaid = inquiry.amountPaid;
	const balanceDue = Math.max(0, quotedPrice - amountPaid);
	const latestPaidTransaction = inquiry.transactions[0];

	const payment: Payment = {
		provider: "stripe",
		paymentIntentId: latestPaidTransaction?.stripePaymentIntentId ?? null,
		status: mapPaymentStatus(inquiry),
		paidAt: latestPaidTransaction?.paidAt ?? null,
		amount: quotedPrice,
		amountPaid: amountPaid > 0 ? amountPaid : undefined,
		balanceDue: quotedPrice > 0 ? balanceDue : undefined,
		depositRequired: inquiry.depositAmount ?? undefined,
	};

	const taxes: Tax[] = [];
	const discounts: Discount[] = [];

	const hasPackageWeight = inquiry.weightKg != null && inquiry.weightKg > 0;

	const shipping: ShippingInformation = {
		method: null,
		isPickup: false,
		estimatedDelivery: "Confirmed once production is complete",
		address,
		shipment: hasPackageWeight
			? {
					shipmentNumber: `SHP-${inquiry.referenceNumber ?? inquiry.id}`,
					carrier: null,
					serviceName: null,
					trackingNumber: null,
					trackingUrl: null,
					packages: [
						{
							packageNumber: 1,
							weightInGrams: inquiry.weightKg! * 1000,
							contentsSummary: [inquiry.productName, inquiry.material].filter(Boolean).join(" — "),
						},
					],
					totalWeightInGrams: inquiry.weightKg! * 1000,
				}
			: null,
		incoterm: inquiry.incoterm ?? undefined,
	};

	return {
		business: BUSINESS,
		customer,
		order: mappedOrder,
		payment,
		taxes,
		discounts,
		shipping,
		returnInformation: RETURN_INFORMATION,
	};
}
