import { Text, View } from "@react-pdf/renderer";
import type { Payment } from "../../types";
import { sharedStyles } from "../../styles/stylesheet";
import { spacing } from "../../styles/theme";

interface PaymentInfoProps {
	payment: Payment;
}

function formatDate(date: Date): string {
	return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function PaymentInfo({ payment }: PaymentInfoProps) {
	return (
		<View style={sharedStyles.sectionSpacing}>
			<Text style={sharedStyles.h3}>Payment</Text>
			<View style={[sharedStyles.row, { marginTop: spacing.xs }]}>
				<Text style={sharedStyles.muted}>Method</Text>
				<Text style={sharedStyles.value}>{payment.method ?? "Card"}</Text>
			</View>
			<View style={sharedStyles.row}>
				<Text style={sharedStyles.muted}>Status</Text>
				<Text style={sharedStyles.value}>{payment.status}</Text>
			</View>
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
