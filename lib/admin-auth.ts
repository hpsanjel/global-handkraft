import type { User } from "@supabase/supabase-js";

type UserMetadata = Record<string, unknown>;

function parseAdminEmails(): Set<string> {
	const raw = process.env.ADMIN_EMAILS ?? "";

	return new Set(
		raw
			.split(/[\n,;\s]+/)
			.map((value) => value.trim().toLowerCase())
			.filter(Boolean),
	);
}

export function isAdminEmail(email?: string | null): boolean {
	if (!email) {
		return false;
	}

	return parseAdminEmails().has(email.trim().toLowerCase());
}

export function getRoleForEmail(email?: string | null): "admin" | "user" {
	return isAdminEmail(email) ? "admin" : "user";
}

export function hasAdminRole(user: Pick<User, "email" | "user_metadata"> | null | undefined): boolean {
	if (!user) {
		return false;
	}

	const metadataRole = (user.user_metadata as UserMetadata | undefined)?.role;
	if (metadataRole === "admin") {
		return true;
	}

	return isAdminEmail(user.email);
}

export function withRoleInMetadata(metadata: unknown, role: "admin" | "user"): UserMetadata {
	const safeMetadata = metadata && typeof metadata === "object" && !Array.isArray(metadata) ? (metadata as UserMetadata) : {};

	return {
		...safeMetadata,
		role,
	};
}
