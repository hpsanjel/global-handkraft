import { Text, View } from "@react-pdf/renderer";
import type { CurrencyCode } from "../../types";
import { sharedStyles } from "../../styles/stylesheet";
import { colors, spacing } from "../../styles/theme";
import { formatMoney } from "../../utils/currency";

interface PriceSummaryProps {
	currency: CurrencyCode;
	subtotal: number;
	shippingCost: number;
	discountTotal: number;
	vatTotal: number;
	grandTotal: number;
}

function Line({ label, value, emphasize = false }: { label: string; value: string; emphasize?: boolean }) {
	return (
		<View style={[sharedStyles.row, { marginTop: 3 }]}>
			<Text style={emphasize ? [sharedStyles.value, sharedStyles.bold] : sharedStyles.muted}>{label}</Text>
			<Text style={emphasize ? [sharedStyles.value, sharedStyles.bold] : sharedStyles.value}>{value}</Text>
		</View>
	);
}

export function PriceSummary({ currency, subtotal, shippingCost, discountTotal, vatTotal, grandTotal }: PriceSummaryProps) {
	return (
		<View style={{ width: 220, marginLeft: "auto", marginTop: spacing.md }}>
			<Line label="Subtotal" value={formatMoney(subtotal, currency)} />
			{discountTotal > 0 ? <Line label="Discount" value={`− ${formatMoney(discountTotal, currency)}`} /> : null}
			<Line label="Shipping" value={formatMoney(shippingCost, currency)} />
			{vatTotal > 0 ? <Line label="VAT" value={formatMoney(vatTotal, currency)} /> : null}
			<View style={{ borderTopWidth: 1, borderTopColor: colors.neutral[300], marginTop: spacing.xs, paddingTop: spacing.xs }}>
				<Line label="Grand total" value={formatMoney(grandTotal, currency)} emphasize />
			</View>
		</View>
	);
}
