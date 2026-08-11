import { Text, View } from "@react-pdf/renderer";
import type { CurrencyCode, Payment } from "../../types";
import { sharedStyles } from "../../styles/stylesheet";
import { spacing } from "../../styles/theme";
import { formatMoney } from "../../utils/currency";

interface PaymentInfoProps {
	payment: Payment;
	/** Required to render "Paid so far" / "Balance due" for a PARTIALLY_PAID payment; omit and those lines are skipped. */
	currency?: CurrencyCode;
}

function formatDate(date: Date): string {
	return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

const STATUS_LABELS: Record<string, string> = {
	PARTIALLY_PAID: "Deposit received — balance due",
};

export function PaymentInfo({ payment, currency }: PaymentInfoProps) {
	return (
		<View style={sharedStyles.sectionSpacing}>
			<Text style={sharedStyles.h3}>Payment</Text>
			<View style={[sharedStyles.row, { marginTop: spacing.xs }]}>
				<Text style={sharedStyles.muted}>Method</Text>
				<Text style={sharedStyles.value}>{payment.method ?? "Card"}</Text>
			</View>
			<View style={sharedStyles.row}>
				<Text style={sharedStyles.muted}>Status</Text>
				<Text style={sharedStyles.value}>{STATUS_LABELS[payment.status] ?? payment.status}</Text>
			</View>
			{payment.status === "PARTIALLY_PAID" && currency && payment.amountPaid !== undefined ? (
				<View style={sharedStyles.row}>
					<Text style={sharedStyles.muted}>Paid so far</Text>
					<Text style={sharedStyles.value}>
						{formatMoney(payment.amountPaid, currency)} / {formatMoney(payment.amount, currency)}
					</Text>
				</View>
			) : null}
			{payment.status === "PARTIALLY_PAID" && currency && payment.balanceDue !== undefined ? (
				<View style={sharedStyles.row}>
					<Text style={sharedStyles.muted}>Balance due</Text>
					<Text style={[sharedStyles.value, sharedStyles.bold]}>{formatMoney(payment.balanceDue, currency)}</Text>
				</View>
			) : null}
			{payment.paidAt ? (
				<View style={sharedStyles.row}>
					<Text style={sharedStyles.muted}>Paid on</Text>
					<Text style={sharedStyles.value}>{formatDate(payment.paidAt)}</Text>
				</View>
			) : null}
			{payment.paymentIntentId ? (
				<View style={sharedStyles.row}>
					<Text style={sharedStyles.muted}>Payment reference</Text>
					<Text style={sharedStyles.value}>{payment.paymentIntentId}</Text>
				</View>
			) : null}
		</View>
	);
}
