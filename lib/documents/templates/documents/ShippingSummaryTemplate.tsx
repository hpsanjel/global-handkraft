import { Document, Text, View } from "@react-pdf/renderer";
import type { OrderDocumentData } from "../../types";
import { sharedStyles } from "../../styles/stylesheet";
import { spacing } from "../../styles/theme";
import { DocumentPage, CompanyHeader, CompanyFooter, AddressBlock, OrderMetaBlock, BarcodeBlock } from "../components";

interface ShippingSummaryTemplateProps {
	data: OrderDocumentData;
}

export function ShippingSummaryTemplate({ data }: ShippingSummaryTemplateProps) {
	const { business, order, shipping } = data;
	const shipment = shipping.shipment;

	return (
		<Document title={`${data.metadata.documentNumber} — Shipping Summary`} author={business.seller.legalName}>
			<DocumentPage footer={<CompanyFooter seller={business.seller} />}>
				<CompanyHeader seller={business.seller} documentTitle="Shipping Summary" documentNumber={data.metadata.documentNumber} issuedAt={data.metadata.issuedAt} />

				<OrderMetaBlock
					order={order}
					extraFields={[
						{ label: "Carrier", value: shipment?.carrier ?? "—" },
						{ label: "Service", value: shipment?.serviceName ?? shipping.method ?? "—" },
						{ label: "Estimated delivery", value: shipping.estimatedDelivery ?? "—" },
					]}
				/>

				<View style={sharedStyles.sectionSpacing}>
					<AddressBlock title="Deliver to" name={shipping.address.fullName} address={shipping.address} phone={shipping.address.phone} />
				</View>

				{shipment?.trackingNumber ? (
					<View style={[sharedStyles.sectionSpacing, { alignItems: "flex-start" }]}>
						<Text style={sharedStyles.h3}>Tracking</Text>
						<Text style={[sharedStyles.value, { marginTop: spacing.xs }]}>{shipment.trackingNumber}</Text>
						{shipment.trackingUrl ? <Text style={sharedStyles.muted}>{shipment.trackingUrl}</Text> : null}
						<View style={{ marginTop: spacing.sm }}>
							<BarcodeBlock value={shipment.trackingNumber} />
						</View>
					</View>
				) : null}

				{shipment && shipment.packages.length > 0 ? (
					<View style={sharedStyles.sectionSpacing}>
						<Text style={sharedStyles.h3}>Packages ({shipment.packages.length})</Text>
						{shipment.packages.map((pkg) => (
							<View key={pkg.packageNumber} style={[sharedStyles.row, { marginTop: spacing.xs }]}>
								<Text style={sharedStyles.muted}>Package {pkg.packageNumber}</Text>
								<Text style={sharedStyles.value}>{(pkg.weightInGrams / 1000).toFixed(2)} kg</Text>
							</View>
						))}
					</View>
				) : null}
			</DocumentPage>
		</Document>
	);
}
