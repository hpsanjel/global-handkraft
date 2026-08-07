import { z } from "zod";
import { isCurrencyCode } from "./currency";

const currencyCodeSchema = z.string().refine(isCurrencyCode, { message: "Unsupported currency code" });

const businessAddressSchema = z.object({
	line1: z.string().min(1),
	line2: z.string().optional(),
	city: z.string().min(1),
	postalCode: z.string().min(1),
	country: z.string().min(1),
	countryCode: z.string().length(2),
});

const sellerSchema = z.object({
	legalName: z.string().min(1),
	tradingName: z.string().min(1),
	organisationNumber: z.string().min(1),
	vatNumber: z.string().optional(),
	address: businessAddressSchema,
	email: z.string().min(1),
	supportEmail: z.string().min(1),
	supportPhone: z.string().min(1),
	website: z.string().min(1),
	logoUrl: z.string().optional(),
});

const businessSchema = z.object({
	seller: sellerSchema,
	bankDetails: z
		.object({
			accountNumber: z.string().optional(),
			iban: z.string().optional(),
			bic: z.string().optional(),
		})
		.optional(),
	returnAddress: businessAddressSchema,
	defaultCountryOfOrigin: z.string().length(2),
	defaultCurrency: z.object({
		code: currencyCodeSchema,
		symbol: z.string(),
		decimalDigits: z.number().int().nonnegative(),
	}),
	defaultIncoterm: z.string().optional(),
});

const addressSchema = z.object({
	fullName: z.string().min(1),
	companyName: z.string().optional(),
	phone: z.string(),
	email: z.string(),
	line1: z.string().min(1),
	line2: z.string().optional(),
	city: z.string().min(1),
	postalCode: z.string().min(1),
	country: z.string().min(1),
	countryCode: z.string(),
	vatNumber: z.string().optional(),
	notes: z.string().optional(),
});

const customerSchema = z.object({
	id: z.string().min(1),
	fullName: z.string().min(1),
	email: z.string(),
	phone: z.string(),
	billingAddress: addressSchema,
	shippingAddress: addressSchema,
});

const orderItemSchema = z.object({
	sku: z.string().min(1),
	productName: z.string().min(1),
	variantName: z.string(),
	description: z.string(),
	quantity: z.number().int().positive(),
	unitPrice: z.number().nonnegative(),
	lineTotal: z.number().nonnegative(),
	addonNames: z.array(z.string()),
	hsCode: z.string().optional(),
	countryOfOrigin: z.string().length(2).optional(),
	weightInGrams: z.number().positive().optional(),
	dimensions: z
		.object({
			width: z.string(),
			height: z.string(),
			depth: z.string(),
		})
		.optional(),
});

const orderSchema = z.object({
	id: z.string().min(1),
	orderNumber: z.string().min(1),
	status: z.enum(["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
	currency: currencyCodeSchema,
	items: z.array(orderItemSchema).min(1, "An order document requires at least one item"),
	subtotal: z.number().nonnegative(),
	shippingCost: z.number().nonnegative(),
	vatTotal: z.number().nonnegative(),
	discountTotal: z.number().nonnegative(),
	grandTotal: z.number().nonnegative(),
	placedAt: z.date(),
});

const paymentSchema = z.object({
	provider: z.literal("stripe"),
	paymentIntentId: z.string().nullable(),
	method: z.string().optional(),
	status: z.enum(["PENDING", "PAID", "REFUNDED", "PARTIALLY_REFUNDED", "FAILED"]),
	paidAt: z.date().nullable(),
	amount: z.number().nonnegative(),
});

const taxSchema = z.object({
	label: z.string().min(1),
	rate: z.number().nonnegative(),
	amount: z.number().nonnegative(),
});

const discountSchema = z.object({
	code: z.string().optional(),
	description: z.string().min(1),
	type: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
	amount: z.number().nonnegative(),
});

const packageSchema = z.object({
	packageNumber: z.number().int().positive(),
	weightInGrams: z.number().positive(),
	lengthCm: z.number().positive().optional(),
	widthCm: z.number().positive().optional(),
	heightCm: z.number().positive().optional(),
	contentsSummary: z.string().optional(),
});

const shipmentSchema = z.object({
	shipmentNumber: z.string().min(1),
	carrier: z.enum(["BRING", "POSTNORD", "DHL", "UPS", "FEDEX", "OTHER"]).nullable(),
	serviceName: z.string().nullable(),
	trackingNumber: z.string().nullable(),
	trackingUrl: z.string().nullable(),
	packages: z.array(packageSchema),
	totalWeightInGrams: z.number().nonnegative(),
});

const shippingInformationSchema = z.object({
	method: z.string().nullable(),
	estimatedDelivery: z.string().nullable(),
	address: addressSchema,
	shipment: shipmentSchema.nullable(),
});

const returnInformationSchema = z.object({
	returnAddress: businessAddressSchema,
	returnWindowDays: z.number().int().positive(),
	instructions: z.array(z.string()),
	policySummary: z.string().min(1),
	supportEmail: z.string().min(1),
	supportPhone: z.string().min(1),
	website: z.string().min(1),
});

const documentMetadataSchema = z.object({
	documentNumber: z.string().min(1),
	type: z.enum(["COMMERCIAL_INVOICE", "PACKING_LIST", "RECEIPT", "CUSTOMS_INVOICE", "RETURN_CARD", "SHIPPING_SUMMARY", "ORDER_SUMMARY", "GIFT_RECEIPT"]),
	issuedAt: z.date(),
});

export const orderDocumentDataSchema = z.object({
	business: businessSchema,
	customer: customerSchema,
	order: orderSchema,
	payment: paymentSchema,
	taxes: z.array(taxSchema),
	discounts: z.array(discountSchema),
	shipping: shippingInformationSchema,
	returnInformation: returnInformationSchema,
	metadata: documentMetadataSchema,
});

export class DocumentValidationError extends Error {
	constructor(public readonly issues: z.ZodIssue[]) {
		super(`Order document data failed validation: ${issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`);
		this.name = "DocumentValidationError";
	}
}

export function assertValidOrderDocumentData(data: unknown): void {
	const result = orderDocumentDataSchema.safeParse(data);
	if (!result.success) {
		throw new DocumentValidationError(result.error.issues);
	}
}
