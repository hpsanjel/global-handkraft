"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updatePassword(currentPassword: string, newPassword: string) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return { error: "Unauthorized" };
		}

		// Verify current password by attempting to sign in
		const { error: signInError } = await supabase.auth.signInWithPassword({
			email: user.email!,
			password: currentPassword,
		});

		if (signInError) {
			return { error: "Current password is incorrect" };
		}

		// Update to new password
		const { error } = await supabase.auth.updateUser({
			password: newPassword,
		});

		if (error) {
			return { error: error.message };
		}

		revalidatePath("/account/profile");
		return { success: true };
	} catch (error) {
		return { error: error instanceof Error ? error.message : "Failed to update password" };
	}
}

export async function updateProfile(data: {
	firstName?: string;
	lastName?: string;
	phone?: string;
	shippingAddress?: {
		fullName: string;
		phone: string;
		email: string;
		country: string;
		address: string;
		postalCode: string;
		city: string;
		companyName?: string;
		vatNumber?: string;
		notes?: string;
	};
}) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return { error: "Unauthorized" };
		}

		// Build user metadata update
		const metadata: Record<string, unknown> = {};

		if (data.firstName !== undefined) metadata.first_name = data.firstName;
		if (data.lastName !== undefined) metadata.last_name = data.lastName;
		if (data.phone !== undefined) metadata.phone = data.phone;
		if (data.shippingAddress !== undefined) metadata.shipping_address = data.shippingAddress;

		const { error } = await supabase.auth.updateUser({
			data: metadata,
		});

		if (error) {
			return { error: error.message };
		}

		revalidatePath("/account/profile");
		return { success: true };
	} catch (error) {
		return { error: error instanceof Error ? error.message : "Failed to update profile" };
	}
}

export async function signOut() {
	try {
		const supabase = await createClient();
		await supabase.auth.signOut();
		revalidatePath("/", "layout");
		redirect("/");
	} catch (error) {
		return { error: error instanceof Error ? error.message : "Failed to sign out" };
	}
}
