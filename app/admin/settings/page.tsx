import { AdminShippingSettings } from "@/components/admin-shipping-settings";
import { AdminPageHeader } from "@/components/admin/page-header";

export default function AdminSettingsPage() {
	return (
		<div className="space-y-6">
			<AdminPageHeader title="Settings" description="Configure shipping zones and delivery rates." />
			<AdminShippingSettings />
		</div>
	);
}
