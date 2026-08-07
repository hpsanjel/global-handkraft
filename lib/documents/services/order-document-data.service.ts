import { prisma } from "@/lib/prisma";
import { isOrderStatus } from "@/lib/order-status";
import { buildPackagesFromLines, parseMeasurement, STORE_PICKUP_ID } from "@/lib/shipping-client";
import { SHIPPING_COUNTRIES } from "@/lib/shipping-countries";
import { BUSINESS } from "../business-config";
import { isCurrencyCode } from "../utils/currency";
import type { Address, Customer, Discount, OrderDocumentData, OrderItem, Payment, PaymentStatus, ReturnInformation, ShippingInformation, Order as DocumentOrder, OrderStatus as DocumentOrderStatus, Tax } from "../types";

export class OrderNotFoundError extends Error {
	constructor(orderId: string) {
		super(`Order not found: ${orderId}`);
		this.name = "OrderNotFoundError";
	}
}

/**
 * This app currently stores one Address per order (used for both billing and
 * shipping) and has no separate Customer model — the Address row IS the
 * customer record for the order. billingAddress/shippingAddress are kept as
 * distinct fields on the canonical Customer type for forward-compatibility,
 * but both point at the same source row today.
 */
function resolveCountryName(countryCode: string): string {
	return SHIPPING_COUNTRIES.find((country) => country.code === countryCode)?.name ?? countryCode;
}

type PrismaOrderAddress = {
	fullName: string;
	companyName: string | null;
	phone: string;
	email: string;
	address: string;
	city: string;
	postalCode: string;
	country: string;
	vatNumber: string | null;
	notes: string | null;
};

function mapAddress(address: PrismaOrderAddress): Address {
	return {
		fullName: address.fullName,
		companyName: address.companyName ?? undefined,
		phone: address.phone,
		email: address.email,
		line1: address.address,
		city: address.city,
		postalCode: address.postalCode,
		country: resolveCountryName(address.country),
		countryCode: address.country,
		vatNumber: address.vatNumber ?? undefined,
		notes: address.notes ?? undefined,
	};
}

function mapPaymentStatus(orderStatus: string): PaymentStatus {
	if (orderStatus === "REFUNDED") return "REFUNDED";
	if (orderStatus === "CANCELLED") return "FAILED";
	if (orderStatus === "PENDING") return "PENDING";
	return "PAID";
}

const RETURN_INFORMATION: ReturnInformation = {
	policySummary: "All sales are final. We do not accept returns or exchanges for change of mind. If your order arrives damaged, defective, or incorrect, contact our support team with your order number and photos of the issue and we'll make it right.",
	supportEmail: BUSINESS.seller.supportEmail,
	supportPhone: BUSINESS.seller.supportPhone,
	website: BUSINESS.seller.website,
};

export type OrderDocumentDataWithoutMetadata = Omit<OrderDocumentData, "metadata">;

/**
 * Fetches an order and maps it into the canonical document data shape.
 * This is the ONLY place in the document module that queries Prisma —
 * every builder/template downstream works exclusively with these types.
 */
export async function loadOrderDocumentData(orderId: string): Promise<OrderDocumentDataWithoutMetadata> {
	const order = await prisma.order.findUnique({
		where: { id: orderId },
		include: {
			address: true,
			items: { include: { product: true, variant: true } },
		},
	});

	if (!order) {
		throw new OrderNotFoundError(orderId);
	}

	const currency = isCurrencyCode(order.currency) ? order.currency : BUSINESS.defaultCurrency.code;
	const address = mapAddress(order.address);

	const customer: Customer = {
		id: order.address.id,
		fullName: order.address.fullName || "Guest customer",
		email: order.address.email,
		phone: order.address.phone,
		billingAddress: address,
		shippingAddress: address,
	};

	const items: OrderItem[] = order.items.map((item) => {
		const weightKg = parseMeasurement(item.variant.weight);
		return {
			sku: item.variant.sku,
			productName: item.product.name,
			variantName: item.variant.name,
			description: item.product.shortDescription,
			quantity: item.quantity,
			unitPrice: item.unitPrice,
			lineTotal: item.unitPrice * item.quantity,
			addonNames: item.addonNames,
			// No per-product hsCode column exists in the schema yet, so it's left
			// undefined (renders as "—") rather than guessed — a wrong customs code
			// is worse than a missing one. countryOfOrigin falls back to the
			// business default since it isn't tracked per product either.
			countryOfOrigin: BUSINESS.defaultCountryOfOrigin,
			// Mirrors the same weight floor buildPackagesFromLines uses below, so the
			// item table and the package/shipment weights never disagree.
			weightInGrams: Math.max(weightKg !== null ? weightKg * 1000 : 500, 200),
			dimensions: { width: item.variant.width, height: item.variant.height, depth: item.variant.depth },
		};
	});

	// Order.vat is never populated by the current checkout flow (always the schema
	// default of 0) — Stripe handles tax without persisting a breakdown to this
	// app's DB yet. discountTotal likewise isn't stored directly; it's recovered
	// from the totals Stripe already gave us at checkout (subtotal + shipping +
	// vat - total). Neither the discount CODE nor a per-line tax rate survives
	// today, since Order has no couponCode/discount fields — see the note in the
	// architecture writeup recommending that as a future schema addition.
	const discountTotal = Math.max(0, order.subtotal + order.shipping + (order.vat ?? 0) - order.total);

	const mappedOrder: DocumentOrder = {
		id: order.id,
		orderNumber: order.orderNumber,
		status: isOrderStatus(order.status) ? (order.status as DocumentOrderStatus) : "PENDING",
		currency,
		items,
		subtotal: order.subtotal,
		shippingCost: order.shipping,
		vatTotal: order.vat ?? 0,
		discountTotal,
		grandTotal: order.total,
		placedAt: order.createdAt,
	};

	const payment: Payment = {
		provider: "stripe",
		paymentIntentId: order.paymentId,
		status: mapPaymentStatus(order.status),
		// The order row is only ever created by the Stripe webhook at the moment
		// payment succeeds, so createdAt doubles as the paid timestamp — there's
		// no separate "paidAt" column to read.
		paidAt: order.paymentId ? order.createdAt : null,
		amount: order.total,
	};

	const taxes: Tax[] = order.vat && order.vat > 0 ? [{ label: "VAT", rate: order.subtotal > 0 ? order.vat / order.subtotal : 0, amount: order.vat }] : [];

	const discounts: Discount[] = discountTotal > 0 ? [{ description: "Discount applied at checkout", type: "FIXED", amount: discountTotal }] : [];

	const isPickup = order.shippingProductId === STORE_PICKUP_ID;

	// Built in the same order (order.items, then one entry per unit of quantity)
	// as buildPackagesFromLines below, so packageContents[i] describes packages[i].
	const packageContents = order.items.flatMap((item) => {
		const label = [item.product.name, item.variant.name].filter(Boolean).join(" — ");
		return Array<string>(Math.max(1, Math.round(item.quantity))).fill(label);
	});
	const packageInputs = isPickup ? [] : buildPackagesFromLines(order.items.map((item) => ({ weight: item.variant.weight, width: item.variant.width, height: item.variant.height, depth: item.variant.depth, quantity: item.quantity })));
	const packages = packageInputs.map((pkg, index) => ({
		packageNumber: index + 1,
		weightInGrams: pkg.weightInGrams,
		lengthCm: pkg.length,
		widthCm: pkg.width,
		heightCm: pkg.height,
		contentsSummary: packageContents[index],
	}));
	const totalWeightInGrams = packages.reduce((sum, pkg) => sum + pkg.weightInGrams, 0);

	const shipping: ShippingInformation = {
		method: order.shippingMethod,
		isPickup,
		estimatedDelivery: isPickup ? "Ready for pickup" : "3-10 business days",
		address,
		shipment:
			packages.length > 0
				? {
						shipmentNumber: `SHP-${order.orderNumber}`,
						carrier: isPickup ? null : order.shippingProductId ? "BRING" : null,
						serviceName: order.shippingMethod,
						// Not tracked in the current schema — populate once a carrier
						// tracking webhook (Bring) is wired up to persist this.
						trackingNumber: null,
						trackingUrl: null,
						packages,
						totalWeightInGrams,
					}
				: null,
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
