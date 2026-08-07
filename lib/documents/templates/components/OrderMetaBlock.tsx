import { Text, View } from "@react-pdf/renderer";
import type { Order } from "../../types";
import { sharedStyles } from "../../styles/stylesheet";

interface OrderMetaBlockProps {
	order: Order;
	extraFields?: Array<{ label: string; value: string }>;
}

function formatDate(date: Date): string {
	return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function OrderMetaBlock({ order, extraFields = [] }: OrderMetaBlockProps) {
	const fields = [
		{ label: "Order number", value: order.orderNumber },
		{ label: "Order date", value: formatDate(order.placedAt) },
		{ label: "Status", value: order.status },
		{ label: "Currency", value: order.currency },
		...extraFields,
	];

	return (
		<View style={[sharedStyles.row, sharedStyles.sectionSpacing, { flexWrap: "wrap" }]}>
			{fields.map((field) => (
				<View key={field.label} style={{ marginBottom: 4 }}>
					<Text style={sharedStyles.label}>{field.label}</Text>
					<Text style={sharedStyles.value}>{field.value}</Text>
				</View>
			))}
		</View>
	);
}
