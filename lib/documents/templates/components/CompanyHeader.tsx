import { Image, Text, View } from "@react-pdf/renderer";
import type { Seller } from "../../types";
import { sharedStyles } from "../../styles/stylesheet";
import { colors, spacing } from "../../styles/theme";

interface CompanyHeaderProps {
	seller: Seller;
	documentTitle: string;
	documentNumber: string;
	issuedAt: Date;
}

function formatDate(date: Date): string {
	return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function CompanyHeader({ seller, documentTitle, documentNumber, issuedAt }: CompanyHeaderProps) {
	return (
		<View style={[sharedStyles.row, { alignItems: "flex-start" }]}>
			<View style={{ maxWidth: 260 }}>
				{seller.logoUrl ? (
					<Image src={seller.logoUrl} style={{ width: 120, marginBottom: spacing.xs }} />
				) : (
					<Text style={[sharedStyles.h1, { marginBottom: spacing.xs }]}>{seller.tradingName}</Text>
				)}
				<Text style={sharedStyles.muted}>{seller.legalName}</Text>
				<Text style={sharedStyles.muted}>Org.nr {seller.organisationNumber}</Text>
				{seller.vatNumber ? <Text style={sharedStyles.muted}>VAT {seller.vatNumber}</Text> : null}
				<Text style={sharedStyles.muted}>{seller.website}</Text>
			</View>

			<View style={{ alignItems: "flex-end" }}>
				<Text style={[sharedStyles.h2, { color: colors.darkNavy }]}>{documentTitle}</Text>
				<Text style={[sharedStyles.value, { marginTop: spacing.xs }]}>{documentNumber}</Text>
				<Text style={sharedStyles.muted}>{formatDate(issuedAt)}</Text>
			</View>
		</View>
	);
}
