export type MandapInquiryTransactionRow = {
	id: string;
	kind: string;
	amount: number;
	status: string;
	createdAt: string;
	paidAt: string | null;
};

type Props = {
	transactions: MandapInquiryTransactionRow[];
};

function formatDate(value: string) {
	return new Date(value).toLocaleString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

function kindLabel(kind: string) {
	return kind === "DEPOSIT" ? "Deposit" : "Balance payment";
}

function statusBadge(status: string) {
	switch (status) {
		case "PAID":
			return <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-blue-700">Paid</span>;
		case "PENDING":
			return <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-yellow-700">Pending</span>;
		case "EXPIRED":
			return <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-slate-600">Expired</span>;
		default:
			return <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-slate-600">{status}</span>;
	}
}

export function MandapInquiryTransactions({ transactions }: Props) {
	if (transactions.length === 0) {
		return null;
	}

	return (
		<div className="mt-4">
			<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Transaction history</p>
			<div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
				<table className="w-full min-w-[420px] text-left text-sm">
					<thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
						<tr>
							<th className="px-3 py-2 font-medium">Type</th>
							<th className="px-3 py-2 font-medium">Amount</th>
							<th className="px-3 py-2 font-medium">Status</th>
							<th className="px-3 py-2 font-medium">Date</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100 bg-white">
						{transactions.map((transaction) => (
							<tr key={transaction.id}>
								<td className="px-3 py-2 text-slate-700">{kindLabel(transaction.kind)}</td>
								<td className="px-3 py-2 text-slate-700">NOK {transaction.amount.toFixed(2)}</td>
								<td className="px-3 py-2">{statusBadge(transaction.status)}</td>
								<td className="px-3 py-2 text-slate-500">{formatDate(transaction.paidAt ?? transaction.createdAt)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
