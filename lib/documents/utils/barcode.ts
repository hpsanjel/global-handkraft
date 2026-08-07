import bwipjs from "bwip-js/node";

export interface BarcodeOptions {
	height?: number;
	scale?: number;
	includeText?: boolean;
}

/** Renders a Code128 barcode as a PNG buffer, ready to pass straight to react-pdf's <Image src={buffer}>. */
export async function generateBarcodePng(value: string, options: BarcodeOptions = {}): Promise<Buffer> {
	return bwipjs.toBuffer({
		bcid: "code128",
		text: value,
		scale: options.scale ?? 3,
		height: options.height ?? 10,
		includetext: options.includeText ?? true,
		textxalign: "center",
	});
}
