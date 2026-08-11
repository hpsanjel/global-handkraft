import { Inbox, Clock, CheckCircle2, Wallet } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminStatCard } from "@/components/admin/stat-card";
import { getMandapInquiries } from "@/lib/admin";
import { CustomRequestsView } from "./CustomRequestsView";

export default async function AdminCustomRequestsPage() {
	const inquiries = await getMandapInquiries(50);

	const pending = inquiries.filter((inquiry) => inquiry.paymentStatus === "PENDING").length;
	const accepted = inquiries.filter((inquiry) => inquiry.paymentStatus === "ACCEPTED").length;
	const paid = inquiries.filter((inquiry) => inquiry.paymentStatus === "PAID").length;

	return (
		<div className="space-y-6">
			<AdminPageHeader title="Custom Orders" description="Custom mandap & temple requests submitted from product pages." />

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<AdminStatCard label="Total requests" value={inquiries.length.toString()} icon={Inbox} tone="neutral" />
				<AdminStatCard label="Pending response" value={pending.toString()} icon={Clock} tone="orange" />
				<AdminStatCard label="Accepted" value={accepted.toString()} icon={CheckCircle2} tone="green" />
				<AdminStatCard label="Paid" value={paid.toString()} icon={Wallet} tone="blue" />
			</div>

			<CustomRequestsView inquiries={inquiries} />
		</div>
	);
}
