import { Wallet, Clock, Landmark, Building2, AlertTriangle } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminStatCard } from "@/components/admin/stat-card";
import { getStripeOverview } from "@/lib/stripe-admin";

function formatMoney(amountInMinorUnits: number, currency: string) {
	return new Intl.NumberFormat("en-GB", {
		style: "currency",
		currency: currency || "NOK",
		maximumFractionDigits: 2,
	}).format(amountInMinorUnits / 100);
}

function formatDate(iso: string) {
	return new Date(iso).toLocaleString("en-GB", {
		day: "numeric",
		month: "short",
		hour: "numeric",
		minute: "2-digit",
	});
}

function sumByFirstCurrency(entries: { amount: number; currency: string }[]) {
	if (entries.length === 0) return { amount: 0, currency: "NOK" };
	return entries[0];
}

const TRANSACTION_STATUS_STYLES: Record<string, string> = {
	available: "bg-emerald-50 text-emerald-700",
	pending: "bg-amber-50 text-amber-700",
};

const PAYOUT_STATUS_STYLES: Record<string, string> = {
	paid: "bg-emerald-50 text-emerald-700",
	pending: "bg-amber-50 text-amber-700",
	in_transit: "bg-sky-50 text-sky-700",
	canceled: "bg-red-50 text-red-700",
	failed: "bg-red-50 text-red-700",
};

function StatusPill({ status, styles }: { status: string; styles: Record<string, string> }) {
	const style = styles[status] ?? "bg-slate-100 text-slate-600";
	return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${style}`}>{status.replace(/_/g, " ")}</span>;
}

function SectionError({ message }: { message: string }) {
	return (
		<div className="flex items-start gap-2 p-6 text-sm text-slate-500">
			<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
			<p>{message}</p>
		</div>
	);
}

export default async function AdminStripePage() {
	const overview = await getStripeOverview();

	if (!overview.configured) {
		return (
			<div className="space-y-6">
				<AdminPageHeader title="Stripe" description="Balances, payouts and transactions from your Stripe account." />
				<div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">Stripe is not configured. Set STRIPE_SECRET_KEY to see live account data here.</div>
			</div>
		);
	}

	const available = sumByFirstCurrency(overview.available);
	const pending = sumByFirstCurrency(overview.pending);

	return (
		<div className="space-y-6">
			<AdminPageHeader title="Stripe" description="Live balances, payouts and transactions — no need to log into the Stripe Dashboard." actions={<a href="https://dashboard.stripe.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Open Stripe Dashboard</a>} />

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<AdminStatCard label="Available balance" value={formatMoney(available.amount, available.currency)} icon={Wallet} tone="green" hint="Ready to pay out" />
				<AdminStatCard label="Pending balance" value={formatMoney(pending.amount, pending.currency)} icon={Clock} tone="orange" hint="Still clearing" />
				<AdminStatCard label="Charges enabled" value={overview.account ? (overview.account.chargesEnabled ? "Yes" : "No") : "—"} icon={Landmark} tone={overview.account?.chargesEnabled ? "blue" : "neutral"} />
				<AdminStatCard label="Payouts enabled" value={overview.account ? (overview.account.payoutsEnabled ? "Yes" : "No") : "—"} icon={Building2} tone={overview.account?.payoutsEnabled ? "blue" : "neutral"} />
			</div>

			<div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
				<div className="border-b border-slate-100 px-6 py-4">
					<h2 className="text-base font-semibold text-slate-900">Business info</h2>
					<p className="mt-0.5 text-sm text-slate-500">From your Stripe account settings.</p>
				</div>
				{overview.errors.account ? (
					<SectionError message={overview.errors.account} />
				) : overview.account ? (
					<div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
						<div>
							<p className="text-xs font-medium uppercase tracking-wide text-slate-500">Business name</p>
							<p className="mt-1 text-sm text-slate-900">{overview.account.businessName ?? "Not set"}</p>
						</div>
						<div>
							<p className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</p>
							<p className="mt-1 text-sm text-slate-900">{overview.account.email ?? "Not set"}</p>
						</div>
						<div>
							<p className="text-xs font-medium uppercase tracking-wide text-slate-500">Country</p>
							<p className="mt-1 text-sm text-slate-900">{overview.account.country ?? "Not set"}</p>
						</div>
						<div>
							<p className="text-xs font-medium uppercase tracking-wide text-slate-500">Default currency</p>
							<p className="mt-1 text-sm uppercase text-slate-900">{overview.account.defaultCurrency ?? "Not set"}</p>
						</div>
					</div>
				) : null}
			</div>

			<div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
				<div className="border-b border-slate-100 px-6 py-4">
					<h2 className="text-base font-semibold text-slate-900">Recent payouts</h2>
					<p className="mt-0.5 text-sm text-slate-500">Transfers from your Stripe balance to your bank account.</p>
				</div>
				{overview.errors.payouts ? (
					<SectionError message={overview.errors.payouts} />
				) : overview.payouts.length > 0 ? (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
									<th scope="col" className="px-6 py-3 font-semibold">Amount</th>
									<th scope="col" className="px-6 py-3 font-semibold">Method</th>
									<th scope="col" className="px-6 py-3 font-semibold">Status</th>
									<th scope="col" className="px-6 py-3 font-semibold">Arrival</th>
									<th scope="col" className="px-6 py-3 font-semibold">Created</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{overview.payouts.map((payout) => (
									<tr key={payout.id}>
										<td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-900">{formatMoney(payout.amount, payout.currency)}</td>
										<td className="px-6 py-4 capitalize text-slate-600">{payout.method}</td>
										<td className="px-6 py-4"><StatusPill status={payout.status} styles={PAYOUT_STATUS_STYLES} /></td>
										<td className="whitespace-nowrap px-6 py-4 text-slate-600">{formatDate(payout.arrivalDate)}</td>
										<td className="whitespace-nowrap px-6 py-4 text-slate-600">{formatDate(payout.createdAt)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className="p-12 text-center text-sm text-slate-500">No payouts yet.</div>
				)}
			</div>

			<div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
				<div className="border-b border-slate-100 px-6 py-4">
					<h2 className="text-base font-semibold text-slate-900">Recent transactions</h2>
					<p className="mt-0.5 text-sm text-slate-500">Charges, refunds and fees moving through your balance.</p>
				</div>
				{overview.errors.transactions ? (
					<SectionError message={overview.errors.transactions} />
				) : overview.transactions.length > 0 ? (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
									<th scope="col" className="px-6 py-3 font-semibold">Description</th>
									<th scope="col" className="px-6 py-3 font-semibold">Type</th>
									<th scope="col" className="px-6 py-3 text-right font-semibold">Amount</th>
									<th scope="col" className="px-6 py-3 text-right font-semibold">Fee</th>
									<th scope="col" className="px-6 py-3 text-right font-semibold">Net</th>
									<th scope="col" className="px-6 py-3 font-semibold">Status</th>
									<th scope="col" className="px-6 py-3 font-semibold">Date</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{overview.transactions.map((tx) => (
									<tr key={tx.id}>
										<td className="px-6 py-4 text-slate-900">{tx.description ?? "—"}</td>
										<td className="px-6 py-4 capitalize text-slate-600">{tx.type.replace(/_/g, " ")}</td>
										<td className="whitespace-nowrap px-6 py-4 text-right font-semibold text-slate-900">{formatMoney(tx.amount, tx.currency)}</td>
										<td className="whitespace-nowrap px-6 py-4 text-right text-slate-600">{formatMoney(tx.fee, tx.currency)}</td>
										<td className="whitespace-nowrap px-6 py-4 text-right text-slate-600">{formatMoney(tx.net, tx.currency)}</td>
										<td className="px-6 py-4"><StatusPill status={tx.status} styles={TRANSACTION_STATUS_STYLES} /></td>
										<td className="whitespace-nowrap px-6 py-4 text-slate-600">{formatDate(tx.createdAt)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className="p-12 text-center text-sm text-slate-500">No transactions yet.</div>
				)}
			</div>
		</div>
	);
}
