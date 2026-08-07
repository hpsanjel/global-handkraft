import { Image, Text, View } from "@react-pdf/renderer";
import { sharedStyles } from "../../styles/stylesheet";
import { spacing } from "../../styles/theme";
import { generateQrCodePng } from "../../utils/qr";

interface QRCodeBlockProps {
	value: string;
	caption?: string;
	size?: number;
}

export function QRCodeBlock({ value, caption, size = 72 }: QRCodeBlockProps) {
	return (
		<View style={{ alignItems: "center", width: size }}>
			<Image src={() => generateQrCodePng(value)} style={{ width: size, height: size }} />
			{caption ? (
				<Text style={[sharedStyles.muted, { marginTop: spacing.xs, textAlign: "center" }]} wrap={false}>
					{caption}
				</Text>
			) : null}
		</View>
	);
}
