import { Document, Text, View } from "@react-pdf/renderer";
import type { OrderDocumentData } from "../../types";
import { sharedStyles } from "../../styles/stylesheet";
import { spacing } from "../../styles/theme";
import { DocumentPage, CompanyHeader, CompanyFooter, OrderMetaBlock, ItemsTable, NotesSection, SignatureBlock, PageNumber } from "../components";

interface PackingListTemplateProps {
	data: OrderDocumentData;
}

export function PackingListTemplate({ data }: PackingListTemplateProps) {
	const { business, order, shipping } = data;
	const shipment = shipping.shipment;

	return (
		<Document title={`${data.metadata.documentNumber} — Packing List`} author={business.seller.legalName}>
			<DocumentPage footer={<><CompanyFooter seller={business.seller} /><PageNumber /></>}>
				<CompanyHeader seller={business.seller} documentTitle="Packing List" documentNumber={data.metadata.documentNumber} issuedAt={data.metadata.issuedAt} />

				<OrderMetaBlock
					order={order}
					extraFields={[
						{ label: "Shipment number", value: shipment?.shipmentNumber ?? "—" },
						{ label: "Packages", value: String(shipment?.packages.length ?? 0) },
						{ label: "Total weight", value: shipment ? `${(shipment.totalWeightInGrams / 1000).toFixed(2)} kg` : "—" },
					]}
				/>

				{shipment && shipment.packages.length > 0 ? (
					<View style={sharedStyles.sectionSpacing}>
						<Text style={sharedStyles.h3}>Packages</Text>
						<View style={sharedStyles.table}>
							<View style={sharedStyles.tableHeaderRow}>
								<Text style={[sharedStyles.tableHeaderCell, { flex: 0.6 }]}>#</Text>
								<Text style={[sharedStyles.tableHeaderCell, { flex: 1.4 }]}>Contents</Text>
								<Text style={[sharedStyles.tableHeaderCell, { flex: 1 }]}>Dimensions (cm)</Text>
								<Text style={[sharedStyles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Weight</Text>
							</View>
							{shipment.packages.map((pkg, index) => (
								<View key={pkg.packageNumber} style={index % 2 === 1 ? [sharedStyles.tableRow, sharedStyles.tableRowAlt] : sharedStyles.tableRow}>
									<Text style={[sharedStyles.tableCell, { flex: 0.6 }]}>{pkg.packageNumber}</Text>
									<Text style={[sharedStyles.tableCell, { flex: 1.4 }]}>{pkg.contentsSummary ?? "—"}</Text>
									<Text style={[sharedStyles.tableCell, { flex: 1 }]}>{pkg.lengthCm && pkg.widthCm && pkg.heightCm ? `${pkg.lengthCm} x ${pkg.widthCm} x ${pkg.heightCm}` : "—"}</Text>
									<Text style={[sharedStyles.tableCell, { flex: 1, textAlign: "right" }]}>{(pkg.weightInGrams / 1000).toFixed(2)} kg</Text>
								</View>
							))}
						</View>
					</View>
				) : null}

				<View style={{ marginTop: spacing.lg }}>
					<Text style={sharedStyles.h3}>Item manifest</Text>
					<ItemsTable items={order.items} currency={order.currency} columns={["sku", "description", "quantity", "weight"]} />
				</View>

				<NotesSection title="Handling notes" notes={["Handle with care — contains handcrafted wooden items.", "Keep upright and dry during transit."]} />
				<NotesSection title="Inspection notes" notes={["Inspected and packed by warehouse staff prior to dispatch."]} />

				<SignatureBlock label="Packed by / warehouse signature" />
			</DocumentPage>
		</Document>
	);
}
