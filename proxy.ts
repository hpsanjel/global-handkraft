import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { hasAdminRole } from "@/lib/admin-auth";

export async function proxy(request: NextRequest) {
	let response = NextResponse.next();
	const pathname = request.nextUrl.pathname;
	const isAdminPath = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

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
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const redirectUrl = request.nextUrl.clone();
		redirectUrl.pathname = "/login";
		redirectUrl.searchParams.set("next", pathname);

		return NextResponse.redirect(redirectUrl);
	}

	if (isAdminPath && user && !hasAdminRole(user)) {
		if (pathname.startsWith("/api/admin")) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const redirectUrl = request.nextUrl.clone();
		redirectUrl.pathname = "/account";

		return NextResponse.redirect(redirectUrl);
	}

	return response;
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
