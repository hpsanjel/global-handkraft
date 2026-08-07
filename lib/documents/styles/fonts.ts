import path from "node:path";
import { Font } from "@react-pdf/renderer";
import { fonts } from "./theme";

const FONTS_DIR = path.join(process.cwd(), "lib", "documents", "assets", "fonts");

function fontPath(fileName: string): string {
	return path.join(FONTS_DIR, fileName);
}

let registered = false;

/** Registers the document module's embedded fonts with react-pdf. Idempotent and safe to call on every generation. */
export function registerDocumentFonts(): void {
	if (registered) return;

	Font.register({
		family: fonts.body,
		fonts: [
			{ src: fontPath("inter-400.ttf"), fontWeight: 400 },
			{ src: fontPath("inter-700.ttf"), fontWeight: 700 },
		],
	});

	Font.register({
		family: fonts.heading,
		fonts: [
			{ src: fontPath("playfair-display-400.ttf"), fontWeight: 400 },
			{ src: fontPath("playfair-display-700.ttf"), fontWeight: 700 },
		],
	});

	// react-pdf's default word-hyphenation breaks brand/SKU tokens; disable it globally.
	Font.registerHyphenationCallback((word) => [word]);

	registered = true;
}
