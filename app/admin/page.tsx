import { getDashboardData } from "@/lib/admin-dashboard";
import { KPICards } from "@/components/admin/dashboard/KpiCards";
import { OrderPipeline } from "@/components/admin/dashboard/OrderPipeline";
import { TopProducts } from "@/components/admin/dashboard/TopProducts";
import { RevenueChart } from "@/components/admin/dashboard/RevenueChart";
import { ActionCenter } from "@/components/admin/dashboard/ActionCenter";
import { ActivityFeed } from "@/components/admin/dashboard/ActivityFeed";
import { CountriesTable } from "@/components/admin/dashboard/CountriesTable";
import { QuickActions } from "@/components/admin/dashboard/QuickActions";
import { AdminPageHeader } from "@/components/admin/page-header";

export default async function AdminPage() {
	const data = await getDashboardData();

	return (
		<div className="space-y-6">
			<AdminPageHeader title="Dashboard" description="Your command center for store operations." />

			<KPICards kpis={data.kpis} />

			<div className="grid gap-6 lg:grid-cols-3">
				<div className="lg:col-span-2 space-y-6">
					<div className="grid gap-6 md:grid-cols-2">
						<OrderPipeline pipeline={data.orderPipeline} />
						<RevenueChart dailyRevenue={data.dailyRevenue} />
					</div>

					<TopProducts products={data.topProducts} />
					<CountriesTable countries={data.countries} />
				</div>

				<div className="space-y-6">
					<ActionCenter actions={data.actionItems} />
					<ActivityFeed activities={data.recentActivity} />
				</div>
			</div>

			<QuickActions />
		</div>
	);
}
