import { Image, View } from "@react-pdf/renderer";
import { generateBarcodePng } from "../../utils/barcode";

interface BarcodeBlockProps {
	value: string;
	width?: number;
	height?: number;
}

export function BarcodeBlock({ value, width = 160, height = 40 }: BarcodeBlockProps) {
	return (
		<View style={{ width, height }}>
			<Image src={() => generateBarcodePng(value, { height: 12, scale: 3 })} style={{ width, height }} />
		</View>
	);
}
