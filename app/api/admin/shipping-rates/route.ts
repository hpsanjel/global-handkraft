import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasAdminRole } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { getShippingConfig, saveShippingConfig, type ShippingConfig } from "@/lib/shipping-config";

async function requireAdmin() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	if (!hasAdminRole(user)) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	return null;
}

async function getProductsShippingSummary() {
	const products = await prisma.product.findMany({
		include: {
			category: true,
			variants: {
				select: {
					id: true,
					price: true,
				},
			},
		},
		orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
	});

	return products.map((product) => {
		const prices = product.variants.map((v) => v.price);
		const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
		const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
		const isCustom = product.shippingNorway !== null || product.shippingInternational !== null || product.freeShippingExcluded;

		return {
			id: product.id,
			name: product.name,
			slug: product.slug,
			image: product.image,
			category: product.category.name,
			active: product.active,
			minPrice,
			maxPrice,
			shippingNorway: product.shippingNorway,
			shippingInternational: product.shippingInternational,
			freeShippingExcluded: product.freeShippingExcluded,
			isCustom,
		};
	});
}

export async function GET() {
	try {
		const adminError = await requireAdmin();
		if (adminError) return adminError;

		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		const [config, products] = await Promise.all([getShippingConfig(), getProductsShippingSummary()]);

		return NextResponse.json({
			config,
			products,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to load shipping rates.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const adminError = await requireAdmin();
		if (adminError) return adminError;

		if (!process.env.DATABASE_URL) {
			return NextResponse.json({ error: "Database not configured yet." }, { status: 503 });
		}

		const body = await request.json();
		const action = body.action || (body.config ? "update-defaults" : body.productId ? "update-product" : null);

		if (action === "update-defaults") {
			const configPayload = body.config as Partial<ShippingConfig> | undefined;
			if (!configPayload) {
				return NextResponse.json({ error: "Shipping configuration is required." }, { status: 400 });
			}

			const norwayRate = Number(configPayload.norwayRate);
			const internationalRate = Number(configPayload.internationalRate);
			const freeShippingThreshold = Number(configPayload.freeShippingThreshold);

			if (!Number.isFinite(norwayRate) || norwayRate < 0) {
				return NextResponse.json({ error: "Norway shipping fee must be a non-negative number." }, { status: 400 });
			}
			if (!Number.isFinite(internationalRate) || internationalRate < 0) {
				return NextResponse.json({ error: "International shipping fee must be a non-negative number." }, { status: 400 });
			}
			if (!Number.isFinite(freeShippingThreshold) || freeShippingThreshold < 0) {
				return NextResponse.json({ error: "Free shipping threshold must be a non-negative number." }, { status: 400 });
			}

			const updatedConfig = await saveShippingConfig({
				norwayRate,
				internationalRate,
				freeShippingThreshold,
			});

			const products = await getProductsShippingSummary();
			return NextResponse.json({
				success: true,
				message: "Default shipping rates updated successfully.",
				config: updatedConfig,
				products,
			});
		}

		if (action === "update-product") {
			const { productId, shippingNorway, shippingInternational, freeShippingExcluded } = body;
			if (!productId) {
				return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
			}

			const parsedNorway =
				shippingNorway === null || shippingNorway === undefined || shippingNorway === ""
					? null
					: Number(shippingNorway);
			const parsedIntl =
				shippingInternational === null || shippingInternational === undefined || shippingInternational === ""
					? null
					: Number(shippingInternational);

			if (parsedNorway !== null && (!Number.isFinite(parsedNorway) || parsedNorway < 0)) {
				return NextResponse.json({ error: "Norway shipping fee must be a valid non-negative number or empty." }, { status: 400 });
			}
			if (parsedIntl !== null && (!Number.isFinite(parsedIntl) || parsedIntl < 0)) {
				return NextResponse.json({ error: "International shipping fee must be a valid non-negative number or empty." }, { status: 400 });
			}

			await prisma.product.update({
				where: { id: productId },
				data: {
					shippingNorway: parsedNorway,
					shippingInternational: parsedIntl,
					freeShippingExcluded: Boolean(freeShippingExcluded),
				},
			});

			const [config, products] = await Promise.all([getShippingConfig(), getProductsShippingSummary()]);
			return NextResponse.json({
				success: true,
				message: "Product shipping rate updated successfully.",
				config,
				products,
			});
		}

		if (action === "reset-product") {
			const { productId } = body;
			if (!productId) {
				return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
			}

			await prisma.product.update({
				where: { id: productId },
				data: {
					shippingNorway: null,
					shippingInternational: null,
					freeShippingExcluded: false,
				},
			});

			const [config, products] = await Promise.all([getShippingConfig(), getProductsShippingSummary()]);
			return NextResponse.json({
				success: true,
				message: "Product reset to default store rates.",
				config,
				products,
			});
		}

		return NextResponse.json({ error: "Invalid action." }, { status: 400 });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to save shipping rates.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

