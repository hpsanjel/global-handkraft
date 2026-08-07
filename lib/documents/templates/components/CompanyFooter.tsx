import { Text, View } from "@react-pdf/renderer";
import type { Seller } from "../../types";
import { sharedStyles } from "../../styles/stylesheet";

interface CompanyFooterProps {
	seller: Seller;
}

export function CompanyFooter({ seller }: CompanyFooterProps) {
	return (
		<View style={sharedStyles.footer} fixed>
			<Text>
				{seller.tradingName} · Org.nr {seller.organisationNumber} · {seller.address.country}
			</Text>
			<Text>
				{seller.supportEmail} · {seller.website}
			</Text>
		</View>
	);
}
