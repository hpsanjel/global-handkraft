import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_CUSTOM_REQUESTS_TOPIC } from "@/lib/realtime-topics";

/**
 * Publishes the current new/total custom-request counts to the admin
 * dashboard's live badge. Uses the service-role client so it bypasses RLS
 * and doesn't require the caller to hold a subscribed channel/socket -
 * `channel.send()` without a prior `subscribe()` goes out as a single HTTP
 * call, which is what makes this safe to call from a serverless route.
 */
export async function broadcastCustomRequestCount() {
	const [total, pending] = await Promise.all([prisma.mandapInquiry.count(), prisma.mandapInquiry.count({ where: { paymentStatus: "PENDING" } })]);

	const supabase = createAdminClient();
	await supabase.channel(ADMIN_CUSTOM_REQUESTS_TOPIC).send({
		type: "broadcast",
		event: "count",
		payload: { total, pending },
	});
}
