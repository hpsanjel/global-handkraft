import { Text, View } from "@react-pdf/renderer";
import type { CurrencyCode, Tax } from "../../types";
import { sharedStyles } from "../../styles/stylesheet";
import { spacing } from "../../styles/theme";
import { formatMoney } from "../../utils/currency";

interface TaxSummaryProps {
	taxes: Tax[];
	currency: CurrencyCode;
}

export function TaxSummary({ taxes, currency }: TaxSummaryProps) {
	if (taxes.length === 0) return null;

	return (
		<View style={sharedStyles.sectionSpacing}>
			<Text style={sharedStyles.h3}>Tax breakdown</Text>
			{taxes.map((tax) => (
				<View key={tax.label} style={[sharedStyles.row, { marginTop: spacing.xs }]}>
					<Text style={sharedStyles.muted}>
						{tax.label} ({(tax.rate * 100).toFixed(1)}%)
					</Text>
					<Text style={sharedStyles.value}>{formatMoney(tax.amount, currency)}</Text>
				</View>
			))}
		</View>
	);
}
