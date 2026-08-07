export const colors = {
	primaryGreen: "#4CAF50",
	primaryOrange: "#F7931E",
	darkNavy: "#1B365D",
	lightBackground: "#FAFAF7",
	accentGold: "#D4AF37",
	white: "#FFFFFF",
	neutral: {
		50: "#FAFAF9",
		100: "#F5F5F4",
		200: "#E7E5E4",
		300: "#D6D3D1",
		400: "#A8A29E",
		500: "#78716C",
		600: "#57534E",
		700: "#44403C",
		800: "#292524",
		900: "#1C1917",
	},
	danger: "#B91C1C",
} as const;

export const fonts = {
	heading: "Playfair Display",
	body: "Inter",
} as const;

export const fontSize = {
	h1: 20,
	h2: 15,
	h3: 12,
	body: 9.5,
	small: 8,
	tiny: 7,
} as const;

export const spacing = {
	xs: 4,
	sm: 8,
	md: 12,
	lg: 20,
	xl: 32,
} as const;

export const page = {
	widthA4: 595.28,
	heightA4: 841.89,
	marginPt: 36,
} as const;
