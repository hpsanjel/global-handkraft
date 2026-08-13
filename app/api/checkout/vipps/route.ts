import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { priceCheckoutItems, type CheckoutItem } from "@/lib/checkout-pricing";
import { getShippingQuotes, type SavedShippingAddress } from "@/lib/checkout-shipping";
import { resolveCoupon } from "@/lib/checkout-coupon";
import { createVippsPayment } from "@/lib/vipps";

export const runtime = "nodejs";

const REQUIRED_VIPPS_ENV_VARS = ["VIPPS_CLIENT_ID", "VIPPS_CLIENT_SECRET", "VIPPS_SUBSCRIPTION_KEY", "VIPPS_MERCHANT_SERIAL_NUMBER"];

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as {
			items?: CheckoutItem[];
			customerEmail?: string;
			shippingAddress?: SavedShippingAddress;
			selectedShippingId?: string | null;
			couponCode?: string;
		};
		const items = body.items;

		if (!items?.length) {
			return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
		}

		if (REQUIRED_VIPPS_ENV_VARS.some((key) => !process.env[key])) {
			return NextResponse.json({ error: "Vipps is not configured yet." }, { status: 500 });
		}

		const countryCode = body.shippingAddress?.country;
		const pricedItems = await priceCheckoutItems(items, countryCode);
		const subtotal = pricedItems.reduce((sum, item) => sum + item.lineSubtotal, 0);

		const resolvedCoupon = await resolveCoupon(body.couponCode, subtotal);
		const hasFreeShippingCoupon = resolvedCoupon?.freeShipping ?? false;
		// Vipps has no native coupon-object concept the way Stripe does — the
		// discount is just subtracted straight from the charged amount below.
		const discountAmount = resolvedCoupon && resolvedCoupon.discountPct > 0 ? subtotal * (resolvedCoupon.discountPct / 100) : 0;

		// Vipps' WEB_REDIRECT flow has no hosted "choose your shipping option"
		// screen the way Stripe Checkout does — the buyer only approves a fixed
		// amount, so the shipping method must already be locked in from the cart.
		const shippingQuotes = await getShippingQuotes(body.shippingAddress, pricedItems, subtotal, body.selectedShippingId, hasFreeShippingCoupon);
		const chosenQuote = shippingQuotes.find((quote) => quote.id === body.selectedShippingId) ?? shippingQuotes[0];
		const shippingCents = chosenQuote?.amountCents ?? 0;

		const subtotalCents = Math.round(subtotal * 100);
		const totalCents = Math.max(0, subtotalCents - Math.round(discountAmount * 100)) + shippingCents;

		// Re-fetch addon names (priceCheckoutItems only returns addonIds) — the
		// PendingCheckout snapshot and later the confirmation email/receipt need
		// the display names, same as the Stripe webhook does today.
		const itemsWithAddonNames = await Promise.all(
			pricedItems.map(async (item) => {
				const addons = item.addonIds.length ? await prisma.addon.findMany({ where: { id: { in: item.addonIds }, productId: item.productId } }) : [];
				return {
					productId: item.productId,
					variantId: item.variantId,
					quantity: item.quantity,
					unitPrice: item.unitAmountCents / 100 - item.zoneMarkup,
					zoneMarkup: item.zoneMarkup,
					addonNames: addons.map((addon) => addon.name),
					name: item.productName,
					variantName: item.variantName,
					// Not consumed by fulfillOrder — carried through purely so the
					// Vipps return page can render product thumbnails, the way the
					// Stripe success page does from its line items' metadata.image.
					image: item.image,
				};
			}),
		);

		const orderNumber = `ORD-${randomUUID().split("-")[0].toUpperCase()}`;
		const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

		await prisma.pendingCheckout.create({
			data: {
				reference: orderNumber,
				provider: "VIPPS",
				itemsJson: itemsWithAddonNames,
				customerEmail: body.customerEmail ?? "",
				customerName: body.shippingAddress?.fullName ?? null,
				customerPhone: body.shippingAddress?.phone ?? null,
				shippingCountry: body.shippingAddress?.country ?? "",
				shippingAddress: body.shippingAddress?.address ?? "",
				shippingPostalCode: body.shippingAddress?.postalCode ?? "",
				shippingCity: body.shippingAddress?.city ?? "",
				shippingMethod: chosenQuote?.displayName ?? null,
				shippingProductId: chosenQuote?.id ?? null,
				subtotal,
				shipping: shippingCents / 100,
				total: totalCents / 100,
				currency: "NOK",
				couponCode: resolvedCoupon?.code ?? null,
			},
		});

		const { redirectUrl } = await createVippsPayment({
			reference: orderNumber,
			amountValueOre: totalCents,
			returnUrl: `${origin}/checkout/vipps/return?reference=${orderNumber}`,
			paymentDescription: `Global Handcrafts order ${orderNumber}`,
			metadata: { orderNumber },
		});

		return NextResponse.json({ url: redirectUrl });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to start checkout.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
