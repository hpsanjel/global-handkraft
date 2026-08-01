import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for trusted, server-only privileged operations
 * (e.g. Storage writes in admin API routes) that must bypass Row Level Security.
 *
 * Never import this into client components or expose SUPABASE_SERVICE_ROLE_KEY
 * to the browser. Callers must independently verify the caller is an authorized
 * admin before using this client.
 */
export function createAdminClient() {
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!serviceRoleKey) {
		throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
	}

	return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}
