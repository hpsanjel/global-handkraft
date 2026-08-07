import QRCode from "qrcode";
import { colors } from "../styles/theme";

/** Renders a QR code as a PNG buffer, ready to pass straight to react-pdf's <Image src={buffer}>. */
export async function generateQrCodePng(content: string): Promise<Buffer> {
	return QRCode.toBuffer(content, {
		type: "png",
		errorCorrectionLevel: "M",
		margin: 1,
		scale: 6,
		color: {
			dark: colors.darkNavy,
			light: "#FFFFFF",
		},
	});
}
