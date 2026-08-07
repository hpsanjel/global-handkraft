import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendAccountDeletionRequestEmail } from "@/lib/email";

export async function POST() {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user?.email) {
			return NextResponse.json({ error: "You must be signed in to request account deletion." }, { status: 401 });
		}

		await sendAccountDeletionRequestEmail({
			userId: user.id,
			email: user.email,
			fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unable to submit your deletion request.";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
