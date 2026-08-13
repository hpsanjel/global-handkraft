import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getRoleForEmail, withRoleInMetadata } from "@/lib/admin-auth";

/** Only ever redirect within our own site — a `next` value like "https://evil.com" or "//evil.com" must never be followed. */
function isSafeNextPath(path: string | null): path is string {
	return typeof path === "string" && path.startsWith("/") && !path.startsWith("//");
}

export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get("code");
	const nextParam = searchParams.get("next");
	const nextPath = isSafeNextPath(nextParam) ? nextParam : "/account";

	if (code) {
		const cookieStore = await cookies();

		const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value, options }) => {
						cookieStore.set(name, value, options);
					});
				},
			},
		});

		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (user?.email) {
				const role = getRoleForEmail(user.email);
				if (user.user_metadata?.role !== role) {
					await supabase.auth.updateUser({
						data: withRoleInMetadata(user.user_metadata, role),
					});
				}

				return NextResponse.redirect(`${origin}${role === "admin" ? "/admin" : nextPath}`);
			}
		}
	}

	return NextResponse.redirect(`${origin}${nextPath}`);
}
