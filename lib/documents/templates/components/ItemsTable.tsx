import { Text, View } from "@react-pdf/renderer";
import type { CurrencyCode, OrderItem } from "../../types";
import { sharedStyles } from "../../styles/stylesheet";
import { formatMoney } from "../../utils/currency";

export type ItemsTableColumn = "sku" | "description" | "quantity" | "unitPrice" | "lineTotal" | "hsCode" | "countryOfOrigin" | "weight";

interface ColumnDef {
	header: string;
	width: number;
	align?: "left" | "right" | "center";
	render: (item: OrderItem, currency: CurrencyCode) => string;
}

const COLUMN_DEFS: Record<ItemsTableColumn, ColumnDef> = {
	sku: { header: "SKU", width: 1.1, render: (item) => item.sku },
	description: {
		header: "Item",
		width: 3,
		render: (item) => [item.productName, item.variantName].filter(Boolean).join(" — ") + (item.addonNames.length ? `\n+ ${item.addonNames.join(", ")}` : ""),
	},
	quantity: { header: "Qty", width: 0.7, align: "center", render: (item) => String(item.quantity) },
	unitPrice: { header: "Unit price", width: 1.2, align: "right", render: (item, currency) => formatMoney(item.unitPrice, currency) },
	lineTotal: { header: "Total", width: 1.2, align: "right", render: (item, currency) => formatMoney(item.lineTotal, currency) },
	hsCode: { header: "HS code", width: 1, render: (item) => item.hsCode ?? "—" },
	countryOfOrigin: { header: "Origin", width: 0.8, render: (item) => item.countryOfOrigin ?? "—" },
	weight: { header: "Weight", width: 1, align: "right", render: (item) => (item.weightInGrams ? `${(item.weightInGrams / 1000).toFixed(2)} kg` : "—") },
};

const DEFAULT_COLUMNS: ItemsTableColumn[] = ["description", "quantity", "unitPrice", "lineTotal"];

interface ItemsTableProps {
	items: OrderItem[];
	currency: CurrencyCode;
	columns?: ItemsTableColumn[];
}

export function ItemsTable({ items, currency, columns = DEFAULT_COLUMNS }: ItemsTableProps) {
	const defs = columns.map((key) => ({ key, ...COLUMN_DEFS[key] }));

	return (
		<View style={sharedStyles.table} wrap={false}>
			<View style={sharedStyles.tableHeaderRow}>
				{defs.map((col) => (
					<Text key={col.key} style={[sharedStyles.tableHeaderCell, { flex: col.width, textAlign: col.align ?? "left" }]}>
						{col.header}
					</Text>
				))}
			</View>
			{items.map((item, index) => (
				<View key={`${item.sku}-${index}`} style={index % 2 === 1 ? [sharedStyles.tableRow, sharedStyles.tableRowAlt] : sharedStyles.tableRow} wrap={false}>
					{defs.map((col) => (
						<Text key={col.key} style={[sharedStyles.tableCell, { flex: col.width, textAlign: col.align ?? "left" }]}>
							{col.render(item, currency)}
						</Text>
					))}
				</View>
			))}
		</View>
	);
}
