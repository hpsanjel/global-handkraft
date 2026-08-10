import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { hasAdminRole } from "@/lib/admin-auth";
import { SHIPPING_COUNTRY_CODES } from "@/lib/shipping-countries";

const DETECTED_COUNTRY_COOKIE = "detected_country";
const DETECTED_COUNTRY_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Vercel's edge sets x-vercel-ip-country per request; refreshing the cookie on every
// response (rather than once) keeps it accurate and avoids a stale 30-day-old value.
function withDetectedCountry(res: NextResponse, geoCountry: string | undefined) {
	if (geoCountry && SHIPPING_COUNTRY_CODES.includes(geoCountry)) {
		res.cookies.set(DETECTED_COUNTRY_COOKIE, geoCountry, {
			path: "/",
			maxAge: DETECTED_COUNTRY_COOKIE_MAX_AGE,
			sameSite: "lax",
		});
	}
	return res;
}

export async function proxy(request: NextRequest) {
	let response = NextResponse.next();
	const pathname = request.nextUrl.pathname;
	const isAdminPath = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
	const geoCountry = request.headers.get("x-vercel-ip-country")?.toUpperCase();

	const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
		cookies: {
			getAll() {
				return request.cookies.getAll();
			},
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
				response = NextResponse.next();
				cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
			},
		},
	});

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (isAdminPath && !user) {
		if (pathname.startsWith("/api/admin")) {
			return withDetectedCountry(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), geoCountry);
		}

		const redirectUrl = request.nextUrl.clone();
		redirectUrl.pathname = "/login";
		redirectUrl.searchParams.set("next", pathname);

		return withDetectedCountry(NextResponse.redirect(redirectUrl), geoCountry);
	}

	if (isAdminPath && user && !hasAdminRole(user)) {
		if (pathname.startsWith("/api/admin")) {
			return withDetectedCountry(NextResponse.json({ error: "Forbidden" }, { status: 403 }), geoCountry);
		}

		const redirectUrl = request.nextUrl.clone();
		redirectUrl.pathname = "/account";

		return withDetectedCountry(NextResponse.redirect(redirectUrl), geoCountry);
	}

	return withDetectedCountry(response, geoCountry);
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
